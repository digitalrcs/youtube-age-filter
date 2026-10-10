# YouTube Age Filter

[![CI](https://github.com/digitalrcs/youtube-age-filter/actions/workflows/ci.yml/badge.svg)](https://github.com/digitalrcs/youtube-age-filter/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/digitalrcs/youtube-age-filter)](https://github.com/digitalrcs/youtube-age-filter/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Keep desktop YouTube focused on recent videos. Set a maximum video age, hide Shorts, and keep selected channels exempt from the age limit.

**[Download the latest release](https://github.com/digitalrcs/youtube-age-filter/releases/latest)** · **[Troubleshooting](docs/TROUBLESHOOTING.md)** · **[Report a bug](https://github.com/digitalrcs/youtube-age-filter/issues/new?template=bug_report.yml)**

## Features

- Configurable maximum video age, in days.
- Shorts filtering for supported cards, shelves, and navigation links.
- Pause and resume without losing your settings.
- Channel exceptions with add and delete controls in the popup.
- Automatic rechecks when supported video cards load or their metadata changes.
- Optional diagnostic labels for troubleshooting.
- Manifest V3, local settings, and no analytics or external services.

## Browser support

Designed for desktop Chrome, Brave, and Microsoft Edge on `www.youtube.com`. Brave has been used for live compatibility checks during development. Chrome and Edge share the required Chromium extension APIs but may differ in UI and YouTube experiments. Firefox, Safari, mobile browsers, and the YouTube mobile app are not supported by this package.

The extension is distributed as an **unpacked extension** through GitHub Releases. It is not currently published in the Chrome Web Store or Edge Add-ons store. Managed browsers may prohibit unpacked extensions.

## Installation

1. Open [Releases](https://github.com/digitalrcs/youtube-age-filter/releases/latest) and download the versioned `youtube-age-filter-v*.zip` asset. Choose the install asset rather than GitHub's automatically generated source archives.
2. Extract the ZIP into a permanent folder. Keep that folder after installation; the browser loads the extension from it.
3. Open your browser's extension manager:

   | Browser | Address |
   | --- | --- |
   | Chrome | `chrome://extensions` |
   | Brave | `brave://extensions` |
   | Edge | `edge://extensions` |

4. Enable **Developer mode**, then select **Load unpacked**.
5. Select the extracted folder containing `manifest.json`.
6. Open or refresh YouTube. Pin the extension from the browser's Extensions menu for quick access to settings.

No build tools, account registration, or API keys are needed to install a release.

### Updating

Download and extract the new release. Replace the runtime files in the **same installed folder**, select **Reload** in your browser's extension manager, and refresh open YouTube tabs. The same folder preserves the unpacked extension identity and local preferences. Uninstalling and reinstalling may remove your settings.

### Verifying the download

Each release includes `SHA256SUMS.txt`. Compare its value with your downloaded ZIP:

```powershell
Get-FileHash .\youtube-age-filter-v1.6.0.zip -Algorithm SHA256
```

On macOS, use `shasum -a 256`; on Linux, use `sha256sum`.

## Usage

The control bar appears at the bottom-left of YouTube pages.

| Control | Behavior |
| --- | --- |
| Days + Apply | Set the maximum video age. Default: 30 days. |
| Pause / Start | Restore extension-hidden content or resume filtering. The pause state persists. |
| Hide Shorts | Toggle Shorts filtering. Enabled by default. |
| Whitelist | Add or remove the current channel's age exception on a channel or video page. |
| Rescan | Recheck the page using the current settings. |
| Hidden | Count of marked hidden elements; nested cards and shelves may both count. |

Use the extension popup to change settings, edit channel exceptions, and enable **Show debug overlay**. Select **Save settings** after changing the age limit or checkboxes. Channel additions and deletions are saved immediately.

### Channel exceptions

Open a channel or video page and select **Add current channel** in the popup. Alternatively, enter an `@handle`, YouTube channel URL, channel ID, or exact display name. Select the delete control beside an entry to remove it.

**Channel exceptions override the age limit.** An older video from an exempt channel can appear even with a two-day limit. Shorts filtering remains independent and can still hide Shorts from that channel.

Handles are recommended. Channel IDs and handles are not automatically resolved to one another. Display-name matches are less reliable because names are not unique and are absent from some card layouts.

## How filtering works

The extension reads publication metadata already rendered on YouTube's page. It supports English full and abbreviated labels, including `7 months ago`, `5d ago`, `2w ago`, and `1mo ago`. A video is hidden when its detected age is **greater than** the selected limit; a video labeled two days old remains visible with a two-day setting.

YouTube's labels are rounded. Weeks count as seven days, months as 30 days, and years as 365 days. The extension does not retrieve exact upload timestamps. Cards with missing or unrecognized dates remain visible.

Detection covers supported cards on Home, search, channel pages, watch recommendations, and playlists where publication metadata is available. YouTube changes its layouts regularly, so some experiments or surfaces may require updates. This is a display filter: it does not block direct video URLs, modify recommendations on YouTube's servers, or act as an access-control tool.

## Privacy and permissions

Settings stay in the browser's local extension storage. No telemetry, browsing history collection, or external requests are implemented by the extension. Access is limited to local storage and desktop YouTube pages. See the [Privacy Policy](PRIVACY.md) for details.

## Development

Node.js 22 or later is required for development only.

```sh
npm ci
npm run check
```

On Windows, `npm run package` creates an install ZIP and checksum in `dist/`. Tests use representative DOM fixtures for date parsing, channel exceptions, Shorts, dynamic metadata, and pause/resume. GitHub Actions runs checks on pushes and pull requests and publishes release assets for version tags.

See [Contributing](CONTRIBUTING.md), [Changelog](CHANGELOG.md), and [Security](SECURITY.md). User documentation is maintained in this repository alongside the code, rather than in a separate wiki.

## License

[MIT](LICENSE). An independent project, not affiliated with or endorsed by YouTube or Google.
