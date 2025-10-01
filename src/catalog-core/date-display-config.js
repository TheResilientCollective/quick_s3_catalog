/**
 * DateDisplayConfig Entity
 * Manages configuration for date/timestamp display formatting
 */

class DateDisplayConfig {
  /**
   * Creates a new DateDisplayConfig instance
   * @param {Object} options - Configuration options
   * @param {string} options.format - Display format ('relative', 'absolute', 'both')
   * @param {boolean} options.showTime - Whether to include time in displays
   * @param {string} options.locale - Locale for formatting (e.g., 'en-US', 'en-GB')
   * @param {string} options.timezone - Timezone for display (e.g., 'UTC', 'America/New_York')
   * @param {Object} options.relativeOptions - Options for relative time formatting
   * @param {Object} options.absoluteOptions - Options for absolute date formatting
   */
  constructor(options = {}) {
    const {
      format = 'relative',
      showTime = true,
      locale = 'en-US',
      timezone = 'UTC',
      relativeOptions = {},
      absoluteOptions = {}
    } = options;

    this.format = format;
    this.showTime = showTime;
    this.locale = locale;
    this.timezone = timezone;
    this.relativeOptions = this._mergeRelativeOptions(relativeOptions);
    this.absoluteOptions = this._mergeAbsoluteOptions(absoluteOptions);

    // Validate configuration
    this._validate();
  }

  /**
   * Merges provided relative options with defaults
   * @private
   * @param {Object} options - User-provided relative options
   * @returns {Object} Merged relative options
   */
  _mergeRelativeOptions(options) {
    const defaults = {
      numeric: 'auto',     // 'auto', 'always'
      style: 'long',       // 'long', 'short', 'narrow'
      units: ['year', 'month', 'week', 'day', 'hour', 'minute'] // Available units
    };

    return { ...defaults, ...options };
  }

  /**
   * Merges provided absolute options with defaults
   * @private
   * @param {Object} options - User-provided absolute options
   * @returns {Object} Merged absolute options
   */
  _mergeAbsoluteOptions(options) {
    const defaults = {
      dateStyle: 'medium',    // 'full', 'long', 'medium', 'short'
      timeStyle: 'short',     // 'full', 'long', 'medium', 'short'
      hour12: undefined,      // true, false, undefined (locale default)
      weekday: undefined,     // 'long', 'short', 'narrow'
      year: 'numeric',        // 'numeric', '2-digit'
      month: 'short',         // 'numeric', '2-digit', 'long', 'short', 'narrow'
      day: 'numeric'          // 'numeric', '2-digit'
    };

    return { ...defaults, ...options };
  }

  /**
   * Validates the date display configuration
   * @private
   * @throws {Error} If configuration is invalid
   */
  _validate() {
    // Validate format
    const validFormats = ['relative', 'absolute', 'both'];
    if (!validFormats.includes(this.format)) {
      throw new Error(`DateDisplayConfig.format must be one of: ${validFormats.join(', ')}`);
    }

    // Validate showTime
    if (typeof this.showTime !== 'boolean') {
      throw new Error('DateDisplayConfig.showTime must be a boolean');
    }

    // Validate locale
    if (typeof this.locale !== 'string' || this.locale.length === 0) {
      throw new Error('DateDisplayConfig.locale must be a non-empty string');
    }

    // Validate timezone
    if (typeof this.timezone !== 'string' || this.timezone.length === 0) {
      throw new Error('DateDisplayConfig.timezone must be a non-empty string');
    }

    // Validate relative options
    if (this.relativeOptions.numeric && !['auto', 'always'].includes(this.relativeOptions.numeric)) {
      throw new Error('DateDisplayConfig.relativeOptions.numeric must be "auto" or "always"');
    }

    if (this.relativeOptions.style && !['long', 'short', 'narrow'].includes(this.relativeOptions.style)) {
      throw new Error('DateDisplayConfig.relativeOptions.style must be "long", "short", or "narrow"');
    }

    // Validate absolute options
    const validDateStyles = ['full', 'long', 'medium', 'short'];
    if (this.absoluteOptions.dateStyle && !validDateStyles.includes(this.absoluteOptions.dateStyle)) {
      throw new Error(`DateDisplayConfig.absoluteOptions.dateStyle must be one of: ${validDateStyles.join(', ')}`);
    }

    const validTimeStyles = ['full', 'long', 'medium', 'short'];
    if (this.absoluteOptions.timeStyle && !validTimeStyles.includes(this.absoluteOptions.timeStyle)) {
      throw new Error(`DateDisplayConfig.absoluteOptions.timeStyle must be one of: ${validTimeStyles.join(', ')}`);
    }
  }

  /**
   * Updates the configuration with new options
   * @param {Object} updates - Configuration updates
   * @returns {DateDisplayConfig} This instance for method chaining
   */
  update(updates) {
    const allowedFields = ['format', 'showTime', 'locale', 'timezone', 'relativeOptions', 'absoluteOptions'];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'relativeOptions') {
          this.relativeOptions = this._mergeRelativeOptions({ ...this.relativeOptions, ...value });
        } else if (key === 'absoluteOptions') {
          this.absoluteOptions = this._mergeAbsoluteOptions({ ...this.absoluteOptions, ...value });
        } else {
          this[key] = value;
        }
      } else {
        throw new Error(`Unknown DateDisplayConfig field: ${key}`);
      }
    }

    this._validate();
    return this;
  }

  /**
   * Returns a copy of the configuration
   * @returns {DateDisplayConfig} New instance with same configuration
   */
  clone() {
    return new DateDisplayConfig({
      format: this.format,
      showTime: this.showTime,
      locale: this.locale,
      timezone: this.timezone,
      relativeOptions: { ...this.relativeOptions },
      absoluteOptions: { ...this.absoluteOptions }
    });
  }

  /**
   * Returns configuration as a plain object
   * @returns {Object} Configuration object
   */
  toObject() {
    return {
      format: this.format,
      showTime: this.showTime,
      locale: this.locale,
      timezone: this.timezone,
      relativeOptions: { ...this.relativeOptions },
      absoluteOptions: { ...this.absoluteOptions }
    };
  }

  /**
   * Returns configuration as JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return this.toObject();
  }

  /**
   * Creates DateDisplayConfig from a plain object
   * @param {Object} obj - Configuration object
   * @returns {DateDisplayConfig} New instance
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('DateDisplayConfig.fromObject requires an object');
    }

    return new DateDisplayConfig(obj);
  }

  /**
   * Creates DateDisplayConfig from JSON
   * @param {string|Object} json - JSON string or object
   * @returns {DateDisplayConfig} New instance
   */
  static fromJSON(json) {
    if (typeof json === 'string') {
      return DateDisplayConfig.fromObject(JSON.parse(json));
    } else if (typeof json === 'object') {
      return DateDisplayConfig.fromObject(json);
    } else {
      throw new Error('DateDisplayConfig.fromJSON requires a JSON string or object');
    }
  }

  /**
   * Creates a default configuration
   * @returns {DateDisplayConfig} Default configuration
   */
  static createDefault() {
    return new DateDisplayConfig({
      format: 'relative',
      showTime: true,
      locale: 'en-US',
      timezone: 'UTC'
    });
  }

  /**
   * Creates a configuration optimized for browser display
   * @param {string} locale - Browser locale (optional)
   * @returns {DateDisplayConfig} Browser-optimized configuration
   */
  static createForBrowser(locale = 'en-US') {
    return new DateDisplayConfig({
      format: 'relative',
      showTime: true,
      locale: locale,
      timezone: 'UTC',
      relativeOptions: {
        numeric: 'auto',
        style: 'long'
      },
      absoluteOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    });
  }

  /**
   * Creates a configuration optimized for CLI display
   * @returns {DateDisplayConfig} CLI-optimized configuration
   */
  static createForCLI() {
    return new DateDisplayConfig({
      format: 'both',
      showTime: true,
      locale: 'en-US',
      timezone: 'UTC',
      relativeOptions: {
        numeric: 'auto',
        style: 'short'
      },
      absoluteOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    });
  }

  /**
   * Formats a date according to this configuration
   * @param {Date|string} date - Date to format
   * @returns {Object} Formatted date with relative and/or absolute formats
   */
  formatDate(date) {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided to formatDate');
    }

    const result = {};

    // Generate relative format if requested
    if (this.format === 'relative' || this.format === 'both') {
      result.relative = this._formatRelative(dateObj);
    }

    // Generate absolute format if requested
    if (this.format === 'absolute' || this.format === 'both') {
      result.absolute = this._formatAbsolute(dateObj);
    }

    // Set primary display based on format preference
    if (this.format === 'relative') {
      result.display = result.relative;
    } else if (this.format === 'absolute') {
      result.display = result.absolute;
    } else {
      result.display = `${result.relative} (${result.absolute})`;
    }

    return result;
  }

  /**
   * Formats a date as relative time
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Relative time string
   */
  _formatRelative(date) {
    // Check if Intl.RelativeTimeFormat is available
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      try {
        const rtf = new Intl.RelativeTimeFormat(this.locale, this.relativeOptions);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();

        // Convert to appropriate unit
        const units = [
          ['year', 365 * 24 * 60 * 60 * 1000],
          ['month', 30 * 24 * 60 * 60 * 1000],
          ['week', 7 * 24 * 60 * 60 * 1000],
          ['day', 24 * 60 * 60 * 1000],
          ['hour', 60 * 60 * 1000],
          ['minute', 60 * 1000]
        ];

        for (const [unit, ms] of units) {
          if (Math.abs(diffMs) >= ms) {
            const value = Math.round(diffMs / ms);
            return rtf.format(value, unit);
          }
        }

        return rtf.format(0, 'minute'); // Just now
      } catch (error) {
        // Fall back to simple relative time
        return this._formatRelativeFallback(date);
      }
    } else {
      return this._formatRelativeFallback(date);
    }
  }

  /**
   * Fallback relative time formatting when Intl.RelativeTimeFormat is unavailable
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Relative time string
   */
  _formatRelativeFallback(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'just now';
    }
  }

  /**
   * Formats a date as absolute time
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Absolute time string
   */
  _formatAbsolute(date) {
    // Check if Intl.DateTimeFormat is available
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      try {
        const options = { ...this.absoluteOptions };

        // Remove time-related options if showTime is false
        if (!this.showTime) {
          delete options.timeStyle;
          delete options.hour12;
        }

        // Add timezone if specified
        if (this.timezone && this.timezone !== 'UTC') {
          options.timeZone = this.timezone;
        }

        const formatter = new Intl.DateTimeFormat(this.locale, options);
        return formatter.format(date);
      } catch (error) {
        // Fall back to simple absolute formatting
        return this._formatAbsoluteFallback(date);
      }
    } else {
      return this._formatAbsoluteFallback(date);
    }
  }

  /**
   * Fallback absolute time formatting when Intl.DateTimeFormat is unavailable
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Absolute time string
   */
  _formatAbsoluteFallback(date) {
    if (this.showTime) {
      return date.toLocaleString();
    } else {
      return date.toLocaleDateString();
    }
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
    return `DateDisplayConfig(format=${this.format}, showTime=${this.showTime}, locale=${this.locale})`;
  }
}

module.exports = { DateDisplayConfig };