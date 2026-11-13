## Get Open Play’s source

Open Play is an independent DJ project for local music. You can contribute code, documentation, accessibility improvements and clear bug reports. Its [GitHub repository](https://github.com/jpoindexter/open-play) is public, and original project code is available under the [MIT License](https://github.com/jpoindexter/open-play/blob/main/LICENSE). Third-party code keeps its own notices; optional runtimes and model weights can have different terms.

Use the [README quickstart](https://github.com/jpoindexter/open-play#run-locally) to run the browser workspace. The committed UI bundle is included, so basic exploration does not require an npm build. The server command has been checked on macOS. Desktop packaging and optional processing runtimes are separate setup paths.

The separate [Mac preview installer](/installation/) is an early evaluation prerelease. Current audio, device and release limitations remain in [Beta status and limitations](/known-issues/).

## Fork and make a focused improvement

1. Sign in to GitHub and fork the repository to your account.
2. Clone your fork and create a branch for one change.
3. Read [CONTRIBUTING.md](https://github.com/jpoindexter/open-play/blob/main/CONTRIBUTING.md) before changing audio backends, controls or layouts.
4. Reproduce the specific issue, make the smallest complete fix and run the directly affected check.
5. Open a pull request into the upstream **main** branch. Describe the problem, resulting behavior, verification and anything untested.

Contributions can be code, documentation, accessibility improvements or clear bug reports. Preserve the existing controls, layouts and library waveform previews. Do not combine a small fix with an unrelated refactor or dependency sweep.

## Report a bug or propose an idea

Use [Issues](https://github.com/jpoindexter/open-play/issues/new/choose) for bugs and feature suggestions; a GitHub account is required to submit one. Check for an existing report first. For a playback problem, include the version, audio setup, deck state and the action that triggered it. Describe what you heard separately from what you saw or measured. The [reporting checklist](/known-issues/#report-a-problem) explains useful details.

Do not upload songs, full mixes, private library backups, credentials or other people’s information. Review screenshots and logs for private names and paths. Generated demo audio is usually sufficient for a reproduction.

## Security reports

Report vulnerabilities through [GitHub’s private vulnerability reporting](https://github.com/jpoindexter/open-play/security/advisories/new), rather than a public issue. Follow [SECURITY.md](https://github.com/jpoindexter/open-play/blob/main/SECURITY.md) for the supported scope and useful report details.
