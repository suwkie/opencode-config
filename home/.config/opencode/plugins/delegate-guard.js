// delegate-guard — appends one notice per session to a tool result telling the
// model to dispatch a specialist.
//
// Why an append and not a block: a thrown error in execute.before ended the
// whole run in headless mode, so blocking costs the session, not one call.
//
// Measured 2026-11-16 on deepseek-v4.1-flash, same prompt each time
// ("review the last commit"): build → inline every time, with or without this
// notice; orchestrator → dispatched `reviewer` on its own. So this is a nudge,
// not a fix: the agent you start decides.
import { appendFileSync } from "fs";

const RAW = Number(process.env.DELEGATE_GUARD_AFTER);
const N = Number.isFinite(RAW) && RAW > 0 ? RAW : 4;

// Subagent sessions cannot dispatch (subagent: deny), so a notice there is noise
// plus a lost step.
const PRIMARIES = new Set(["build", "orchestrator"]);
const MAX_SESSIONS = 500;

// Same trick as graphify.js: the id carries the file location so a second copy
// under another config root does not fail with "Duplicate plugin ID".
const location = [...import.meta.url].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const log = (s) => { try { appendFileSync("/tmp/opencode/delegate-guard.log", s + "\n"); } catch {} };

const NOTE = (n) => `[delegate-guard] ${n} tool calls in this session, none of them a dispatch.

Answer in one line before the next action: does any of these apply?
- a change needs checking -> subagent agent="reviewer"
- auth, input, files, secrets or URLs touched -> subagent agent="security-auditor"
- a failure whose cause is unknown -> subagent agent="debugger"
- anything a person will see (layout, colour, motion) -> subagent agent="designer"
- options or ideas requested -> subagent agent="brainstormer"
- a slowdown measured or suspected -> subagent agent="optimizer"
- a broad search across many files -> subagent agent="explore"

If one does, dispatch it now. If none does, carry on — this notice appears once.`;

export default {
  id: `delegate-guard-${location.toString(16)}`,

  async setup(ctx) {
    const state = new Map(); // sessionID -> {n, delegated, fired}

    await ctx.tool.hook("execute.after", (event) => {
      if (!PRIMARIES.has(event.agent)) return;
      const s = state.get(event.sessionID) ?? { n: 0, delegated: false, fired: false };

      if (event.tool === "subagent") {
        s.delegated = true;
        s.n = 0;
        state.set(event.sessionID, s);
        log(`dispatch agent=${event.input?.agent ?? "?"} by ${event.agent}`);
        return;
      }

      s.n += 1;
      if (state.size > MAX_SESSIONS) state.clear();
      state.set(event.sessionID, s);

      if (s.delegated || s.fired || s.n < N) return;
      const content = event.result?.content;
      if (!Array.isArray(content)) return;

      s.fired = true;
      content.push({ type: "text", text: NOTE(s.n) });
      log(`nudged at n=${s.n} tool=${event.tool} agent=${event.agent}`);
    });
  },
};
