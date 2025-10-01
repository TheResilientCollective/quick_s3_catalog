const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { CatalogService } = require('../../src/catalog-core/catalog-service');

// Mock the CatalogService to avoid actual S3 calls
jest.mock('../../src/catalog-core/catalog-service');

const mockData = {
  data: [
    { id: '1', title: 'Awesome Dataset', description: 'A really great dataset.', section: 'data' },
  ],
  health: [
    { id: '2', title: 'Health Study', description: 'Some important health data.', section: 'health' },
  ],
};

const cliCommand = `node ${path.resolve(__dirname, '../../cli.js')}`;


describe('CLI Integration Tests', () => {

  beforeEach(() => {
    // Provide a mock implementation for the service
    CatalogService.mockImplementation(() => {
      return {
        loadCatalog: async () => Promise.resolve(mockData),
        getDatasets: () => mockData,
        search: (query) => {
          if (query.toLowerCase().includes('awesome')) {
            return { sections: { data: [mockData.data[0]] }, totalResults: 1 };
          } else {
            return { sections: {}, totalResults: 0 };
          }
        },
      };
    });
  });

  test('browse command should list datasets', (done) => {
    exec(`${cliCommand} browse`, (error, stdout, stderr) => {
      expect(stdout).toMatch(/\ \[ DATA \ \]/);
      expect(stdout).toMatch(/Awesome Dataset/);
      expect(stderr).toBe('');
      done();
    });
  });

  test('search command should find matching datasets', (done) => {
    exec(`${cliCommand} search Awesome`, (error, stdout, stderr) => {
      expect(stdout).toMatch(/Awesome Dataset/);
      expect(stdout).not.toMatch(/Health Study/);
      expect(stderr).toBe('');
      done();
    });
  });

  test('export command should create a JSON file', (done) => {
    const outputFile = path.join(__dirname, 'test-export.json');
    exec(`${cliCommand} export ${outputFile}`, (error, stdout, stderr) => {
      expect(stdout).toContain(`Successfully exported 2 datasets to ${outputFile}`);
      const content = JSON.parse(fs.readFileSync(outputFile));
      expect(content.length).toBe(2);
      fs.unlinkSync(outputFile); // Cleanup
      done();
    });
  });

  test('export command with query should create a filtered JSON file', (done) => {
    const outputFile = path.join(__dirname, 'test-export-filtered.json');
    exec(`${cliCommand} export ${outputFile} --query Awesome`, (error, stdout, stderr) => {
      expect(stdout).toContain(`Successfully exported 1 dataset to ${outputFile}`);
      const content = JSON.parse(fs.readFileSync(outputFile));
      expect(content.length).toBe(1);
      expect(content[0].title).toBe('Awesome Dataset');
      fs.unlinkSync(outputFile); // Cleanup
      done();
    });
  });

  test('export command to stdout should print JSON', (done) => {
    exec(`${cliCommand} export --format json`, (error, stdout, stderr) => {
        const parsed = JSON.parse(stdout);
        expect(parsed.length).toBe(2);
        expect(parsed[0].title).toBe('Awesome Dataset');
        expect(stderr).toBe('');
        done();
    });
  });
});
