---
name: deep-research
description: Researches a question across several sources and returns a cited comparison. Use when the answer needs numbers, a ranking, or a decision between options, not a single lookup.
---

# Deep Research

For a question one page cannot settle. Four phases, in order; do not start the next until the previous has an artifact.

## 1. Frame (no searching yet)

Write down, before touching the network:

- **The comparison axes** — the criteria the answer will be judged on (score, price, latency, licence…).
- **The objects** — every candidate the user would expect in the answer. Miss one and the table is a lie.
- **The freshness need** — "as of today", "any version", or a named date.

If the axes are not obvious from the request, ask with `ask_ui` before searching, not after.

## 2. Search deliberately

- **Prefer an aggregator over N lookups.** A leaderboard page gives you 100 rows in one fetch; ten per-model pages give you 10 partial rows in ten.
- **One query per object or axis**, short. `websearch "<model> <benchmark>"`, not a paragraph.
- **Read one page far enough to find its method.** A score without its harness, sample and date is a rumour.
- Stop searching when two independent sources agree on the number you need.

## 3. Verify each claim

For every number that will survive into the answer, record:

| Field | Why |
|---|---|
| value | the number, verbatim |
| source | URL or `file:line` |
| date | publication or measurement date |
| who ran it | vendor self-report vs independent (AA, Vals, community) |

Vendor-reported figures are labelled as such in the answer — never silently mixed with independent ones. If a claim has no source, it is cut or marked **unverified**; it does not get a hedge.

## 4. Report

1. **One sentence answer** at the top. The reader may stop there.
2. **The table** — rows = objects, columns = axes from phase 1, one source per column group when the numbers come from different places.
3. **Two or three findings that change a decision**, each one sentence and concrete ("#68 in coding despite the name").
4. **What remains unverified** — named, not implied.

## Failure modes

- Five snippets instead of one page → you have adjectives, not data.
- A number with no date → you cannot tell if it is current.
- A table whose rows came from different benchmarks → it compares nothing.
- Answering with a summary when the user asked "which one, and why" → give the verdict, not the landscape.
- Copying the vendor's headline metric when an independent run exists → prefer the independent one and say so.
