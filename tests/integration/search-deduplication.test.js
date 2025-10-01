/**
 * Integration Test: Search with Deduplication Scenario
 * Tests search functionality with deduplication-aware filtering and result display
 * This test MUST FAIL until search with deduplication feature is implemented
 */

const { CatalogService } = require('../../src/catalog-core/browser/catalog-service');

describe('Search with Deduplication Integration', () => {
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

  describe('Search with Deduplication Enabled', () => {
    test('should return deduplicated search results', async () => {
      // This test will FAIL until search deduplication is implemented
      const searchQuery = 'climate';
      const searchOptions = { deduplicate: true };

      const searchResult = catalogServiceWithDedup.search(searchQuery, searchOptions);

      expect(searchResult).toBeDefined();
      expect(searchResult).toHaveProperty('totalResults');
      expect(searchResult).toHaveProperty('sections');
      expect(searchResult).toHaveProperty('metadata');

      // Search metadata should indicate deduplication is enabled
      expect(searchResult.metadata.deduplicationEnabled).toBe(true);
      expect(searchResult.metadata.searchQuery).toBe(searchQuery);

      // Results should be deduplicated - no duplicate titles
      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      const titles = allResults.map(dataset => dataset.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);

      // Should have deduplication statistics
      if (searchResult.metadata.duplicatesInSearch !== undefined) {
        expect(typeof searchResult.metadata.duplicatesInSearch).toBe('number');
        expect(searchResult.metadata.duplicatesInSearch).toBeGreaterThanOrEqual(0);
      }
    });

    test('should support search-specific deduplication options', async () => {
      // This test will FAIL until search options are implemented
      const searchQuery = 'data';

      // Search with deduplication enabled
      const resultWithDedup = catalogService.search(searchQuery, {
        deduplicate: true,
        deduplicationStrategy: 'title-based',
        keepLatest: true
      });

      // Search without deduplication
      const resultWithoutDedup = catalogService.search(searchQuery, {
        deduplicate: false
      });

      expect(resultWithDedup).toBeDefined();
      expect(resultWithoutDedup).toBeDefined();

      // Results should be different if duplicates exist
      const countWithDedup = Object.values(resultWithDedup.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);
      const countWithoutDedup = Object.values(resultWithoutDedup.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);

      if (countWithDedup < countWithoutDedup) {
        expect(resultWithDedup.metadata.deduplicationEnabled).toBe(true);
        expect(resultWithoutDedup.metadata.deduplicationEnabled).toBe(false);
      }

      // Total results count should be accurate
      expect(resultWithDedup.totalResults).toBe(countWithDedup);
      expect(resultWithoutDedup.totalResults).toBe(countWithoutDedup);
    });

    test('should preserve search relevance with deduplication', async () => {
      // This test will FAIL until relevance preservation is implemented
      const searchQuery = 'health survey';

      const searchResult = catalogServiceWithDedup.search(searchQuery, {
        deduplicate: true
      });

      expect(searchResult).toBeDefined();

      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      // Results should still be relevant to search query
      allResults.forEach(dataset => {
        const titleLower = dataset.title.toLowerCase();
        const descriptionLower = dataset.description ? dataset.description.toLowerCase() : '';
        const searchTermsLower = searchQuery.toLowerCase();

        const isRelevant = titleLower.includes(searchTermsLower) ||
                          descriptionLower.includes(searchTermsLower) ||
                          searchTermsLower.split(' ').some(term =>
                            titleLower.includes(term) || descriptionLower.includes(term)
                          );

        expect(isRelevant).toBe(true);
      });

      // Should maintain relevance scoring
      if (allResults.length > 1 && allResults[0].relevanceScore !== undefined) {
        for (let i = 1; i < allResults.length; i++) {
          expect(allResults[i-1].relevanceScore).toBeGreaterThanOrEqual(
            allResults[i].relevanceScore
          );
        }
      }
    });
  });

  describe('Search Result Enhancement', () => {
    test('should include timestamp information in search results', async () => {
      // This test will FAIL until timestamp display in search is implemented
      const searchResult = catalogServiceWithDedup.search('climate');

      expect(searchResult).toBeDefined();

      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      if (allResults.length > 0) {
        allResults.forEach(dataset => {
          // Should have lastModified timestamp
          expect(dataset).toHaveProperty('lastModified');
          expect(dataset.lastModified).toBeDefined();

          // Should be valid date
          const timestamp = dataset.lastModified instanceof Date
            ? dataset.lastModified
            : new Date(dataset.lastModified);
          expect(timestamp.getTime()).not.toBeNaN();

          // Optional enhanced display fields
          if (dataset.lastModifiedDisplay !== undefined) {
            expect(typeof dataset.lastModifiedDisplay).toBe('string');
          }

          if (dataset.relativeTimeDisplay !== undefined) {
            expect(typeof dataset.relativeTimeDisplay).toBe('string');
          }
        });
      }
    });

    test('should show duplicate information in search metadata', async () => {
      // This test will FAIL until duplicate metadata is implemented
      const searchResult = catalogServiceWithDedup.search('survey', {
        deduplicate: true,
        includeDuplicateInfo: true
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.metadata).toBeDefined();

      // Should include information about duplicates found during search
      if (searchResult.metadata.duplicateInfo) {
        const dupInfo = searchResult.metadata.duplicateInfo;

        expect(dupInfo).toHaveProperty('totalFound');
        expect(dupInfo).toHaveProperty('duplicatesRemoved');
        expect(dupInfo).toHaveProperty('uniqueResultsShown');

        expect(typeof dupInfo.totalFound).toBe('number');
        expect(typeof dupInfo.duplicatesRemoved).toBe('number');
        expect(typeof dupInfo.uniqueResultsShown).toBe('number');

        expect(dupInfo.totalFound).toBeGreaterThanOrEqual(dupInfo.uniqueResultsShown);
        expect(dupInfo.duplicatesRemoved).toBe(dupInfo.totalFound - dupInfo.uniqueResultsShown);
      }
    });

    test('should support search result sorting with deduplication', async () => {
      // This test will FAIL until sorting with deduplication is implemented
      const searchResult = catalogServiceWithDedup.search('data', {
        deduplicate: true,
        sortBy: 'lastModified',
        sortOrder: 'desc'
      });

      expect(searchResult).toBeDefined();

      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      if (allResults.length > 1) {
        // Results should be sorted by lastModified descending
        for (let i = 1; i < allResults.length; i++) {
          const prevTime = new Date(allResults[i-1].lastModified).getTime();
          const currTime = new Date(allResults[i].lastModified).getTime();
          expect(prevTime).toBeGreaterThanOrEqual(currTime);
        }
      }

      // Should maintain deduplication
      const titles = allResults.map(d => d.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });
  });

  describe('Advanced Search Features', () => {
    test('should support date range filtering with deduplication', async () => {
      // This test will FAIL until date range filtering is implemented
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const searchResult = catalogServiceWithDedup.search('*', {
        deduplicate: true,
        dateRange: {
          from: oneYearAgo.toISOString(),
          to: new Date().toISOString()
        }
      });

      expect(searchResult).toBeDefined();

      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      // All results should be within date range
      allResults.forEach(dataset => {
        const datasetTime = new Date(dataset.lastModified).getTime();
        expect(datasetTime).toBeGreaterThanOrEqual(oneYearAgo.getTime());
        expect(datasetTime).toBeLessThanOrEqual(new Date().getTime());
      });

      // Should still be deduplicated
      const titles = allResults.map(d => d.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });

    test('should support section-specific search with deduplication', async () => {
      // This test will FAIL until section filtering is implemented
      const searchResult = catalogServiceWithDedup.search('health', {
        deduplicate: true,
        sections: ['Health', 'Medical']
      });

      expect(searchResult).toBeDefined();

      // Results should only be from specified sections
      Object.keys(searchResult.sections).forEach(sectionKey => {
        expect(['Health', 'Medical']).toContain(sectionKey);
      });

      // Should still apply deduplication within allowed sections
      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      const titles = allResults.map(d => d.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });
  });

  describe('Search Performance', () => {
    test('should maintain search performance with deduplication', async () => {
      // This test will FAIL until performance optimization is implemented
      const startTime = performance.now();

      const searchResult = catalogServiceWithDedup.search('climate data survey', {
        deduplicate: true
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchResult).toBeDefined();

      // Search should complete within reasonable time (2 seconds)
      expect(searchTime).toBeLessThan(2000);

      // Should return meaningful results
      const totalResults = Object.values(searchResult.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);

      expect(searchResult.totalResults).toBe(totalResults);

      // Performance metadata
      if (searchResult.metadata.performance) {
        const perf = searchResult.metadata.performance;
        expect(perf).toHaveProperty('searchTimeMs');
        expect(perf).toHaveProperty('deduplicationTimeMs');
        expect(typeof perf.searchTimeMs).toBe('number');
        expect(typeof perf.deduplicationTimeMs).toBe('number');
      }
    });

    test('should handle large result sets efficiently', async () => {
      // This test will FAIL until large result handling is implemented
      const startTime = performance.now();

      // Search for common term that might return many results
      const searchResult = catalogServiceWithDedup.search('data', {
        deduplicate: true,
        limit: 1000
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchResult).toBeDefined();

      // Should handle large result sets within reasonable time (3 seconds)
      expect(searchTime).toBeLessThan(3000);

      const totalResults = Object.values(searchResult.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);

      // Should respect limit
      expect(totalResults).toBeLessThanOrEqual(1000);

      // Should still be properly deduplicated
      const allResults = [];
      for (const sectionKey of Object.keys(searchResult.sections)) {
        allResults.push(...searchResult.sections[sectionKey]);
      }

      const titles = allResults.map(d => d.title.toLowerCase().trim());
      const uniqueTitles = [...new Set(titles)];
      expect(titles.length).toBe(uniqueTitles.length);
    });
  });

  describe('Error Handling', () => {
    test('should handle search errors gracefully with deduplication', async () => {
      // This test will FAIL until error handling is implemented

      // Test invalid search options
      expect(() => {
        catalogServiceWithDedup.search('test', {
          deduplicate: 'invalid-boolean',
          deduplicationStrategy: 'invalid-strategy'
        });
      }).toThrow();

      // Test empty search query
      const emptyResult = catalogServiceWithDedup.search('', {
        deduplicate: true
      });
      expect(emptyResult).toBeDefined();
      expect(emptyResult.totalResults).toBe(0);

      // Test null search query
      expect(() => {
        catalogServiceWithDedup.search(null, { deduplicate: true });
      }).toThrow(/search.*query.*required/i);
    });

    test('should fallback gracefully when deduplication fails', async () => {
      // This test will FAIL until fallback handling is implemented

      // Simulate deduplication failure by corrupting configuration
      const originalConfig = catalogServiceWithDedup.getDeduplicationConfig();

      // Temporarily corrupt deduplication config
      if (catalogServiceWithDedup._deduplicationConfig) {
        catalogServiceWithDedup._deduplicationConfig.strategy = 'invalid-strategy';
      }

      const searchResult = catalogServiceWithDedup.search('climate', {
        deduplicate: true
      });

      expect(searchResult).toBeDefined();

      // Should either disable deduplication or use fallback strategy
      expect(searchResult.metadata).toHaveProperty('deduplicationFallback');
      expect(typeof searchResult.metadata.deduplicationFallback).toBe('boolean');

      if (searchResult.metadata.deduplicationFallback) {
        expect(searchResult.metadata.deduplicationEnabled).toBe(false);
      }

      // Restore original config
      catalogServiceWithDedup.setDeduplicationConfig(originalConfig);
    });
  });
});

// Helper function to validate search with deduplication results
function validateSearchDeduplicationResult(searchResult, options = {}) {
  const { expectedDeduplication = true, expectedQuery = null } = options;

  expect(searchResult).toBeDefined();
  expect(searchResult).toHaveProperty('totalResults');
  expect(searchResult).toHaveProperty('sections');
  expect(searchResult).toHaveProperty('metadata');

  expect(typeof searchResult.totalResults).toBe('number');
  expect(searchResult.totalResults).toBeGreaterThanOrEqual(0);

  if (expectedDeduplication) {
    expect(searchResult.metadata.deduplicationEnabled).toBe(true);
  }

  if (expectedQuery) {
    expect(searchResult.metadata.searchQuery).toBe(expectedQuery);
  }

  // Validate no duplicate titles in results
  const allResults = [];
  for (const sectionKey of Object.keys(searchResult.sections)) {
    allResults.push(...searchResult.sections[sectionKey]);
  }

  if (expectedDeduplication && allResults.length > 0) {
    const titles = allResults.map(dataset => dataset.title.toLowerCase().trim());
    const uniqueTitles = [...new Set(titles)];
    expect(titles.length).toBe(uniqueTitles.length);
  }
}

module.exports = { validateSearchDeduplicationResult };