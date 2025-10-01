# Research: S3 Dataset Catalog Browser - Date Cards & Deduplication

**Input**: Enhancement requirements for adding timestamp information and deduplication features
**Feature**: 001-an-s3-bucket
**Date**: 2025-10-01

## Research Summary

This research focuses on extending the existing S3 Dataset Catalog Browser to add two key features:
1. Display S3 object lastModified timestamps on dataset cards
2. Implement title-based deduplication to show only latest versions

## Technical Decisions

### 1. S3 Object Timestamp Handling

**Decision**: Use S3 ListObjects API lastModified timestamp for dataset cards

**Rationale**:
- S3 object lastModified is reliable and automatically maintained by S3
- Existing S3ClientBrowser already fetches this data during listObjects()
- No additional API calls required, improves performance
- lastModified represents when metadata.json was uploaded/updated

**Alternatives considered**:
- Parse dates from schema.org dateCreated: Less reliable, not always present
- Use current timestamp: Doesn't reflect actual data freshness
- Parse filename patterns: Fragile, not standardized across datasets

### 2. Date Display Format

**Decision**: Display dates in user-friendly format with relative time option

**Rationale**:
- Users need to quickly identify dataset recency
- Relative time (e.g., "2 days ago") provides immediate context
- Absolute date as fallback/tooltip for precision

**Alternatives considered**:
- ISO format only: Too technical for general users
- Relative time only: Loses precision for older datasets
- No date display: Misses user value for data freshness assessment

### 3. Deduplication Strategy

**Decision**: Implement title-based deduplication with lastModified sorting

**Rationale**:
- Dataset title is the most common identifier users recognize
- Simple string matching is reliable and predictable
- lastModified provides clear "latest" determination
- Preserves user control with toggle option

**Alternatives considered**:
- Content hash deduplication: Too complex, requires file analysis
- Path-based deduplication: Fragile, path structures vary
- No deduplication: Users overwhelmed by duplicate datasets
- Manual user selection: Too complex for browse workflow

### 4. Implementation Architecture

**Decision**: Extend existing catalog architecture with minimal changes

**Rationale**:
- Leverages existing S3ClientBrowser timestamp collection
- Builds on proven DatasetParser and CatalogIndex patterns
- Maintains backward compatibility
- Follows constitutional library-first approach

**Alternatives considered**:
- Complete rewrite: Unnecessary, existing architecture works well
- Server-side processing: Violates current client-side design
- Separate date service: Over-engineering for simple feature

### 5. User Interface Design

**Decision**: Add date badges to existing dataset cards with deduplication toggle

**Rationale**:
- Non-intrusive addition to existing card layout
- Toggle gives users choice between full and deduplicated views
- Consistent with existing UI patterns in catalog browser

**Alternatives considered**:
- Separate date column: Changes layout significantly
- Date-only view mode: Too limiting for user workflow
- Always-on deduplication: Removes user choice

### 6. Browser Compatibility

**Decision**: Use standard JavaScript Date API with fallback formatting

**Rationale**:
- Intl.RelativeTimeFormat supported in target browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Graceful degradation for edge cases
- No additional dependencies required

**Alternatives considered**:
- Date library (moment.js/date-fns): Adds dependency for simple feature
- Server-side formatting: Violates client-side architecture
- No relative formatting: Reduces user experience value

## Implementation Considerations

### Performance Impact
- Minimal: S3 timestamps already collected during listObjects()
- Deduplication adds O(n log n) sorting step, acceptable for target scale
- UI updates use existing dataset display patterns

### Testing Strategy
- Unit tests for date formatting functions
- Integration tests for deduplication logic
- Browser compatibility tests for date display
- Contract tests for enhanced S3 object handling

### Risk Assessment
- **Low risk**: Building on proven architecture
- **Complexity**: Simple feature, well-defined scope
- **Compatibility**: Uses existing browser APIs and patterns
- **Rollback**: Feature can be toggled off without data loss

## Phase 0 Complete

All technical unknowns resolved. No NEEDS CLARIFICATION items remaining. Ready for Phase 1 design and contracts.