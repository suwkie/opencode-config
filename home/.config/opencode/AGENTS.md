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
- Where/why question in a repo that has `graphify-out/` → `code-context`
- Browser testing, screenshots, responsive checks → `playwright-skill`
- Spreadsheet `.xlsx`/`.csv` work → `xlsx`
- PDF extract, merge, fill forms → `pdf`
- Building an MCP server → `mcp-builder`
- Answer needs numbers, a ranking, or a decision between options → `deep-research`
- Three or more decisions needed before work can start → `ask-ui`
- About to assert how an external API, flag, config key or version behaves → `source-driven-development`
- About to dispatch a subagent with a broad or vague question → `iterative-retrieval`

If none match, don't load one. Never load two overlapping procedures for the same step.

## Subagents: delegate, don't inline

Global, any repo. Dispatch on the trigger, without being asked:

- Fails, cause unknown → `debugger` · a change to check → `reviewer`
- Auth, input, files, secrets or URLs touched → `security-auditor`
- Changes what a person sees → `designer` · options asked → `brainstormer` · slowdown → `optimizer`
- An unfamiliar or large codebase to understand and build something like → `reverse-engineer`
- Broad search across many files → `explore`

Act on the answer instead of re-deriving it inline. Load `delegate-agents` before the first dispatch — it carries the protocol.

Work concerning `~/aria` (paths under it, or Aria named explicitly):

- Visual, UI, layout, typography, motion → `aria-designer`
- QoL, usability, accessibility, MPRIS, performance ideas → `aria-brainstormer`
- Review of Aria code: MPRIS/D-Bus, threading, textures, vector rendering, regressions → `aria-reviewer`

Give each subagent the full task, paths, and constraints — it starts with no context from this session. Don't delegate a single file read or a one-line fix.

## Answer style

Confirmed by the user on 2026-11-17 — apply everywhere, no need to load a skill for it.

- **Russian**, with technical terms left in English. Match the language of the question only if the user wrote in another one.
- **Verdict first, then the detail.** One sentence that answers, then the evidence.
- **No preamble, no emoji, no "great question".** Start with the answer.
- **Close with two lines:** what you did not verify, and the risk. Plus the next step in one line when there is one.
- **Numbers carry a source.** "12 MB, measured" beats "about 12 MB". If it is an estimate, say so.
- **Ambiguity: choose, and say what you assumed.** Do not stop to ask when the code can settle it.
- **Ask before deleting data.** Nothing else needs permission.
- **A tool that failed gets reported**, not silently retried.
- Prefer lightweight: fewer dependencies, less runtime, measured before optimised.

## Project notes

Every project has a note at `~/Документы/Obsidian Vault/Projects/<project>/INDEX.md`, one folder per project named exactly like its directory.

- Starting work in a project: read its INDEX.md first. It holds the decisions and gotchas the code cannot show.
- A durable decision, gotcha or dead end appears: update the index in the same turn — one or two lines. Move detail into a sibling note in that folder if it grows.
- New project: create `Projects/<name>/INDEX.md` and add it to `Projects/INDEX.md`.
- Never paste transcripts, diffs or file contents. The index is a map, not a diary.
- Deep docs stay in the repo's `docs/`; the vault holds reasoning and cross-project notes.
- A question spanning projects: grep the vault before grepping every repo.
