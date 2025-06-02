/**
 * Permission Utility
 *
 * Helps with checking and managing Discord permissions.
 * Provides a consistent way to check if users have required permissions.
 */

const { PermissionsBitField } = require('discord.js');
const { logger } = require('./logger');
const { config } = require('../config');

/**
 * Check if a user has the required permissions in a guild
 * @param {Object} options - Permission check options
 * @param {GuildMember} options.member - Guild member to check permissions for
 * @param {PermissionResolvable[]} options.permissions - Required permissions
 * @param {TextChannel|VoiceChannel} [options.channel] - Channel to check permissions in (optional)
 * @returns {boolean} True if the member has all required permissions
 */
function hasPermissions({ member, permissions, channel }) {
    try {
        if (!member || !permissions) {return false;}

        // Check if user is the bot owner
        if (config.discord.ownerId && member.id === config.discord.ownerId)
        {return true;}

        // Check if permissions is an array; if not, convert it
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

        // If channel is provided, check channel permissions
        if (channel)
        {return channel.permissionsFor(member).has(permissionArray);}

        // Otherwise check guild-wide permissions
        return member.permissions.has(permissionArray);
    } catch (error) {
        logger.error('Error checking permissions:', error);
        return false;
    }
}

/**
 * Check if the bot has required permissions in a guild or channel
 * @param {Object} options - Permission check options
 * @param {Guild} options.guild - Guild to check permissions in
 * @param {PermissionResolvable[]} options.permissions - Required permissions
 * @param {TextChannel|VoiceChannel} [options.channel] - Channel to check permissions in (optional)
 * @returns {boolean} True if the bot has all required permissions
 */
function botHasPermissions({ guild, permissions, channel }) {
    try {
        if (!guild || !permissions) {return false;}

        const bot = guild.members.me || guild.members.cache.get(guild.client.user.id);

        if (!bot) {return false;}

        return hasPermissions({
            member: bot,
            permissions,
            channel,
        });
    } catch (error) {
        logger.error('Error checking bot permissions:', error);
        return false;
    }
}

/**
 * Get missing permissions from a list of required permissions
 * @param {Object} options - Permission check options
 * @param {GuildMember} options.member - Guild member to check permissions for
 * @param {PermissionResolvable[]} options.permissions - Required permissions
 * @param {TextChannel|VoiceChannel} [options.channel] - Channel to check permissions in (optional)
 * @returns {string[]} Array of missing permission names
 */
function getMissingPermissions({ member, permissions, channel }) {
    try {
        if (!member || !permissions) {return [];}

        // Check if user is the bot owner
        if (config.discord.ownerId && member.id === config.discord.ownerId)
        {return [];}

        // Check if permissions is an array; if not, convert it
        const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

        const missingPermissions = [];

        // Check each permission
        for (const permission of permissionArray)
        // If channel is provided, check channel permissions
        {if (channel) {
            if (!channel.permissionsFor(member).has(permission))
            {missingPermissions.push(permission);}
        }
        // Otherwise check guild-wide permissions
        else if (!member.permissions.has(permission)) {
            missingPermissions.push(permission);
        }} // Convert permission bits to readable names

        return missingPermissions.map(permission => {
            // Try to convert to readable name if it's a bit flag
            if (typeof permission === 'bigint' || typeof permission === 'number') {
                // Using Object.entries for safer property access
                const entry = Object.entries(PermissionsBitField.Flags).find(
                    ([_, value]) => { return value === permission; }
                );
                return entry ? entry[0] : String(permission);
            }

            return String(permission);
        });
    } catch (error) {
        logger.error('Error getting missing permissions:', error);
        return [];
    }
}

/**
 * Format a list of permissions into a readable string
 * @param {string[]|number[]|bigint[]} permissions - List of permission names or values
 * @returns {string} Formatted permission list
 */
function formatPermissionList(permissions) {
    if (!permissions || permissions.length === 0) {return 'None';}

    return permissions.map(perm => {
        // Ensure perm is a string before applying string operations
        const permString = String(perm);

        // Convert permission name to title case with spaces
        return permString
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/_/g, ' ') // Replace underscores with spaces
            .trim() // Remove extra spaces
            .split(' ')
            .map(word => { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); }) // Title case
            .join(' ');
    }).join('\n• ');
}

module.exports = {
    hasPermissions,
    botHasPermissions,
    getMissingPermissions,
    formatPermissionList,
};
