# Discord Bot Command Creation Guide

This documentation provides guidance for developers who need to create new commands for our Discord bot. Follow these guidelines to ensure your commands are consistent with the project standards.

## Command Structure

Commands in this bot are organized into two main categories:

- **Public Commands**: Available to all users (path: `src/commands/public/`)
- **Private Commands**: Restricted to users with specific permissions (path: `src/commands/private/`)

Within each category, commands are further organized into logical groups (e.g., `general`, `admin`).

## Creating a New Command

### File Structure

Each command should be in its own file with the following structure:

```javascript
/**
 * Command: YourCommandName
 * Category: public/your-group or private/your-group
 * Description: Brief description of what the command does
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
  createSuccessEmbed,
  createErrorEmbed,
  safeReply,
  createEphemeralReplyOptions,
} = require("../../../utils/messageUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("command-name")
    .setDescription("Description of what the command does"),

  // Command cooldown in seconds (defaults to config.app.cooldownDefault if not specified)
  cooldown: 5,

  // Required user permissions (empty array for public commands)
  requiredPermissions: [],

  // Required bot permissions to execute this command
  botRequiredPermissions: [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ViewChannel,
  ],

  /**
   * Command execution handler
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      // Command implementation
    } catch (error) {
      // Error handling
      await safeReply(
        interaction,
        createEphemeralReplyOptions({
          embeds: [createErrorEmbed("Error Title", "Error description")],
        })
      );
    }
  },
};
```

## Do's and Don'ts

### DO:

✅ Use the `SlashCommandBuilder` to define your command structure.

✅ Add proper JSDoc comments to document your command and parameters.

✅ Specify required permissions for both users and the bot.

✅ Use the provided utility functions for consistent responses:

- `safeReply` for safer interaction replies
- `createSuccessEmbed` for success messages
- `createErrorEmbed` for error messages
- `createEphemeralReplyOptions` for ephemeral messages

✅ Implement proper error handling using try/catch blocks.

✅ Follow the category/group structure for organizing commands.

✅ Add appropriate cooldowns to prevent command spam.

### DON'T:

❌ Hardcode values that should be in configuration files.

❌ Skip permission checks for private commands.

❌ Use direct message replies without the safeReply utility.

❌ Create commands with duplicate names (across all categories).

❌ Leave error cases unhandled.

❌ Implement lengthy operations in the main command execution without handling timeouts.

## Best Practices

### Command Organization

1. Place your command in the appropriate category:

   - `public`: Commands available to all users
   - `private`: Commands with restricted access

2. Group related commands in logical groups:
   - `general`: Basic utility commands
   - `admin`: Administration commands
   - Create new groups as needed for specific functionality domains

### Command Implementation

1. **Validation**: Always validate user input before processing.

2. **Response Format**: Use the provided embed utilities for consistent message styling:

   ```javascript
   const responseEmbed = createSuccessEmbed(
     "Title",
     "Description of the result"
   );
   ```

3. **Error Handling**: Always wrap your command logic in try/catch blocks:

   ```javascript
   try {
     // Command logic
   } catch (error) {
     await safeReply(
       interaction,
       createEphemeralReplyOptions({
         embeds: [createErrorEmbed("Error Title", "Error description")],
       })
     );
   }
   ```

4. **Permissions**: For private commands, specify required permissions:

   ```javascript
   requiredPermissions: [PermissionFlagsBits.Administrator],
   ```

5. **Command Options**: Add options using the SlashCommandBuilder:

   ```javascript
   data: new SlashCommandBuilder()
     .setName("command-name")
     .setDescription("Command description")
     .addStringOption((option) =>
       option
         .setName("parameter")
         .setDescription("Parameter description")
         .setRequired(true)
     );
   ```

6. **Deferred Responses**: For commands that may take time to process:
   ```javascript
   await interaction.deferReply();
   // Long operation
   await interaction.editReply({ content: "Process complete!" });
   ```

## Deploying Commands

After creating a new command:

1. Add it to the appropriate category/group folder.
2. Run the deployment script to register it with Discord:
   ```
   npm run deploy-commands
   ```

## Utilities Available

The following utilities are available to assist with command development:

- `messageUtils.js`: Functions for creating embeds and handling replies
- `permissionUtil.js`: Permission checking utilities
- `paginationUtils.js`: For paginated responses
- `logger.js`: Logging functions

## Example Command

Here's a simple example command for reference:

```javascript
/**
 * Command: Echo
 * Category: public/general
 * Description: Echoes back the user's input
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const {
  createSuccessEmbed,
  safeReply,
} = require("../../../utils/messageUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echoes back your message")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to echo back")
        .setRequired(true)
    ),

  cooldown: 5,
  requiredPermissions: [],
  botRequiredPermissions: [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ViewChannel,
  ],

  async execute(interaction) {
    try {
      const message = interaction.options.getString("message");

      const echoEmbed = createSuccessEmbed("📣 Echo", message);

      await safeReply(interaction, {
        embeds: [echoEmbed],
      });
    } catch (error) {
      await safeReply(interaction, {
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    }
  },
};
```

## Testing Your Commands

Before submitting your command:

1. Test it thoroughly in a development environment
2. Ensure it handles edge cases gracefully
3. Confirm it follows all project standards and patterns
4. Verify it includes appropriate error handling

---

For more detailed information, refer to:

- [Discord.js Documentation](https://discord.js.org/)
- [Message Utilities](./MESSAGE_UTILITIES.md)
- [Permission Utilities](./DATABASE.md)
- Project config files for environment-specific settings
