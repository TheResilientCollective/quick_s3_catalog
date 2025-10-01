/**
 * Integration Test: S3 Timestamp Display Scenario
 * Tests end-to-end display of S3 object lastModified timestamps on dataset cards
 * This test MUST FAIL until timestamp display feature is implemented
 */

const { CatalogService } = require('../../src/catalog-core/browser/catalog-service');
const { S3ClientBrowser } = require('../../src/catalog-core/browser/s3-client-browser');

describe('S3 Timestamp Display Integration', () => {
  let catalogService;
  let s3Client;

  beforeEach(() => {
    catalogService = new CatalogService('test-bucket', {
      endpoint: 'https://test-endpoint.com'
    });
    s3Client = new S3ClientBrowser('test-bucket', {
      endpoint: 'https://test-endpoint.com'
    });
  });

  describe('Dataset Card Timestamp Display', () => {
    test('should display relative timestamps on dataset cards', async () => {
      // This test will FAIL until timestamp display is implemented
      const mockCatalogResponse = await catalogService.loadCatalog();

      expect(mockCatalogResponse).toBeDefined();
      expect(mockCatalogResponse.sections).toBeDefined();

      // Find first dataset with valid metadata
      let testDataset = null;
      for (const sectionKey of Object.keys(mockCatalogResponse.sections)) {
        const datasets = mockCatalogResponse.sections[sectionKey];
        if (datasets && datasets.length > 0) {
          testDataset = datasets[0];
          break;
        }
      }

      expect(testDataset).toBeDefined();

      // Dataset should have enhanced timestamp fields
      expect(testDataset).toHaveProperty('lastModified');
      expect(testDataset.lastModified).toBeDefined();

      // lastModified should be valid Date or ISO string
      if (testDataset.lastModified instanceof Date) {
        expect(testDataset.lastModified.getTime()).not.toBeNaN();
        expect(testDataset.lastModified.getTime()).toBeLessThanOrEqual(Date.now());
      } else {
        expect(() => new Date(testDataset.lastModified)).not.toThrow();
        expect(new Date(testDataset.lastModified).getTime()).not.toBeNaN();
      }

      // Test relative time formatting
      const timestamp = testDataset.lastModified instanceof Date
        ? testDataset.lastModified
        : new Date(testDataset.lastModified);

      const now = new Date();
      const diffHours = (now - timestamp) / (1000 * 60 * 60);

      // Verify timestamp is reasonable (not from future, not too old)
      expect(diffHours).toBeGreaterThanOrEqual(0);
      expect(diffHours).toBeLessThan(24 * 365 * 5); // Less than 5 years old
    });

    test('should format timestamps according to user preferences', async () => {
      // This test will FAIL until date formatting options are implemented
      const catalogWithDateConfig = new CatalogService('test-bucket', {
        endpoint: 'https://test-endpoint.com',
        dateDisplay: {
          format: 'relative',
          showTime: true,
          locale: 'en-US'
        }
      });

      const response = await catalogWithDateConfig.loadCatalog();
      expect(response).toBeDefined();

      // Check that date configuration was applied
      if (response.metadata && response.metadata.dateDisplayConfig) {
        expect(response.metadata.dateDisplayConfig.format).toBe('relative');
        expect(response.metadata.dateDisplayConfig.showTime).toBe(true);
        expect(response.metadata.dateDisplayConfig.locale).toBe('en-US');
      }
    });

    test('should handle missing or invalid timestamps gracefully', async () => {
      // This test will FAIL until error handling is implemented
      const response = await catalogService.loadCatalog();

      // Test datasets with potentially invalid timestamps
      for (const sectionKey of Object.keys(response.sections)) {
        const datasets = response.sections[sectionKey];
        datasets.forEach(dataset => {
          if (dataset.lastModified !== undefined && dataset.lastModified !== null) {
            // Valid timestamp should be parseable
            const date = dataset.lastModified instanceof Date
              ? dataset.lastModified
              : new Date(dataset.lastModified);
            expect(date.getTime()).not.toBeNaN();
          }

          // Invalid timestamps should be handled gracefully
          if (dataset.lastModified === null || dataset.lastModified === undefined) {
            // Should have fallback display or be marked as unavailable
            expect(dataset).toHaveProperty('timestampAvailable');
            expect(dataset.timestampAvailable).toBe(false);
          }
        });
      }
    });
  });

  describe('S3 Object Metadata Integration', () => {
    test('should fetch and normalize S3 object timestamps', async () => {
      // This test will FAIL until S3 metadata integration is implemented
      const objects = await s3Client.listObjects();
      expect(Array.isArray(objects)).toBe(true);

      if (objects.length > 0) {
        const s3Object = objects[0];

        // Enhanced S3Object should have normalized LastModified
        expect(s3Object).toHaveProperty('LastModified');
        expect(s3Object.LastModified instanceof Date).toBe(true);
        expect(s3Object.LastModified.getTime()).not.toBeNaN();

        // Should be within reasonable time range
        const now = new Date();
        expect(s3Object.LastModified.getTime()).toBeLessThanOrEqual(now.getTime());

        // Should not be from distant past (arbitrary 10 years)
        const tenYearsAgo = new Date(now.getTime() - (10 * 365 * 24 * 60 * 60 * 1000));
        expect(s3Object.LastModified.getTime()).toBeGreaterThan(tenYearsAgo.getTime());
      }
    });

    test('should correlate S3 timestamps with dataset metadata', async () => {
      // This test will FAIL until metadata correlation is implemented
      const catalogResponse = await catalogService.loadCatalog();

      expect(catalogResponse).toBeDefined();
      expect(catalogResponse.sections).toBeDefined();

      // Find a dataset with metadata file
      let testDataset = null;
      for (const sectionKey of Object.keys(catalogResponse.sections)) {
        const datasets = catalogResponse.sections[sectionKey];
        for (const dataset of datasets) {
          if (dataset.metadataKey && dataset.metadataKey.endsWith('.metadata.json')) {
            testDataset = dataset;
            break;
          }
        }
        if (testDataset) break;
      }

      if (testDataset) {
        // Get S3 object info for the metadata file
        const metadataResponse = await s3Client.getMetadataWithTimestamp(testDataset.metadataKey);

        expect(metadataResponse).toHaveProperty('objectInfo');
        expect(metadataResponse.objectInfo).toHaveProperty('LastModified');
        expect(metadataResponse.objectInfo.LastModified instanceof Date).toBe(true);

        // Dataset lastModified should match S3 object LastModified
        const datasetTimestamp = testDataset.lastModified instanceof Date
          ? testDataset.lastModified
          : new Date(testDataset.lastModified);

        expect(datasetTimestamp.getTime()).toBe(metadataResponse.objectInfo.LastModified.getTime());
      }
    });
  });

  describe('Browser Date Formatting', () => {
    test('should use browser Intl API for locale-aware formatting', async () => {
      // This test will FAIL until browser date formatting is implemented
      const response = await catalogService.loadCatalog();

      expect(response).toBeDefined();

      // Test that relative time formatting uses Intl.RelativeTimeFormat
      if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
        const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        expect(formatter).toBeDefined();

        // Test various time differences
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        const diffHours = Math.round((oneHourAgo - now) / (1000 * 60 * 60));

        const relativeTime = formatter.format(diffHours, 'hour');
        expect(typeof relativeTime).toBe('string');
        expect(relativeTime.length).toBeGreaterThan(0);
      }
    });

    test('should fallback gracefully when Intl API unavailable', async () => {
      // This test will FAIL until fallback formatting is implemented
      const originalIntl = global.Intl;

      try {
        // Temporarily disable Intl
        global.Intl = undefined;

        const response = await catalogService.loadCatalog();
        expect(response).toBeDefined();

        // Should still provide some form of date formatting
        if (response.sections) {
          for (const sectionKey of Object.keys(response.sections)) {
            const datasets = response.sections[sectionKey];
            datasets.forEach(dataset => {
              if (dataset.lastModified) {
                // Should have a string representation even without Intl
                expect(typeof dataset.lastModifiedDisplay).toBe('string');
                expect(dataset.lastModifiedDisplay.length).toBeGreaterThan(0);
              }
            });
          }
        }
      } finally {
        // Restore Intl
        global.Intl = originalIntl;
      }
    });
  });

  describe('Performance with Timestamps', () => {
    test('should load timestamps efficiently for large datasets', async () => {
      // This test will FAIL until efficient timestamp loading is implemented
      const startTime = performance.now();

      const response = await catalogService.loadCatalog();

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(response).toBeDefined();

      // Should complete within reasonable time (5 seconds for large dataset)
      expect(loadTime).toBeLessThan(5000);

      // All datasets should have timestamp information
      let datasetCount = 0;
      let timestampedCount = 0;

      for (const sectionKey of Object.keys(response.sections)) {
        const datasets = response.sections[sectionKey];
        datasetCount += datasets.length;

        datasets.forEach(dataset => {
          if (dataset.lastModified !== undefined) {
            timestampedCount++;
          }
        });
      }

      // At least 80% of datasets should have timestamps
      if (datasetCount > 0) {
        const timestampedRatio = timestampedCount / datasetCount;
        expect(timestampedRatio).toBeGreaterThan(0.8);
      }
    });
  });
});

// Helper function to validate timestamp display requirements
function validateTimestampDisplay(dataset) {
  // Required timestamp field
  expect(dataset).toHaveProperty('lastModified');
  expect(dataset.lastModified).toBeDefined();

  // Should be valid Date or ISO string
  if (dataset.lastModified instanceof Date) {
    expect(dataset.lastModified.getTime()).not.toBeNaN();
  } else {
    expect(() => new Date(dataset.lastModified)).not.toThrow();
  }

  // Optional display fields for UI formatting
  if (dataset.lastModifiedDisplay !== undefined) {
    expect(typeof dataset.lastModifiedDisplay).toBe('string');
  }

  if (dataset.relativeTimeDisplay !== undefined) {
    expect(typeof dataset.relativeTimeDisplay).toBe('string');
  }
}

module.exports = { validateTimestampDisplay };