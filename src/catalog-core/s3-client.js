const minio = require('minio');
require('dotenv').config();

class S3ClientWrapper {
  constructor(bucketName, options = {}) {
    this.bucketName = bucketName || process.env.S3_BUCKET_NAME;
    const endpoint = options.endpoint || process.env.S3_ENDPOINT;
    const port = options.port ? parseInt(options.port, 10) : undefined;
    const useSSL = options.useSSL === undefined ? true : options.useSSL;

    if (!endpoint) {
      throw new Error('S3 endpoint must be provided via options or S3_ENDPOINT environment variable.');
    }

    // Extract host from endpoint URL
    const url = new URL(endpoint);
    const endPoint = url.hostname;
    const resolvedPort = port || (url.port ? parseInt(url.port, 10) : (useSSL ? 443 : 80));

    this.s3Client = new minio.Client({
      endPoint: endPoint,
      port: resolvedPort,
      useSSL: useSSL,
      // Assuming public bucket, so accessKey and secretKey are not needed.
      // If required, they should be passed in options or from env vars.
      accessKey: options.accessKey || process.env.S3_ACCESS_KEY || '',
      secretKey: options.secretKey || process.env.S3_SECRET_KEY || '',
    });
  }

  async listObjects() {
    return new Promise((resolve, reject) => {
      const objects = [];
      const stream = this.s3Client.listObjectsV2(this.bucketName, '', true);
      stream.on('data', (obj) => objects.push({ Key: obj.name, Size: obj.size, LastModified: obj.lastModified }));
      stream.on('error', error => {console.log(reject);reject(error)}) ;
      stream.on('end', () => resolve(objects));
    });
  }

  async getObject(key) {
    try {
      return await this.s3Client.getObject(this.bucketName, key);
    } catch (error) {
      console.error(`Error getting object ${key}:`, error);
      throw error;
    }
  }
}

module.exports = { S3ClientWrapper };
