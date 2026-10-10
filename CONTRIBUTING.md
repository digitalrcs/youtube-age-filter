# Contributing

Bug reports and focused pull requests are welcome.

## Development

Use Node.js 22 or later and a Chromium-based desktop browser.

```sh
npm ci
npm run check
```

Load the repository folder as an unpacked extension. After source changes, reload the extension from the browser's extension manager and refresh the affected YouTube tab.

## Changes

- Keep permissions limited to the feature's actual needs.
- Add regression coverage for changed date parsing, filtering decisions, or asynchronous behavior.
- Test mixed sections so Shorts filtering does not hide unrelated videos.
- Check pause/start and both enabled and disabled Shorts settings.
- Use DOM fixtures containing only the minimum metadata needed to reproduce a problem. Do not commit personal browser captures.
- Describe the problem, resulting behavior, and verification in the pull request.

## Release checks

The automated suite covers representative DOM fixtures; it cannot guarantee compatibility with every YouTube experiment. Before releasing, check Home, search, a channel's Videos tab, and watch recommendations in a real browser. Verify new and old cards, infinite scrolling, channel exceptions, pause/start, and restoring Shorts.

On Windows, run `npm run package` to produce the install ZIP and checksum in `dist/`. The packaging script includes only extension runtime files, README, license, and privacy policy. Test dependencies are never shipped.

Update `manifest.json`, `package.json`, and the lockfile together when changing versions. Add a changelog entry. Publishing a Git tag such as `v1.6.0` runs the release workflow, checks the matching version, and attaches a ZIP and checksum to the GitHub release.
