const { CatalogService } = require('../../src/catalog-core/catalog-service');

describe('Catalog Interface Contracts', () => {
  let catalogService;

  beforeAll(() => {
    // Environment variables for endpoint and bucket are used by default
    catalogService = new CatalogService();
  });

  test('/catalog/load should load the catalog', async () => {
    const sections = await catalogService.loadCatalog();
    expect(sections).toBeDefined();
    // More specific assertions would depend on the actual bucket content
  });

  test('/catalog/search should return search results', async () => {
    await catalogService.loadCatalog(); // Ensure index is built
    const results = catalogService.search('test');
    expect(results).toBeDefined();
    expect(results.sections).toBeDefined();
    expect(typeof results.totalResults).toBe('number');
  });

  test('/catalog/datasets should return all datasets', async () => {
    await catalogService.loadCatalog(); // Ensure index is built
    const datasets = catalogService.getDatasets();
    expect(datasets).toBeDefined();
  });
});
