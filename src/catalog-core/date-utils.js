/**
 * Date Formatting Utility Functions - Browser Compatible
 * Provides standardized date formatting with browser API compatibility
 */

/**
 * Formats a date with relative time display (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @param {string} options.style - Style ('long', 'short', 'narrow') (default: 'long')
 * @param {string} options.numeric - Numeric display ('auto', 'always') (default: 'auto')
 * @returns {string} Formatted relative time string
 */
function formatRelativeTime(date, options = {}) {
  const {
    locale = 'en-US',
    style = 'long',
    numeric = 'auto'
  } = options;

  const dateObj = _parseDate(date);
  if (!dateObj) {
    throw new Error('Invalid date provided to formatRelativeTime');
  }

  // Check if Intl.RelativeTimeFormat is available (modern browsers)
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric });
      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();

      // Convert to appropriate unit
      const { value, unit } = _calculateTimeUnit(diffMs);
      return rtf.format(value, unit);
    } catch (error) {
      // Fall back to simple relative time
      return _formatRelativeTimeFallback(dateObj);
    }
  } else {
    return _formatRelativeTimeFallback(dateObj);
  }
}

/**
 * Formats a date with absolute time display (e.g., "Oct 1, 2023, 3:45 PM")
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @param {string} options.dateStyle - Date style ('full', 'long', 'medium', 'short')
 * @param {string} options.timeStyle - Time style ('full', 'long', 'medium', 'short')
 * @param {string} options.timeZone - Time zone (default: 'UTC')
 * @param {boolean} options.hour12 - Use 12-hour format
 * @returns {string} Formatted absolute time string
 */
function formatAbsoluteTime(date, options = {}) {
  const {
    locale = 'en-US',
    dateStyle = 'medium',
    timeStyle = 'short',
    timeZone = 'UTC',
    hour12
  } = options;

  const dateObj = _parseDate(date);
  if (!dateObj) {
    throw new Error('Invalid date provided to formatAbsoluteTime');
  }

  // Check if Intl.DateTimeFormat is available (modern browsers)
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      const formatOptions = { dateStyle, timeStyle };

      if (timeZone && timeZone !== 'UTC') {
        formatOptions.timeZone = timeZone;
      }

      if (hour12 !== undefined) {
        formatOptions.hour12 = hour12;
      }

      const formatter = new Intl.DateTimeFormat(locale, formatOptions);
      return formatter.format(dateObj);
    } catch (error) {
      // Fall back to simple absolute formatting
      return _formatAbsoluteTimeFallback(dateObj, options);
    }
  } else {
    return _formatAbsoluteTimeFallback(dateObj, options);
  }
}

/**
 * Formats a date with both relative and absolute time display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options (combines relative and absolute options)
 * @returns {Object} Object with relative, absolute, and combined display strings
 */
function formatDateTime(date, options = {}) {
  const dateObj = _parseDate(date);
  if (!dateObj) {
    throw new Error('Invalid date provided to formatDateTime');
  }

  const relative = formatRelativeTime(dateObj, options);
  const absolute = formatAbsoluteTime(dateObj, options);
  const combined = `${relative} (${absolute})`;

  return {
    relative,
    absolute,
    combined,
    display: combined // Default display format
  };
}

/**
 * Checks if a browser supports modern date formatting APIs
 * @returns {Object} Support information for date formatting APIs
 */
function checkBrowserSupport() {
  return {
    relativeTimeFormat: typeof Intl !== 'undefined' && Boolean(Intl.RelativeTimeFormat),
    dateTimeFormat: typeof Intl !== 'undefined' && Boolean(Intl.DateTimeFormat),
    timeZones: typeof Intl !== 'undefined' && Boolean(Intl.DateTimeFormat.prototype.resolvedOptions),
    locales: typeof Intl !== 'undefined' && Boolean(Intl.DateTimeFormat.supportedLocalesOf)
  };
}

/**
 * Gets the user's preferred locale from browser settings
 * @returns {string} User's preferred locale or 'en-US' as fallback
 */
function getUserLocale() {
  if (typeof navigator !== 'undefined') {
    // Try to get user's language preference
    return navigator.language || navigator.languages?.[0] || 'en-US';
  }
  return 'en-US';
}

/**
 * Gets the user's timezone from browser settings
 * @returns {string} User's timezone or 'UTC' as fallback
 */
function getUserTimezone() {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (error) {
      return 'UTC';
    }
  }
  return 'UTC';
}

/**
 * Normalizes a date string for consistent parsing
 * @param {string} dateString - Date string to normalize
 * @returns {Date|null} Parsed date or null if invalid
 */
function normalizeDateString(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Handle various S3 date formats
  let normalizedString = dateString.trim();

  // Convert S3 date format to ISO format if needed
  if (normalizedString.includes(' ') && !normalizedString.includes('T')) {
    // Format: "2023-10-01 15:30:45" -> "2023-10-01T15:30:45"
    normalizedString = normalizedString.replace(' ', 'T');
  }

  // Ensure UTC timezone if not specified
  if (!normalizedString.includes('Z') && !normalizedString.includes('+') && !normalizedString.includes('-', 10)) {
    normalizedString += 'Z';
  }

  try {
    const date = new Date(normalizedString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

/**
 * Creates a date formatting configuration for different contexts
 * @param {string} context - Context ('browser', 'cli', 'export')
 * @returns {Object} Date formatting configuration
 */
function createFormattingConfig(context = 'browser') {
  const userLocale = getUserLocale();
  const userTimezone = getUserTimezone();

  const configs = {
    browser: {
      locale: userLocale,
      timeZone: userTimezone,
      relative: {
        style: 'long',
        numeric: 'auto'
      },
      absolute: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },
    cli: {
      locale: 'en-US',
      timeZone: 'UTC',
      relative: {
        style: 'short',
        numeric: 'auto'
      },
      absolute: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },
    export: {
      locale: 'en-US',
      timeZone: 'UTC',
      relative: {
        style: 'long',
        numeric: 'always'
      },
      absolute: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    }
  };

  return configs[context] || configs.browser;
}

// Private helper functions

/**
 * Parses various date inputs into a Date object
 * @private
 * @param {Date|string|number} date - Date input to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
function _parseDate(date) {
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof date === 'string') {
    return normalizeDateString(date);
  }

  if (typeof date === 'number') {
    try {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    } catch (error) {
      return null;
    }
  }

  return null;
}

/**
 * Calculates appropriate time unit for relative formatting
 * @private
 * @param {number} diffMs - Time difference in milliseconds
 * @returns {Object} Object with value and unit
 */
function _calculateTimeUnit(diffMs) {
  const units = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['week', 7 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
    ['second', 1000]
  ];

  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      const value = Math.round(diffMs / ms);
      return { value, unit };
    }
  }

  return { value: 0, unit: 'second' };
}

/**
 * Fallback relative time formatting for older browsers
 * @private
 * @param {Date} date - Date to format
 * @returns {string} Relative time string
 */
function _formatRelativeTimeFallback(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else if (diffWeeks > 0) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffSeconds > 5) {
    return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
}

/**
 * Fallback absolute time formatting for older browsers
 * @private
 * @param {Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Absolute time string
 */
function _formatAbsoluteTimeFallback(date, options = {}) {
  const { timeStyle = 'short' } = options;

  try {
    if (timeStyle === 'none' || timeStyle === false) {
      return date.toLocaleDateString();
    } else {
      return date.toLocaleString();
    }
  } catch (error) {
    // Ultimate fallback to basic formatting
    return date.toString();
  }
}

// Export functions for both CommonJS and ES6 modules
const dateUtils = {
  formatRelativeTime,
  formatAbsoluteTime,
  formatDateTime,
  checkBrowserSupport,
  getUserLocale,
  getUserTimezone,
  normalizeDateString,
  createFormattingConfig
};

// Support both CommonJS and ES6 module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = dateUtils;
}

if (typeof window !== 'undefined') {
  window.DateUtils = dateUtils;
}

export {
  formatRelativeTime,
  formatAbsoluteTime,
  formatDateTime,
  checkBrowserSupport,
  getUserLocale,
  getUserTimezone,
  normalizeDateString,
  createFormattingConfig
};