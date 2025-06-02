/**
 * Command: Ping
 * Category: public/general
 * Description: A simple command to check if the bot is responsive
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, safeReply, createEphemeralReplyOptions } = require('../../../utils/messageUtils');
const { config } = require('../../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with latency and API ping information'),

    // Use cooldown from config to maintain consistency
    cooldown: config.app.cooldownDefault,

    // Define required permissions (optional for public commands)
    requiredPermissions: [],

    // Define required bot permissions to execute this command
    botRequiredPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],

    /**
     * Command execution handler
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            // Initial response using safeReply for better error handling
            const sent = await safeReply(interaction, {
                content: 'Pinging...',
                fetchReply: true
            });

            // Calculate latency
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            const apiLatency = Math.round(interaction.client.ws.ping);

            // Create a formatted embed using messageUtils
            const pingEmbed = createSuccessEmbed(
                '🏓 Pong!',
                `**Bot Latency:** ${latency}ms\n**API Latency:** ${apiLatency}ms\n**Environment:** ${config.environment}`
            );

            // Edit the response with formatted ping information
            await interaction.editReply({
                content: null,
                embeds: [pingEmbed]
            }); } catch (error) {
            // Catch any errors using our utility pattern
            await safeReply(interaction, createEphemeralReplyOptions({
                embeds: [createErrorEmbed('Ping Error', 'Failed to calculate ping information.')]
            }));
        }
    }
};
