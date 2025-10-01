# Data Model: S3 Dataset Catalog Browser

## Core Entities

### Dataset
**Purpose**: Represents a schema.org Dataset with associated data files in S3
**Fields**:
- `id: string` - Unique identifier (derived from S3 object key)
- `title: string` - Dataset title from schema.org metadata (required)
- `description: string` - Dataset description from schema.org metadata (required)
- `creator: string | Organization` - Dataset creator from schema.org metadata
- `dateCreated: Date` - Creation date from schema.org metadata
- `distribution: Distribution[]` - Array of downloadable data files
- `metadataUrl: string` - S3 URL of the metadata.json file
- `isValid: boolean` - Whether metadata parsing succeeded
- `section: string` - Top-level folder section (data, health, tijuana)
- `projectPath: string` - Full project path within section (e.g., "sd_complaints", "study-1")

**Validation Rules**:
- Title and description are required for display
- dateCreated must be valid ISO 8601 date if present
- At least one distribution should exist for download functionality
- Schema.org type must be "Dataset"

**Relationships**:
- Dataset hasMany Distributions (data files)
- Dataset belongsTo S3Bucket (location)

### Distribution (schema.org DataDownload)
**Purpose**: Represents downloadable data files following schema.org DataDownload specification
**Fields**:
- `@type: string` - Always "DataDownload" for schema.org compliance
- `name: string` - Human-readable name/title of the data file
- `description: string` - Description of this data file (optional)
- `contentUrl: string` - Direct S3 download URL (required)
- `encodingFormat: string` - MIME type (e.g., "text/csv", "application/json")
- `contentSize: string | number` - File size in bytes
- `uploadDate: Date` - When file was uploaded to S3 (optional)
- `datePublished: Date` - When data was published (optional)
- `keywords: string | string[]` - Keywords describing the data content
- `license: string | object` - License information (URL or License object)
- `creator: string | object` - Creator of this specific data file
- `inLanguage: string` - Language code (e.g., "en", "es") if applicable
- `measurementMethod: string` - How the data was collected/measured (optional)
- `measurementTechnique: string` - Specific technique used (optional)
- `sha256: string` - File hash for integrity verification (optional)
- `version: string | number` - Version of this data file (optional)

**Validation Rules**:
- contentUrl must be valid S3 URL
- encodingFormat should follow standard MIME type conventions (e.g., "text/csv", "application/json")
- contentSize must be positive integer if specified
- datePublished and uploadDate must be valid ISO 8601 dates if present
- inLanguage should follow ISO 639-1 language codes if specified
- sha256 should be valid SHA-256 hash if provided

**Relationships**:
- Distribution belongsTo Dataset

### S3Object
**Purpose**: Represents individual files in S3 bucket for scanning purposes
**Fields**:
- `key: string` - S3 object key (path)
- `lastModified: Date` - Last modification date from S3
- `size: number` - File size in bytes
- `etag: string` - S3 ETag for change detection
- `isMetadata: boolean` - Whether this is a metadata.json file
- `isDataFile: boolean` - Whether this is a dataset data file

**Validation Rules**:
- key must be valid S3 object key format
- lastModified must be valid date
- size must be non-negative integer

**Relationships**:
- S3Object belongsTo Dataset (when isDataFile = true)
- S3Object describes Dataset (when isMetadata = true)

### CatalogIndex
**Purpose**: In-memory index for search and sectioned organization
**Fields**:
- `sections: Map<string, Dataset[]>` - Datasets organized by top-level folder (data, health, tijuana)
- `searchableText: Map<string, string>` - Pre-computed search text per dataset
- `projectPaths: Map<string, string[]>` - Project paths within each section
- `lastUpdated: Date` - Timestamp of last index update

**Validation Rules**:
- sections map cannot be null and must contain entries for data, health, tijuana
- searchableText must contain entry for each dataset
- projectPaths must track all unique project paths per section

**Operations**:
- `search(query: string): Map<string, Dataset[]>` - Text search returning results organized by section
- `getSections(): string[]` - Return available top-level sections
- `getDatasetsInSection(section: string): Dataset[]` - Get all datasets in a specific section
- `update(newDatasets: Dataset[]): void` - Rebuild index with sectioned organization

## Entity State Transitions

### Dataset Lifecycle
1. **Discovered** - S3 object scan finds metadata.json file
2. **Parsing** - Schema.org metadata extraction in progress
3. **Valid** - Successfully parsed with required fields
4. **Invalid** - Parsing failed or missing required fields
5. **Indexed** - Added to searchable catalog index

### Error States
- **MissingMetadata** - metadata.json file not found
- **InvalidJSON** - metadata.json contains malformed JSON
- **MissingFiles** - Distribution references non-existent S3 objects

## Data Flow Patterns

### Catalog Loading Sequence
1. S3Client scans bucket for metadata.json files
2. DatasetParser processes each metadata file
3. Datasets with valid metadata are collected
4. CatalogIndex builds searchable structure
5. UI components receive indexed dataset collection

### Search Operation Flow
1. User enters search query
2. CatalogIndex searches pre-computed text fields across all sections
3. Matching datasets returned organized by section (data, health, tijuana)
4. UI updates display with filtered results maintaining sectioned organization

### Download Link Generation
1. User requests dataset access
2. Distribution contentUrl provides direct S3 link
3. Browser initiates download (no proxy needed)
4. Public bucket CORS allows direct access
