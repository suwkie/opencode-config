#!/bin/bash
# Restore OpenCode settings on a new machine. Idempotent.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)

mkdir -p "$HOME/.config" "$HOME/.local/bin" "$HOME/.agents" "$HOME/.opencode"
cp -a "$here/home/.config/." "$HOME/.config/"
cp -a "$here/home/.agents/." "$HOME/.agents/"
cp -a "$here/home/.opencode/." "$HOME/.opencode/"
cp -a "$here/home/.local/bin/." "$HOME/.local/bin/"

chmod +x "$HOME/.config/git/hooks/post-commit" "$HOME/.local/bin/git-autopush-all"
git config --global core.hooksPath "$HOME/.config/git/hooks"

# The browse MCP entry points at ~/.local/bin/browse, a 134 MB binary that is not
# in this repo. Say so instead of leaving a config that looks fine and fails at
# request time.
if [ ! -x "$HOME/.local/bin/browse" ]; then
  echo "note: ~/.local/bin/browse is missing (browse MCP will not start)."
  echo "      install it with: curl -fsSL https://opencode.ai/browse/install | bash"
fi

if command -v systemctl >/dev/null && systemctl --user is-system-running >/dev/null 2>&1; then
  systemctl --user daemon-reload
  systemctl --user enable --now git-autopush.timer
fi

cat <<'EOF'
Restored. Manual steps remaining:

  1. opencode auth login
     Provider credentials live in the OS keyring, not in this repo.

  2. graphify CLI (Python):
       python3 -m venv ~/.local/share/graphify/venv
       ~/.local/share/graphify/venv/bin/pip install graphifyy
       ln -sf ~/.local/share/graphify/venv/bin/graphify ~/.local/bin/graphify

  3. gh CLI:  gh auth login && gh auth setup-git

  4. If you used OpenCode's server password (service.json) from another
     machine, copy that file over by hand — it is deliberately not here.
EOF
