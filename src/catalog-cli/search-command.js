const { CatalogService } = require('../catalog-core/catalog-service');
const { DeduplicationConfig } = require('../catalog-core/deduplication-config');
const { DateDisplayConfig } = require('../catalog-core/date-display-config');

/**
 * Enhanced search command with date display and deduplication support
 * @param {Object} argv - Command line arguments
 * @param {string} argv.query - Search query
 * @param {boolean} argv.showDates - Show S3 lastModified timestamps
 * @param {boolean} argv.deduplicate - Enable title-based deduplication
 * @param {string} argv.dateFormat - Date format ('relative', 'absolute', 'both')
 * @param {boolean} argv.caseSensitive - Use case-sensitive deduplication
 * @param {string} argv.format - Output format ('text', 'json')
 * @param {boolean} argv.verbose - Show detailed search statistics
 */
async function search(argv) {
  try {
    // Create enhanced catalog service with configuration options
    const catalogOptions = _buildCatalogOptions(argv);
    const catalogService = new CatalogService(argv.bucketName, catalogOptions);

    console.log(`🔍 Searching for "${argv.query}"...`);
    const startTime = Date.now();

    // Load catalog first (required for search)
    const catalogResponse = await catalogService.loadCatalog();
    const catalogMetadata = catalogResponse.metadata;

    // Perform enhanced search
    const searchResults = catalogService.search(argv.query, {
      deduplicate: argv.deduplicate
    });

    const searchTime = Date.now() - startTime;

    if (argv.format === 'json') {
      _outputJSON(searchResults, catalogMetadata, argv);
    } else {
      _outputText(searchResults, catalogMetadata, argv, searchTime);
    }

    // Show verbose search statistics if requested
    if (argv.verbose) {
      _outputSearchStatistics(searchResults, catalogMetadata, argv);
    }

  } catch (error) {
    console.error('❌ Error searching catalog:', error.message);
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
 * Outputs search results in JSON format
 * @private
 * @param {Object} searchResults - Search results
 * @param {Object} catalogMetadata - Catalog metadata
 * @param {Object} argv - Command line arguments
 */
function _outputJSON(searchResults, catalogMetadata, argv) {
  const output = {
    query: argv.query,
    results: searchResults,
    catalog: catalogMetadata,
    searchOptions: {
      showDates: argv.showDates,
      deduplicate: argv.deduplicate,
      dateFormat: argv.dateFormat,
      caseSensitive: argv.caseSensitive
    }
  };

  if (argv.compact) {
    console.log(JSON.stringify(output));
  } else {
    console.log(JSON.stringify(output, null, 2));
  }
}

/**
 * Outputs search results in human-readable text format
 * @private
 * @param {Object} searchResults - Search results
 * @param {Object} catalogMetadata - Catalog metadata
 * @param {Object} argv - Command line arguments
 * @param {number} searchTime - Time taken for search operation
 */
function _outputText(searchResults, catalogMetadata, argv, searchTime) {
  console.log('\n🔍 Search Results');
  console.log('═'.repeat(50));

  // Show search summary
  console.log(`📝 Query: "${argv.query}"`);
  console.log(`⚡ Search completed in ${searchTime}ms`);
  console.log(`📊 Found: ${searchResults.totalResults} datasets`);

  // Show search-specific metadata if available
  if (searchResults.metadata) {
    if (searchResults.metadata.deduplicationEnabled) {
      console.log(`🔄 Deduplication: ${searchResults.metadata.duplicatesInSearch || 0} duplicates filtered from results`);
    }
    if (searchResults.metadata.originalResultCount && searchResults.metadata.originalResultCount !== searchResults.totalResults) {
      console.log(`📈 Original matches: ${searchResults.metadata.originalResultCount}`);
    }
  }

  if (argv.showDates) {
    console.log(`📅 Date format: ${argv.dateFormat || 'relative'}`);
  }

  // Show search results
  if (searchResults.totalResults === 0) {
    console.log('\n📭 No matching datasets found.');

    // Provide search suggestions
    if (argv.deduplicate) {
      console.log('💡 Try searching without deduplication: --no-deduplicate');
    }
    if (argv.caseSensitive) {
      console.log('💡 Try case-insensitive search: --no-case-sensitive');
    }

    return;
  }

  for (const [sectionName, datasets] of Object.entries(searchResults.sections)) {
    console.log(`\n🗂️  [ ${sectionName.toUpperCase()} ] (${datasets.length} matches)`);

    datasets.forEach(dataset => {
      _renderSearchResult(dataset, argv.query, argv);
    });
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Search complete - ${searchResults.totalResults} matches in ${Object.keys(searchResults.sections).length} sections`);
}

/**
 * Renders a single search result in text format
 * @private
 * @param {Dataset} dataset - Dataset search result
 * @param {string} query - Original search query
 * @param {Object} argv - Command line arguments
 */
function _renderSearchResult(dataset, query, argv) {
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

  // Highlight search matches in description
  if (dataset.description) {
    const highlightedDescription = _highlightSearchTerms(dataset.description, query);
    console.log(`    💬 ${highlightedDescription}`);
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

  // Show download count
  if (dataset.distribution && dataset.distribution.length > 0) {
    console.log(`    🔗 ${dataset.distribution.length} download${dataset.distribution.length > 1 ? 's' : ''} available`);
  }

  // Show relevance information if available
  if (dataset.searchScore !== undefined) {
    console.log(`    📈 Relevance: ${Math.round(dataset.searchScore * 100)}%`);
  }

  console.log(''); // Empty line between results
}

/**
 * Highlights search terms in text (simple implementation)
 * @private
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} Text with highlighted terms
 */
function _highlightSearchTerms(text, query) {
  // Simple highlighting - in a real CLI, you might use colors
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  let highlighted = text;

  searchTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '**$1**');
  });

  return highlighted;
}

/**
 * Outputs detailed search statistics
 * @private
 * @param {Object} searchResults - Search results
 * @param {Object} catalogMetadata - Catalog metadata
 * @param {Object} argv - Command line arguments
 */
function _outputSearchStatistics(searchResults, catalogMetadata, argv) {
  console.log('\n📈 Search Statistics');
  console.log('─'.repeat(30));
  console.log(`🔍 Search query: "${argv.query}"`);
  console.log(`📊 Total matches: ${searchResults.totalResults}`);
  console.log(`🗂️  Sections with matches: ${Object.keys(searchResults.sections).length}`);

  if (searchResults.metadata) {
    if (searchResults.metadata.deduplicationEnabled) {
      console.log(`🔄 Duplicates in search: ${searchResults.metadata.duplicatesInSearch || 0}`);
      console.log(`📈 Original match count: ${searchResults.metadata.originalResultCount || 0}`);
    }
  }

  console.log('\n📊 Catalog Statistics');
  console.log('─'.repeat(30));
  console.log(`📄 Total datasets in catalog: ${catalogMetadata.totalDatasets}`);
  console.log(`✅ Valid datasets: ${catalogMetadata.validDatasets}`);
  console.log(`❌ Invalid datasets: ${catalogMetadata.invalidDatasets}`);
  console.log(`🏷️  Bucket: ${catalogMetadata.bucketInfo?.name || 'Unknown'}`);

  if (catalogMetadata.deduplicationEnabled) {
    console.log('\n🔄 Deduplication Details');
    console.log('─'.repeat(30));
    console.log(`📋 Strategy: ${catalogMetadata.deduplicationConfig?.strategy || 'Unknown'}`);
    console.log(`🔤 Case sensitive: ${catalogMetadata.deduplicationConfig?.caseSensitive ? 'Yes' : 'No'}`);
    console.log(`📌 Keep latest: ${catalogMetadata.deduplicationConfig?.keepLatest ? 'Yes' : 'No'}`);
    console.log(`🔍 Total duplicates found: ${catalogMetadata.duplicatesFound}`);
    console.log(`🗑️  Total duplicates removed: ${catalogMetadata.duplicatesRemoved}`);
  }

  // Show search effectiveness
  const effectivenessPercentage = catalogMetadata.totalDatasets > 0
    ? Math.round((searchResults.totalResults / catalogMetadata.totalDatasets) * 100)
    : 0;
  console.log(`\n🎯 Search effectiveness: ${effectivenessPercentage}% of catalog matched`);
}

/**
 * Defines command line argument configuration for the search command
 * @returns {Object} Yargs command configuration
 */
function getCommandConfig() {
  return {
    command: 'search <query> [bucket]',
    describe: 'Search datasets in the S3 catalog with enhanced filtering and display options',
    builder: (yargs) => {
      return yargs
        .positional('query', {
          describe: 'Search query (searches titles and descriptions)',
          type: 'string'
        })
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
          describe: 'Enable title-based deduplication in search results',
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
          describe: 'Show detailed search and catalog statistics',
          type: 'boolean',
          default: false
        })
        .option('endpoint', {
          alias: 'e',
          describe: 'S3 endpoint URL',
          type: 'string',
          default: process.env.S3_ENDPOINT
        })
        .example('$0 search "data"', 'Search for datasets containing "data"')
        .example('$0 search "climate" --show-dates --deduplicate', 'Search with timestamps and deduplication')
        .example('$0 search "analysis" --date-format both --verbose', 'Search with detailed output and both date formats')
        .example('$0 search "weather" --format json --compact', 'Search and output as compact JSON');
    },
    handler: search
  };
}

module.exports = { search, getCommandConfig };