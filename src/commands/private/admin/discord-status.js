/**
 * Discord Status Command
 *
 * A private command that displays the current status of Discord services
 * and recent incidents from the Discord Status API
 */

const { SlashCommandBuilder } = require('discord.js');
const { PERMISSIONS, COLORS, DISCORD } = require('../../../utils/constants');
const { createEmbed } = require('../../../utils/messageUtils');
const { sendPaginatedMessage } = require('../../../utils/paginationUtils');
const { logger } = require('../../../utils/logger');
const DiscordStatusService = require('../../../services/discordStatusService');

// Command specific constants
const DISCORD_STATUS = {
    MAX_INCIDENTS: 10,
    DEFAULT_INCIDENT_LIMIT: 5,
    MAX_UPDATES_DISPLAYED: 3,
    COLLECTOR_TIMEOUT_MS: 300000, // 5 minutes in milliseconds
    TRUNCATE_LENGTH: 20,
    MAX_UPDATE_TEXT_LENGTH: 30
};

module.exports = {
    // Command definition
    data: new SlashCommandBuilder()
        .setName('discord-status')
        .setDescription('Shows Discord service status and recent incidents')
        .addSubcommand(subcommand => {
            return subcommand
                .setName('summary')
                .setDescription('Show current Discord service status summary');
        })
        .addSubcommand(subcommand => {
            return subcommand
                .setName('incidents')
                .setDescription('Show recent Discord incidents')
                .addIntegerOption(option => {
                    return option.setName('limit')
                        .setDescription(`Number of incidents to show (max ${DISCORD_STATUS.MAX_INCIDENTS})`)
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(DISCORD_STATUS.MAX_INCIDENTS);
                });
        }),

    // Command permissions
    permissions: PERMISSIONS.ADMIN,
    category: 'Admin',

    /**
     * Command execution
     * @param {Object} interaction - Discord interaction object
     */
    async execute(interaction) {
        // Defer reply to give time for API calls
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const statusService = new DiscordStatusService();

        try {
            if (subcommand === 'summary') {
                await handleStatusSummary(interaction, statusService);
            } else if (subcommand === 'incidents') {
                await handleIncidents(interaction, statusService);
            }
        } catch (error) {
            logger.error('Error executing discord-status command:', error);

            const errorEmbed = createEmbed({
                title: 'Discord Status Error',
                description: 'Failed to fetch Discord service information. Please try again later.',
                color: COLORS.ERROR
            });

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};

/**
 * Handle the status summary subcommand
 * @param {Object} interaction - Discord interaction
 * @param {DiscordStatusService} statusService - Status service instance
 */
async function handleStatusSummary(interaction, statusService) {
    try {
        // Get current status
        const status = await statusService.getStatus();

        // Create the status embed with appropriate styling
        const embed = createStatusEmbed(status);

        // Add component status fields to the embed
        addComponentStatusFields(embed, status.components);

        // Add status page link
        if (status.page && status.page.url) {
            embed.addFields({
                name: 'Status Page',
                value: `[View detailed status](${status.page.url})`,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        logger.error('Error in handleStatusSummary:', error);
        throw error;
    }
}

/**
 * Create an embed for displaying Discord status
 * @param {Object} status - Discord status data
 * @returns {EmbedBuilder} Configured embed
 */
function createStatusEmbed(status) {
    // Get appropriate status styling
    const { statusColor, statusEmoji } = getStatusStyling(status?.status || 'unknown');

    // Make sure we have valid values
    const description = status?.description || 'Current status of Discord services';
    const updatedAt = status?.page?.updatedAt ?
        `Last updated: ${new Date(status.page.updatedAt).toLocaleString()}` :
        'Status information available';

    // Create status embed
    return createEmbed({
        title: `${statusEmoji} Discord Status`,
        description,
        color: statusColor,
        footerText: updatedAt,
        url: status?.page?.url
    });
}

/**
 * Get appropriate color and emoji for status display
 * @param {string} status - Status indicator
 * @returns {Object} Status styling properties
 */
function getStatusStyling(status) {
    let statusColor;
    let statusEmoji;

    switch (status) {
        case 'none':
            statusColor = COLORS.SUCCESS;
            statusEmoji = '✅';
            break;
        case 'minor':
            statusColor = COLORS.WARNING;
            statusEmoji = '⚠️';
            break;
        case 'major':
        case 'critical':
            statusColor = COLORS.ERROR;
            statusEmoji = '🔴';
            break;
        default:
            statusColor = COLORS.INFO;
            statusEmoji = '❓';
    }

    return { statusColor, statusEmoji };
}

/**
 * Add component status fields to an embed
 * @param {EmbedBuilder} embed - Embed to add fields to
 * @param {Array} components - Service components
 */
function addComponentStatusFields(embed, components) {
    // Safeguard against invalid components array
    if (!components || !Array.isArray(components) || components.length === 0) {
        embed.addFields({
            name: 'Status',
            value: 'No component status information available',
            inline: false
        });
        return;
    }

    // Track number of fields added to avoid exceeding Discord's limit
    let fieldCount = 0;
    const maxFields = DISCORD.EMBED_LIMITS.TOTAL_FIELDS - 1; // Reserve one field for status page link

    for (const component of components) {
        if (fieldCount >= maxFields) {
            break; // Avoid exceeding Discord's field limit
        }

        // Skip invalid components
        if (!component || typeof component.name !== 'string' || !component.name) {
            continue;
        }

        try {
            // Ensure we have a valid status string
            let statusValue = 'unknown';
            if (component.status && typeof component.status === 'string') {
                statusValue = component.status;
            }

            const componentEmoji = getComponentStatusEmoji(statusValue);

            // Make sure name and value are valid strings and within limits
            const name = `${componentEmoji} ${component.name}`.substring(0, DISCORD.EMBED_LIMITS.FIELD_NAME - 1);

            // Format the status text
            const formattedStatus = statusValue.replace(/_/g, ' ');

            // Ensure value is never empty and within limits
            const value = (formattedStatus || 'No status information').substring(0, DISCORD.EMBED_LIMITS.FIELD_VALUE - 1);

            // Add the field
            embed.addFields({
                name,
                value,
                inline: true
            });

            fieldCount++;
        } catch (error) {
            logger.warn(`Failed to add component field: ${error.message}`, { component });
            // Continue to next component on error
        }
    }
}

/**
 * Get appropriate emoji for component status
 * @param {string} status - Component status
 * @returns {string} Status emoji
 */
function getComponentStatusEmoji(status) {
    switch (status) {
        case 'operational':
            return '🟢';
        case 'partial_outage':
        case 'degraded_performance':
            return '🟡';
        case 'major_outage':
            return '🔴';
        default:
            return '⚪';
    }
}

/**
 * Handle the incidents subcommand
 * @param {Object} interaction - Discord interaction
 * @param {DiscordStatusService} statusService - Status service instance
 */
async function handleIncidents(interaction, statusService) {
    // Get limit option or use default
    const limit = interaction.options.getInteger('limit') || DISCORD_STATUS.DEFAULT_INCIDENT_LIMIT;

    try {
        // Get incidents
        const incidents = await statusService.getIncidents(limit);

        // Handle case where no incidents are found
        if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
            const noIncidentsEmbed = createEmbed({
                title: '📊 Discord Incidents',
                description: 'No recent incidents reported.',
                color: COLORS.SUCCESS
            });

            await interaction.editReply({ embeds: [noIncidentsEmbed] });
            return;
        }

        // Create and send paginated embed
        await sendPaginatedIncidents(interaction, incidents);
    } catch (error) {
        logger.error('Error handling incidents:', error);
        throw error;
    }
}

/**
 * Create and send paginated incidents embed
 * @param {Object} interaction - Discord interaction
 * @param {Array} incidents - Incidents data
 */
async function sendPaginatedIncidents(interaction, incidents) {
    // Send paginated incidents using the new utility
    await sendPaginatedMessage(
        interaction,
        incidents,
        formatIncident,
        {
            title: '📊 Discord Incidents',
            description: `Showing recent Discord incidents (${incidents.length} total)`,
            color: COLORS.INFO,
            itemsPerPage: 1,
            footerText: 'Discord Status'
        }
    );
}

/**
 * Format an incident for display in embed
 * @param {Object} incident - Incident data
 * @returns {Object} Field name and value
 */
function formatIncident(incident) {
    if (!incident) {
        return {
            name: 'Incident Information',
            value: 'No incident data available'
        };
    }

    try {
        // Get impact emoji
        const impactEmoji = getImpactEmoji(incident.impact);

        // Make sure we have valid strings
        const name = (incident.name || 'Unknown incident').substring(0, DISCORD.EMBED_LIMITS.FIELD_NAME - 20); // Leave room for emoji and status
        const status = incident.status || 'unknown';
        const formattedName = `${impactEmoji} ${name} (${status})`.substring(0, DISCORD.EMBED_LIMITS.FIELD_NAME);

        // Format the updates
        const updatesText = formatIncidentUpdates(incident.updates);

        // Format the created date
        let createdDate = 'Unknown date';
        if (incident.createdAt) {
            try {
                createdDate = new Date(incident.createdAt).toLocaleString();
            } catch (e) {
                // Keep default value if date parsing fails
            }
        }

        // Ensure URL is valid
        const url = incident.url || 'https://discordstatus.com';

        // Build the value with safe limits
        const impact = `**Impact:** ${incident.impact || 'Unknown'}\n`;
        const created = `**Created:** ${createdDate}\n\n`;
        const updates = `**Updates:**\n${updatesText}\n\n`;
        const link = `[View on Status Page](${url})`; // Combine and ensure within field value limit
        let value = impact + created + updates + link;
        if (value.length > DISCORD.EMBED_LIMITS.FIELD_VALUE) {
            // Truncate the updates section if too long
            const reservedSpace = DISCORD_STATUS.MAX_UPDATE_TEXT_LENGTH;
            const maxUpdatesLength = DISCORD.EMBED_LIMITS.FIELD_VALUE -
                impact.length - created.length - link.length - reservedSpace;

            const truncatedUpdates = `**Updates:**\n${updatesText.substring(0, maxUpdatesLength)}...\n\n`;
            value = impact + created + truncatedUpdates + link;
        }

        return {
            name: formattedName,
            value
        };
    } catch (error) {
        logger.warn('Error formatting incident:', error);
        return {
            name: 'Incident Information',
            value: 'Error formatting incident data'
        };
    }
}

/**
 * Get emoji representing incident impact level
 * @param {string} impact - Incident impact
 * @returns {string} Impact emoji
 */
function getImpactEmoji(impact) {
    switch (impact) {
        case 'critical':
            return '🔴';
        case 'major':
            return '🟠';
        case 'minor':
            return '🟡';
        case 'none':
            return '🟢';
        default:
            return '⚪';
    }
}

/**
 * Format incident updates for display
 * @param {Array} updates - Incident updates
 * @returns {string} Formatted updates text
 */
function formatIncidentUpdates(updates) {
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return '*No updates available*';
    }

    // Get a safe slice of updates to process
    const safeUpdates = updates.slice(0, DISCORD_STATUS.MAX_UPDATES_DISPLAYED)
        .filter(update => {return update && typeof update === 'object';});

    if (safeUpdates.length === 0) {
        return '*No valid updates available*';
    }

    // Format each update safely
    const formattedUpdates = safeUpdates.map(update => {
        try {
            // Format date safely
            let dateStr = 'unknown time';
            if (update.createdAt) {
                try {
                    dateStr = new Date(update.createdAt).toLocaleString();
                } catch (e) {
                    // Keep default if date parsing fails
                }
            }

            // Get status and body text with fallbacks
            const status = update.status || 'update';
            const body = update.body || 'No details provided';

            return `**${status}** (${dateStr}):\n${body}`;
        } catch (e) {
            return '**Update**: Could not format update data';
        }
    }).join('\n\n');

    // Add a message about additional updates if needed
    if (updates.length > DISCORD_STATUS.MAX_UPDATES_DISPLAYED) {
        const extraCount = updates.length - DISCORD_STATUS.MAX_UPDATES_DISPLAYED;
        return `${formattedUpdates}\n\n*${extraCount} more ${extraCount === 1 ? 'update' : 'updates'} not shown*`;
    }

    return formattedUpdates;
}
