/* eslint-disable no-console */

/**
 * Utilities for graceful shutdown in script context
 * Simplified version for script usage
 */

/**
 * Custom error for script termination
 */
class ScriptTerminationError extends Error {
    constructor(message, exitCode = 1) {
        super(message);
        this.name = 'ScriptTerminationError';
        this.exitCode = exitCode;
    }
}

/**
 * Handles graceful script shutdown
 *
 * @param {Error|string} error - The error that triggered the shutdown
 * @param {Object} options - Shutdown options
 * @param {boolean} options.exitProcess - Whether to exit the process after cleanup (default: true)
 * @param {number} options.exitCode - Exit code to use when exiting (default: 1)
 * @param {function} options.cleanup - Optional function to run before shutdown
 * @throws {ScriptTerminationError} When the script should terminate
 * @returns {Promise<void>} - Resolves when shutdown is complete
 */
async function scriptShutdown(error, options = {}) {
    const {
        exitProcess = true,
        exitCode = 1,
        cleanup = null
    } = options;

    try {
        // Log the error that triggered the shutdown
        if (error instanceof Error)
        {console.error('Script shutdown triggered by error:', error);}
        else if (error)
        {console.error(`Script shutdown triggered: ${error}`);}

        // Run cleanup function if provided
        if (typeof cleanup === 'function') {
            console.info('Running cleanup tasks before shutdown...');
            await cleanup();
        }

        // Set the exit code that Node will use when the process exits naturally
        if (exitProcess) {
            console.info(`Setting exit code to ${exitCode}`);
            process.exitCode = exitCode;

            // Use a slight delay to allow log messages to be written
            const delay = 100;
            await new Promise(resolve => {return setTimeout(resolve, delay);});

            // Throw a termination error
            throw new ScriptTerminationError(`Script terminated with exit code ${exitCode}`, exitCode);
        }
    } catch (cleanupError) {
        // If this is already our termination error, just re-throw it
        if (cleanupError instanceof ScriptTerminationError)
        {throw cleanupError;}

        console.error('Error during shutdown cleanup:', cleanupError);
        if (exitProcess) {
            process.exitCode = 1;
            throw new ScriptTerminationError('Failed to clean up during shutdown', 1);
        }
    }
}

module.exports = {
    scriptShutdown,
    ScriptTerminationError
};

