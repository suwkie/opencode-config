// guards — two cheap, deterministic fixes for the failure modes of a small
// model: repeating an identical shell command (the output cannot change), and
// grepping a path that does not exist (ripgrep aborts with "execution failed").
//
// One file for both runtimes, same shape as graphify.js: OpenCode 2 reads
// `id` and `setup()`; OpenCode 1 reads `server()`.
//
// Everything here is a warning or a path repair. Nothing blocks a tool call,
// so a bug in this file costs one odd output, never a stuck session.
import { existsSync } from "fs";
import { join, isAbsolute, dirname } from "path";

// Backticks and $(...) must not appear in the reminder: the hook prepends
// `echo "<text>" ; <cmd>`, and both would be evaluated by the shell.
const REPEAT_WARN =
  'echo "[guards] this exact command already ran in this session; its output will not change. Change the command or stop." ; ';

const REPEAT_AT = 3;
const MAX_KEYS = 500;

const location = [...import.meta.url].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// Nearest existing ancestor of a path that does not exist. Never walks above
// the session directory: repairing a bad absolute path to "/" would turn a
// failed grep into a filesystem-wide scan.
function nearestExisting(path, directory) {
  const root = directory.endsWith("/") ? directory : `${directory}/`;
  const abs = isAbsolute(path) ? path : join(directory, path);
  if (!abs.startsWith(root)) return directory;
  let cur = abs;
  for (let i = 0; i < 6; i++) {
    cur = dirname(cur);
    if (cur.length < root.length) break;
    if (existsSync(cur)) return cur;
  }
  return directory;
}

export default {
  id: `guards-${location.toString(16)}`,

  async setup(ctx) {
    const seen = new Map();
    await ctx.tool.hook("execute.before", (event) => {
      const input = event.input;
      if (!input || typeof input !== "object") return;

      // grep/glob: a directory that exists is always better than a path that
      // does not, because ripgrep refuses to start on the latter.
      if ((event.tool === "grep" || event.tool === "glob") && typeof input.path === "string" && !existsSync(input.path)) {
        const fixed = nearestExisting(input.path, ctx.location.directory);
        if (fixed) event.input = { ...input, path: fixed };
        return;
      }

      if (event.tool !== "shell" || typeof input.command !== "string") return;
      const key = `${event.sessionID}\u0000${input.command}`;
      const n = (seen.get(key) ?? 0) + 1;
      if (seen.size > MAX_KEYS) seen.clear();
      seen.set(key, n);
      if (n >= REPEAT_AT) event.input = { ...input, command: REPEAT_WARN + input.command };
    });
  },

  async server({ directory }) {
    const seen = new Map();
    return {
      "tool.execute.before": async (input, output) => {
        const args = output.args;
        if (!args || typeof args !== "object") return;

        if ((input.tool === "grep" || input.tool === "glob") && typeof args.path === "string" && !existsSync(args.path)) {
          const fixed = nearestExisting(args.path, directory);
          if (fixed) output.args = { ...args, path: fixed };
          return;
        }

        if (input.tool !== "bash" || typeof args.command !== "string") return;
        const key = `${input.sessionID}\u0000${args.command}`;
        const n = (seen.get(key) ?? 0) + 1;
        if (seen.size > MAX_KEYS) seen.clear();
        seen.set(key, n);
        if (n >= REPEAT_AT) output.args = { ...args, command: REPEAT_WARN + args.command };
      },
    };
  },
};
