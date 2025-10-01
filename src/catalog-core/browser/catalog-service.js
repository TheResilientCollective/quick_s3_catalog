import { DatasetParser } from './dataset-parser.js';
import { CatalogIndex } from './catalog-index.js';
import { S3ClientBrowser } from './s3-client-browser.js';

export class CatalogService {
  constructor(bucketName, options = {}) {
    this.bucketName = bucketName;
    this.options = options;
    this.index = new CatalogIndex();

    // Create browser-compatible S3 client if endpoint is provided
    if (options.endpoint) {
      this.s3Client = new S3ClientBrowser(bucketName, options);
    }
  }

  async loadCatalog() {
    if (!this.s3Client) {
      console.warn('No S3 client configured. Please provide endpoint in options.');
      return {};
    }

    try {
      console.log('🚀 Loading complete catalog from S3...');

      // Step 1: List all objects (with pagination)
      const objects = await this.s3Client.listObjects();
      console.log(`📁 Found ${objects.length} total objects in bucket`);

      // Step 2: Filter metadata files
      const metadataFiles = objects.filter(obj => obj.Key.endsWith('metadata.json'));
      console.log(`📄 Found ${metadataFiles.length} metadata files to process`);

      if (metadataFiles.length === 0) {
        console.warn('⚠️ No metadata.json files found in bucket');
        return {};
      }

      const datasets = [];
      let processedCount = 0;

      // Step 3: Process all metadata files
      console.log('📊 Processing metadata files...');
      for (const file of metadataFiles) {
        try {
          processedCount++;
          console.log(`Processing ${processedCount}/${metadataFiles.length}: ${file.Key}`);

          const metadataContent = await this.s3Client.getObject(file.Key);
          const dataset = DatasetParser.parse(metadataContent, file.Key);
          datasets.push(dataset);

          if (dataset.isValid) {
            console.log(`✅ Parsed dataset: "${dataset.title}"`);
          } else {
            console.log(`❌ Invalid metadata: ${file.Key}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${file.Key}:`, error);
          // Create an invalid dataset entry for failed parsing
          const invalidDataset = DatasetParser.parse('{}', file.Key);
          datasets.push(invalidDataset);
        }
      }

      // Step 4: Build index and return results
      console.log(`✅ Successfully processed ${datasets.length} datasets`);
      const validDatasets = datasets.filter(d => d.isValid).length;
      const invalidDatasets = datasets.length - validDatasets;

      console.log(`📊 Summary: ${validDatasets} valid datasets, ${invalidDatasets} invalid`);

      this.index.update(datasets);

      // Convert Map to plain object for browser compatibility
      const sections = {};
      for (const [key, value] of this.index.sections.entries()) {
        sections[key] = value;
      }

      console.log(`🎉 Catalog loaded! Sections: ${Object.keys(sections).join(', ')}`);
      return sections;

    } catch (error) {
      console.error('💥 Error loading catalog:', error);
      throw error;
    }
  }

  search(query) {
    return this.index.search(query);
  }

  getDatasets() {
    // Convert Map to plain object for browser compatibility
    const sections = {};
    for (const [key, value] of this.index.sections.entries()) {
      sections[key] = value;
    }
    return sections;
  }

  // Helper method for parsing datasets (used by implementations)
  parseDataset(metadata, objectKey) {
    return DatasetParser.parse(metadata, objectKey);
  }

  // Helper method to update the index (used by implementations)
  updateIndex(datasets) {
    this.index.update(datasets);
    const sections = {};
    for (const [key, value] of this.index.sections.entries()) {
      sections[key] = value;
    }
    return sections;
  }

  // Test S3 connection
  async testConnection() {
    if (!this.s3Client) {
      return false;
    }
    return await this.s3Client.testConnection();
  }
}