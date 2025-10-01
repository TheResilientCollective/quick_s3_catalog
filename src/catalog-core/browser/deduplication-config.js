/**
 * DeduplicationConfig Entity - Browser Compatible Version
 * Manages configuration for title-based deduplication functionality
 */

class DeduplicationConfig {
  /**
   * Creates a new DeduplicationConfig instance
   * @param {Object} options - Configuration options
   * @param {boolean} options.enabled - Whether deduplication is enabled
   * @param {string} options.strategy - Deduplication strategy ('title-based')
   * @param {boolean} options.keepLatest - Whether to keep the latest version when deduplicating
   * @param {boolean} options.caseSensitive - Whether title matching is case-sensitive
   */
  constructor(options = {}) {
    const {
      enabled = false,
      strategy = 'title-based',
      keepLatest = true,
      caseSensitive = false
    } = options;

    this.enabled = enabled;
    this.strategy = strategy;
    this.keepLatest = keepLatest;
    this.caseSensitive = caseSensitive;

    // Validate configuration
    this._validate();
  }

  /**
   * Validates the deduplication configuration
   * @private
   * @throws {Error} If configuration is invalid
   */
  _validate() {
    // Validate enabled
    if (typeof this.enabled !== 'boolean') {
      throw new Error('DeduplicationConfig.enabled must be a boolean');
    }

    // Validate strategy
    const validStrategies = ['title-based'];
    if (!validStrategies.includes(this.strategy)) {
      throw new Error(`DeduplicationConfig.strategy must be one of: ${validStrategies.join(', ')}`);
    }

    // Validate keepLatest
    if (typeof this.keepLatest !== 'boolean') {
      throw new Error('DeduplicationConfig.keepLatest must be a boolean');
    }

    // Validate caseSensitive
    if (typeof this.caseSensitive !== 'boolean') {
      throw new Error('DeduplicationConfig.caseSensitive must be a boolean');
    }

    // Additional validation when enabled
    if (this.enabled) {
      if (!this.strategy) {
        throw new Error('DeduplicationConfig.strategy is required when deduplication is enabled');
      }
    }
  }

  /**
   * Updates the configuration with new options
   * @param {Object} updates - Configuration updates
   * @returns {DeduplicationConfig} This instance for method chaining
   */
  update(updates) {
    const allowedFields = ['enabled', 'strategy', 'keepLatest', 'caseSensitive'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        this[key] = value;
      } else {
        throw new Error(`Unknown DeduplicationConfig field: ${key}`);
      }
    }

    this._validate();
    return this;
  }

  /**
   * Returns a copy of the configuration
   * @returns {DeduplicationConfig} New instance with same configuration
   */
  clone() {
    return new DeduplicationConfig({
      enabled: this.enabled,
      strategy: this.strategy,
      keepLatest: this.keepLatest,
      caseSensitive: this.caseSensitive
    });
  }

  /**
   * Returns configuration as a plain object
   * @returns {Object} Configuration object
   */
  toObject() {
    return {
      enabled: this.enabled,
      strategy: this.strategy,
      keepLatest: this.keepLatest,
      caseSensitive: this.caseSensitive
    };
  }

  /**
   * Returns configuration as JSON string
   * @returns {string} JSON representation
   */
  toJSON() {
    return this.toObject();
  }

  /**
   * Creates DeduplicationConfig from a plain object
   * @param {Object} obj - Configuration object
   * @returns {DeduplicationConfig} New instance
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('DeduplicationConfig.fromObject requires an object');
    }

    return new DeduplicationConfig(obj);
  }

  /**
   * Creates DeduplicationConfig from JSON string
   * @param {string} json - JSON string
   * @returns {DeduplicationConfig} New instance
   */
  static fromJSON(json) {
    if (typeof json === 'string') {
      return DeduplicationConfig.fromObject(JSON.parse(json));
    } else if (typeof json === 'object') {
      return DeduplicationConfig.fromObject(json);
    } else {
      throw new Error('DeduplicationConfig.fromJSON requires a JSON string or object');
    }
  }

  /**
   * Creates a default configuration (disabled)
   * @returns {DeduplicationConfig} Default configuration
   */
  static createDefault() {
    return new DeduplicationConfig({
      enabled: false,
      strategy: 'title-based',
      keepLatest: true,
      caseSensitive: false
    });
  }

  /**
   * Creates an enabled configuration with defaults
   * @param {Object} overrides - Optional configuration overrides
   * @returns {DeduplicationConfig} Enabled configuration
   */
  static createEnabled(overrides = {}) {
    return new DeduplicationConfig({
      enabled: true,
      strategy: 'title-based',
      keepLatest: true,
      caseSensitive: false,
      ...overrides
    });
  }

  /**
   * Normalizes a title for comparison based on configuration
   * @param {string} title - Title to normalize
   * @returns {string} Normalized title
   */
  normalizeTitle(title) {
    if (typeof title !== 'string') {
      throw new Error('Title must be a string');
    }

    let normalized = title.trim();

    if (!this.caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  /**
   * Checks if two titles are considered duplicates
   * @param {string} title1 - First title
   * @param {string} title2 - Second title
   * @returns {boolean} True if titles are considered duplicates
   */
  titlesMatch(title1, title2) {
    if (!this.enabled) {
      return false;
    }

    if (this.strategy !== 'title-based') {
      return false;
    }

    return this.normalizeTitle(title1) === this.normalizeTitle(title2);
  }

  /**
   * Returns validation status and any errors
   * @returns {Object} Validation result with isValid and errors
   */
  validate() {
    try {
      this._validate();
      return { isValid: true, errors: [] };
    } catch (error) {
      return { isValid: false, errors: [error.message] };
    }
  }

  /**
   * Returns a string representation of the configuration
   * @returns {string} String representation
   */
  toString() {
    return `DeduplicationConfig(enabled=${this.enabled}, strategy=${this.strategy}, keepLatest=${this.keepLatest}, caseSensitive=${this.caseSensitive})`;
  }
}

export { DeduplicationConfig };