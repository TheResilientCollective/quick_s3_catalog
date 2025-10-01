const { S3ClientWrapper } = require('../../src/catalog-core/s3-client');

describe('S3 API Contracts', () => {
  let s3Client;

  beforeAll(() => {
    s3Client = new S3ClientWrapper();
  });

  test('/bucket-scan should return a list of objects', async () => {
    const objects = await s3Client.listObjects();
    expect(objects).toBeDefined();
    expect(Array.isArray(objects)).toBe(true);
  });

  test('/metadata/{objectKey} should return an object stream', async () => {
    // Note: This test assumes the object exists and the bucket is public.
    const stream = await s3Client.getObject('data/project-a/output/metadata.json');
    expect(stream).toBeDefined();
    // Check if it's a stream by looking for the 'on' method
    expect(typeof stream.on).toBe('function');
  });
});
