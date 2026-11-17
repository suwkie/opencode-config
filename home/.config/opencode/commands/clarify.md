---
description: Interview me about a vague request, write the brief, then do the work
agent: orchestrator
---

Load the `clarify-request` skill and follow it.

The raw request:

$ARGUMENTS

Steps, in order:

1. If the request above is empty or is a single word, ask in one line what it is and stop — do not open a form on a guess.
2. Read whatever the request points at before asking anything. A file, a repo, a page: if the answer is already there, do not ask.
3. Open **one** `ask_ui` form with at most six questions from the skill's question bank. Every option states its cost, not just its name.
4. Gather the facts the spec needs before writing it — paths, sizes, versions, current behaviour, run them rather than recall them.
5. Write the full spec with the `brief` tool: goal, context, current state, numbered requirements, constraints, done-when, verification, non-goals, assumptions, what to return. All ten sections; empty ones as `—`.
6. Restate it in 3–5 lines, then start the work without asking again.

If the request contains «только бриф» (or "brief only"), stop after step 5 and do not begin the work.
