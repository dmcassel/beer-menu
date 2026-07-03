---
description: Generate GitHub issues (user stories) from a PRD
argument-hint: <path-to-prd> [--milestone MILESTONE] [--label LABEL]
---

# Create GitHub Issues from PRD

Generate structured user stories from a Product Requirements Document. When the `gh` CLI is available, automatically creates the issues on GitHub.

**Input**: $ARGUMENTS

---

## Phase 1: LOAD

Read the PRD file provided as input. If no path given, look for:

1. `.agents/PRDs/*.prd.md` files
2. `PRD.md` at project root
3. Ask the user which PRD to use

Extract:

- User stories already defined in the PRD
- Acceptance criteria from success criteria and requirements
- Implementation phases and their deliverables
- Technical constraints and dependencies

Parse optional flags from arguments:

- `--milestone` or `-m`: GitHub milestone title to assign issues to (e.g., `v1.0`)
- `--label` or `-l`: Additional label(s) to apply to all created issues (e.g., `backend`)

---

## Phase 2: ANALYZE

### Break Down into Stories

For each feature or requirement in the PRD:

1. **Create a user story** in the format:

   ```
   As a [user type], I want to [action], so that [benefit]
   ```

2. **Define acceptance criteria** (3-5 per story):

   ```
   Given [context], when [action], then [expected result]
   ```

3. **Estimate complexity**: Small / Medium / Large
   - Small: Single file change, clear implementation
   - Medium: Multiple files, some design decisions
   - Large: Cross-cutting concerns, architecture changes

4. **Identify dependencies** between stories

### Story Categories

Group stories by type:

- **Feature**: New functionality (label: `feature`)
- **Enhancement**: Improvement to existing functionality (label: `enhancement`)
- **Bug**: Fix for known issues (label: `bug`)
- **Technical**: Infrastructure, refactoring, tooling (label: `technical`)
- **Spike**: Research or investigation needed (label: `spike`)

---

## Phase 3: STRUCTURE

### For Each Story, Create

```markdown
## [STORY-ID] Story Title

**Type**: Feature | Enhancement | Technical | Spike
**Labels**: feature | enhancement | bug | technical | spike
**Priority**: High | Medium | Low
**Complexity**: Small | Medium | Large
**Phase**: (from PRD implementation phases)
**Labels**: (relevant labels like `frontend`, `backend`, `api`, `database`)

### Description

As a [user type], I want to [action], so that [benefit].

### Acceptance Criteria

- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

### Technical Notes

- Key implementation details
- Files likely to be modified
- Patterns to follow (reference CLAUDE.md or project conventions)

### Dependencies

- Blocked by: [other story IDs]
- Blocks: [other story IDs]
```

### Ordering

Order stories by:

1. Phase (from PRD implementation phases)
2. Dependencies (blocked stories come after their blockers)
3. Priority (High first within each phase)

---

## Phase 4: VALIDATE

Before output, verify:

- [ ] Every PRD requirement maps to at least one story
- [ ] No story is too large (break down if > 1 day of work)
- [ ] Acceptance criteria are testable and specific
- [ ] Dependencies form a valid DAG (no circular dependencies)
- [ ] Stories cover the full SDLC: types, validation, services, routes, UI, tests
- [ ] Each story can be independently reviewed and merged

---

## Phase 5: OUTPUT

Create the directory if it doesn't exist: `mkdir -p .agents/stories`

Save the stories to `.agents/stories/` directory as a markdown file.

---

## Phase 6: GITHUB INTEGRATION (when gh CLI is available)

**Check if the `gh` CLI is available** by running `gh auth status`. If authenticated, offer to create the issues on GitHub.

### If gh CLI IS available:

1. **Ask the user** before creating issues:

   ```
   I've generated {count} issues. Would you like me to create these on GitHub?
   - Milestone: {MILESTONE} (or "none" if not provided via --milestone)
   - Extra label: {LABEL} (or "none" if not provided via --label)
   ```

2. **If user confirms**, create each issue with:

   ```bash
   gh issue create \
     --title "{story title}" \
     --body "{description + acceptance criteria in markdown}" \
     --label "{type-label}" \
     --label "{priority-label}" \
     --label "Claude" \
     [--milestone "{milestone}"] \
     [--label "{extra-label}"]
   ```

   Capture the returned issue URL for the report.

3. **Add each issue to the GitHub project** with status **"Todo"**:

   ```bash
   gh project item-add 1 --owner dmcassel --url <issue-url>
   ```

   Then update the item's Status field to "Todo" using the project's field/option IDs
   (look up with `gh project field-list 1 --owner dmcassel --format json`).

4. **If more than one issue was created**, also create an **Epic** issue:
   - Title: `EPIC: {feature/PRD name}`
   - Body: a list of links to all sub-issues (e.g. `- #42 Story title`)

   ```bash
   gh issue create \
     --title "EPIC: {feature name}" \
     --body "{list of sub-issue links}" \
     --label "epic" \
     --label "Claude"
   ```

   Add the Epic to the project with status **"Todo"** as well.

5. **Report created issues**:

   ```markdown
   ## GitHub Issues Created

   | #   | Title              | Labels            | Project |
   | --- | ------------------ | ----------------- | ------- |
   | #42 | Story title        | feature, high     | Todo    |
   | #43 | Story title        | technical, medium | Todo    |
   | #44 | EPIC: Feature name | epic              | Todo    |

   ...
   ```

### If gh CLI is NOT available:

Output the stories as markdown only and note:

```
gh CLI is not installed or not authenticated. To push issues to GitHub automatically:
1. Install gh: https://cli.github.com
2. Authenticate: gh auth login
3. Re-run this command
```

---

## Tips

- Each story should map to exactly one PR. If implementing a story would produce
  a PR too large to review in one sitting (>400 lines or >10 files), break the
  story into smaller pieces before writing any code.
- Keep stories small enough to complete in 1-2 days
- Acceptance criteria should be verifiable without asking the author
- Technical stories need acceptance criteria too (build passes, tests pass, etc.)
- Include a "definition of done" story if the team doesn't have one
- Reference the PRD section for each story so reviewers can trace back
- GitHub renders markdown in issue bodies natively — no special formatting flags needed
