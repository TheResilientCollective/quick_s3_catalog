import { DeduplicationConfig } from './deduplication-config.js';

class CatalogIndex {
  constructor() {
    this.sections = new Map();
    this.searchableText = new Map();
    this.projectPaths = new Map();
    this.lastUpdated = null;

    // Enhanced fields for deduplication
    this.originalDatasets = new Map(); // Stores all datasets before deduplication
    this.deduplicationConfig = DeduplicationConfig.createDefault();
    this.deduplicationMetadata = {
      enabled: false,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      lastDeduplicationTime: null
    };
  }

  update(newDatasets) {
    this.sections.clear();
    this.searchableText.clear();
    this.projectPaths.clear();

    for (const dataset of newDatasets) {
      if (!this.sections.has(dataset.section)) {
        this.sections.set(dataset.section, []);
      }
      this.sections.get(dataset.section).push(dataset);

      this.searchableText.set(dataset.id, `${dataset.title} ${dataset.description}`.toLowerCase());

      if (!this.projectPaths.has(dataset.section)) {
        this.projectPaths.set(dataset.section, []);
      }
      this.projectPaths.get(dataset.section).push(dataset.projectPath);
    }

    this.lastUpdated = new Date();
  }

  search(query) {
    const lowerCaseQuery = query.toLowerCase();
    const results = new Map();
    let totalResults = 0;

    for (const [section, datasets] of this.sections.entries()) {
      const matchingDatasets = datasets.filter(dataset => {
        const text = this.searchableText.get(dataset.id);
        return text && text.includes(lowerCaseQuery);
      });

      if (matchingDatasets.length > 0) {
        results.set(section, matchingDatasets);
        totalResults += matchingDatasets.length;
      }
    }

    return { sections: Object.fromEntries(results), totalResults };
  }

  getSections() {
    return Array.from(this.sections.keys());
  }

  getDatasetsInSection(section) {
    return this.sections.get(section) || [];
  }

  /**
   * Enhanced update method with deduplication support
   * @param {Array} newDatasets - Array of datasets to index
   * @param {DeduplicationConfig} deduplicationConfig - Deduplication configuration (optional)
   */
  updateWithDeduplication(newDatasets, deduplicationConfig = null) {
    // Store original datasets
    this.originalDatasets.clear();
    newDatasets.forEach(dataset => {
      this.originalDatasets.set(dataset.id, dataset);
    });

    // Update deduplication config if provided
    if (deduplicationConfig) {
      this.deduplicationConfig = deduplicationConfig;
    }

    // Apply deduplication if enabled
    let processedDatasets = newDatasets;
    if (this.deduplicationConfig.enabled) {
      processedDatasets = this.applyDeduplication(newDatasets);
    } else {
      // Reset deduplication metadata when disabled
      this.deduplicationMetadata = {
        enabled: false,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        lastDeduplicationTime: null
      };
    }

    // Update index with processed datasets
    this.update(processedDatasets);
  }

  /**
   * Applies deduplication to datasets based on current configuration
   * @param {Array} datasets - Datasets to deduplicate
   * @returns {Array} Deduplicated datasets
   */
  applyDeduplication(datasets) {
    if (!this.deduplicationConfig.enabled) {
      return datasets;
    }

    const startTime = performance.now();

    // Group datasets by normalized title
    const titleGroups = new Map();
    const duplicatesFound = new Map();

    datasets.forEach(dataset => {
      const normalizedTitle = this.deduplicationConfig.normalizeTitle(dataset.title);

      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, []);
      }
      titleGroups.get(normalizedTitle).push(dataset);
    });

    const deduplicatedDatasets = [];
    let totalDuplicatesRemoved = 0;

    // Process each title group
    titleGroups.forEach((group, normalizedTitle) => {
      if (group.length === 1) {
        // No duplicates, keep the dataset
        const dataset = group[0];
        dataset.setDeduplicationInfo(false, 0);
        deduplicatedDatasets.push(dataset);
      } else {
        // Handle duplicates
        const keptDataset = this.selectDatasetToKeep(group);
        const removedDatasets = group.filter(d => d.id !== keptDataset.id);

        // Mark the kept dataset
        keptDataset.setDeduplicationInfo(false, group.length);
        deduplicatedDatasets.push(keptDataset);

        // Track removed duplicates
        removedDatasets.forEach(removed => {
          removed.setDeduplicationInfo(true, group.length);
          duplicatesFound.set(removed.id, {
            id: removed.id,
            title: removed.title,
            lastModified: removed.lastModified,
            keptInsteadId: keptDataset.id
          });
        });

        totalDuplicatesRemoved += removedDatasets.length;
      }
    });

    const endTime = performance.now();

    // Update deduplication metadata
    this.deduplicationMetadata = {
      enabled: true,
      duplicatesFound: duplicatesFound.size,
      duplicatesRemoved: totalDuplicatesRemoved,
      lastDeduplicationTime: new Date(),
      processingTimeMs: endTime - startTime,
      removedDuplicates: Array.from(duplicatesFound.values())
    };

    return deduplicatedDatasets;
  }

  /**
   * Selects which dataset to keep from a group of duplicates
   * @param {Array} duplicateGroup - Array of datasets with same title
   * @returns {Dataset} Dataset to keep
   */
  selectDatasetToKeep(duplicateGroup) {
    if (duplicateGroup.length === 1) {
      return duplicateGroup[0];
    }

    if (this.deduplicationConfig.keepLatest) {
      // Keep the dataset with the latest lastModified timestamp
      return duplicateGroup.reduce((latest, current) => {
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
    } else {
      // Keep the first one (oldest or first encountered)
      return duplicateGroup[0];
    }
  }

  /**
   * Enhanced search with deduplication support
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results with deduplication metadata
   */
  searchWithDeduplication(query, options = {}) {
    const { deduplicate = this.deduplicationConfig.enabled } = options;

    // Get base search results
    const baseResults = this.search(query);

    if (!deduplicate) {
      return {
        ...baseResults,
        metadata: {
          deduplicationEnabled: false,
          searchQuery: query
        }
      };
    }

    // Apply deduplication to search results
    const deduplicatedSections = {};
    let totalResultsAfterDedup = 0;
    let duplicatesInSearch = 0;

    Object.entries(baseResults.sections).forEach(([section, datasets]) => {
      const dedupDatasets = this.applyDeduplicationToList(datasets);
      if (dedupDatasets.length > 0) {
        deduplicatedSections[section] = dedupDatasets;
        totalResultsAfterDedup += dedupDatasets.length;
        duplicatesInSearch += (datasets.length - dedupDatasets.length);
      }
    });

    return {
      sections: deduplicatedSections,
      totalResults: totalResultsAfterDedup,
      metadata: {
        deduplicationEnabled: true,
        searchQuery: query,
        duplicatesInSearch: duplicatesInSearch,
        originalResultCount: baseResults.totalResults
      }
    };
  }

  /**
   * Apply deduplication to a specific list of datasets
   * @param {Array} datasets - Datasets to deduplicate
   * @returns {Array} Deduplicated datasets
   */
  applyDeduplicationToList(datasets) {
    if (!this.deduplicationConfig.enabled) {
      return datasets;
    }

    const titleGroups = new Map();

    datasets.forEach(dataset => {
      const normalizedTitle = this.deduplicationConfig.normalizeTitle(dataset.title);

      if (!titleGroups.has(normalizedTitle)) {
        titleGroups.set(normalizedTitle, []);
      }
      titleGroups.get(normalizedTitle).push(dataset);
    });

    const deduplicatedDatasets = [];

    titleGroups.forEach((group) => {
      if (group.length === 1) {
        deduplicatedDatasets.push(group[0]);
      } else {
        const keptDataset = this.selectDatasetToKeep(group);
        deduplicatedDatasets.push(keptDataset);
      }
    });

    return deduplicatedDatasets;
  }

  /**
   * Sets the deduplication configuration
   * @param {DeduplicationConfig} config - New deduplication configuration
   */
  setDeduplicationConfig(config) {
    this.deduplicationConfig = config;
  }

  /**
   * Gets the current deduplication configuration
   * @returns {DeduplicationConfig} Current configuration
   */
  getDeduplicationConfig() {
    return this.deduplicationConfig;
  }

  /**
   * Gets deduplication metadata
   * @returns {Object} Deduplication metadata
   */
  getDeduplicationMetadata() {
    return { ...this.deduplicationMetadata };
  }

  /**
   * Gets all original datasets (before deduplication)
   * @returns {Array} Original datasets
   */
  getAllOriginalDatasets() {
    return Array.from(this.originalDatasets.values());
  }

  /**
   * Gets datasets that were removed during deduplication
   * @returns {Array} Removed duplicate datasets
   */
  getRemovedDuplicates() {
    return this.deduplicationMetadata.removedDuplicates || [];
  }

  /**
   * Checks if a specific dataset was marked as a duplicate
   * @param {string} datasetId - Dataset ID to check
   * @returns {boolean} True if dataset is marked as duplicate
   */
  isDatasetDuplicate(datasetId) {
    const removedDuplicates = this.getRemovedDuplicates();
    return removedDuplicates.some(removed => removed.id === datasetId);
  }

  /**
   * Finds what dataset was kept instead of a duplicate
   * @param {string} duplicateId - ID of the duplicate dataset
   * @returns {string|null} ID of the dataset that was kept instead
   */
  getKeptInsteadOf(duplicateId) {
    const removedDuplicates = this.getRemovedDuplicates();
    const duplicate = removedDuplicates.find(removed => removed.id === duplicateId);
    return duplicate ? duplicate.keptInsteadId : null;
  }
}

export { CatalogIndex };