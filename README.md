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
