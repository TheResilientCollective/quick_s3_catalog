/**
 * Integration Test: Title-Based Deduplication Scenario
 * Tests end-to-end deduplication of datasets with same title, keeping latest by lastModified
 * This test MUST FAIL until title-based deduplication feature is implemented
 */

const { CatalogService } = require('../../src/catalog-core/browser/catalog-service');

describe('Title-Based Deduplication Integration', () => {
  let catalogService;
  let catalogServiceWithDedup;

  beforeEach(() => {
    catalogService = new CatalogService('test-bucket', {
      endpoint: 'https://test-endpoint.com'
    });

    catalogServiceWithDedup = new CatalogService('test-bucket', {
      endpoint: 'https://test-endpoint.com',
      deduplication: {
        enabled: true,
        strategy: 'title-based',
        keepLatest: true
      }
    });
  });

  describe('Deduplication Logic', () => {
    test('should identify duplicate datasets by title', async () => {
      // This test will FAIL until deduplication logic is implemented
      const response = await catalogServiceWithDedup.loadCatalog();

      expect(response).toBeDefined();
      expect(response.sections).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.deduplicationEnabled).toBe(true);

      // Should have metadata about deduplication process
      if (response.metadata.duplicatesFound !== undefined) {
        expect(typeof response.metadata.duplicatesFound).toBe('number');
        expect(response.metadata.duplicatesFound).toBeGreaterThanOrEqual(0);
      }

      if (response.metadata.duplicatesRemoved !== undefined) {
        expect(typeof response.metadata.duplicatesRemoved).toBe('number');
        expect(response.metadata.duplicatesRemoved).toBeGreaterThanOrEqual(0);
      }

      // Test that deduplication actually occurred
      const allDatasets = [];
      for (const sectionKey of Object.keys(response.sections)) {
        allDatasets.push(...response.sections[sectionKey]);
      }

      // No duplicate titles should exist in deduplicated results
      const titles = allDatasets.map(dataset => dataset.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });

    test('should keep the latest version when deduplicating', async () => {
      // This test will FAIL until keep-latest logic is implemented
      const responseWithoutDedup = await catalogService.loadCatalog();
      const responseWithDedup = await catalogServiceWithDedup.loadCatalog();

      expect(responseWithoutDedup).toBeDefined();
      expect(responseWithDedup).toBeDefined();

      // Find datasets with same title in non-deduplicated results
      const allDatasetsOriginal = [];
      for (const sectionKey of Object.keys(responseWithoutDedup.sections)) {
        allDatasetsOriginal.push(...responseWithoutDedup.sections[sectionKey]);
      }

      const titleGroups = {};
      allDatasetsOriginal.forEach(dataset => {
        const normalizedTitle = dataset.title.toLowerCase().trim();
        if (!titleGroups[normalizedTitle]) {
          titleGroups[normalizedTitle] = [];
        }
        titleGroups[normalizedTitle].push(dataset);
      });

      // Find title groups with duplicates
      const duplicateGroups = Object.entries(titleGroups)
        .filter(([_, datasets]) => datasets.length > 1);

      if (duplicateGroups.length > 0) {
        // Check deduplicated results
        const allDatasetsDeduped = [];
        for (const sectionKey of Object.keys(responseWithDedup.sections)) {
          allDatasetsDeduped.push(...responseWithDedup.sections[sectionKey]);
        }

        duplicateGroups.forEach(([title, originalDatasets]) => {
          // Should only have one dataset with this title in deduplicated results
          const dedupedDatasets = allDatasetsDeduped.filter(
            dataset => dataset.title.toLowerCase().trim() === title
          );
          expect(dedupedDatasets.length).toBe(1);

          // Should be the one with latest lastModified timestamp
          const latestOriginal = originalDatasets.reduce((latest, current) => {
            const latestTime = new Date(latest.lastModified).getTime();
            const currentTime = new Date(current.lastModified).getTime();
            return currentTime > latestTime ? current : latest;
          });

          const keptDataset = dedupedDatasets[0];
          expect(keptDataset.id).toBe(latestOriginal.id);
          expect(keptDataset.lastModified).toBe(latestOriginal.lastModified);
        });
      }
    });

    test('should mark removed duplicates with metadata', async () => {
      // This test will FAIL until duplicate tracking is implemented
      const response = await catalogServiceWithDedup.loadCatalog();

      expect(response).toBeDefined();

      // Should have information about what was removed
      if (response.metadata.removedDuplicates) {
        expect(Array.isArray(response.metadata.removedDuplicates)).toBe(true);

        response.metadata.removedDuplicates.forEach(removed => {
          expect(removed).toHaveProperty('id');
          expect(removed).toHaveProperty('title');
          expect(removed).toHaveProperty('lastModified');
          expect(removed).toHaveProperty('keptInsteadId');
          expect(typeof removed.id).toBe('string');
          expect(typeof removed.title).toBe('string');
          expect(typeof removed.keptInsteadId).toBe('string');
        });
      }
    });
  });

  describe('Configuration Options', () => {
    test('should support case-sensitive deduplication', async () => {
      // This test will FAIL until case sensitivity option is implemented
      const caseSensitiveService = new CatalogService('test-bucket', {
        endpoint: 'https://test-endpoint.com',
        deduplication: {
          enabled: true,
          strategy: 'title-based',
          keepLatest: true,
          caseSensitive: true
        }
      });

      const response = await caseSensitiveService.loadCatalog();
      expect(response).toBeDefined();
      expect(response.metadata.deduplicationEnabled).toBe(true);

      if (response.metadata.deduplicationConfig) {
        expect(response.metadata.deduplicationConfig.caseSensitive).toBe(true);
      }

      // With case-sensitive deduplication, "Climate Data" and "climate data"
      // should be treated as different datasets
      const allDatasets = [];
      for (const sectionKey of Object.keys(response.sections)) {
        allDatasets.push(...response.sections[sectionKey]);
      }

      // Find datasets that would be duplicates in case-insensitive mode
      const titleVariations = {};
      allDatasets.forEach(dataset => {
        const lowerTitle = dataset.title.toLowerCase();
        if (!titleVariations[lowerTitle]) {
          titleVariations[lowerTitle] = [];
        }
        titleVariations[lowerTitle].push(dataset.title);
      });

      // If there are case variations, they should be preserved
      Object.values(titleVariations).forEach(variations => {
        const uniqueCaseVariations = [...new Set(variations)];
        if (uniqueCaseVariations.length > 1) {
          // All case variations should be present (not deduplicated)
          expect(variations.length).toBe(uniqueCaseVariations.length);
        }
      });
    });

    test('should support disabling deduplication', async () => {
      // This test will FAIL until deduplication toggle is implemented
      const noDeduplicationService = new CatalogService('test-bucket', {
        endpoint: 'https://test-endpoint.com',
        deduplication: {
          enabled: false
        }
      });

      const response = await noDeduplicationService.loadCatalog();
      expect(response).toBeDefined();
      expect(response.metadata.deduplicationEnabled).toBe(false);

      // Should have same results as service without deduplication config
      const responseDefault = await catalogService.loadCatalog();

      const datasetsNoDedup = [];
      for (const sectionKey of Object.keys(response.sections)) {
        datasetsNoDedup.push(...response.sections[sectionKey]);
      }

      const datasetsDefault = [];
      for (const sectionKey of Object.keys(responseDefault.sections)) {
        datasetsDefault.push(...responseDefault.sections[sectionKey]);
      }

      expect(datasetsNoDedup.length).toBe(datasetsDefault.length);
    });
  });

  describe('Edge Cases', () => {
    test('should handle datasets with identical timestamps', async () => {
      // This test will FAIL until timestamp tie-breaking is implemented
      const response = await catalogServiceWithDedup.loadCatalog();

      expect(response).toBeDefined();

      // When datasets have identical titles AND timestamps, should have deterministic behavior
      // This could happen if multiple files were uploaded simultaneously
      if (response.metadata.timestampTies !== undefined) {
        expect(typeof response.metadata.timestampTies).toBe('number');
        expect(response.metadata.timestampTies).toBeGreaterThanOrEqual(0);
      }

      // Should still result in only one dataset per unique title
      const allDatasets = [];
      for (const sectionKey of Object.keys(response.sections)) {
        allDatasets.push(...response.sections[sectionKey]);
      }

      const titles = allDatasets.map(dataset => dataset.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });

    test('should handle empty or null titles gracefully', async () => {
      // This test will FAIL until null title handling is implemented
      const response = await catalogServiceWithDedup.loadCatalog();

      expect(response).toBeDefined();

      const allDatasets = [];
      for (const sectionKey of Object.keys(response.sections)) {
        allDatasets.push(...response.sections[sectionKey]);
      }

      // All datasets should have valid, non-empty titles
      allDatasets.forEach(dataset => {
        expect(dataset).toHaveProperty('title');
        expect(typeof dataset.title).toBe('string');
        expect(dataset.title.trim().length).toBeGreaterThan(0);
      });

      // Should have handled any null/undefined titles appropriately
      if (response.metadata.invalidTitlesHandled !== undefined) {
        expect(typeof response.metadata.invalidTitlesHandled).toBe('number');
        expect(response.metadata.invalidTitlesHandled).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle datasets without lastModified timestamps', async () => {
      // This test will FAIL until missing timestamp handling is implemented
      const response = await catalogServiceWithDedup.loadCatalog();

      expect(response).toBeDefined();

      // Should have metadata about datasets without timestamps
      if (response.metadata.datasetsWithoutTimestamps !== undefined) {
        expect(typeof response.metadata.datasetsWithoutTimestamps).toBe('number');
        expect(response.metadata.datasetsWithoutTimestamps).toBeGreaterThanOrEqual(0);
      }

      const allDatasets = [];
      for (const sectionKey of Object.keys(response.sections)) {
        allDatasets.push(...response.sections[sectionKey]);
      }

      // Datasets without timestamps should either:
      // 1. Be excluded from deduplication (kept separately)
      // 2. Use fallback timestamp (file discovery time, etc.)
      allDatasets.forEach(dataset => {
        if (dataset.lastModified === undefined || dataset.lastModified === null) {
          // Should have fallback timestamp or be marked as non-deduplicated
          expect(dataset).toHaveProperty('deduplicationStatus');
          expect(['excluded', 'fallback-timestamp'].includes(dataset.deduplicationStatus)).toBe(true);
        }
      });
    });
  });

  describe('Performance with Deduplication', () => {
    test('should maintain reasonable performance with large datasets', async () => {
      // This test will FAIL until performance optimization is implemented
      const startTime = performance.now();

      const response = await catalogServiceWithDedup.loadCatalog();

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(response).toBeDefined();

      // Should complete within reasonable time even with deduplication
      // Allow extra time for deduplication processing (8 seconds vs 5 for non-dedup)
      expect(loadTime).toBeLessThan(8000);

      const totalDatasets = Object.values(response.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);

      // Should still return meaningful number of datasets
      expect(totalDatasets).toBeGreaterThan(0);

      if (response.metadata.deduplicationPerformance) {
        const perfMetrics = response.metadata.deduplicationPerformance;
        expect(perfMetrics).toHaveProperty('processingTimeMs');
        expect(typeof perfMetrics.processingTimeMs).toBe('number');
        expect(perfMetrics.processingTimeMs).toBeGreaterThan(0);
      }
    });
  });

  describe('Backward Compatibility', () => {
    test('should not break existing catalog functionality', async () => {
      // This test will FAIL until backward compatibility is ensured
      const responseDedup = await catalogServiceWithDedup.loadCatalog();
      const responseOriginal = await catalogService.loadCatalog();

      expect(responseDedup).toBeDefined();
      expect(responseOriginal).toBeDefined();

      // Both should have same basic structure
      expect(responseDedup).toHaveProperty('sections');
      expect(responseDedup).toHaveProperty('metadata');
      expect(responseOriginal).toHaveProperty('sections');
      expect(responseOriginal).toHaveProperty('metadata');

      // Sections should contain arrays of datasets
      Object.keys(responseDedup.sections).forEach(sectionKey => {
        expect(Array.isArray(responseDedup.sections[sectionKey])).toBe(true);
      });

      Object.keys(responseOriginal.sections).forEach(sectionKey => {
        expect(Array.isArray(responseOriginal.sections[sectionKey])).toBe(true);
      });

      // Dataset objects should have same required fields
      const allDatasetsDedup = [];
      for (const sectionKey of Object.keys(responseDedup.sections)) {
        allDatasetsDedup.push(...responseDedup.sections[sectionKey]);
      }

      const allDatasetsOriginal = [];
      for (const sectionKey of Object.keys(responseOriginal.sections)) {
        allDatasetsOriginal.push(...responseOriginal.sections[sectionKey]);
      }

      const requiredFields = ['id', 'title', 'section'];

      allDatasetsDedup.forEach(dataset => {
        requiredFields.forEach(field => {
          expect(dataset).toHaveProperty(field);
        });
      });

      allDatasetsOriginal.forEach(dataset => {
        requiredFields.forEach(field => {
          expect(dataset).toHaveProperty(field);
        });
      });
    });
  });
});

// Helper function to validate deduplication behavior
function validateDeduplicationResult(datasets, config = {}) {
  const { caseSensitive = false, strategy = 'title-based' } = config;

  if (strategy === 'title-based') {
    // Group by title
    const titleGroups = {};
    datasets.forEach(dataset => {
      const normalizedTitle = caseSensitive
        ? dataset.title.trim()
        : dataset.title.toLowerCase().trim();

      if (!titleGroups[normalizedTitle]) {
        titleGroups[normalizedTitle] = [];
      }
      titleGroups[normalizedTitle].push(dataset);
    });

    // Each title group should have only one dataset
    Object.values(titleGroups).forEach(group => {
      expect(group.length).toBe(1);
    });
  }
}

module.exports = { validateDeduplicationResult };