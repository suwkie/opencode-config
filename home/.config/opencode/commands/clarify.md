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
4. Write the brief with the `brief` tool: goal, constraints, done-when, non-goals, assumptions.
5. Restate it in 3–5 lines, then start the work without asking again.

If the request contains «только бриф» (or "brief only"), stop after step 5 and do not begin the work.
