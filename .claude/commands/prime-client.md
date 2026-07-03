---
description: Prime agent with client/frontend codebase understanding
argument-hint: [github-issues]
---

# Prime Client: Load Frontend Context

**Input**: $ARGUMENTS

## Objective

Build comprehensive understanding of the client codebase by analyzing structure and key files.

## Process

### Step 0: Load External Context (if provided)

The argument is an optional GitHub issue number or comma-separated list of issue numbers (e.g., `42` or `42,43,44`).

If GitHub issue numbers are provided:

1. For each issue number, run `gh issue view {number} --json title,body,labels,assignees,comments`
2. Use the issue title, body, labels, and comments to inform your understanding of what work is expected

### Step 1: Analyze the Codebase

1. Study the pages (`client/src/pages/`) — one file per route, covers beers, wines, styles, breweries, admin, auth
2. Study the feature components (`client/src/components/`) — shared domain components (FilterControls, AIChatBox, Map, etc.)
3. Study the shared UI primitives (`client/src/components/ui/`) — Radix UI / shadcn-style wrappers
4. Check `package.json` for frontend dependencies (React 19, Wouter, tRPC, React Hook Form, Zod, Tailwind)

## Output

Produce a scannable summary of what you learned:

- **Purpose**: What the UI does
- **Tech Stack**: React 19, Wouter (routing), tRPC client, Radix UI / shadcn, Tailwind
- **Components**: Key pages and shared components and their responsibilities
- **Data Flow**: tRPC query hooks for reads, tRPC mutation hooks for writes; React Hook Form + Zod for form validation
- **Patterns**: How pages are structured, how mutations trigger cache invalidation, how auth state is accessed

Use bullet points. Keep it concise.
