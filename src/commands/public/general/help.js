/**
 * Command: Help
 * Category: public/general
 * Description: Displays help information about available commands
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    createSuccessEmbed,
    createErrorEmbed,
    safeReply,
    createEphemeralReplyOptions
} = require('../../../utils/messageUtils');
const { sendPaginatedMessage } = require('../../../utils/paginationUtils');
const { config } = require('../../../config');
const { formatPermissionList } = require('../../../utils/permissionUtil');
const { logger } = require('../../../utils/logger');
const { PAGINATION } = require('../../../utils/constants');

// Constants
const MAX_AUTOCOMPLETE_RESULTS = 25;

/**
 * Gets a formatted list of permissions from a command permission property
 * @param {Array|*} permissions - Permissions to format
 * @returns {string} Formatted permission list
 */
function getFormattedPermissionList(permissions) {
    if (!permissions || !permissions.length) {
        return 'None';
    }

    // Ensure permissions is an array
    const permList = Array.isArray(permissions) ? permissions : [permissions];

    // Use the formatPermissionList function from permissionUtil
    // This will properly convert both permission names and bit values to readable format
    return formatPermissionList(permList);
}

/**
 * Adds field to embed if the condition is true
 * @param {EmbedBuilder} embed - The embed to add field to
 * @param {string} name - Field name
 * @param {string} value - Field value
 * @param {boolean} condition - Whether to add the field
 */
function addConditionalField(embed, name, value, condition) {
    if (condition) {
        embed.addFields({ name, value });
    }
}

/**
 * Creates an embed with command options information
 * @param {EmbedBuilder} embed - The embed to update
 * @param {Array} options - Command options
 */
function addOptionsToEmbed(embed, options) {
    if (!options || options.length === 0) {
        return;
    }

    const optionsText = options.map(option => {
        const required = option.required ? '(required)' : '(optional)';
        return `**${option.name}** ${required} - ${option.description}`;
    }).join('\n');

    embed.addFields({
        name: 'Options',
        value: optionsText
    });
}

/**
 * Adds permission fields to the command help embed
 * @param {EmbedBuilder} embed - The embed to update
 * @param {object} command - Command object with permission properties
 */
function addPermissionsToEmbed(embed, command) {
    // Add user permission requirements if specified
    if (command.requiredPermissions && command.requiredPermissions.length > 0) {
        embed.addFields({
            name: 'Required Permissions',
            value: getFormattedPermissionList(command.requiredPermissions)
        });
    }

    // Add bot permission requirements if specified
    if (command.botRequiredPermissions && command.botRequiredPermissions.length > 0) {
        // Get the PermissionsBitField to help with conversion
        const { PermissionsBitField } = require('discord.js');

        // Convert numeric flags to named flags if needed
        const namedPermissions = command.botRequiredPermissions.map(perm => {
            if (typeof perm === 'bigint' || typeof perm === 'number') {
                // Find the permission name from the flags
                for (const [name, value] of Object.entries(PermissionsBitField.Flags)) {
                    if (value === perm) {
                        return name;
                    }
                }
            }
            return perm;
        });

        // Format the permissions list with the named permissions
        const formattedPerms = formatPermissionList(namedPermissions);

        embed.addFields({
            name: 'Bot Required Permissions',
            value: formattedPerms
        });
    }
}

/**
 * Gathers available commands for the user based on access permissions
 * @param {import('discord.js').Client} client - Discord client with commands collection
 * @param {boolean} isInDevServer - Whether the user is in the development server
 * @returns {Array} Array of available commands with formatted data
 */
function gatherAvailableCommands(client, isInDevServer) {
    // Gather all available commands
    const allCommands = [];
    for (const [_name, command] of client.commands.entries()) {
        // Skip private commands if not in dev server
        if (command.category === 'private' && !isInDevServer) {
            continue;
        }

        allCommands.push({
            name: command.data.name,
            description: command.data.description,
            group: command.group || 'General',
            category: command.category || 'public'
        });
    }

    // Sort commands by group and name
    return allCommands.sort((a, b) => {
        if (a.group !== b.group) {
            return a.group.localeCompare(b.group);
        }
        return a.name.localeCompare(b.name);
    });
}

/**
 * Sends a paginated embed with command list
 * @param {import('discord.js').ChatInputCommandInteraction} interaction - Discord interaction
 * @param {Array} commands - Array of command objects
 * @returns {Promise<void>}
 */
async function sendCommandsPaginationEmbed(interaction, commands) {
    await sendPaginatedMessage(
        interaction,
        commands,
        (command) => {
            return {
                name: `/${command.name} (${command.group})`,
                value: command.description
            };
        },
        {
            title: 'Available Commands',
            description: 'Here are all the commands you can use with this bot:',
            itemsPerPage: PAGINATION.ITEMS_PER_PAGE,
            footerText: 'Use /help [command] to get more information'
        }
    );
}

// setupPaginationCollector function removed as it's no longer needed
// Our new sendPaginatedMessage function from paginationUtils.js handles this functionality

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available commands or info about a specific command')
        .addStringOption(option => {
            return option.setName('command')
                .setDescription('Get details about a specific command')
                .setRequired(false)
                .setAutocomplete(true);
        }),

    // Use cooldown from config to maintain consistency
    cooldown: config.app.cooldownDefault,

    // Bot permissions needed to execute this command
    botRequiredPermissions: [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ],

    /**
     * Command execution handler
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>} Promise representing the command execution
     */
    async execute(interaction) {
        try {
            const commandName = interaction.options.getString('command');

            // If a specific command was requested
            if (commandName) {
                return showCommandHelp(interaction, commandName);
            }

            // Otherwise, list all available commands grouped by category
            return showAllCommands(interaction);
        } catch (error) {
            return safeReply(interaction, createEphemeralReplyOptions({
                embeds: [createErrorEmbed('Help Error', 'An error occurred while fetching command information.')]
            }));
        }
    },

    /**
     * Autocomplete handler for command option
     * @param {import('discord.js').AutocompleteInteraction} interaction
     */
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const { client } = interaction;

        // Get all commands available to the user
        // (private commands are only shown in the dev server)
        const isInDevServer = interaction.guildId === config.discord.adminGuildId;

        const availableCommands = [...client.commands.values()]
            .filter(cmd => {return isInDevServer || cmd.category === 'public';})
            .map(cmd => {
                return {
                    name: cmd.data.name,
                    value: cmd.data.name,
                    description: cmd.data.description
                };
            });

        // Filter commands based on input
        const filtered = availableCommands.filter(choice => {
            return choice.name.toLowerCase().includes(focusedValue) ||
                choice.description.toLowerCase().includes(focusedValue);
        }).slice(0, MAX_AUTOCOMPLETE_RESULTS);

        await interaction.respond(filtered);
    }
};

/**
 * Shows help for all commands grouped by category
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function showAllCommands(interaction) {
    try {
        const { client } = interaction;
        const isInDevServer = interaction.guildId === config.discord.adminGuildId;

        // Get available commands
        const commands = gatherAvailableCommands(client, isInDevServer);

        // Send paginated commands using the new utility
        await sendCommandsPaginationEmbed(interaction, commands);
    } catch (error) {
        logger.error('Error showing all commands:', error);
        await safeReply(interaction, createEphemeralReplyOptions({
            embeds: [createErrorEmbed('Help Error', 'An error occurred while listing commands.')]
        }));
    }
}

/**
 * Shows detailed help for a specific command
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} commandName
 */
async function showCommandHelp(interaction, commandName) {
    try {
        const { client } = interaction;
        const command = client.commands.get(commandName);

        if (!command) {
            return safeReply(interaction, createEphemeralReplyOptions({
                embeds: [createErrorEmbed('Command Not Found', `I couldn't find a command called \`${commandName}\`.`)]
            }));
        }

        // Skip private commands if not in dev server
        const isInDevServer = interaction.guildId === config.discord.adminGuildId;
        if (command.category === 'private' && !isInDevServer) {
            return safeReply(interaction, createEphemeralReplyOptions({
                embeds: [createErrorEmbed('Command Not Found', `I couldn't find a command called \`${commandName}\`.`)]
            }));
        }

        // Create the command help embed using messageUtils
        const embed = createSuccessEmbed(
            `Command: /${command.data.name}`,
            command.data.description
        );

        // Add various command info sections
        addOptionsToEmbed(embed, command.data.options);
        addPermissionsToEmbed(embed, command);

        // Add cooldown info and notes
        addConditionalField(embed, 'Cooldown', `${command.cooldown} seconds`, command.cooldown);
        addConditionalField(embed, 'Notes', command.notes, command.notes);

        return safeReply(interaction, createEphemeralReplyOptions({
            embeds: [embed]
        }));
    } catch (error) {
        logger.error('Error showing command help:', error);
        return safeReply(interaction, createEphemeralReplyOptions({
            embeds: [createErrorEmbed('Help Error', 'Failed to show command information.')]
        }));
    }
}
