/**
 * Pagination Utilities
 *
 * Helper functions for handling paginated content
 */

const { logger } = require('./logger');
const { createPaginatedEmbed } = require('./messageUtils');
const { PAGINATION } = require('./constants');

/**
 * Send a paginated message and register the paginator with the client
 * @param {import('discord.js').Interaction} interaction - Discord interaction to reply to
 * @param {Array<any>} items - Array of items to paginate
 * @param {Function} formatItemFn - Function to format each item for display
 * @param {Object} options - Options for the paginated embed
 * @param {boolean} options.ephemeral - Whether the message should be ephemeral
 * @returns {Promise<import('discord.js').Message>} The sent message
 */
async function sendPaginatedMessage(interaction, items, formatItemFn, options = {}) {
    try {
        // Apply default pagination options from constants
        const paginationOptions = {
            ...options,
            itemsPerPage: options.itemsPerPage || PAGINATION.ITEMS_PER_PAGE
        };

        // Create the paginator
        const paginator = createPaginatedEmbed(items, formatItemFn, paginationOptions);

        // Get the initial page
        const initialPage = paginator.getPage(0);

        // Set up reply options
        const replyOptions = {
            ...initialPage,
            fetchReply: true // We need the message object to register the paginator
        };

        // Add ephemeral flag if specified
        if (options.ephemeral) {
            replyOptions.ephemeral = true;
        }

        // Send the message
        let sentMessage;
        if (!interaction.replied && !interaction.deferred) {
            sentMessage = await interaction.reply(replyOptions);
        } else {
            sentMessage = await interaction.followUp(replyOptions);
        }

        // Register the paginator with the client for later use by pagination buttons
        paginator.register(interaction.client, sentMessage.id);

        return sentMessage;
    } catch (error) {
        logger.error('Error sending paginated message:', error);
        throw error;
    }
}

module.exports = {
    sendPaginatedMessage
};
