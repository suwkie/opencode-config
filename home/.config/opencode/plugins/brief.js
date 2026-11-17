// brief — writes an implementation-ready spec, not a summary.
//
// Sixteen sections, because a spec that leaves any of them implicit sends the
// next agent back to the user with a question. Determinism is the point: the
// same sections every time, empty ones marked "—" instead of dropped, and an
// archive in the vault so the reasoning outlives the session.
import { appendFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const VAULT = join(homedir(), "Документы", "Obsidian Vault", "Projects", "briefs");

// [key, heading, mode] — mode: "plain" paragraph, true numbered, false bullets.
const SECTIONS = [
  ["goal", "Goal", "plain"],
  ["background", "Background", false],
  ["current_state", "Current state", false],
  ["areas", "Files and areas", false],
  ["requirements", "What to build", true],
  ["edge_cases", "Edge cases", false],
  ["plan", "Order of work", true],
  ["constraints", "Constraints", false],
  ["acceptance", "Done when", false],
  ["verification", "Verification", false],
  ["risks", "Risks", false],
  ["non_goals", "Non-goals", false],
  ["assumptions", "Assumptions", false],
  ["open_questions", "Open questions", false],
  ["references", "References", false],
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

const props = (t, description) => ({ type: t === "array" ? "array" : "string", ...(t === "array" ? { items: { type: "string" } } : {}), description });

export default {
  id: "brief",
  async setup(ctx) {
    await ctx.tool.transform(async (draft) => {
      await draft.add({
        name: "brief",
        description:
          "Write a full implementation-ready spec after a clarify interview: goal, background, current state, files and areas, numbered requirements, edge cases, order of work, constraints, acceptance, verification, risks, non-goals, assumptions, open questions, references, expected answer. Returns markdown and archives it under Projects/briefs/. Every section must carry facts the next agent cannot guess; an empty section is written as a dash.",
        input: {
          type: "object",
          properties: {
            title: props("string", "Short name for the task"),
            goal: props("string", "One sentence: the change, in the user's words"),
            background: props("array", "Why this exists, what was tried, decisions already made, what breaks today"),
            current_state: props("array", "What exists now: paths, sizes, versions, measured behaviour"),
            areas: props("array", "Files, directories, modules or endpoints this touches — each with its path"),
            requirements: props("array", "Numbered, each concrete enough to implement without a follow-up question"),
            edge_cases: props("array", "Inputs and states that break naive implementations: empty, huge, concurrent, unicode, permissions"),
            plan: props("array", "Ordered milestones, each independently verifiable"),
            constraints: props("array", "What must stay true: stack, files, performance, permissions, no dependencies, budget"),
            acceptance: props("array", "Testable checks, not adjectives"),
            verification: props("array", "Commands or steps that prove it, including the failure case"),
            risks: props("array", "What can go wrong, and how it would be noticed"),
            non_goals: props("array", "What this deliberately does not touch"),
            assumptions: props("array", "What you decided without asking"),
            open_questions: props("array", "What remains genuinely unknown and who answers it"),
            references: props("array", "Files, docs, repos, prior art with a path or URL"),
            deliverable: props("array", "What the implementing agent reports back"),
          },
          required: ["title", "goal"],
        },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (a) => {
          const { date, time } = stamp();
          const missing = SECTIONS.filter(([k]) => !list(a[k]).length).map(([, h]) => h);
          const body = SECTIONS.map(([k, h, mode]) => `## ${h}\n\n${render(a[k], mode)}`).join("\n\n");
          const words = body.split(/\s+/).filter(Boolean).length;
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
          return { output: `${doc}\n${where} · ${words} words · ${warn}` };
        },
      });
    });
  },
};
