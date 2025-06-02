/**
 * Event Handler Index
 *
 * This file loads all event handlers from the events directory
 * and registers them with the Discord client.
 */

const fs = require('fs');
const path = require('path');
const { client } = require('../client');
const { logger } = require('../utils/logger');

// Get all event files from the events directory
const eventFiles = fs.readdirSync(__dirname)
    .filter(file => {return file.endsWith('.js') && file !== 'index.js';});

// Register each event with the client
for (const file of eventFiles)
{try {
    const eventPath = path.join(__dirname, file);
    const event = require(eventPath);

    // Validate event structure
    if (!event.name || !event.execute) {
        logger.warn(`Event at ${eventPath} is missing required "name" or "execute" properties`);
        continue;
    }

    // Register the event with the client
    if (event.once)
    {client.once(event.name, (...args) => {return event.execute(...args);});}
    else
    {client.on(event.name, (...args) => {return event.execute(...args);});}

    logger.debug(`Registered event handler: ${event.name}`);
} catch (error) {
    logger.error(`Failed to load event from ${file}:`, error);
}}

logger.info('Event handlers registered successfully');

module.exports = {};
