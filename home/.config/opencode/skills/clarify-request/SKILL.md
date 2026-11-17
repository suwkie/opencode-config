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

## Procedure

1. **Draft at most six questions.** More than six is an interrogation. Each one must change what you build, not decorate the brief.
2. **One `ask_ui` call**, all questions at once, with `pick_one`/`pick_many` where possible and `text` only when the answer is a name, a number or a phrase. Every option states its **cost**, not just its name.
3. **Write the brief** with the `brief` tool (plugin `brief.js`). Five fields, no prose:
   - **Goal** — one sentence, the change in the user's words.
   - **Constraints** — what must stay true (stack, files, performance, permissions).
   - **Done when** — testable checks, not adjectives.
   - **Non-goals** — what this deliberately does not touch.
   - **Assumptions** — what you decided without asking, so it can be corrected cheaply.
4. **Restate in 3–5 lines** to the user, then start. Do not ask again for anything already in the brief.

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

The output is an **implementation-ready spec**, not a summary. Ten sections, in this order:

| Section | What goes in it |
|---|---|
| Goal | one sentence, the change in the user's words |
| Context | why this exists, what was tried, decisions already made |
| Current state | paths, sizes, versions, what is actually broken right now |
| What to build | numbered requirements, each concrete enough to implement without a follow-up question |
| Constraints | stack, files, performance, permissions, "no dependencies" |
| Done when | testable checks, not adjectives |
| Verification | commands that prove it, **including the failure case** |
| Non-goals | what this deliberately does not touch |
| Assumptions | what you decided without asking |
| What to return | what the implementing agent reports back |

Fill it with `brief` (plugin `brief.js`), which renders and archives it. An empty section is written as `—`; inventing content for one is a lie.

**The test of a good spec:** an agent with no access to this conversation can start from the Context and Current state sections and still make the right choices. If it would have to ask something, the section is thin.

Where the facts come from: paths and sizes from `ls`/`stat`/`du`, versions from `--version`, current behaviour from running it. Never from memory of what a project "usually" has.

## Failure modes

- **Asking what the code can answer.** The most common one. Read the file first.
- **Six questions that are really one.** "Название?", "Домен?", "Язык?" — that is three facts, one question: "что это за штука".
- **Options without cost.** "Минимализм или брутализм" is a coin flip; "минимализм — читается легко, выглядит как у всех" is a decision.
- **A brief that restates the request.** If the brief contains nothing the user did not say, the interview failed.
