/**
 * Integration Test: Deduplication Toggle Control Scenario
 * Tests UI controls for toggling deduplication on/off with immediate updates
 * This test MUST FAIL until deduplication toggle feature is implemented
 */

const { CatalogService } = require('../../src/catalog-core/browser/catalog-service');

describe('Deduplication Toggle Control Integration', () => {
  let catalogService;

  beforeEach(() => {
    catalogService = new CatalogService('test-bucket', {
      endpoint: 'https://test-endpoint.com'
    });
  });

  describe('Toggle Control API', () => {
    test('should support dynamic deduplication configuration', async () => {
      // This test will FAIL until dynamic configuration is implemented
      expect(catalogService.setDeduplicationConfig).toBeDefined();
      expect(typeof catalogService.setDeduplicationConfig).toBe('function');

      // Test enabling deduplication
      const enableConfig = {
        enabled: true,
        strategy: 'title-based',
        keepLatest: true,
        caseSensitive: false
      };

      expect(() => {
        catalogService.setDeduplicationConfig(enableConfig);
      }).not.toThrow();

      // Test disabling deduplication
      const disableConfig = {
        enabled: false
      };

      expect(() => {
        catalogService.setDeduplicationConfig(disableConfig);
      }).not.toThrow();
    });

    test('should return different results when toggling deduplication', async () => {
      // This test will FAIL until toggle functionality is implemented

      // Load catalog without deduplication
      catalogService.setDeduplicationConfig({ enabled: false });
      const responseWithoutDedup = await catalogService.loadCatalog();

      // Load catalog with deduplication
      catalogService.setDeduplicationConfig({
        enabled: true,
        strategy: 'title-based',
        keepLatest: true
      });
      const responseWithDedup = await catalogService.loadCatalog();

      expect(responseWithoutDedup).toBeDefined();
      expect(responseWithDedup).toBeDefined();

      // Results should be different if duplicates exist
      const datasetsOriginal = [];
      for (const sectionKey of Object.keys(responseWithoutDedup.sections)) {
        datasetsOriginal.push(...responseWithoutDedup.sections[sectionKey]);
      }

      const datasetsDeduped = [];
      for (const sectionKey of Object.keys(responseWithDedup.sections)) {
        datasetsDeduped.push(...responseWithDedup.sections[sectionKey]);
      }

      // If duplicates exist, deduplicated results should have fewer datasets
      if (datasetsDeduped.length < datasetsOriginal.length) {
        expect(responseWithDedup.metadata.deduplicationEnabled).toBe(true);
        expect(responseWithoutDedup.metadata.deduplicationEnabled).toBe(false);
        expect(responseWithDedup.metadata.duplicatesRemoved).toBeGreaterThan(0);
      }
    });

    test('should validate deduplication configuration', async () => {
      // This test will FAIL until configuration validation is implemented

      // Test invalid strategy
      expect(() => {
        catalogService.setDeduplicationConfig({
          enabled: true,
          strategy: 'invalid-strategy',
          keepLatest: true
        });
      }).toThrow(/strategy.*title-based/i);

      // Test missing required fields when enabled
      expect(() => {
        catalogService.setDeduplicationConfig({
          enabled: true
          // Missing strategy and keepLatest
        });
      }).toThrow();

      // Test valid minimal configuration
      expect(() => {
        catalogService.setDeduplicationConfig({
          enabled: true,
          strategy: 'title-based',
          keepLatest: true
        });
      }).not.toThrow();
    });
  });

  describe('UI State Management', () => {
    test('should persist toggle state across reloads', async () => {
      // This test will FAIL until state persistence is implemented

      // Set deduplication configuration
      const config = {
        enabled: true,
        strategy: 'title-based',
        keepLatest: true,
        caseSensitive: false
      };

      catalogService.setDeduplicationConfig(config);

      // Get current configuration
      const currentConfig = catalogService.getDeduplicationConfig();
      expect(currentConfig).toBeDefined();
      expect(currentConfig.enabled).toBe(true);
      expect(currentConfig.strategy).toBe('title-based');
      expect(currentConfig.keepLatest).toBe(true);
      expect(currentConfig.caseSensitive).toBe(false);

      // Configuration should persist in subsequent operations
      const response = await catalogService.loadCatalog();
      expect(response.metadata.deduplicationEnabled).toBe(true);
      expect(response.metadata.deduplicationConfig).toEqual(config);
    });

    test('should provide toggle state information', async () => {
      // This test will FAIL until state information API is implemented

      // Test with deduplication disabled
      catalogService.setDeduplicationConfig({ enabled: false });
      const responseDisabled = await catalogService.loadCatalog();

      expect(responseDisabled.metadata.deduplicationEnabled).toBe(false);
      expect(responseDisabled.metadata.deduplicationConfig.enabled).toBe(false);

      // Test with deduplication enabled
      catalogService.setDeduplicationConfig({
        enabled: true,
        strategy: 'title-based',
        keepLatest: true
      });
      const responseEnabled = await catalogService.loadCatalog();

      expect(responseEnabled.metadata.deduplicationEnabled).toBe(true);
      expect(responseEnabled.metadata.deduplicationConfig.enabled).toBe(true);
      expect(responseEnabled.metadata.deduplicationConfig.strategy).toBe('title-based');
    });

    test('should support incremental configuration updates', async () => {
      // This test will FAIL until incremental updates are implemented

      // Set initial configuration
      catalogService.setDeduplicationConfig({
        enabled: true,
        strategy: 'title-based',
        keepLatest: true,
        caseSensitive: false
      });

      // Update only caseSensitive property
      catalogService.updateDeduplicationConfig({
        caseSensitive: true
      });

      const config = catalogService.getDeduplicationConfig();
      expect(config.enabled).toBe(true);
      expect(config.strategy).toBe('title-based');
      expect(config.keepLatest).toBe(true);
      expect(config.caseSensitive).toBe(true); // Should be updated

      // Update only enabled property
      catalogService.updateDeduplicationConfig({
        enabled: false
      });

      const updatedConfig = catalogService.getDeduplicationConfig();
      expect(updatedConfig.enabled).toBe(false); // Should be updated
      expect(updatedConfig.strategy).toBe('title-based'); // Should be preserved
      expect(updatedConfig.caseSensitive).toBe(true); // Should be preserved
    });
  });

  describe('Real-time Toggle Effects', () => {
    test('should immediately reflect toggle changes without full reload', async () => {
      // This test will FAIL until real-time updates are implemented

      // Initial load with deduplication off
      catalogService.setDeduplicationConfig({ enabled: false });
      const initialResponse = await catalogService.loadCatalog();

      const initialDatasetCount = Object.values(initialResponse.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);

      // Toggle deduplication on
      catalogService.setDeduplicationConfig({
        enabled: true,
        strategy: 'title-based',
        keepLatest: true
      });

      // Should be able to get updated results without full reload
      const toggledResponse = await catalogService.applyDeduplication();
      expect(toggledResponse).toBeDefined();
      expect(toggledResponse.metadata.deduplicationEnabled).toBe(true);

      const toggledDatasetCount = Object.values(toggledResponse.sections)
        .reduce((sum, datasets) => sum + datasets.length, 0);

      // If duplicates existed, count should be different
      if (toggledDatasetCount !== initialDatasetCount) {
        expect(toggledResponse.metadata.duplicatesRemoved).toBeGreaterThan(0);
      }
    });

    test('should handle rapid toggle operations', async () => {
      // This test will FAIL until rapid toggle handling is implemented

      const startTime = performance.now();

      // Rapid toggle sequence
      catalogService.setDeduplicationConfig({ enabled: false });
      const result1 = await catalogService.applyDeduplication();

      catalogService.setDeduplicationConfig({ enabled: true, strategy: 'title-based', keepLatest: true });
      const result2 = await catalogService.applyDeduplication();

      catalogService.setDeduplicationConfig({ enabled: false });
      const result3 = await catalogService.applyDeduplication();

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid toggles efficiently (under 2 seconds)
      expect(totalTime).toBeLessThan(2000);

      // Results should be consistent
      expect(result1.metadata.deduplicationEnabled).toBe(false);
      expect(result2.metadata.deduplicationEnabled).toBe(true);
      expect(result3.metadata.deduplicationEnabled).toBe(false);

      // Final state should match last toggle
      const finalResponse = await catalogService.loadCatalog();
      expect(finalResponse.metadata.deduplicationEnabled).toBe(false);
    });
  });

  describe('Browser Integration', () => {
    test('should work with browser localStorage for persistence', async () => {
      // This test will FAIL until localStorage integration is implemented

      // Mock localStorage for testing
      const localStorageMock = {
        store: {},
        getItem: function(key) {
          return this.store[key] || null;
        },
        setItem: function(key, value) {
          this.store[key] = value.toString();
        },
        removeItem: function(key) {
          delete this.store[key];
        },
        clear: function() {
          this.store = {};
        }
      };

      // Temporarily replace localStorage
      const originalLocalStorage = global.localStorage;
      global.localStorage = localStorageMock;

      try {
        // Set configuration
        const config = {
          enabled: true,
          strategy: 'title-based',
          keepLatest: true,
          caseSensitive: false
        };

        catalogService.setDeduplicationConfig(config);

        // Configuration should be stored in localStorage
        const storedConfig = JSON.parse(
          localStorage.getItem('catalogService.deduplicationConfig')
        );
        expect(storedConfig).toEqual(config);

        // Create new service instance - should load from localStorage
        const newCatalogService = new CatalogService('test-bucket', {
          endpoint: 'https://test-endpoint.com'
        });

        const loadedConfig = newCatalogService.getDeduplicationConfig();
        expect(loadedConfig).toEqual(config);

      } finally {
        // Restore original localStorage
        global.localStorage = originalLocalStorage;
      }
    });

    test('should gracefully handle localStorage unavailability', async () => {
      // This test will FAIL until localStorage fallback is implemented

      // Temporarily disable localStorage
      const originalLocalStorage = global.localStorage;
      global.localStorage = undefined;

      try {
        // Should not throw error when localStorage is unavailable
        expect(() => {
          catalogService.setDeduplicationConfig({
            enabled: true,
            strategy: 'title-based',
            keepLatest: true
          });
        }).not.toThrow();

        // Should still work with in-memory configuration
        const config = catalogService.getDeduplicationConfig();
        expect(config).toBeDefined();
        expect(config.enabled).toBe(true);

        const response = await catalogService.loadCatalog();
        expect(response.metadata.deduplicationEnabled).toBe(true);

      } finally {
        // Restore localStorage
        global.localStorage = originalLocalStorage;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid toggle operations gracefully', async () => {
      // This test will FAIL until error handling is implemented

      // Test null/undefined configuration
      expect(() => {
        catalogService.setDeduplicationConfig(null);
      }).toThrow(/configuration.*required/i);

      expect(() => {
        catalogService.setDeduplicationConfig(undefined);
      }).toThrow(/configuration.*required/i);

      // Test malformed configuration
      expect(() => {
        catalogService.setDeduplicationConfig({
          enabled: 'not-a-boolean',
          strategy: 123,
          keepLatest: 'invalid'
        });
      }).toThrow();

      // Service should remain in valid state after errors
      const response = await catalogService.loadCatalog();
      expect(response).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    test('should recover from configuration corruption', async () => {
      // This test will FAIL until corruption recovery is implemented

      // Set valid configuration
      catalogService.setDeduplicationConfig({
        enabled: true,
        strategy: 'title-based',
        keepLatest: true
      });

      // Simulate corruption by directly modifying internal state
      if (catalogService._deduplicationConfig) {
        catalogService._deduplicationConfig.strategy = 'corrupted-strategy';
      }

      // Should detect and recover from corruption
      const response = await catalogService.loadCatalog();
      expect(response).toBeDefined();

      // Should either use default config or restore last known good config
      if (response.metadata.deduplicationEnabled) {
        expect(['title-based'].includes(
          response.metadata.deduplicationConfig.strategy
        )).toBe(true);
      }
    });
  });

  describe('Performance with Toggle', () => {
    test('should maintain performance during frequent toggles', async () => {
      // This test will FAIL until toggle performance is optimized

      const startTime = performance.now();

      // Perform multiple toggle operations
      for (let i = 0; i < 10; i++) {
        const enabled = i % 2 === 0;
        catalogService.setDeduplicationConfig({
          enabled,
          strategy: 'title-based',
          keepLatest: true
        });

        await catalogService.applyDeduplication();
      }

      const endTime = performance.now();
      const averageToggleTime = (endTime - startTime) / 10;

      // Each toggle should complete quickly (under 500ms average)
      expect(averageToggleTime).toBeLessThan(500);

      // Final state should be correct
      const finalResponse = await catalogService.loadCatalog();
      expect(finalResponse.metadata.deduplicationEnabled).toBe(false);
    });
  });
});

// Helper function to validate toggle behavior
function validateToggleBehavior(beforeState, afterState, toggleConfig) {
  expect(beforeState).toBeDefined();
  expect(afterState).toBeDefined();

  // Both states should have proper structure
  expect(beforeState).toHaveProperty('metadata');
  expect(afterState).toHaveProperty('metadata');

  // Deduplication state should match toggle configuration
  expect(afterState.metadata.deduplicationEnabled).toBe(toggleConfig.enabled);

  if (toggleConfig.enabled) {
    expect(afterState.metadata.deduplicationConfig).toBeDefined();
    expect(afterState.metadata.deduplicationConfig.strategy).toBe(toggleConfig.strategy);
  }
}

module.exports = { validateToggleBehavior };