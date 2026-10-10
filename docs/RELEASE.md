YouTube Age Filter 1.6.0 is the first public GitHub release.

Filter desktop YouTube by publication age, hide Shorts, manage channel exceptions, and pause or resume filtering. Settings remain on your device. No account or API key is required.

### Install

Download `youtube-age-filter-v1.6.0.zip` from the assets below, extract it into a permanent folder, enable Developer mode in your browser's extension manager, and choose **Load unpacked**. Select the extracted folder containing `manifest.json`.

See the [installation guide](https://github.com/digitalrcs/youtube-age-filter#installation) for Chrome, Brave, and Edge instructions. This is an unpacked extension release; it is not a browser-store listing.

### Updating

Replace the files in the existing extension folder, reload the extension in your browser's extension manager, then refresh YouTube tabs. Keep the same folder to preserve the unpacked extension identity and settings.

### Included fixes

- Recheck metadata when YouTube reuses video cards.
- Preserve full videos inside mixed Shorts sections.
- Prevent stale asynchronous filtering after settings changes.
- Support channel handle exceptions on channel video grids.

English date labels are supported. Unknown dates remain visible, channel exceptions override the age limit, and YouTube layout changes can affect detection. See the troubleshooting guide for details.

`SHA256SUMS.txt` contains the checksum of the attached install ZIP.
