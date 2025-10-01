# Tasks: S3 Dataset Catalog Browser - Date Cards & Deduplication

**Input**: Design documents from `/Users/valentin/development/dev_resilient/quick_s3_catalog/specs/001-an-s3-bucket/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: JavaScript ES2020+, Node.js 18+, browser APIs
   → Libraries: AWS SDK, schema.org validation, existing catalog modules
   → Structure: Web app (frontend library + CLI tools)
2. Load design documents ✓:
   → data-model.md: 4 entities (Enhanced Dataset, S3Object, DeduplicationConfig, DateDisplayConfig)
   → contracts/: 2 files (enhanced-catalog-interface.json, enhanced-s3-api.json)
   → research.md: Technical decisions on timestamps, deduplication, UI design
   → quickstart.md: 5 test scenarios for feature validation
3. Generate tasks by category ✓
4. Apply task rules ✓
5. Number tasks sequentially ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [x] T001 Validate existing project structure for enhanced catalog features
- [x] T002 Install browser date formatting dependencies and update package.json
- [x] T003 [P] Configure linting rules for enhanced TypeScript/JavaScript features

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test for enhanced catalog interface in `tests/contract/enhanced-catalog-interface.test.js`
- [x] T005 [P] Contract test for enhanced S3 API interface in `tests/contract/enhanced-s3-api.test.js`
- [x] T006 [P] Integration test for S3 timestamp display scenario in `tests/integration/timestamp-display.test.js`
- [x] T007 [P] Integration test for title-based deduplication scenario in `tests/integration/title-deduplication.test.js`
- [x] T008 [P] Integration test for deduplication toggle control scenario in `tests/integration/deduplication-toggle.test.js`
- [x] T009 [P] Integration test for search with deduplication scenario in `tests/integration/search-deduplication.test.js`
- [x] T010 [P] Integration test for CLI enhanced features scenario in `tests/integration/cli-enhanced-features.test.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Models & Core Entities
- [x] T011 [P] Enhanced Dataset model with lastModified field in `src/catalog-core/models.js`
- [x] T012 [P] Enhanced S3Object model with timestamp normalization in `src/catalog-core/browser/s3-client-browser.js`
- [x] T013 [P] DeduplicationConfig entity with validation in `src/catalog-core/deduplication-config.js`
- [x] T014 [P] DateDisplayConfig entity with formatting options in `src/catalog-core/date-display-config.js`

### Services & Core Logic
- [x] T015 Enhanced S3ClientBrowser with lastModified timestamp handling in `src/catalog-core/browser/s3-client-browser.js`
- [x] T016 Enhanced DatasetParser to include S3 object metadata in `src/catalog-core/browser/dataset-parser.js`
- [x] T017 Enhanced CatalogIndex with deduplication support methods in `src/catalog-core/browser/catalog-index.js`
- [x] T018 Enhanced CatalogService with deduplication logic in `src/catalog-core/browser/catalog-service.js`

### User Interface Components
- [ ] T019 Enhanced DatasetDisplay with lastModified date rendering in `src/catalog-ui/dataset-display.js`
- [ ] T020 Enhanced SearchFilter with date display toggle in `src/catalog-ui/search-filter.js`
- [ ] T021 Enhanced CatalogBrowser with deduplication controls in `src/catalog-ui/catalog-browser.js`

### CLI Command Enhancements
- [ ] T022 [P] Enhanced browse command with --show-dates and --deduplicate flags in `src/catalog-cli/browse-command.js`
- [ ] T023 [P] Enhanced search command with date and deduplication options in `src/catalog-cli/search-command.js`
- [ ] T024 [P] Enhanced export command with date handling and deduplication in `src/catalog-cli/export-command.js`

## Phase 3.4: Integration
- [ ] T025 Date formatting utility functions with browser API compatibility in `src/catalog-core/date-utils.js`
- [ ] T026 Deduplication utility functions with title matching logic in `src/catalog-core/deduplication-utils.js`
- [ ] T027 Integration of enhanced features in main `index.html` demonstration
- [ ] T028 CLI help text updates for new flags and options

## Phase 3.5: Polish
- [ ] T029 [P] Unit tests for date formatting utilities in `tests/unit/date-utils.test.js`
- [ ] T030 [P] Unit tests for deduplication logic in `tests/unit/deduplication-utils.test.js`
- [ ] T031 [P] Unit tests for enhanced dataset parsing in `tests/unit/enhanced-dataset-parser.test.js`
- [ ] T032 [P] Performance tests for deduplication with large datasets in `tests/performance/deduplication-performance.test.js`
- [ ] T033 [P] Browser compatibility tests for date display in `tests/browser/date-display-compatibility.test.js`
- [ ] T034 [P] Update documentation for enhanced CLI flags in `README.md`
- [ ] T035 Code review and refactoring to remove duplication
- [ ] T036 Execute quickstart scenarios for full feature validation

## Dependencies
- Setup (T001-T003) before everything
- Tests (T004-T010) before implementation (T011-T028)
- Models (T011-T014) before services (T015-T018)
- Services (T015-T018) before UI components (T019-T021)
- Core implementation (T011-T024) before integration (T025-T028)
- Implementation (T011-T028) before polish (T029-T036)
- T015 depends on T012 (S3Object model)
- T016 depends on T011 (Enhanced Dataset model)
- T017 depends on T011, T013 (Dataset and DeduplicationConfig models)
- T018 depends on T015, T016, T017 (all service dependencies)
- T019 depends on T011, T014 (Dataset and DateDisplayConfig models)
- T020 depends on T013, T014 (both config models)
- T021 depends on T018, T019, T020 (all UI dependencies)

## Parallel Example
```
# Launch contract tests together (T004-T005):
Task: "Contract test for enhanced catalog interface in tests/contract/enhanced-catalog-interface.test.js"
Task: "Contract test for enhanced S3 API interface in tests/contract/enhanced-s3-api.test.js"

# Launch integration tests together (T006-T010):
Task: "Integration test for S3 timestamp display scenario in tests/integration/timestamp-display.test.js"
Task: "Integration test for title-based deduplication scenario in tests/integration/title-deduplication.test.js"
Task: "Integration test for deduplication toggle control scenario in tests/integration/deduplication-toggle.test.js"
Task: "Integration test for search with deduplication scenario in tests/integration/search-deduplication.test.js"
Task: "Integration test for CLI enhanced features scenario in tests/integration/cli-enhanced-features.test.js"

# Launch model creation together (T011-T014):
Task: "Enhanced Dataset model with lastModified field in src/catalog-core/models.js"
Task: "Enhanced S3Object model with timestamp normalization in src/catalog-core/browser/s3-client-browser.js"
Task: "DeduplicationConfig entity with validation in src/catalog-core/deduplication-config.js"
Task: "DateDisplayConfig entity with formatting options in src/catalog-core/date-display-config.js"

# Launch CLI enhancements together (T022-T024):
Task: "Enhanced browse command with --show-dates and --deduplicate flags in src/catalog-cli/browse-command.js"
Task: "Enhanced search command with date and deduplication options in src/catalog-cli/search-command.js"
Task: "Enhanced export command with date handling and deduplication in src/catalog-cli/export-command.js"

# Launch unit tests together (T029-T033):
Task: "Unit tests for date formatting utilities in tests/unit/date-utils.test.js"
Task: "Unit tests for deduplication logic in tests/unit/deduplication-utils.test.js"
Task: "Unit tests for enhanced dataset parsing in tests/unit/enhanced-dataset-parser.test.js"
Task: "Performance tests for deduplication with large datasets in tests/performance/deduplication-performance.test.js"
Task: "Browser compatibility tests for date display in tests/browser/date-display-compatibility.test.js"
```

## Notes
- [P] tasks target different files and have no dependencies
- Tests must fail before implementing functionality (TDD)
- Enhanced features build on existing catalog architecture
- Browser compatibility maintained for Chrome 90+, Firefox 88+, Safari 14+
- CLI and browser features maintain parity where applicable
- Deduplication is opt-in to preserve backward compatibility
- Date display is additive and non-breaking

## Task Generation Rules Applied
1. **From Contracts**: 2 contract files → 2 contract test tasks [P] (T004-T005)
2. **From Data Model**: 4 entities → 4 model creation tasks [P] (T011-T014)
3. **From Quickstart**: 5 scenarios → 5 integration test tasks [P] (T006-T010)
4. **From Architecture**: 3 CLI commands → 3 CLI enhancement tasks [P] (T022-T024)
5. **Ordering**: Setup → Tests → Models → Services → UI → CLI → Integration → Polish
6. **Dependencies**: Enforced through sequential numbering and explicit blocking

## Validation Checklist
- [x] All contracts have corresponding tests (T004-T005)
- [x] All entities have model tasks (T011-T014)
- [x] All tests come before implementation (T004-T010 before T011+)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (tests must fail before implementation)
- [x] All quickstart scenarios have integration tests (T006-T010)

## Feature Enhancement Summary
This task list implements:
1. **Date Display**: S3 object lastModified timestamps on dataset cards
2. **Title-Based Deduplication**: Show only latest versions of duplicate datasets
3. **Toggle Controls**: User-controllable deduplication with immediate UI updates
4. **Search Integration**: Deduplication-aware search functionality
5. **CLI Enhancement**: Date and deduplication flags for command-line tools
6. **Browser Compatibility**: Cross-browser date formatting and API usage
7. **Performance**: Efficient deduplication algorithms for thousands of datasets
8. **Testing**: Comprehensive test coverage for all enhancement features

Ready for task execution following Test-Driven Development principles.