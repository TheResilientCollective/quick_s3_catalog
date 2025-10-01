/**
 * Deduplication Utility Functions - Title Matching Logic
 * Provides standardized deduplication functionality with configurable matching strategies
 */

/**
 * Normalizes a title for comparison
 * @param {string} title - Title to normalize
 * @param {Object} options - Normalization options
 * @param {boolean} options.caseSensitive - Whether to preserve case (default: false)
 * @param {boolean} options.removeSpecialChars - Whether to remove special characters (default: false)
 * @param {boolean} options.collapseWhitespace - Whether to collapse multiple spaces (default: true)
 * @param {boolean} options.trimWhitespace - Whether to trim leading/trailing whitespace (default: true)
 * @returns {string} Normalized title
 */
function normalizeTitle(title, options = {}) {
  const {
    caseSensitive = false,
    removeSpecialChars = false,
    collapseWhitespace = true,
    trimWhitespace = true
  } = options;

  if (typeof title !== 'string') {
    throw new Error('Title must be a string');
  }

  let normalized = title;

  // Trim whitespace
  if (trimWhitespace) {
    normalized = normalized.trim();
  }

  // Convert case
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }

  // Remove special characters (keep only alphanumeric, spaces, and basic punctuation)
  if (removeSpecialChars) {
    normalized = normalized.replace(/[^\w\s\-_.]/g, '');
  }

  // Collapse multiple whitespace into single spaces
  if (collapseWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ');
  }

  // Final trim after processing
  if (trimWhitespace) {
    normalized = normalized.trim();
  }

  return normalized;
}

/**
 * Checks if two titles match based on normalization rules
 * @param {string} title1 - First title to compare
 * @param {string} title2 - Second title to compare
 * @param {Object} options - Matching options
 * @returns {boolean} True if titles match
 */
function titlesMatch(title1, title2, options = {}) {
  try {
    const normalized1 = normalizeTitle(title1, options);
    const normalized2 = normalizeTitle(title2, options);
    return normalized1 === normalized2;
  } catch (error) {
    console.warn('Error comparing titles:', error);
    return false;
  }
}

/**
 * Groups datasets by normalized title
 * @param {Array} datasets - Array of datasets to group
 * @param {Object} options - Grouping options
 * @returns {Map} Map with normalized titles as keys and arrays of datasets as values
 */
function groupDatasetsByTitle(datasets, options = {}) {
  if (!Array.isArray(datasets)) {
    throw new Error('Datasets must be an array');
  }

  const groups = new Map();

  datasets.forEach((dataset, index) => {
    if (!dataset || typeof dataset.title !== 'string') {
      console.warn(`Dataset at index ${index} has invalid title:`, dataset);
      return;
    }

    const normalizedTitle = normalizeTitle(dataset.title, options);

    if (!groups.has(normalizedTitle)) {
      groups.set(normalizedTitle, []);
    }

    groups.get(normalizedTitle).push(dataset);
  });

  return groups;
}

/**
 * Finds duplicates in a list of datasets
 * @param {Array} datasets - Array of datasets to analyze
 * @param {Object} options - Deduplication options
 * @returns {Object} Object with duplicates information
 */
function findDuplicates(datasets, options = {}) {
  const groups = groupDatasetsByTitle(datasets, options);
  const duplicates = new Map();
  let totalDuplicates = 0;
  let totalGroups = 0;

  groups.forEach((group, normalizedTitle) => {
    if (group.length > 1) {
      duplicates.set(normalizedTitle, group);
      totalDuplicates += group.length - 1; // Don't count the one we keep
      totalGroups++;
    }
  });

  return {
    duplicates,
    totalDuplicates,
    totalGroups,
    originalCount: datasets.length,
    uniqueCount: datasets.length - totalDuplicates
  };
}

/**
 * Selects which dataset to keep from a group of duplicates
 * @param {Array} duplicateGroup - Array of duplicate datasets
 * @param {Object} options - Selection options
 * @param {boolean} options.keepLatest - Keep the dataset with latest timestamp (default: true)
 * @param {boolean} options.keepFirst - Keep the first dataset encountered (default: false)
 * @param {string} options.strategy - Selection strategy ('latest', 'first', 'best') (default: 'latest')
 * @returns {Object} Selected dataset
 */
function selectDatasetToKeep(duplicateGroup, options = {}) {
  const {
    keepLatest = true,
    keepFirst = false,
    strategy = 'latest'
  } = options;

  if (!Array.isArray(duplicateGroup) || duplicateGroup.length === 0) {
    throw new Error('Duplicate group must be a non-empty array');
  }

  if (duplicateGroup.length === 1) {
    return duplicateGroup[0];
  }

  switch (strategy) {
    case 'first':
      return duplicateGroup[0];

    case 'latest':
      return _selectLatestDataset(duplicateGroup);

    case 'best':
      return _selectBestDataset(duplicateGroup);

    default:
      // Use keepLatest and keepFirst flags for backward compatibility
      if (keepFirst) {
        return duplicateGroup[0];
      } else if (keepLatest) {
        return _selectLatestDataset(duplicateGroup);
      } else {
        return duplicateGroup[0];
      }
  }
}

/**
 * Applies deduplication to a list of datasets
 * @param {Array} datasets - Array of datasets to deduplicate
 * @param {Object} options - Deduplication options
 * @returns {Object} Deduplication result with datasets and metadata
 */
function applyDeduplication(datasets, options = {}) {
  if (!Array.isArray(datasets)) {
    throw new Error('Datasets must be an array');
  }

  const startTime = performance.now();

  // Find duplicates
  const duplicateInfo = findDuplicates(datasets, options);
  const deduplicatedDatasets = [];
  const removedDatasets = [];

  // Group all datasets
  const groups = groupDatasetsByTitle(datasets, options);

  groups.forEach((group, normalizedTitle) => {
    if (group.length === 1) {
      // No duplicates, keep the dataset
      const dataset = group[0];
      _markDatasetAsUnique(dataset);
      deduplicatedDatasets.push(dataset);
    } else {
      // Handle duplicates
      const keptDataset = selectDatasetToKeep(group, options);
      const removed = group.filter(d => d !== keptDataset);

      // Mark the kept dataset
      _markDatasetAsKept(keptDataset, group.length);
      deduplicatedDatasets.push(keptDataset);

      // Mark removed duplicates
      removed.forEach(dataset => {
        _markDatasetAsDuplicate(dataset, group.length, keptDataset.id);
        removedDatasets.push(dataset);
      });
    }
  });

  const endTime = performance.now();

  return {
    datasets: deduplicatedDatasets,
    removed: removedDatasets,
    metadata: {
      originalCount: datasets.length,
      finalCount: deduplicatedDatasets.length,
      duplicatesRemoved: removedDatasets.length,
      duplicateGroups: duplicateInfo.totalGroups,
      processingTimeMs: endTime - startTime,
      strategy: options.strategy || (options.keepLatest ? 'latest' : 'first'),
      options: { ...options }
    }
  };
}

/**
 * Creates a deduplication report
 * @param {Array} datasets - Original datasets
 * @param {Object} deduplicationResult - Result from applyDeduplication
 * @returns {Object} Detailed deduplication report
 */
function createDeduplicationReport(datasets, deduplicationResult) {
  const { metadata, removed } = deduplicationResult;

  // Group removed datasets by their normalized titles
  const duplicatesByTitle = new Map();
  removed.forEach(dataset => {
    const title = dataset.deduplicationInfo?.originalTitle || dataset.title;
    const normalizedTitle = normalizeTitle(title, metadata.options);

    if (!duplicatesByTitle.has(normalizedTitle)) {
      duplicatesByTitle.set(normalizedTitle, []);
    }
    duplicatesByTitle.get(normalizedTitle).push(dataset);
  });

  return {
    summary: {
      originalDatasets: metadata.originalCount,
      finalDatasets: metadata.finalCount,
      duplicatesRemoved: metadata.duplicatesRemoved,
      duplicateGroups: metadata.duplicateGroups,
      processingTime: `${Math.round(metadata.processingTimeMs)}ms`,
      strategy: metadata.strategy
    },
    duplicateGroups: Array.from(duplicatesByTitle.entries()).map(([title, duplicates]) => ({
      normalizedTitle: title,
      count: duplicates.length + 1, // +1 for the kept dataset
      removed: duplicates.map(d => ({
        id: d.id,
        title: d.title,
        lastModified: d.lastModified,
        keptInstead: d.deduplicationInfo?.keptInsteadId
      }))
    })),
    configuration: metadata.options
  };
}

/**
 * Validates deduplication configuration
 * @param {Object} config - Deduplication configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateDeduplicationConfig(config) {
  const errors = [];

  if (typeof config !== 'object' || config === null) {
    errors.push('Configuration must be an object');
    return { isValid: false, errors };
  }

  // Validate strategy
  if (config.strategy && !['latest', 'first', 'best'].includes(config.strategy)) {
    errors.push('Strategy must be "latest", "first", or "best"');
  }

  // Validate boolean options
  const booleanOptions = ['caseSensitive', 'keepLatest', 'keepFirst', 'removeSpecialChars', 'collapseWhitespace', 'trimWhitespace'];
  booleanOptions.forEach(option => {
    if (config[option] !== undefined && typeof config[option] !== 'boolean') {
      errors.push(`${option} must be a boolean`);
    }
  });

  // Check for conflicting options
  if (config.keepLatest && config.keepFirst) {
    errors.push('Cannot specify both keepLatest and keepFirst');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Private helper functions

/**
 * Selects the dataset with the latest timestamp
 * @private
 * @param {Array} group - Group of duplicate datasets
 * @returns {Object} Dataset with latest timestamp
 */
function _selectLatestDataset(group) {
  return group.reduce((latest, current) => {
    const latestTime = latest.lastModified ? latest.lastModified.getTime() : 0;
    const currentTime = current.lastModified ? current.lastModified.getTime() : 0;

    if (currentTime > latestTime) {
      return current;
    } else if (currentTime === latestTime) {
      // Tie-breaker: use dataset ID for deterministic behavior
      return latest.id < current.id ? latest : current;
    } else {
      return latest;
    }
  });
}

/**
 * Selects the "best" dataset based on multiple criteria
 * @private
 * @param {Array} group - Group of duplicate datasets
 * @returns {Object} Best dataset
 */
function _selectBestDataset(group) {
  // Score datasets based on multiple criteria
  const scored = group.map(dataset => {
    let score = 0;

    // Prefer datasets with newer timestamps
    if (dataset.lastModified) {
      const daysSinceModified = (Date.now() - dataset.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 100 - daysSinceModified); // More recent = higher score
    }

    // Prefer datasets with descriptions
    if (dataset.description && dataset.description.length > 10) {
      score += 20;
    }

    // Prefer datasets with more distributions
    if (dataset.distribution && dataset.distribution.length > 0) {
      score += dataset.distribution.length * 10;
    }

    // Prefer valid datasets
    if (dataset.isValid) {
      score += 50;
    }

    // Prefer datasets with creator information
    if (dataset.creator) {
      score += 10;
    }

    return { dataset, score };
  });

  // Sort by score (descending) and return the best
  scored.sort((a, b) => b.score - a.score);
  return scored[0].dataset;
}

/**
 * Marks a dataset as unique (no duplicates found)
 * @private
 * @param {Object} dataset - Dataset to mark
 */
function _markDatasetAsUnique(dataset) {
  dataset.deduplicationInfo = {
    isDuplicate: false,
    duplicateCount: 1,
    keptInsteadId: null
  };
}

/**
 * Marks a dataset as kept (had duplicates but was selected to keep)
 * @private
 * @param {Object} dataset - Dataset to mark
 * @param {number} totalInGroup - Total number of datasets in the duplicate group
 */
function _markDatasetAsKept(dataset, totalInGroup) {
  dataset.deduplicationInfo = {
    isDuplicate: false,
    duplicateCount: totalInGroup,
    keptInsteadId: null
  };
}

/**
 * Marks a dataset as a duplicate (was removed)
 * @private
 * @param {Object} dataset - Dataset to mark
 * @param {number} totalInGroup - Total number of datasets in the duplicate group
 * @param {string} keptInsteadId - ID of the dataset that was kept instead
 */
function _markDatasetAsDuplicate(dataset, totalInGroup, keptInsteadId) {
  dataset.deduplicationInfo = {
    isDuplicate: true,
    duplicateCount: totalInGroup,
    keptInsteadId: keptInsteadId,
    originalTitle: dataset.title
  };
}

// Export functions for both CommonJS and ES6 modules
const deduplicationUtils = {
  normalizeTitle,
  titlesMatch,
  groupDatasetsByTitle,
  findDuplicates,
  selectDatasetToKeep,
  applyDeduplication,
  createDeduplicationReport,
  validateDeduplicationConfig
};

// Support both CommonJS and ES6 module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = deduplicationUtils;
}

if (typeof window !== 'undefined') {
  window.DeduplicationUtils = deduplicationUtils;
}

export {
  normalizeTitle,
  titlesMatch,
  groupDatasetsByTitle,
  findDuplicates,
  selectDatasetToKeep,
  applyDeduplication,
  createDeduplicationReport,
  validateDeduplicationConfig
};