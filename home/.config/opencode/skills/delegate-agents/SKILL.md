---
name: delegate-agents
description: Hands each part of a task to the specialist subagent that owns it — review, security, debugging, UI, options, performance — instead of doing that work inline. Load before answering any task that matches a trigger.
---

# Delegate Agents

Every task has an owner. If a specialist owns part of it, that part runs in a subagent or it does not run. Doing it inline is not faster — it costs the same tokens in a context that also has to hold everything else.

The trigger table is in `AGENTS.md`. This is the protocol.

## Dispatch

The tool is `subagent`, called as:

```
{agent: "<id>", description: "<3-5 words>", prompt: "<full task>"}
```

- **One call per specialist.** Two independent asks go out in the same turn, not one after the other.
- **The prompt is the whole briefing.** The child starts with zero context: the task, the paths, the constraint, and the exact shape of the answer you will accept. Never "review the code" — say what to review, where it is, and what "done" looks like.
- **Load `iterative-retrieval` first** when the dispatch is broad or you cannot name the files.
- **Then stop.** Dispatch is asynchronous: end the turn and wait for the child, instead of duplicating its work while it runs.
- **Use the answer.** Quote it, act on it, or reject it with a reason. Never re-derive what a specialist already returned, and never re-dispatch the same question because you dislike the answer once.

## Before you answer, check yourself

If the request involved any of these, you owed a dispatch:

- you read a diff and formed an opinion → `reviewer`
- you judged a layout, colour, spacing or motion → `designer`
- you guessed at a cause without reproducing it → `debugger`
- the change touched auth, input, files, secrets or a URL → `security-auditor`
- you listed options or weighed a trade-off → `brainstormer`
- you reasoned about speed without measuring → `optimizer`

A specialist's finding is worth more than your guess, because it was formed in a context that saw only that problem.

## When not to dispatch

- A single file read, or a one-line fix you can already see.
- The answer is in a file you have open, or in the diff in front of you.
- The user asked you to explain your own change — that is your context, not a specialist's.
- Two dispatches for one question. Pick the owner and go.

## Cost

A dispatch is a child session: real tokens, real latency. That is the price of a second, uncluttered point of view. Pay it when the verdict matters, not to look thorough.
