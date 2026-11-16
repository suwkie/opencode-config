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
import { appendFileSync } from "fs";
import { spawn } from "child_process";
import { randomBytes } from "crypto";

const TYPES = new Set(["pick_one", "pick_many", "confirm", "slider", "text"]);
const DEFAULT_WAIT_MS = 10 * 60 * 1000;

const PAGE = (questions, token, title) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; padding:32px 20px 80px; font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
         background:#111318; color:#e6e8ee; }
  main { max-width:720px; margin:0 auto; }
  h1 { font-size:19px; font-weight:600; margin:0 0 4px; }
  .sub { color:#8b93a7; font-size:13px; margin-bottom:28px; }
  .q { background:#181b22; border:1px solid #232734; border-radius:10px; padding:16px 18px; margin-bottom:14px; }
  .q > label.ql { display:block; font-weight:550; margin-bottom:10px; }
  .note { color:#8b93a7; font-size:12.5px; margin:4px 0 0; }
  .opt { display:flex; gap:10px; align-items:flex-start; padding:7px 9px; border-radius:7px; cursor:pointer; }
  .opt:hover { background:#1e2230; }
  .opt input { margin-top:3px; accent-color:#6ea8fe; }
  .opt b { font-weight:550; }
  .opt span { display:block; color:#8b93a7; font-size:12.5px; }
  input[type=text] { width:100%; padding:9px 11px; border-radius:7px; border:1px solid #2b303f;
                     background:#0e1015; color:inherit; font:inherit; }
  input[type=range] { width:100%; accent-color:#6ea8fe; }
  .val { float:right; font-variant-numeric:tabular-nums; color:#9aa3b8; font-weight:500; }
  button { position:fixed; left:50%; transform:translateX(-50%); bottom:20px; padding:11px 26px;
           border:0; border-radius:9px; background:#3d7bfd; color:#fff; font:inherit; font-weight:600;
           cursor:pointer; box-shadow:0 6px 24px #0008; }
  button:disabled { opacity:.5; cursor:default; }
  .done { padding:24px; text-align:center; color:#8b93a7; }
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
for (const q of QS) {
  const box = document.createElement("div");
  box.className = "q";
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
    ? '<div class="done">Answers sent. You can close this tab.</div>'
    : '<div class="done">This form already expired. Ask the agent again.</div>';
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
          "Ask the user a set of questions in a local browser form: click instead of typing. Use when a decision needs several answers at once, or when free-text answers would be slow to type. Blocks until the user submits or the timeout passes.",
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
          const waitMs = Math.max(15, Math.min(3600, Number(args.wait_seconds) || 600)) * 1000;
          try {
            const { answers, questions, url } = await askForm(args.questions, { title: args.title || "Agent question", waitMs });
            return { output: `Form answered at ${url}\n\n${format(questions, answers)}` };
          } catch (e) {
            return { output: `ask_ui: ${e.message}\n\nAsk the questions in chat instead.` };
          }
        },
      });
    });
  },
};
