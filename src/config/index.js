/**
 * Bot Configuration
 *
 * Centralizes all configuration options for the bot.
 * Values are loaded from environment variables with sensible defaults.
 */

// Bot configuration
const config = {
    // Environment
    environment: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',

    // Discord Bot
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        adminGuildId: process.env.ADMIN_GUILD_ID,
        inviteUrl: process.env.DISCORD_INVITE_URL || null,
        ownerId: process.env.DISCORD_OWNER_ID,
        status: process.env.BOT_STATUS || 'online',
        activityType: process.env.BOT_ACTIVITY_TYPE || 'PLAYING',
        activityName: process.env.BOT_ACTIVITY_NAME || 'with Discord.js',
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'debug',
        directory: process.env.LOG_DIRECTORY || 'logs',
        consoleOutput: process.env.LOG_TO_CONSOLE !== 'false',
        fileOutput: process.env.LOG_TO_FILE !== 'false',
    },

    // Database (for future implementation)
    database: {
        url: process.env.DATABASE_URL,
        enabled: process.env.DATABASE_ENABLED === 'true',
    },

    // Redis (for future implementation)
    redis: {
        url: process.env.REDIS_URL,
        enabled: process.env.REDIS_ENABLED === 'true',
    },

    // API (for future implementation)
    api: {
        enabled: process.env.API_ENABLED === 'true',
        port: parseInt(process.env.API_PORT || '3000', 10),
        corsOrigins: (process.env.API_CORS_ORIGINS || '*').split(','),
    },

    // Application-specific settings
    app: {
        cooldownDefault: parseInt(process.env.COOLDOWN_DEFAULT || '3', 10),
        maxCommandsPerUser: parseInt(process.env.MAX_COMMANDS_PER_USER || '100', 10),
        // Add any application-specific settings here
    }
};

// Validate critical configuration
function validateConfig() {
    const missingVars = [];

    // Check critical variables
    if (!config.discord.token) {missingVars.push('DISCORD_TOKEN');}
    if (!config.discord.clientId) {missingVars.push('DISCORD_CLIENT_ID');}
    if (config.isDevelopment && !config.discord.adminGuildId) {missingVars.push('ADMIN_GUILD_ID (required for development)');}

    return missingVars;
}

// Export the config object
module.exports = {
    config,
    validateConfig,
};
