# Quickstart Guide: S3 Dataset Catalog Browser

## Prerequisites
- Public S3 bucket with dataset files and metadata.json files
- Modern web browser or Node.js 18+ environment
- Basic understanding of schema.org Dataset structure

## Installation

### Browser Library
```html
<script type="module">
  import { CatalogBrowser } from './src/catalog-ui/catalog-browser.js';

  const catalog = new CatalogBrowser({
    bucketName: 'resilentpublic',
    endpoint: 'https://oss.resilientservice.mooo.com',
    region: 'us-east-1' // or appropriate region
  });

  await catalog.load();
</script>
```

### CLI Tool
```bash
npm install -g @quick-s3-catalog/cli

# Browse datasets
s3-catalog browse --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com

# Search datasets
s3-catalog search --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com --query "climate data"
```

## Basic Usage Examples

### 1. Load and Display Catalog
```javascript
import { CatalogService } from './src/catalog-core/catalog-service.js';

const service = new CatalogService('resilentpublic', {
  endpoint: 'https://oss.resilientservice.mooo.com',
  region: 'us-east-1'
});
const sections = await service.loadCatalog();

// Datasets are organized by top-level sections
console.log('Available sections:', Object.keys(sections));
// Example output: ['data', 'health', 'tijuana']

console.log(`Data section has ${sections.data.length} datasets`);
console.log(`Health section has ${sections.health.length} datasets`);
console.log(`Tijuana section has ${sections.tijuana.length} datasets`);
```

### 2. Search Datasets
```javascript
const searchResults = service.search('climate');
console.log(`Found ${searchResults.totalResults} matching datasets`);

// Results are organized by section
Object.entries(searchResults.sections).forEach(([section, datasets]) => {
  if (datasets.length > 0) {
    console.log(`\n${section.toUpperCase()} section:`);
    datasets.forEach(dataset => {
      console.log(`  ${dataset.projectPath} - ${dataset.title}`);
    });
  }
});
```

### 3. Access Download Links
```javascript
// Access datasets from a specific section
const datasetFromTijuana = sections.tijuana[0];
datasetFromTijuana.distribution.forEach(file => {
  console.log(`Download: ${file.name || file.encodingFormat} -> ${file.contentUrl}`);
});

// Example output:
// Download: csv -> tijuana/sd_complaints/output/complaints_by_date.csv
// Download: json -> tijuana/sd_complaints/output/complaints_by_date.json
```

### 4. Handle Invalid Metadata
```javascript
const sections = await service.loadCatalog();
let totalValid = 0, totalInvalid = 0;

Object.entries(sections).forEach(([section, datasets]) => {
  const valid = datasets.filter(d => d.isValid).length;
  const invalid = datasets.filter(d => !d.isValid).length;

  console.log(`${section}: ${valid} valid, ${invalid} invalid`);
  totalValid += valid;
  totalInvalid += invalid;
});

console.log(`Total: ${totalValid} valid, ${totalInvalid} invalid`);
```

## CLI Usage Examples

### Browse All Datasets
```bash
s3-catalog browse --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com
# Output: Datasets organized by sections with expandable display

s3-catalog browse --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com --format json
# Output: JSON object with sections containing dataset arrays
```

### Search Operations
```bash
s3-catalog search --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com --query "temperature"
# Output: Matching datasets organized by section

s3-catalog search --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com --query "ocean data" --format json
# Output: JSON object with sections containing matching datasets
```

### Export Dataset Information
```bash
s3-catalog export --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com --output datasets.csv
# Output: CSV file with dataset metadata

s3-catalog export --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com --output datasets.json --format json
# Output: JSON file with complete dataset information
```

## Expected S3 Bucket Structure

```
resilentpublic/
├── data/
│   ├── project-a/
│   │   ├── output/
│   │   │   ├── results.csv
│   │   │   ├── results.json
│   │   │   └── metadata.json        # Schema.org Dataset description
│   │   └── raw/
│   │       └── source-data.csv
│   └── environmental-study/
│       ├── output/
│       │   ├── analysis.csv
│       │   └── metadata.json
│       └── raw/
├── health/
│   ├── covid-analysis/
│   │   ├── output/
│   │   │   ├── cases.csv
│   │   │   └── metadata.json
│   │   └── raw/
│   └── survey-results/
│       ├── output/
│       └── raw/
└── tijuana/
    ├── sd_complaints/
    │   ├── output/
    │   │   ├── complaints_by_date.csv
    │   │   ├── complaints_by_date.json
    │   │   └── metadata.json        # Your example file
    │   └── raw/
    └── border-crossing-data/
        ├── output/
        └── raw/
```

## Sample metadata.json Structure

### Minimal Example (Recommended)
```json
{
  "@type": "Dataset",
  "name": "complaints_by_date",
  "description": "A daily count of the odor complaints from the San Diego Air Pollution Control District Complaints ArcGIS service",
  "distribution": [
    {
      "@type": "DataDownload",
      "encodingFormat": "csv",
      "contentUrl": "complaints/output/complaints_by_date.csv"
    },
    {
      "@type": "DataDownload",
      "encodingFormat": "json",
      "contentUrl": "complaints/output/complaints_by_date.json"
    }
  ]
}
```

### Comprehensive Example (With Optional Fields)
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Global Temperature Measurements",
  "description": "Daily temperature readings from weather stations worldwide, covering 2020-2023.",
  "creator": "Climate Research Institute",
  "dateCreated": "2023-01-15T10:00:00Z",
  "keywords": ["temperature", "climate", "weather stations", "global"],
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "distribution": [
    {
      "@type": "DataDownload",
      "name": "Temperature Data CSV",
      "description": "Primary temperature dataset in CSV format",
      "contentUrl": "climate-data/temperature.csv",
      "encodingFormat": "text/csv",
      "contentSize": "2048576",
      "datePublished": "2023-01-15T10:00:00Z",
      "measurementMethod": "Automatic weather station sensors",
      "version": "1.2"
    },
    {
      "@type": "DataDownload",
      "name": "Temperature Data JSON",
      "description": "Same temperature data in JSON format",
      "contentUrl": "climate-data/temperature.json",
      "encodingFormat": "application/json",
      "contentSize": "3145728",
      "datePublished": "2023-01-15T10:00:00Z",
      "version": "1.2"
    }
  ]
}
```

**Important Notes**:
- Use relative paths in `contentUrl` - the catalog will resolve them to full S3 URLs
- Simple format names ("csv", "json") or full MIME types ("text/csv", "application/json") both work
- Only `@type`, `name`, `description`, and `distribution` are required
- Multiple distributions allow offering the same data in different formats

## Validation Test Scenarios

### Test 1: Basic Catalog Loading
1. **Setup**: S3 bucket with 3 datasets (1 in data/, 1 in health/, 1 in tijuana/), each with valid metadata.json
2. **Action**: Load catalog using CatalogService
3. **Expected**: Sections object returned with data: [1 dataset], health: [1 dataset], tijuana: [1 dataset], all marked as valid

### Test 2: Search Functionality
1. **Setup**: Catalog with datasets titled "Climate Data" (in data/), "Ocean Study" (in health/), "Weather Patterns" (in tijuana/)
2. **Action**: Search for "climate"
3. **Expected**: Sections object returned with only data section containing "Climate Data" dataset, other sections empty

### Test 3: Download Link Access
1. **Setup**: Dataset with 2 distribution files
2. **Action**: Access dataset.distribution array
3. **Expected**: 2 distribution objects with valid S3 URLs

### Test 4: Invalid Metadata Handling
1. **Setup**: S3 bucket with 1 valid metadata.json and 1 malformed JSON file
2. **Action**: Load catalog
3. **Expected**: 2 dataset objects returned, 1 valid, 1 invalid

### Test 5: CLI Browse Command
1. **Setup**: Command line environment with catalog CLI installed
2. **Action**: Run `s3-catalog browse --bucket resilentpublic --endpoint https://oss.resilientservice.mooo.com`
3. **Expected**: Human-readable display with expandable sections (data, health, tijuana) containing their respective datasets

## Error Handling Scenarios

- **Bucket Access Denied**: Clear error message about S3 permissions
- **Malformed JSON**: Dataset marked as invalid but still appears in catalog
- **Missing Distribution Files**: Warning logged but dataset still usable
- **Network Timeout**: Graceful retry with exponential backoff
- **Empty Bucket**: Success response with empty dataset array

## Performance Expectations

- **Catalog Loading**: No specific timing requirements (per clarifications)
- **Search Operations**: Real-time response for up to 1000 datasets
- **Memory Usage**: Reasonable for browser environments
- **Bundle Size**: Minimal dependencies for library-first architecture