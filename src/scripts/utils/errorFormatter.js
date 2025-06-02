/**
 * Error Formatter Utility
 *
 * Provides clean, formatted error output for CLI scripts
 */

const { logger } = require('../../utils/logger');

/**
 * Formats deployment errors with clean, structured output
 *
 * @param {Error} error - The error that occurred
 * @param {Object} options - Options for formatting
 * @param {boolean} options.showStackInDev - Show stack trace in development mode
 * @returns {void}
 */
function formatDeploymentError(error, options = { showStackInDev: true }) {
    const DISCORD_MISSING_ACCESS = 50001;

    // Print a clean, formatted error message
    logger.error('╭───────────────────────────────────────────────╮');
    logger.error('│            COMMAND DEPLOYMENT FAILED          │');
    logger.error('╰───────────────────────────────────────────────╯');

    if (error.code === DISCORD_MISSING_ACCESS) {
        logger.error('REASON: Discord API Missing Access');
        logger.error('DETAILS: The bot lacks permissions to deploy commands to the guild');
        logger.error('');
        logger.error('TROUBLESHOOTING STEPS:');
        logger.error('1. Ensure bot invited with "applications.commands" scope');
        logger.error('2. Verify guild ID is correct in environment config');
        logger.error('3. Check bot token is valid and not revoked');
        logger.error('4. Confirm bot has necessary permissions in the guild');
        logger.error('5. Try re-inviting using OAuth2 URL with proper scopes');
    } else {
        logger.error(`REASON: ${error.message || 'Unknown error'}`);

        if (error.code) {
            logger.error(`ERROR CODE: ${error.code}`);
        }

        // Only show stack trace in development mode if option is enabled
        const isDev = process.env.NODE_ENV === 'development';
        if (options.showStackInDev && isDev && error.stack) {
            logger.debug('Stack trace (development mode only):');
            logger.debug(error.stack);
        }
    }
}

module.exports = {
    formatDeploymentError
};
