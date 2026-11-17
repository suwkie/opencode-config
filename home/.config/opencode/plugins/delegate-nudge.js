// delegate-nudge — two levers, both attached to the moment they matter.
//
// Measured (2026-11-16/17): a rule in AGENTS.md is ignored, rewriting the
// subagent tool description is ignored, a note after four inline calls is
// ignored. What did land twice was text attached to the tool result the agent
// is reading, and once a rejected tool call. So:
//
// 1. `execute.after` — first write of real work in a session gets one line
//    naming the specialists. Cheap, no prompt cost.
// 2. `execute.before` — the first `git commit` of a session that dispatched
//    nothing is held back once, with a message saying what to do. A retry is
//    allowed, so it is a speed bump, not a wall: work cannot be lost.
const PRIMARIES = new Set(["orchestrator", "build", "plan"]);
const WRITERS = new Set(["edit", "write", "patch", "apply_patch"]);
const SHELL_WRITES = /(>>?\s*[^\s&|;]+|\btee\s|\bsed\s+-i|\bcp\s|\bmv\s|\brm\s|\bmkdir\s)/;
const SKIP = /(^|\/)(tmp|\.cache|node_modules|target|dist|build)\//;
// Hold only a plain commit chain: "cd X && git add -A && git commit -m ...".
// Anything with pipes, semicolons or other work is left alone — replacing a
// whole chain would throw away the parts that have nothing to do with commits.
const GIT_COMMIT = /^(?:\s*cd\s+[^;&|]+\s*&&\s*)?(?:git\s+add\s+[^;&|]+\s*&&\s*)?git\s+commit\b[^;|]*$/;

const SPECIALISTS = {
  orchestrator:
    "reviewer (a change to judge) · debugger (fails, cause unknown) · security-auditor (auth, input, secrets, URLs) · designer (what a person sees) · optimizer (a measured slowdown) · explore (where something lives) · reverse-engineer (how another app is built)",
  build:
    "reviewer (a change to judge) · debugger (fails, cause unknown) · security-auditor (auth, input, secrets, URLs) · designer (what a person sees) · explore (where something lives)",
  plan: "explore (where something lives) · reviewer (a change to judge)",
};

const agentId = (a) => (typeof a === "string" ? a : a?.id ?? a?.name ?? "");

// sessionID -> { nudged, dispatched, commitHeld }
const state = new Map();
const stateFor = (id) => {
  if (!state.has(id)) {
    if (state.size > 200) state.clear();
    state.set(id, { nudged: false, dispatched: false, commitHeld: 0 });
  }
  return state.get(id);
};

export default {
  id: "delegate-nudge",
  async setup(ctx) {
    await ctx.tool.hook("execute.after", async (i) => {
      try {
        const agent = agentId(i.agent);
        if (!PRIMARIES.has(agent)) return;
        const s = stateFor(i.sessionID);

        // any dispatch clears the debt for this session
        if (i.tool === "subagent") {
          s.dispatched = true;
          return;
        }
        if (i.status !== "completed" || s.nudged) return;

        const cmd = String(i.input?.command ?? "");
        const viaShell = i.tool === "shell" && SHELL_WRITES.test(cmd);
        if (!WRITERS.has(i.tool) && !viaShell) return;

        const where = String(i.input?.path ?? i.input?.filePath ?? cmd).slice(0, 90);
        if (SKIP.test(where)) return;

        s.nudged = true;
        const note = `\n\n[delegate] ${where || "something"} just changed and no specialist has seen it. Before calling this done, either dispatch one — ${SPECIALISTS[agent]} — or say in one line why this change needs no second pair of eyes.`;

        const content = i.result?.content;
        if (Array.isArray(content) && content.length) {
          const last = [...content].reverse().find((c) => c && c.type === "text");
          if (last && typeof last.text === "string") last.text += note;
          else content.push({ type: "text", text: note.trim() });
        }
      } catch {
        // a nudge that breaks a tool result is worse than no nudge
      }
    });

    await ctx.tool.hook("execute.before", async (i) => {
      try {
        if (i?.tool !== "shell") return;
        const agent = agentId(i.agent);
        if (!PRIMARIES.has(agent)) return;
        const cmd = String(i.input?.command ?? "");
        if (!GIT_COMMIT.test(cmd)) return;

        const s = stateFor(i.sessionID);
        // Two holds, then it goes through: a review is worth one extra turn, not a deadlock.
        if (!s.nudged || s.dispatched || s.commitHeld >= 2) return;
        s.commitHeld += 1;

        i.input.command = `echo '[delegate] commit held: this session changed code and dispatched no specialist. Run the review first (reviewer for a diff, security-auditor if auth/input/secrets/URLs are touched, debugger if something still fails), then repeat the commit. This is hold ${s.commitHeld} of 2; after that the commit goes through regardless. Original command was: ${cmd.replace(/'/g, "'\\''").slice(0, 400)}'`;
      } catch {
        // never break a command because of this hook
      }
    });
  },
};
