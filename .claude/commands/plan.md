---
description: Create implementation plan with codebase analysis
argument-hint: <feature description | path/to/prd.md>
---

# Implementation Plan Generator

**Input**: $ARGUMENTS

## Objective

Transform the input into a battle-tested implementation plan through codebase exploration and pattern extraction.

**Core Principle**: PLAN ONLY - no code written. Create a context-rich document that enables one-pass implementation.

**Order**: CODEBASE FIRST. Solutions must fit existing patterns.

---

## Phase 1: PARSE

### Determine Input Type

| Input            | Action                               |
| ---------------- | ------------------------------------ |
| `.prd.md` file   | Read PRD, extract next pending phase |
| Other `.md` file | Read and extract feature description |
| Free-form text   | Use directly as feature input        |
| Blank            | Use conversation context             |

### Extract Feature Understanding

- **Problem**: What are we solving?
- **User Story**: As a [user], I want to [action], so that [benefit]
- **Type**: NEW_CAPABILITY / ENHANCEMENT / REFACTOR / BUG_FIX
- **Complexity**: LOW / MEDIUM / HIGH
- **GitHub Issue**: If a GitHub issue number (e.g., `42`) is available in the conversation context — from a prior `/prime` command, user mention, or PRD — capture it. This is optional but should be included in the plan metadata when available so that `/implement` can update the issue after completion.

---

## Phase 2: SYNC CODEBASE

Before exploring, ensure the codebase is up to date:

```bash
# If not on main, switch to it
git checkout main

# Pull latest changes and prune stale remote branches
git pull -p
```

---

## Phase 3: EXPLORE

### Study the Codebase

Use the Explore agent to find:

1. **Similar implementations** - analogous features with file:line references
2. **Naming conventions** - actual examples from the codebase
3. **Error handling patterns** - how errors are created and handled
4. **Type definitions** - relevant interfaces and types
5. **Test patterns** - test file structure and assertion styles

### Document Patterns

| Category | File:Lines              | Pattern               |
| -------- | ----------------------- | --------------------- |
| NAMING   | `path/to/file.ts:10-15` | {pattern description} |
| ERRORS   | `path/to/file.ts:20-30` | {pattern description} |
| TYPES    | `path/to/file.ts:1-10`  | {pattern description} |
| TESTS    | `path/to/test.ts:1-25`  | {pattern description} |

---

## Phase 4: DESIGN

### Map the Changes

- What files need to be created?
- What files need to be modified?
- What's the dependency order?

### PR Size Check

Before generating the plan, count the files to change. If the plan requires
more than 10 file changes OR touches more than one independent concern, STOP
and split it into multiple sequential plans, each targeting its own PR.

A concern is independent if it could be reviewed and merged without the other.
Examples that must be split:

- Schema migration + feature using that schema → two plans
- Backend tRPC router + frontend UI → one plan only if both are trivially small
- Refactor + new feature → always two plans

Each plan should be completable as a PR reviewable in under 30 minutes.

### Identify Risks

| Risk              | Mitigation      |
| ----------------- | --------------- |
| {potential issue} | {how to handle} |

---

## Phase 5: GENERATE

### Create Plan File

**Output path**: `.agents/plans/{kebab-case-name}.plan.md`

```bash
mkdir -p .agents/plans
```

```markdown
# Plan: {Feature Name}

## Summary

{One paragraph: What we're building and approach}

## User Story

As a {user type}
I want to {action}
So that {benefit}

## Metadata

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| Type             | {type}                                         |
| Complexity       | {LOW/MEDIUM/HIGH}                              |
| Systems Affected | {list}                                         |
| GitHub Issue     | {issue number if available, e.g. 42, or "N/A"} |

---

## Patterns to Follow

### Naming
```

// SOURCE: {file:lines}
{actual code snippet}

```

### Error Handling
```

// SOURCE: {file:lines}
{actual code snippet}

```

### Tests
```

// SOURCE: {file:lines}
{actual code snippet}

````

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.ts` | CREATE | {why} |
| `path/to/other.ts` | UPDATE | {why} |

---

## Tasks

Execute in order. Each task is atomic and verifiable.

### Task 1: {Description}

- **File**: `path/to/file.ts`
- **Action**: CREATE / UPDATE
- **Implement**: {what to do}
- **Mirror**: `path/to/example.ts:lines` - follow this pattern
- **Validate**: `npm run check`

### Task 2: {Description}

- **File**: `path/to/file.ts`
- **Action**: CREATE / UPDATE
- **Implement**: {what to do}
- **Mirror**: `path/to/example.ts:lines`
- **Validate**: `npm run check`

{Continue for each task...}

---

## Validation

```bash
# Format (auto-fixes in place)
npm run format

# Type check
npm run check

# Production build (catches bundling issues npm run check won't)
npm run build

# Tests
npm test
````

---

## Acceptance Criteria

- [ ] All tasks completed
- [ ] Type check passes
- [ ] Tests pass
- [ ] Follows existing patterns

````

---

## Phase 6: GITHUB PROJECT UPDATE

If the plan has a GitHub Issue number in its Metadata table:

1. Move the issue to **"In Progress"** in the GitHub project:
   ```bash
   # Add item if not already in project
   gh project item-add 1 --owner dmcassel --url <issue-url>
   # Update Status field to "In Progress"
   # (look up field/option IDs with: gh project field-list 1 --owner dmcassel --format json)
````

2. If the issue belongs to an Epic (check for issues that link to it, or ask the user), also move the Epic to **"In Progress"** if this is the first sub-issue being planned.

---

## Phase 7: OUTPUT

```markdown
## Plan Created

**File**: `.agents/plans/{name}.plan.md`

**Summary**: {2-3 sentence overview}

**Scope**:

- {N} files to CREATE
- {M} files to UPDATE
- {K} total tasks

**Key Patterns**:

- {Pattern 1 with file:line}
- {Pattern 2 with file:line}

**GitHub Issue**: {#number moved to "In Progress", or "N/A"}

**Next Step**: Review the plan, then implement tasks in order.
```
