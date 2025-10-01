
# Implementation Plan: S3 Dataset Catalog Browser - Date Cards & Deduplication

**Branch**: `001-an-s3-bucket` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/valentin/development/dev_resilient/quick_s3_catalog/specs/001-an-s3-bucket/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Enhancement to existing S3 Dataset Catalog Browser to add timestamp information from S3 object lastModified dates to dataset cards and implement deduplication logic to show only the latest version when multiple datasets have the same title. Technical approach involves extending the existing browser-based catalog service to incorporate S3 object metadata and adding filtering logic to the catalog index.

## Technical Context
**Language/Version**: JavaScript ES2020+, Node.js 18+ for CLI tools
**Primary Dependencies**: AWS SDK for JavaScript, schema.org validation, DOM manipulation library, existing catalog-core modules
**Storage**: S3 bucket (read-only access), JSON metadata files, no local persistence required
**Testing**: Jest for unit tests, Playwright for integration tests, contract testing for S3 API
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+), CLI tools for Node.js
**Project Type**: web - frontend JavaScript library with backend CLI support tools
**Performance Goals**: Flexible performance per clarifications - no specific timing constraints
**Constraints**: Public read-only access, trust in the validity of schema.org Dataset JSON, deduplication based on title matching, lastModified timestamp from S3 objects
**Scale/Scope**: Enhancement to existing catalog display for hundreds to thousands of datasets, adds date display and deduplication features

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Library-First Architecture**: ✅ PASS
- Enhancement builds on existing catalog-core, catalog-ui, and catalog-cli modules
- New date and deduplication features will extend existing library functionality
- Clear separation maintained between data processing, presentation, and CLI

**II. CLI Interface Standard**: ✅ PASS
- Existing CLI tools will inherit date display and deduplication features
- Text I/O protocol maintained for automation compatibility
- JSON and human-readable output formats preserved

**III. Test-Driven Development**: ✅ PASS
- Contract tests will be enhanced for S3 object metadata handling
- Integration tests for deduplication logic before implementation
- Unit tests for date formatting and filtering before coding

**IV. Integration Testing Focus**: ✅ PASS
- S3 API integration tests critical for lastModified timestamp handling
- Cross-browser compatibility testing for date display
- Contract testing for enhanced dataset objects

**V. Observability & Simplicity**: ✅ PASS
- Simple date formatting and title-based deduplication - no complex algorithms
- S3 API calls will maintain structured logging
- YAGNI applied: no advanced date filtering or complex deduplication rules

## Project Structure

### Documentation (this feature)
```
specs/001-an-s3-bucket/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── catalog-core/           # Core S3 and schema.org functionality
│   ├── s3-client.js       # Enhanced with lastModified timestamp handling
│   ├── dataset-parser.js  # Enhanced to include S3 object metadata
│   ├── catalog-service.js # Enhanced with deduplication logic
│   ├── catalog-index.js   # Enhanced filtering for deduplication
│   └── models.js          # Enhanced Dataset model with lastModified
├── catalog-ui/            # Browser UI components
│   ├── catalog-browser.js # Enhanced with deduplication options
│   ├── search-filter.js   # Enhanced with date display toggle
│   └── dataset-display.js # Enhanced to show lastModified dates
└── catalog-cli/           # CLI interface
    ├── browse-command.js  # Enhanced with deduplication flags
    ├── search-command.js  # Enhanced with date and dedup options
    └── export-command.js  # Enhanced to export dates and handle dedup

tests/
├── contract/              # S3 API and schema.org contract tests
│   ├── s3-api.test.js    # Enhanced S3 API contracts
│   └── schema-org.test.js # Enhanced schema.org Dataset contracts
├── integration/           # End-to-end integration tests
│   ├── catalog-browser.test.js # Enhanced catalog workflow tests
│   └── cli-integration.test.js # Enhanced CLI command integration
└── unit/                  # Unit tests for individual components
    ├── dataset-parser.test.js  # Enhanced with date handling tests
    ├── search-filter.test.js   # Enhanced with deduplication tests
    └── catalog-service.test.js # Enhanced with date and dedup tests
```

**Structure Decision**: Web application structure maintained - existing frontend library with CLI support tools. The enhancement extends the existing catalog-core for data processing, catalog-ui for browser interactions, and catalog-cli for command-line interface per constitutional requirements.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh gemini`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
