/**
 * Utility Functions
 *
 * Collection of general utility functions for the bot
 */

const { BASE } = require('./constants');

// Define additional constants specific to this file
const HELPERS_CONSTANTS = {
    DEFAULT_STRING_LENGTH: 10,
    ELLIPSIS_LENGTH: 3,
    RETRY_DEFAULTS: {
        MAX_RETRIES: 3,
        INITIAL_DELAY_MS: 1000,
        BACKOFF_FACTOR: 2
    }
};

/**
 * Formats milliseconds into a readable time string
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(ms) {
    if (!ms || ms < 0) { return '0s'; }

    const seconds = Math.floor(ms / BASE.MILLISECONDS_PER_SECOND);
    const minutes = Math.floor(seconds / BASE.SECONDS_PER_MINUTE);
    const hours = Math.floor(minutes / BASE.MINUTES_PER_HOUR);
    const days = Math.floor(hours / BASE.HOURS_PER_DAY);

    const segments = [];

    if (days > 0) { segments.push(`${days}d`); }
    if (hours % BASE.HOURS_PER_DAY > 0) { segments.push(`${hours % BASE.HOURS_PER_DAY}h`); }
    if (minutes % BASE.MINUTES_PER_HOUR > 0) { segments.push(`${minutes % BASE.MINUTES_PER_HOUR}m`); }
    if (seconds % BASE.SECONDS_PER_MINUTE > 0 || segments.length === 0) { segments.push(`${seconds % BASE.SECONDS_PER_MINUTE}s`); }

    return segments.join(' ');
}

/**
 * Sleep/delay function that returns a promise
 * @param {number} ms - Time to sleep in milliseconds
 * @returns {Promise<void>} Promise that resolves after the specified time
 */
function sleep(ms) {
    return new Promise(resolve => { return setTimeout(resolve, ms); });
}

/**
 * Chunks an array into smaller arrays of a specified size
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array[]} Array of smaller arrays
 */
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) { chunks.push(array.slice(i, i + size)); }

    return chunks;
}

/**
 * Truncates a string to a certain length, adding an ellipsis if truncated
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, length) {
    if (!str || str.length <= length) { return str; }
    return `${str.substring(0, length - HELPERS_CONSTANTS.ELLIPSIS_LENGTH)}...`;
}

/**
 * Returns a random element from an array
 * @param {Array} array - The array to pick from
 * @returns {*} Random element
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Safely parses JSON with error handling
 * @param {string} json - The JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback value
 */
function safeJSONParse(json, fallback = null) {
    try {
        return JSON.parse(json);
    } catch (err) {
        return fallback;
    }
}

/**
 * Checks if a string is a valid URL
 * @param {string} string - The string to check
 * @returns {boolean} True if the string is a valid URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Generates a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
function randomString(length = HELPERS_CONSTANTS.DEFAULT_STRING_LENGTH) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); }

    return result;
}

/**
 * Attempts to run a function with automatic retries
 * @param {Function} fn - The function to execute (should return a Promise)
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.backoffFactor - Backoff multiplier (default: 2)
 * @returns {Promise<*>} Promise resolving to the function's result
 */
async function withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries || HELPERS_CONSTANTS.RETRY_DEFAULTS.MAX_RETRIES;
    const initialDelay = options.initialDelay || HELPERS_CONSTANTS.RETRY_DEFAULTS.INITIAL_DELAY_MS;
    const backoffFactor = options.backoffFactor || HELPERS_CONSTANTS.RETRY_DEFAULTS.BACKOFF_FACTOR;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            if (attempt > maxRetries) { break; }

            await sleep(delay);
            delay *= backoffFactor;
        }
    }

    throw lastError;
}

module.exports = {
    formatTime,
    sleep,
    chunk,
    truncate,
    randomChoice,
    safeJSONParse,
    isValidUrl,
    randomString,
    withRetry,
};
