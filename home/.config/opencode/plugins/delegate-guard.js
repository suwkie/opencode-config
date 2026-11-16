// delegate-guard — one forced pause per session: after N inline tool calls with
// no `subagent` dispatch, the next call is refused with a message the model
// reads. Prompt-level rules (AGENTS.md, skills, tool descriptions) are ignored
// in practice; a blocked call is the only thing that lands mid-task.
//
// Fires once per session so a task that genuinely needs no specialist loses a
// single call, not the run.
import { appendFileSync } from "fs";

const N = Number(process.env.DELEGATE_GUARD_AFTER || 4);
const SPECIALISTS = new Set(["reviewer", "security-auditor", "debugger", "designer", "brainstormer", "optimizer", "explore"]);
const NEVER_BLOCK = new Set(["question", "ask_ui", "task_complete", "read"]);

const MSG = (n) => `Blocked once by delegate-guard: ${n} inline tool calls and no dispatch in this session.

Before you continue, answer in one line: does any of these apply?
- a change needs checking -> subagent agent="reviewer"
- auth, input, files, secrets or URLs touched -> subagent agent="security-auditor"
- a failure whose cause is unknown -> subagent agent="debugger"
- anything a person will see (layout, colour, motion) -> subagent agent="designer"
- options or ideas requested -> subagent agent="brainstormer"
- a slowdown measured or suspected -> subagent agent="optimizer"
- a broad search across many files -> subagent agent="explore"

If one does, call subagent next. If none does, re-run the call you were making: this guard fires once per session.`;

export default {
  id: "delegate-guard",
  async setup(ctx) {
    const state = new Map(); // sessionID -> {n, delegated, fired}
    const log = (s) => { try { appendFileSync("/tmp/opencode/delegate-guard.log", s + "\n"); } catch {} };

    await ctx.tool.hook("execute.before", (event) => {
      const s = state.get(event.sessionID) ?? { n: 0, delegated: false, fired: false };

      if (event.tool === "subagent") {
        s.delegated = true;
        s.n = 0;
        state.set(event.sessionID, s);
        log(`dispatch agent=${event.input?.agent ?? "?"}`);
        return;
      }

      s.n += 1;
      state.set(event.sessionID, s);

      if (!s.delegated && !s.fired && s.n >= N && !NEVER_BLOCK.has(event.tool)) {
        s.fired = true;
        log(`blocked at n=${s.n} tool=${event.tool}`);
        throw new Error(MSG(s.n));
      }
    });
  },
};
