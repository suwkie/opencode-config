// brief — writes an implementation-ready spec, not a summary.
//
// The shape is the one that worked before: goal, context, current state,
// numbered requirements, constraints, acceptance, verification, non-goals,
// assumptions, expected answer. Determinism is the point: the same sections
// every time, empty ones marked "—" instead of dropped, and an archive in the
// vault so the reasoning outlives the session.
import { appendFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const VAULT = join(homedir(), "Документы", "Obsidian Vault", "Projects", "briefs");

// [key, heading, ordered] — ordered sections are numbered requirements.
const SECTIONS = [
  ["goal", "Goal", "plain"],
  ["context", "Context", false],
  ["current_state", "Current state", false],
  ["requirements", "What to build", true],
  ["constraints", "Constraints", false],
  ["acceptance", "Done when", false],
  ["verification", "Verification", false],
  ["non_goals", "Non-goals", false],
  ["assumptions", "Assumptions", false],
  ["deliverable", "What to return", false],
];

const list = (v) => {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : String(v).split("\n");
  return arr.map((x) => String(x).trim()).filter(Boolean);
};

const render = (v, mode) => {
  const items = list(v);
  if (!items.length) return "—";
  if (mode === "plain") return items.join(" ");
  return items.map((x, i) => `${mode === true ? `${i + 1}.` : "-"} ${x}`).join("\n");
};

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
};

const props = (t) => (t === "array" ? { type: "array", items: { type: "string" } } : { type: "string" });

export default {
  id: "brief",
  async setup(ctx) {
    await ctx.tool.transform(async (draft) => {
      await draft.add({
        name: "brief",
        description:
          "Write a full implementation-ready spec after a clarify interview: goal, context, current state, numbered requirements, constraints, acceptance, verification, non-goals, assumptions, expected answer. Returns markdown and archives it under Projects/briefs/. Every section should carry facts the next agent cannot guess.",
        input: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short name for the task" },
            goal: { type: "string", description: "One sentence: the change, in the user's words" },
            context: { ...props("array"), description: "Why this exists, what was tried, decisions already made" },
            current_state: { ...props("array"), description: "What exists now: paths, sizes, versions, what is broken" },
            requirements: { ...props("array"), description: "Numbered, each one concrete enough to implement without a follow-up question" },
            constraints: { ...props("array"), description: "What must stay true: stack, files, performance, permissions, no dependencies" },
            acceptance: { ...props("array"), description: "Testable checks, not adjectives" },
            verification: { ...props("array"), description: "Commands or steps that prove it, including the failure case" },
            non_goals: { ...props("array"), description: "What this deliberately does not touch" },
            assumptions: { ...props("array"), description: "What you decided without asking" },
            deliverable: { ...props("array"), description: "What the implementing agent should report back" },
          },
          required: ["title", "goal"],
        },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (a) => {
          const { date, time } = stamp();
          const missing = SECTIONS.filter(([k]) => !list(a[k]).length).map(([, h]) => h);
          const body = SECTIONS.map(([k, h, ordered]) => `## ${h}\n\n${render(a[k], ordered)}`).join("\n\n");
          const doc = `# Task: ${String(a.title).trim()}\n\n${body}\n`;
          let where = "";
          try {
            mkdirSync(VAULT, { recursive: true });
            const file = join(VAULT, `${date.slice(0, 7)}.md`);
            appendFileSync(file, `\n---\n\n_${date} ${time} · ${String(a.title).trim()}_\n\n${doc}`);
            where = `archived: ${file}`;
          } catch (e) {
            where = `archive failed (${e.message}) — the spec above is still valid`;
          }
          const warn = missing.length ? `empty sections: ${missing.join(", ")}` : "all sections filled";
          return { output: `${doc}\n${where}\n${warn}` };
        },
      });
    });
  },
};
