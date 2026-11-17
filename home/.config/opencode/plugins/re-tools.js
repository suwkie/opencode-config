// re-tools — three read-only scans for architectural reading of a codebase.
// No dependencies, no network, no model: regex over files plus a directory walk,
// bounded by SKIP and MAX_FILES so a 1 GB repo cannot stall it.
//
// The point is not to describe every file; it is to surface the handful of facts
// that decide how you would build the same thing: where execution enters, which
// modules everything depends on, and what is public surface.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, extname, basename, dirname } from "path";

const SKIP = new Set(["node_modules", "target", "dist", "build", ".git", "graphify-out", "vendor", ".next", "__pycache__", ".venv", "venv", "out", ".cargo"]);
const MAX_FILES = 4000;
const MAX_BYTES = 2 * 1024 * 1024;

const LANG = {
  ".rs": "Rust", ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
  ".py": "Python", ".go": "Go", ".java": "Java", ".kt": "Kotlin", ".swift": "Swift", ".c": "C",
  ".h": "C", ".cpp": "C++", ".hpp": "C++", ".cs": "C#", ".rb": "Ruby", ".php": "PHP", ".lua": "Lua",
  ".zig": "Zig", ".ex": "Elixir", ".sh": "Shell",
};

const ENTRY = [/^main\.(rs|go|py|ts|js|c|cpp)$/, /^index\.(ts|js|tsx)$/, /^app\.(ts|py|js)$/, /^server\.(ts|js|go)$/, /^__main__\.py$/, /^lib\.rs$/, /^bin\//];
const MANIFESTS = ["Cargo.toml", "package.json", "pyproject.toml", "requirements.txt", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts", "Gemfile", "composer.json", "Makefile", "CMakeLists.txt"];

function walk(root, limit = MAX_FILES) {
  const files = [];
  const stack = [root];
  while (stack.length && files.length < limit) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name.startsWith(".") && e.name !== ".github") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP.has(e.name)) stack.push(p); }
      else if (e.isFile()) files.push(p);
    }
  }
  return files;
}

const read = (p) => {
  try { if (statSync(p).size > MAX_BYTES) return ""; return readFileSync(p, "utf8"); } catch { return ""; }
};

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

// --- 1. scan -----------------------------------------------------------------
function scan(path) {
  const root = path.replace(/^~/, process.env.HOME || "");
  const files = walk(root);
  const byLang = new Map();
  let loc = 0;
  const entries = [];
  const manifests = [];
  const dirs = new Map();

  for (const f of files) {
    const ext = extname(f);
    const lang = LANG[ext];
    const rel = relative(root, f);
    const top = rel.includes("/") ? rel.split("/")[0] : ".";
    dirs.set(top, (dirs.get(top) || 0) + 1);
    if (lang) {
      const text = read(f);
      const lines = text ? text.split("\n").length : 0;
      loc += lines;
      const l = byLang.get(lang) || { files: 0, loc: 0 };
      l.files += 1; l.loc += lines;
      byLang.set(lang, l);
      if (ENTRY.some((re) => re.test(rel) || re.test(basename(f)))) entries.push(`${rel} (${lines} loc)`);
    }
    if (MANIFESTS.includes(basename(f))) manifests.push(rel);
  }

  const langs = [...byLang.entries()].sort((a, b) => b[1].loc - a[1].loc)
    .map(([l, s]) => `${l}: ${s.files} files, ${s.loc} loc`).join("; ");
  return [
    `root: ${root}`,
    `files scanned: ${files.length} (cap ${MAX_FILES})`,
    `languages: ${langs || "none recognised"}`,
    `total code loc: ${loc}`,
    `entry-point candidates: ${entries.slice(0, 12).join(", ") || "none found by name"}`,
    `manifests: ${manifests.join(", ") || "none"}`,
    `top dirs by file count: ${[...dirs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([d, n]) => `${d}=${n}`).join(" ")}`,
  ].join("\n");
}

// --- 2. imports ---------------------------------------------------------------
const IMPORT_PATTERNS = [
  { ext: new Set([".rs"]), re: /^\s*(?:use\s+(crate|super|self)::([\w:]+)|mod\s+([a-zA-Z_]\w*)\s*;)/gm, kind: "rust" },
  { ext: new Set([".ts", ".tsx", ".js", ".jsx"]), re: /(?:from\s+|require\(\s*)["'](\.{1,2}\/[^"']+|@\/[^"']+)["']/g, kind: "js" },
  { ext: new Set([".py"]), re: /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm, kind: "py" },
  { ext: new Set([".go"]), re: /^\s*(?:use\s+)?"([\w./-]+)"\s*$/gm, kind: "go" },
  { ext: new Set([".kt", ".java"]), re: /^\s*import\s+([\w.]+);/gm, kind: "jvm" },
];

function imports(path) {
  const root = path.replace(/^~/, process.env.HOME || "");
  const files = walk(root).filter((f) => LANG[extname(f)]);
  const inbound = new Map();
  const outbound = new Map();

  // Internal Python modules: the file stems that exist in the tree.
  const pyLocal = new Set(files.filter((f) => extname(f) === ".py").map((f) => basename(f, ".py")));
  const goModule = (() => {
    const g = files.find((f) => basename(f) === "go.mod");
    const m = g ? read(g).match(/^module\s+(\S+)/m) : null;
    return m ? m[1] : null;
  })();

  for (const f of files) {
    const ext = extname(f);
    const rule = IMPORT_PATTERNS.find((r) => r.ext.has(ext));
    if (!rule) continue;
    const text = read(f);
    if (!text) continue;
    const rel = relative(root, f);
    let m;
    rule.re.lastIndex = 0;
    while ((m = rule.re.exec(text))) {
      let key;
      if (rule.kind === "rust") {
        // crate::tuya::Session -> "tuya"; super::x -> parent dir name; mod foo; -> foo
        key = m[2] ? m[2].split("::")[0] : m[3];
        if (m[1] === "super" || m[1] === "self") key = `${m[1]}::${m[2]?.split("::")[0] || ""}`;
      } else if (rule.kind === "py") {
        const t = (m[1] || m[2] || "").split(".")[0];
        key = pyLocal.has(t) ? t : null;
      } else if (rule.kind === "go") {
        const t = m[1] || "";
        key = goModule && t.startsWith(goModule) ? t.slice(goModule.length + 1).split("/")[0] : null;
      } else {
        const t = (m[1] || m[2] || "").trim();
        key = t.split("/").slice(0, 2).join("/");
      }
      if (!key || key.length < 2) continue;
      outbound.set(rel, (outbound.get(rel) || 0) + 1);
      if (!inbound.has(key)) inbound.set(key, new Set());
      inbound.get(key).add(rel);
    }
  }

  const hubs = [...inbound.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 15)
    .map(([k, s]) => `${k} ← ${s.size} files`);
  const fan = [...outbound.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([k, n]) => `${k} → ${n}`);
  return [
    `files with imports: ${outbound.size} of ${files.length}`,
    "",
    "most depended-on (hubs — changing these ripples):",
    ...hubs.map((h) => "  " + h),
    "",
    "most importing (fan-out — probably orchestration or god modules):",
    ...fan.map((h) => "  " + h),
  ].join("\n");
}

// --- 3. surface ---------------------------------------------------------------
const SURFACE = [
  { re: /^\s*pub\s+(fn|struct|enum|trait|mod|const|type)\s+([A-Za-z_][\w]*)/gm, lang: "Rust" },
  { re: /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|interface|type)\s+([A-Za-z_$][\w$]*)/gm, lang: "TS/JS" },
  { re: /^\s*def\s+([A-Za-z_]\w*)\s*\(/gm, lang: "Python" },
  { re: /^\s*func\s+(?:\([^)]*\)\s*)?([A-Z]\w*)/gm, lang: "Go" },
];
const ROUTES = [
  /@(?:app|router|bp)\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g,
  /\.(get|post|put|patch|delete)\(\s*["'](\/[^"']*)["']/g,
  /path\(\s*["']([^"']+)["']/g,
];
const IPC = [/org\.kde\.\w+/g, /ru\.\w+\.\w+/g, /interface\s+([A-Z]\w+)/g];

function surface(path) {
  const root = path.replace(/^~/, process.env.HOME || "");
  const files = walk(root).filter((f) => LANG[extname(f)]);
  const out = [];
  const routes = new Set();
  const ipc = new Set();

  for (const f of files) {
    const text = read(f);
    if (!text) continue;
    const rel = relative(root, f);
    for (const rule of SURFACE) {
      if (!rule.re.test(text)) { rule.re.lastIndex = 0; continue; }
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text))) {
        const name = m[2] || m[1];
        out.push(`${rel}:${lineOf(text, m.index)} ${rule.lang} ${name}`);
      }
    }
    for (const re of ROUTES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) routes.add(`${rel} ${m[2] || m[1]}`);
    }
    for (const re of IPC) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) ipc.add(m[1] || m[0]);
    }
  }
  return [
    `public symbols: ${out.length}`,
    ...out.slice(0, 40).map((l) => "  " + l),
    out.length > 40 ? `  … ${out.length - 40} more` : "",
    "",
    `routes: ${routes.size}`,
    ...[...routes].slice(0, 20).map((r) => "  " + r),
    "",
    `interfaces / buses: ${[...ipc].slice(0, 15).join(", ") || "none"}`,
  ].filter(Boolean).join("\n");
}

const out = (text) => ({ output: text.length > 8000 ? text.slice(0, 8000) + "\n… trimmed" : text });

export default {
  id: "re-tools",
  async setup(ctx) {
    await ctx.tool.transform(async (draft) => {
      await draft.add({
        name: "re_scan",
        description:
          "Inventory a codebase before reading it: languages by size, LOC, entry-point candidates, build manifests, top directories. Use first on an unfamiliar repo.",
        input: { type: "object", properties: { path: { type: "string", description: "Repo root, ~ allowed" } }, required: ["path"] },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (a) => out(scan(a.path)),
      });
      await draft.add({
        name: "re_imports",
        description:
          "Module dependency map: which modules everything imports (hubs) and which import the most (orchestrators). Use it to find the load-bearing parts and the god files.",
        input: { type: "object", properties: { path: { type: "string", description: "Repo root, ~ allowed" } }, required: ["path"] },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (a) => out(imports(a.path)),
      });
      await draft.add({
        name: "re_surface",
        description:
          "Public surface: exported symbols, pub/def/func declarations, HTTP routes and D-Bus/interface names with file:line. Use it to see what an app promises to the outside.",
        input: { type: "object", properties: { path: { type: "string", description: "Repo root, ~ allowed" } }, required: ["path"] },
        output: { type: "object", properties: { output: { type: "string" } }, required: ["output"] },
        execute: async (a) => out(surface(a.path)),
      });
    });
  },
};
