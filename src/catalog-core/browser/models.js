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

    // Enhanced: S3 object metadata integration
    this.lastModified = lastModified;
    this.metadataKey = metadataKey;
    this.timestampAvailable = !!(lastModified && lastModified instanceof Date && !isNaN(lastModified.getTime()));

    // Enhanced: Date display formatting (set by date formatting service)
    this.dateDisplay = null;
    this.relativeDisplay = null;

    // Enhanced: Deduplication information (set by deduplication service)
    this.deduplicationInfo = null;
  }

  /**
   * Sets the S3 lastModified timestamp for this dataset
   * @param {Date} timestamp - S3 object lastModified timestamp
   */
  setLastModified(timestamp) {
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      this.lastModified = timestamp;
      this.timestampAvailable = true;
    } else if (timestamp === null) {
      this.lastModified = null;
      this.timestampAvailable = false;
    } else {
      console.warn('Invalid timestamp provided to setLastModified:', timestamp);
    }
  }

  /**
   * Sets deduplication information for this dataset
   * @param {boolean} isDuplicate - Whether this dataset is marked as a duplicate
   * @param {number} duplicateCount - Total number of datasets in the duplicate group
   * @param {string} keptInsteadId - ID of the dataset kept instead (if this is a duplicate)
   */
  setDeduplicationInfo(isDuplicate, duplicateCount, keptInsteadId = null) {
    this.deduplicationInfo = {
      isDuplicate: Boolean(isDuplicate),
      duplicateCount: Number(duplicateCount) || 1,
      keptInsteadId: keptInsteadId
    };
  }

  /**
   * Sets formatted date display strings
   * @param {string} displayText - Primary display text for the date
   * @param {string} relativeText - Relative time display (e.g., "2 hours ago")
   */
  setDateDisplay(displayText, relativeText = null) {
    this.dateDisplay = displayText;
    this.relativeDisplay = relativeText;
  }

  /**
   * Checks if this dataset has S3 timestamp information
   * @returns {boolean} True if timestamp is available
   */
  hasTimestamp() {
    return this.timestampAvailable;
  }

  /**
   * Checks if this dataset is marked as a duplicate
   * @returns {boolean} True if marked as duplicate
   */
  isDuplicateDataset() {
    return this.deduplicationInfo ? this.deduplicationInfo.isDuplicate : false;
  }

  /**
   * Gets the age of this dataset in milliseconds
   * @returns {number|null} Age in milliseconds or null if no timestamp
   */
  getAge() {
    if (!this.timestampAvailable) {
      return null;
    }
    return Date.now() - this.lastModified.getTime();
  }

  /**
   * Compares this dataset's timestamp with another dataset
   * @param {Dataset} otherDataset - Dataset to compare with
   * @returns {number} -1 if this is older, 1 if newer, 0 if same/no timestamps
   */
  compareTimestamp(otherDataset) {
    if (!this.timestampAvailable || !otherDataset.timestampAvailable) {
      return 0;
    }

    const thisTime = this.lastModified.getTime();
    const otherTime = otherDataset.lastModified.getTime();

    if (thisTime < otherTime) return -1;
    if (thisTime > otherTime) return 1;
    return 0;
  }

  /**
   * Returns a copy of this dataset
   * @returns {Dataset} Cloned dataset
   */
  clone() {
    const cloned = new Dataset(
      this.id,
      this.title,
      this.description,
      this.creator,
      this.dateCreated,
      this.distribution ? [...this.distribution] : [],
      this.metadataUrl,
      this.isValid,
      this.section,
      this.projectPath,
      this.lastModified,
      this.metadataKey
    );

    // Copy enhanced fields
    cloned.dateDisplay = this.dateDisplay;
    cloned.relativeDisplay = this.relativeDisplay;
    cloned.deduplicationInfo = this.deduplicationInfo ? { ...this.deduplicationInfo } : null;

    return cloned;
  }

  /**
   * Converts the dataset to a plain object for serialization
   * @returns {Object} Plain object representation
   */
  toObject() {
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
      timestampAvailable: this.timestampAvailable,
      dateDisplay: this.dateDisplay,
      relativeDisplay: this.relativeDisplay,
      deduplicationInfo: this.deduplicationInfo
    };
  }

  /**
   * Creates a Dataset from a plain object
   * @param {Object} obj - Plain object representation
   * @returns {Dataset} New Dataset instance
   */
  static fromObject(obj) {
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
      obj.lastModified ? new Date(obj.lastModified) : null,
      obj.metadataKey
    );

    // Restore enhanced fields
    dataset.dateDisplay = obj.dateDisplay;
    dataset.relativeDisplay = obj.relativeDisplay;
    dataset.deduplicationInfo = obj.deduplicationInfo;

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

export { Dataset, Distribution, S3Object };