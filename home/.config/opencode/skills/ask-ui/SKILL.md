---
name: ask-ui
description: Collects several decisions at once in a local browser form instead of asking them in chat. Use when a task needs 3 or more answers before it can start, or when the answer would be long to type.
---

# Ask UI

`ask_ui` opens a page on `127.0.0.1` with every question on it, and blocks until the user submits or the wait expires. Clicking beats typing: one form, one round trip, all answers back together.

## When to use it

- **Three or more decisions** are needed before work can start — stack, scope, target, naming.
- The answer is **a choice between options** you can enumerate, with a one-line cost for each.
- The answer would be **long to type** and hard to get right in prose (a list of files, a set of flags).
- A **destructive or expensive** step needs explicit confirmation.

## When not to

- One question — ask it in chat; the form is slower than a sentence.
- The answer is in the repo, the config or the conversation. Look first.
- The user already said "just do it". A form then is a stall.
- Mid-task clarification where one line in chat is enough.

## Shape of the call

```
ask_ui({
  title: "Cache layer — 3 decisions",
  questions: [
    { id: "layout", label: "Which layout?", type: "pick_one",
      options: [{ label: "per-key files", description: "atomic writes, inode sprawl" },
                { label: "single JSON", description: "one file, needs a lock" }] },
    { id: "ttl", label: "Enable TTL?", type: "confirm" },
    { id: "days", label: "Default TTL", type: "slider", min: 1, max: 30 },
    { id: "note", label: "Anything else?", type: "text", placeholder: "optional" }
  ]
})
```

Types: `pick_one`, `pick_many`, `confirm`, `slider`, `text`. Every question needs `id`, `label`, `type`.

## Rules

- **Give each option a description** saying what it costs, not what it is. The point of the form is a decision, not a menu.
- **Default the common case** — first radio is pre-selected, sliders start mid-range, so a user who agrees can hit Send immediately.
- **Never repeat the answers verbatim** in your next message; act on them.
- **If the result says the form expired**, ask in chat instead of retrying — the user was away.
- Say the URL in your message when you dispatch it, so the tab can be found if the browser did not open.
