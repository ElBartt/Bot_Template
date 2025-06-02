# Discord Bot Template

A robust, modular, and production-ready Discord bot template built with Discord.js v14. This template provides a solid foundation for building feature-rich Discord bots with clean architecture, comprehensive error handling, and best practices.

## Features

- **Modern Architecture**: Built with Discord.js v14 and Node.js
- **Slash Command Support**: Full support for Discord's slash commands
- **Command Organization**: Separate public and private (admin-only) commands
- **Event System**: Modular event handling system
- **Robust Error Handling**: Comprehensive error capture and logging
- **Utility Library**: Common utilities for Discord bot development
- **Configuration System**: Environment-based configuration with sensible defaults
- **Persistence Layer**: Simple JSON database for storing data
- **API Integration**: Base service for making external API requests
- **Deployment Ready**: PM2 ecosystem config for production deployment
- **Development Tools**: ESLint configuration for code quality

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Discord Bot Token (create one at [Discord Developer Portal](https://discord.com/developers/applications))
- Discord Application with slash command permissions

### Installation

1. Clone this repository or use it as a template:

```bash
git clone https://github.com/yourusername/discord-bot-template.git
cd discord-bot-template
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```
# Required Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
ADMIN_GUILD_ID=your_development_server_id_here

# Optional Configuration
NODE_ENV=development
LOG_LEVEL=info
```

4. Deploy commands to your development server:

```bash
npm run deploy:dev
```

5. Start the bot:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Project Structure

```
discord-bot-template/
├── src/                  # Source code
│   ├── commands/         # Bot commands
│   │   ├── private/      # Admin-only commands
│   │   └── public/       # Public commands
│   ├── config/           # Configuration files
│   ├── events/           # Discord event handlers
│   ├── scripts/          # Utility scripts
│   ├── services/         # Service integrations
│   ├── utils/            # Utility functions
│   ├── app.js            # Application entry point
│   └── client.js         # Discord client setup
├── .env.example          # Example environment variables
├── .eslintrc.js          # ESLint configuration
├── .gitignore            # Git ignore file
├── ecosystem.config.js   # PM2 deployment configuration
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

## Command Structure

Commands are organized into two categories:

- **Public Commands**: Available to all users in all servers the bot is in
- **Private Commands**: Only available in the development server (specified by ADMIN_GUILD_ID)

Each command is in its own file, grouped by function:

```javascript
// Example command structure
module.exports = {
  data: new SlashCommandBuilder()
    .setName("command-name")
    .setDescription("Command description"),

  // Optional cooldown in seconds
  cooldown: 5,

  async execute(interaction) {
    // Command logic here
  },
};
```

## Adding New Commands

1. Create a new file in the appropriate directory:

   - Public commands: `src/commands/public/<category>/<command-name>.js`
   - Private commands: `src/commands/private/<category>/<command-name>.js`

2. Use the command template structure shown above

3. Deploy the commands:
   - For development: `npm run deploy:dev`
   - For production: `npm run deploy:global`

## Adding Event Handlers

1. Create a new file in the `src/events/` directory, named after the event

2. Use the following structure:

```javascript
module.exports = {
  name: Events.EventName, // From discord.js Events enum
  once: false, // true if the event should only be handled once
  async execute(...args) {
    // Event handling logic
  },
};
```

## Deployment

For production deployment, use PM2:

```bash
# Install PM2 globally if you haven't already
npm install -g pm2

# Deploy commands globally
npm run deploy:global

# Start the bot with PM2
pm2 start ecosystem.config.js --env production
```

## Customization

- **Bot Configuration**: Edit `src/config/index.js` to customize bot settings
- **Command Categories**: Add or modify directories in `src/commands/public/` and `src/commands/private/`
- **Database**: Replace the JSON database with a proper database like MongoDB or PostgreSQL for larger bots

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Discord.js](https://discord.js.org/) - The Discord API library used
- [Node.js](https://nodejs.org/) - The JavaScript runtime used

---

Made with ❤️ by Elbartt
