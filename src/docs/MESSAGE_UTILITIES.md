# Message Utilities Documentation

This document explains the message utilities system used throughout the Discord Bot Template. Understanding this pattern will help maintain consistent user interfaces as the bot grows.

## Core Components

The `src/utils/messageUtils.js` file provides several utilities for creating and managing Discord messages:

### Embeds

- **`createEmbed(options)`**: Creates a basic embed with consistent styling, truncation, and environment indicators
- **`createSuccessEmbed(title, description, options)`**: Creates a green-colored embed for success messages
- **`createErrorEmbed(title, description, options)`**: Creates a red-colored embed for error messages
- **`createWarningEmbed(title, description, options)`**: Creates a yellow-colored embed for warning messages

### Interactive Components

- **`createButton(options)`**: Creates a button with configurable styling and behavior
- **`createButtonRow(buttons)`**: Creates a row of buttons for message components
- **`createSelectMenu(options)`**: Creates a select menu for interactive messages
- **`createConfirmationMessage(title, description, options)`**: Creates a confirmation dialog with Yes/No buttons
- **`createPaginatedEmbed(items, formatItemFn, options)`**: Creates paginated embeds for displaying arrays of data

### Error Handling

- **`safeReply(interaction, options)`**: Safely replies to interactions with fallback mechanisms
- **`sendTimedMessage(interaction, messageOptions, duration)`**: Sends a message that deletes itself after a specified time

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

### Best Practices

1. **Consistent Styling**: Use the appropriate embed type based on the message context
2. **Error Handling**: Always use `safeReply` when responding to interactions
3. **Descriptive Titles**: Keep titles concise but informative
4. **Field Usage**: Use fields for detailed information, keeping the main description clean
5. **Accessibility**: Ensure the message is understandable even without visual styling

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
