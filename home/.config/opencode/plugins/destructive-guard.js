// destructive-guard — the one permission the user asked for: data deletion is
// theirs to approve. Everything else runs without asking.
//
// It cannot ask a question mid-call, and throwing ended the whole headless run
// (measured), so the command is replaced with an echo: nothing destructive
// executes, the model reads why, and the run continues.
//
// Patterns are anchored to a command position (start, or after ; && || |). An
// unanchored match also fired on commands that merely *mention* the text in a
// quoted argument, which is a false positive worth avoiding.
const P = "(^|[;&|]\\s*)";
const PATTERNS = [
  new RegExp(`${P}rm\\s+(-[a-zA-Z]*[rf][a-zA-Z]*\\s+)+(\\/|~|\\$HOME|\\.\\.)`),
  new RegExp(`${P}mkfs(\\.\\w+)?\\b`),
  new RegExp(`${P}dd\\b[^\\n]*\\bof=\\/dev\\/`),
  new RegExp(`${P}git\\s+push\\b[^\\n]*\\s(-f|--force)\\b`),
  new RegExp(`${P}git\\s+reset\\s+--hard\\b[^\\n]*\\b(origin|HEAD~)`),
  new RegExp(`${P}git\\s+clean\\s+-[a-zA-Z]*[fd]`),
  new RegExp(`${P}DROP\\s+(TABLE|DATABASE|SCHEMA)\\b`, "i"),
  new RegExp(`${P}truncate\\s+table\\b`, "i"),
  new RegExp(`${P}docker\\s+(system|volume)\\s+prune\\b`),
  new RegExp(`${P}pacman\\s+-R(dd|sc|s)\\b`),
  new RegExp(`${P}>\\s*\\/dev\\/(sd|nvme|vd)`),
];

export default {
  id: "destructive-guard",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {
      if (event.tool !== "shell") return;
      const cmd = event.input?.command;
      if (typeof cmd !== "string") return;
      const hit = PATTERNS.find((p) => p.test(cmd));
      if (!hit) return;
      event.input = {
        ...event.input,
        command: `echo "[destructive-guard] blocked, nothing ran: ${cmd.replace(/["`$\\]/g, "").slice(0, 200)}. Deletion is the user's call — ask them, then run it deliberately."`,
      };
    });
  },
};
