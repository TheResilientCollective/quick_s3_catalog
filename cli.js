#!/usr/bin/env node

/**
 * Enhanced S3 Dataset Catalog CLI
 * Provides browse, search, and export commands with advanced features:
 * - S3 lastModified timestamp display
 * - Title-based deduplication
 * - Configurable date formatting
 * - Enhanced search and filtering
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import enhanced command configurations
const { getCommandConfig: getBrowseConfig } = require('./src/catalog-cli/browse-command');
const { getCommandConfig: getSearchConfig } = require('./src/catalog-cli/search-command');
const { getCommandConfig: getExportConfig } = require('./src/catalog-cli/export-command');

// CLI metadata
const CLI_VERSION = '2.0.0';
const CLI_DESCRIPTION = 'Enhanced S3 Dataset Catalog CLI with timestamp display and deduplication features';

// Build enhanced CLI with full command configurations
const cli = yargs(hideBin(process.argv))
  .scriptName('s3-catalog')
  .version(CLI_VERSION)
  .description(CLI_DESCRIPTION)
  .usage('\n🚀 Enhanced S3 Dataset Catalog CLI\n\nUsage: $0 <command> [options]')

  // Global options that apply to all commands
  .option('verbose', {
    alias: 'v',
    describe: 'Show detailed output and debug information',
    type: 'boolean',
    global: true
  })
  .option('endpoint', {
    alias: 'e',
    describe: 'S3 endpoint URL (can also use S3_ENDPOINT env var)',
    type: 'string',
    global: true,
    default: process.env.S3_ENDPOINT
  })
  .option('bucket', {
    alias: 'b',
    describe: 'S3 bucket name (can also use S3_BUCKET_NAME env var)',
    type: 'string',
    global: true,
    default: process.env.S3_BUCKET_NAME
  })

  // Enhanced commands with full configurations
  .command(getBrowseConfig())
  .command(getSearchConfig())
  .command(getExportConfig())

  // Additional global configurations
  .demandCommand(1, 'You need to provide a command. Use --help to see available commands.')
  .strict()
  .help('help')
  .alias('help', 'h')
  .alias('version', 'V')
  .wrap(Math.min(120, yargs.terminalWidth()))

  // Enhanced examples
  .example('$0 browse --show-dates --deduplicate', 'Browse with timestamps and deduplication')
  .example('$0 search "climate" --verbose', 'Search for climate datasets with detailed output')
  .example('$0 export --query "data" --format csv --output results.csv', 'Export filtered datasets to CSV')

  // Enhanced epilogue with feature information
  .epilogue(`
🌟 Enhanced Features:
   📅 --show-dates     Display S3 lastModified timestamps on dataset cards
   🔄 --deduplicate    Remove duplicate datasets (keep latest versions)
   📝 --date-format    Choose relative, absolute, or both timestamp formats
   🔤 --case-sensitive Configure case-sensitive title matching for deduplication
   📊 --verbose        Show detailed statistics and processing information

🔧 Configuration:
   Set S3_ENDPOINT and S3_BUCKET_NAME environment variables for default connection.
   Example: export S3_ENDPOINT=https://oss.resilientservice.mooo.com
            export S3_BUCKET_NAME=resilentpublic

💡 Tips:
   - Use --verbose for debugging connection issues
   - Combine --show-dates with --date-format both for full timestamp info
   - Enable --deduplicate to clean up duplicate datasets automatically
   - Export with --include-meta to get full catalog metadata

📚 Documentation: https://github.com/your-org/s3-dataset-catalog
🐛 Issues: https://github.com/your-org/s3-dataset-catalog/issues
`)

  // Error handling
  .fail((msg, err, yargs) => {
    if (err) {
      console.error('❌ Fatal Error:', err.message);
      if (process.env.NODE_ENV === 'development' || process.argv.includes('--verbose')) {
        console.error('\nStack trace:');
        console.error(err.stack);
      }
    } else {
      console.error('❌ Command Error:', msg);
    }
    console.error('\n💡 Use --help for command usage information');
    process.exit(1);
  })

  // Show help when no command provided
  .showHelpOnFail(true, '💡 Specify --help for available options');

// Parse arguments and execute commands
cli.argv;