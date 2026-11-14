# Routing rules

Route before acting. Skills are procedures — load one with the `skill` tool *first*, then work. Subagents are isolated workers — delegate instead of doing the work inline.

## Skills: pick the most specific match, load it, then follow it

- New feature or change with no spec yet → `spec-driven-development`
- Change touching more than one file → `incremental-implementation`
- Writing logic, fixing a bug, changing behaviour → `test-driven-development`
- Failing tests, broken suite, "make tests pass" → `test-fixing`
- Unexpected error, build broke, worked yesterday → `debugging-and-error-recovery`
- Reviewing a diff, PR, or commit → `code-review-and-quality`
- Implementing reviewer comments → `review-implementing`
- Auth, user input, sessions, dependencies, security audit → `security-and-hardening`
- Running an unfamiliar or untrusted repo for the first time → `code-security-auditor`
- API, module boundary, public interface → `api-and-interface-design`
- Slow paths, Core Web Vitals, N+1, profiling → `performance-optimization`
- Any UI, frontend, layout, typography or visual work → `impeccable`
- Poster, static art, PNG/PDF visual → `canvas-design`
- React + Tailwind + shadcn prototype → `artifacts-builder`
- Commit, branch, PR, semver, release → `git-workflow-and-versioning`
- Changelog from commits → `changelog-generator`
- Build or query a codebase graph → `graphify`
- Browser testing, screenshots, responsive checks → `playwright-skill`
- Spreadsheet `.xlsx`/`.csv` work → `xlsx`
- PDF extract, merge, fill forms → `pdf`
- Building an MCP server → `mcp-builder`
- About to dispatch a subagent with a broad or vague question → `iterative-retrieval`

If none match, don't load one. Never load two overlapping procedures for the same step.

## Subagents: delegate, don't inline

Global agents, any repo. Dispatch them without being asked, the moment the trigger matches:

- Something fails and the cause is unknown → `debugger`
- A change exists and needs checking → `reviewer`
- The change touches auth, user input, files, secrets or URLs → `security-auditor`
- The task changes what a person sees: layout, type, colour, motion, responsive → `designer`
- Options or ideas are requested, or a decision is blocked → `brainstormer`
- A slowdown is measured or suspected, or a performance requirement exists → `optimizer`
- Broad search across many files → `explore`

Once one has responded, act on its answer instead of re-deriving it inline.

Work concerning `~/aria` (paths under it, or Aria named explicitly):

- Visual, UI, layout, typography, motion → `aria-designer`
- QoL, usability, accessibility, MPRIS, performance ideas → `aria-brainstormer`
- Review of Aria code: MPRIS/D-Bus, threading, textures, vector rendering, regressions → `aria-reviewer`

Give each subagent the full task, paths, and constraints — it starts with no context from this session. Don't delegate a single file read or a one-line fix.

## Project notes

Every project has a note at `~/Документы/Obsidian Vault/Projects/<project>/INDEX.md`, one folder per project named exactly like its directory.

- Starting work in a project: read its INDEX.md first. It holds the decisions and gotchas the code cannot show.
- A durable decision, gotcha or dead end appears: update the index in the same turn — one or two lines. Move detail into a sibling note in that folder if it grows.
- New project: create `Projects/<name>/INDEX.md` and add it to `Projects/INDEX.md`.
- Never paste transcripts, diffs or file contents. The index is a map, not a diary.
- Deep docs stay in the repo's `docs/`; the vault holds reasoning and cross-project notes.
- A question spanning projects: grep the vault before grepping every repo.
