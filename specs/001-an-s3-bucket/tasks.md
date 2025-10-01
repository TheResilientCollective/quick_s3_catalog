# Tasks: S3 Dataset Catalog Browser

**Input**: Design documents from `/specs/001-an-s3-bucket/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Path Conventions
- Paths are based on the `plan.md` single project structure: `src/`, `tests/` at the repository root.

## Phase 3.1: Setup
- [x] T001 Create project structure: `src/catalog-core`, `src/catalog-ui`, `src/catalog-cli`, `tests/contract`, `tests/integration`, `tests/unit`
- [x] T002 Initialize Node.js project and install dependencies: `minio`, `jest`, `playwright`
- [x] T003 [P] Configure ESLint and Prettier for code quality and consistency

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test for S3 API `/bucket-scan` in `tests/contract/s3-api.test.js`
- [x] T005 [P] Contract test for S3 API `/metadata/{objectKey}` in `tests/contract/s3-api.test.js`
- [x] T006 [P] Contract test for Catalog Interface `/catalog/load` in `tests/contract/catalog-interface.test.js`
- [x] T007 [P] Contract test for Catalog Interface `/catalog/search` in `tests/contract/catalog-interface.test.js`
- [x] T008 [P] Contract test for Catalog Interface `/catalog/datasets` in `tests/contract/catalog-interface.test.js`
- [x] T009 [P] Integration test for loading and displaying the catalog in `tests/integration/catalog-browser.test.js`
- [x] T010 [P] Integration test for search functionality in `tests/integration/catalog-browser.test.js`
- [x] T011 [P] Integration test for handling invalid metadata in `tests/integration/catalog-browser.test.js`
- [x] T012 [P] Integration test for CLI `browse` command in `tests/integration/cli-integration.test.js`
- [x] T013 [P] Integration test for CLI `search` command in `tests/integration/cli-integration.test.js`
- [x] T014 [P] Integration test for CLI `export` command in `tests/integration/cli-integration.test.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T015 [P] Define data models for `Dataset`, `Distribution`, `S3Object` in `src/catalog-core/models.js`
- [x] T016 [P] Implement `CatalogIndex` class for in-memory search in `src/catalog-core/catalog-index.js`
- [x] T017 Implement S3 client for bucket scanning in `src/catalog-core/s3-client.js`
- [x] T018 Implement S3 client for fetching metadata in `src/catalog-core/s3-client.js`
- [x] T019 Implement schema.org dataset parser in `src/catalog-core/dataset-parser.js`
- [x] T020 Implement `loadCatalog` logic in `src/catalog-core/catalog-service.js`
- [x] T021 Implement `search` logic in `src/catalog-core/catalog-service.js`
- [x] T022 Implement `getDatasets` logic in `src/catalog-core/catalog-service.js`
- [x] T023 Implement catalog browser UI component in `src/catalog-ui/catalog-browser.js`
- [x] T024 Implement search filter UI component in `src/catalog-ui/search-filter.js`
- [x] T025 Implement dataset display component in `src/catalog-ui/dataset-display.js`
- [x] T026 Implement CLI `browse` command in `src/catalog-cli/browse-command.js`
- [x] T027 Implement CLI `search` command in `src/catalog-cli/search-command.js`
- [x] T028 Implement CLI `export` command in `src/catalog-cli/export-command.js`

## Phase 3.4: Integration
- [x] T029 Connect UI components (`catalog-browser.js`, `search-filter.js`) to the `CatalogService`
- [x] T030 Add structured error handling and logging for all S3 API calls in `s3-client.js`
- [x] T031 Ensure public bucket CORS configuration is documented and handled for browser-based S3 access

## Phase 3.5: Polish
- [x] T032 [P] Unit tests for `dataset-parser.js` in `tests/unit/dataset-parser.test.js`
- [x] T033 [P] Unit tests for `search-filter.js` logic in `tests/unit/search-filter.test.js`
- [x] T034 [P] Unit tests for `catalog-service.js` in `tests/unit/catalog-service.test.js`
- [x] T035 [P] Add performance benchmarks for catalog loading and search operations
- [x] T036 [P] Update `README.md` with comprehensive usage instructions for the library and CLI
- [x] T037 Refactor and remove any code duplication identified during implementation

## Phase 3.6: Live Data Integration (FR-009)
- [x] T038 Create browser-compatible S3 client for live data access in `src/catalog-core/browser/s3-client-browser.js`
- [x] T039 Update browser catalog service to use live S3 data in `src/catalog-core/browser/catalog-service.js`
- [x] T040 Update `index.html` to use live S3 data instead of mock service
- [x] T041 Test live data integration and validate downloadable links functionality

## Dependencies
- **Setup (T001-T003)** must be done first.
- **Tests (T004-T014)** must be written and failing before Core Implementation.
- **T015 (Models)** blocks T019, T020, T021, T022.
- **T016 (CatalogIndex)** blocks T021.
- **T017, T018 (S3 Client)** block T020.
- **T019 (Parser)** blocks T020.
- **T020, T022 (Service)** block T023, T026.
- **T021 (Service)** blocks T024, T027.
- **Core Implementation (T015-T028)** must be complete before Polish.

## Parallel Example
```
# The following test creation tasks can be run in parallel:
Task: "Contract test for S3 API /bucket-scan in tests/contract/s3-api.test.js"
Task: "Contract test for Catalog Interface /catalog/load in tests/contract/catalog-interface.test.js"
Task: "Integration test for loading and displaying the catalog in tests/integration/catalog-browser.test.js"
Task: "Integration test for CLI browse command in tests/integration/cli-integration.test.js"
```