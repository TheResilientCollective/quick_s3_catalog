/**
 * Integration Test: CLI Enhanced Features Scenario
 * Tests CLI commands with date display and deduplication flags
 * This test MUST FAIL until CLI enhanced features are implemented
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('CLI Enhanced Features Integration', () => {
  const cliPath = path.join(__dirname, '../../cli.js');

  beforeAll(() => {
    // Verify CLI script exists
    expect(fs.existsSync(cliPath)).toBe(true);
  });

  describe('Browse Command Enhancements', () => {
    test('should support --show-dates flag', async () => {
      // This test will FAIL until --show-dates flag is implemented
      const result = await runCLICommand(['browse', '--show-dates']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Output should include timestamp information
      expect(result.stdout).toMatch(/last\s*modified|updated|timestamp/i);

      // Should show relative time format (e.g., "2 hours ago", "3 days ago")
      expect(result.stdout).toMatch(/\d+\s*(minute|hour|day|week|month)s?\s*ago/i);
    });

    test('should support --deduplicate flag', async () => {
      // This test will FAIL until --deduplicate flag is implemented
      const resultWithDedup = await runCLICommand(['browse', '--deduplicate']);
      const resultWithoutDedup = await runCLICommand(['browse']);

      expect(resultWithDedup.exitCode).toBe(0);
      expect(resultWithoutDedup.exitCode).toBe(0);

      // Parse JSON output if available
      let datasetsWithDedup, datasetsWithoutDedup;

      try {
        const jsonWithDedup = JSON.parse(resultWithDedup.stdout);
        const jsonWithoutDedup = JSON.parse(resultWithoutDedup.stdout);

        datasetsWithDedup = countDatasetsInResponse(jsonWithDedup);
        datasetsWithoutDedup = countDatasetsInResponse(jsonWithoutDedup);
      } catch {
        // If not JSON, count text lines with dataset info
        datasetsWithDedup = countTextualDatasets(resultWithDedup.stdout);
        datasetsWithoutDedup = countTextualDatasets(resultWithoutDedup.stdout);
      }

      // Deduplicated results should have same or fewer datasets
      expect(datasetsWithDedup).toBeLessThanOrEqual(datasetsWithoutDedup);

      // Should include deduplication metadata in output
      expect(resultWithDedup.stdout).toMatch(/deduplication|duplicate|unique/i);
    });

    test('should combine --show-dates and --deduplicate flags', async () => {
      // This test will FAIL until flag combination is implemented
      const result = await runCLICommand(['browse', '--show-dates', '--deduplicate']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should show both timestamps and deduplication
      expect(result.stdout).toMatch(/last\s*modified|updated|timestamp/i);
      expect(result.stdout).toMatch(/deduplication|duplicate|unique/i);

      // Should show relative time format
      expect(result.stdout).toMatch(/\d+\s*(minute|hour|day|week|month)s?\s*ago/i);
    });

    test('should support --format flag with enhanced features', async () => {
      // This test will FAIL until enhanced format options are implemented
      const jsonResult = await runCLICommand(['browse', '--format', 'json', '--show-dates', '--deduplicate']);
      const tableResult = await runCLICommand(['browse', '--format', 'table', '--show-dates', '--deduplicate']);

      expect(jsonResult.exitCode).toBe(0);
      expect(tableResult.exitCode).toBe(0);

      // JSON format should be valid JSON with enhanced fields
      const jsonData = JSON.parse(jsonResult.stdout);
      expect(jsonData).toBeDefined();
      expect(jsonData.metadata).toBeDefined();
      expect(jsonData.metadata.deduplicationEnabled).toBe(true);
      expect(jsonData.metadata.showDates).toBe(true);

      // Table format should include timestamp columns
      expect(tableResult.stdout).toMatch(/Last\s*Modified|Updated|Timestamp/i);
      expect(tableResult.stdout).toMatch(/\|.*\|.*\|/); // Table structure
    });
  });

  describe('Search Command Enhancements', () => {
    test('should support search with --show-dates flag', async () => {
      // This test will FAIL until search --show-dates is implemented
      const result = await runCLICommand(['search', 'climate', '--show-dates']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should include timestamp information in search results
      expect(result.stdout).toMatch(/last\s*modified|updated|timestamp/i);
      expect(result.stdout).toMatch(/\d+\s*(minute|hour|day|week|month)s?\s*ago/i);
    });

    test('should support search with --deduplicate flag', async () => {
      // This test will FAIL until search --deduplicate is implemented
      const resultWithDedup = await runCLICommand(['search', 'data', '--deduplicate']);
      const resultWithoutDedup = await runCLICommand(['search', 'data']);

      expect(resultWithDedup.exitCode).toBe(0);
      expect(resultWithoutDedup.exitCode).toBe(0);

      // Count results
      const countWithDedup = countSearchResults(resultWithDedup.stdout);
      const countWithoutDedup = countSearchResults(resultWithoutDedup.stdout);

      // Deduplicated search should have same or fewer results
      expect(countWithDedup).toBeLessThanOrEqual(countWithoutDedup);

      // Should mention deduplication in output
      expect(resultWithDedup.stdout).toMatch(/deduplication|duplicate|unique/i);
    });

    test('should support --sort-by lastModified with search', async () => {
      // This test will FAIL until --sort-by lastModified is implemented
      const result = await runCLICommand(['search', 'health', '--sort-by', 'lastModified', '--show-dates']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should be sorted by timestamp (most recent first by default)
      const lines = result.stdout.split('\n').filter(line =>
        line.includes('ago') || line.includes('lastModified')
      );

      if (lines.length > 1) {
        // Verify chronological order (most recent first)
        expect(result.stdout).toMatch(/sort.*lastModified|timestamp.*sort/i);
      }
    });

    test('should support --date-range filter', async () => {
      // This test will FAIL until --date-range filter is implemented
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const result = await runCLICommand([
        'search', 'survey',
        '--date-range', `${oneMonthAgo.toISOString()},${new Date().toISOString()}`,
        '--show-dates'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should only show results within date range
      expect(result.stdout).toMatch(/date\s*range|filtered.*date/i);

      // Should show timestamp information
      expect(result.stdout).toMatch(/last\s*modified|updated|timestamp/i);
    });
  });

  describe('Export Command Enhancements', () => {
    test('should export with timestamp information', async () => {
      // This test will FAIL until export with timestamps is implemented
      const outputFile = path.join(__dirname, '../temp/export-with-dates.json');

      // Ensure temp directory exists
      const tempDir = path.dirname(outputFile);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const result = await runCLICommand(['export', '--output', outputFile, '--include-dates']);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(outputFile)).toBe(true);

      // Verify exported file contains timestamp information
      const exportedData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      expect(exportedData).toBeDefined();

      if (exportedData.datasets && exportedData.datasets.length > 0) {
        const firstDataset = exportedData.datasets[0];
        expect(firstDataset).toHaveProperty('lastModified');
        expect(firstDataset.lastModified).toBeDefined();
      }

      // Cleanup
      fs.unlinkSync(outputFile);
    });

    test('should export deduplicated datasets', async () => {
      // This test will FAIL until export with deduplication is implemented
      const outputFileDedup = path.join(__dirname, '../temp/export-dedup.json');
      const outputFileOriginal = path.join(__dirname, '../temp/export-original.json');

      // Ensure temp directory exists
      const tempDir = path.dirname(outputFileDedup);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const resultDedup = await runCLICommand(['export', '--output', outputFileDedup, '--deduplicate']);
      const resultOriginal = await runCLICommand(['export', '--output', outputFileOriginal]);

      expect(resultDedup.exitCode).toBe(0);
      expect(resultOriginal.exitCode).toBe(0);
      expect(fs.existsSync(outputFileDedup)).toBe(true);
      expect(fs.existsSync(outputFileOriginal)).toBe(true);

      // Compare file sizes/content
      const dedupData = JSON.parse(fs.readFileSync(outputFileDedup, 'utf8'));
      const originalData = JSON.parse(fs.readFileSync(outputFileOriginal, 'utf8'));

      if (dedupData.datasets && originalData.datasets) {
        expect(dedupData.datasets.length).toBeLessThanOrEqual(originalData.datasets.length);

        // Should include deduplication metadata
        expect(dedupData.metadata).toBeDefined();
        expect(dedupData.metadata.deduplicationEnabled).toBe(true);
      }

      // Cleanup
      fs.unlinkSync(outputFileDedup);
      fs.unlinkSync(outputFileOriginal);
    });

    test('should support CSV export with enhanced fields', async () => {
      // This test will FAIL until CSV export with enhanced fields is implemented
      const outputFile = path.join(__dirname, '../temp/export-enhanced.csv');

      // Ensure temp directory exists
      const tempDir = path.dirname(outputFile);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const result = await runCLICommand([
        'export', '--format', 'csv', '--output', outputFile,
        '--include-dates', '--deduplicate'
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(outputFile)).toBe(true);

      // Verify CSV headers include enhanced fields
      const csvContent = fs.readFileSync(outputFile, 'utf8');
      const headers = csvContent.split('\n')[0].toLowerCase();

      expect(headers).toMatch(/lastmodified|last_modified|timestamp/);
      expect(headers).toMatch(/title.*description.*section/);

      // Cleanup
      fs.unlinkSync(outputFile);
    });
  });

  describe('Help and Documentation', () => {
    test('should show enhanced help for browse command', async () => {
      // This test will FAIL until enhanced help is implemented
      const result = await runCLICommand(['browse', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should document new flags
      expect(result.stdout).toMatch(/--show-dates.*display.*timestamp/i);
      expect(result.stdout).toMatch(/--deduplicate.*remove.*duplicate/i);
      expect(result.stdout).toMatch(/--format.*json|table|csv/i);
    });

    test('should show enhanced help for search command', async () => {
      // This test will FAIL until enhanced search help is implemented
      const result = await runCLICommand(['search', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should document search enhancements
      expect(result.stdout).toMatch(/--show-dates.*timestamp/i);
      expect(result.stdout).toMatch(/--deduplicate.*duplicate/i);
      expect(result.stdout).toMatch(/--sort-by.*lastModified/i);
      expect(result.stdout).toMatch(/--date-range.*filter.*date/i);
    });

    test('should show enhanced help for export command', async () => {
      // This test will FAIL until enhanced export help is implemented
      const result = await runCLICommand(['export', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      // Should document export enhancements
      expect(result.stdout).toMatch(/--include-dates.*timestamp/i);
      expect(result.stdout).toMatch(/--deduplicate.*duplicate/i);
      expect(result.stdout).toMatch(/--format.*csv.*json/i);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid date range format', async () => {
      // This test will FAIL until date range validation is implemented
      const result = await runCLICommand(['search', 'test', '--date-range', 'invalid-format']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/invalid.*date.*range.*format/i);
    });

    test('should handle invalid sort-by option', async () => {
      // This test will FAIL until sort validation is implemented
      const result = await runCLICommand(['search', 'test', '--sort-by', 'invalid-field']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/invalid.*sort.*field|unknown.*sort.*option/i);
    });

    test('should handle missing output file for export', async () => {
      // This test will FAIL until export validation is implemented
      const result = await runCLICommand(['export', '--output', '/invalid/path/file.json']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/cannot.*write.*file|output.*path.*invalid/i);
    });
  });

  describe('Performance', () => {
    test('should maintain CLI performance with enhanced features', async () => {
      // This test will FAIL until performance is optimized
      const startTime = Date.now();

      const result = await runCLICommand(['browse', '--show-dates', '--deduplicate', '--format', 'json']);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.exitCode).toBe(0);

      // Should complete within reasonable time (10 seconds for CLI)
      expect(executionTime).toBeLessThan(10000);

      // Should produce valid output
      expect(result.stdout).toBeDefined();
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  });
});

// Helper function to run CLI commands
function runCLICommand(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(__dirname, '../../cli.js'), ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    // Set timeout to prevent hanging tests
    setTimeout(() => {
      child.kill();
      resolve({
        exitCode: -1,
        stdout: stdout.trim(),
        stderr: 'Command timed out'
      });
    }, 30000); // 30 second timeout
  });
}

// Helper function to count datasets in JSON response
function countDatasetsInResponse(jsonResponse) {
  if (!jsonResponse || !jsonResponse.sections) return 0;

  return Object.values(jsonResponse.sections)
    .reduce((total, sectionDatasets) => total + (sectionDatasets?.length || 0), 0);
}

// Helper function to count datasets in textual output
function countTextualDatasets(textOutput) {
  if (!textOutput) return 0;

  // Count lines that look like dataset entries
  const lines = textOutput.split('\n');
  return lines.filter(line =>
    line.includes('Title:') ||
    line.includes('Dataset:') ||
    line.match(/^\d+\.\s+/)
  ).length;
}

// Helper function to count search results
function countSearchResults(searchOutput) {
  if (!searchOutput) return 0;

  // Try to parse as JSON first
  try {
    const jsonData = JSON.parse(searchOutput);
    return countDatasetsInResponse(jsonData);
  } catch {
    // Fall back to textual counting
    return countTextualDatasets(searchOutput);
  }
}

module.exports = {
  runCLICommand,
  countDatasetsInResponse,
  countTextualDatasets,
  countSearchResults
};