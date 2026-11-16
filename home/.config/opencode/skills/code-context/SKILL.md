---
name: code-context
description: Finds where code lives from the graphify graph and why it is that way from Magic Context. Use before grepping or dispatching a search in a repo that has graphify-out/.
---

# Code Context

Two indexes answer two different questions. Use the right one before touching a file.

| Question | Index | Call |
|---|---|---|
| Where is X, what calls Y, what links A and B, which files form this subsystem | graphify graph | `graphify query`, `explain`, `path` |
| Why is it like this, what was tried, what did we decide | Magic Context archive | `ctx_search`, `ctx_expand` |
| The exact lines | the file itself | `read` at the `file:line` a node gave you |

Grepping or dispatching `explore` first, in a repo you already indexed, is the mistake this skill exists to stop.

## 1. Structure — graphify

Call the tool, not the shell:

```
graphify_query({ kind: "query", question: "how does capture reach the tuya transport" })
graphify_query({ kind: "explain", node: "Session" })
graphify_query({ kind: "path", from: "Capture", to: "Session" })
graphify_query({ kind: "query", question: "…", repo: "~/aria", budget: 3000 })
```

It finds `graphify-out/graph.json` at or above the working directory; pass `repo` to read another project's graph. Every node prints as `NODE name [src=path loc=L123]` — that `file:line` is the answer to "where"; read it instead of a second search.

CLI equivalent, when the tool is not available:

```bash
cd <repo> && graphify query "<question>" --graph graphify-out/graph.json
```

**Staleness check** — the graph is a snapshot, not live:

```bash
[ graphify-out/graph.json -nt .git/refs/heads/"$(git branch --show-current)" ] || graphify . --update --code-only
```

`--code-only` is local AST, free, no API key. `--update` re-extracts only changed files. Rebuild when the query names a file or symbol that has moved.

**No graph in the repo?** Build one only if you expect three or more structural questions against it: `graphify . --code-only`. Otherwise `grep` and `read` are faster and cheaper; say so instead of building.

## 2. History — Magic Context

```
ctx_search("why did we choose per-key files for the ask-ui cache")
ctx_search("distrip kwin leak workaround")      # memory + messages + notes
ctx_expand(start=N-10, end=N+5)                 # the turn a hit came from
```

Search by the decision, not by the file: "why X", "what broke when Y", "what did we reject". A hit in `memory` is a durable rule — follow it without re-litigating.

Write back with `ctx_memory` when you settle something that must survive the session; use `ctx_note` for a follow-up you intend to do, not for a fact.

## 3. Compose the answer

1. `ctx_search` → what is already decided (skip re-deriving it).
2. `graphify query` → the files and symbols that implement it.
3. `read` the exact `file:line` from step 2.
4. Cite `path:line` in the answer.

If the two disagree — the archive says one thing, the code says another — the code wins, and the drift is worth a sentence and a `ctx_memory` update.
