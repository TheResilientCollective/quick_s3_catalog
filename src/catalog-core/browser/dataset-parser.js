import { Dataset, Distribution } from './models.js';

class DatasetParser {
  /**
   * Parse dataset metadata with S3 object information
   * @param {string} metadata - JSON metadata string
   * @param {string} objectKey - S3 object key for the metadata file
   * @param {Object} s3ObjectInfo - S3 object metadata (optional)
   * @returns {Dataset} Parsed dataset with enhanced metadata
   */
  static parse(metadata, objectKey, s3ObjectInfo = null) {
    try {
      const json = JSON.parse(metadata);
      const distributions = (json.distribution || []).map(d => new Distribution(
        d['@type'],
        d.name,
        d.description,
        d.contentUrl,
        d.encodingFormat,
        d.contentSize,
        d.uploadDate,
        d.datePublished,
        d.keywords,
        d.license,
        d.creator,
        d.inLanguage,
        d.measurementMethod,
        d.measurementTechnique,
        d.sha256,
        d.version
      ));

      const pathParts = objectKey.split('/');
      const section = pathParts[0];
      // The project path is the directory containing the metadata file.
      const projectPath = pathParts.slice(1, -1).join('/');
      // The ID is the full path without the .metadata.json extension.
      const id = objectKey.replace(/\.metadata\.json$/, '');

      // Extract S3 object lastModified timestamp
      let lastModified = null;
      if (s3ObjectInfo && s3ObjectInfo.LastModified) {
        lastModified = s3ObjectInfo.LastModified instanceof Date
          ? s3ObjectInfo.LastModified
          : new Date(s3ObjectInfo.LastModified);
      }

      const dataset = new Dataset(
        id,
        json.name,
        json.description,
        json.creator,
        json.dateCreated,
        distributions,
        objectKey, // metadataUrl is the full key to the .metadata.json file
        true,
        section,
        projectPath,
        lastModified, // Enhanced: S3 object lastModified timestamp
        objectKey     // Enhanced: metadata key for reference
      );

      return dataset;
    } catch (error) {
      // Return an invalid dataset object if parsing fails
      // Include S3 timestamp even for invalid datasets
      let lastModified = null;
      if (s3ObjectInfo && s3ObjectInfo.LastModified) {
        lastModified = s3ObjectInfo.LastModified instanceof Date
          ? s3ObjectInfo.LastModified
          : new Date(s3ObjectInfo.LastModified);
      }

      return new Dataset(
        objectKey,
        'Invalid Metadata',
        error.message,
        null,
        null,
        [],
        objectKey,
        false,
        null,
        null,
        lastModified, // Include timestamp even for invalid datasets
        objectKey
      );
    }
  }

  /**
   * Parse dataset metadata from S3 response (includes both content and object info)
   * @param {Object} s3Response - Response from S3ClientBrowser.getMetadataWithTimestamp()
   * @returns {Dataset} Parsed dataset with full S3 metadata
   */
  static parseFromS3Response(s3Response) {
    if (!s3Response || !s3Response.content || !s3Response.objectInfo) {
      throw new Error('Invalid S3 response: missing content or objectInfo');
    }

    const metadata = typeof s3Response.content === 'string'
      ? s3Response.content
      : JSON.stringify(s3Response.content);

    return this.parse(metadata, s3Response.objectInfo.Key, s3Response.objectInfo);
  }

  /**
   * Batch parse datasets from multiple S3 metadata responses
   * @param {Array} s3Responses - Array of S3 metadata responses
   * @returns {Array} Array of parsed datasets
   */
  static batchParseFromS3Responses(s3Responses) {
    if (!Array.isArray(s3Responses)) {
      throw new Error('s3Responses must be an array');
    }

    return s3Responses.map((response, index) => {
      try {
        return this.parseFromS3Response(response);
      } catch (error) {
        console.warn(`Failed to parse dataset at index ${index}:`, error);

        // Create invalid dataset with available info
        const key = response.objectInfo ? response.objectInfo.Key : `unknown-${index}`;
        const lastModified = response.objectInfo ? response.objectInfo.LastModified : null;

        return new Dataset(
          key,
          'Parse Error',
          error.message,
          null,
          null,
          [],
          key,
          false,
          null,
          null,
          lastModified,
          key
        );
      }
    });
  }

  /**
   * Validates that a dataset has valid S3 metadata
   * @param {Dataset} dataset - Dataset to validate
   * @returns {Object} Validation result
   */
  static validateS3Metadata(dataset) {
    const errors = [];
    const warnings = [];

    if (!dataset) {
      errors.push('Dataset is null or undefined');
      return { isValid: false, errors, warnings };
    }

    // Check if dataset has S3 metadata
    if (!dataset.lastModified) {
      warnings.push('Dataset missing lastModified timestamp');
    } else if (!(dataset.lastModified instanceof Date)) {
      errors.push('lastModified is not a Date object');
    } else if (isNaN(dataset.lastModified.getTime())) {
      errors.push('lastModified is an invalid Date');
    }

    if (!dataset.metadataKey) {
      warnings.push('Dataset missing metadataKey');
    } else if (typeof dataset.metadataKey !== 'string') {
      errors.push('metadataKey is not a string');
    } else if (!dataset.metadataKey.endsWith('.metadata.json')) {
      errors.push('metadataKey does not end with .metadata.json');
    }

    // Check timestamp availability flag
    if (dataset.lastModified && !dataset.timestampAvailable) {
      warnings.push('timestampAvailable flag inconsistent with lastModified presence');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export { DatasetParser };