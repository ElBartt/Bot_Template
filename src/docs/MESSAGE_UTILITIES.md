# Message Utilities Documentation

This document explains the message utilities system used throughout the Discord Bot Template. Understanding this pattern will help maintain consistent user interfaces as the bot grows.

## Core Components

The `src/utils/messageUtils.js` file provides several utilities for creating and managing Discord messages:

### Embeds

- **`createEmbed(options)`**: Creates a basic embed with consistent styling, truncation, and environment indicators

  - **Parameters**:
    - `options.title`: Embed title (automatically truncated to fit Discord limits)
    - `options.description`: Embed description (automatically truncated)
    - `options.color`: Embed color (hex code or from COLORS)
    - `options.footerText`: Footer text
    - `options.footerIcon`: Footer icon URL
    - `options.thumbnailUrl`: Thumbnail URL
    - `options.imageUrl`: Image URL
    - `options.timestamp`: Set to false to disable timestamp (default: true)

- **`createSuccessEmbed(title, description, options)`**: Creates a green-colored embed for success messages
- **`createErrorEmbed(title, description, options)`**: Creates a red-colored embed for error messages
- **`createWarningEmbed(title, description, options)`**: Creates a yellow-colored embed for warning messages

### Interactive Components

- **`createButton(options)`**: Creates a button with configurable styling and behavior

  - **Parameters**:
    - `options.customId`: Button ID for interaction handling
    - `options.label`: Button label text
    - `options.style`: Button style from ButtonStyle enum
    - `options.emoji`: Button emoji
    - `options.disabled`: Whether the button is disabled
    - `options.url`: URL for link buttons (converts to LinkButton)

- **`createButtonRow(buttons)`**: Creates a row of buttons for message components

  - **Parameters**:
    - `buttons`: Array of ButtonBuilder objects

- **`createSelectMenu(options)`**: Creates a select menu for interactive messages

  - **Parameters**:
    - `options.customId`: Select menu ID
    - `options.placeholder`: Placeholder text
    - `options.options`: Select options array
    - `options.disabled`: Whether the menu is disabled
    - `options.minValues`: Minimum selection count
    - `options.maxValues`: Maximum selection count

- **`createConfirmationMessage(title, description, options)`**: Creates a confirmation dialog with Yes/No buttons

  - **Parameters**:
    - `options.confirmId`: Custom ID for confirm button (default: 'confirm')
    - `options.cancelId`: Custom ID for cancel button (default: 'cancel')
    - `options.confirmLabel`: Label for confirm button (default: 'Yes')
    - `options.cancelLabel`: Label for cancel button (default: 'No')
    - `options.confirmEmoji`: Emoji for confirm button (default: '✅')
    - `options.cancelEmoji`: Emoji for cancel button (default: '❌')

- **`createPaginatedEmbed(items, formatItemFn, options)`**: Creates paginated embeds for displaying arrays of data
  - **Parameters**:
    - `items`: Array of items to paginate
    - `formatItemFn`: Function that formats each item into an embed field
    - `options.title`: Title for the paginated embed
    - `options.description`: Description for the paginated embed
    - `options.color`: Color for the paginated embed
    - `options.footerText`: Footer text prefix (will append page numbers)
    - `options.itemsPerPage`: Number of items per page

### Error Handling & Utilities

- **`safeReply(interaction, options)`**: Safely replies to interactions with fallback mechanisms

  - **Handles**:
    - Already replied interactions
    - Deferred interactions
    - Failed replies (attempts to retry without ephemeral flag)

- **`sendTimedMessage(interaction, messageOptions, duration)`**: Sends a message that deletes itself after a specified time

- **`createEphemeralReplyOptions(options)`**: Creates reply options with ephemeral flag set (visible only to the command user)

## Usage Guidelines

### When to Use Each Type

- **Success Embeds**: Use for confirmations, successful operations, and positive feedback

  - Examples: Command executed successfully, item added to database
  - Files: `ping.js`, `status.js`

- **Error Embeds**: Use for failures, permission issues, and other error conditions

  - Examples: Missing permissions, command not found, failed operations
  - Files: `interactionCreate.js` (permission checks)

- **Warning Embeds**: Use for potential issues, rate limits, and cooldowns

  - Examples: Command on cooldown, approaching rate limits
  - Files: `interactionCreate.js` (cooldown handling)

- **Confirmation Messages**: Use when an action requires explicit user confirmation

  - Examples: Delete operations, irreversible changes, important actions
  - Implementation: See `createConfirmationMessage` examples below

- **Paginated Embeds**: Use when displaying lists or large amounts of data

  - Examples: Member lists, command lists, search results, logs
  - Implementation: See `server-info.js` command for a working example

- **Timed Messages**: Use for temporary notifications that should auto-remove

  - Examples: Success confirmations, temporary notifications, rate limit warnings
  - Implementation: `sendTimedMessage(interaction, messageOptions, durationInMs)`

- **Ephemeral Messages**: Use for replies only the command user should see
  - Examples: Error messages, personal data, command confirmations
  - Implementation: `createEphemeralReplyOptions(options)`

### Pagination Best Practices

1. **Register Paginators**: Always register paginators with the client using `paginator.register(client, messageId)`
2. **Format Function**: Create a consistent format function that returns `{name, value}` objects
3. **Clean Design**: Keep paginated displays clean with reasonable items per page (5-10 is typical)
4. **User Experience**: Include total counts in descriptions to help users understand data size
5. **Error States**: Handle empty data collections gracefully with helpful messages

### General Best Practices

1. **Consistent Styling**: Use the appropriate embed type based on the message context (success, error, warning)
2. **Error Handling**: Always use `safeReply` when responding to interactions to handle failures gracefully
3. **Descriptive Titles**: Keep titles concise but informative (under 50 characters recommended)
4. **Field Usage**: Use fields for detailed information, keeping the main description clean
5. **Accessibility**: Ensure the message is understandable even without visual styling
6. **Responsive Design**: Keep embed content short on mobile devices (fewer than 5 fields when possible)
7. **Interactive Components**: Group related buttons together; limit to one select menu per message
8. **Memory Management**: Paginated embeds auto-expire after a timeout; consider this when designing interactions
9. **Environment Indicators**: Development mode adds environment tags to footers automatically
10. **Truncation**: All string values are automatically truncated to meet Discord limits

## Examples

### Success Message

```javascript
const successEmbed = createSuccessEmbed(
  "🏓 Pong!",
  `**Bot Latency:** ${latency}ms\n**API Latency:** ${apiLatency}ms`
);
await interaction.reply({ embeds: [successEmbed] });
```

### Error Message

```javascript
const errorEmbed = createErrorEmbed(
  "Missing Permissions",
  "You don't have the required permissions to use this command."
);
errorEmbed.addFields({ name: "Required Permissions", value: permissionList });
await safeReply(interaction, { embeds: [errorEmbed], ephemeral: true });
```

### Warning Message

```javascript
const warningEmbed = createWarningEmbed(
  "Command on Cooldown",
  `Please wait **${remainingCooldown.toFixed(1)}** more seconds.`
);
await safeReply(interaction, { embeds: [warningEmbed], ephemeral: true });
```

## Benefits

- **Visual Consistency**: All bot responses follow a unified design language
- **Improved UX**: Users receive well-formatted, visually appealing messages
- **DRY Principle**: Eliminates duplicate embed creation code
- **Maintainability**: Future styling changes only need to be made in `messageUtils.js`
- **Error Resilience**: Built-in error handling with the `safeReply` utility
