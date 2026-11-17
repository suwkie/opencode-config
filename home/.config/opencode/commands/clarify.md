---
description: Interview me about a vague request and hand back a finished prompt, without doing the work
agent: orchestrator
---

Load the `clarify-request` skill and follow it.

The raw request:

$ARGUMENTS

Steps, in order:

1. If the request above is empty or is a single word, ask in one line what it is and stop — do not open a form on a guess.
2. Read whatever the request points at before asking anything. A file, a repo, a page: if the answer is already there, do not ask.
3. Open **one** `ask_ui` form: 4–6 questions for an ordinary request, up to ten for a redesign, rewrite or subsystem. Every option states its cost, not just its name.
4. Gather the facts the spec needs before writing it — paths, sizes, versions, current behaviour, run them rather than recall them.
5. Write the full spec with the `brief` tool — all sixteen sections: goal, background, current state, files and areas, numbered requirements, edge cases, order of work, constraints, done-when, verification, risks, non-goals, assumptions, open questions, references, what to return. Empty ones as `—`.
6. Restate it in 3–5 lines and **stop**. The deliverable is the prompt itself.

Begin the work only when the request says «делай» (or "run it"). Never start because the prompt looks ready.

«только бриф» means even shorter: skip steps 2–3, write the spec from what is already known.
