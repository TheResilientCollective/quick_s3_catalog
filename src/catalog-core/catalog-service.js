const { S3ClientWrapper } = require('./s3-client');
const { DatasetParser } = require('./dataset-parser');
const { CatalogIndex } = require('./catalog-index');

class CatalogService {
  constructor(bucketName, options) {
    this.s3Client = new S3ClientWrapper(bucketName, options);
    this.index = new CatalogIndex();
  }

  async loadCatalog() {
    const objects = await this.s3Client.listObjects();
    const metadataFiles = objects.filter(obj => obj.Key.endsWith('metadata.json'));
    const datasets = [];

    for (const file of metadataFiles) {
      try {
        const metadataStream = await this.s3Client.getObject(file.Key);
        const metadata = await this.streamToString(metadataStream);
        const dataset = DatasetParser.parse(metadata, file.Key);
        datasets.push(dataset);
      } catch (error) {
        console.error(`Error processing ${file.Key}:`, error);
      }
    }

    this.index.update(datasets);
    return this.index.sections;
  }

  search(query) {
    return this.index.search(query);
  }

  getDatasets() {
    return this.index.sections;
  }

  async streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
}

module.exports = { CatalogService };
