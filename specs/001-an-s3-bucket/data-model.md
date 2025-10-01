# Data Model: S3 Dataset Catalog Browser - Date Cards & Deduplication

**Feature**: 001-an-s3-bucket
**Date**: 2025-10-01
**Prerequisites**: research.md

## Entity Definitions

### Enhanced Dataset Entity

**Purpose**: Represents a dataset with S3 object metadata for date display and deduplication

**Fields**:
- `id` (string): Unique identifier derived from S3 object key
- `title` (string): Dataset title from schema.org metadata
- `description` (string): Dataset description from schema.org metadata
- `creator` (string): Dataset creator from schema.org metadata
- `dateCreated` (string|Date): Creation date from schema.org metadata
- `lastModified` (Date): **NEW** - S3 object lastModified timestamp
- `distribution` (Distribution[]): Array of data file distributions
- `metadataUrl` (string): S3 key to metadata.json file
- `isValid` (boolean): Whether metadata parsing succeeded
- `section` (string): Top-level folder section (data, health, tijuana)
- `projectPath` (string): Directory path within section

**Validation Rules**:
- `title` is required for deduplication logic
- `lastModified` must be valid Date object for sorting
- `id` must be unique within dataset collection
- `section` determines organizational grouping

**State Transitions**:
- Raw S3 object → Parsed Dataset → Enhanced with lastModified → Deduplicated (optional)

### Enhanced S3Object Entity

**Purpose**: Represents S3 objects with enhanced metadata for timestamp handling

**Fields**:
- `Key` (string): S3 object key/path
- `Size` (number): File size in bytes
- `LastModified` (Date): **ENHANCED** - Normalized Date object for consistent handling
- `ETag` (string): S3 entity tag for content verification
- `isMetadata` (boolean): Whether object is metadata.json file
- `isDataFile` (boolean): Whether object is dataset data file

**Validation Rules**:
- `LastModified` must be valid Date object
- `Key` must not be empty string
- `isMetadata` and `isDataFile` cannot both be true

### Deduplication Configuration Entity

**Purpose**: Configuration object for deduplication behavior

**Fields**:
- `enabled` (boolean): Whether deduplication is active
- `strategy` (string): Deduplication strategy ('title-based')
- `keepLatest` (boolean): Keep latest version based on lastModified
- `caseSensitive` (boolean): Whether title matching is case-sensitive

**Validation Rules**:
- `strategy` must be 'title-based' (future: could support other strategies)
- When `enabled` is true, `keepLatest` should be true
- Default configuration should be `{ enabled: false, strategy: 'title-based', keepLatest: true, caseSensitive: false }`

### Date Display Configuration Entity

**Purpose**: Configuration for how dates are displayed in UI

**Fields**:
- `format` (string): Date format preference ('relative', 'absolute', 'both')
- `relativeThreshold` (number): Days threshold for switching from relative to absolute
- `locale` (string): Locale for date formatting
- `showTooltip` (boolean): Whether to show absolute date in tooltip

**Validation Rules**:
- `format` must be one of: 'relative', 'absolute', 'both'
- `relativeThreshold` must be positive number
- `locale` should follow BCP 47 language tag format
- Default: `{ format: 'both', relativeThreshold: 30, locale: 'en-US', showTooltip: true }`

## Entity Relationships

### Dataset ↔ S3Object
- **One-to-One**: Each Dataset corresponds to one metadata.json S3Object
- **Key**: Dataset.metadataUrl → S3Object.Key
- **Constraint**: S3Object must have isMetadata = true

### Dataset ↔ Distribution
- **One-to-Many**: Each Dataset can have multiple Distribution objects
- **Key**: Embedded within Dataset.distribution array
- **Constraint**: Distribution.contentUrl should reference valid S3 objects

### Deduplication Group ↔ Dataset
- **One-to-Many**: Each deduplication group contains multiple Datasets with same title
- **Key**: Grouped by Dataset.title (case-insensitive matching)
- **Constraint**: Within group, only Dataset with latest lastModified is kept

## Data Flow

### 1. S3 Object Collection
```
S3 ListObjects API → S3Object[] (with LastModified)
```

### 2. Dataset Parsing
```
S3Object (metadata.json) + S3Object.LastModified → Dataset (with lastModified)
```

### 3. Deduplication Process
```
Dataset[] → GroupBy(title) → FilterByLatest(lastModified) → Dataset[]
```

### 4. Date Formatting
```
Dataset.lastModified + DateDisplayConfig → FormattedDateString
```

## Index Structures

### Enhanced CatalogIndex

**Purpose**: Search index with deduplication support

**New Methods**:
- `updateWithDeduplication(datasets, config)`: Update index with deduplication logic
- `setDeduplicationConfig(config)`: Configure deduplication behavior
- `getOriginalDatasets()`: Get datasets before deduplication
- `getDuplicateGroups()`: Get groups of duplicate datasets

**Index Keys**:
- `sections`: Map<string, Dataset[]> - existing section-based organization
- `originalSections`: Map<string, Dataset[]> - pre-deduplication datasets
- `duplicateGroups`: Map<string, Dataset[]> - datasets grouped by title
- `lastUpdated`: Date - index last update timestamp

## Validation Schema

### Dataset Validation
```javascript
{
  id: { type: 'string', required: true },
  title: { type: 'string', required: true, minLength: 1 },
  lastModified: { type: 'Date', required: true },
  section: { type: 'string', required: true },
  isValid: { type: 'boolean', required: true }
}
```

### S3Object Validation
```javascript
{
  Key: { type: 'string', required: true, minLength: 1 },
  LastModified: { type: 'Date', required: true },
  Size: { type: 'number', minimum: 0 }
}
```

## Migration Strategy

### Backward Compatibility
- Existing Dataset objects will work without lastModified field
- New lastModified field defaults to metadata file's LastModified
- Deduplication is opt-in feature (disabled by default)
- Date display is additive (doesn't break existing cards)

### Data Migration
- No database migration required (client-side only)
- Enhanced parsing occurs during S3 object processing
- Existing cached data will be refreshed with new fields

## Phase 1 Entities Complete

All entities defined with validation rules and relationships. Ready for contract generation and quickstart scenarios.