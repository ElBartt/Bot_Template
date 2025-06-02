/**
 * Discord Bot Template - Main Entry Point
 *
 * This file initializes the Discord bot and establishes the connection to Discord.
 * It loads environment variables, sets up module aliases, and initializes the Discord client.
 */

// DNS configuration to prioritize IPv4 for better compatibility
require('dns').setDefaultResultOrder('ipv4first');

// Load environment configuration
const { loadEnvironment } = require('./utils/envLoader');
loadEnvironment();

// Import core components
const { client } = require('./client');
const { initializeCommands } = require('./utils/commandManager');
const { gracefulShutdown } = require('./utils/shutdown');
const { config, validateConfig } = require('./config');
const { logger } = require('./utils/logger');

/**
 * Main application initialization
 */
async function main() {
    try {
        logger.info('Starting Discord bot...');

        // Validate critical configuration values
        const missingVars = validateConfig();
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        logger.info(`Environment: ${config.environment}`);

        // Initialize commands locally
        await initializeCommands();

        // Register events
        require('./events');

        // Login to Discord
        await client.login(config.discord.token);

        logger.info('Bot successfully started and logged in.');
    } catch (error) {
        logger.error('Failed to start the Discord bot:', error);
        await gracefulShutdown('Bot initialization failed', {
            exitCode: 1,
            cleanup: async () => {
                if (client) {client.destroy();}
            }
        });
    }
}

// Start the bot and handle termination errors at the top level
main().catch(error => {
    if (error.name === 'ApplicationTerminationError') {
        // This is an expected termination, so just wait for the process to exit naturally
        logger.info(`Application is terminating: ${error.message}`);
    } else {
        // This is an unexpected error, log it
        logger.error('Unhandled error in main process:', error);
        process.exitCode = 1;
    }
});

// Handle process termination
process.on('SIGINT', async () => {
    await gracefulShutdown('Received SIGINT signal', {
        exitCode: 0,
        cleanup: async () => {
            logger.info('Bot is shutting down...');
            await client.destroy();
        }
    });
});

process.on('SIGTERM', async () => {
    await gracefulShutdown('Received SIGTERM signal', {
        exitCode: 0,
        cleanup: async () => {
            logger.info('Bot is shutting down...');
            await client.destroy();
        }
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});
