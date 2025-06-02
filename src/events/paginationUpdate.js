/**
 * Pagination Update Event Handler
 *
 * This event is emitted when a user clicks on a pagination button.
 * It handles updating the message with the new paginated content.
 */

const { logger } = require('../utils/logger');
const { COLORS } = require('../utils/constants');

module.exports = {
    name: 'paginationUpdate',
    once: false,
    async execute(data) {
        const { interaction, oldPage, newPage } = data;

        try {
            const { message } = interaction;

            // If the message doesn't have any components, we can't handle the pagination
            if (!message.components || message.components.length === 0) {
                logger.error('No components found in pagination message');
                return;
            }

            // Get the cached paginator for this message
            const paginatorKey = `paginator:${message.id}`;
            const paginator = interaction.client.paginators?.get(paginatorKey);

            if (!paginator) {
                logger.error(`No paginator found for message ID: ${message.id}`);
                await handleExpiredPaginatorSafely(interaction, message);
                return;
            }

            // Get the new page content using the paginator
            const pageContent = paginator.getPage(newPage);

            // Update the message with the new page content
            await message.edit({
                embeds: pageContent.embeds,
                components: pageContent.components
            });

            logger.info(`Updated pagination for message ${message.id} from page ${oldPage + 1} to ${newPage + 1}`);
        } catch (error) {
            logger.error('Error handling pagination update:', error);
        }
    },
};

/**
 * Safely handles the case when a paginator has expired or is missing
 * Uses a coordinated approach to avoid interaction conflicts
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction
 * @param {import('discord.js').Message} message - The message containing the paginator
 */
async function handleExpiredPaginatorSafely(interaction, message) {
    // Check if we might have a race condition with interactionCreate.js
    // We'll only update the message and not try to acknowledge the interaction
    // This avoids the "already acknowledged" errors
    try {
        // Get the current embed from the message if available
        const currentEmbed = message.embeds[0];

        if (currentEmbed) {
            // Create an expired embed that preserves some information from the original
            const expiredEmbed = {
                title: currentEmbed.title || 'Information',
                description: 'This paginated content has expired. Please run the command again to view fresh data.',
                color: COLORS.ERROR,
                footer: {
                    text: 'Pagination expired due to bot restart or timeout'
                }
            };

            // Update the message with the expired notice and remove buttons
            // This works even if the interaction has timed out or been acknowledged elsewhere
            await message.edit({
                embeds: [expiredEmbed],
                components: [] // Remove all buttons
            });

            logger.info(`Removed expired paginator buttons from message: ${message.id}`);
        }
    } catch (messageError) {
        logger.error('Error updating expired paginator message:', messageError);
    }
}
