# Database System Documentation

This document provides guidance on using the database system in the Discord Bot Template. The system primarily uses JSON storage for guild data, with a placeholder MySQL implementation for future development.

## Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Basic Usage](#basic-usage)
- [JSON Database Operations](#json-database-operations)
- [MySQL Support](#mysql-support)

## Overview

The database system consists of two parts:

- A full JSON file-based implementation optimized for storing guild data
- A minimal MySQL setup ready for future expansion

The JSON implementation is currently used for:

- Storing guild information when the bot joins a server
- Tracking guild status (active/inactive)
- Maintaining guild configuration and statistics

## Configuration

Database settings are controlled through environment variables:

```bash
# Database Configuration
DATABASE_ENABLED=false # Options: true, false
DATABASE_TYPE=json # Keep as 'json' for now

# JSON Database Settings
JSON_DB_PATH=./data # Path for JSON storage files

# MySQL/MariaDB Settings (for future use)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_DATABASE=discord_bot
MYSQL_CONNECTION_LIMIT=10
```

## Basic Usage

Most interactions will use the JSON database for guild operations:

```javascript
const { getDatabase } = require("../services/database");

async function example() {
  const db = await getDatabase();

  // Store guild data
  await db.insert("guilds", {
    id: guild.id,
    name: guild.name,
    joinedAt: new Date().toISOString(),
    active: true,
  });
}
```

## JSON Database Operations

The JSON implementation provides these core operations:

### Guild Management

```javascript
// When a guild adds the bot
const guildData = {
  id: guild.id,
  name: guild.name,
  joinedAt: new Date().toISOString(),
  memberCount: guild.memberCount,
  active: true,
};

// Add new guild
await db.insert("guilds", guildData);

// Update existing guild
await db.updateById("guilds", guild.id, {
  active: true,
  memberCount: guild.memberCount,
});

// Mark guild as inactive when bot is removed
await db.updateById("guilds", guild.id, {
  active: false,
  leftAt: new Date().toISOString(),
});
```

### Finding Guilds

```javascript
// Get all guilds
const allGuilds = await db.findAll("guilds");

// Find specific guild
const guild = await db.findById("guilds", guildId);

// Find active guilds
const activeGuilds = await db.find("guilds", { active: true });
```

### Error Handling

Always wrap database operations in try/catch blocks:

```javascript
try {
  const guild = await db.findById("guilds", guildId);
  // Process guild data
} catch (error) {
  logger.error("Database error:", error);
  // Handle error appropriately
}
```

## MySQL Support

The MySQL implementation is currently a minimal setup ready for future development. It provides:

- Basic connection pooling
- Connection management (init/close)
- Placeholder methods for future implementation

To use MySQL in the future:

1. Install the required dependency:

```bash
npm install mysql2 --save
```

2. Update your environment configuration:

```bash
DATABASE_TYPE=mysql
MYSQL_HOST=your_host
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database
```

3. Implement the required methods in `mysqlDatabase.js` as needed

Note: The MySQL implementation is currently a placeholder. Stick to the JSON implementation until MySQL support is fully developed.

## Best Practices

1. **Guild Data Management**

   - Always include guild ID in documents
   - Use consistent date formats (ISO strings)
   - Mark guilds as inactive instead of deleting them

2. **Performance**

   - Keep guild documents reasonably sized
   - Use the cache clearing methods if memory usage is a concern
   - Perform regular backups of the data directory

3. **Error Handling**

   - Always handle database errors appropriately
   - Log errors with sufficient context
   - Provide graceful fallbacks when possible

4. **Future Development**
   - Extend the MySQL implementation as needed
   - Consider adding data migration tools when implementing MySQL
   - Maintain backward compatibility when adding features
