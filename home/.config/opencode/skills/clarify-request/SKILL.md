---
name: clarify-request
description: Turns a vague request into a brief before acting - interview the user with one ask_ui form, then restate goal, constraints, done-when and non-goals. Use when a request names an action but not its shape.
---

# Clarify a Vague Request

A request like "сделай красиво", "почини это", "добавь плагин" carries an action and no shape. Acting on it guesses; asking in prose costs five round trips. This is the middle path: **one form, then one brief, then work.**

## When to use it

- The request has a verb but no object, or an object but no definition of done.
- Two reasonable readings would produce different code.
- The user asked for a redesign, a rewrite, or "the same but better".

## When not to use it

- The code or the repo can settle the question — read first, ask never.
- One file, one obvious edit.
- You already started and only need one detail: ask that one thing in chat, not a form.
- The user is testing the flow itself: then the prompt is the whole answer, and doing the work is the failure.

## Procedure

1. **Draft at most six questions.** More than six is an interrogation. Each one must change what you build, not decorate the brief.
2. **One `ask_ui` call**, all questions at once, with `pick_one`/`pick_many` where possible and `text` only when the answer is a name, a number or a phrase. Every option states its **cost**, not just its name.
3. **Write the brief** with the `brief` tool (plugin `brief.js`). Five fields, no prose:
   - **Goal** — one sentence, the change in the user's words.
   - **Constraints** — what must stay true (stack, files, performance, permissions).
   - **Done when** — testable checks, not adjectives.
   - **Non-goals** — what this deliberately does not touch.
   - **Assumptions** — what you decided without asking, so it can be corrected cheaply.
4. **Restate in 3–5 lines and stop.** The output is a prompt another agent (or this one, next turn) will follow — not a licence to start. Work begins only when the user says so.

## Question bank

Take the four or five that fit; never all of them.

| Question | Why it changes the work |
|---|---|
| Что должно измениться для тебя? | separates the visible symptom from the cause |
| Как поймём, что готово? | turns "better" into a check you can run |
| Что трогать нельзя? | prevents the rewrite nobody asked for |
| Где это будет использоваться? | site, app, CLI, one-off — different constraints |
| Что уже пробовали и не сработало? | skips the idea that already failed |
| Насколько срочно / насколько глубоко? | quick patch vs proper fix |

## The brief

The output is an **implementation-ready spec**: sixteen sections, because every implicit one sends the next agent back with a question.

| Section | What goes in it |
|---|---|
| Goal | one sentence, the change in the user's words |
| Background | why this exists, what was tried, what breaks today |
| Current state | paths, sizes, versions, measured behaviour |
| Files and areas | each path this touches, with what lives there |
| What to build | numbered requirements, each implementable without a follow-up question |
| Edge cases | empty, huge, concurrent, unicode, permissions, interrupted runs |
| Order of work | milestones, each independently verifiable |
| Constraints | stack, files, performance, permissions, "no dependencies" |
| Done when | testable checks, not adjectives |
| Verification | commands that prove it, **including the failure case** |
| Risks | what can go wrong and how it would be noticed |
| Non-goals | what this deliberately does not touch |
| Assumptions | what you decided without asking |
| Open questions | what is genuinely unknown, and who answers it |
| References | files, docs, repos, prior art |
| What to return | what the implementing agent reports back |

Fill it with `brief` (plugin `brief.js`), which renders, counts and archives it. An empty section is written as `—`; inventing content is a lie, and `—` also tells the reader what to watch.

**Three tests of a good spec:**

1. An agent with no access to this conversation can start from Background and Current state and still choose correctly. If it would have to ask, that section is thin.
2. Every requirement can be turned into a check in Verification. A requirement nobody can check is a wish.
3. Every risk names how it would be noticed, not just that it exists.

Where the facts come from: paths and sizes from `ls`/`stat`/`du`, versions from `--version`, current behaviour from running it. Never from memory of what a project "usually" has.

## How many questions

- **Ordinary request:** 4–6 questions, one form.
- **Large or expensive request** (redesign, rewrite, a subsystem): up to **ten** questions, still one form. Two forms only if the first round changed what should be asked — say so before opening the second.
- Every question earns its place by changing a *section* of the spec. If no section changes, drop the question.

## Failure modes

- **Asking what the code can answer.** The most common one. Read the file first.
- **Six questions that are really one.** "Название?", "Домен?", "Язык?" — that is three facts, one question: "что это за штука".
- **Options without cost.** "Минимализм или брутализм" is a coin flip; "минимализм — читается легко, выглядит как у всех" is a decision.
- **A brief that restates the request.** If the brief contains nothing the user did not say, the interview failed.
