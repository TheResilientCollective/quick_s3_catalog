const fs = require('fs');
const path = require('path');
const { CatalogService } = require('../catalog-core/catalog-service');
const { DeduplicationConfig } = require('../catalog-core/deduplication-config');
const { DateDisplayConfig } = require('../catalog-core/date-display-config');

/**
 * Enhanced export command with date handling and deduplication support
 * @param {Object} argv - Command line arguments
 * @param {string} argv.query - Optional search query to filter datasets
 * @param {boolean} argv.showDates - Include S3 lastModified timestamps
 * @param {boolean} argv.deduplicate - Enable title-based deduplication
 * @param {string} argv.dateFormat - Date format ('relative', 'absolute', 'both')
 * @param {boolean} argv.caseSensitive - Use case-sensitive deduplication
 * @param {string} argv.format - Export format ('json', 'csv', 'xlsx')
 * @param {string} argv.output - Output file path
 * @param {boolean} argv.includeMeta - Include catalog metadata in export
 * @param {boolean} argv.verbose - Show detailed export information
 */
async function exportData(argv) {
  try {
    // Create enhanced catalog service with configuration options
    const catalogOptions = _buildCatalogOptions(argv);
    const catalogService = new CatalogService(argv.bucketName, catalogOptions);

    console.log('📂 Preparing catalog export...');
    const startTime = Date.now();

    // Load catalog
    const catalogResponse = await catalogService.loadCatalog();
    const catalogMetadata = catalogResponse.metadata;

    // Get datasets to export
    let datasetsToExport;
    let exportMetadata = {
      totalDatasets: 0,
      sectionsExported: 0,
      query: argv.query || null,
      exportTime: new Date(),
      configuration: {
        showDates: argv.showDates,
        deduplicate: argv.deduplicate,
        dateFormat: argv.dateFormat,
        caseSensitive: argv.caseSensitive
      }
    };

    if (argv.query) {
      console.log(`🔍 Filtering datasets with query: "${argv.query}"`);
      const searchResult = catalogService.search(argv.query, {
        deduplicate: argv.deduplicate
      });
      datasetsToExport = _flattenSections(searchResult.sections);
      exportMetadata.totalDatasets = searchResult.totalResults;
      exportMetadata.sectionsExported = Object.keys(searchResult.sections).length;
      exportMetadata.searchMetadata = searchResult.metadata;
    } else {
      console.log('📊 Exporting all datasets');
      datasetsToExport = _flattenSections(catalogResponse.sections);
      exportMetadata.totalDatasets = datasetsToExport.length;
      exportMetadata.sectionsExported = Object.keys(catalogResponse.sections).length;
    }

    const processTime = Date.now() - startTime;
    exportMetadata.processingTimeMs = processTime;

    console.log(`📋 Prepared ${datasetsToExport.length} datasets for export`);

    // Create export data
    const exportData = _createExportData(datasetsToExport, catalogMetadata, exportMetadata, argv);

    // Generate output in requested format
    let outputData;
    let fileExtension;

    switch (argv.format.toLowerCase()) {
      case 'csv':
        outputData = _convertToCsv(exportData, argv);
        fileExtension = '.csv';
        break;
      case 'xlsx':
        outputData = _convertToXlsx(exportData, argv);
        fileExtension = '.xlsx';
        break;
      case 'json':
      default:
        outputData = JSON.stringify(exportData, null, argv.compact ? 0 : 2);
        fileExtension = '.json';
        break;
    }

    // Handle output
    if (argv.output) {
      await _writeToFile(argv.output, outputData, fileExtension, argv);
      _showExportSummary(exportMetadata, argv.output, argv);
    } else {
      // Output to stdout
      if (argv.format === 'xlsx') {
        console.error('❌ XLSX format requires an output file (use --output)');
        process.exit(1);
      }
      console.log(outputData);
    }

    if (argv.verbose) {
      _showVerboseStatistics(exportMetadata, catalogMetadata, argv);
    }

  } catch (error) {
    console.error('❌ Error exporting catalog:', error.message);
    if (argv.verbose) {
      console.error('Full error:', error);
    }
    process.exit(1);
  }
}

/**
 * Builds catalog service options from command line arguments
 * @private
 * @param {Object} argv - Command line arguments
 * @returns {Object} Catalog service options
 */
function _buildCatalogOptions(argv) {
  const options = {};

  // S3 endpoint configuration
  if (argv.endpoint) {
    options.endpoint = argv.endpoint;
  }

  // Configure deduplication
  if (argv.deduplicate) {
    options.deduplication = DeduplicationConfig.createEnabled({
      caseSensitive: argv.caseSensitive || false
    });
  } else {
    options.deduplication = DeduplicationConfig.createDefault();
  }

  // Configure date display
  if (argv.showDates) {
    const dateFormat = argv.dateFormat || 'absolute';
    options.dateDisplay = DateDisplayConfig.createForCLI();
    options.dateDisplay.update({ format: dateFormat });
  } else {
    options.dateDisplay = DateDisplayConfig.createDefault();
  }

  return options;
}

/**
 * Flattens sections into a single array of datasets
 * @private
 * @param {Object} sections - Sections object
 * @returns {Array} Flattened array of datasets
 */
function _flattenSections(sections) {
  const datasets = [];
  for (const [sectionName, sectionDatasets] of Object.entries(sections)) {
    sectionDatasets.forEach(dataset => {
      // Add section information to each dataset
      dataset.section = sectionName;
      datasets.push(dataset);
    });
  }
  return datasets;
}

/**
 * Creates structured export data
 * @private
 * @param {Array} datasets - Datasets to export
 * @param {Object} catalogMetadata - Catalog metadata
 * @param {Object} exportMetadata - Export metadata
 * @param {Object} argv - Command line arguments
 * @returns {Object} Structured export data
 */
function _createExportData(datasets, catalogMetadata, exportMetadata, argv) {
  const exportData = {
    datasets: datasets.map(dataset => _prepareDatasetForExport(dataset, argv)),
    metadata: exportMetadata
  };

  if (argv.includeMeta) {
    exportData.catalog = catalogMetadata;
  }

  return exportData;
}

/**
 * Prepares a dataset for export by selecting relevant fields
 * @private
 * @param {Dataset} dataset - Dataset to prepare
 * @param {Object} argv - Command line arguments
 * @returns {Object} Prepared dataset
 */
function _prepareDatasetForExport(dataset, argv) {
  const exportDataset = {
    id: dataset.id,
    title: dataset.title,
    description: dataset.description,
    section: dataset.section,
    creator: dataset.creator,
    dateCreated: dataset.dateCreated,
    metadataUrl: dataset.metadataUrl,
    projectPath: dataset.projectPath,
    isValid: dataset.isValid
  };

  // Add date information if requested
  if (argv.showDates && dataset.timestampAvailable) {
    exportDataset.lastModified = dataset.lastModified;
    exportDataset.lastModifiedDisplay = dataset.dateDisplay;
    exportDataset.lastModifiedRelative = dataset.relativeDisplay;
  }

  // Add deduplication information if applicable
  if (dataset.deduplicationInfo) {
    exportDataset.deduplicationInfo = dataset.deduplicationInfo;
  }

  // Add distribution information
  if (dataset.distribution && dataset.distribution.length > 0) {
    exportDataset.distributions = dataset.distribution.map(dist => ({
      name: dist.name,
      contentUrl: dist.contentUrl,
      encodingFormat: dist.encodingFormat,
      description: dist.description
    }));
    exportDataset.downloadCount = dataset.distribution.length;
  }

  return exportDataset;
}

/**
 * Converts export data to CSV format
 * @private
 * @param {Object} exportData - Data to convert
 * @param {Object} argv - Command line arguments
 * @returns {string} CSV data
 */
function _convertToCsv(exportData, argv) {
  const datasets = exportData.datasets;

  if (datasets.length === 0) {
    return 'No datasets to export';
  }

  // Define CSV headers based on available fields
  const headers = [
    'id', 'title', 'description', 'section', 'creator', 'dateCreated',
    'metadataUrl', 'projectPath', 'isValid', 'downloadCount'
  ];

  if (argv.showDates) {
    headers.push('lastModified', 'lastModifiedDisplay', 'lastModifiedRelative');
  }

  if (argv.deduplicate) {
    headers.push('isDuplicate', 'duplicateCount');
  }

  // Create CSV content
  const csvRows = [headers.join(',')];

  datasets.forEach(dataset => {
    const row = headers.map(header => {
      let value = '';

      if (header === 'isDuplicate') {
        value = dataset.deduplicationInfo?.isDuplicate || false;
      } else if (header === 'duplicateCount') {
        value = dataset.deduplicationInfo?.duplicateCount || 0;
      } else if (header === 'lastModified') {
        value = dataset.lastModified ? dataset.lastModified.toISOString() : '';
      } else {
        value = dataset[header] || '';
      }

      // Escape CSV value
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });

    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Converts export data to XLSX format (placeholder for Excel export)
 * @private
 * @param {Object} exportData - Data to convert
 * @param {Object} argv - Command line arguments
 * @returns {string} Message about XLSX support
 */
function _convertToXlsx(exportData, argv) {
  // In a real implementation, you would use a library like 'xlsx' or 'exceljs'
  // For now, return CSV format with a note
  console.log('⚠️  XLSX export not fully implemented. Exporting as CSV format...');
  return _convertToCsv(exportData, argv);
}

/**
 * Writes data to a file with proper error handling
 * @private
 * @param {string} outputPath - Output file path
 * @param {string} data - Data to write
 * @param {string} defaultExtension - Default file extension
 * @param {Object} argv - Command line arguments
 */
async function _writeToFile(outputPath, data, defaultExtension, argv) {
  // Ensure output path has correct extension
  if (!path.extname(outputPath)) {
    outputPath += defaultExtension;
  }

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(outputPath, data, 'utf8');
  console.log(`💾 Exported to: ${outputPath}`);
}

/**
 * Shows export summary
 * @private
 * @param {Object} exportMetadata - Export metadata
 * @param {string} outputPath - Output file path
 * @param {Object} argv - Command line arguments
 */
function _showExportSummary(exportMetadata, outputPath, argv) {
  console.log('\n📈 Export Summary');
  console.log('═'.repeat(30));
  console.log(`📊 Datasets exported: ${exportMetadata.totalDatasets}`);
  console.log(`🗂️  Sections included: ${exportMetadata.sectionsExported}`);
  console.log(`📁 Output file: ${outputPath}`);
  console.log(`📝 Format: ${argv.format.toUpperCase()}`);
  console.log(`⚡ Processing time: ${exportMetadata.processingTimeMs}ms`);

  if (exportMetadata.query) {
    console.log(`🔍 Filtered by: "${exportMetadata.query}"`);
  }

  if (argv.deduplicate) {
    console.log('🔄 Deduplication: Enabled');
  }

  if (argv.showDates) {
    console.log(`📅 Date format: ${argv.dateFormat}`);
  }
}

/**
 * Shows verbose export statistics
 * @private
 * @param {Object} exportMetadata - Export metadata
 * @param {Object} catalogMetadata - Catalog metadata
 * @param {Object} argv - Command line arguments
 */
function _showVerboseStatistics(exportMetadata, catalogMetadata, argv) {
  console.log('\n📈 Detailed Export Statistics');
  console.log('─'.repeat(30));
  console.log(`📊 Total catalog datasets: ${catalogMetadata.totalDatasets}`);
  console.log(`✅ Valid datasets: ${catalogMetadata.validDatasets}`);
  console.log(`❌ Invalid datasets: ${catalogMetadata.invalidDatasets}`);
  console.log(`📂 Datasets exported: ${exportMetadata.totalDatasets}`);

  const exportPercentage = catalogMetadata.totalDatasets > 0
    ? Math.round((exportMetadata.totalDatasets / catalogMetadata.totalDatasets) * 100)
    : 0;
  console.log(`📈 Export coverage: ${exportPercentage}% of catalog`);

  if (exportMetadata.searchMetadata) {
    console.log('\n🔍 Search Filter Details');
    console.log('─'.repeat(30));
    console.log(`🔍 Query: "${exportMetadata.query}"`);
    console.log(`📊 Original matches: ${exportMetadata.searchMetadata.originalResultCount || 'N/A'}`);
    if (exportMetadata.searchMetadata.deduplicationEnabled) {
      console.log(`🔄 Duplicates filtered: ${exportMetadata.searchMetadata.duplicatesInSearch || 0}`);
    }
  }

  if (catalogMetadata.deduplicationEnabled) {
    console.log('\n🔄 Catalog Deduplication');
    console.log('─'.repeat(30));
    console.log(`📋 Strategy: ${catalogMetadata.deduplicationConfig?.strategy || 'Unknown'}`);
    console.log(`🔤 Case sensitive: ${catalogMetadata.deduplicationConfig?.caseSensitive ? 'Yes' : 'No'}`);
    console.log(`📌 Keep latest: ${catalogMetadata.deduplicationConfig?.keepLatest ? 'Yes' : 'No'}`);
    console.log(`🔍 Total duplicates found: ${catalogMetadata.duplicatesFound}`);
    console.log(`🗑️  Total duplicates removed: ${catalogMetadata.duplicatesRemoved}`);
  }
}

/**
 * Defines command line argument configuration for the export command
 * @returns {Object} Yargs command configuration
 */
function getCommandConfig() {
  return {
    command: 'export [bucket]',
    describe: 'Export catalog datasets to various formats with enhanced filtering options',
    builder: (yargs) => {
      return yargs
        .positional('bucket', {
          describe: 'S3 bucket name',
          type: 'string',
          default: process.env.S3_BUCKET_NAME
        })
        .option('query', {
          alias: 'q',
          describe: 'Search query to filter exported datasets',
          type: 'string'
        })
        .option('show-dates', {
          alias: 'd',
          describe: 'Include S3 lastModified timestamps in export',
          type: 'boolean',
          default: false
        })
        .option('deduplicate', {
          alias: 'D',
          describe: 'Enable title-based deduplication for export',
          type: 'boolean',
          default: false
        })
        .option('date-format', {
          alias: 'f',
          describe: 'Date format for exported timestamps',
          choices: ['relative', 'absolute', 'both'],
          default: 'absolute'
        })
        .option('case-sensitive', {
          alias: 'c',
          describe: 'Use case-sensitive matching for deduplication',
          type: 'boolean',
          default: false
        })
        .option('format', {
          describe: 'Export format',
          choices: ['json', 'csv', 'xlsx'],
          default: 'json'
        })
        .option('output', {
          alias: 'o',
          describe: 'Output file path (prints to stdout if not specified)',
          type: 'string'
        })
        .option('include-meta', {
          alias: 'm',
          describe: 'Include catalog metadata in export',
          type: 'boolean',
          default: false
        })
        .option('compact', {
          describe: 'Compact JSON output (no formatting)',
          type: 'boolean',
          default: false
        })
        .option('verbose', {
          alias: 'v',
          describe: 'Show detailed export statistics',
          type: 'boolean',
          default: false
        })
        .option('endpoint', {
          alias: 'e',
          describe: 'S3 endpoint URL',
          type: 'string',
          default: process.env.S3_ENDPOINT
        })
        .example('$0 export --output catalog.json', 'Export all datasets to JSON file')
        .example('$0 export --query "climate" --format csv --output results.csv', 'Export filtered datasets to CSV')
        .example('$0 export --show-dates --deduplicate --format xlsx', 'Export with timestamps and deduplication to Excel')
        .example('$0 export --include-meta --verbose', 'Export with metadata and detailed statistics');
    },
    handler: exportData
  };
}

module.exports = { exportData, getCommandConfig };
