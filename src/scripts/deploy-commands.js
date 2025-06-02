/**
 * Command Deployment Script
 *
 * This script registers slash commands with Discord based on the current environment.
 *
 * Environment-based deployment:
 *   - Production: Deploys public commands globally and private commands to admin guild
 *   - Development: Deploys all commands to the development guild only
 *   - Test: Deploys all commands to the test guild only
 *
 * Configuration is loaded from environment-specific .env files (.env.production, .env.development, .env.test)
 * or falls back to the default .env file.
 */

// Load module aliases
require('module-alias/register');

// Import logger and environment loader early for consistent initialization
const { loadEnvironment } = require('../utils/envLoader');

// Load environment configuration
const { environment, isProduction } = loadEnvironment();

// Import additional dependencies
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { config, validateConfig } = require('../config');
const { scriptShutdown } = require('./utils/scriptShutdown');
const { logger } = require('../utils/logger');
const { formatDeploymentError } = require('./utils/errorFormatter');

// Command storage
const commands = {
    public: [],
    private: []
};

// Validate required environment variables
const missingVars = validateConfig();
if (missingVars.length > 0) {
    logger.error(`Missing environment variables: ${missingVars.join(', ')}`);
    scriptShutdown(`Missing required environment variables: ${missingVars.join(', ')}`);
    return; // This line only executes if scriptShutdown doesn't terminate
}

/**
 * Loads commands from a specific directory
 * @param {string} category - The category name (public/private)
 */
async function loadCommands(category) {
    // Validate category to prevent object injection
    if (!['public', 'private'].includes(category)) {
        logger.error(`Invalid command category: ${category}`);
        return;
    }

    const categoryPath = path.join(__dirname, '..', 'commands', category);

    // Skip if category directory doesn't exist
    if (!fs.existsSync(categoryPath)) {
        logger.warn(`Command category directory not found: ${categoryPath}`);
        return;
    }

    // Get all subdirectories in the category (command groups)
    const commandGroups = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter((dirent) => { return dirent.isDirectory(); })
        .map((dirent) => { return dirent.name; });

    // Process each command group
    for (const group of commandGroups) {
        const groupPath = path.join(categoryPath, group);

        // Get all command files in the group
        const commandFiles = fs.readdirSync(groupPath)
            .filter((file) => { return file.endsWith('.js'); });

        // Load each command
        for (const file of commandFiles) {
            const filePath = path.join(groupPath, file);
            const command = require(filePath);

            // Validate command structure
            if (!command.data || !command.execute) {
                logger.warn(`Command at ${filePath} is missing required "data" or "execute" properties`);
                continue;
            }

            // Add command to appropriate category using safe access pattern
            if (category === 'public')
            {commands.public.push(command.data.toJSON());}
            else if (category === 'private')
            {commands.private.push(command.data.toJSON());}

            logger.info(`Loaded command for deployment: ${command.data.name} [${category}/${group}]`);
        }
    }
}

/**
 * Handles deployment of commands in production environment
 * @param {REST} rest - Discord REST API client
 */
async function handleProductionDeployment(rest) {
    // Deploy public commands globally in production
    if (commands.public.length > 0) {
        logger.info(`[PRODUCTION] Deploying ${commands.public.length} public commands globally...`);

        await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: commands.public }
        );

        logger.info('[PRODUCTION] Successfully deployed public commands globally');
    }

    // Deploy private commands to admin guild in production
    if (commands.private.length > 0 && config.discord.adminGuildId) {
        logger.info(`[PRODUCTION] Deploying ${commands.private.length} private commands to admin guild: ${config.discord.adminGuildId}`);

        await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, config.discord.adminGuildId),
            { body: commands.private }
        );

        logger.info(`[PRODUCTION] Successfully deployed private commands to admin guild: ${config.discord.adminGuildId}`);
    }
}

/**
 * Handles deployment of commands in development/test environment
 * @param {REST} rest - Discord REST API client
 */
async function handleDevDeployment(rest) {
    // Combine public and private commands for development/test deployment
    const allCommands = [...commands.public, ...commands.private];

    if (allCommands.length > 0 && config.discord.adminGuildId) {
        logger.info(`[${environment.toUpperCase()}] Deploying ${allCommands.length} commands to admin guild: ${config.discord.adminGuildId}`);

        await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, config.discord.adminGuildId),
            { body: allCommands }
        );

        logger.info(`[${environment.toUpperCase()}] Successfully deployed all commands to admin guild: ${config.discord.adminGuildId}`);
    } else {
        logger.warn(`[${environment.toUpperCase()}] Missing admin guild ID in environment configuration. Cannot deploy commands.`);
    }
}

/**
 * Handles Discord API errors with detailed troubleshooting information
 * @param {Error} error - The error that occurred
 */
async function handleDeploymentError(error) {
    // Use the clean formatter utility to display errors without clutter
    formatDeploymentError(error);

    // Use the standard scriptShutdown that follows project patterns
    await scriptShutdown('Command deployment failed', { exitCode: 1 });
}

/**
 * Deploys commands to Discord API based on the current environment
 */
async function deployCommands() {
    try {
        // Initialize REST API client
        const rest = new REST({ version: '10' }).setToken(config.discord.token);

        // Load commands from directories
        await loadCommands('public');
        await loadCommands('private');

        logger.info(`Loaded ${commands.public.length} public commands and ${commands.private.length} private commands for deployment`);
        logger.info(`Environment: ${environment} (${isProduction ? 'Production' : 'Development'} mode)`);

        // Deploy commands based on environment
        if (isProduction) {
            await handleProductionDeployment(rest);
        } else {
            await handleDevDeployment(rest);
        }

        logger.info('Command deployment completed successfully');
    } catch (error) {
        await handleDeploymentError(error);
    }
}

// Execute the deployment process
deployCommands();
