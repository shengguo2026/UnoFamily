# More Games Access Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Platinum “More games” home tile whose accessible password modal unlocks a mapped game without shipping or logging any real password in the browser bundle or repository.

**Architecture:** React owns only the modal state and submits a short-lived password to a dedicated HTTP endpoint on the existing local WiFi server. The server loads salted `scrypt` verifiers from an untracked environment variable, rate-limits attempts, compares derived keys in constant time, and returns a stable game ID only after success.

**Tech Stack:** React 19, TypeScript 6, CSS, Node.js HTTP and `node:crypto`, Vite 8, Node.js behavior tests.

## Global Constraints

- The tile appears immediately after “Guo's Exclusive Uno Passage”.
- The tile's visible title is exactly “More games”.
- Use Platinum `#E5E4E2` as the visual base.
- Do not commit, render, log, persist, or transmit over WebSocket any real password.
- Do not add a password-reveal control.
- Verify passwords only in the Node server.
- Failed attempts use one generic localized message and one indistinguishable HTTP response.
- Cancel clears the field, closes the modal, and leaves the user on the home screen.
- Successful verification clears the field and navigates directly to the mapped game's setup screen.

---

## File structure

- Create `src/components/MoreGamesUnlockModal.tsx`: accessible password form and focus behavior.
- Create `src/network/moreGames.ts`: HTTP client with no persistence or logging.
- Create `server/more-games-auth.mjs`: verifier parsing, `scrypt` comparison, and rate limiting.
- Create `scripts/create-more-game-verifier.mjs`: masked local verifier generator.
- Create `tests/moreGamesAccess.behavior.mjs`: server and source-level gate behavior.
- Modify `src/App.tsx`: tile ordering, modal state, unlock routing, and focus return.
- Modify `src/App.css`: Platinum tile and responsive modal styles.
- Modify `src/i18n.ts`: modal labels and generic errors in `en`, `zh`, and `de`.
- Modify `server/local-wifi-server.mjs`: CORS-validated unlock endpoint.
- Modify `package.json`: local verifier-generation and targeted test commands.
- Modify `.gitignore`: ignore optional local secret configuration files.
- Modify `README.md`: document verifier provisioning without showing a password.

### Task 1: Build and test the server-side verifier

**Files:**
- Create: `server/more-games-auth.mjs`
- Create: `tests/moreGamesAccess.behavior.mjs`

**Interfaces:**
- Produces: `parseMoreGameVerifiers(raw)`, `verifyMoreGamePassword(password, verifiers)`, and `createAttemptLimiter(options)`.
- Consumes: `UNO_MORE_GAMES_VERIFIERS` only through the caller; the module itself does not read global environment state.

- [ ] **Step 1: Write failing verifier tests**

In `tests/moreGamesAccess.behavior.mjs`, create a test-only verifier with
Node's `scryptSync` and a fixed test salt. Use the explicitly non-production
fixture string `test-only-more-game-secret`.

Assert:

```js
assert.deepEqual(parseMoreGameVerifiers(JSON.stringify({
  quatro: `${saltHex}:${derivedKeyHex}`,
})).map((entry) => entry.gameId), ['quatro'])

assert.equal(
  await verifyMoreGamePassword('test-only-more-game-secret', verifiers),
  'quatro',
)
assert.equal(await verifyMoreGamePassword('wrong-test-value', verifiers), null)
assert.equal(await verifyMoreGamePassword('', verifiers), null)
assert.deepEqual(parseMoreGameVerifiers('{broken'), [])
```

Also assert that an expired limiter window accepts a new attempt and that the
sixth request from one client inside a 60-second window is rejected when the
limit is five.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: FAIL because `server/more-games-auth.mjs` does not exist.

- [ ] **Step 3: Implement strict verifier parsing**

Implement:

```js
export function parseMoreGameVerifiers(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
    return Object.entries(parsed).flatMap(([gameId, verifier]) => {
      if (!/^[a-z][a-z0-9-]{1,31}$/.test(gameId) || typeof verifier !== 'string') return []
      const [saltHex, keyHex, extra] = verifier.split(':')
      if (extra || !/^[0-9a-f]{32,128}$/i.test(saltHex) || !/^[0-9a-f]{64}$/i.test(keyHex)) return []
      return [{ gameId, salt: Buffer.from(saltHex, 'hex'), key: Buffer.from(keyHex, 'hex') }]
    })
  } catch {
    return []
  }
}
```

Implement `verifyMoreGamePassword` with `scrypt(password, salt, 32, callback)`
and `timingSafeEqual`. Evaluate every configured verifier before returning so
the position of a matching game does not cause an early timing difference.
Reject non-string, empty, and over-256-character inputs.

- [ ] **Step 4: Implement bounded attempt limiting**

Implement:

```js
export function createAttemptLimiter({ maxAttempts = 5, windowMs = 60_000, now = Date.now } = {}) {
  const clients = new Map()
  return {
    allow(clientKey) {
      const timestamp = now()
      const active = (clients.get(clientKey) ?? []).filter((entry) => timestamp - entry < windowMs)
      if (active.length >= maxAttempts) {
        clients.set(clientKey, active)
        return false
      }
      active.push(timestamp)
      clients.set(clientKey, active)
      return true
    },
  }
}
```

Cap the map at 1,000 client keys by removing the oldest inactive entry when
the cap is reached.

- [ ] **Step 5: Run the verifier tests**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: PASS for parsing, constant-time verification behavior, malformed
configuration, input bounds, throttling, expiry, and map bounds.

- [ ] **Step 6: Commit**

```powershell
git add server/more-games-auth.mjs tests/moreGamesAccess.behavior.mjs
git commit -m "feat: add secure more-games verifier"
```

### Task 2: Add the local unlock endpoint

**Files:**
- Modify: `server/local-wifi-server.mjs`
- Modify: `tests/moreGamesAccess.behavior.mjs`

**Interfaces:**
- Consumes: `parseMoreGameVerifiers(process.env.UNO_MORE_GAMES_VERIFIERS)` and the attempt limiter.
- Produces: `POST /api/more-games/unlock` with `{ ok: true, gameId }` or `{ ok: false }`.

- [ ] **Step 1: Write failing HTTP and source-safety tests**

Start the server as a child process on a test port with a test-only verifier
environment. Send requests with an allowed local origin.

Assert:

- a correct test fixture receives HTTP `200` and `{ ok: true, gameId: 'quatro' }`;
- an incorrect, empty, malformed, missing-config, or throttled submission
  receives the same HTTP `401` and `{ ok: false }`;
- request bodies over 1 KiB are rejected as `{ ok: false }`;
- disallowed origins receive `{ ok: false }`;
- the server's stdout and stderr do not contain either submitted fixture;
- `server/local-wifi-server.mjs` contains no concrete verifier or password.

- [ ] **Step 2: Run the test and verify the endpoint fails**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: FAIL because the route returns `404`.

- [ ] **Step 3: Add origin validation and bounded JSON parsing**

Accept only origins whose hostname matches the request `Host` hostname and
whose port is `5202`, `4173`, or the explicit test origin port. Respond to an
allowed `OPTIONS` request with:

```http
Access-Control-Allow-Origin: <validated origin>
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

Read at most 1,024 bytes. Accept only
`application/json` with exactly one string `password` field. Do not print the
body in any success or error path.

- [ ] **Step 4: Add uniform verification responses**

At server startup:

```js
const moreGameVerifiers = parseMoreGameVerifiers(process.env.UNO_MORE_GAMES_VERIFIERS)
const moreGameAttemptLimiter = createAttemptLimiter()
```

For `POST /api/more-games/unlock`, use
`request.socket.remoteAddress ?? 'unknown'` as the limiter key. On any failed
validation, throttle, or comparison, wait until a shared minimum response
duration has elapsed and return:

```js
response.writeHead(401, responseHeaders(origin))
response.end(JSON.stringify({ ok: false }))
```

On success return only:

```js
response.writeHead(200, responseHeaders(origin))
response.end(JSON.stringify({ ok: true, gameId }))
```

- [ ] **Step 5: Run the endpoint tests**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: PASS without a submitted value appearing in captured logs.

- [ ] **Step 6: Commit**

```powershell
git add server/local-wifi-server.mjs tests/moreGamesAccess.behavior.mjs
git commit -m "feat: expose local more-games unlock endpoint"
```

### Task 3: Add the browser client and accessible modal

**Files:**
- Create: `src/network/moreGames.ts`
- Create: `src/components/MoreGamesUnlockModal.tsx`
- Modify: `src/i18n.ts`
- Modify: `tests/moreGamesAccess.behavior.mjs`

**Interfaces:**
- Produces: `unlockMoreGame(password, signal): Promise<MoreGameUnlockResult>`.
- Produces: `<MoreGamesUnlockModal language onCancel onUnlocked />`.
- Consumes: the host name already used by `src/network/localWifi.ts`.

- [ ] **Step 1: Write failing client and accessibility checks**

Require the new sources to contain:

```js
assert.match(modalSource, /type="password"/)
assert.match(modalSource, /autoComplete="new-password"/)
assert.match(modalSource, /aria-modal="true"/)
assert.match(modalSource, /role="dialog"/)
assert.doesNotMatch(modalSource, /showPassword|type="text"/)
assert.doesNotMatch(clientSource, /localStorage|sessionStorage|console\./)
```

Assert the translations include the modal title, password label, Cancel,
Confirm, pending state, and generic failure for `en`, `zh`, and `de`.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: FAIL because the component and client do not exist.

- [ ] **Step 3: Implement the short-lived HTTP client**

Define:

```ts
export type MoreGameUnlockResult =
  | { ok: true; gameId: string }
  | { ok: false }

export async function unlockMoreGame(
  password: string,
  signal?: AbortSignal,
): Promise<MoreGameUnlockResult>
```

Build the base URL from the current page protocol and hostname with port
`5203`, matching `getLocalWifiUrl()`. POST JSON, parse only the expected
response shape, and return `{ ok: false }` for a network error, timeout,
unexpected game ID, or malformed response. Do not retry a password
automatically.

- [ ] **Step 4: Implement the modal form**

Use local `password`, `pending`, and `failed` state. The password input must
include:

```tsx
<input
  ref={inputRef}
  type="password"
  autoComplete="new-password"
  spellCheck={false}
  value={password}
  onChange={(event) => setPassword(event.target.value)}
/>
```

Submit through a `<form>`. Copy the value only into the in-flight request,
immediately clear React state, and never restore a failed value. Abort the
request on unmount. Handle Escape through a document keydown listener.
Disable both repeated Confirm submissions and browser form resubmission while
pending. Show failures through an `aria-live="polite"` region.

- [ ] **Step 5: Run the client checks**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: PASS for password masking, no reveal control, localization,
non-persistence, and the expected API path.

- [ ] **Step 6: Commit**

```powershell
git add src/network/moreGames.ts src/components/MoreGamesUnlockModal.tsx src/i18n.ts tests/moreGamesAccess.behavior.mjs
git commit -m "feat: add more-games unlock modal"
```

### Task 4: Add the Platinum tile and unlock routing

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `tests/moreGamesAccess.behavior.mjs`

**Interfaces:**
- Consumes: `MoreGamesUnlockModal`.
- Produces: one `more-games-tile` after the final existing game tile.
- Produces: `selectUnlockedGame(gameId)` as the only success routing path.

- [ ] **Step 1: Write failing ordering and style checks**

Assert:

- the `games` array remains unchanged and “More games” is rendered
  immediately after the existing games mapping;
- the tile is enabled and has `data-testid="more-games-tile"`;
- the tile class contains `more-games-platinum`;
- the CSS includes `#e5e4e2`, a foreground contrast of at least 4.5:1, a
  `:focus-visible` rule, and `::-ms-reveal { display: none; }`;
- the success mapping accepts only the allowlisted stable ID `quatro`;
- Cancel does not call `selectGame`, `setConfig`, or `navigateToScreen`.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: FAIL because no tile or modal integration exists.

- [ ] **Step 3: Render the tile after the existing map**

Add a dedicated button immediately after the existing `{games.map(...)}` JSX
block:

```tsx
<button
  ref={moreGamesTileRef}
  className="game-tile ready more-games-platinum"
  data-testid="more-games-tile"
  type="button"
  onClick={() => setMoreGamesOpen(true)}
>
  <span>More games</span>
</button>
```

Do not add it to `playableGames`, game numbering, or the hidden game list.

- [ ] **Step 4: Integrate close and success behavior**

Render the modal only while the home screen is active. `closeMoreGames()`
must clear modal state and queue focus back to `moreGamesTileRef`. Map only
`quatro` to the future `GameVariant` value reserved by the UNO Quatro plan.
Until UNO Quatro is implemented, keep the mapping behind a typed feature
allowlist whose entry is added by the first task of the UNO Quatro plan; the
gate itself remains testable without showing a dead game.

- [ ] **Step 5: Add Platinum and password styles**

Use:

```css
.game-tile.more-games-platinum {
  border-color: #b9b7b4;
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.9), transparent 38%),
    linear-gradient(145deg, #f4f3f1, #e5e4e2 52%, #c8c6c3);
  color: #22272b;
}

.more-games-password::-ms-reveal,
.more-games-password::-ms-clear {
  display: none;
}
```

Add a visible dark outline for `:focus-visible` and ensure the modal remains
usable at `320×568`, `768×1024`, and `1280×720`.

- [ ] **Step 6: Run the access-gate test**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: PASS for order, enabled state, Platinum styling, focus, masking, and
allowlisted routing.

- [ ] **Step 7: Commit**

```powershell
git add src/App.tsx src/App.css tests/moreGamesAccess.behavior.mjs
git commit -m "feat: add Platinum more-games entry"
```

### Task 5: Add safe local verifier provisioning

**Files:**
- Create: `scripts/create-more-game-verifier.mjs`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `tests/moreGamesAccess.behavior.mjs`

**Interfaces:**
- Produces: `npm run secret:more-game -- --game quatro`.
- Produces: one `<salt-hex>:<derived-key-hex>` verifier without echoing or saving the password.

- [ ] **Step 1: Write failing script-safety checks**

Assert the script:

- requires `--game` to match the server's stable ID pattern;
- calls `randomBytes(16)` and `scrypt`;
- enables raw terminal input and handles Backspace, Enter, and Ctrl+C;
- never prints captured characters;
- prints only the game ID plus verifier assignment;
- contains no filesystem write call.

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node tests/moreGamesAccess.behavior.mjs
```

Expected: FAIL because the provisioning script is absent.

- [ ] **Step 3: Implement the masked terminal prompt**

Require `process.stdin.isTTY && process.stdout.isTTY`. Call
`process.stdin.setRawMode(true)`, collect characters without writing them,
handle `\u0003` as cancellation, remove the last Unicode code point on
Backspace, and finish on Enter. Always restore raw mode in `finally`.

Generate a 16-byte random salt and a 32-byte `scrypt` key, zero the temporary
password buffer where practical, and print:

```text
Set UNO_MORE_GAMES_VERIFIERS to a JSON object containing the generated entry for game "quatro".
```

Print the JSON entry on the next line. Do not print the entered password.

- [ ] **Step 4: Add scripts and documentation**

Add:

```json
"secret:more-game": "node scripts/create-more-game-verifier.mjs",
"test:more-games": "node tests/moreGamesAccess.behavior.mjs"
```

Document how to generate a verifier and set
`UNO_MORE_GAMES_VERIFIERS` before `npm run wifi`. State that the variable
contains a non-reversible verifier, not a plaintext password. Add
`.env.local`, `.uno-family-secrets.json`, and `more-games-secrets.*` to
`.gitignore` as defense in depth, while keeping the environment variable as
the supported runtime path.

- [ ] **Step 5: Run targeted checks**

Run:

```powershell
npm run test:more-games
npm run lint
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit**

```powershell
git add scripts/create-more-game-verifier.mjs package.json .gitignore README.md tests/moreGamesAccess.behavior.mjs
git commit -m "docs: add safe more-game verifier setup"
```

### Task 6: Verify the access gate end to end

**Files:**
- Verify: `src/App.tsx`
- Verify: `src/App.css`
- Verify: `src/components/MoreGamesUnlockModal.tsx`
- Verify: `src/network/moreGames.ts`
- Verify: `server/more-games-auth.mjs`
- Verify: `server/local-wifi-server.mjs`

**Interfaces:**
- Consumes: the completed access gate.
- Produces: automated and browser evidence for handoff.

- [ ] **Step 1: Scan for accidental secrets**

Run:

```powershell
rg -n -i "password|secret|verifier" src public server scripts tests docs README.md
```

Review every match. Expected: UI labels, generic test-only fixtures, and
verifier mechanics only; no real password, reversible secret, browser-side
comparison, or secret log.

- [ ] **Step 2: Run all behavior tests**

Run every `tests/*.behavior.mjs` file with Node and every
`tests/*.behavior.ts` file with `npx --yes tsx`, stopping on the first
nonzero exit.

- [ ] **Step 3: Run static and production checks**

Run:

```powershell
npm run lint
npm run build
```

Expected: both exit `0`.

- [ ] **Step 4: Perform browser checks**

With a test-only verifier configured, verify at desktop, portrait-tablet, and
phone sizes:

1. “More games” follows Passage and uses Platinum styling.
2. Focus enters the masked field.
3. No reveal affordance is available.
4. Enter submits and Escape cancels.
5. Cancel returns focus to the tile and does not change game setup.
6. Repeated failures stay generic and throttling does not disclose a game.
7. Success clears the field and enters the mapped setup.

- [ ] **Step 5: Review the final diff**

Run:

```powershell
git diff --check
git status --short
git diff --stat
git diff
```

Expected: the user's pre-existing `.gitignore` modification is preserved and
reviewed separately from the access-gate additions.
