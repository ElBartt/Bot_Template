# 🤖 Discord Bot Template

![Discord.js Version](https://img.shields.io/badge/Discord.js-v14-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

A **production-grade**, **feature-rich** Discord bot framework designed for scalability and developer joy. Built by developers who understand what makes Discord bots successful, this template provides everything you need to launch your next bot project confidently.

> ✨ **Perfect for beginners and experts alike** - Start small and scale with confidence!
> 
> Learn more by visiting my [detailed blog post](https://arnauld-alex.com/building-a-production-ready-discord-bot-architecture-beyond-discordjs) about the bot architecural choices

## ⚡ Features

- **Modern Discord.js v14** - Take full advantage of the latest Discord features
- **Advanced Slash Commands** - Public and private commands with permission handling
- **Beautiful Message Components** - Pre-built utilities for embeds, buttons, and pagination
- **Bulletproof Error Handling** - Comprehensive error capture with detailed logging
- **Flexible Database System** - Simple JSON database with MySQL expansion support
- **Optimized Event Architecture** - Modular event handling with smart registration
- **Complete Documentation** - Detailed guides for creating commands and extending functionality
- **Production Deployment** - Ready-to-use PM2 configuration for reliable hosting
- **Developer Tooling** - ESLint setup and utility scripts to accelerate development

## 🚀 Getting Started

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

3. Create a `.env` file in the root directory with these configuration variables:

```bash
# Required Configuration - Bot won't start without these
DISCORD_TOKEN=your_bot_token_here          # Discord bot authentication token
DISCORD_CLIENT_ID=your_application_id_here # Your Discord application ID
ADMIN_GUILD_ID=your_development_server_id  # Required for development environment

# Common Configuration
LOG_LEVEL=debug                            # Options: error, warn, info, debug
```

See `.env.example` for all available configuration options.

4. Deploy commands to your development server:

```bash
npm run deploy:commands:dev
```

5. Start the bot:

```bash
npm run start:dev
```

For production:

```bash
npm run start:prod
```

## 📂 Project Structure

```
discord-bot-template/
├── src/                  # Source code
│   ├── commands/         # Bot commands
│   │   ├── private/      # Admin-only commands
│   │   └── public/       # Public commands
│   ├── config/           # Configuration files
│   ├── docs/             # Detailed documentation
│   ├── events/           # Discord event handlers
│   ├── scripts/          # Utility scripts
│   ├── services/         # Service integrations
│   │   └── database/     # Database implementations
│   ├── utils/            # Utility functions
│   ├── app.js            # Application entry point
│   └── client.js         # Discord client setup
├── data/                 # JSON database storage
├── logs/                 # Log files
├── ecosystem.config.js   # PM2 deployment configuration
└── package.json          # Project dependencies and scripts
```

## 💻 Command System

Commands are intelligently organized into categories:

- **Public Commands**: Available to all users in all servers
- **Private Commands**: Admin-only commands for bot management

Example command:

```javascript
module.exports = {
  data: new SlashCommandBuilder()
    .setName("command-name")
    .setDescription("Command description"),

  // Command cooldown in seconds
  cooldown: 5,

  // Permission requirements
  requiredPermissions: [PermissionFlagsBits.SendMessages],
  botRequiredPermissions: [PermissionFlagsBits.SendMessages],

  async execute(interaction) {
    // Command implementation with smart error handling
    await safeReply(
      interaction,
      createEphemeralReplyOptions({
        embeds: [
          createSuccessEmbed("Success", "Command executed successfully!"),
        ],
      })
    );
  },
};
```

## 🔧 Key System Components

### Message Utilities

Pre-built components for creating beautiful, consistent user interfaces:

- Styled embeds (success, error, warning)
- Interactive buttons and select menus
- Pagination for large data sets

### Database System

Flexible data storage with multiple backends:

- JSON file-based storage (perfect for small to medium bots)
- MySQL connector (ready for scaling to larger implementations)
- Easy-to-use API for guild data management

### Event Architecture

Event-driven design for clean separation of concerns:

- Automatic event handler registration
- Support for both standard and custom events
- Lifecycle management for complex bot behavior

## 🔄 Development Workflow

### Adding New Commands

1. Create a command file in the appropriate directory:

   - `src/commands/public/<category>/<command-name>.js`
   - `src/commands/private/<category>/<command-name>.js`

2. Deploy commands:

   ```bash
   # For development testing
   npm run deploy:commands:dev

   # For production release
   npm run deploy:commands:prod
   ```

### Adding Event Handlers

Add a new file to `src/events/` following the standard pattern:

```javascript
module.exports = {
  name: Events.EventName, // From discord.js Events enum
  once: false, // true if the event should only be handled once
  async execute(...args) {
    // Event handling logic with comprehensive logging
  },
};
```

## 🌐 Production Deployment

Deploy to production servers seamlessly with PM2:

```bash
# Install PM2 globally if needed
npm install -g pm2

# Deploy commands to production
npm run deploy:commands:prod

# Start with production configuration
pm2 start ecosystem.config.js --env production
```

## ⚙️ Customization Options

- **Bot Configuration**: Customize `src/config/index.js` for your specific needs
- **Command Categories**: Organize commands with custom categories
- **Database**: Scale to SQL or NoSQL solutions as your bot grows
- **Environment Variables**: Fine-tune behavior through detailed .env configuration

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Discord.js](https://discord.js.org/) - The powerful Discord API library
- [Node.js](https://nodejs.org/) - JavaScript runtime environment

---

**Made with ❤️ by Elbartt**

⭐ **Star this repository if you find it useful!** ⭐
