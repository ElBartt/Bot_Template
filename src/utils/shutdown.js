/**
 * Utilities for graceful application shutdown
 * Provides methods to shut down the application safely
 */

const { logger } = require('./logger');

/**
 * Custom error for application termination
 */
class ApplicationTerminationError extends Error {
    constructor(message, exitCode = 1) {
        super(message);
        this.name = 'ApplicationTerminationError';
        this.exitCode = exitCode;
    }
}

/**
 * Handles graceful application shutdown
 *
 * @param {Error|string} error - The error that triggered the shutdown
 * @param {Object} options - Shutdown options
 * @param {boolean} options.exitProcess - Whether to exit the process after cleanup (default: true)
 * @param {number} options.exitCode - Exit code to use when exiting (default: 1)
 * @param {function} options.cleanup - Optional function to run before shutdown
 * @throws {ApplicationTerminationError} When the process should exit
 * @returns {Promise<void>} - Resolves when shutdown is complete
 */
async function gracefulShutdown(error, options = {}) {
    const {
        exitProcess = true,
        exitCode = 1,
        cleanup = null
    } = options;

    try {
        // Log the shutdown event
        if (error instanceof Error) {
            logger.error('Application shutdown triggered by error:', error);
        } else if (error) {
            logger.error(`Application shutdown triggered: ${error}`);
        }

        // Run cleanup function if provided
        if (typeof cleanup === 'function') {
            logger.info('Running cleanup tasks before shutdown...');
            await cleanup();
        }

        // Set the exit code that Node will use when the process exits naturally
        if (exitProcess) {
            logger.info(`Setting exit code to ${exitCode}`);
            process.exitCode = exitCode;

            // Use a slight delay to allow log messages to be written
            const delay = 100;
            await new Promise(resolve => { return setTimeout(resolve, delay); });

            // Throw a special error that can be caught by a top-level handler
            throw new ApplicationTerminationError(`Application terminated with exit code ${exitCode}`, exitCode);
        }
    } catch (cleanupError) {
        // If this is already our termination error, just re-throw it
        if (cleanupError instanceof ApplicationTerminationError)
        {throw cleanupError;}

        logger.error('Error during shutdown cleanup:', cleanupError);
        if (exitProcess) {
            process.exitCode = 1;
            throw new ApplicationTerminationError('Failed to clean up during shutdown', 1);
        }
    }
}

module.exports = {
    gracefulShutdown,
    ApplicationTerminationError
};

