# UnoFamily GitHub Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare, validate, and publish UnoFamily as an attributed public source repository with cross-platform first-run launchers and a clean `UnoFamily.zip` release asset.

**Architecture:** The Git repository is the source of truth. Launchers install locked, platform-specific npm dependencies on first run, while `.gitattributes` controls line endings and produces a curated ZIP through `git archive`. Publication uses a feature branch and pull request before the `v0.1.0` release is created from `main`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Node.js `^20.19.0 || >=22.12.0`, npm, Bash, Windows Batch, Git, GitHub CLI.

## Global Constraints

- License the project under Apache License 2.0.
- Attribute Guo Sheng and `https://github.com/shengguo2026/UnoFamily` in `NOTICE`.
- Keep `UnoFamily.zip`, dependencies, caches, logs, secrets, and build output out of Git.
- The one release ZIP must support Windows, macOS, and Linux through automatic first-run `npm ci`.
- Node.js and first-run internet access remain explicit prerequisites.
- Use ports 5202 for Vite and 5203 for the local WiFi room server.
- Publish through `agent/prepare-public-release` and a pull request into `main`.
- Use `v0.1.0` as the first public release.

---

### Task 1: Add release-readiness tests and repository metadata

**Files:**
- Create: `tests/releaseReadiness.behavior.mjs`
- Create: `.gitattributes`
- Modify: `.gitignore`
- Create: `LICENSE`
- Create: `NOTICE`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the existing root-level project layout.
- Produces: repository metadata that later launcher, README, archive, and publication tasks rely on.

- [ ] **Step 1: Write the failing readiness test**

Create `tests/releaseReadiness.behavior.mjs`:

```js
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('repository metadata is ready for public distribution', () => {
  for (const path of ['.gitattributes', 'LICENSE', 'NOTICE']) {
    assert.equal(existsSync(new URL(path, root)), true, `${path} must exist`)
  }

  const ignore = read('.gitignore')
  for (const pattern of ['.npm-cache/', '.tmp-tests/', '.env.*', '*.zip', '.agents/']) {
    assert.match(ignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  const attributes = read('.gitattributes')
  assert.match(attributes, /\*\.sh text eol=lf/)
  assert.match(attributes, /\*\.command text eol=lf/)
  assert.match(attributes, /tests\/ export-ignore/)

  assert.match(read('LICENSE'), /Apache License\s+Version 2\.0/)
  const notice = read('NOTICE')
  assert.match(notice, /Copyright 2026 Guo Sheng/)
  assert.match(notice, /https:\/\/github\.com\/shengguo2026\/UnoFamily/)

  const packageJson = JSON.parse(read('package.json'))
  assert.equal(packageJson.version, '0.1.0')
})

test('launchers provide automatic first-run setup', () => {
  assert.equal(existsSync(new URL('start.command', root)), true)
  for (const path of ['start.bat', 'start.sh']) {
    const launcher = read(path)
    assert.match(launcher, /npm ci/)
    assert.match(launcher, /node_modules/)
    assert.match(launcher, /5202/)
    assert.match(launcher, /5203/)
  }
  assert.match(read('start.command'), /start\.sh/)
})

test('README documents release and source workflows', () => {
  const readme = read('README.md')
  for (const text of [
    'UnoFamily',
    'Download and run',
    'Node.js',
    'start.bat',
    'start.command',
    'start.sh',
    'npm ci',
    'npm run build',
    '5202',
    '5203',
    'Apache License 2.0',
  ]) {
    assert.match(readme, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
  }
})
```

- [ ] **Step 2: Verify the test fails for the missing publication metadata**

Run:

```powershell
node --test --test-name-pattern="repository metadata" tests/releaseReadiness.behavior.mjs
```

Expected: FAIL because `.gitattributes`, `LICENSE`, and `NOTICE` do not exist and the package version is still `0.0.0`.

- [ ] **Step 3: Add ignore and archive rules**

Append these machine-local rules to `.gitignore`:

```gitignore
# Local caches, generated output, and secrets
.npm-cache/
.tmp-tests/
.tmp-*
coverage/
.env
.env.*
!.env.example
*.zip
.agents/
```

Create `.gitattributes`:

```gitattributes
* text=auto
*.bat text eol=crlf
*.sh text eol=lf
*.command text eol=lf

/.gitattributes export-ignore
/.gitignore export-ignore
/.agents/ export-ignore
/tests/ export-ignore
/docs/superpowers/ export-ignore
/animation_plan.md export-ignore
/current_implementation_slices.md export-ignore
/sound_music_plan.md export-ignore
```

- [ ] **Step 4: Add the legal files and release version**

Create `LICENSE` with the unmodified official Apache License 2.0 text from
`https://www.apache.org/licenses/LICENSE-2.0.txt`.

Create `NOTICE` exactly as:

```text
UnoFamily
Copyright 2026 Guo Sheng

Originally developed at:
https://github.com/shengguo2026/UnoFamily
```

Set the package and lockfile root versions to `0.1.0`:

```powershell
npm version 0.1.0 --no-git-tag-version
```

- [ ] **Step 5: Verify the metadata test passes**

Run:

```powershell
node --test --test-name-pattern="repository metadata" tests/releaseReadiness.behavior.mjs
```

Expected: PASS with one matching test and no failures.

---

### Task 2: Add automatic first-run launcher setup

**Files:**
- Modify: `start.bat`
- Modify: `start.sh`
- Create: `start.command`
- Test: `tests/releaseReadiness.behavior.mjs`

**Interfaces:**
- Consumes: `package-lock.json`, npm scripts `wifi` and `dev`, Node.js `^20.19.0 || >=22.12.0`.
- Produces: clickable or terminal launchers that install dependencies when `node_modules/.bin/vite` is absent.

- [ ] **Step 1: Verify the launcher readiness test fails**

Run:

```powershell
node --test --test-name-pattern="launchers" tests/releaseReadiness.behavior.mjs
```

Expected: FAIL because `start.command` is missing and the current launchers do not run `npm ci`.

- [ ] **Step 2: Add the Windows prerequisite and install gate**

Immediately after `cd /d "%~dp0"` in `start.bat`, add:

```bat
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node.js 20.19 or newer from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm is required but was not found in PATH. Reinstall Node.js and run this file again.
  pause
  exit /b 1
)

node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22 ? 0 : 1)"
if errorlevel 1 (
  echo UnoFamily requires Node.js 20.19 or newer, or Node.js 22.12 or newer.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Installing UnoFamily dependencies for this computer...
  call npm ci
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and the npm error above.
    pause
    exit /b 1
  )
)
```

Retain the existing port cleanup, service startup, and browser-opening commands.

- [ ] **Step 3: Add the Unix prerequisite and install gate**

Immediately after the project-directory `cd` in `start.sh`, add:

```bash
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node.js 20.19 or newer from https://nodejs.org/ and run this file again."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH. Reinstall Node.js and run this file again."
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22 ? 0 : 1)'; then
  echo "UnoFamily requires Node.js 20.19 or newer, or Node.js 22.12 or newer."
  exit 1
fi

if [[ ! -x node_modules/.bin/vite ]]; then
  echo "Installing UnoFamily dependencies for this computer..."
  if ! npm ci; then
    echo "Dependency installation failed. Check your internet connection and the npm error above."
    exit 1
  fi
fi
```

Retain the existing port cleanup, service lifecycle, and browser-opening behavior.

- [ ] **Step 4: Add the macOS Finder wrapper**

Create `start.command`:

```bash
#!/usr/bin/env bash

cd -- "$(dirname -- "$0")"
exec ./start.sh
```

Mark both Unix launchers executable in the working tree. After Git is initialized, record their executable bits in the index with:

```powershell
git update-index --chmod=+x start.sh start.command
```

- [ ] **Step 5: Verify launcher content and Bash syntax**

Run:

```powershell
node --test --test-name-pattern="launchers" tests/releaseReadiness.behavior.mjs
& 'C:\Program Files\Git\bin\bash.exe' -n start.sh
& 'C:\Program Files\Git\bin\bash.exe' -n start.command
```

Expected: the launcher readiness test and both Bash syntax checks pass.

---

### Task 3: Replace the template README

**Files:**
- Modify: `README.md`
- Test: `tests/releaseReadiness.behavior.mjs`

**Interfaces:**
- Consumes: release asset name `UnoFamily.zip`, launchers, npm scripts, ports, Node requirement, legal files.
- Produces: the public landing page and complete local-use instructions.

- [ ] **Step 1: Verify the README readiness test fails**

Run:

```powershell
node --test --test-name-pattern="README" tests/releaseReadiness.behavior.mjs
```

Expected: FAIL because the current README is the Vite template.

- [ ] **Step 2: Write the project README**

Replace `README.md` with this complete content:

```markdown
# UnoFamily

UnoFamily is a browser-based family card-game collection for local play. It
includes a local-WiFi room server so players on the same network can join from
their own devices.

> UnoFamily is an unofficial fan project. It is not affiliated with or endorsed
> by Mattel or any other referenced trademark owner.

## Download and run

The release ZIP is the quickest way to start. You do not need to build the
project manually.

1. Install a supported version of [Node.js](https://nodejs.org/).
2. Download [UnoFamily.zip](https://github.com/shengguo2026/UnoFamily/releases/latest/download/UnoFamily.zip).
3. Extract the ZIP to a normal local folder.
4. Start the game using the instructions for your operating system below.

The first run needs an internet connection and automatically installs the npm
packages required for your operating system. Later runs reuse those packages.

### Windows

Double-click `start.bat`. Keep the two service windows open while playing.

### macOS

Double-click `start.command`. If macOS blocks the downloaded script, right-click
it and choose **Open**. If it reports a permissions error, open Terminal in the
extracted folder and run:

```bash
chmod +x start.command start.sh
./start.command
```

### Linux

Open a terminal in the extracted folder and run:

```bash
chmod +x start.sh
./start.sh
```

Some desktop environments also let you mark `start.sh` as executable in the
file properties and launch it from the file manager.

## Prerequisites

- Node.js `20.19+` or `22.12+`
- npm, which is included with Node.js
- Internet access during the first run
- A modern web browser

## Build from source

Clone the repository and install the locked dependencies:

```bash
git clone https://github.com/shengguo2026/UnoFamily.git
cd UnoFamily
npm ci
```

You can then use `start.bat`, `start.command`, or `start.sh`, or start the two
services manually in separate terminals:

```bash
npm run wifi
```

```bash
npm run dev -- --host 0.0.0.0 --port 5202
```

Open <http://localhost:5202> after both services start.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run wifi` | Start the local-WiFi room server. |
| `npm run build` | Type-check and create a production build in `dist/`. |
| `npm run lint` | Run ESLint. |
| `npm run preview` | Preview the production build locally. |

## Local network play

- The browser game listens on port `5202`.
- The local-WiFi room server listens on port `5203`.
- Other devices on the same network can open
  `http://HOST_COMPUTER_LAN_ADDRESS:5202`.
- Your operating system or security software may ask for firewall permission.
  Allow private/local-network access if you want other devices to connect.

Do not expose these development services directly to the public internet.

## Stopping and restarting

On Windows, close the two service windows. On macOS and Linux, return to the
launcher terminal and press `Ctrl+C`. Running a launcher again clears previous
UnoFamily listeners from ports `5202` and `5203` before restarting them.

## Troubleshooting

### Node.js or npm was not found

Install or update Node.js, close all terminal windows, and run the launcher
again so the updated `PATH` is loaded.

### Dependency installation failed

Check the internet connection, delete the incomplete `node_modules` folder, and
run the launcher again. You can also run `npm ci` in a terminal to see the full
error.

### The browser did not open

Leave the services running and open <http://localhost:5202> manually.

### A port is still occupied

Close previous UnoFamily terminals or other programs using ports `5202` and
`5203`, then run the launcher again.

### Other devices cannot connect

Confirm that all devices are on the same local network, use the host computer's
LAN address rather than `localhost`, and allow ports `5202` and `5203` through
the host firewall on private networks.

## License and attribution

UnoFamily is licensed under the [Apache License 2.0](LICENSE). When
redistributing the project or a derivative work, retain the attribution in
[NOTICE](NOTICE).

Original project: <https://github.com/shengguo2026/UnoFamily>

## Disclaimer

UnoFamily is an unofficial fan project. It is not affiliated with, sponsored
by, or endorsed by Mattel or any other referenced company or trademark owner.
All trademarks and product names belong to their respective owners.
```

- [ ] **Step 3: Verify the README test passes**

Run:

```powershell
node --test --test-name-pattern="README" tests/releaseReadiness.behavior.mjs
```

Expected: PASS with one matching test and no failures.

---

### Task 4: Resolve the pre-existing lint baseline

**Files:**
- Modify: `eslint.config.js`
- Modify: `src/App.tsx`
- Modify: `src/components/GameCanvas.tsx`
- Modify: `src/game/classic.ts`

**Interfaces:**
- Consumes: the existing test-helper exports, screen navigation behavior, and animation callback contract.
- Produces: a clean `npm run lint` baseline without removing test APIs or changing gameplay.

- [ ] **Step 1: Preserve the failing lint baseline**

Run `npm run lint` and confirm the existing result: 29 errors and one warning in the four files above.

- [ ] **Step 2: Configure the Fast Refresh rule for intentional test exports**

Add a file-specific ESLint override for `src/components/GameCanvas.tsx`. Keep the rule enabled and set `allowConstantExport: true` plus an explicit `allowExportNames` array containing every exported function whose name ends in `ForTest`.

- [ ] **Step 3: Correct hook state and dependency flow**

In `App.tsx`, replace the effect that clears `animationLockReason` after navigation with a stable `navigateToScreen(nextScreen)` callback. The callback clears the lock before navigating to `home` or `setup`, and all existing `setScreen(...)` call sites use it.

In the canvas render effect, include `onBlockingAnimationChange` in the dependency list because the effect invokes that prop.

- [ ] **Step 4: Apply mechanical const corrections**

Change only the ten `let` declarations reported by `prefer-const` in `src/game/classic.ts` to `const`.

- [ ] **Step 5: Verify lint and behavior**

Run `npm run lint`, `npm run build`, and all established behavior scripts. Expected: lint has zero errors and warnings, the build exits 0, and every behavior script exits 0.

---

### Task 5: Initialize and align the local Git repository

**Files:**
- Modify: `.git/` metadata only

**Interfaces:**
- Consumes: remote `shengguo2026/UnoFamily`, default branch `main`, authenticated account `shengguo2026` with `ADMIN` permission.
- Produces: local branch `agent/prepare-public-release` based on `origin/main` without overwriting workspace files.

- [ ] **Step 1: Initialize and fetch the existing remote history**

Run:

```powershell
git init -b main
git remote add origin https://github.com/shengguo2026/UnoFamily.git
git fetch origin main
git reset --mixed origin/main
git switch -c agent/prepare-public-release
```

Expected: remote `main` remains the ancestry base; the local project appears as intended modifications and untracked files. The mixed reset must not alter working-tree file contents.

- [ ] **Step 2: Inspect scope before staging**

Run:

```powershell
git status -sb --untracked-files=all
git diff -- README.md
```

Expected: generated dependencies, caches, logs, `dist`, `.agents`, and `UnoFamily.zip` are absent from the candidate list.

- [ ] **Step 3: Stage only intended source and documentation**

Run explicit-path staging:

```powershell
git add -- .gitattributes .gitignore LICENSE NOTICE README.md package.json package-lock.json eslint.config.js favicon.svg index.html start.bat start.sh start.command tsconfig.app.json tsconfig.json tsconfig.node.json vite.config.ts public scripts server src tests docs animation_plan.md current_implementation_slices.md Game_rules_Guo_exclusive_variants.md GameRules.txt sound_music_plan.md
git update-index --chmod=+x start.sh start.command
```

Expected: `git status --short` contains only intended project files.

---

### Task 6: Validate the complete publication candidate

**Files:**
- Verify: all staged files

**Interfaces:**
- Consumes: the staged publication candidate.
- Produces: fresh evidence that the project and release inputs are safe and buildable.

- [ ] **Step 1: Run readiness, lint, and build checks**

Run:

```powershell
node --test tests/releaseReadiness.behavior.mjs
npm run lint
npm run build
```

Expected: all commands exit 0 with no test, lint, TypeScript, audio-asset, or Vite build failures.

- [ ] **Step 2: Run all established behavior scripts**

Run each `tests/*.behavior.mjs` and `tests/*.behavior.ts` file with Node, stopping on the first nonzero exit:

```powershell
$tests = Get-ChildItem -LiteralPath tests -File | Where-Object { $_.Name -match '\.behavior\.(mjs|ts)$' } | Sort-Object Name
foreach ($test in $tests) {
  node $test.FullName
  if ($LASTEXITCODE -ne 0) { throw "Behavior test failed: $($test.Name)" }
}
```

Expected: every behavior script exits 0.

- [ ] **Step 3: Scan staged files for secrets and large objects**

Run:

```powershell
git diff --cached --check
git grep --cached -n -I -E 'AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
```

Expected: whitespace check exits 0; secret scan returns no matches. Also inspect staged blob sizes and confirm no individual file approaches GitHub's 100 MB hard limit.

- [ ] **Step 4: Review the exact staged diff**

Run:

```powershell
git status -sb
git diff --cached --stat
git diff --cached
```

Expected: the diff matches the approved design and contains no generated or private content.

---

### Task 7: Commit and build the curated ZIP

**Files:**
- Create but do not track: `UnoFamily.zip`

**Interfaces:**
- Consumes: validated staged source and `.gitattributes` export rules.
- Produces: one commit and a clean release archive rooted at `UnoFamily/`.

- [ ] **Step 1: Commit the publication candidate**

Run:

```powershell
git commit -m "Prepare UnoFamily public release"
```

Expected: one commit on `agent/prepare-public-release`.

- [ ] **Step 2: Generate the archive from the committed tree**

Run:

```powershell
git archive --format=zip --prefix=UnoFamily/ -o UnoFamily.zip HEAD
```

Expected: `UnoFamily.zip` is created but remains ignored and untracked.

- [ ] **Step 3: Validate the ZIP manifest and extracted package**

Confirm required paths are present and forbidden paths are absent:

```powershell
$entries = @(tar -tf UnoFamily.zip)
$required = @('UnoFamily/start.bat','UnoFamily/start.sh','UnoFamily/start.command','UnoFamily/package.json','UnoFamily/package-lock.json','UnoFamily/LICENSE','UnoFamily/NOTICE','UnoFamily/src/','UnoFamily/server/')
$forbidden = @('UnoFamily/.git/','UnoFamily/node_modules/','UnoFamily/dist/','UnoFamily/.npm-cache/','UnoFamily/.tmp-tests/','UnoFamily/tests/','UnoFamily/docs/superpowers/')
```

Fail if a required prefix is missing or a forbidden prefix exists. Extract into a verified directory under `C:\tmp`, run both Bash syntax checks there, run `npm ci`, and run `npm run build`.

Expected: manifest checks, clean install, and build all pass.

---

### Task 8: Push the branch and open the publication pull request

**Files:**
- No local source changes

**Interfaces:**
- Consumes: validated commit, authenticated GitHub CLI, repository `shengguo2026/UnoFamily`.
- Produces: remote branch and draft pull request targeting `main`.

- [ ] **Step 1: Recheck authentication and branch state**

Run:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' auth status --active --hostname github.com
git status -sb
git log -1 --oneline
```

Expected: authenticated as `shengguo2026`, branch is clean except for ignored `UnoFamily.zip`, and HEAD is the validated commit.

- [ ] **Step 2: Push with upstream tracking**

Run:

```powershell
git push -u origin agent/prepare-public-release
```

Expected: push succeeds and the local branch tracks `origin/agent/prepare-public-release`.

- [ ] **Step 3: Open a draft pull request**

Create `C:\tmp\UnoFamily-pr-body.md` with this exact content:

```markdown
## What changed

- publish the complete UnoFamily source, tests, and project documentation
- add automatic first-run dependency installation to the Windows, macOS, and Linux launchers
- replace the template README with download, build, run, networking, and troubleshooting instructions
- add Apache License 2.0 and repository attribution through NOTICE
- configure a curated cross-platform release ZIP produced from the committed tree

## Why

This prepares UnoFamily for its initial public release while keeping generated dependencies, caches, temporary files, and release archives out of Git history.

## Validation

- release-readiness behavior checks
- complete behavior-test suite
- ESLint
- TypeScript, audio-asset, and Vite production build
- clean ZIP manifest, npm install, and build validation
```

Run:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' pr create --repo shengguo2026/UnoFamily --base main --head agent/prepare-public-release --draft --title "Prepare UnoFamily public release" --body-file C:\tmp\UnoFamily-pr-body.md
```

Expected: GitHub returns the new pull-request URL.

- [ ] **Step 4: Verify the remote result**

Run:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' pr view --repo shengguo2026/UnoFamily --json url,state,isDraft,baseRefName,headRefName,commits
```

Expected: the PR is open and draft, targets `main`, and contains the validated commit.

---

### Task 9: Create the release after merge

**Files:**
- Upload: `UnoFamily.zip`

**Interfaces:**
- Consumes: merged pull request, remote `main`, validated ZIP rebuilt from the merge commit.
- Produces: GitHub release `v0.1.0` with the `UnoFamily.zip` asset.

- [ ] **Step 1: Confirm the pull request is merged**

Run:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' pr view --repo shengguo2026/UnoFamily --json state,mergedAt,mergeCommit,url
```

Expected: state is `MERGED`. Stop if it is not merged.

- [ ] **Step 2: Rebuild the ZIP from remote main**

Fetch `origin/main`, archive the exact merge commit with the same prefix, and repeat the Task 6 manifest and extracted-package validations.

- [ ] **Step 3: Publish release `v0.1.0`**

Run:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' release create v0.1.0 UnoFamily.zip --repo shengguo2026/UnoFamily --target main --title "UnoFamily v0.1.0" --notes "Initial public release of UnoFamily with automatic first-run setup for Windows, macOS, and Linux. Node.js 20.19+ or 22.12+ is required."
```

Expected: the release URL is returned and its asset is named exactly `UnoFamily.zip`.

- [ ] **Step 4: Verify the stable download URL**

Verify that this URL resolves to the uploaded asset:

```text
https://github.com/shengguo2026/UnoFamily/releases/latest/download/UnoFamily.zip
```

Expected: HTTP success and the downloaded file hash matches the validated local archive.
