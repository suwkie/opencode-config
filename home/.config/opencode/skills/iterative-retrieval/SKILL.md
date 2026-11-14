---
name: iterative-retrieval
description: Decides what context to hand a subagent and how to narrow it over rounds, so a dispatch arrives informed instead of flailing or drowning.
---

# Iterative Retrieval

A subagent starts with zero context. Hand it too little and it rediscovers your codebase at your expense; hand it too much and it drowns, summarizes, and misses the point. Hand it **pointers**, and let it retrieve.

## Before dispatch

State four things in the prompt:

1. **The question** — one sentence. Two questions means two dispatches.
2. **Where to look** — paths, symbols, line ranges, the failing command, the exact error text. Cheapest context you own.
3. **How to search** — the pattern that finds it (`grep -n "func X"`, the test name, the config key).
4. **Done looks like** — the shape of the answer you will accept, and the evidence it must cite (`file:line`).

Never paste a file the child can read itself. Never paste a file it cannot read without saying why it is pasted.

## Rounds

Run retrieval in rounds, each narrower and cheaper than the last:

| Round | Ask for | Stop when |
|---|---|---|
| Map | paths + one line each + counts | you can name the 2–3 files that matter |
| Narrow | those files, the relevant functions only | the mechanism is visible |
| Exact | specific lines, the test, the trace | the claim is backed by quoted code |

Re-ask in the same child rather than spawning a new one — its context is already warm. A fresh child pays the map round again.

## Budget

- Output larger than roughly 10% of your context means the question was too broad. Narrow it and ask again.
- If the child reports "I could not find X", the next dispatch carries a search hint, not a broader question.
- A child that returns prose without `file:line` evidence has not finished; ask for the evidence, not for a rewrite.

## Failure modes

- **Dumping the parent's whole plan** into the child — it will follow the plan instead of looking at the code.
- **Asking for a review without the diff** — pass `git diff` output or the commit range.
- **Batching unrelated questions** — the child answers the easy one and guesses at the rest.
