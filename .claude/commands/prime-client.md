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

1. Study the app routes (`src/app/`) — pages, layouts, loading/error boundaries
2. Study the feature components (`src/features/polls/components/`)
3. Study the shared UI primitives (`src/components/ui/`)
4. Check `package.json` for frontend dependencies

## Output

Produce a scannable summary of what you learned:

- **Purpose**: What the UI does
- **Tech Stack**: Next.js App Router, shadcn/ui, Tailwind 4
- **Components**: Key components and their responsibilities
- **Data Flow**: Server Components fetch data directly; Client Components use Server Actions for mutations
- **Patterns**: Server vs Client component split, how forms use Server Actions with `useActionState`

Use bullet points. Keep it concise.
