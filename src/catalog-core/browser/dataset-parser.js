import { Dataset, Distribution } from './models.js';

class DatasetParser {
  static parse(metadata, objectKey) {
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

      return new Dataset(
        id,
        json.name,
        json.description,
        json.creator,
        json.dateCreated,
        distributions,
        objectKey, // metadataUrl is the full key to the .metadata.json file
        true,
        section,
        projectPath
      );
    } catch (error) {
      // Return an invalid dataset object if parsing fails
      return new Dataset(objectKey, 'Invalid Metadata', error.message, null, null, [], objectKey, false, null, null);
    }
  }
}

export { DatasetParser };