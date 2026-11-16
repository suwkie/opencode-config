---
name: delta-review
description: Re-reviews only what changed since the last verdict - checks each previous finding against the new diff and rules it fixed, partial, open or regressed. Use after fixes land.
---

# Delta Review

The second review is not the first review again. Ten findings came back, nine were fixed, and the only questions are: *is each fix real, and did the fixes break anything?* Reading the whole file again answers neither.

## When

- A reviewer, `security-auditor` or `debugger` returned findings, the code changed, and someone must decide whether the round is over.
- A "final pass", "verify the fixes", "delta re-review" request.
- A second opinion on a diff that has already been reviewed once.

## Procedure

1. **Freeze the baseline.** Name the commit or ref that was reviewed. The delta is `git diff <baseline>..HEAD`, nothing else.
2. **Carry the findings forward as a list.** One line each, with the file and symbol it pointed at. A finding with no stable identifier cannot be checked off.
3. **Rule on each finding against the delta**, one of four:
   - **fixed** — quote the line that proves it;
   - **partial** — the symptom moved, the cause did not;
   - **open** — untouched;
   - **regressed** — it was fixed earlier and is back.
   A "fixed" without a quoted line is an **open**.
4. **Scan only the changed hunks for new risk** — new unvalidated input, a new error path, a changed public signature, a test that now passes for the wrong reason.
5. **Verdict in one line:** ship, or another round with the count of open findings.

## Rules

- **Never re-raise a finding you withdrew** without saying so; that is how a review becomes noise.
- **Never re-review unchanged code** — it was settled last round, and re-reading it burns the reader's trust in the delta.
- **A test added to satisfy a finding must fail without the fix.** If it cannot be shown failing, the finding is still open.
- **Count matters.** "Mostly fixed" is not a verdict; "9 of 10 closed, 1 partial" is.
- **Stop at the delta.** New ideas belong in a fresh review of a fresh change, not in this one.

## Output

```
Baseline: <ref>   Delta: <n> files, +a/−b

| # | Finding | Ruling | Evidence |
|---|---------|--------|----------|

New risk in the delta: <none | the one line that matters>
Verdict: ship | another round (k open)
```
