/**
 * Discord Client Configuration
 *
 * Sets up and configures the Discord.js client with appropriate intents
 * and partials based on the bot's requirements.
 */

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection
} = require('discord.js');
const { logger } = require('./utils/logger');
const { config } = require('./config');

// Define required intents based on the bot's functionality
const INTENTS = [
    GatewayIntentBits.Guilds,
];

// Define required partials for handling specific Discord structures
const PARTIALS = [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
];

// Create the Discord client with the specified configuration
const client = new Client({
    intents: INTENTS,
    partials: PARTIALS,
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
});

// Initialize collections to store commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();
client.paginators = new Collection(); // Store pagination data

// Store configuration in the client for global access
client.config = config;

// Set up client events for connection and error handling
client.once('ready', () => {
    logger.debug('Client ready event triggered');
});

client.on('error', (error) => {
    logger.error('Discord client error:', error);
});

client.on('warn', (warning) => {
    logger.warn('Discord client warning:', warning);
});

module.exports = { client };
