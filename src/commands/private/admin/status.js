/**
 * Command: Status
 * Category: private/admin
 * Description: Admin command to check bot status and information
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, safeReply, createEphemeralReplyOptions } = require('../../../utils/messageUtils');
const { version } = require('../../../../package.json');
const os = require('os');
const { MEMORY, BASE } = require('../../../utils/constants');

// Destructure base time units for uptime calculation
const { SECONDS_PER_MINUTE, MINUTES_PER_HOUR, HOURS_PER_DAY } = BASE;

// Time conversion constants for uptime formatting in seconds
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays detailed bot status information (Admin only)'),

    // Set command permissions - Admin only
    requiredPermissions: [PermissionFlagsBits.Administrator],

    // Bot permissions needed to execute this command
    botRequiredPermissions: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ViewChannel
    ],

    /**
     * Calculate total user count across all guilds
     * @param {Collection} guilds - Collection of guilds
     * @returns {number} - Total user count
     */
    calculateTotalUsers(guilds) {
        return guilds.cache.reduce(
            (acc, guild) => {
                return acc + (guild.memberCount || 0);
            }, 0
        );
    },

    /**
     * Command execution handler
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>} Promise representing the command execution
     */
    async execute(interaction) {
        try {
            const { client } = interaction;

            // Calculate uptime
            const uptime = formatUptime(process.uptime());

            // Get system information
            const memUsage = process.memoryUsage();
            const serverCount = client.guilds.cache.size;
            const channelCount = client.channels.cache.size;
            const userCount = this.calculateTotalUsers(client.guilds);

            // Create status embed using messageUtils
            const statusEmbed = createSuccessEmbed(
                'Bot Status Information',
                'Current operational statistics for the bot',
                {
                    footerText: 'Discord Bot Template'
                }
            );

            // Add fields with system information
            statusEmbed.addFields(
                { name: '🤖 Bot Version', value: version, inline: true },
                { name: '⚙️ Discord.js Version', value: require('discord.js').version, inline: true },
                { name: '📡 Node.js Version', value: process.version, inline: true },
                { name: '⏱️ Uptime', value: uptime, inline: true },
                { name: '🖥️ Platform', value: `${os.type()} ${os.release()}`, inline: true },
                { name: '💾 Memory Usage', value: `${Math.round(memUsage.rss / MEMORY.BYTES_PER_MB)} MB`, inline: true },
                { name: '🌐 Servers', value: serverCount.toString(), inline: true },
                { name: '📺 Channels', value: channelCount.toString(), inline: true },
                { name: '👥 Users', value: userCount.toString(), inline: true },
                { name: '📊 Connection Status', value: `Ping: ${Math.round(client.ws.ping)}ms`, inline: true }
            );

            return safeReply(interaction, { embeds: [statusEmbed] }); } catch (error) {
            return safeReply(interaction, createEphemeralReplyOptions({
                embeds: [createErrorEmbed('Status Error', 'Failed to retrieve bot status information.')]
            }));
        }
    }
};

/**
 * Formats seconds into a readable uptime string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / SECONDS_PER_DAY);
    seconds %= SECONDS_PER_DAY;
    const hours = Math.floor(seconds / SECONDS_PER_HOUR);
    seconds %= SECONDS_PER_HOUR;
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const secs = Math.floor(seconds % SECONDS_PER_MINUTE);

    const parts = [];
    if (days > 0) {parts.push(`${days}d`);}
    if (hours > 0) {parts.push(`${hours}h`);}
    if (minutes > 0) {parts.push(`${minutes}m`);}
    if (secs > 0 || parts.length === 0) {parts.push(`${secs}s`);}

    return parts.join(' ');
}
