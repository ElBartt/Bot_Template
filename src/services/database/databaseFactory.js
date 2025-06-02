/**
 * Database Factory
 *
 * Simple factory for creating database instances based on configuration.
 */

const { logger } = require('../../utils/logger');
const { config } = require('../../config');
const JsonDatabase = require('./jsonDatabase');
const MySqlDatabase = require('./mysqlDatabase');

// Singleton instances
let jsonInstance = null;
let mysqlInstance = null;

/**
 * Get the appropriate database instance based on configuration
 * @returns {Promise<JsonDatabase|MySqlDatabase>} Database instance
 */
async function getDatabase() { // If database is disabled, return null
    if (!config.database.enabled) {
        logger.info('Database is disabled in configuration');
        return null;
    }

    // Use configured database type
    if (config.database.type === 'mysql') {
        return getMysqlDatabase();
    }

    // Default to JSON database
    return getJsonDatabase();
}

/**
 * Get JSON database instance
 * @returns {Promise<JsonDatabase>}
 */
async function getJsonDatabase() {
    if (!jsonInstance) {
        jsonInstance = new JsonDatabase(config.database.jsonPath);
        await jsonInstance.init();
    }
    return jsonInstance;
}

/**
 * Get MySQL database instance
 * @returns {Promise<MySqlDatabase>}
 */
async function getMysqlDatabase() {
    if (!mysqlInstance) {
        mysqlInstance = new MySqlDatabase();
        await mysqlInstance.init();
    }
    return mysqlInstance;
}

/**
 * Close all database connections
 */
async function closeDatabases() {
    if (mysqlInstance) {
        await mysqlInstance.close().catch(err => {
            logger.error('Error closing MySQL database:', err);
        });
    }
}

module.exports = {
    getDatabase,
    closeDatabases
};
