// brief — turns the answers to a clarify interview into one normalised block,
// and appends it to the vault so the reasoning survives the session.
//
// The value is determinism: the same five fields every time, an empty field
// marked as empty instead of quietly dropped, and a stable archive path. The
// interview itself is ask_ui; this tool does not ask anything.
import { appendFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const VAULT = join(homedir(), "Документы", "Obsidian Vault", "Projects", "briefs");
const FIELDS = ["goal", "constraints", "done_when", "non_goals", "assumptions"];
const LABEL = { goal: "Goal", constraints: "Constraints", done_when: "Done when", non_goals: "Non-goals", assumptions: "Assumptions" };

const lines = (v) => {
  if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return "—";
  const arr = Array.isArray(v) ? v : [v];
  const clean = arr.map((x) => String(x).trim()).filter(Boolean);
  if (!clean.length) return "—";
  return clean.length === 1 && !Array.isArray(v) ? clean[0] : "\n" + clean.map((x) => `  - ${x}`).join("\n");
};

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
};

export default {
  id: "brief",
  async setup(ctx) {
    await ctx.tool.transform(async (draft) => {
      await draft.add({
        name: "brief",
        description:
          "Write the brief for a clarified request: goal, constraints, done-when, non-goals, assumptions. Returns the normalised block and appends it to the vault under Projects/briefs/. Use after the clarify-request interview, before starting the work.",
        input: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short name for the task" },
            goal: { type: "string", description: "One sentence: the change in the user's words" },
            constraints: { type: "array", items: { type: "string" }, description: "What must stay true: stack, files, performance, permissions" },
            done_when: { type: "array", items: { type: "string" }, description: "Testable checks, not adjectives" },
            non_goals: { type: "array", items: { type: "string" }, description: "What this deliberately does not touch" },
            assumptions: { type: "array", items: { type: "string" }, description: "What you decided without asking" },
          },
          required: ["title", "goal"],
        },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (a) => {
          const { date, time } = stamp();
          const head = `## ${date} ${time} · ${String(a.title).trim()}`;
          const body = FIELDS.map((f) => { const v = lines(a[f]); return v.startsWith("\n") ? `${LABEL[f]}:${v}` : `${LABEL[f]}: ${v}`; }).join("\n");
          const block = `${head}\n\n${body}\n`;
          let where = "";
          try {
            mkdirSync(VAULT, { recursive: true });
            const month = `${date.slice(0, 7)}.md`;
            const file = join(VAULT, month);
            appendFileSync(file, `\n${block}`);
            where = `\narchived: ${file}`;
          } catch (e) {
            where = `\narchive failed (${e.message}) — the brief below is still valid`;
          }
          const missing = FIELDS.filter((f) => lines(a[f]) === "—");
          return {
            output: `${block}${where}${missing.length ? `\nempty fields: ${missing.join(", ")}` : ""}`,
          };
        },
      });
    });
  },
};
