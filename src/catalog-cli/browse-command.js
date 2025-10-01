const { CatalogService } = require('../catalog-core/catalog-service');

async function browse(argv) {
  try {
    const catalogService = new CatalogService();
    const sections = await catalogService.loadCatalog();

    if (argv.format === 'json') {
      console.log(JSON.stringify(sections, null, 2));
    } else {
      console.log('--- S3 Dataset Catalog ---');
      if (sections.length === 0) {
        console.log('No datasets found.');
        return;
      }
      for (const [sectionName, datasets] of sections) {
        console.log(`\n[ ${sectionName.toUpperCase()} ]`);
        datasets.forEach(dataset => {
          console.log(`  - ${dataset.title}`);
          console.log(`    ${dataset.description || ''}`);
        });
      }
    }
  } catch (error) {
    console.error('Error browsing catalog:', error.message);
  }
}

module.exports = { browse };
