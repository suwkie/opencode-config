// destructive-guard — the one permission the user asked for: data deletion is
// theirs to approve. Everything else runs without asking.
//
// It cannot ask a question mid-call, and throwing ended the whole headless run
// (measured), so the command is replaced with an echo: nothing destructive
// executes, the model reads why, and the run continues.
//
// rm is judged by its actual target, not by a regex over the whole line. Three
// false positives taught this (rm -rf /tmp/..., rm -rf ~/.local/state/x.pid,
// dd of=/dev/null): the rule blocks catastrophe, not routine cleanup.

const P = "(^|[;&|]\\s*)";

// Whole targets whose deletion is the user's decision.
const CRITICAL = new Set([
  "/", "/*", "~", "~/", "$HOME", "$HOME/", "..", "../",
  "~/.config", "~/.local", "~/.ssh", "~/.gnupg", "~/.cache",
  "~/Документы", "~/Downloads", "~/Загрузки",
  "$HOME/.config", "$HOME/.local", "$HOME/.ssh",
]);
// Any path under these is equally their call.
const CRITICAL_PREFIX = ["/etc", "/usr", "/boot", "/var", "/home", "/opt", "/srv", "/lib", "/bin", "/sbin", "/dev"];
// Scratch areas inside a critical prefix: deleting these is routine.
const SCRATCH = ["/var/tmp", "/var/cache", "/tmp"];

const PATTERNS = [
  new RegExp(`${P}mkfs(\\.\\w+)?\\b`),
  new RegExp(`${P}dd\\b[^\\n]*\\bof=\\/dev\\/(?!null\\b|zero\\b)`),
  new RegExp(`${P}git\\s+push\\b[^\\n]*\\s(-f|--force)\\b`),
  new RegExp(`${P}git\\s+reset\\s+--hard\\b[^\\n]*\\b(origin|HEAD~)`),
  new RegExp(`${P}git\\s+clean\\s+-[a-zA-Z]*[fd]`),
  new RegExp(`${P}DROP\\s+(TABLE|DATABASE|SCHEMA)\\b`, "i"),
  new RegExp(`${P}truncate\\s+table\\b`, "i"),
  new RegExp(`${P}docker\\s+(system|volume)\\s+prune\\b`),
  new RegExp(`${P}pacman\\s+-R(dd|sc|s)\\b`),
  new RegExp(`${P}>\\s*\\/dev\\/(sd|nvme|vd)`),
];

const RM = new RegExp(`${P}rm\\s+((?:-\\S+\\s+)*)([^\\s;&|]+)`, "g");

function rmIsCritical(cmd) {
  RM.lastIndex = 0;
  let m;
  while ((m = RM.exec(cmd))) {
    const flags = m[2] || "";
    if (!/-[a-zA-Z]*r/i.test(flags)) continue;      // only recursive deletes can wipe a tree
    const raw = m[3];
    const target = raw.replace(/\/+$/, "") || "/";
    if (CRITICAL.has(raw) || CRITICAL.has(target)) return true;
    if (SCRATCH.some((s) => target === s || target.startsWith(s + "/"))) continue;
    if (CRITICAL_PREFIX.some((p) => target === p || target.startsWith(p + "/"))) return true;
  }
  return false;
}

export default {
  id: "destructive-guard",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {
      if (event.tool !== "shell") return;
      const cmd = event.input?.command;
      if (typeof cmd !== "string") return;
      const hit = rmIsCritical(cmd) || PATTERNS.some((p) => p.test(cmd));
      if (!hit) return;
      event.input = {
        ...event.input,
        command: `echo "[destructive-guard] blocked, nothing ran: ${cmd.replace(/["`$\\]/g, "").slice(0, 200)}. Deleting that is the user's call — ask them, then run it deliberately."`,
      };
    });
  },
};
