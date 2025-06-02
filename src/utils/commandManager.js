/**
 * Command Manager Utility
 *
 * Handles the registration, organization, and initialization of bot commands.
 * Supports both public and private command categories.
 */

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { logger } = require('./logger');
const { client } = require('../client');
const { config } = require('../config');

/**
 * Loads a single command from a file and registers it
 * @param {string} filePath - Path to the command file
 * @param {string} category - Command category (public/private)
 * @param {string} group - Command group name
 * @returns {boolean} - Whether command was successfully loaded
 */
function loadCommand(filePath, category, group) {
    try {
        const command = require(filePath);

        // Validate command structure
        if (!command.data || !command.execute) {
            logger.warn(`Command at ${filePath} is missing required "data" or "execute" properties`);
            return false;
        }

        // Add metadata to command for organization
        command.category = category;
        command.group = group;

        // Add default cooldown from config if not specified
        if (!command.cooldown) {
            command.cooldown = config.app.cooldownDefault;
        }

        // Register command
        client.commands.set(command.data.name, command);
        logger.debug(`Registered command: ${command.data.name} [${category}/${group}]`);
        return true;
    } catch (error) {
        logger.error(`Failed to load command from ${filePath}:`, error);
        return false;
    }
}

/**
 * Initializes and registers all commands from the commands directory
 */
async function initializeCommands() {
    logger.info('Initializing commands...');

    const COMMAND_CATEGORIES = ['public', 'private'];

    // Clear existing commands to prevent duplicates on hot-reload
    client.commands = new Collection();

    try {
        // Loop through each command category (public/private)
        for (const category of COMMAND_CATEGORIES) {
            const categoryPath = path.join(__dirname, '..', 'commands', category);

            // Skip if category directory doesn't exist
            if (!fs.existsSync(categoryPath)) {
                logger.warn(`Command category directory not found: ${categoryPath}`);
                continue;
            }

            // Get all subdirectories in the category (command groups)
            const commandGroups = fs.readdirSync(categoryPath, { withFileTypes: true })
                .filter(dirent => { return dirent.isDirectory(); })
                .map(dirent => { return dirent.name; });

            // Process each command group
            for (const group of commandGroups) {
                const groupPath = path.join(categoryPath, group);

                // Get all command files in the group
                const commandFiles = fs.readdirSync(groupPath)
                    .filter(file => { return file.endsWith('.js'); });

                // Load each command
                for (const file of commandFiles) {
                    const filePath = path.join(groupPath, file);
                    loadCommand(filePath, category, group);
                }
            }
        }

        logger.info(`Successfully loaded ${client.commands.size} commands`);
    } catch (error) {
        logger.error('Failed to initialize commands:', error);
        throw error;
    }
}

module.exports = {
    initializeCommands
};
