/**
 * Ready Event Handler
 *
 * This event fires when the bot has successfully connected to Discord
 * and is ready to receive and process events.
 */

const { Events, ActivityType } = require('discord.js');
const { logger } = require('../utils/logger');
const { config } = require('../config');
const { formatTime } = require('../utils/helpers');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const startTime = new Date();

        // Log successful login
        logger.info(`Logged in as ${client.user.tag}!`);
        logger.info(`Serving ${client.guilds.cache.size} servers`);

        // Set bot presence based on configuration
        try {
            const activityTypes = {
                'PLAYING': ActivityType.Playing,
                'STREAMING': ActivityType.Streaming,
                'LISTENING': ActivityType.Listening,
                'WATCHING': ActivityType.Watching,
                'COMPETING': ActivityType.Competing
            };

            const activityType = activityTypes[config.discord.activityType] || ActivityType.Playing;

            await client.user.setPresence({
                activities: [{
                    name: config.discord.activityName,
                    type: activityType
                }],
                status: config.discord.status
            });

            logger.info(`Bot presence set to: ${config.discord.status} | ${config.discord.activityType} ${config.discord.activityName}`);
        } catch (error) {
            logger.error('Failed to set bot presence:', error);
        }

        // Log startup completion time
        const bootTime = Date.now() - startTime;
        logger.info(`Startup completed in ${formatTime(bootTime)}`);

        // Log invite URL if available
        if (config.discord.inviteUrl) {
            logger.info(`Bot invite URL: ${config.discord.inviteUrl}`);
        } else {
            const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${config.discord.clientId}&scope=bot%20applications.commands&permissions=277025705024`;
            logger.info(`Default invite URL: ${inviteUrl}`);
        }
    }
};
