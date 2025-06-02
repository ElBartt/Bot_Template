/**
 * Command: Server Info
 * Category: public/general
 * Description: Displays detailed information about the server with paginated member list
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createPaginatedEmbed, safeReply, createEphemeralReplyOptions } = require('../../../utils/messageUtils');
const { config } = require('../../../config');
const { logger } = require('../../../utils/logger');
const { BASE, TIME, DISCORD, PAGINATION } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-info')
        .setDescription('Displays detailed information about the current server'),

    // Use cooldown from config to maintain consistency
    cooldown: config.app.cooldownDefault,

    // Define required permissions (optional for public commands)
    requiredPermissions: [],

    // Bot permissions needed to execute this command
    botRequiredPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],

    /**
     * Command execution handler
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>} Promise representing the command execution
     */
    async execute(interaction) {
        const { guild } = interaction; if (!guild) {
            return safeReply(interaction, createEphemeralReplyOptions({
                content: 'This command can only be used in a server.'
            }));
        }

        // Send server info embed
        const infoEmbed = this.createServerInfoEmbed(guild);
        await interaction.reply({ embeds: [infoEmbed] });

        // Setup member pagination if members are available
        try {
            await this.setupMemberPagination(interaction, guild);
            return Promise.resolve();
        } catch (error) {
            logger.error('Error creating member pagination:', error);
            return Promise.resolve();
        }
    },

    /**
     * Creates an embed with server information
     * @param {import('discord.js').Guild} guild The guild to get information for
     * @returns {import('discord.js').EmbedBuilder} The created embed
     */
    createServerInfoEmbed(guild) {
        const infoEmbed = createSuccessEmbed(
            guild.name,
            'Server information and statistics',
            {
                thumbnailUrl: guild.iconURL({ dynamic: true }),
                footerText: `Server ID: ${guild.id}`
            }
        );

        // Add server information fields
        infoEmbed.addFields([
            { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Created At', value: `<t:${Math.floor(guild.createdTimestamp / BASE.MILLISECONDS_PER_SECOND)}:R>`, inline: true },
            { name: 'Member Count', value: guild.memberCount.toString(), inline: true },
            { name: 'Boost Tier', value: `Level ${guild.premiumTier}`, inline: true },
            { name: 'Boost Count', value: guild.premiumSubscriptionCount.toString(), inline: true },
            { name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true },
            {
                name: 'Channels',
                value: `🔊 Voice: ${guild.channels.cache.filter((c) => {
                    return c.type === DISCORD.CHANNEL_TYPES.VOICE;
                }).size}\n💬 Text: ${guild.channels.cache.filter((c) => {
                    return c.type === DISCORD.CHANNEL_TYPES.TEXT;
                }).size}`,
                inline: true
            }
        ]);

        return infoEmbed;
    },

    /**
     * Sets up paginated member list
     * @param {import('discord.js').ChatInputCommandInteraction} interaction The interaction that triggered this command
     * @param {import('discord.js').Guild} guild The guild to display members for
     * @returns {Promise<void>} Promise representing the pagination setup
     */
    async setupMemberPagination(interaction, guild) {
        // Get members from cache or a smaller fetch for demo purposes
        const members = Array.from(guild.members.cache.values()).slice(0, PAGINATION.MAX_DISPLAY_ITEMS);

        if (members.length === 0) {
            return Promise.resolve();
        }

        // Create paginated member list
        const pagination = this.createMemberPagination(members, guild.name);

        // Send first page of member list as a follow-up message
        const paginatedMessage = await interaction.followUp(pagination.getPage(0));

        // Setup pagination controls
        await this.setupPaginationCollector(interaction, paginatedMessage, pagination);
        return Promise.resolve();
    },

    /**
     * Creates a paginated embed for member display
     * @param {Array<import('discord.js').GuildMember>} members The members to display
     * @param {string} guildName The name of the guild
     * @returns {Object} Pagination controller object
     */
    createMemberPagination(members, guildName) {
        return createPaginatedEmbed(
            members,
            (member) => {
                return {
                    name: member.user.tag,
                    value: `Joined: <t:${Math.floor(member.joinedTimestamp / BASE.MILLISECONDS_PER_SECOND)}:R>\nRoles: ${member.roles.cache.size - 1}`
                };
            },
            {
                title: `Members of ${guildName}`,
                description: `Showing ${members.length} members`,
                itemsPerPage: PAGINATION.ITEMS_PER_PAGE,
                footerText: 'Member List',
                color: 'BLUE'
            }
        );
    },

    /**
     * Sets up the pagination collector for button interactions
     * @param {import('discord.js').ChatInputCommandInteraction} interaction The original interaction
     * @param {import('discord.js').Message} paginatedMessage The message with pagination buttons
     * @param {Object} pagination The pagination controller object
     * @returns {void}
     */
    setupPaginationCollector(interaction, paginatedMessage, pagination) {
        const filter = (i) => {
            return i.user.id === interaction.user.id &&
                ['first', 'prev', 'next', 'last'].includes(i.customId);
        };

        const collector = paginatedMessage.createMessageComponentCollector({
            filter,
            time: PAGINATION.TIMEOUT_MINUTES * TIME.MINUTE
        });

        let currentPage = 0;

        // Handle pagination button interactions
        collector.on('collect', async (i) => {
            try {
                // Update current page based on button interaction
                switch (i.customId) {
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'prev':
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case 'next':
                        currentPage = Math.min(pagination.pageCount - 1, currentPage + 1);
                        break;
                    case 'last':
                        currentPage = pagination.pageCount - 1;
                        break;
                    default:
                        break;
                }

                // Update message with new page
                await i.update(pagination.getPage(currentPage));
            } catch (error) {
                logger.error('Error handling pagination:', error);
            }
        });

        // Clean up when collector expires
        collector.on('end', () => {
            try {
                paginatedMessage.edit({ components: [] })
                    .catch((e) => {
                        logger.error('Failed to remove buttons:', e);
                    });
            } catch (error) {
                logger.error('Error removing buttons:', error);
            }
        });
    }
};
