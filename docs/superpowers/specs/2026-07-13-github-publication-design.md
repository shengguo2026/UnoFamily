# UnoFamily GitHub Publication Design

## Objective

Publish UnoFamily as a public source repository at
`https://github.com/shengguo2026/UnoFamily` with a clean project history,
cross-platform first-run launchers, clear local-development documentation, an
attribution-preserving open-source license, and a curated `UnoFamily.zip`
release download.

## Decisions

- Use Apache License 2.0.
- Add a `NOTICE` file that credits Guo Sheng and identifies
  `https://github.com/shengguo2026/UnoFamily` as the original project.
- Distribute one cross-platform ZIP instead of platform-specific binaries.
- Require Node.js and an internet connection for the first run.
- Install platform-specific npm dependencies automatically on the first run.
- Publish `UnoFamily.zip` as a GitHub Release asset, not as a Git-tracked file.
- Use `v0.1.0` as the initial public release version.
- Prepare changes on `agent/prepare-public-release`, validate them, push the
  branch, and open a pull request against `main` before creating the release.

## Repository Contents

The repository will track the application source, tests, public assets,
configuration, lockfile, launchers, user documentation, license, and notice.
Generated or machine-local content will remain untracked, including:

- `node_modules/`
- `dist/` and coverage output
- npm caches
- temporary test output and launcher logs
- environment files containing local configuration or secrets
- editor and operating-system metadata
- generated ZIP archives
- local agent metadata

The existing implementation notes and project documentation remain tracked
unless they contain secrets or machine-specific data discovered during the
publication audit.

## Launchers and First-Run Setup

`start.bat` remains the Windows entry point. `start.sh` remains the Linux and
terminal-based macOS entry point. A small `start.command` wrapper provides a
Finder-friendly macOS entry point.

Each launcher will:

1. Change to the project directory.
2. Verify that `node` and `npm` are available.
3. Report a clear installation message if Node.js is missing.
4. Run `npm ci` when the local Vite executable is absent.
5. Free ports 5202 and 5203.
6. Start the local WiFi room server on port 5203.
7. Start Vite on `0.0.0.0:5202`.
8. Open `http://localhost:5202` in the default browser.

The ZIP will not contain `node_modules`, because npm dependencies can contain
operating-system- and CPU-specific binaries. Installing them on the user's
machine makes the same ZIP usable on supported Windows, macOS, and Linux
systems.

## README

The template README will be replaced with project-specific documentation that
covers:

- what UnoFamily is and its local multiplayer purpose
- the Node.js prerequisite and first-run internet requirement
- the release-ZIP workflow for non-developers
- Windows, macOS, and Linux launcher instructions
- cloning, `npm ci`, development, build, lint, and preview commands
- ports 5202 and 5203, LAN access, and firewall considerations
- how to stop and restart the local services
- common troubleshooting steps
- Apache 2.0 licensing and repository attribution
- an unofficial fan-project and third-party trademark disclaimer

The release download link will use GitHub's stable latest-release asset URL so
future releases do not require README changes.

## Release ZIP

`UnoFamily.zip` will be regenerated from an explicit allowlist. It will contain
only what is needed to install and run the project plus the user-facing legal
files. It will exclude Git metadata, caches, dependencies, build output,
temporary files, tests, internal planning documents, and the archive itself.

The archive root will be `UnoFamily/`. Both Unix launchers will be stored with
LF line endings. Executable permissions will be preserved where the ZIP format
and extraction tool support them; the README will include `chmod +x` fallback
instructions for macOS and Linux.

## Git and GitHub Publication

The workspace currently contains an empty `.git` directory rather than a valid
local repository. Publication will initialize that directory, add the GitHub
remote, fetch `origin/main`, and base `agent/prepare-public-release` on the
existing remote history without replacing local project files.

Only reviewed project files will be staged. The branch will be pushed through
the authenticated GitHub CLI/Git credential flow, and a pull request will be
opened against `main`. After the pull request is merged, release `v0.1.0` will
be created from `main` and `UnoFamily.zip` will be uploaded as its asset.

## Error Handling

- Missing Node.js or npm: stop before changing ports and display an actionable
  installation message.
- Failed `npm ci`: stop and preserve the npm error output.
- Occupied ports: terminate the previous local UnoFamily listeners when the
  platform provides `lsof`, `fuser`, or PowerShell networking commands.
- Browser opener unavailable: keep the servers running and print the URL.
- Git or GitHub authentication failure: stop before committing, pushing, or
  releasing and report the exact failed step.
- Archive validation failure: do not upload the ZIP.

## Validation

Before publication:

1. Scan tracked candidates for secrets, caches, generated output, and oversized
   files.
2. Run launcher syntax and mocked first-run behavior checks.
3. Run `npm ci` in a clean temporary copy or equivalent clean-install check.
4. Run the repository's lint, audio-asset, TypeScript, and Vite build checks.
5. Run the available behavior tests using their established project command.
6. Inspect the ZIP manifest and confirm required files are present and excluded
   paths are absent.
7. Extract the ZIP into a temporary directory and repeat the relevant syntax,
   install, and build checks.
8. Review the complete staged diff before committing and the remote branch
   state after pushing.

## Non-Goals

- Bundling Node.js runtimes or producing native installers
- Signing macOS, Windows, or Linux applications
- Hosting a public production game server
- Granting rights to third-party trademarks, names, or assets
