/**
 * Application Constants
 *
 * Centralizes constants used throughout the application
 */

// Base constants for time calculations
const BASE = {
    // Time base units
    MILLISECONDS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    DAYS_PER_WEEK: 7,

    // Memory base units
    BYTES_PER_KILOBYTE: 1024,
};

// Command name constants to prevent typos and improve consistency
const COMMANDS = {
    // Public Commands
    PING: 'ping',
    HELP: 'help',

    // Private Commands
    STATUS: 'status',
};

// Calculate derived time constants to avoid long expressions
const MILLISECONDS_PER_MINUTE = BASE.SECONDS_PER_MINUTE * BASE.MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = BASE.MINUTES_PER_HOUR * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = BASE.HOURS_PER_DAY * MILLISECONDS_PER_HOUR;
const MILLISECONDS_PER_WEEK = BASE.DAYS_PER_WEEK * MILLISECONDS_PER_DAY;

// Time constants in milliseconds
const TIME = {
    MILLISECOND: 1,
    SECOND: BASE.MILLISECONDS_PER_SECOND,
    MINUTE: MILLISECONDS_PER_MINUTE,
    HOUR: MILLISECONDS_PER_HOUR,
    DAY: MILLISECONDS_PER_DAY,
    WEEK: MILLISECONDS_PER_WEEK,
};

// Command permissions and access levels
const PERMISSIONS = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    OWNER: 3,
};

// Custom embed colors for consistency
const COLORS = {
    // Discord standard colors
    PRIMARY: 0x5865F2, // Discord Blurple
    SUCCESS: 0x57F287, // Discord Green
    WARNING: 0xFEE75C, // Discord Yellow
    ERROR: 0xED4245, // Discord Red
    INFO: 0x5865F2, // Discord Blurple
    DEFAULT: 0x2B2D31, // Discord Default Background

    // Bootstrap-style colors (previously in messageUtils.js)
    BOOTSTRAP_DEFAULT: 0x007BFF, // Blue
    BOOTSTRAP_SUCCESS: 0x28A745, // Green
    BOOTSTRAP_WARNING: 0xFFC107, // Yellow
    BOOTSTRAP_ERROR: 0xDC3545, // Red
    BOOTSTRAP_INFO: 0x17A2B8, // Cyan
};

// Memory conversion constants
const MEMORY = {
    BYTES_PER_KB: BASE.BYTES_PER_KILOBYTE,
    BYTES_PER_MB: BASE.BYTES_PER_KILOBYTE * BASE.BYTES_PER_KILOBYTE,
    BYTES_PER_GB: BASE.BYTES_PER_KILOBYTE * BASE.BYTES_PER_KILOBYTE * BASE.BYTES_PER_KILOBYTE,
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 25,
    ITEMS_PER_PAGE: 5,
    TIMEOUT_MINUTES: 5,
    MAX_DISPLAY_ITEMS: 100,
};

// Discord embed character limits
const DISCORD = {
    EMBED_LIMITS: {
        TITLE: 256,
        DESCRIPTION: 4096,
        FOOTER_TEXT: 2048,
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
        TOTAL_FIELDS: 25,
        AUTHOR_NAME: 256
    },
    CHANNEL_TYPES: {
        TEXT: 0,
        DM: 1,
        VOICE: 2,
        GROUP_DM: 3,
        CATEGORY: 4,
        NEWS: 5,
        STORE: 6,
        NEWS_THREAD: 10,
        PUBLIC_THREAD: 11,
        PRIVATE_THREAD: 12,
        STAGE: 13,
        DIRECTORY: 14,
        FORUM: 15,
        MEDIA: 16
    }
};

// Discord API error codes
const API_ERRORS = {
    UNKNOWN_INTERACTION: 10062,
    INTERACTION_TIMEOUT: 10062, // Same as UNKNOWN_INTERACTION
    ALREADY_ACKNOWLEDGED: 'Interaction has already been acknowledged',
};

module.exports = {
    BASE,
    COMMANDS,
    TIME,
    PERMISSIONS,
    COLORS,
    MEMORY,
    PAGINATION,
    DISCORD,
    API_ERRORS,
};
