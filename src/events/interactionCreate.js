/**
 * Interaction Create Event Handler
 *
 * This handler processes all interactions with the bot, including:
 * - Slash commands
 * - Buttons
 * - Select menus
 * - Modals
 * - Autocomplete interactions
 */

const { Events, Collection } = require('discord.js');
const { logger } = require('../utils/logger');
const { TIME } = require('../utils/constants');
const { config } = require('../config');
const { botHasPermissions, hasPermissions, getMissingPermissions, formatPermissionList } = require('../utils/permissionUtil');
const {
    createErrorEmbed,
    createWarningEmbed,
    createSuccessEmbed,
    safeReply,
    createEphemeralReplyOptions
} = require('../utils/messageUtils');

/**
 * Checks if a command is on cooldown for a specific user
 * @param {import('discord.js').Client} client
 * @param {object} command
 * @param {string} userId
 * @returns {number|null} Remaining cooldown time in seconds or null if not on cooldown
 */
function checkCommandCooldown(client, command, userId) {
    const { cooldowns } = client;
    if (!cooldowns.has(command.data.name))
    {cooldowns.set(command.data.name, new Collection());}

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldown = config.app.cooldownDefault;
    const cooldownAmount = (command.cooldown ?? defaultCooldown) * TIME.SECOND;

    // Check if user is on cooldown
    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;

        if (now < expirationTime)
        {return (expirationTime - now) / TIME.SECOND;}
    }

    // Set cooldown for user
    timestamps.set(userId, now);
    setTimeout(() => {
        timestamps.delete(userId);
    }, cooldownAmount);

    return null;
}

/**
 * Check if the user has required permissions for a command
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {object} command
 * @returns {boolean} Whether the permission check passed
 */
async function checkUserPermissions(interaction, command) {
    const { member, guild, channel } = interaction;

    // Skip permission check if no permissions required or not in a guild
    if (!command.requiredPermissions || !command.requiredPermissions.length || !guild) {
        return true;
    }

    if (!hasPermissions({
        member,
        permissions: command.requiredPermissions,
        channel
    })) { const missingPermissions = getMissingPermissions({
        member,
        permissions: command.requiredPermissions,
        channel
    });

    const formattedPerms = formatPermissionList(missingPermissions);

    // Use messageUtils for consistent error formatting
    const permissionEmbed = createErrorEmbed(
        'Missing Permissions',
        'You don\'t have the required permissions to use this command.',
        {
            footerText: 'Please contact a server administrator if you believe this is an error.'
        }
    );

    // Add the missing permissions as a field
    permissionEmbed.addFields({
        name: 'Required Permissions',
        value: `• ${formattedPerms}`
    });

    await safeReply(interaction, createEphemeralReplyOptions({
        embeds: [permissionEmbed]
    }));

    return false;
    }

    return true;
}

/**
 * Check if the bot has required permissions for a command
 * @param {import('discord.js').CommandInteraction} interaction
 * @param {object} command
 * @returns {boolean} Whether the permission check passed
 */
async function checkBotPermissions(interaction, command) {
    const { guild, channel } = interaction;

    // Skip permission check if no permissions required or not in a guild
    if (!command.botRequiredPermissions || !command.botRequiredPermissions.length || !guild) {
        return true;
    }

    if (!botHasPermissions({
        guild,
        permissions: command.botRequiredPermissions,
        channel
    })) {
        const botMember = guild.members.me;
        const missingPermissions = getMissingPermissions({
            member: botMember,
            permissions: command.botRequiredPermissions,
            channel
        }); const formattedPerms = formatPermissionList(missingPermissions);

        // Use messageUtils for consistent error formatting
        const permissionEmbed = createErrorEmbed(
            'Missing Bot Permissions',
            'I don\'t have the required permissions to execute this command.',
            {
                footerText: 'Please contact a server administrator to resolve this issue.'
            }
        ); // Add the missing permissions as a field
        permissionEmbed.addFields({
            name: 'Missing Permissions',
            value: `• ${formattedPerms}`
        });

        await safeReply(interaction, createEphemeralReplyOptions({
            embeds: [permissionEmbed]
        }));

        return false;
    }

    return true;
}

/**
 * Handles slash command interactions
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>} True if command executed successfully, false otherwise
 */
async function handleSlashCommand(interaction) {
    const { client, commandName, user } = interaction;
    const command = client.commands.get(commandName); if (!command) {
        logger.error(`No command matching ${commandName} was found.`); // Use messageUtils for a morde consistent error message
        const notFoundEmbed = createErrorEmbed(
            'Command Not Found',
            'Sorry, this command is not available or may have been removed.'
        );

        return safeReply(interaction, createEphemeralReplyOptions({
            embeds: [notFoundEmbed]
        }));
    } // Check cooldown
    const remainingCooldown = checkCommandCooldown(client, command, user.id);
    if (remainingCooldown !== null) { // Use messageUtils for consistent warning message formatting
        const cooldownEmbed = createWarningEmbed(
            'Command on Cooldown',
            `Please wait **${remainingCooldown.toFixed(1)}** more seconds before using the \`${command.data.name}\` command again.`
        );

        return safeReply(interaction, createEphemeralReplyOptions({
            embeds: [cooldownEmbed]
        }));
    }

    // Check user permissions
    if (!(await checkUserPermissions(interaction, command))) {
        return false;
    }

    // Check bot permissions
    if (!(await checkBotPermissions(interaction, command))) {
        return false;
    }

    // Execute the command
    try {
        logger.info(`User ${user.tag} (${user.id}) executed command: ${commandName}`);
        await command.execute(interaction);
        return true;
    } catch (error) { logger.error(`Error executing command ${commandName}:`, error); // Create an error embed using messageUtils
        const errorEmbed = createErrorEmbed(
            'Command Error',
            'There was an error while executing this command!'
        );

        // Use safeReply utility for consistent error handling
        await safeReply(interaction, createEphemeralReplyOptions({
            embeds: [errorEmbed]
        }));

        return false;
    }
}

/**
 * Handles button interactions
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<boolean>} Whether the button interaction was handled successfully
 */
async function handleButtonInteraction(interaction) {
    const { customId, user } = interaction;
    logger.info(`User ${user.tag} (${user.id}) clicked button: ${customId}`);

    // Handle confirmation dialog buttons
    if (customId === 'confirm' || customId === 'cancel') {
        await handleConfirmationButton(interaction);
        return true;
    }

    // Handle pagination buttons
    if (['first', 'prev', 'next', 'last'].includes(customId)) {
        await handlePaginationButton(interaction);
        return true;
    }

    // Add other button handlers here...    // If no handler is found for this button, use messageUtils for consistent response
    const embed = createErrorEmbed(
        'Not Implemented',
        'This button has no handler implemented.'
    );

    await safeReply(interaction, createEphemeralReplyOptions({
        embeds: [embed]
    }));

    return false;
}

/**
 * Handles confirmation button interactions (confirm/cancel)
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleConfirmationButton(interaction) {
    const { customId } = interaction;

    // Create different responses based on whether user confirmed or cancelled
    if (customId === 'confirm') {
        const confirmEmbed = createSuccessEmbed(
            'Action Confirmed',
            'You confirmed the action.'
        );

        await interaction.update({
            embeds: [confirmEmbed],
            components: [] // Remove buttons after confirmation
        });

        // Emit a custom event that other handlers can listen for
        interaction.client.emit('confirmationAccepted', interaction);
    } else {
        // Handle cancellation
        const cancelEmbed = createErrorEmbed(
            'Action Cancelled',
            'You cancelled the action.'
        );

        await interaction.update({
            embeds: [cancelEmbed],
            components: [] // Remove buttons after cancellation
        });

        // Emit a custom event that other handlers can listen for
        interaction.client.emit('confirmationRejected', interaction);
    }
}

/**
 * Extract pagination info from the message components
 * @param {import('discord.js').Message} message - The message containing pagination components
 * @returns {Object} Object containing currentPage and totalPages
 */
function extractPaginationInfo(message) {
    const components = message.components[0]?.components || [];
    const pageIndicator = components.find(c => {return c.data.custom_id === 'page';});

    if (!pageIndicator) {
        throw new Error('Page indicator button not found');
    }

    // Extract current and total pages from the label (format: "X/Y")
    const [currentStr, totalStr] = pageIndicator.data.label.split('/');
    const currentPage = parseInt(currentStr, 10) - 1; // Convert to 0-indexed
    const totalPages = parseInt(totalStr, 10);

    return { currentPage, totalPages };
}

/**
 * Calculate the new page based on navigation button
 * @param {string} customId - The button's custom ID
 * @param {number} currentPage - Current page index
 * @param {number} totalPages - Total number of pages
 * @returns {number} The new page index
 */
function calculateNewPage(customId, currentPage, totalPages) {
    switch (customId) {
        case 'first': return 0;
        case 'prev': return Math.max(0, currentPage - 1);
        case 'next': return Math.min(totalPages - 1, currentPage + 1);
        case 'last': return totalPages - 1;
        default: return currentPage;
    }
}

/**
 * Handle pagination error by displaying an error message to the user
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction
 * @param {Error} error - The error that occurred
 */
async function handlePaginationError(interaction, error) {
    logger.error('Error handling pagination button:', error);

    try {
        const errorEmbed = createErrorEmbed(
            'Pagination Error',
            'Failed to update the page. Please try again.'
        );

        await safeReply(interaction, createEphemeralReplyOptions({
            embeds: [errorEmbed]
        }));
    } catch (replyError) {
        logger.error('Failed to send pagination error message:', replyError.message);
    }
}

/**
 * Handles pagination button interactions (first/prev/next/last)
 * @param {import('discord.js').ButtonInteraction} interaction
 * @returns {Promise<void>}
 */
async function handlePaginationButton(interaction) {
    const { customId, message } = interaction;

    try {
        // Extract pagination info and calculate new page
        const { currentPage, totalPages } = extractPaginationInfo(message);
        const newPage = calculateNewPage(customId, currentPage, totalPages);

        // Don't update if we're already on the requested page
        if (newPage === currentPage) {
            await interaction.deferUpdate();
            return;
        }

        try {
            await interaction.deferUpdate();
            interaction.client.emit('paginationUpdate', {
                interaction, oldPage: currentPage, newPage
            });
        } catch (deferError) {
            logger.warn(`Failed to defer pagination update: ${deferError.message}`);
        }
    } catch (error) {
        await handlePaginationError(interaction, error);
    }
}

/**
 * Handles select menu interactions
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleSelectMenuInteraction(interaction) {
    const { customId, user, values } = interaction;
    logger.info(`User ${user.tag} (${user.id}) selected options in menu ${customId}: ${values.join(', ')}`);

    // You can implement select menu handling logic here
    // This is a placeholder for future implementation    // If no handler is found for this select menu, use messageUtils for consistent response
    const embed = createErrorEmbed(
        'Not Implemented',
        'This select menu has no handler implemented.'
    );

    await safeReply(interaction, createEphemeralReplyOptions({
        embeds: [embed]
    }));
}

/**
 * Handles modal submit interactions
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleModalSubmitInteraction(interaction) {
    const { customId, user } = interaction;
    logger.info(`User ${user.tag} (${user.id}) submitted modal: ${customId}`);

    // You can implement modal submission handling logic here
    // This is a placeholder for future implementation    // If no handler is found for this modal, use messageUtils for consistent response
    const embed = createErrorEmbed(
        'Not Implemented',
        'This modal has no handler implemented.'
    );

    await safeReply(interaction, createEphemeralReplyOptions({
        embeds: [embed]
    }));
}

/**
 * Handles autocomplete interactions
 * @param {import('discord.js').AutocompleteInteraction} interaction
 * @returns {Promise<void>}
 */
async function handleAutocompleteInteraction(interaction) {
    const { commandName } = interaction;
    const command = interaction.client.commands.get(commandName);

    if (!command || !command.autocomplete) {
        logger.warn(`No autocomplete handler for ${commandName}`);
        return;
    }

    try {
        await command.autocomplete(interaction);
    } catch (error) {
        logger.error(`Error handling autocomplete for ${commandName}:`, error);
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try { // Route the interaction to the appropriate handler
            if (interaction.isChatInputCommand())
            {await handleSlashCommand(interaction);}
            else if (interaction.isButton())
            {await handleButtonInteraction(interaction);}
            else if (interaction.isStringSelectMenu())
            {await handleSelectMenuInteraction(interaction);}
            else if (interaction.isModalSubmit())
            {await handleModalSubmitInteraction(interaction);}
            else if (interaction.isAutocomplete())
            {await handleAutocompleteInteraction(interaction);}

        } catch (error) {
            logger.error('Error handling interaction:', error);
        }
    },
};
