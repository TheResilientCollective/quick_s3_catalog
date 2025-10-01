const { CatalogService } = require('../catalog-core/catalog-service');

async function search(argv) {
  try {
    const catalogService = new CatalogService();
    await catalogService.loadCatalog(); // Index must be built first
    const results = catalogService.search(argv.query);

    if (argv.format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`--- Search Results for "${argv.query}" (${results.totalResults} found) ---`);
      if (results.totalResults === 0) {
        console.log('No matching datasets found.');
        return;
      }
      for (const [sectionName, datasets] of Object.entries(results.sections)) {
        console.log(`\n[ ${sectionName.toUpperCase()} ]`);
        datasets.forEach(dataset => {
          console.log(`  - ${dataset.title}`);
          console.log(`    ${dataset.description || ''}`);
        });
      }
    }
  } catch (error) {
    console.error('Error searching catalog:', error.message);
  }
}

module.exports = { search };