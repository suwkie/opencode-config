---
name: source-driven-development
description: Verify an API, flag, config key or version before asserting it. Use whenever the answer depends on how an external library, CLI or service actually behaves, or on a number you did not read in this session.
---

# Source-Driven Development

This model hallucinates specifics: it will invent a flag, a config key, a function signature or a version number that reads perfectly and does not exist. The fix is mechanical, not stylistic.

## The rule

Before you state how something external behaves, name where that came from:

1. **The code in front of you** — a call site, an import, a type, a test.
2. **Installed artifacts** — `node_modules/<pkg>/dist/*.d.ts`, `--help`, `man`, a lockfile, a version string.
3. **The web** — official docs or the changelog, via the `web-search` skill.

If none of the three was checked, the sentence starts with **"unverified:"**. Not a hedge inside the claim — a visible marker in front of it.

## Procedure

1. **Name the claim.** "Does `opencode plugin add` take a version?", "What is the field called — `plugins` or `plugin`?"
2. **Pick the cheapest source that can settle it.** Local types and `--help` beat the web; the repo beats both.
3. **Read it, don't recall it.** One `grep` for the symbol, one `--help`, one page. If the answer is spread out, read the file that defines it, not the tutorial that describes it.
4. **Copy the exact spelling** — key, flag, casing, signature. Paraphrased APIs are the failure mode.
5. **Cite it** in the answer: `config.schema.ts:41`, `plugin --help`, or the URL and its date.

## When the source contradicts you

The source wins, immediately and without commentary. Do not reconcile, do not "in practice it also works" — if the code says the key is `plugins`, answer `plugins`.

## Where this matters most

- Config keys and file locations (`opencode.json`, `AGENTS.md`, agent frontmatter fields).
- CLI flags and subcommands.
- Library function signatures and return types.
- Version numbers, dates, prices, benchmark scores.
- Permission and schema semantics — getting these wrong fails silently.

## Cost control

One verification per claim, not per sentence. A verified fact covers every later mention of it. If a claim is decorative — a name in prose nobody will act on — drop the claim rather than verify it.
