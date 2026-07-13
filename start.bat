@echo off
setlocal
cd /d "%~dp0"

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

echo Restarting Uno Family on http://localhost:5202
echo Other devices on the same network can use the host computer's LAN address with port 5202.
echo Local WiFi room server will listen on port 5203.
echo.
echo Freeing ports 5202 and 5203...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(5202, 5203); Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul

start "Uno Family Local WiFi Server" cmd /k "npm run wifi"
start "Uno Family Dev Server" cmd /k "npm run dev -- --host 0.0.0.0 --port 5202"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5202"

endlocal
