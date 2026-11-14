# OpenCode config backup

Portable snapshot of my OpenCode setup, kept private. Restore with `./install.sh`.

## What's here

    home/.config/opencode/          config, AGENTS.md routing rules, 21 skills, commands, graphify plugin
    home/.agents/skills/            22 Cloudflare skills
    home/.opencode/skills/          context7, task-management
    home/.config/git/hooks/         global post-commit auto-push hook
    home/.config/systemd/user/      git-autopush timer (retries failed pushes every 15 min)
    home/.local/bin/                git-autopush-all

`install.sh` copies all of it into place, sets `core.hooksPath`, and enables the timer.

## What's deliberately not here

- `service.json` — contains the OpenCode server password. Copy it by hand if needed.
- Provider credentials — stored in the OS keyring (`opencode auth login`).
- The graphify Python venv — `install.sh` prints the two commands to rebuild it.
- `gh` itself and its auth token.
- `opencode.json` backups and the `auto-resume.paused` marker.

## Updating

Edit the live config, then mirror it here and commit. With the auto-push hook
installed, a commit is pushed immediately:

    ./sync.sh && git commit -am "config: ..."

## Restoring on a new machine

    git clone git@github.com:suwkie/opencode-config.git ~/opencode-config
    ~/opencode-config/install.sh

Then do the manual steps it prints. Skills that reference absolute paths assume
the home directory is `/home/suwkie`; if it differs, grep for it after cloning.
