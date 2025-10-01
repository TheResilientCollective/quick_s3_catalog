class Dataset {
  constructor(id, title, description, creator, dateCreated, distribution, metadataUrl, isValid, section, projectPath, lastModified = null, metadataKey = null) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.creator = creator;
    this.dateCreated = dateCreated;
    this.distribution = distribution;
    this.metadataUrl = metadataUrl;
    this.isValid = isValid;
    this.section = section;
    this.projectPath = projectPath;

    // Enhanced fields for date display and deduplication
    this.lastModified = lastModified; // S3 object lastModified timestamp (Date object or ISO string)
    this.metadataKey = metadataKey; // S3 key for the metadata file

    // Optional enhanced fields (set during processing)
    this.isDuplicate = undefined; // Boolean indicating if this is a duplicate
    this.duplicateCount = undefined; // Number of duplicates found for this title
    this.timestampAvailable = lastModified !== null && lastModified !== undefined; // Boolean for UI display
    this.lastModifiedDisplay = undefined; // Formatted display string for UI
    this.relativeTimeDisplay = undefined; // Relative time display (e.g., "2 hours ago")
  }

  /**
   * Sets the lastModified timestamp and updates related fields
   * @param {Date|string} timestamp - The lastModified timestamp
   */
  setLastModified(timestamp) {
    if (timestamp instanceof Date) {
      this.lastModified = timestamp;
    } else if (typeof timestamp === 'string') {
      this.lastModified = new Date(timestamp);
    } else if (timestamp !== null && timestamp !== undefined) {
      throw new Error('lastModified must be a Date object, ISO string, or null');
    } else {
      this.lastModified = null;
    }

    this.timestampAvailable = this.lastModified !== null &&
                             this.lastModified !== undefined &&
                             !isNaN(this.lastModified.getTime());
  }

  /**
   * Sets deduplication-related metadata
   * @param {boolean} isDuplicate - Whether this dataset is a duplicate
   * @param {number} duplicateCount - Number of duplicates found
   */
  setDeduplicationInfo(isDuplicate, duplicateCount = 0) {
    this.isDuplicate = isDuplicate;
    this.duplicateCount = duplicateCount;
  }

  /**
   * Sets display formatting for dates
   * @param {string} displayString - Formatted date for display
   * @param {string} relativeString - Relative time string (e.g., "2 hours ago")
   */
  setDateDisplay(displayString, relativeString) {
    this.lastModifiedDisplay = displayString;
    this.relativeTimeDisplay = relativeString;
  }

  /**
   * Returns a simplified object for JSON serialization
   * @returns {Object} Serializable dataset object
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      creator: this.creator,
      dateCreated: this.dateCreated,
      distribution: this.distribution,
      metadataUrl: this.metadataUrl,
      isValid: this.isValid,
      section: this.section,
      projectPath: this.projectPath,
      lastModified: this.lastModified,
      metadataKey: this.metadataKey,
      isDuplicate: this.isDuplicate,
      duplicateCount: this.duplicateCount,
      timestampAvailable: this.timestampAvailable,
      lastModifiedDisplay: this.lastModifiedDisplay,
      relativeTimeDisplay: this.relativeTimeDisplay
    };
  }

  /**
   * Creates a Dataset from a JSON object (static factory method)
   * @param {Object} obj - JSON object to deserialize
   * @returns {Dataset} New Dataset instance
   */
  static fromJSON(obj) {
    const dataset = new Dataset(
      obj.id,
      obj.title,
      obj.description,
      obj.creator,
      obj.dateCreated,
      obj.distribution,
      obj.metadataUrl,
      obj.isValid,
      obj.section,
      obj.projectPath,
      obj.lastModified,
      obj.metadataKey
    );

    // Set enhanced fields
    if (obj.isDuplicate !== undefined) {
      dataset.setDeduplicationInfo(obj.isDuplicate, obj.duplicateCount);
    }

    if (obj.lastModifiedDisplay || obj.relativeTimeDisplay) {
      dataset.setDateDisplay(obj.lastModifiedDisplay, obj.relativeTimeDisplay);
    }

    return dataset;
  }
}

class Distribution {
  constructor(type, name, description, contentUrl, encodingFormat, contentSize, uploadDate, datePublished, keywords, license, creator, inLanguage, measurementMethod, measurementTechnique, sha256, version) {
    this['@type'] = type;
    this.name = name;
    this.description = description;
    this.contentUrl = contentUrl;
    this.encodingFormat = encodingFormat;
    this.contentSize = contentSize;
    this.uploadDate = uploadDate;
    this.datePublished = datePublished;
    this.keywords = keywords;
    this.license = license;
    this.creator = creator;
    this.inLanguage = inLanguage;
    this.measurementMethod = measurementMethod;
    this.measurementTechnique = measurementTechnique;
    this.sha256 = sha256;
    this.version = version;
  }
}

class S3Object {
  constructor(key, lastModified, size, etag, isMetadata, isDataFile) {
    this.key = key;
    this.lastModified = lastModified;
    this.size = size;
    this.etag = etag;
    this.isMetadata = isMetadata;
    this.isDataFile = isDataFile;
  }
}

module.exports = { Dataset, Distribution, S3Object };
