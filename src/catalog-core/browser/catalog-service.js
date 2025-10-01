import { DatasetParser } from './dataset-parser.js';
import { CatalogIndex } from './catalog-index.js';
import { S3ClientBrowser } from './s3-client-browser.js';
import { DeduplicationConfig } from './deduplication-config.js';
import { DateDisplayConfig } from './date-display-config.js';

export class CatalogService {
  constructor(bucketName, options = {}) {
    this.bucketName = bucketName;
    this.options = options;
    this.index = new CatalogIndex();

    // Create browser-compatible S3 client if endpoint is provided
    if (options.endpoint) {
      this.s3Client = new S3ClientBrowser(bucketName, options);
    }

    // Enhanced configuration for deduplication and date display
    this.deduplicationConfig = this._initializeDeduplicationConfig(options.deduplication);
    this.dateDisplayConfig = this._initializeDateDisplayConfig(options.dateDisplay);

    // Performance and error tracking
    this.loadMetrics = {
      lastLoadTime: null,
      totalObjects: 0,
      metadataFiles: 0,
      validDatasets: 0,
      invalidDatasets: 0,
      processingTimeMs: 0
    };
  }

  /**
   * Initialize deduplication configuration from options
   * @private
   */
  _initializeDeduplicationConfig(deduplicationOptions) {
    if (!deduplicationOptions) {
      return DeduplicationConfig.createDefault();
    }

    if (deduplicationOptions instanceof DeduplicationConfig) {
      return deduplicationOptions;
    }

    return DeduplicationConfig.fromObject(deduplicationOptions);
  }

  /**
   * Initialize date display configuration from options
   * @private
   */
  _initializeDateDisplayConfig(dateDisplayOptions) {
    if (!dateDisplayOptions) {
      return DateDisplayConfig.createForBrowser();
    }

    if (dateDisplayOptions instanceof DateDisplayConfig) {
      return dateDisplayOptions;
    }

    return DateDisplayConfig.fromObject(dateDisplayOptions);
  }

  async loadCatalog() {
    if (!this.s3Client) {
      console.warn('No S3 client configured. Please provide endpoint in options.');
      return this._createEmptyResponse();
    }

    const startTime = performance.now();

    try {
      console.log('🚀 Loading complete catalog from S3...');

      // Step 1: List all objects with Enhanced S3Object metadata
      const objects = await this.s3Client.listObjects();
      console.log(`📁 Found ${objects.length} total objects in bucket`);

      // Step 2: Filter Enhanced S3Objects for metadata files
      const metadataObjects = objects.filter(obj => obj.isMetadata);
      console.log(`📄 Found ${metadataObjects.length} metadata files to process`);

      if (metadataObjects.length === 0) {
        console.warn('⚠️ No metadata.json files found in bucket');
        return this._createEmptyResponse();
      }

      const datasets = [];
      let processedCount = 0;

      // Step 3: Process all metadata files with enhanced S3 metadata
      console.log('📊 Processing metadata files with S3 timestamps...');
      for (const metadataObject of metadataObjects) {
        try {
          processedCount++;
          console.log(`Processing ${processedCount}/${metadataObjects.length}: ${metadataObject.Key}`);

          // Get metadata content and parse with S3 object info
          const metadataContent = await this.s3Client.getObject(metadataObject.Key);
          const dataset = DatasetParser.parse(metadataContent, metadataObject.Key, metadataObject);

          // Apply date formatting if configured
          this._applyDateFormatting(dataset);

          datasets.push(dataset);

          if (dataset.isValid) {
            console.log(`✅ Parsed dataset: "${dataset.title}" (${dataset.timestampAvailable ? 'with timestamp' : 'no timestamp'})`);
          } else {
            console.log(`❌ Invalid metadata: ${metadataObject.Key}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${metadataObject.Key}:`, error);
          // Create an invalid dataset entry with S3 metadata
          const invalidDataset = DatasetParser.parse('{}', metadataObject.Key, metadataObject);
          datasets.push(invalidDataset);
        }
      }

      const endTime = performance.now();

      // Step 4: Update metrics
      this.loadMetrics = {
        lastLoadTime: new Date(),
        totalObjects: objects.length,
        metadataFiles: metadataObjects.length,
        validDatasets: datasets.filter(d => d.isValid).length,
        invalidDatasets: datasets.filter(d => !d.isValid).length,
        processingTimeMs: endTime - startTime
      };

      // Step 5: Build enhanced index with deduplication
      this.index.updateWithDeduplication(datasets, this.deduplicationConfig);

      console.log(`✅ Successfully processed ${datasets.length} datasets`);
      console.log(`📊 Summary: ${this.loadMetrics.validDatasets} valid, ${this.loadMetrics.invalidDatasets} invalid`);

      if (this.deduplicationConfig.enabled) {
        const deduplicationMeta = this.index.getDeduplicationMetadata();
        console.log(`🔄 Deduplication: ${deduplicationMeta.duplicatesRemoved} duplicates removed`);
      }

      // Convert to response format
      const sections = this._sectionsToObject();
      const response = {
        sections: sections,
        metadata: this._buildResponseMetadata()
      };

      console.log(`🎉 Catalog loaded! Sections: ${Object.keys(sections).join(', ')}`);
      return response;

    } catch (error) {
      console.error('💥 Error loading catalog:', error);
      throw error;
    }
  }

  getDatasets() {
    // Convert Map to plain object for browser compatibility
    const sections = {};
    for (const [key, value] of this.index.sections.entries()) {
      sections[key] = value;
    }
    return sections;
  }

  // Helper method for parsing datasets (used by implementations)
  parseDataset(metadata, objectKey) {
    return DatasetParser.parse(metadata, objectKey);
  }

  // Helper method to update the index (used by implementations)
  updateIndex(datasets) {
    this.index.update(datasets);
    const sections = {};
    for (const [key, value] of this.index.sections.entries()) {
      sections[key] = value;
    }
    return sections;
  }

  // Test S3 connection
  async testConnection() {
    if (!this.s3Client) {
      return false;
    }
    return await this.s3Client.testConnection();
  }

  /**
   * Enhanced search with deduplication support
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results with metadata
   */
  search(query, options = {}) {
    if (this.deduplicationConfig.enabled || options.deduplicate) {
      return this.index.searchWithDeduplication(query, options);
    } else {
      const baseResults = this.index.search(query);
      return {
        ...baseResults,
        metadata: {
          deduplicationEnabled: false,
          searchQuery: query
        }
      };
    }
  }

  /**
   * Sets the deduplication configuration and reapplies it
   * @param {Object|DeduplicationConfig} config - New deduplication configuration
   */
  setDeduplicationConfig(config) {
    if (config instanceof DeduplicationConfig) {
      this.deduplicationConfig = config;
    } else {
      this.deduplicationConfig = DeduplicationConfig.fromObject(config);
    }

    // Update the index configuration
    this.index.setDeduplicationConfig(this.deduplicationConfig);
  }

  /**
   * Gets the current deduplication configuration
   * @returns {DeduplicationConfig} Current configuration
   */
  getDeduplicationConfig() {
    return this.deduplicationConfig;
  }

  /**
   * Updates deduplication configuration incrementally
   * @param {Object} updates - Configuration updates
   */
  updateDeduplicationConfig(updates) {
    this.deduplicationConfig.update(updates);
    this.index.setDeduplicationConfig(this.deduplicationConfig);
  }

  /**
   * Applies deduplication to current datasets without full reload
   * @returns {Object} Updated catalog response
   */
  async applyDeduplication() {
    const allOriginalDatasets = this.index.getAllOriginalDatasets();
    this.index.updateWithDeduplication(allOriginalDatasets, this.deduplicationConfig);

    return {
      sections: this._sectionsToObject(),
      metadata: this._buildResponseMetadata()
    };
  }

  /**
   * Sets the date display configuration
   * @param {Object|DateDisplayConfig} config - New date display configuration
   */
  setDateDisplayConfig(config) {
    if (config instanceof DateDisplayConfig) {
      this.dateDisplayConfig = config;
    } else {
      this.dateDisplayConfig = DateDisplayConfig.fromObject(config);
    }

    // Reapply date formatting to current datasets
    this._reapplyDateFormatting();
  }

  /**
   * Gets the current date display configuration
   * @returns {DateDisplayConfig} Current configuration
   */
  getDateDisplayConfig() {
    return this.dateDisplayConfig;
  }

  /**
   * Applies date formatting to a dataset
   * @private
   * @param {Dataset} dataset - Dataset to format
   */
  _applyDateFormatting(dataset) {
    if (dataset.lastModified && this.dateDisplayConfig) {
      try {
        const formatted = this.dateDisplayConfig.formatDate(dataset.lastModified);
        dataset.setDateDisplay(formatted.display, formatted.relative);
      } catch (error) {
        console.warn(`Failed to format date for dataset ${dataset.id}:`, error);
        // Set fallback display
        dataset.setDateDisplay(dataset.lastModified.toString(), 'unknown');
      }
    }
  }

  /**
   * Reapplies date formatting to all current datasets
   * @private
   */
  _reapplyDateFormatting() {
    const allDatasets = this.index.getAllOriginalDatasets();
    allDatasets.forEach(dataset => {
      this._applyDateFormatting(dataset);
    });
  }

  /**
   * Converts index sections Map to plain object
   * @private
   * @returns {Object} Sections as plain object
   */
  _sectionsToObject() {
    const sections = {};
    for (const [key, value] of this.index.sections.entries()) {
      sections[key] = value;
    }
    return sections;
  }

  /**
   * Builds response metadata
   * @private
   * @returns {Object} Response metadata
   */
  _buildResponseMetadata() {
    const deduplicationMeta = this.index.getDeduplicationMetadata();

    return {
      totalDatasets: this.loadMetrics.validDatasets + this.loadMetrics.invalidDatasets,
      validDatasets: this.loadMetrics.validDatasets,
      invalidDatasets: this.loadMetrics.invalidDatasets,
      lastUpdated: this.loadMetrics.lastLoadTime,
      processingTimeMs: this.loadMetrics.processingTimeMs,
      deduplicationEnabled: this.deduplicationConfig.enabled,
      deduplicationConfig: this.deduplicationConfig.toObject(),
      dateDisplayConfig: this.dateDisplayConfig.toObject(),
      duplicatesRemoved: deduplicationMeta.duplicatesRemoved,
      duplicatesFound: deduplicationMeta.duplicatesFound,
      bucketInfo: {
        name: this.bucketName,
        totalObjects: this.loadMetrics.totalObjects,
        metadataFiles: this.loadMetrics.metadataFiles
      }
    };
  }

  /**
   * Creates an empty response for error cases
   * @private
   * @returns {Object} Empty response
   */
  _createEmptyResponse() {
    return {
      sections: {},
      metadata: {
        totalDatasets: 0,
        validDatasets: 0,
        invalidDatasets: 0,
        lastUpdated: null,
        processingTimeMs: 0,
        deduplicationEnabled: this.deduplicationConfig.enabled,
        deduplicationConfig: this.deduplicationConfig.toObject(),
        dateDisplayConfig: this.dateDisplayConfig.toObject(),
        duplicatesRemoved: 0,
        duplicatesFound: 0,
        bucketInfo: {
          name: this.bucketName,
          totalObjects: 0,
          metadataFiles: 0
        }
      }
    };
  }

  /**
   * Gets detailed metrics about the catalog
   * @returns {Object} Detailed metrics
   */
  getMetrics() {
    return {
      ...this.loadMetrics,
      deduplication: this.index.getDeduplicationMetadata(),
      configuration: {
        deduplication: this.deduplicationConfig.toObject(),
        dateDisplay: this.dateDisplayConfig.toObject()
      }
    };
  }

  /**
   * Gets datasets that were removed during deduplication
   * @returns {Array} Removed duplicate datasets
   */
  getRemovedDuplicates() {
    return this.index.getRemovedDuplicates();
  }

  /**
   * Checks if a dataset is marked as a duplicate
   * @param {string} datasetId - Dataset ID to check
   * @returns {boolean} True if dataset is a duplicate
   */
  isDatasetDuplicate(datasetId) {
    return this.index.isDatasetDuplicate(datasetId);
  }

  /**
   * Finds what dataset was kept instead of a duplicate
   * @param {string} duplicateId - ID of the duplicate dataset
   * @returns {string|null} ID of the dataset kept instead
   */
  getKeptInsteadOf(duplicateId) {
    return this.index.getKeptInsteadOf(duplicateId);
  }
}