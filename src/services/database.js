/**
 * Database Service
 *
 * This file provides backward compatibility with the original database implementation.
 * It re-exports the functionality from the new database abstraction layer.
 *
 * For new code, consider importing directly from './database/index.js'
 */

const { getDatabase: getDatabaseInstance, closeDatabases } = require('./database/databaseFactory');

/**
 * Get the database instance
 * @returns {Promise<JsonDatabase|MySqlDatabase>} Database instance
 */
async function getDatabase() {
    return getDatabaseInstance();
}

module.exports = {
    getDatabase,
    closeDatabases
};
