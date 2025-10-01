const { DatasetParser } = require('../../src/catalog-core/dataset-parser');

describe('DatasetParser', () => {
  test('should parse valid metadata', () => {
    const metadata = '{"@type":"Dataset","name":"Test Dataset","description":"Test Description"}';
    const dataset = DatasetParser.parse(metadata, 'data/test/metadata.json');
    expect(dataset.isValid).toBe(true);
    expect(dataset.title).toBe('Test Dataset');
  });

  test('should handle invalid metadata', () => {
    const metadata = 'invalid-json';
    const dataset = DatasetParser.parse(metadata, 'data/test/metadata.json');
    expect(dataset.isValid).toBe(false);
  });
});
