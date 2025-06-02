/**
 * Message Utility
 *
 * Helper functions for creating and sending messages, embeds, and components
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    ButtonStyle
} = require('discord.js');
const { logger } = require('./logger');
const { truncate } = require('./helpers');
const { DISCORD, COLORS } = require('./constants');
const { config } = require('../config');

// Constants for commonly used values
const DEFAULT_ITEMS_PER_PAGE = 5;
const DEFAULT_TIMER_DURATION = 10000; // 10 seconds

/**
 * Creates a basic embed with consistent styling
 * @param {Object} options - Embed options
 * @param {string} options.title - Embed title
 * @param {string} options.description - Embed description
 * @param {string} options.color - Embed color (hex code or from COLORS)
 * @param {string} options.footerText - Footer text
 * @param {string} options.footerIcon - Footer icon URL
 * @param {string} options.thumbnailUrl - Thumbnail URL
 * @param {string} options.imageUrl - Image URL
 * @returns {EmbedBuilder} Configured embed
 */
function createEmbed(options = {}) {
    const embed = new EmbedBuilder(); // Set primary properties
    if (options.title) { embed.setTitle(truncate(options.title, DISCORD.EMBED_LIMITS.TITLE)); }
    if (options.description) { embed.setDescription(truncate(options.description, DISCORD.EMBED_LIMITS.DESCRIPTION)); }

    // Set color (default to blue)
    const color = options.color || COLORS.BOOTSTRAP_DEFAULT;
    embed.setColor(color);

    // Set timestamp if not explicitly disabled
    if (options.timestamp !== false) { embed.setTimestamp(); }

    // Set footer
    if (options.footerText) {
        embed.setFooter({
            text: truncate(options.footerText, DISCORD.EMBED_LIMITS.FOOTER_TEXT),
            iconURL: options.footerIcon
        });
    }

    // Add environment indicator in development mode
    if (config.isDevelopment) {
        const currentFooter = embed.data.footer || {};
        const envText = `[${config.environment}] ${currentFooter.text || ''}`.trim();
        embed.setFooter({
            text: truncate(envText, DISCORD.EMBED_LIMITS.FOOTER_TEXT),
            iconURL: currentFooter.icon_url
        });
    }

    // Set thumbnail and image
    if (options.thumbnailUrl) { embed.setThumbnail(options.thumbnailUrl); }
    if (options.imageUrl) { embed.setImage(options.imageUrl); }

    return embed;
}

/**
 * Creates a success embed with green color
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Object} options - Additional embed options
 * @returns {EmbedBuilder} Success embed
 */
function createSuccessEmbed(title, description, options = {}) {
    return createEmbed({
        title,
        description,
        color: COLORS.BOOTSTRAP_SUCCESS,
        ...options
    });
}

/**
 * Creates an error embed with red color
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Object} options - Additional embed options
 * @returns {EmbedBuilder} Error embed
 */
function createErrorEmbed(title, description, options = {}) {
    return createEmbed({
        title,
        description,
        color: COLORS.BOOTSTRAP_ERROR,
        ...options
    });
}

/**
 * Creates a warning embed with yellow color
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Object} options - Additional embed options
 * @returns {EmbedBuilder} Warning embed
 */
function createWarningEmbed(title, description, options = {}) {
    return createEmbed({
        title,
        description,
        color: COLORS.BOOTSTRAP_WARNING,
        ...options
    });
}

/**
 * Creates a simple button
 * @param {Object} options - Button options
 * @param {string} options.customId - Button ID
 * @param {string} options.label - Button label
 * @param {ButtonStyle} options.style - Button style
 * @param {string} options.emoji - Button emoji
 * @param {boolean} options.disabled - Whether the button is disabled
 * @param {string} options.url - URL for link buttons
 * @returns {ButtonBuilder} Configured button
 */
function createButton(options) {
    const button = new ButtonBuilder()
        .setCustomId(options.url ? null : (options.customId || 'button'))
        .setLabel(options.label || 'Button')
        .setStyle(options.style || ButtonStyle.Primary);

    if (options.emoji) { button.setEmoji(options.emoji); }
    if (options.disabled) { button.setDisabled(true); }
    if (options.url) {
        button.setURL(options.url);
        button.setStyle(ButtonStyle.Link);
    }

    return button;
}

/**
 * Creates a row of buttons
 * @param {ButtonBuilder[]} buttons - Array of buttons
 * @returns {ActionRowBuilder} Action row with buttons
 */
function createButtonRow(buttons) {
    return new ActionRowBuilder().addComponents(buttons);
}

/**
 * Creates a select menu
 * @param {Object} options - Select menu options
 * @param {string} options.customId - Select menu ID
 * @param {string} options.placeholder - Placeholder text
 * @param {Array} options.options - Select options array
 * @param {boolean} options.disabled - Whether the menu is disabled
 * @param {number} options.minValues - Minimum selection count
 * @param {number} options.maxValues - Maximum selection count
 * @returns {ActionRowBuilder} Action row with select menu
 */
function createSelectMenu(options) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(options.customId || 'select')
        .setPlaceholder(options.placeholder || 'Make a selection...')
        .addOptions(options.options || []);

    if (options.disabled) { selectMenu.setDisabled(true); }
    if (options.minValues) { selectMenu.setMinValues(options.minValues); }
    if (options.maxValues) { selectMenu.setMaxValues(options.maxValues); }

    return new ActionRowBuilder().addComponents(selectMenu);
}

/**
 * Safely reply to an interaction with error handling
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} options - Reply options
 * @returns {Promise<Message|void>} Reply result or void
 */
async function safeReply(interaction, options) {
    try {
        // Convert deprecated ephemeral property to use flags
        const updatedOptions = { ...options };

        if (updatedOptions.ephemeral) {
            // Use the flags property instead of ephemeral
            updatedOptions.flags = updatedOptions.flags || [];
            if (!updatedOptions.flags.includes('Ephemeral')) {
                updatedOptions.flags.push('Ephemeral');
            }
            // Remove the deprecated property
            delete updatedOptions.ephemeral;
        }

        // If it's not yet replied or deferred
        if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply(updatedOptions);
        }

        // If it's deferred or already replied
        return await interaction.followUp(updatedOptions);
    } catch (error) {
        logger.error(`Failed to reply to interaction: ${error.message}`);

        // Try again without ephemeral if that was causing issues
        if (options.ephemeral || (options.flags && options.flags.includes('Ephemeral'))) {
            try {
                const newOptions = { ...options };
                // Remove both potential sources of ephemeral setting
                delete newOptions.ephemeral;
                if (newOptions.flags) {
                    newOptions.flags = newOptions.flags.filter(flag => {return flag !== 'Ephemeral';});
                }
                return await safeReply(interaction, newOptions);
            } catch (e) {
                logger.error(`Second attempt to reply failed: ${e.message}`);
            }
        }
        // Return undefined if all attempts fail
        return undefined;
    }
}

/**
 * Creates a confirmation message with yes/no buttons
 * @param {string} title - Confirmation title
 * @param {string} description - Confirmation message description
 * @param {Object} options - Additional options
 * @param {string} options.confirmId - Custom ID for confirm button (default: 'confirm')
 * @param {string} options.cancelId - Custom ID for cancel button (default: 'cancel')
 * @param {string} options.confirmLabel - Label for confirm button (default: 'Yes')
 * @param {string} options.cancelLabel - Label for cancel button (default: 'No')
 * @param {string} options.confirmEmoji - Emoji for confirm button
 * @param {string} options.cancelEmoji - Emoji for cancel button
 * @returns {Object} Object with embed and components for a confirmation message
 */
function createConfirmationMessage(title, description, options = {}) {
    // Create warning embed for the confirmation
    const embed = createWarningEmbed(title, description);

    // Create confirmation buttons
    const confirmButton = createButton({
        customId: options.confirmId || 'confirm',
        label: options.confirmLabel || 'Yes',
        emoji: options.confirmEmoji || '✅',
        style: ButtonStyle.Success
    });

    const cancelButton = createButton({
        customId: options.cancelId || 'cancel',
        label: options.cancelLabel || 'No',
        emoji: options.cancelEmoji || '❌',
        style: ButtonStyle.Danger
    });

    // Create button row
    const row = createButtonRow([confirmButton, cancelButton]);

    return {
        embeds: [embed],
        components: [row]
    };
}

/**
 * Creates navigation buttons for paginated embeds
 * @param {number} currentPage - Current page number
 * @param {number} pageCount - Total number of pages
 * @returns {Array<ButtonBuilder>} Array of navigation buttons
 * @private
 */
function _createPaginationButtons(currentPage, pageCount) {
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === pageCount - 1;

    return [
        // First page
        createButton({
            customId: 'first',
            emoji: '⏮️',
            disabled: isFirstPage,
            style: ButtonStyle.Secondary
        }),
        // Previous page
        createButton({
            customId: 'prev',
            emoji: '◀️',
            disabled: isFirstPage,
            style: ButtonStyle.Primary
        }),
        // Page indicator (disabled button for display)
        createButton({
            customId: 'page',
            label: `${currentPage + 1}/${pageCount}`,
            disabled: true,
            style: ButtonStyle.Secondary
        }),
        // Next page
        createButton({
            customId: 'next',
            emoji: '▶️',
            disabled: isLastPage,
            style: ButtonStyle.Primary
        }),
        // Last page
        createButton({
            customId: 'last',
            emoji: '⏭️',
            disabled: isLastPage,
            style: ButtonStyle.Secondary
        })
    ];
}

/**
 * Creates a paginated embed message for displaying arrays of data
 * @param {Array<Object>} items - Array of items to paginate
 * @param {Function} formatItemFn - Function that formats each item for display
 * @param {Object} options - Pagination options
 * @param {string} options.title - Title for the embed
 * @param {string} options.description - Description for the embed
 * @param {number} options.itemsPerPage - Number of items per page (default: 5)
 * @param {string} options.footerText - Text for the footer
 * @param {string} options.color - Color for the embed
 * @returns {Object} Object with functions for creating paginated embeds and components
 */
function createPaginatedEmbed(items, formatItemFn, options = {}) {
    const itemsPerPage = options.itemsPerPage || DEFAULT_ITEMS_PER_PAGE;
    const pageCount = Math.ceil(items.length / itemsPerPage);

    /**
     * Get embed for a specific page
     * @param {number} page - Page number (0-indexed)
     * @returns {Object} Object with embed and components
     */
    function getPage(page) {
        // Ensure page is within bounds
        const currentPage = Math.max(0, Math.min(page, pageCount - 1));
        const startIdx = currentPage * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, items.length);
        const pageItems = items.slice(startIdx, endIdx);

        // Create the embed
        const embed = createEmbed({
            title: options.title || 'Results',
            description: options.description || `Showing ${startIdx + 1}-${endIdx} of ${items.length} items`,
            color: options.color || COLORS.PRIMARY,
            footerText: `${options.footerText || 'Page'} ${currentPage + 1}/${pageCount}`
        });

        // Add formatted items
        for (const item of pageItems) {
            const formatted = formatItemFn(item);
            if (formatted.name && formatted.value) {
                embed.addFields({ name: formatted.name, value: formatted.value });
            }
        }

        // Create navigation buttons
        const buttons = _createPaginationButtons(currentPage, pageCount);

        return {
            embeds: [embed],
            components: [createButtonRow(buttons)],
            currentPage
        };
    }

    return {
        getPage,
        pageCount
    };
}

/**
 * Creates a timed message that automatically deletes after a specified duration
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} messageOptions - Message options for reply
 * @param {number} duration - Duration in milliseconds before deleting
 * @returns {Promise<void>}
 */
async function sendTimedMessage(interaction, messageOptions, duration = DEFAULT_TIMER_DURATION) {
    try {
        const message = await safeReply(interaction, {
            ...messageOptions,
            fetchReply: true
        });

        setTimeout(async () => {
            try {
                if (message && message.deletable) {
                    await message.delete();
                }
            } catch (error) {
                logger.error('Failed to delete timed message:', error);
            }
        }, duration);

        return message;
    } catch (error) {
        logger.error('Failed to send timed message:', error);
        return null;
    }
}

/**
 * Creates reply options with ephemeral flag set
 * @param {Object} options - Original reply options
 * @returns {Object} Reply options with ephemeral flag set
 */
function createEphemeralReplyOptions(options = {}) {
    return {
        ...options,
        flags: [...(options.flags || []), 'Ephemeral']
    };
}

module.exports = {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createButton,
    createButtonRow,
    createSelectMenu,
    safeReply,
    createConfirmationMessage,
    createPaginatedEmbed,
    sendTimedMessage,
    createEphemeralReplyOptions
};
