/**
 * Logger Utility
 *
 * Provides a centralized logging system with various log levels and formatting.
 * Uses winston for advanced logging capabilities.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;
const { config } = require('../config');

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logs directory if it doesn't exist
if (!fs.existsSync(config.logging.directory)) {
    fs.mkdirSync(config.logging.directory, { recursive: true });
}

// Configure transport options
const loggerTransports = [];

// Add console transport if enabled
if (config.logging.consoleOutput) {
    loggerTransports.push(
        new transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                printf(({ level, message, timestamp, stack }) => {
                    return `${timestamp} [${level}]: ${stack || message}`;
                })
            )
        })
    );
}

// Add file transports if enabled
if (config.logging.fileOutput) {
    loggerTransports.push(
        new transports.File({
            filename: path.join(config.logging.directory, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new transports.File({
            filename: path.join(config.logging.directory, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Create the logger instance
const logger = createLogger({
    level: config.logging.level,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    defaultMeta: { service: 'discord-bot' },
    transports: loggerTransports
});

module.exports = { logger };
