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
        // Create Enhanced S3Object with normalized timestamp and file type identification
        const enhancedObject = this.createEnhancedS3Object(key, lastModified, size);
        objects.push(enhancedObject);
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
   * Creates an Enhanced S3Object with normalized timestamp and file type identification
   * @param {string} key - S3 object key
   * @param {string} lastModifiedStr - ISO timestamp string from S3
   * @param {string} sizeStr - Size string from S3
   * @param {string} etag - ETag from S3 (optional)
   * @returns {Object} Enhanced S3Object
   */
  createEnhancedS3Object(key, lastModifiedStr, sizeStr, etag = null) {
    // Normalize timestamp to Date object
    let lastModified;
    try {
      lastModified = lastModifiedStr ? new Date(lastModifiedStr) : new Date();

      // Validate the date
      if (isNaN(lastModified.getTime())) {
        console.warn(`Invalid lastModified timestamp for ${key}: ${lastModifiedStr}`);
        lastModified = new Date(); // Fallback to current time
      }
    } catch (error) {
      console.warn(`Error parsing lastModified for ${key}:`, error);
      lastModified = new Date(); // Fallback to current time
    }

    // Parse size
    const size = parseInt(sizeStr) || 0;

    // File type identification
    const isMetadata = this.isMetadataFile(key);
    const isDataFile = !isMetadata;

    return {
      Key: key,
      Size: size,
      LastModified: lastModified,
      ETag: etag,
      isMetadata: isMetadata,
      isDataFile: isDataFile
    };
  }

  /**
   * Determines if a file is a metadata file based on its key
   * @param {string} key - S3 object key
   * @returns {boolean} True if file is a metadata file
   */
  isMetadataFile(key) {
    if (typeof key !== 'string') return false;

    // Metadata files end with .metadata.json
    return key.toLowerCase().endsWith('.metadata.json');
  }

  /**
   * Scans the bucket and returns standardized response with metadata
   * @returns {Object} BucketScanResponse with objects and metadata
   */
  async scanBucket() {
    try {
      const startTime = new Date();
      const objects = await this.listObjects();
      const endTime = new Date();

      // Analyze objects
      const metadataFiles = objects.filter(obj => obj.isMetadata).length;
      const dataFiles = objects.filter(obj => obj.isDataFile).length;

      return {
        objects: objects,
        metadata: {
          totalObjects: objects.length,
          scanTimestamp: startTime,
          bucketName: this.bucketName,
          metadataFiles: metadataFiles,
          dataFiles: dataFiles,
          scanDurationMs: endTime.getTime() - startTime.getTime()
        }
      };
    } catch (error) {
      console.error('Error scanning bucket:', error);
      throw error;
    }
  }

  /**
   * Gets metadata content with S3 object information
   * @param {string} metadataKey - S3 key for metadata file
   * @returns {Object} MetadataResponse with content and objectInfo
   */
  async getMetadataWithTimestamp(metadataKey) {
    // Validate that this is a metadata file
    if (!this.isMetadataFile(metadataKey)) {
      throw new Error(`Key ${metadataKey} is not a metadata file. Metadata files must end with .metadata.json`);
    }

    try {
      // Get the content
      const contentStr = await this.getObject(metadataKey);

      // Parse JSON content
      let content;
      let parseSuccess = true;
      let parseError = null;

      try {
        content = JSON.parse(contentStr);
      } catch (error) {
        parseSuccess = false;
        parseError = error.message;
        content = null;
      }

      // Get object info by finding it in the bucket listing
      // For efficiency, we could cache this, but for now we'll do a fresh lookup
      const allObjects = await this.listObjects();
      const objectInfo = allObjects.find(obj => obj.Key === metadataKey);

      if (!objectInfo) {
        throw new Error(`Could not find object info for ${metadataKey}`);
      }

      return {
        content: content,
        objectInfo: objectInfo,
        parseSuccess: parseSuccess,
        parseError: parseError
      };
    } catch (error) {
      console.error(`Error getting metadata with timestamp for ${metadataKey}:`, error);

      // Enhance error with object key information
      const enhancedError = new Error(error.message);
      enhancedError.objectKey = metadataKey;
      enhancedError.timestamp = new Date().toISOString();
      throw enhancedError;
    }
  }

  /**
   * Gets timestamps for multiple objects in batch
   * @param {string[]} objectKeys - Array of S3 object keys
   * @returns {Object} TimestampResponse with timestamps and notFound arrays
   */
  async getTimestampsBatch(objectKeys) {
    // Validate input
    if (!Array.isArray(objectKeys)) {
      throw new Error('objectKeys must be an array');
    }

    if (objectKeys.length === 0) {
      throw new Error('At least one object key is required');
    }

    if (objectKeys.length > 100) {
      throw new Error('Batch requests are limited to 100 keys maximum');
    }

    try {
      // Get all objects from bucket
      const allObjects = await this.listObjects();

      // Create a map for quick lookup
      const objectMap = new Map();
      allObjects.forEach(obj => {
        objectMap.set(obj.Key, obj);
      });

      const timestamps = {};
      const notFound = [];

      // Process each requested key
      objectKeys.forEach(key => {
        const objectInfo = objectMap.get(key);
        if (objectInfo) {
          timestamps[key] = objectInfo.LastModified.toISOString();
        } else {
          notFound.push(key);
        }
      });

      return {
        timestamps: timestamps,
        notFound: notFound.length > 0 ? notFound : undefined
      };
    } catch (error) {
      console.error('Error getting timestamps batch:', error);
      throw error;
    }
  }

  /**
   * Check if the S3 endpoint is accessible
   * Useful for connection testing
   */
  async testConnection() {
    try {
      const result = await this.scanBucket();
      return result.metadata.totalObjects >= 0; // Return true if we can get object count
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }
}