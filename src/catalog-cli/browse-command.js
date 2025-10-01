const { CatalogService } = require('../catalog-core/catalog-service');
const { DeduplicationConfig } = require('../catalog-core/deduplication-config');
const { DateDisplayConfig } = require('../catalog-core/date-display-config');

/**
 * Enhanced browse command with date display and deduplication support
 * @param {Object} argv - Command line arguments
 * @param {boolean} argv.showDates - Show S3 lastModified timestamps
 * @param {boolean} argv.deduplicate - Enable title-based deduplication
 * @param {string} argv.dateFormat - Date format ('relative', 'absolute', 'both')
 * @param {boolean} argv.caseSensitive - Use case-sensitive deduplication
 * @param {string} argv.format - Output format ('text', 'json')
 * @param {boolean} argv.verbose - Show detailed statistics
 */
async function browse(argv) {
  try {
    // Create enhanced catalog service with configuration options
    const catalogOptions = _buildCatalogOptions(argv);
    const catalogService = new CatalogService(argv.bucketName, catalogOptions);

    console.log('🔄 Loading S3 dataset catalog...');
    const startTime = Date.now();

    const catalogResponse = await catalogService.loadCatalog();
    const { sections, metadata } = catalogResponse;

    const loadTime = Date.now() - startTime;

    if (argv.format === 'json') {
      _outputJSON(catalogResponse, argv);
    } else {
      _outputText(sections, metadata, argv, loadTime);
    }

    // Show verbose statistics if requested
    if (argv.verbose) {
      _outputStatistics(metadata, argv);
    }

  } catch (error) {
    console.error('❌ Error browsing catalog:', error.message);
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
    const dateFormat = argv.dateFormat || 'relative';
    options.dateDisplay = DateDisplayConfig.createForCLI();
    options.dateDisplay.update({ format: dateFormat });
  } else {
    options.dateDisplay = DateDisplayConfig.createDefault();
  }

  return options;
}

/**
 * Outputs catalog in JSON format
 * @private
 * @param {Object} catalogResponse - Full catalog response
 * @param {Object} argv - Command line arguments
 */
function _outputJSON(catalogResponse, argv) {
  if (argv.compact) {
    console.log(JSON.stringify(catalogResponse));
  } else {
    console.log(JSON.stringify(catalogResponse, null, 2));
  }
}

/**
 * Outputs catalog in human-readable text format
 * @private
 * @param {Object} sections - Dataset sections
 * @param {Object} metadata - Catalog metadata
 * @param {Object} argv - Command line arguments
 * @param {number} loadTime - Time taken to load catalog
 */
function _outputText(sections, metadata, argv, loadTime) {
  console.log('\n📊 S3 Dataset Catalog');
  console.log('═'.repeat(50));

  // Show loading statistics
  console.log(`⚡ Loaded in ${loadTime}ms`);
  console.log(`📁 Total datasets: ${metadata.totalDatasets}`);

  if (metadata.deduplicationEnabled) {
    console.log(`🔄 Deduplication: ${metadata.duplicatesRemoved} duplicates removed`);
  }

  if (argv.showDates) {
    console.log(`📅 Date format: ${argv.dateFormat || 'relative'}`);
  }

  // Show sections
  if (Object.keys(sections).length === 0) {
    console.log('\n📭 No datasets found.');
    return;
  }

  for (const [sectionName, datasets] of Object.entries(sections)) {
    console.log(`\n🗂️  [ ${sectionName.toUpperCase()} ] (${datasets.length} datasets)`);

    datasets.forEach(dataset => {
      _renderDataset(dataset, argv);
    });
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Browse complete - ${Object.keys(sections).length} sections, ${metadata.totalDatasets} datasets`);
}

/**
 * Renders a single dataset in text format
 * @private
 * @param {Dataset} dataset - Dataset to render
 * @param {Object} argv - Command line arguments
 */
function _renderDataset(dataset, argv) {
  let title = `📄 ${dataset.title}`;

  // Add deduplication indicator
  if (dataset.deduplicationInfo && !dataset.deduplicationInfo.isDuplicate) {
    const { duplicateCount } = dataset.deduplicationInfo;
    if (duplicateCount > 1) {
      const removed = duplicateCount - 1;
      title += ` 📌 (${removed} duplicate${removed > 1 ? 's' : ''} removed)`;
    }
  }

  console.log(`  ${title}`);

  if (dataset.description) {
    console.log(`    💬 ${dataset.description}`);
  }

  // Show date information if requested
  if (argv.showDates && dataset.timestampAvailable) {
    const dateInfo = dataset.dateDisplay || dataset.lastModified?.toLocaleString() || 'Unknown';
    console.log(`    📅 Last modified: ${dateInfo}`);
  }

  // Show creator and creation date
  if (dataset.creator || dataset.dateCreated) {
    const creatorInfo = dataset.creator || 'Unknown';
    const createdInfo = dataset.dateCreated ? new Date(dataset.dateCreated).toLocaleDateString() : 'Unknown';
    console.log(`    👤 ${creatorInfo} | Created: ${createdInfo}`);
  }

  // Show download links
  if (dataset.distribution && dataset.distribution.length > 0) {
    console.log(`    🔗 ${dataset.distribution.length} download${dataset.distribution.length > 1 ? 's' : ''} available`);
    if (argv.verbose) {
      dataset.distribution.forEach(dist => {
        console.log(`      - ${dist.name || dist.encodingFormat || 'Download'} (${dist.encodingFormat || 'N/A'})`);
      });
    }
  }

  console.log(''); // Empty line between datasets
}

/**
 * Outputs detailed statistics
 * @private
 * @param {Object} metadata - Catalog metadata
 * @param {Object} argv - Command line arguments
 */
function _outputStatistics(metadata, argv) {
  console.log('\n📈 Detailed Statistics');
  console.log('─'.repeat(30));
  console.log(`📊 Total objects in bucket: ${metadata.bucketInfo?.totalObjects || 'Unknown'}`);
  console.log(`📄 Metadata files found: ${metadata.bucketInfo?.metadataFiles || 'Unknown'}`);
  console.log(`✅ Valid datasets: ${metadata.validDatasets}`);
  console.log(`❌ Invalid datasets: ${metadata.invalidDatasets}`);
  console.log(`⚡ Processing time: ${Math.round(metadata.processingTimeMs || 0)}ms`);
  console.log(`🏷️  Bucket: ${metadata.bucketInfo?.name || 'Unknown'}`);

  if (metadata.deduplicationEnabled) {
    console.log('\n🔄 Deduplication Details');
    console.log('─'.repeat(30));
    console.log(`📋 Strategy: ${metadata.deduplicationConfig?.strategy || 'Unknown'}`);
    console.log(`🔤 Case sensitive: ${metadata.deduplicationConfig?.caseSensitive ? 'Yes' : 'No'}`);
    console.log(`📌 Keep latest: ${metadata.deduplicationConfig?.keepLatest ? 'Yes' : 'No'}`);
    console.log(`🔍 Duplicates found: ${metadata.duplicatesFound}`);
    console.log(`🗑️  Duplicates removed: ${metadata.duplicatesRemoved}`);
  }

  if (argv.showDates) {
    console.log('\n📅 Date Display Configuration');
    console.log('─'.repeat(30));
    console.log(`📝 Format: ${metadata.dateDisplayConfig?.format || 'Unknown'}`);
    console.log(`🕐 Show time: ${metadata.dateDisplayConfig?.showTime ? 'Yes' : 'No'}`);
    console.log(`🌍 Locale: ${metadata.dateDisplayConfig?.locale || 'Unknown'}`);
    console.log(`🕒 Timezone: ${metadata.dateDisplayConfig?.timezone || 'Unknown'}`);
  }
}

/**
 * Defines command line argument configuration for the browse command
 * @returns {Object} Yargs command configuration
 */
function getCommandConfig() {
  return {
    command: 'browse [bucket]',
    describe: 'Browse and display datasets in the S3 catalog with enhanced filtering options',
    builder: (yargs) => {
      return yargs
        .positional('bucket', {
          describe: 'S3 bucket name',
          type: 'string',
          default: process.env.S3_BUCKET_NAME
        })
        .option('show-dates', {
          alias: 'd',
          describe: 'Show S3 lastModified timestamps for datasets',
          type: 'boolean',
          default: false
        })
        .option('deduplicate', {
          alias: 'D',
          describe: 'Enable title-based deduplication (show only latest versions)',
          type: 'boolean',
          default: false
        })
        .option('date-format', {
          alias: 'f',
          describe: 'Date display format',
          choices: ['relative', 'absolute', 'both'],
          default: 'relative'
        })
        .option('case-sensitive', {
          alias: 'c',
          describe: 'Use case-sensitive matching for deduplication',
          type: 'boolean',
          default: false
        })
        .option('format', {
          describe: 'Output format',
          choices: ['text', 'json'],
          default: 'text'
        })
        .option('compact', {
          describe: 'Compact JSON output (no formatting)',
          type: 'boolean',
          default: false,
          implies: { format: 'json' }
        })
        .option('verbose', {
          alias: 'v',
          describe: 'Show detailed statistics and information',
          type: 'boolean',
          default: false
        })
        .option('endpoint', {
          alias: 'e',
          describe: 'S3 endpoint URL',
          type: 'string',
          default: process.env.S3_ENDPOINT
        })
        .example('$0 browse', 'Browse all datasets in the default bucket')
        .example('$0 browse --show-dates --deduplicate', 'Browse with timestamps and deduplication enabled')
        .example('$0 browse --date-format both --verbose', 'Browse with both date formats and detailed stats')
        .example('$0 browse --format json --compact', 'Output as compact JSON');
    },
    handler: browse
  };
}

module.exports = { browse, getCommandConfig };
