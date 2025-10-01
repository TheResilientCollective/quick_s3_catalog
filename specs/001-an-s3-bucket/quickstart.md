# Quickstart: S3 Dataset Catalog Browser - Date Cards & Deduplication

**Feature**: 001-an-s3-bucket
**Prerequisites**: research.md, data-model.md, contracts/
**Date**: 2025-10-01

## Test Scenarios

This quickstart validates the enhanced S3 Dataset Catalog Browser features through executable test scenarios.

### Scenario 1: Display S3 Object Timestamps on Dataset Cards

**Objective**: Verify that dataset cards show lastModified dates from S3 objects

**Setup**:
```javascript
// Load catalog with timestamp display enabled
const browser = new CatalogBrowser({
  selector: '#catalog-browser',
  bucketName: 'test-bucket',
  endpoint: 'https://test-endpoint.com',
  showTimestamps: true
});
```

**Test Steps**:
1. **Initialize catalog browser** with timestamp display enabled
2. **Load catalog data** from S3 bucket containing metadata files
3. **Verify S3 object timestamps** are captured during listObjects()
4. **Check dataset cards** display formatted lastModified dates
5. **Validate date formatting** shows both relative and absolute times

**Expected Results**:
- Each dataset card shows "Last updated: 2 days ago (Oct 1, 2025)"
- Timestamps reflect actual S3 object lastModified values
- Date formatting is user-friendly and localized
- Tooltip shows precise timestamp on hover

**Verification**:
```javascript
// Test dataset object includes lastModified
const datasets = await browser.catalogService.getDatasets();
const dataset = datasets['data'][0];
assert(dataset.lastModified instanceof Date);
assert(dataset.lastModified <= new Date()); // Not in future

// Test UI display includes formatted date
const cardElement = browser.datasetDisplay.render(dataset);
const dateText = cardElement.querySelector('.dataset-timestamp').textContent;
assert(dateText.includes('ago') || dateText.includes('2025'));
```

### Scenario 2: Title-Based Deduplication with Latest Version

**Objective**: Verify deduplication shows only latest version of datasets with same title

**Setup**:
```javascript
// Mock S3 data with duplicate titles and different timestamps
const mockS3Objects = [
  { Key: 'data/climate/v1/metadata.json', LastModified: new Date('2025-09-01') },
  { Key: 'data/climate/v2/metadata.json', LastModified: new Date('2025-10-01') },
  { Key: 'data/health/survey/metadata.json', LastModified: new Date('2025-09-15') }
];

const mockDatasets = [
  { title: 'Climate Dataset', lastModified: new Date('2025-09-01'), id: 'climate-v1' },
  { title: 'Climate Dataset', lastModified: new Date('2025-10-01'), id: 'climate-v2' },
  { title: 'Health Survey', lastModified: new Date('2025-09-15'), id: 'health-survey' }
];
```

**Test Steps**:
1. **Load catalog** with duplicate dataset titles
2. **Enable deduplication** using browser controls
3. **Verify duplicate detection** groups datasets by title
4. **Check latest version selection** based on lastModified
5. **Validate display** shows only latest version per title

**Expected Results**:
- 3 datasets load initially (2 climate + 1 health)
- Deduplication reduces to 2 datasets (latest climate + health)
- Latest climate dataset (v2, Oct 1) is shown, v1 is hidden
- Health survey remains visible (no duplicates)
- UI indicates "1 duplicate hidden" or similar

**Verification**:
```javascript
// Test deduplication logic
const allDatasets = await browser.catalogService.getDatasets();
const dedupConfig = { enabled: true, strategy: 'title-based', keepLatest: true };
const deduplicatedDatasets = browser.catalogService.deduplicateDatasets(allDatasets, dedupConfig);

assert(allDatasets.totalCount === 3);
assert(deduplicatedDatasets.totalCount === 2);
assert(deduplicatedDatasets.duplicatesRemoved === 1);

// Test UI shows correct datasets
const climateDatasets = deduplicatedDatasets['data'].filter(d => d.title === 'Climate Dataset');
assert(climateDatasets.length === 1);
assert(climateDatasets[0].id === 'climate-v2'); // Latest version
```

### Scenario 3: Deduplication Toggle Control

**Objective**: Verify users can toggle deduplication on/off with immediate UI updates

**Setup**:
```javascript
// Catalog with duplicate datasets loaded
const browser = new CatalogBrowser({
  selector: '#catalog-browser',
  bucketName: 'test-bucket',
  deduplication: { enabled: false } // Start with deduplication off
});
```

**Test Steps**:
1. **Load catalog** with deduplication disabled (show all datasets)
2. **Count displayed datasets** (should include duplicates)
3. **Toggle deduplication ON** using UI control
4. **Verify immediate update** (duplicates hidden, count reduced)
5. **Toggle deduplication OFF** (all datasets visible again)

**Expected Results**:
- Initial load shows all datasets including duplicates
- Toggle to ON reduces displayed count and shows "deduplicated" indicator
- Toggle to OFF restores full dataset list
- UI provides clear feedback about deduplication state
- Performance is acceptable for toggle operations

**Verification**:
```javascript
// Test toggle functionality
const initialCount = browser.getDisplayedDatasetCount();
browser.toggleDeduplication(true);
const deduplicatedCount = browser.getDisplayedDatasetCount();
browser.toggleDeduplication(false);
const restoredCount = browser.getDisplayedDatasetCount();

assert(deduplicatedCount < initialCount); // Some duplicates removed
assert(restoredCount === initialCount);   // All datasets restored

// Test UI state indicator
const toggleElement = document.querySelector('.deduplication-toggle');
assert(toggleElement.checked === false); // Currently off
```

### Scenario 4: Search with Deduplication

**Objective**: Verify search results respect deduplication settings

**Setup**:
```javascript
// Search with deduplication enabled
const searchQuery = 'climate';
const searchOptions = { deduplicate: true };
```

**Test Steps**:
1. **Enable deduplication** in catalog settings
2. **Perform search** for "climate" (matches multiple versions)
3. **Verify search results** show only latest version
4. **Disable deduplication** and repeat search
5. **Confirm all versions** appear in non-deduplicated search

**Expected Results**:
- Search with deduplication ON returns 1 climate dataset (latest)
- Search with deduplication OFF returns 2 climate datasets (all versions)
- Search metadata indicates deduplication status
- Search performance remains acceptable

**Verification**:
```javascript
// Test search with deduplication
const dedupResults = await browser.search('climate', { deduplicate: true });
const fullResults = await browser.search('climate', { deduplicate: false });

assert(dedupResults.totalResults < fullResults.totalResults);
assert(dedupResults.metadata.deduplicationEnabled === true);
assert(fullResults.metadata.deduplicationEnabled === false);
```

### Scenario 5: CLI Integration with Enhanced Features

**Objective**: Verify CLI commands support date display and deduplication options

**Setup**:
```bash
# CLI commands with new flags
node cli.js browse --show-dates --deduplicate
node cli.js search "health" --show-dates --no-deduplicate
```

**Test Steps**:
1. **Run browse command** with date display enabled
2. **Verify CLI output** includes formatted timestamps
3. **Run browse with deduplication** enabled
4. **Check dataset count reduction** in CLI output
5. **Test search command** with date and deduplication flags

**Expected Results**:
- CLI browse output includes "Last Modified" column
- Deduplication flag reduces output dataset count
- Date formatting is consistent between CLI and browser
- Help text documents new flags clearly

**Verification**:
```bash
# Test CLI date display
output=$(node cli.js browse --show-dates --format json)
echo "$output" | jq '.datasets[0].lastModified' # Should contain timestamp

# Test CLI deduplication
all_count=$(node cli.js browse --format json | jq '.datasets | length')
dedup_count=$(node cli.js browse --deduplicate --format json | jq '.datasets | length')
[ "$dedup_count" -le "$all_count" ] # Deduplication reduces or maintains count
```

## Integration Test Execution

### Prerequisites Validation
- [ ] S3 bucket accessible with test metadata files
- [ ] Browser environment supports required JavaScript APIs
- [ ] CLI environment has Node.js 18+ and dependencies installed

### Test Data Setup
- [ ] Create test metadata files with various timestamps
- [ ] Include duplicate titles with different lastModified dates
- [ ] Ensure valid and invalid metadata.json files for error testing

### Execution Checklist
- [ ] Scenario 1: Timestamp display ✓
- [ ] Scenario 2: Deduplication logic ✓
- [ ] Scenario 3: Toggle controls ✓
- [ ] Scenario 4: Search integration ✓
- [ ] Scenario 5: CLI integration ✓

### Success Criteria
- All test scenarios pass without errors
- UI updates are responsive and intuitive
- Date formatting is consistent and user-friendly
- Deduplication logic correctly identifies and handles duplicates
- CLI and browser features have parity where applicable

## Phase 1 Complete

Quickstart scenarios defined and ready for test-driven development. All contracts and test cases prepared for implementation phase.