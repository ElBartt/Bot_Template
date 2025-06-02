/**
 * Guild Delete Event Handler
 *
 * This event fires when the bot is removed from a server.
 * It logs the event and can perform cleanup tasks for the guild.
 */

const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../services/database');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        // Log guild leave
        logger.info(`Bot has been removed from guild: ${guild.name} (${guild.id})`);

        try {
            const db = await getDatabase();

            // Skip database operations if database is disabled
            if (!db) {
                logger.debug('Skipping database update - database is disabled');
                return;
            }

            // Get existing guild data
            const existingGuild = await db.findById('guilds', guild.id);

            if (existingGuild) {
                // Mark guild as inactive but don't delete data
                await db.updateById('guilds', guild.id, {
                    active: false,
                    leftAt: new Date().toISOString()
                });

                logger.info(`Marked guild ${guild.id} as inactive in database`);
            }
        } catch (error) {
            logger.error(`Failed to process guild leave for ${guild.id}:`, error);
        }
    }
};
