---
description: Prime agent with codebase understanding
argument-hint: [github-issues]
---

# Prime: Load Project Context

**Input**: $ARGUMENTS

## Objective

Build comprehensive understanding of this codebase by analyzing structure and key files.

## Process

### Step 0: Load External Context (if provided)

The argument is an optional GitHub issue number or comma-separated list of issue numbers (e.g., `42` or `42,43,44`).

If GitHub issue numbers are provided:

1. For each issue number, run `gh issue view {number} --json title,body,labels,assignees,comments`
2. Use the issue title, body, labels, and comments to inform your understanding of what work is expected

### Step 1: Analyze the Codebase

1. Read `CLAUDE.md` if it exists for project conventions
2. Study the database schema (`drizzle/schema.ts`) — tables and relationships
3. Study the tRPC router (`server/routers.ts`) — available procedures and auth requirements
4. Study the pages (`client/src/pages/`) — what routes exist and what they do
5. Check recent commits with `git log --oneline -5`

## Output

Produce a scannable summary of what you learned:

- **Project Purpose**: One sentence
- **Tech Stack**
  - Frontend: React 19, Wouter, tRPC client, Radix UI / shadcn, Tailwind
  - Backend: Express, tRPC, Drizzle ORM, PostgreSQL, Google OAuth, jose JWT
- **Data Model**: Core entities (beer, style, brewery, menuCategory, wine, winery, varietal, location, user)
- **Key Patterns**: tRPC procedures with Zod validation, db query functions in `server/db.ts`, tRPC hooks in client pages
- **Current State**: Recent commits, current branch

Use bullet points. Keep it concise.
