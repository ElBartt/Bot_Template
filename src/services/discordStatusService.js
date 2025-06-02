/**
 * Discord Status Service
 *
 * Service to interact with Discord Status API
 * Provides methods to check Discord service status
 */

const ApiService = require('./apiService');
const { logger } = require('../utils/logger');

// Service-specific constants
const DISCORD_STATUS = {
    DEFAULT_INCIDENT_LIMIT: 5,
    DEFAULT_TIMEOUT_MS: 8000
};

class DiscordStatusService extends ApiService {
    /**
     * Create a new Discord Status Service instance
     */
    constructor() {
        super({
            baseURL: 'https://discordstatus.com/api/v2',
            timeout: DISCORD_STATUS.DEFAULT_TIMEOUT_MS,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        this.serviceName = 'DiscordStatus';
        logger.info(`${this.serviceName} service initialized`);
    }

    /**
     * Get current Discord service status
     * @returns {Promise<Object>} Discord status summary
     * @throws {Error} When the request fails or when API is disabled
     */
    async getStatus() {
        // Check if API service is enabled before making requests
        if (!this.enabled) {
            logger.warn('Cannot fetch Discord status: API service is disabled in configuration');
            return this._createFallbackStatusResponse();
        }

        try {
            logger.debug('Fetching Discord service status');
            const response = await this.get('/summary.json', {
                retry: true
            });

            return this._formatStatusResponse(response);
        } catch (error) {
            logger.error('Failed to fetch Discord status', { error: error.message });
            throw new Error('Unable to retrieve Discord service status');
        }
    }

    /**
     * Get recent incidents from Discord Status
     * @param {number} limit - Maximum number of incidents to return
     * @returns {Promise<Array>} Recent incidents
     * @throws {Error} When the request fails
     */
    async getIncidents(limit = DISCORD_STATUS.DEFAULT_INCIDENT_LIMIT) {
        // Check if API service is enabled before making requests
        if (!this.enabled) {
            logger.warn('Cannot fetch Discord incidents: API service is disabled in configuration');
            return [];
        }

        try {
            logger.debug(`Fetching recent Discord incidents (limit: ${limit})`);
            const response = await this.get('/incidents.json', {
                retry: true
            });

            // Format and limit the incidents
            return this._formatIncidentsResponse(response, limit);
        } catch (error) {
            logger.error('Failed to fetch Discord incidents', { error: error.message });
            throw new Error('Unable to retrieve Discord incident information');
        }
    }

    /**
     * Create a fallback status response when API is disabled
     * @private
     * @returns {Object} Fallback status information
     */
    _createFallbackStatusResponse() {
        return {
            status: 'unknown',
            description: 'API service is disabled in configuration',
            page: {
                name: 'Discord Status',
                url: 'https://discordstatus.com',
                updatedAt: new Date().toISOString()
            },
            components: []
        };
    }

    /**
     * Format the status response for easier consumption
     * @private
     * @param {Object} response - Raw API response
     * @returns {Object} Formatted status information
     */
    _formatStatusResponse(response) {
        if (!response || !response.status) {
            return {
                status: 'unknown',
                description: 'Status information unavailable',
                page: {
                    name: 'Discord Status',
                    url: 'https://discordstatus.com',
                    updatedAt: new Date().toISOString()
                },
                components: []
            };
        }

        return {
            status: response.status.indicator, // "none", "minor", "major", "critical"
            description: response.status.description,
            page: {
                name: response.page.name,
                url: response.page.url,
                updatedAt: response.page.updated_at
            },
            components: (response.components || []).map(component => {return {
                name: component.name,
                status: component.status,
                updatedAt: component.updated_at
            };})
        };
    }

    /**
     * Format the incidents response for easier consumption
     * @private
     * @param {Object} response - Raw API response
     * @param {number} limit - Maximum number of incidents to return
     * @returns {Array} Formatted incidents information
     */
    _formatIncidentsResponse(response, limit) {
        if (!response || !response.incidents || !Array.isArray(response.incidents)) {
            return [];
        }

        return response.incidents
            .slice(0, limit)
            .map(incident => {return {
                id: incident.id,
                name: incident.name,
                status: incident.status,
                impact: incident.impact,
                createdAt: incident.created_at,
                updatedAt: incident.updated_at,
                url: incident.shortlink,
                updates: (incident.incident_updates || []).map(update => {return {
                    id: update.id,
                    status: update.status,
                    body: update.body,
                    createdAt: update.created_at,
                    updatedAt: update.updated_at
                };})
            };});
    }
}

module.exports = DiscordStatusService;
