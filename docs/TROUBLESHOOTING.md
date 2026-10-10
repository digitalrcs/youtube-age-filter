# Troubleshooting

## An old video is still visible

1. Check that filtering is active. The page button reads **Pause** while active and **Start** while paused.
2. Enter the desired maximum age and select **Apply** on the page, or **Save settings** in the popup.
3. Check **Whitelisted channels**. Channel exceptions override the age limit, including on Home and search results.
4. Select **Rescan**.
5. Enable **Show debug overlay** in the popup and save to inspect the card's diagnostic label.

| Label | Meaning |
| --- | --- |
| `whitelisted` | The channel is exempt from the age limit. |
| `age` followed by a number | Detected age in days, approximated from YouTube's label. |
| `no date yet` | No supported publication date has been found. The card remains visible. |
| `shorts` | The item was identified as a Short. Hidden items are not normally visible. |

English publication labels are supported. Unknown or missing dates are kept visible. Live streams, playlists, promotional shelves, and experimental layouts may not supply a usable publication age.

## Recent videos are missing

Select **Pause** to restore extension-hidden content. If a video reappears, note its visible publication label and page type before filing a report. Check whether the item is a Short or includes `#shorts`; Shorts filtering operates independently of channel age exceptions.

## Changes do not take effect

After installing an update, reload the extension in the browser's extension manager, then refresh every open YouTube tab. Old tabs may still have the previous content script. Verify the installed version in the extension manager; hovering over **YT Age Filter** on the page also shows the loaded version in releases from 1.6.0 onward.

## A channel exception does not match

Prefer the channel's `@handle` or use **Add current channel** while viewing its channel page. YouTube may expose a handle on one surface and a channel ID on another; the extension does not perform network lookups to resolve those aliases. Add both forms if needed. Exact display-name matching depends on a channel name being present on the card and may match unrelated channels with the same name.

## Report a problem

Use the [bug report form](https://github.com/digitalrcs/youtube-age-filter/issues/new?template=bug_report.yml). Include the extension and browser versions, YouTube interface language, page type, age setting, relevant channel exception status, and the visible publication label. Crop screenshots to the affected card and extension controls to avoid exposing personal information.
