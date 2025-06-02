/**
 * Guild Create Event Handler
 *
 * This event fires when the bot joins a new server.
 * It logs information about the server and can perform
 * initialization tasks for the new guild.
 */

const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../services/database');
const { createSuccessEmbed } = require('../utils/messageUtils');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        // Log new guild join
        this.logGuildInfo(guild);

        // Update database with guild info
        await this.updateGuildDatabase(guild);

        // Send welcome message
        await this.sendWelcomeMessage(guild);
    },

    logGuildInfo(guild) {
        logger.info(`Bot has joined a new guild: ${guild.name} (${guild.id})`);
        logger.info(`Guild owner: ${guild.ownerId}`);
        logger.info(`Total guild members: ${guild.memberCount}`);
    },

    async updateGuildDatabase(guild) {
        try {
            const db = await getDatabase();

            // Skip database operations if database is disabled
            if (!db) {
                logger.debug('Skipping database update - database is disabled');
                return;
            }

            // Get existing guild data
            const existingGuild = await db.findById('guilds', guild.id);

            if (!existingGuild) {
                // Add new guild to database
                await db.insert('guilds', {
                    id: guild.id,
                    name: guild.name,
                    joinedAt: new Date().toISOString(),
                    memberCount: guild.memberCount,
                    ownerId: guild.ownerId,
                    active: true
                });
                logger.info(`Added guild ${guild.id} to database`);
            } else {
                // Update existing guild information
                await db.updateById('guilds', guild.id, {
                    name: guild.name,
                    memberCount: guild.memberCount,
                    ownerId: guild.ownerId,
                    active: true,
                    rejoinedAt: new Date().toISOString()
                });
                logger.info(`Updated guild ${guild.id} in database and set to active`);
            }
        } catch (error) {
            logger.error(`Failed to process guild join for ${guild.id}:`, error);
        }
    },

    async sendWelcomeMessage(guild) {
        try {
            const targetChannel = this.findTargetChannel(guild);

            if (targetChannel) {
                const welcomeEmbed = createSuccessEmbed(
                    `👋 Welcome to ${guild.name}!`,
                    'Thank you for adding me to your server! I\'m a Discord bot built with the Discord Bot Template.',
                    {
                        footerText: 'Use /help to see available commands'
                    }
                );

                welcomeEmbed.addFields([
                    {
                        name: 'Getting Started',
                        value: 'Use `/help` to view a list of available commands.'
                    },
                    {
                        name: 'Need Support?',
                        value: 'Contact the bot owner or check the documentation for assistance.'
                    }
                ]);

                await targetChannel.send({ embeds: [welcomeEmbed] });
            }
        } catch (error) {
            logger.error(`Failed to send welcome message to guild ${guild.id}:`, error);
        }
    },

    findTargetChannel(guild) {
        try {
            let targetChannel = guild.systemChannel;

            if (!targetChannel) {
                targetChannel = guild.channels.cache
                    .filter(channel => {
                        return channel.type === 0 &&
                            channel.permissionsFor(guild.members.me).has('SendMessages');
                    })
                    .sort((a, b) => {return a.position - b.position;})
                    .first();
            }

            if (!targetChannel) {
                logger.warn(`Could not find suitable channel in guild ${guild.id} (${guild.name}) to send welcome message`);
            }

            return targetChannel;
        } catch (error) {
            logger.error(`Error finding target channel in guild ${guild.id}:`, error);
            return null;
        }
    }
};
