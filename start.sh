#!/usr/bin/env bash

set -u

cd -- "$(dirname -- "$0")"

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

echo "Restarting Uno Family on http://localhost:5202"
echo "Other devices on the same network can use the host computer's LAN address with port 5202."
echo "Local WiFi room server will listen on port 5203."
echo
echo "Freeing ports 5202 and 5203..."

free_port() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pids="$(fuser "$port/tcp" 2>/dev/null || true)"
  fi

  if [[ -n "$pids" ]]; then
    kill -9 $pids 2>/dev/null || true
  fi
}

free_port 5202
free_port 5203
sleep 1

npm run wifi &
wifi_pid=$!

npm run dev -- --host 0.0.0.0 --port 5202 &
dev_pid=$!

cleanup() {
  kill "$wifi_pid" "$dev_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 3
if command -v open >/dev/null 2>&1; then
  open "http://localhost:5202"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:5202" >/dev/null 2>&1 &
else
  echo "Open http://localhost:5202 in your browser."
fi

wait "$wifi_pid" "$dev_pid"
