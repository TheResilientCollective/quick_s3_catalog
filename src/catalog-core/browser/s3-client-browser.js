/**
 * Browser-compatible S3 client using Fetch API for public buckets
 * Works with S3-compatible endpoints without credentials for public read access
 */
export class S3ClientBrowser {
  constructor(bucketName, options = {}) {
    this.bucketName = bucketName;
    this.endpoint = options.endpoint;
    this.useSSL = options.useSSL !== false; // Default to true

    if (!this.endpoint) {
      throw new Error('S3 endpoint must be provided in options.endpoint');
    }

    // Construct base URL for API calls
    this.baseUrl = this.endpoint.endsWith('/') ? this.endpoint.slice(0, -1) : this.endpoint;
  }

  /**
   * List all objects in the bucket (handles pagination automatically)
   * Uses S3 XML API for public bucket listing
   */
  async listObjects() {
    try {
      const allObjects = [];
      let continuationToken = null;
      let pageCount = 0;

      do {
        console.log(`Fetching page ${pageCount + 1} of objects...`);

        let url = `${this.baseUrl}/${this.bucketName}?list-type=2&max-keys=1000`;
        if (continuationToken) {
          url += `&continuation-token=${encodeURIComponent(continuationToken)}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to list objects: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const pageResult = this.parseListObjectsResponse(xmlText);

        allObjects.push(...pageResult.objects);
        continuationToken = pageResult.nextContinuationToken;
        pageCount++;

        console.log(`Page ${pageCount}: Found ${pageResult.objects.length} objects. Total so far: ${allObjects.length}`);

        if (pageResult.isTruncated && continuationToken) {
          console.log('More objects available, fetching next page...');
        }

      } while (continuationToken);

      console.log(`✅ Loaded ALL ${allObjects.length} objects from S3 bucket in ${pageCount} pages`);
      return allObjects;

    } catch (error) {
      console.error('Error listing S3 objects:', error);
      throw error;
    }
  }

  /**
   * Get object content from S3
   * For public buckets, objects can be accessed directly via HTTP GET
   */
  async getObject(key) {
    try {
      const url = `${this.baseUrl}/${this.bucketName}/${key}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get object ${key}: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Error getting object ${key}:`, error);
      throw error;
    }
  }

  /**
   * Parse XML response from S3 ListObjects API
   * Extracts object information and pagination data from XML response
   */
  parseListObjectsResponse(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse S3 XML response');
    }

    const objects = [];
    const contents = xmlDoc.querySelectorAll('Contents');

    contents.forEach(content => {
      const key = content.querySelector('Key')?.textContent;
      const size = content.querySelector('Size')?.textContent;
      const lastModified = content.querySelector('LastModified')?.textContent;

      if (key) {
        objects.push({
          Key: key,
          Size: parseInt(size) || 0,
          LastModified: lastModified ? new Date(lastModified) : new Date()
        });
      }
    });

    // Extract pagination information
    const nextContinuationToken = xmlDoc.querySelector('NextContinuationToken')?.textContent;
    const isTruncated = xmlDoc.querySelector('IsTruncated')?.textContent === 'true';
    const keyCount = parseInt(xmlDoc.querySelector('KeyCount')?.textContent) || 0;

    return {
      objects,
      nextContinuationToken,
      isTruncated,
      keyCount
    };
  }

  /**
   * Check if the S3 endpoint is accessible
   * Useful for connection testing
   */
  async testConnection() {
    try {
      await this.listObjects();
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }
}