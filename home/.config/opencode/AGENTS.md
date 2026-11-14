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

If none match, don't load one. Never load two overlapping procedures for the same step.

## Subagents: delegate, don't inline

Work concerning `~/aria` (paths under it, or Aria named explicitly):

- Visual, UI, layout, typography, motion → `aria-designer`
- QoL, usability, accessibility, MPRIS, performance ideas → `aria-brainstormer`
- Review of Aria code: MPRIS/D-Bus, threading, textures, vector rendering, regressions → `aria-reviewer`

Any codebase: broad search across many files → `explore`.

Give each subagent the full task, paths, and constraints — it starts with no context from this session. Don't delegate a single file read or a one-line fix.
