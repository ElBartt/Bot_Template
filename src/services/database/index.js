/**
 * Database Service Entry Point
 *
 * Provides a unified interface to database operations, abstracting the underlying
 * storage implementation (JSON files or MySQL/MariaDB).
 */

const { getDatabase, closeDatabases } = require('./databaseFactory');

/**
 * Export the main database interface functions
 */
module.exports = {
    getDatabase,
    closeDatabases,
};
