/**
 * JSON Database Implementation
 *
 * Provides persistent storage using JSON files.
 * Each collection is stored as a separate JSON file.
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../utils/logger');
const { config } = require('../../config');

// Constants
const JSON_INDENT_SPACES = 2; // Number of spaces for JSON indentation

class JsonDatabase {
    /**
     * Initialize the JSON database
     * @param {string} dbPath - Directory path for storing database files
     */ constructor(dbPath) {
        this.dbPath = dbPath || config.database.jsonPath || './data';
        this.cache = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the database and create the data directory if it doesn't exist
     * @returns {Promise<void>}
     */
    async init() {
        try {
            await fs.mkdir(this.dbPath, { recursive: true });
            this.initialized = true;
            logger.info(`JSON database initialized at ${this.dbPath}`);
        } catch (error) {
            logger.error('Failed to initialize JSON database:', error);
            throw new Error('JSON database initialization failed');
        }
    }

    /**
     * Ensure the database is initialized
     * @private
     */
    async _ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    /**
     * Get the file path for a collection
     * @param {string} collection - Collection name
     * @returns {string} Full file path
     * @private
     */
    _getFilePath(collection) {
        return path.join(this.dbPath, `${collection}.json`);
    }

    /**
     * Read data from a collection
     * @param {string} collection - Collection name
     * @returns {Promise<Array>} Collection data
     * @private
     */
    async _readCollection(collection) {
        await this._ensureInitialized();

        // Check cache first
        if (this.cache.has(collection)) {
            return this.cache.get(collection);
        }

        const filePath = this._getFilePath(collection);

        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            this.cache.set(collection, parsed);
            return parsed;
        } catch (error) {
            // If file doesn't exist, create an empty collection
            if (error.code === 'ENOENT') {
                const emptyCollection = [];
                this.cache.set(collection, emptyCollection);
                return emptyCollection;
            }

            logger.error(`Error reading collection ${collection}:`, error);
            throw new Error(`Failed to read collection ${collection}`);
        }
    }

    /**
     * Write data to a collection
     * @param {string} collection - Collection name
     * @param {Array} data - Collection data to write
     * @private
     */
    async _writeCollection(collection, data) {
        await this._ensureInitialized();

        const filePath = this._getFilePath(collection);

        try {
            // Update cache
            this.cache.set(collection, data);
            // Write to file
            await fs.writeFile(filePath, JSON.stringify(data, null, JSON_INDENT_SPACES), 'utf8');
        } catch (error) {
            logger.error(`Error writing collection ${collection}:`, error);
            throw new Error(`Failed to write collection ${collection}`);
        }
    }

    /**
     * Find all documents in a collection
     * @param {string} collection - Collection name
     * @returns {Promise<Array>} All documents in the collection
     */
    async findAll(collection) {
        return this._readCollection(collection);
    }

    /**
     * Find a single document by its ID
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @returns {Promise<Object|null>} Found document or null
     */
    async findById(collection, id) {
        const data = await this._readCollection(collection);
        return data.find(item => {return item.id === id;}) || null;
    }

    /**
     * Safely check if a property exists and matches a value in an object
     * @param {Object} obj - Object to check
     * @param {string} prop - Property name
     * @param {*} value - Value to compare
     * @returns {boolean} True if property exists and matches value
     * @private
     */
    _safePropertyMatch(obj, prop, value) {
        // Only check direct properties, not inherited ones
        return Object.prototype.hasOwnProperty.call(obj, prop) && obj[prop] === value;
    }

    /**
     * Find documents matching a query function
     * @param {string} collection - Collection name
     * @param {Function|Object} query - Query function or criteria object
     * @returns {Promise<Array>} Matching documents
     */
    async find(collection, query) {
        const data = await this._readCollection(collection);

        if (typeof query === 'function') {
            return data.filter(query);
        }

        if (typeof query === 'object' && query !== null) {
            return data.filter(item =>
            {return Object.entries(query).every(([prop, value]) =>
            {return this._safePropertyMatch(item, prop, value);}
            );}
            );
        }

        throw new Error('Query must be a function or an object');
    }

    /**
     * Insert a document into a collection
     * @param {string} collection - Collection name
     * @param {Object} document - Document to insert
     * @returns {Promise<Object>} Inserted document
     */
    async insert(collection, document) {
        // Ensure document has an ID
        if (!document.id) {
            document.id = this._generateId();
        }

        const data = await this._readCollection(collection);
        data.push(document);
        await this._writeCollection(collection, data);

        return document;
    }

    /**
     * Update a document by ID
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated document or null if not found
     */
    async updateById(collection, id, updates) {
        const data = await this._readCollection(collection);

        // Find the document by id
        const existingItem = data.find(item => {return item.id === id;});

        if (!existingItem) {
            return null;
        }

        // Create a new array with the updated document
        const updatedData = data.map(item => {
            if (item.id === id) {
                return { ...item, ...updates, id };
            }
            return item;
        });

        await this._writeCollection(collection, updatedData);

        // Find and return the updated document
        return updatedData.find(item => {return item.id === id;});
    }

    /**
     * Delete a document by ID
     * @param {string} collection - Collection name
     * @param {string} id - Document ID
     * @returns {Promise<boolean>} True if document was deleted
     */
    async deleteById(collection, id) {
        const data = await this._readCollection(collection);
        const initialLength = data.length;

        const filtered = data.filter(item => {return item.id !== id;});

        if (filtered.length !== initialLength) {
            await this._writeCollection(collection, filtered);
            return true;
        }

        return false;
    }

    /**
     * Delete all documents in a collection
     * @param {string} collection - Collection name
     * @returns {Promise<void>}
     */
    async deleteAll(collection) {
        await this._writeCollection(collection, []);
    }

    /**
     * Clear the cache for a collection or all collections
     * @param {string} [collection] - Collection name (optional)
     */
    clearCache(collection) {
        if (collection) {
            this.cache.delete(collection);
        } else {
            this.cache.clear();
        }
    }
}

module.exports = JsonDatabase;
