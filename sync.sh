#!/bin/bash
# Mirror the live OpenCode config into this repo, excluding secrets and state.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
cd "$here"

rm -rf home/.config/opencode home/.agents/skills home/.opencode/skills
mkdir -p home/.config/opencode home/.agents home/.opencode \
         home/.config/git/hooks home/.config/systemd/user home/.local/bin

cp -a "$HOME/.config/opencode/." home/.config/opencode/
rm -f home/.config/opencode/opencode.json.bak.* \
      home/.config/opencode/auto-resume.paused \
      home/.config/opencode/service.json
cp -a "$HOME/.agents/skills" home/.agents/
cp -a "$HOME/.opencode/skills" home/.opencode/
cp -a "$HOME/.config/git/hooks/post-commit" home/.config/git/hooks/
cp -a "$HOME/.config/systemd/user/git-autopush.service" home/.config/systemd/user/
cp -a "$HOME/.config/systemd/user/git-autopush.timer" home/.config/systemd/user/
cp -a "$HOME/.local/bin/git-autopush-all" home/.local/bin/

git add -A
git status --short | head -20
