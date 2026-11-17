// ask-ui — a local browser form for agent questions (a V2 rebuild of octto's core:
// click instead of type, all questions on one page, answers back as one result).
//
// One tool: `ask_ui`. It serves a page on 127.0.0.1, opens it, and waits for the
// user to submit. No agents, no branches, no plan files — just the part that is
// worth having.
//
// OpenCode 2 only: it registers the tool through ctx.tool.transform, which V1
// does not expose.
import { createServer } from "http";
import { appendFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import { randomBytes } from "crypto";

const TYPES = new Set(["pick_one", "pick_many", "confirm", "slider", "text"]);
const DEFAULT_WAIT_MS = 10 * 60 * 1000;

// Monthly note per vault convention: Projects/ask-ui/YYYY-MM.md.
const ARCHIVE_DIR = join(homedir(), "Документы", "Obsidian Vault", "Projects", "ask-ui");

// One form at a time. A model that misreads the return value retries the same
// call, and two identical forms in the browser is worse than an error message.
let openForm = null;

const showAnswer = (v) => {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "(none)";
  if (v === true) return "yes";
  if (v === false) return "no";
  if (v === null || v === undefined || v === "") return "(skipped)";
  return String(v);
};

// One block per form. Failure here must never cost the answers, so it is
// swallowed: the submit still returns ok.
export function archiveForm(title, questions, answers, when = new Date()) {
  try {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
    const pad = (n) => String(n).padStart(2, "0");
    const month = `${when.getFullYear()}-${pad(when.getMonth() + 1)}`;
    const file = join(ARCHIVE_DIR, `${month}.md`);
    const stamp = `${month}-${pad(when.getDate())} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
    const lines = questions.map((q) => `- ${q.label} → ${showAnswer(answers?.[q.id])}`);
    const block = `${existsSync(file) ? "" : `# Ask UI · ${month}\n`}\n## ${stamp} · ${title}\n\n${lines.join("\n")}\n`;
    appendFileSync(file, block);
    return file;
  } catch {
    return null;
  }
}

const PAGE = (questions, token, title) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<title>${title}</title>
<style>
  :root {
    --background: #ffffff;
    --surface: #ffffff;
    --surface-elevated: #f8f9fa;
    --surface-hover: #f1f3f4;
    --foreground: #000000;
    --foreground-muted: #333333;
    --foreground-subtle: #666666;
    --border: #000000;
    --border-subtle: #cccccc;
    --accent-success: #00aa00;
  }
  *, *:before, *:after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: var(--background); color: var(--foreground);
    font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 14px; line-height: 1.5; letter-spacing: -0.02em; }
  body { position: relative; }
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
    background-size: 180px 180px;
  }
  main { position: relative; z-index: 2; max-width: 640px; margin: 0 auto; padding: 2rem 1.5rem 7rem; }
  h1 { font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; font-size: 1.1rem; }
  .sub { color: var(--foreground-subtle); font-size: 0.8rem; margin: 0.5rem 0 2rem; }
  .q { background: var(--surface); border: 1px solid var(--border); padding: 1.25rem 1.5rem; margin-bottom: 0.75rem; }
  .q .idx { float: right; color: var(--foreground-subtle); font-size: 0.75rem; }
  .q > label.ql { display: block; font-weight: 600; margin-bottom: 0.9rem; padding-right: 2rem; }
  .note { color: var(--foreground-subtle); font-size: 0.75rem; margin: -0.6rem 0 0.8rem; }
  .opt { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.5rem 0.6rem;
    border: 1px solid transparent; cursor: pointer; }
  .opt:hover { background: var(--surface-hover); border-color: var(--border-subtle); }
  .opt input { margin-top: 0.2rem; accent-color: #000; }
  .opt b { font-weight: 600; }
  .opt span { display: block; color: var(--foreground-subtle); font-size: 0.75rem; }
  input[type=text] { width: 100%; padding: 0.6rem 0.7rem; border: 1px solid var(--border);
    background: var(--surface); color: inherit; font: inherit; }
  input[type=text]:focus { outline: 2px solid #000; outline-offset: -2px; }
  input[type=range] { width: 100%; accent-color: #000; }
  .val { float: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  button { position: fixed; left: 50%; transform: translateX(-50%); bottom: 1.5rem;
    padding: 0.7rem 2rem; border: 1px solid #000; background: #000; color: #fff;
    font: inherit; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; }
  button:hover { background: #fff; color: #000; }
  button:disabled { opacity: 0.4; cursor: default; }
  .done { border: 1px solid var(--border); padding: 2rem; text-align: center; }
  .done b { display: block; margin-bottom: 0.5rem; }
  .done .tick { color: var(--accent-success); }
</style></head><body><main>
<h1>${title}</h1>
<div class="sub">${questions.length} question${questions.length === 1 ? "" : "s"} &middot; answers go straight back to the agent</div>
<form id="f"></form>
<button id="go" form="f">Send answers</button>
</main>
<script>
const QS = ${JSON.stringify(questions)};
const TOKEN = ${JSON.stringify(token)};
const f = document.getElementById("f");
for (const [qi, q] of QS.entries()) {
  const box = document.createElement("div");
  box.className = "q";
  const idx = document.createElement("span");
  idx.className = "idx";
  idx.textContent = String(qi + 1).padStart(2, "0") + " / " + String(QS.length).padStart(2, "0");
  box.appendChild(idx);
  const lab = document.createElement("label");
  lab.className = "ql";
  lab.textContent = q.label;
  box.appendChild(lab);
  if (q.note) { const n = document.createElement("p"); n.className = "note"; n.textContent = q.note; box.appendChild(n); }
  const name = "q_" + q.id;
  if (q.type === "pick_one" || q.type === "pick_many") {
    (q.options || []).forEach((o, i) => {
      const l = document.createElement("label");
      l.className = "opt";
      const inp = document.createElement("input");
      inp.type = q.type === "pick_one" ? "radio" : "checkbox";
      inp.name = name; inp.value = typeof o === "string" ? o : o.label;
      if (i === 0 && q.type === "pick_one") inp.checked = true;
      const t = document.createElement("div");
      const b = document.createElement("b"); b.textContent = inp.value; t.appendChild(b);
      if (o && o.description) { const s = document.createElement("span"); s.textContent = o.description; t.appendChild(s); }
      l.appendChild(inp); l.appendChild(t); box.appendChild(l);
    });
  } else if (q.type === "confirm") {
    [["Yes", "true"], ["No", "false"]].forEach(([txt, v], i) => {
      const l = document.createElement("label");
      l.className = "opt";
      const inp = document.createElement("input");
      inp.type = "radio"; inp.name = name; inp.value = v; if (i === 0) inp.checked = true;
      const t = document.createElement("div"); const b = document.createElement("b"); b.textContent = txt;
      t.appendChild(b); l.appendChild(inp); l.appendChild(t); box.appendChild(l);
    });
  } else if (q.type === "slider") {
    const wrap = document.createElement("div");
    const out = document.createElement("span"); out.className = "val";
    const inp = document.createElement("input");
    inp.type = "range"; inp.name = name;
    inp.min = q.min ?? 0; inp.max = q.max ?? 100; inp.step = q.step ?? 1;
    inp.value = q.value ?? Math.round(((q.min ?? 0) + (q.max ?? 100)) / 2);
    out.textContent = inp.value;
    inp.oninput = () => out.textContent = inp.value;
    wrap.appendChild(out); wrap.appendChild(inp); box.appendChild(wrap);
  } else {
    const inp = document.createElement("input");
    inp.type = "text"; inp.name = name; inp.placeholder = q.placeholder || "";
    box.appendChild(inp);
  }
  f.appendChild(box);
}
document.getElementById("go").onclick = async (ev) => {
  ev.preventDefault();
  const answers = {};
  for (const q of QS) {
    const name = "q_" + q.id;
    if (q.type === "pick_one" || q.type === "confirm") {
      const el = f.querySelector('input[name="' + name + '"]:checked');
      answers[q.id] = q.type === "confirm" ? (el && el.value === "true") : (el ? el.value : null);
    } else if (q.type === "pick_many") {
      answers[q.id] = [...f.querySelectorAll('input[name="' + name + '"]:checked')].map(x => x.value);
    } else if (q.type === "slider") {
      answers[q.id] = Number(f.querySelector('input[name="' + name + '"]').value);
    } else {
      answers[q.id] = f.querySelector('input[name="' + name + '"]').value;
    }
  }
  document.getElementById("go").disabled = true;
  const r = await fetch("/submit?t=" + encodeURIComponent(TOKEN), {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(answers)
  });
  document.querySelector("main").innerHTML = r.ok
    ? '<div class="done"><b><span class="tick">&#10003;</span> answers sent</b>closing this tab…</div>'
    : '<div class="done"><b>this form expired</b>Ask the agent again.</div>';
  // Browsers only let a script close a window it opened; when refused the
  // message above stays and the tab is closed by hand.
  if (r.ok) setTimeout(() => window.close(), 1000);
};
</script></body></html>`;

function normalise(questions) {
  if (!Array.isArray(questions) || questions.length === 0) throw new Error("ask_ui needs at least one question");
  return questions.map((q, i) => {
    const type = String(q.type || "pick_one");
    if (!TYPES.has(type)) throw new Error(`question ${i + 1}: unknown type "${type}" (use ${[...TYPES].join(", ")})`);
    const id = String(q.id || `q${i + 1}`);
    return { id, type, label: String(q.label || id), note: q.note ? String(q.note) : undefined,
             options: q.options, min: q.min, max: q.max, step: q.step, value: q.value, placeholder: q.placeholder };
  });
}

function format(questions, answers) {
  const show = (v) => (Array.isArray(v) ? (v.length ? v.join(", ") : "(none)") : v === true ? "yes" : v === false ? "no"
    : v === null || v === undefined || v === "" ? "(skipped)" : String(v));
  return questions.map((q, i) => `${i + 1}. ${q.label} → ${show(answers[q.id])}`).join("\n");
}

// Serves one form and resolves with the submitted answers. Exported for tests.
export function askForm(questions, { title = "Agent question", waitMs = DEFAULT_WAIT_MS, openBrowser = true, onReady } = {}) {
  const qs = normalise(questions);
  const token = randomBytes(12).toString("hex");
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      openForm = null;
      fn(value);
    };

    const server = createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.searchParams.get("t") !== token && url.pathname !== "/") {
        res.writeHead(403).end("bad token");
        return;
      }
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE(qs, token, title));
        return;
      }
      if (req.method === "POST" && url.pathname === "/submit") {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
          try {
            const answers = JSON.parse(body || "{}");
            archiveForm(title, qs, answers);
            finish(resolve, { answers, questions: qs, url: page });
          } catch {
            finish(reject, new Error("ask_ui received malformed JSON"));
          }
        });
        return;
      }
      res.writeHead(404).end("not found");
    });

    const timer = setTimeout(() => finish(reject, new Error(`ask_ui: no answer within ${Math.round(waitMs / 1000)}s`)), waitMs);
    let page = "";
    server.listen(0, "127.0.0.1", () => {
      page = `http://127.0.0.1:${server.address().port}/?t=${token}`;
      // So the tab can still be found when the browser did not open.
      try { appendFileSync("/tmp/opencode/ask-ui-url.txt", page + "\n"); } catch {}
      if (onReady) onReady(page);
      if (openBrowser) spawn("xdg-open", [page], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
    });
    server.on("error", (e) => finish(reject, e));
  });
}

export default {
  id: "ask-ui",
  async setup(ctx) {
    await ctx.tool.transform(async (draft) => {
      await draft.add({
        name: "ask_ui",
        description:
          "Ask the user a set of questions in a local browser form: click instead of typing. Use when a decision needs several answers at once, or when free-text answers would be slow to type. Blocks until the user submits or the timeout passes. The call RESOLVES TO THE ANSWER TEXT itself: never read .output or .result on it, that is why it looks null. Every submitted form is also archived in ~/Документы/Obsidian Vault/Projects/ask-ui/YYYY-MM.md — if the answer text looks empty, read the last block there before re-asking.",
        input: {
          type: "object",
          properties: {
            title: { type: "string", description: "Heading shown on the page" },
            questions: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Stable key used in the result" },
                  label: { type: "string", description: "The question itself" },
                  note: { type: "string", description: "Optional hint under the label" },
                  type: { type: "string", enum: [...TYPES] },
                  options: { type: "array", items: { type: "object", properties: { label: { type: "string" }, description: { type: "string" } }, required: ["label"] } },
                  min: { type: "number" }, max: { type: "number" }, step: { type: "number" }, value: { type: "number" },
                  placeholder: { type: "string" },
                },
                required: ["id", "label", "type"],
              },
            },
            wait_seconds: { type: "number", description: "How long to wait for an answer (default 600)" },
          },
          required: ["questions"],
        },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (args) => {
          if (openForm) {
            return { output: `A form is already open in the browser: "${openForm}". Wait for it, or ask in chat — do not open a second one.` };
          }
          const waitMs = Math.max(15, Math.min(3600, Number(args.wait_seconds) || 600)) * 1000;
          try {
            openForm = args.title || "Agent question";
            const { answers, questions, url } = await askForm(args.questions, { title: args.title || "Agent question", waitMs });
            return { output: `Form answered at ${url}\n\n${format(questions, answers)}` };
          } catch (e) {
            openForm = null;
            return { output: `ask_ui: ${e.message}\n\nAsk the questions in chat instead.` };
          }
        },
      });
    });
  },
};
