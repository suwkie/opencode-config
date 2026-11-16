// graph-tool — exposes the graphify graph as a first-class tool instead of a
// shell command. Measured 2026-11-16: told to use the graph, the model queries
// it correctly; left to choose between `graphify query` and grep, it greps. A
// tool in the menu gets picked, a sentence in a skill does not.
import { existsSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
import { execFile } from "child_process";

const MAX_OUT = 6000;
const BIN = join(homedir(), ".local/bin/graphify");

// Nearest graphify-out/graph.json at or above `start`.
function findGraph(start) {
  let dir = resolve(start);
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "graphify-out", "graph.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function run(args, timeoutMs = 60000) {
  return new Promise((done) => {
    execFile(BIN, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && !stdout) return done({ ok: false, text: (stderr || err.message || "").trim().slice(0, 800) });
      done({ ok: true, text: (stdout || "").trim() });
    });
  });
}

export default {
  id: "graph-tool",
  async setup(ctx) {
    await ctx.tool.transform(async (draft) => {
      await draft.add({
        name: "graphify_query",
        description:
          "Query the codebase knowledge graph: where a symbol lives, what calls it, what connects two subsystems, or the shortest path between two concepts. Faster and cheaper than grepping a repo that has graphify-out/. Returns nodes as `NODE name [src=path loc=L123]` — read that file:line instead of searching again. The result is already the text: there is no .output field.",
        input: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["query", "explain", "path"], description: "query = natural-language question; explain = one node and its edges; path = shortest path between two nodes" },
            question: { type: "string", description: "For kind=query: the question, e.g. 'how does capture reach the tuya transport'" },
            node: { type: "string", description: "For kind=explain: the node name" },
            from: { type: "string", description: "For kind=path: start node" },
            to: { type: "string", description: "For kind=path: end node" },
            repo: { type: "string", description: "Repo path or ~name, e.g. ~/distrip. Omit to use the nearest graph above the working directory." },
            budget: { type: "integer", description: "Token budget for kind=query (default 2000)" },
          },
          required: ["kind"],
        },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (args) => {
          try { (await import("node:fs")).appendFileSync("/tmp/opencode/graph-tool.log", `${new Date().toISOString()} ${args.kind} ${args.question || args.node || args.from + "→" + args.to}\n`); } catch {}
          const start = args.repo ? resolve(args.repo.replace(/^~/, homedir())) : ctx.location.directory;
          const graph = findGraph(start);
          if (!graph) {
            return { output: `No graphify-out/graph.json at or above ${start}. Build one with \`graphify . --code-only\` in the repo, or grep instead — say which you did.` };
          }
          let argv;
          if (args.kind === "query") {
            if (!args.question) return { output: "kind=query needs `question`" };
            argv = ["query", String(args.question), "--graph", graph];
            if (args.budget) argv.push("--budget", String(args.budget));
          } else if (args.kind === "explain") {
            if (!args.node) return { output: "kind=explain needs `node`" };
            argv = ["explain", String(args.node), "--graph", graph];
          } else if (args.kind === "path") {
            if (!args.from || !args.to) return { output: "kind=path needs `from` and `to`" };
            argv = ["path", String(args.from), String(args.to), "--graph", graph];
          } else {
            return { output: `unknown kind "${args.kind}"` };
          }

          const r = await run(argv);
          const text = r.text.length > MAX_OUT ? `${r.text.slice(0, MAX_OUT)}\n… trimmed at ${MAX_OUT} chars; narrow the question or lower the budget.` : r.text;
          return { output: `graph: ${graph}\n\n${text || "(no output)"}` };
        },
      });
    });
  },
};
