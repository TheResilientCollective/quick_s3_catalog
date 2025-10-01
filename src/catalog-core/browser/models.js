class Dataset {
  constructor(id, title, description, creator, dateCreated, distribution, metadataUrl, isValid, section, projectPath) {
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