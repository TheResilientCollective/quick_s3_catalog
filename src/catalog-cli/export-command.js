const fs = require('fs');
const { CatalogService } = require('../catalog-core/catalog-service');

function convertToCsv(datasets) {
  if (datasets.length === 0) {
    return '';
  }
  const headers = Object.keys(datasets[0]);
  const rows = datasets.map(d => {
    return headers.map(h => {
      let val = d[h] || '';
      val = `"${String(val).replace(/"/g, '""')}"`;
      return val;
    }).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

async function exportData(argv) {
  try {
    const catalogService = new CatalogService();
    await catalogService.loadCatalog();

    let datasetsToExport;
    if (argv.query) {
      const searchResult = catalogService.search(argv.query);
      datasetsToExport = searchResult.sections.values;
    } else {
      const allSections = catalogService.getDatasets();
      datasetsToExport = allSections.values;
    }

    let outputData;
    if (argv.format === 'csv') {
      outputData = convertToCsv(datasetsToExport);
    } else {
      outputData = JSON.stringify(datasetsToExport, null, 2);
    }

    if (argv.output) {
      fs.writeFileSync(argv.output, outputData);
      console.log(`Successfully exported ${datasetsToExport.length} datasets to ${argv.output}`);
    } else {
      // Print to stdout if no output file is specified
      console.log(outputData);
    }

  } catch (error) {
    console.error('Error exporting catalog:', error.message);
  }
}

module.exports = { exportData };
