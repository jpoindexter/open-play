# Contributing to Open Play

Thanks for helping make local DJ mixing reliable and accessible. The first milestone is the core two-track mixing workflow; full competitor parity is a longer-term goal.

## Start here

1. Read the [README](README.md), [known issues](docs/beta/KNOWN_ISSUES.md) and existing [issues](https://github.com/jpoindexter/open-play/issues).
2. Fork the repository to your GitHub account and clone your fork.
3. Create a branch for one fix or improvement.

```sh
git clone https://github.com/YOUR-USERNAME/open-play.git
cd open-play
git remote add upstream https://github.com/jpoindexter/open-play.git
git switch -c fix/describe-the-change
python3 scripts/serve_prototype.py --port 8848
```

Open http://127.0.0.1:8848/prototype/workspace-preview.html. Use generated demo tracks or audio you own. Node.js 24 is used for the JavaScript checks. Basic browser development does not need Electron, npm installation, a controller or private music files.

The loopback server has been checked on macOS. Optional processing runtimes and desktop packaging are separate from this quickstart; do not commit your local runtime, models or generated app bundles.

## Choose a useful change

Small bug fixes, accessibility improvements, documentation and reproducible reports are welcome. Open an issue before a large feature, new dependency, audio backend or layout rewrite. Search existing issues first and describe the concrete user problem.

For timing and audio problems, include the app/source version, output setup, relevant deck state, positions and the action that triggered the event. Say whether you heard the issue, saw it, measured it in an internal capture or only inferred it. Equal BPM or aligned grid lines alone do not prove musical alignment.

Do not keep repeating a clean test just to produce a report. Preserve the next actual failure and its context.

## Keep changes focused

- Preserve existing controls, layouts, keyboard access and library waveform previews.
- Reuse existing helpers and design tokens. Standard form components use Astryx; custom DJ controls and waveform rendering have their own owners.
- Put new logic in a focused module. Aim for roughly 150–250 lines and keep new modules under 300 when practical. Existing larger files are not a reason for an unrelated refactor.
- For asynchronous transport work, guard track/request ownership across every await. A newer Stop, load or seek must win over an old preparation.
- Keep trust-boundary validation, cancellation, error messages and data-recovery behavior when moving code.
- Do not replace source with generated output or add dependencies for a few lines of code. If you change `prototype/ui/`, include the rebuilt bundle and retained license files.

## Verify the affected behavior

Run the smallest relevant existing check. For example, a Repeat change uses:

```sh
node --test prototype/repeat-end.test.mjs
```

A new non-trivial bug fix should include one focused regression that fails before the fix and passes after it. Documentation-only changes need accurate commands and working links, not a new test suite. Broader suites belong at a release checkpoint or a specific regression risk.

For interface changes, inspect the actual screen at the affected deck count/orientation/density. For audio changes, report source tests, captured output, listening and hardware results separately. Start at low volume and leave the session stopped afterward. Never claim an unperformed listening or controller check.

## Open a pull request

```sh
git add path/to/changed-file
git commit -m "Describe the behavior changed"
git push -u origin fix/describe-the-change
```

Open a pull request from your branch into this repository's `main` branch. Explain the problem, resulting behavior and the focused check you performed. Link the issue if there is one; include a screenshot for visible UI changes. Identify anything still unverified.

A maintainer reviews the change before merge. Please keep review discussion constructive and about the work. Avoid mixing a bug fix with formatting sweeps, generated evidence dumps or unrelated features.

## Protect contributors and their music

Never commit credentials, `.env` files, songs, mixes, personal library/profile backups, proprietary extracted assets, model weights or app packages. `local-evidence/` is ignored for local-only artifacts. Review filenames, screenshots and logs before posting them; a generated demo is usually enough for a minimal reproduction.

Report security vulnerabilities privately using [SECURITY.md](SECURITY.md), not in a public issue.

## Licensing

By submitting a contribution, you agree to license your original contribution under the project's [MIT License](LICENSE). Keep third-party copyright and license notices intact, and identify any externally sourced code or assets in your pull request. A project's code license does not automatically cover model weights, music or third-party dependencies.
