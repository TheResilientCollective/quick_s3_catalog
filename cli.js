#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { browse } = require('./src/catalog-cli/browse-command');
const { search } = require('./src/catalog-cli/search-command');
const { exportData } = require('./src/catalog-cli/export-command');

yargs(hideBin(process.argv))
  .command('browse', 'Browse all datasets in the catalog', (yargs) => {
    return yargs
      .option('format', {
        alias: 'f',
        describe: 'Output format (json or text)',
        default: 'text',
        type: 'string'
      });
  }, (argv) => {
    browse(argv);
  })
  .command('search <query>', 'Search for datasets', (yargs) => {
    return yargs
      .positional('query', {
        describe: 'Text to search for in dataset titles and descriptions',
        type: 'string'
      })
      .option('format', {
        alias: 'f',
        describe: 'Output format (json or text)',
        default: 'text',
        type: 'string'
      });
  }, (argv) => {
    search(argv);
  })
  .command('export [output]', 'Export catalog data to a file', (yargs) => {
    return yargs
      .positional('output', {
        describe: 'File path to save the exported data. If omitted, prints to stdout.',
        type: 'string'
      })
      .option('query', {
        alias: 'q',
        describe: 'Optional search query to filter the export.',
        type: 'string'
      })
      .option('format', {
        alias: 'f',
        describe: 'Export format (json or csv)',
        default: 'json',
        type: 'string'
      });
  }, (argv) => {
    exportData(argv);
  })
  .demandCommand(1, 'You need to provide a command: browse, search, or export.')
  .help()
  .alias('help', 'h')
  .argv;