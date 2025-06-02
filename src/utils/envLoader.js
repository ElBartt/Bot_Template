/**
 * Environment Configuration Loader Utility
 *
 * Handles loading environment variables from the appropriate file based on the current NODE_ENV.
 * Supports environment-specific .env files (.env.production, .env.development, .env.test)
 * with fallback to the default .env file.
 */
const fs = require('fs');
const path = require('path');

/* eslint-disable no-console */

/**
 * Determines the current environment or defaults to development
 * @returns {string} The current environment name
 */
const determineEnvironment = () => {
    return process.env.NODE_ENV || 'development';
};

/**
 * Attempts to load environment variables from the specified file path
 * @param {string} filePath - Path to the .env file
 * @returns {boolean} - Whether the file was loaded successfully
 */
const loadEnvFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            require('dotenv').config({ path: filePath });
            console.info(`Loaded environment variables from ${filePath}`);
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Error loading environment file ${filePath}:`, err.message);
        return false;
    }
};

/**
 * Loads environment variables from the appropriate .env file based on current NODE_ENV
 * First tries environment-specific file (.env.{NODE_ENV}), then falls back to default .env file
 * @returns {Object} - Environment information object containing environment name and loading status
 */
const loadEnvironment = () => {
    // Determine environment
    const NODE_ENV = determineEnvironment();

    // Construct paths for environment-specific and default .env files
    const envPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
    const defaultEnvPath = path.resolve(process.cwd(), '.env');

    // Try loading environment files in order of precedence
    const envLoaded = loadEnvFile(envPath) || loadEnvFile(defaultEnvPath);

    // Log warning if no .env files were found
    if (!envLoaded) {
        console.warn(`No .env files found (tried ${envPath} and ${defaultEnvPath}). Using system environment variables or defaults.`);
    }

    return {
        environment: NODE_ENV,
        isProduction: NODE_ENV === 'production',
        envLoaded
    };
};

module.exports = {
    loadEnvironment,
    determineEnvironment
};
