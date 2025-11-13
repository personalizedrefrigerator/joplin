# Joplin Desktop Changelog

## [v3.5.6](https://github.com/laurent22/joplin/releases/tag/v3.5.6) (Pre-release) - 2025-10-29T14:48:46Z

- Improved: Accessibility: Improve dialog keyboard handling ([#13536](https://github.com/laurent22/joplin/issues/13536) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow adding and removing users from a share while a sync is in progress ([#13529](https://github.com/laurent22/joplin/issues/13529) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Disallow unsharing a folder while sharing is in progress ([#13551](https://github.com/laurent22/joplin/issues/13551) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Ensure that sync process ends up properly when Joplin Server shares cannot be accessed ([42d8df3](https://github.com/laurent22/joplin/commit/42d8df3))
- Improved: OneNote importer: Resolve possible import failure related to unsupported formatting ([#13495](https://github.com/laurent22/joplin/issues/13495) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Open the connection screen when a SAML session has expired ([fc0014c](https://github.com/laurent22/joplin/commit/fc0014c))
- Improved: Updated packages @fortawesome/react-fontawesome (v0.2.3), mermaid (v11.7.0)
- Fixed: Accessibility: Fix global keyboard shortcuts are ignored when the sidebar has focus ([#13485](https://github.com/laurent22/joplin/issues/13485) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Prevent sidebar header text from moving: Don't change the header icon on hover ([#13482](https://github.com/laurent22/joplin/issues/13482)) ([#13481](https://github.com/laurent22/joplin/issues/13481) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Change default content-type for Webdav connector to application/octet-stream ([#13053](https://github.com/laurent22/joplin/issues/13053)) ([#12249](https://github.com/laurent22/joplin/issues/12249) by [@pedr](https://github.com/pedr))
- Fixed: Fix "cannot add an item as a child of a read-only item" error when updating share IDs ([#13523](https://github.com/laurent22/joplin/issues/13523)) ([#13522](https://github.com/laurent22/joplin/issues/13522) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix adding a new user to a share creates an unused E2EE key ([#13538](https://github.com/laurent22/joplin/issues/13538)) ([#13537](https://github.com/laurent22/joplin/issues/13537) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: OneNote importer: Task lists: Fix checkbox sizes and accessibility ([#13558](https://github.com/laurent22/joplin/issues/13558)) ([#13549](https://github.com/laurent22/joplin/issues/13549) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.5.5](https://github.com/laurent22/joplin/releases/tag/v3.5.5) (Pre-release) - 2025-10-18T10:31:09Z

- Improved: Accessibility: Allow jumping to notebooks by typing the initial letter or Home/End ([#13469](https://github.com/laurent22/joplin/issues/13469) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Correctly import Evernote resources that do not have the encoding specified ([3097c3e](https://github.com/laurent22/joplin/commit/3097c3e))
- Improved: OneNote importer: Improve file header validation ([#13467](https://github.com/laurent22/joplin/issues/13467) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: OneNote importer: Support directly importing .one files and, on Windows, .onepkg files ([#13474](https://github.com/laurent22/joplin/issues/13474) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Save and restore the cursor position when switching between notes ([#13447](https://github.com/laurent22/joplin/issues/13447)) ([#520](https://github.com/laurent22/joplin/issues/520) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support importing `.one` files from OneNote 2016 ([#13391](https://github.com/laurent22/joplin/issues/13391) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update translations (5f66c51 by Helmut K. C. Tessarek)
- Improved: Updated packages form-data (v4.0.4)
- Improved: Upgrade to Electron v37.7.0 ([#13445](https://github.com/laurent22/joplin/issues/13445) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix header links only work if the note viewer is visible ([#13442](https://github.com/laurent22/joplin/issues/13442)) ([#13411](https://github.com/laurent22/joplin/issues/13411) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed importing certain Evernote images that have invalid dimension attributes ([#13472](https://github.com/laurent22/joplin/issues/13472))
- Fixed: Prevent Joplin from missing changes when syncing with file system or WebDAV ([#13054](https://github.com/laurent22/joplin/issues/13054)) ([#6517](https://github.com/laurent22/joplin/issues/6517) by [@mrjo118](https://github.com/mrjo118))

## [v3.5.4](https://github.com/laurent22/joplin/releases/tag/v3.5.4) (Pre-release) - 2025-10-10T17:19:58Z

- New: Add support for mixed case tags ([#12931](https://github.com/laurent22/joplin/issues/12931) by [@mrjo118](https://github.com/mrjo118))
- New: Add write() method to Plugin Clipboard API ([#13348](https://github.com/laurent22/joplin/issues/13348) by [@bwat47](https://github.com/bwat47))
- Improved: Accessibility: Disable sync icon animation when reduce motion is enabled ([#13283](https://github.com/laurent22/joplin/issues/13283) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Add hover + expanded arrow behavior for Notebook/Tags header ([#13190](https://github.com/laurent22/joplin/issues/13190)) ([#12292](https://github.com/laurent22/joplin/issues/12292) by [@maggie897](https://github.com/maggie897))
- Improved: Automatically retrigger the sync if there are more unsynced outgoing changes when sync completes ([#12989](https://github.com/laurent22/joplin/issues/12989) by [@mrjo118](https://github.com/mrjo118))
- Improved: Avoid excessive data usage when automatically triggering another sync ([#13261](https://github.com/laurent22/joplin/issues/13261) by [@mrjo118](https://github.com/mrjo118))
- Improved: Click on systray icon will show/hide Joplin main window ([#13299](https://github.com/laurent22/joplin/issues/13299)) ([#12572](https://github.com/laurent22/joplin/issues/12572) by [@trap000d](https://github.com/trap000d))
- Improved: Delete all note revisions when the note is permanently deleted ([#12609](https://github.com/laurent22/joplin/issues/12609)) ([#8718](https://github.com/laurent22/joplin/issues/8718) by [@pedr](https://github.com/pedr))
- Improved: Markdown editor search: Auto-scroll to the next match when the search changes ([#13242](https://github.com/laurent22/joplin/issues/13242)) ([#12343](https://github.com/laurent22/joplin/issues/12343) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: OCR: Fully disable the handwriting transcription backend when disabled in settings ([#13072](https://github.com/laurent22/joplin/issues/13072) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: OneNote importer: Simplify reporting import issues to the forum ([#13409](https://github.com/laurent22/joplin/issues/13409) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Open the Joplin Plugin web page when clicking on a plugin name  ([#13376](https://github.com/laurent22/joplin/issues/13376)) ([#13371](https://github.com/laurent22/joplin/issues/13371))
- Improved: Prefer user-specified CSS page sizing when printing to PDF ([#13130](https://github.com/laurent22/joplin/issues/13130)) ([#13096](https://github.com/laurent22/joplin/issues/13096) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Remove Beta mention for Joplin Server ([#13367](https://github.com/laurent22/joplin/issues/13367))
- Improved: Support accepting shares with a new key format ([#12829](https://github.com/laurent22/joplin/issues/12829) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @axe-core/playwright (v4.10.2), @playwright/test (v1.53.2), @rollup/plugin-commonjs (v28.0.6), form-data (v4.0.3), glob (v11.0.3), react-select (v5.10.2), sass (v1.93.0), sharp (v0.34.3), style-to-js (v1.1.17)
- Improved: Upgrade tesseract.js to v6 ([#13345](https://github.com/laurent22/joplin/issues/13345)) ([#12803](https://github.com/laurent22/joplin/issues/12803) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to Electron 37.4.0 ([#13156](https://github.com/laurent22/joplin/issues/13156) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Use plugin repository URL when homepage URL is not available in config screen ([#13318](https://github.com/laurent22/joplin/issues/13318))
- Fixed: Accessibility: Fix dismissing the alarm dialog by pressing escape ([#13068](https://github.com/laurent22/joplin/issues/13068)) ([#12816](https://github.com/laurent22/joplin/issues/12816) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Ensure notebook conflicts do not delete child notes and notebooks when resolved ([#13167](https://github.com/laurent22/joplin/issues/13167)) ([#11902](https://github.com/laurent22/joplin/issues/11902) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Ensure the sync shows an error when the server is down, when using a local WebDAV server ([#13301](https://github.com/laurent22/joplin/issues/13301) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix "insecure content security policy" warning ([#13288](https://github.com/laurent22/joplin/issues/13288) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error dialogs fail to appear in certain cases ([#13179](https://github.com/laurent22/joplin/issues/13179) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix files without extension not being imported properly ([#12974](https://github.com/laurent22/joplin/issues/12974)) ([#12049](https://github.com/laurent22/joplin/issues/12049) by [@pedr](https://github.com/pedr))
- Fixed: Fix historic issue whereby the first revision created for a note does not contain the original contents ([#12674](https://github.com/laurent22/joplin/issues/12674) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix images rendered in the Markdown editor don't reload when downloaded ([#13045](https://github.com/laurent22/joplin/issues/13045)) ([#12987](https://github.com/laurent22/joplin/issues/12987) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix notes are moved to the conflict folder when a folder is unshared ([#12993](https://github.com/laurent22/joplin/issues/12993) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix startup error when a non-English locale is selected ([#13347](https://github.com/laurent22/joplin/issues/13347)) ([#13346](https://github.com/laurent22/joplin/issues/13346) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix the order of attached images ([#12531](https://github.com/laurent22/joplin/issues/12531)) ([#12868](https://github.com/laurent22/joplin/issues/12868) by [@JZou-Code](https://github.com/JZou-Code))
- Fixed: Fixed image load failure when path contains '#' (13267) ([#13375](https://github.com/laurent22/joplin/issues/13375)) ([#13267](https://github.com/laurent22/joplin/issues/13267) by [@yingli-lab](https://github.com/yingli-lab))
- Fixed: Fixed red close button not working on macOS 26 ([#13311](https://github.com/laurent22/joplin/issues/13311)) ([#13196](https://github.com/laurent22/joplin/issues/13196) by [@yingli-lab](https://github.com/yingli-lab))
- Fixed: Hide 'Start application minimised' unless tray icon is enabled ([#13340](https://github.com/laurent22/joplin/issues/13340)) ([#13088](https://github.com/laurent22/joplin/issues/13088) by [@maggie897](https://github.com/maggie897))
- Fixed: Implement the config check for Joplin Server with SAML enabled ([#13360](https://github.com/laurent22/joplin/issues/13360)) ([#13328](https://github.com/laurent22/joplin/issues/13328) by [@ttcchhmm](https://github.com/ttcchhmm))
- Fixed: Prevent the default cut action handler to avoid double deletion ([#13208](https://github.com/laurent22/joplin/issues/13208)) ([#12239](https://github.com/laurent22/joplin/issues/12239) by [@JZou-Code](https://github.com/JZou-Code))
- Fixed: Skip copy event in TinyMCE if no content is selected. ([#13313](https://github.com/laurent22/joplin/issues/13313)) ([#12763](https://github.com/laurent22/joplin/issues/12763) by [@JZou-Code](https://github.com/JZou-Code))
- Fixed: Skip cut action in TinyMCE editor if no content is selected. ([#13315](https://github.com/laurent22/joplin/issues/13315)) ([#13314](https://github.com/laurent22/joplin/issues/13314) by [@JZou-Code](https://github.com/JZou-Code))

## [v3.4.12](https://github.com/laurent22/joplin/releases/tag/v3.4.12) - 2025-09-09T21:35:47Z

- Fixed: Fix error when saving in-editor rendering-related settings ([#13105](https://github.com/laurent22/joplin/issues/13105)) ([#13103](https://github.com/laurent22/joplin/issues/13103) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.4.10](https://github.com/laurent22/joplin/releases/tag/v3.4.10) - 2025-09-01T12:25:22Z

- Improved: Clarify handwritten text transcription setting ([#13073](https://github.com/laurent22/joplin/issues/13073) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add a "highlight active line" setting ([#12967](https://github.com/laurent22/joplin/issues/12967) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Auto-disable plugin settings when conflicting built-in settings are enabled ([#13055](https://github.com/laurent22/joplin/issues/13055)) ([#13048](https://github.com/laurent22/joplin/issues/13048) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Disable in-editor Markdown rendering by default (can be re-enabled in settings &gt; note) ([#13022](https://github.com/laurent22/joplin/issues/13022) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix notifications ([#13007](https://github.com/laurent22/joplin/issues/13007)) ([#12991](https://github.com/laurent22/joplin/issues/12991) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Markdown editor: Fix image rendering is disabled unless markup rendering is also enabled ([#13056](https://github.com/laurent22/joplin/issues/13056) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: OCR: Fix infinite loop ([#13025](https://github.com/laurent22/joplin/issues/13025)) ([#13024](https://github.com/laurent22/joplin/issues/13024) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: OCR: Fix processing resources with an invalid `ocr_driver_id` ([#13051](https://github.com/laurent22/joplin/issues/13051)) ([#13043](https://github.com/laurent22/joplin/issues/13043) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Clarified that handwritten transcription may not always work ([0024722](https://github.com/laurent22/joplin/commit/0024722))
- Fixed: Legacy editor: Fix plugin support ([#13066](https://github.com/laurent22/joplin/issues/13066)) ([#12855](https://github.com/laurent22/joplin/issues/12855) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.4.7](https://github.com/laurent22/joplin/releases/tag/v3.4.7) (Pre-release) - 2025-08-23T10:49:54Z

- Improved: Downgrade to Electron 35.7.5 ([#13013](https://github.com/laurent22/joplin/issues/13013) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix custom root CA support ([#13018](https://github.com/laurent22/joplin/issues/13018)) ([#13009](https://github.com/laurent22/joplin/issues/13009) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error logged when rendering a non-existent resource ([#13004](https://github.com/laurent22/joplin/issues/13004)) ([#12998](https://github.com/laurent22/joplin/issues/12998) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix startup failure when unable to access the keychain ([#13006](https://github.com/laurent22/joplin/issues/13006) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix unshare action requires two syncs to be reflected locally ([#12999](https://github.com/laurent22/joplin/issues/12999)) ([#12648](https://github.com/laurent22/joplin/issues/12648) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.4.6](https://github.com/laurent22/joplin/releases/tag/v3.4.6) (Pre-release) - 2025-08-20T20:30:35Z

- Improved: Markdown editor: Toggle checkboxes on ctrl-click ([#12927](https://github.com/laurent22/joplin/issues/12927) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.4.3), @playwright/test (v1.52.0), jsdom (v26.1.0), sass (v1.87.0), sharp (v0.34.2)
- Improved: Upgrade to Electron v37.3.0 ([#12951](https://github.com/laurent22/joplin/issues/12951) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Clicking Edit URL button in Note properties does not focus in url field ([#12970](https://github.com/laurent22/joplin/issues/12970)) ([#12315](https://github.com/laurent22/joplin/issues/12315) by [@pedr](https://github.com/pedr))
- Fixed: Shared folders: Fix moving shared subfolder to toplevel briefly marks it as a toplevel share ([#12964](https://github.com/laurent22/joplin/issues/12964) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.4.5](https://github.com/laurent22/joplin/releases/tag/v3.4.5) (Pre-release) - 2025-08-10T12:49:30Z

- Improved: Add an option to enable or disable search in OCR text ([#12578](https://github.com/laurent22/joplin/issues/12578)) ([#12224](https://github.com/laurent22/joplin/issues/12224) by [@pedr](https://github.com/pedr))
- Improved: Add option to transform HTML notes into Markdown ([#12730](https://github.com/laurent22/joplin/issues/12730)) ([#2059](https://github.com/laurent22/joplin/issues/2059) by [@pedr](https://github.com/pedr))
- Improved: Add shortcut to toggle between editors ([#12869](https://github.com/laurent22/joplin/issues/12869)) ([#12087](https://github.com/laurent22/joplin/issues/12087) by [@pedr](https://github.com/pedr))
- Improved: Move several features from Extra Markdown Editor Settings into the main app ([#12747](https://github.com/laurent22/joplin/issues/12747) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages sharp (v0.34.1)
- Fixed: Ensure merges to revisions during cleaning are synced to the target ([#12444](https://github.com/laurent22/joplin/issues/12444)) ([#12104](https://github.com/laurent22/joplin/issues/12104) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix switching to the Markdown editor after pasting links ([#12241](https://github.com/laurent22/joplin/issues/12241)) ([#12235](https://github.com/laurent22/joplin/issues/12235) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Put crash dump files at the platform-compliant locations ([#12839](https://github.com/laurent22/joplin/issues/12839)) ([#11871](https://github.com/laurent22/joplin/issues/11871) by [@w568w](https://github.com/w568w))
- Fixed: Selected emoji for new notebooks display too large until Joplin is restarted ([#12888](https://github.com/laurent22/joplin/issues/12888)) ([#12358](https://github.com/laurent22/joplin/issues/12358) by [@suchithms19](https://github.com/suchithms19))

## [v3.4.4](https://github.com/laurent22/joplin/releases/tag/v3.4.4) (Pre-release) - 2025-08-13T16:46:39Z

- New: Add transcribe functionality ([#12670](https://github.com/laurent22/joplin/issues/12670) by [@pedr](https://github.com/pedr))
- Improved: Make more settings per-profile (application layout, note list style, and note list order) ([#12825](https://github.com/laurent22/joplin/issues/12825)) ([#12714](https://github.com/laurent22/joplin/issues/12714) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages jsdom (v26), sharp (v0.34.0), types
- Fixed: Add tooltips to sidebar buttons ([#12798](https://github.com/laurent22/joplin/issues/12798)) ([#12233](https://github.com/laurent22/joplin/issues/12233) by [@suchithms19](https://github.com/suchithms19))
- Fixed: Date/Time dialog button not visible in dark mode ([#12816](https://github.com/laurent22/joplin/issues/12816))

## [v3.4.3](https://github.com/laurent22/joplin/releases/tag/v3.4.3) (Pre-release) - 2025-07-25T19:49:44Z

- Improved: Updated packages glob (v11.0.2), mermaid (v11.6.0)
- Fixed: Markdown editor: Make list indentation size equivalent to four spaces ([#12794](https://github.com/laurent22/joplin/issues/12794)) ([#12573](https://github.com/laurent22/joplin/issues/12573) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugins: Fix importing sqlite3 ([#12792](https://github.com/laurent22/joplin/issues/12792)) ([#12790](https://github.com/laurent22/joplin/issues/12790) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.4.2](https://github.com/laurent22/joplin/releases/tag/v3.4.2) (Pre-release) - 2025-07-24T10:43:55Z

- New: Add Joplin Server SAML support ([#11865](https://github.com/laurent22/joplin/issues/11865) by [@ttcchhmm](https://github.com/ttcchhmm))
- New: Rich text editor: Add a right-click "Open" menu item for external links ([#12391](https://github.com/laurent22/joplin/issues/12391) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Adjust list toggle behavior for consistency with other apps ([#12360](https://github.com/laurent22/joplin/issues/12360)) ([#11845](https://github.com/laurent22/joplin/issues/11845) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow users to change the font used in the Markdown viewer and Rich Text Editor ([#12356](https://github.com/laurent22/joplin/issues/12356)) ([#12113](https://github.com/laurent22/joplin/issues/12113) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Disable console wrapper ([#12663](https://github.com/laurent22/joplin/issues/12663) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Extend the maximum note history expiry days to 99999 ([#12374](https://github.com/laurent22/joplin/issues/12374) by [@mrjo118](https://github.com/mrjo118))
- Improved: Falls back to filename for the title when importing Markdown files with FrontMatter ([#12698](https://github.com/laurent22/joplin/issues/12698) by [@khemarato](https://github.com/khemarato))
- Improved: Move the conflicts folder to the top of the notebook list to improve visibility ([#12688](https://github.com/laurent22/joplin/issues/12688)) ([#12594](https://github.com/laurent22/joplin/issues/12594) by [@mrjo118](https://github.com/mrjo118))
- Improved: Performance: Faster startup and smaller application size ([#12366](https://github.com/laurent22/joplin/issues/12366) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Allow editor plugins to support multiple windows ([#12041](https://github.com/laurent22/joplin/issues/12041)) ([#11687](https://github.com/laurent22/joplin/issues/11687) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Rich Text Editor: Add less information to the log file when pasting ([#12684](https://github.com/laurent22/joplin/issues/12684)) ([#11866](https://github.com/laurent22/joplin/issues/11866) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Rich Text Editor: Auto-format "---", "***" and "___" as dividers ([#12397](https://github.com/laurent22/joplin/issues/12397) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @rollup/plugin-commonjs (v28.0.3), @rollup/plugin-node-resolve (v16.0.1), @rollup/plugin-replace (v6.0.2), dayjs (v1.11.13), domutils (v3.2.2), form-data (v4.0.2), glob (v11.0.1), highlight.js (v11.11.1), jsdom (v25), katex (v0.16.22), license-checker-rseidelsohn (v4.4.2), mermaid (v11.4.1), nan (v2.22.2), nanoid (v3.3.9), node (v18.20.7), re-resizable (v6.11.2), react, react-select (v5.10.1), sass (v1.86.3), sharp (v0.33.5), standard (v17.1.2), style-to-js (v1.1.16), tesseract.js (v5.1.1), types, uuid (v11.1.0)
- Improved: Upgrade to Electron 35.5.1 ([#12396](https://github.com/laurent22/joplin/issues/12396) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Add ability to delete all history for individual notes ([#12381](https://github.com/laurent22/joplin/issues/12381)) ([#12097](https://github.com/laurent22/joplin/issues/12097) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Change how the main content size is determined ([#12388](https://github.com/laurent22/joplin/issues/12388)) ([#12214](https://github.com/laurent22/joplin/issues/12214) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Ensure min and max validation is enforced when setting is not yet present ([#12553](https://github.com/laurent22/joplin/issues/12553)) ([#12419](https://github.com/laurent22/joplin/issues/12419) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix Yinxiang HTML imported notes being enclosed by a open anchor tag ([#12395](https://github.com/laurent22/joplin/issues/12395)) ([#12363](https://github.com/laurent22/joplin/issues/12363) by [@pedr](https://github.com/pedr))
- Fixed: Fix adding lists to blank lines using toolbar buttons ([#12745](https://github.com/laurent22/joplin/issues/12745)) ([#12744](https://github.com/laurent22/joplin/issues/12744) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix changing focused window when clicking on the note viewer ([#12390](https://github.com/laurent22/joplin/issues/12390)) ([#12377](https://github.com/laurent22/joplin/issues/12377) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix data API failure when including both conflicts and deleted notes in results ([#12650](https://github.com/laurent22/joplin/issues/12650) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix import of certain OneNote files that contain invalid properties ([#12338](https://github.com/laurent22/joplin/issues/12338)) ([#12295](https://github.com/laurent22/joplin/issues/12295) by [@pedr](https://github.com/pedr))
- Fixed: Fix incorrect line numbers/files in debug output ([#12664](https://github.com/laurent22/joplin/issues/12664)) ([#12451](https://github.com/laurent22/joplin/issues/12451) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix printing ([#12244](https://github.com/laurent22/joplin/issues/12244)) ([#12240](https://github.com/laurent22/joplin/issues/12240) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix secondary window controls greyed out when first opened ([#12685](https://github.com/laurent22/joplin/issues/12685) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed import of Markdown files that contain links with Windows paths ([#12386](https://github.com/laurent22/joplin/issues/12386)) ([#12362](https://github.com/laurent22/joplin/issues/12362) by [@pedr](https://github.com/pedr))
- Fixed: Long URL in note properties breaks the dialog layout ([#12669](https://github.com/laurent22/joplin/issues/12669) by [@SAYAN02-DEV](https://github.com/SAYAN02-DEV))
- Fixed: Markdown editor: Prevent selection from extending far outside the editor boundaries ([#12746](https://github.com/laurent22/joplin/issues/12746)) ([#12341](https://github.com/laurent22/joplin/issues/12341) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Moving sub-notebook of shared notebook should unshare it ([#12647](https://github.com/laurent22/joplin/issues/12647)) ([#12089](https://github.com/laurent22/joplin/issues/12089))
- Fixed: Rich Text Editor: Fix including `$`s creates math blocks on save ([#12398](https://github.com/laurent22/joplin/issues/12398)) ([#9593](https://github.com/laurent22/joplin/issues/9593) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Show warning when a plugin is not compatible with the new Markdown editor ([#12040](https://github.com/laurent22/joplin/issues/12040)) ([#11548](https://github.com/laurent22/joplin/issues/11548) by [@pedr](https://github.com/pedr))

## [v3.3.13](https://github.com/laurent22/joplin/releases/tag/v3.3.13) - 2025-06-09T20:13:30Z

- Fixed: Fix printing ([#12244](https://github.com/laurent22/joplin/issues/12244)) ([#12240](https://github.com/laurent22/joplin/issues/12240) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.4.1](https://github.com/laurent22/joplin/releases/tag/v3.4.1) (Pre-release) - 2025-05-20T09:59:39Z

- New: Plugins: Added copyToClipboard command ([067ce65](https://github.com/laurent22/joplin/commit/067ce65))
- New: Plugins: Added the webviewApi.menuPopupFromTemplate() API to create context menus ([370f6bd](https://github.com/laurent22/joplin/commit/370f6bd))
- Improved: Built-in plugins: Update Freehand Drawing to v3.1.0 ([#12323](https://github.com/laurent22/joplin/issues/12323) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Make default window color match system theme ([#12303](https://github.com/laurent22/joplin/issues/12303) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Set new encryption methods as default ([#12229](https://github.com/laurent22/joplin/issues/12229) by Self Not Found)
- Improved: Setup auto-update service when the feature flag is set in config ([318ca3d](https://github.com/laurent22/joplin/commit/318ca3d))
- Improved: Updated packages @adobe/css-tools (v4.4.2)
- Fixed: //" URLs setting does not allow loading local images ([#12281](https://github.com/laurent22/joplin/issues/12281) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix "Open" option for attachments shown in context menu for web links ([#12215](https://github.com/laurent22/joplin/issues/12215) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix keyboard can't add text after certain confirm dialogs are shown ([#12200](https://github.com/laurent22/joplin/issues/12200) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Rich Text Editor: Fix dropping a URL from the Firefox addressbar inserts nothing ([#12282](https://github.com/laurent22/joplin/issues/12282) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.3.12](https://github.com/laurent22/joplin/releases/tag/v3.3.12) - 2025-05-04T18:12:23Z

- Improved: Plugins: Undeprecate joplin.settings.value() ([3f364a4](https://github.com/laurent22/joplin/commit/3f364a4))
- Fixed: Fix crash after removing "toggle tab indentation" keyboard shortcut ([#12213](https://github.com/laurent22/joplin/issues/12213)) ([#12204](https://github.com/laurent22/joplin/issues/12204) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix printing ([#12219](https://github.com/laurent22/joplin/issues/12219) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Prevent application from hanging when multi-instance setup does not work ([#12222](https://github.com/laurent22/joplin/issues/12222))

## [v3.3.10](https://github.com/laurent22/joplin/releases/tag/v3.3.10) - 2025-05-02T19:46:15Z

- Fixed: Notify user when they are using the Intel app on Apple Silicon ([#11989](https://github.com/laurent22/joplin/issues/11989))

## [v3.3.9](https://github.com/laurent22/joplin/releases/tag/v3.3.9) - 2025-05-01T21:02:12Z

- Fixed: Fix inserting note links using the mouse ([#12199](https://github.com/laurent22/joplin/issues/12199)) ([#12197](https://github.com/laurent22/joplin/issues/12197) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.3.7](https://github.com/laurent22/joplin/releases/tag/v3.3.7) (Pre-release) - 2025-04-29T13:47:19Z

- New: Add plural forms for notes, users, hours, minutes, days ([#12171](https://github.com/laurent22/joplin/issues/12171) by [@SilverGreen93](https://github.com/SilverGreen93))
- Improved: "Collapse all" button in sidebar doesn't collapse trash folder ([#12051](https://github.com/laurent22/joplin/issues/12051)) ([#12039](https://github.com/laurent22/joplin/issues/12039) by [@MorbidMiyako](https://github.com/MorbidMiyako))
- Improved: Built-in plugins: Upgrade Backup to v1.4.3 ([#12180](https://github.com/laurent22/joplin/issues/12180) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update immer to v9.0.21 ([#12182](https://github.com/laurent22/joplin/issues/12182) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to Electron 35.2.1 ([#12178](https://github.com/laurent22/joplin/issues/12178) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fix "focus viewer" doesn't move foucs to the correct line for sufficiently large documents ([#12183](https://github.com/laurent22/joplin/issues/12183) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Allow opening secondary app instances from the "File" menu ([#12181](https://github.com/laurent22/joplin/issues/12181)) ([#12177](https://github.com/laurent22/joplin/issues/12177) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Editor: Allow syntax highlighting within ==highlight==s ([#12167](https://github.com/laurent22/joplin/issues/12167)) ([#12110](https://github.com/laurent22/joplin/issues/12110) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix firewall warning on startup ([#12176](https://github.com/laurent22/joplin/issues/12176) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Preserve search query when opening a note in a new window ([#12175](https://github.com/laurent22/joplin/issues/12175)) ([#12168](https://github.com/laurent22/joplin/issues/12168) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.3.6](https://github.com/laurent22/joplin/releases/tag/v3.3.6) (Pre-release) - 2025-04-24T12:27:20Z

- Improved: Markdown editor: Scroll linked-to headers to the top of the editor ([#12125](https://github.com/laurent22/joplin/issues/12125) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Disable WebView isolation by default, add feature flag ([#12149](https://github.com/laurent22/joplin/issues/12149)) ([#12143](https://github.com/laurent22/joplin/issues/12143) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix infinite loop on startup after quickly moving folders ([#12140](https://github.com/laurent22/joplin/issues/12140) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Make list continuation logic more predictable ([#11919](https://github.com/laurent22/joplin/issues/11919)) ([#10226](https://github.com/laurent22/joplin/issues/10226) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin API: Fix compatibility with YesYouKan plugin ([#12132](https://github.com/laurent22/joplin/issues/12132) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin API: Fix plugin renderer scripts fail to load in the Rich Text Editor ([#12141](https://github.com/laurent22/joplin/issues/12141)) ([#12137](https://github.com/laurent22/joplin/issues/12137) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.3.5](https://github.com/laurent22/joplin/releases/tag/v3.3.5) (Pre-release) - 2025-04-17T13:40:31Z

- New: Linux: Add more input-method-related start flags ([#12115](https://github.com/laurent22/joplin/issues/12115) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Rich Text Editor: Add KaTeX to supported auto-replacements ([#12081](https://github.com/laurent22/joplin/issues/12081) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Add a new menu item to launch the primary instance from the secondary one ([#12006](https://github.com/laurent22/joplin/issues/12006))
- Improved: By default keep 7 days of backup ([#12095](https://github.com/laurent22/joplin/issues/12095))
- Improved: Default plugins: Update Freehand Drawing to v3.0.0 ([#12103](https://github.com/laurent22/joplin/issues/12103) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Default plugins: Update Freehand Drawing to v3.0.1 ([#12112](https://github.com/laurent22/joplin/issues/12112) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Fix pasting images in the Rich Text Editor ([#12079](https://github.com/laurent22/joplin/issues/12079)) ([#12058](https://github.com/laurent22/joplin/issues/12058) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Expose hash from clicked cross-note link ([#12094](https://github.com/laurent22/joplin/issues/12094) by [@executed](https://github.com/executed))
- Improved: Plugins: Prevent plugin dialogs, panels, and editors from accessing the main JavaScript context ([#12083](https://github.com/laurent22/joplin/issues/12083) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Print name of file when import fails ([c3fe0ed](https://github.com/laurent22/joplin/commit/c3fe0ed))
- Improved: Remove outline from list of plugins that are broken in the new editor ([#12107](https://github.com/laurent22/joplin/issues/12107) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Rich Text Editor: Disallow inline event handlers ([#12106](https://github.com/laurent22/joplin/issues/12106) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update Freehand Drawing to v2.16.1 ([#12073](https://github.com/laurent22/joplin/issues/12073) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix Rich Text Editor deletes paragraphs when pressing enter after a resized image ([#12090](https://github.com/laurent22/joplin/issues/12090)) ([#12059](https://github.com/laurent22/joplin/issues/12059) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix returning form data from plugin dialogs ([#12092](https://github.com/laurent22/joplin/issues/12092) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix toggling lists in the Rich Text Editor ([#12071](https://github.com/laurent22/joplin/issues/12071)) ([#12042](https://github.com/laurent22/joplin/issues/12042) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Link to header: Move the Markdown editor cursor to the location of the link target ([#12118](https://github.com/laurent22/joplin/issues/12118)) ([#12105](https://github.com/laurent22/joplin/issues/12105) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Markdown Editor: Fix numbered sublist renumbering ([#12091](https://github.com/laurent22/joplin/issues/12091) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Rich Text Editor: Fix editor content not updated in some cases when switching notes ([#12084](https://github.com/laurent22/joplin/issues/12084) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Rich Text Editor: Fix keyboard and plugin-opened context menus sometimes not displayed or have incorrect content ([#12076](https://github.com/laurent22/joplin/issues/12076)) ([#9588](https://github.com/laurent22/joplin/issues/9588) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.3.4](https://github.com/laurent22/joplin/releases/tag/v3.3.4) (Pre-release) - 2025-04-07T20:23:35Z

- New: Plugins: Add `setting.globalValues` and deprecate `setting.globalValue` ([ef51386](https://github.com/laurent22/joplin/commit/ef51386))
- New: Rich Text Editor: Add setting to allow disabling auto-format ([#12022](https://github.com/laurent22/joplin/issues/12022) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Add screen reader announcements when toggling the note list and/or sidebar ([#11776](https://github.com/laurent22/joplin/issues/11776)) ([#11741](https://github.com/laurent22/joplin/issues/11741) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Remove redundant accessibility information from sidebar notebooks ([#12020](https://github.com/laurent22/joplin/issues/12020)) ([#11903](https://github.com/laurent22/joplin/issues/11903) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Explain why items could not be decrypted ([#12048](https://github.com/laurent22/joplin/issues/12048)) ([#11872](https://github.com/laurent22/joplin/issues/11872) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve notification accessibility ([#11752](https://github.com/laurent22/joplin/issues/11752) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Increase the likelihood of text generation from image recognition ([#12028](https://github.com/laurent22/joplin/issues/12028)) ([#11608](https://github.com/laurent22/joplin/issues/11608) by [@pedr](https://github.com/pedr))
- Improved: Multiple instances: Secure local server ([#11999](https://github.com/laurent22/joplin/issues/11999)) ([#11992](https://github.com/laurent22/joplin/issues/11992))
- Improved: Update Electron to v35.1.4 ([#12068](https://github.com/laurent22/joplin/issues/12068) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: A note scrolls to top if reached by following a link to a section ([#12038](https://github.com/laurent22/joplin/issues/12038)) ([#9291](https://github.com/laurent22/joplin/issues/9291) by [@Schmeilen](https://github.com/Schmeilen))
- Fixed: App without a profile directory cannot start ([#12021](https://github.com/laurent22/joplin/issues/12021))
- Fixed: Changing the type of one list changes it for all the lists ([#11986](https://github.com/laurent22/joplin/issues/11986)) ([#11971](https://github.com/laurent22/joplin/issues/11971) by [@Paramesh-T-S](https://github.com/Paramesh-T-S))
- Fixed: Joplin became unusably slow on MacOS due to incorrect detection of architecture ([#11989](https://github.com/laurent22/joplin/issues/11989))
- Fixed: Regression: Restarting app is broken ([#11975](https://github.com/laurent22/joplin/issues/11975))
- Fixed: Restoring a note which was in a deleted notebook  ([#12016](https://github.com/laurent22/joplin/issues/12016)) ([#11934](https://github.com/laurent22/joplin/issues/11934))
- Fixed: Rich Text Editor: Fix "Remove color" button doesn't work ([#12052](https://github.com/laurent22/joplin/issues/12052) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.3.3](https://github.com/laurent22/joplin/releases/tag/v3.3.3) (Pre-release) - 2025-03-16T11:52:33Z

- New: Accessibility: Add a menu item that moves focus to the note viewer ([#11967](https://github.com/laurent22/joplin/issues/11967) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Accessibility: Add error indication on Note properties ([#11784](https://github.com/laurent22/joplin/issues/11784) by [@pedr](https://github.com/pedr))
- New: Accessibility: Add more standard keyboard shortcuts for the notebook sidebar ([#11892](https://github.com/laurent22/joplin/issues/11892) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add a button to collapse or expand all folders ([#11905](https://github.com/laurent22/joplin/issues/11905))
- New: Add dialog to select a note and link to it ([#11891](https://github.com/laurent22/joplin/issues/11891))
- New: Add setting migration for ocr.enabled ([ab86b95](https://github.com/laurent22/joplin/commit/ab86b95))
- New: Add support for multiple instances ([#11963](https://github.com/laurent22/joplin/issues/11963))
- New: Added keyboard shortcut and menu item for toggleEditorPlugin command ([7e8dee4](https://github.com/laurent22/joplin/commit/7e8dee4))
- New: Plugins: Add support for `joplin.shouldUseDarkColors` API ([fe67a44](https://github.com/laurent22/joplin/commit/fe67a44))
- Improved: Accessibility: Improve "toggle all notebooks" accessibility ([#11918](https://github.com/laurent22/joplin/issues/11918) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Add "Disable synchronisation" to Joplin Cloud prompt message ([#11705](https://github.com/laurent22/joplin/issues/11705)) ([#11696](https://github.com/laurent22/joplin/issues/11696) by [@Vortrix5](https://github.com/Vortrix5))
- Improved: Improve Rich Text Editor toolbar structure ([#11869](https://github.com/laurent22/joplin/issues/11869)) ([#11663](https://github.com/laurent22/joplin/issues/11663) by [@j-scheitler1](https://github.com/j-scheitler1))
- Improved: Improve download in install script ([#11921](https://github.com/laurent22/joplin/issues/11921) by Helmut K. C. Tessarek)
- Improved: Make "toggle all folders" button also expand the folder list ([#11917](https://github.com/laurent22/joplin/issues/11917) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Mark the LanguageTool Integration plugin as incompatible ([#11715](https://github.com/laurent22/joplin/issues/11715)) ([#11710](https://github.com/laurent22/joplin/issues/11710) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to Electron 35.0.1 ([#11968](https://github.com/laurent22/joplin/issues/11968) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix adding tags to a note through drag-and-drop ([#11911](https://github.com/laurent22/joplin/issues/11911) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix ctrl-p doesn't open the goto anything dialog in the Rich Text Editor ([#11926](https://github.com/laurent22/joplin/issues/11926)) ([#11894](https://github.com/laurent22/joplin/issues/11894) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix issue with GotoAnything that would prevent it from highlighting search results in note titles ([#11888](https://github.com/laurent22/joplin/issues/11888))
- Fixed: Import audio from OneNote as file links ([#11942](https://github.com/laurent22/joplin/issues/11942)) ([#11939](https://github.com/laurent22/joplin/issues/11939) by [@pedr](https://github.com/pedr))
- Fixed: Make tab size consistent between Markdown editor and viewer (and RTE) ([#11940](https://github.com/laurent22/joplin/issues/11940)) ([#11673](https://github.com/laurent22/joplin/issues/11673))
- Fixed: Preserve attachment file extensions regardless of the mime type  ([#11852](https://github.com/laurent22/joplin/issues/11852)) ([#11759](https://github.com/laurent22/joplin/issues/11759) by [@pedr](https://github.com/pedr))
- Fixed: Sharing a notebook with nobody prints "No user with ID public_key" ([#11932](https://github.com/laurent22/joplin/issues/11932)) ([#11923](https://github.com/laurent22/joplin/issues/11923) by [@Paramesh-T-S](https://github.com/Paramesh-T-S))

## [v3.2.13](https://github.com/laurent22/joplin/releases/tag/v3.2.13) - 2025-02-28T14:38:21Z

- Improved: Plugins: Mark the LanguageTool Integration plugin as incompatible ([#11715](https://github.com/laurent22/joplin/issues/11715)) ([#11710](https://github.com/laurent22/joplin/issues/11710) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Preserve attachment file extensions regardless of the mime type  ([#11852](https://github.com/laurent22/joplin/issues/11852)) ([#11759](https://github.com/laurent22/joplin/issues/11759) by [@pedr](https://github.com/pedr))

## [v3.3.2](https://github.com/laurent22/joplin/releases/tag/v3.3.2) (Pre-release) - 2025-02-19T17:34:26Z

- Improved: Accessibility: Make click outside of dialog content be cancellable  ([#11765](https://github.com/laurent22/joplin/issues/11765) by [@pedr](https://github.com/pedr))
- Improved: Improve behaviour of note list to-dos when ticking a checkbox using the keyboard ([44c735a](https://github.com/laurent22/joplin/commit/44c735a))
- Improved: Improve usability of note list when ticking to-dos using the Space key ([#11855](https://github.com/laurent22/joplin/issues/11855))
- Improved: Plugins: Simplify getting the ID of the note open in an editor ([#11841](https://github.com/laurent22/joplin/issues/11841) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix OneNote importer not being able to handle corrupted attachments ([#11859](https://github.com/laurent22/joplin/issues/11859)) ([#11844](https://github.com/laurent22/joplin/issues/11844) by [@pedr](https://github.com/pedr))
- Fixed: Fix Rich Text right-click and paste regressions ([#11850](https://github.com/laurent22/joplin/issues/11850) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Hide extra clear button in search field ([#11851](https://github.com/laurent22/joplin/issues/11851)) ([#11847](https://github.com/laurent22/joplin/issues/11847) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Preserve attachment file extensions regardless of the mime type  ([#11852](https://github.com/laurent22/joplin/issues/11852)) ([#11759](https://github.com/laurent22/joplin/issues/11759) by [@pedr](https://github.com/pedr))

## [v3.3.1](https://github.com/laurent22/joplin/releases/tag/v3.3.1) (Pre-release) - 2025-02-16T17:06:26Z

- New: Accessibility: Add a new shortcut to set focus to editor toolbar ([#11764](https://github.com/laurent22/joplin/issues/11764) by [@pedr](https://github.com/pedr))
- New: Accessibility: Add accessibility information to the warning banner ([#11775](https://github.com/laurent22/joplin/issues/11775) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Accessibility: Add label to the delete buttons of the Note Attachments ([#11749](https://github.com/laurent22/joplin/issues/11749) by [@pedr](https://github.com/pedr))
- New: Add specification document for new encryption methods ([#11754](https://github.com/laurent22/joplin/issues/11754) by Self Not Found)
- New: Added shortcut Cmd+Option+N to open note in new window, and added command to menu bar ([23f75f8](https://github.com/laurent22/joplin/commit/23f75f8))
- Improved: Accessibility: Add status update after update ([#11634](https://github.com/laurent22/joplin/issues/11634)) ([#11621](https://github.com/laurent22/joplin/issues/11621) by [@pedr](https://github.com/pedr))
- Improved: Accessibility: Allow toggling between tab navigation and indentation ([#11717](https://github.com/laurent22/joplin/issues/11717) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve "change application layout" screen keyboard accessibility ([#11718](https://github.com/laurent22/joplin/issues/11718) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve contrast of faded URLs in Markdown editor ([#11635](https://github.com/laurent22/joplin/issues/11635) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve scrollbar contrast ([#11708](https://github.com/laurent22/joplin/issues/11708) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve sidebar content contrast ([#11638](https://github.com/laurent22/joplin/issues/11638) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve sync wizard accessibility ([#11649](https://github.com/laurent22/joplin/issues/11649) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Make Markdown toolbar scrollable when low on space ([#11636](https://github.com/laurent22/joplin/issues/11636) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Mark secondary screen navigation bars as navigation regions ([#11650](https://github.com/laurent22/joplin/issues/11650) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Replacing library used for datetime with native input element ([#11725](https://github.com/laurent22/joplin/issues/11725) by [@pedr](https://github.com/pedr))
- Improved: Accessibility: Rich Text Editor: Make it possible to edit code blocks with a keyboard or touchscreen ([#11727](https://github.com/laurent22/joplin/issues/11727) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Add alt text to welcome notes ([#11643](https://github.com/laurent22/joplin/issues/11643)) ([#11642](https://github.com/laurent22/joplin/issues/11642) by [@pedr](https://github.com/pedr))
- Improved: Add proper type to search input ([#11645](https://github.com/laurent22/joplin/issues/11645)) ([#11644](https://github.com/laurent22/joplin/issues/11644) by [@pedr](https://github.com/pedr))
- Improved: Add scrollbar to Note Revision to allow usage on zoomed interface ([#11689](https://github.com/laurent22/joplin/issues/11689)) ([#11654](https://github.com/laurent22/joplin/issues/11654) by [@pedr](https://github.com/pedr))
- Improved: Built-in plugins: Update Freehand Drawing to v2.15.0 ([#11735](https://github.com/laurent22/joplin/issues/11735) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Disable featureFlag.autoUpdaterServiceEnabled for now ([7994c0b](https://github.com/laurent22/joplin/commit/7994c0b))
- Improved: Do not add double newlines around attached files ([#11690](https://github.com/laurent22/joplin/issues/11690))
- Improved: Double click to open a note in a new window ([#11664](https://github.com/laurent22/joplin/issues/11664))
- Improved: Enable OCR processing by default ([c55979c](https://github.com/laurent22/joplin/commit/c55979c))
- Improved: Harden failsafe logic to check for the presence of info.json, rather than just the item count ([#11750](https://github.com/laurent22/joplin/issues/11750) by [@mrjo118](https://github.com/mrjo118))
- Improved: Highlight `==marked==` text in the Markdown editor ([#11794](https://github.com/laurent22/joplin/issues/11794) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve Welcome Notes with clearer instructions ([#11656](https://github.com/laurent22/joplin/issues/11656)) ([#11647](https://github.com/laurent22/joplin/issues/11647) by [@pedr](https://github.com/pedr))
- Improved: Improve font picker accessibility ([#11763](https://github.com/laurent22/joplin/issues/11763) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Logging: Log less information at level `warn` when a decryption error occurs ([#11771](https://github.com/laurent22/joplin/issues/11771) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Move S3 sync target out of beta ([798e1b8](https://github.com/laurent22/joplin/commit/798e1b8))
- Improved: Performance: Improve performance when changing window state ([#11720](https://github.com/laurent22/joplin/issues/11720) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Legacy editor API: Fix delayed crash caused by out-of-bounds inputs ([#11714](https://github.com/laurent22/joplin/issues/11714) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Re-enable the beta "auto-update" feature flag ([#11802](https://github.com/laurent22/joplin/issues/11802) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Render strikethrough text in the editor ([#11795](https://github.com/laurent22/joplin/issues/11795)) ([#11790](https://github.com/laurent22/joplin/issues/11790) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Reorganised note list context menu ([#11664](https://github.com/laurent22/joplin/issues/11664))
- Improved: Updated packages @adobe/css-tools (v4.4.1), @axe-core/playwright (v4.10.1)
- Improved: Upgrade to Electron 34 ([#11665](https://github.com/laurent22/joplin/issues/11665) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to TinyMCE v6 ([#11652](https://github.com/laurent22/joplin/issues/11652) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fix incorrect note viewer accessibility label ([#11744](https://github.com/laurent22/joplin/issues/11744) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fix input fields not associated with labels ([#11700](https://github.com/laurent22/joplin/issues/11700) by [@pedr](https://github.com/pedr))
- Fixed: Accessibility: Fix unlabelled toolbar button in the Rich Text Editor ([#11655](https://github.com/laurent22/joplin/issues/11655) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fixes focus going to start of document when Note History is open ([#11769](https://github.com/laurent22/joplin/issues/11769) by [@pedr](https://github.com/pedr))
- Fixed: Adjust how items are queried by ID ([#11734](https://github.com/laurent22/joplin/issues/11734)) ([#11630](https://github.com/laurent22/joplin/issues/11630) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Context menu was empty for notes on Trash folder ([#11743](https://github.com/laurent22/joplin/issues/11743)) ([#11738](https://github.com/laurent22/joplin/issues/11738) by [@pedr](https://github.com/pedr))
- Fixed: Fix crash when closing a secondary window with the Rich Text Editor open ([#11737](https://github.com/laurent22/joplin/issues/11737) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix datetime values not appearing on note properties when the picker is open ([#11748](https://github.com/laurent22/joplin/issues/11748) by [@pedr](https://github.com/pedr))
- Fixed: Fix secondary windows not removed from state if closed while focused ([#11740](https://github.com/laurent22/joplin/issues/11740) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugins: Fix toast notifications don't reappear unless parameters are changed ([#11786](https://github.com/laurent22/joplin/issues/11786)) ([#11783](https://github.com/laurent22/joplin/issues/11783) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Pressing Shift+Tab when focus is on notebook list would jump straight to editor ([#11641](https://github.com/laurent22/joplin/issues/11641)) ([#11640](https://github.com/laurent22/joplin/issues/11640) by [@pedr](https://github.com/pedr))
- Fixed: Prevent the default note title from being "&nbsp;" ([#11785](https://github.com/laurent22/joplin/issues/11785)) ([#11662](https://github.com/laurent22/joplin/issues/11662) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Sync: Fix share not marked as readonly if the recipient has an outgoing share ([#11770](https://github.com/laurent22/joplin/issues/11770) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.2.12](https://github.com/laurent22/joplin/releases/tag/v3.2.12) - 2025-01-23T23:52:04Z

- Improved: Allow internal links to target elements using the name attribute ([#11671](https://github.com/laurent22/joplin/issues/11671) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error when a note has no history ([#11702](https://github.com/laurent22/joplin/issues/11702) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Security: Improve comment escaping ([#11706](https://github.com/laurent22/joplin/issues/11706) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.2.11](https://github.com/laurent22/joplin/releases/tag/v3.2.11) - 2025-01-13T17:48:21Z

- New: Accessibility: Add setting to increase scrollbar sizes ([#11627](https://github.com/laurent22/joplin/issues/11627) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix double-click to collapse notebooks ([#11625](https://github.com/laurent22/joplin/issues/11625)) ([#11624](https://github.com/laurent22/joplin/issues/11624) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.2.10](https://github.com/laurent22/joplin/releases/tag/v3.2.10) (Pre-release) - 2025-01-10T10:17:28Z

- Improved: Allow installer to skip uninstallation step after repeated failures ([#11612](https://github.com/laurent22/joplin/issues/11612)) ([#11508](https://github.com/laurent22/joplin/issues/11508) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Drawing: Fix "insert drawing" button is not disabled in read-only notes (Upgrade Freehand Drawing to v2.14.0) ([#11613](https://github.com/laurent22/joplin/issues/11613) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix syncLockGoneError on sync with certain share configs ([#11611](https://github.com/laurent22/joplin/issues/11611)) ([#11594](https://github.com/laurent22/joplin/issues/11594) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.2.9](https://github.com/laurent22/joplin/releases/tag/v3.2.9) (Pre-release) - 2025-01-09T22:58:42Z

- Improved: Remove "URI malformed" alert ([#11576](https://github.com/laurent22/joplin/issues/11576)) ([#11575](https://github.com/laurent22/joplin/issues/11575) by Self Not Found)
- Fixed: Fix keyboard can't add text after certain error/info dialogs are shown ([#11603](https://github.com/laurent22/joplin/issues/11603) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Links from imported notes from OneNote were being wrongly rendered ([#11618](https://github.com/laurent22/joplin/issues/11618)) ([#11617](https://github.com/laurent22/joplin/issues/11617) by [@pedr](https://github.com/pedr))
- Fixed: OneNote Importer should only use text on fallback title ([#11598](https://github.com/laurent22/joplin/issues/11598)) ([#11597](https://github.com/laurent22/joplin/issues/11597) by [@pedr](https://github.com/pedr))
- Fixed: OneNote imported notes have broken links when there are chineses characters on link ([#11602](https://github.com/laurent22/joplin/issues/11602)) ([#11600](https://github.com/laurent22/joplin/issues/11600) by [@pedr](https://github.com/pedr))

## [v3.2.7](https://github.com/laurent22/joplin/releases/tag/v3.2.7) (Pre-release) - 2025-01-06T16:35:41Z

- Improved: Plugins: Add Toast plugin API ([#11583](https://github.com/laurent22/joplin/issues/11583)) ([#11579](https://github.com/laurent22/joplin/issues/11579))
- Updated translations

## [v3.2.6](https://github.com/laurent22/joplin/releases/tag/v3.2.6) (Pre-release) - 2024-12-23T21:54:40Z

- Improved: Keep comments when rendering Markdown to allow rendered note metadata ([#11530](https://github.com/laurent22/joplin/issues/11530))
- Improved: Updated packages @rollup/plugin-node-resolve (v15.2.4)
- Fixed: Rich Text Editor: Fix resized images in lists break sub-list items ([#11532](https://github.com/laurent22/joplin/issues/11532)) ([#11382](https://github.com/laurent22/joplin/issues/11382) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixes [#11508](https://github.com/laurent22/joplin/issues/11508): Prevent installer from recognizing itself as a running instance of Joplin and switch back to electron-builder v24 ([#11541](https://github.com/laurent22/joplin/issues/11541))

## [v3.2.5](https://github.com/laurent22/joplin/releases/tag/v3.2.5) (Pre-release) - 2024-12-18T10:41:13Z

- Improved: Generate .deb package ([#11526](https://github.com/laurent22/joplin/issues/11526) by [@pedr](https://github.com/pedr))
- Improved: Make js-draw a default plugin ([#11516](https://github.com/laurent22/joplin/issues/11516)) ([#11314](https://github.com/laurent22/joplin/issues/11314))
- Improved: Make table in HTML format horizontally scrollable ([#11198](https://github.com/laurent22/joplin/issues/11198) by [@wljince007](https://github.com/wljince007))
- Improved: Reduce application size ([#11505](https://github.com/laurent22/joplin/issues/11505) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages adm-zip (v0.5.16)
- Fixed: Fix pressing enter during composition in the title input moves focus ([#11491](https://github.com/laurent22/joplin/issues/11491)) ([#11485](https://github.com/laurent22/joplin/issues/11485) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed tags with same special unicode characters not matching ([#11513](https://github.com/laurent22/joplin/issues/11513)) ([#11179](https://github.com/laurent22/joplin/issues/11179) by [@pedr](https://github.com/pedr))
- Fixed: Upgrade `electron-builder` and `@electron/rebuild` ([#11512](https://github.com/laurent22/joplin/issues/11512)) ([#11508](https://github.com/laurent22/joplin/issues/11508) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.2.4](https://github.com/laurent22/joplin/releases/tag/v3.2.4) (Pre-release) - 2024-12-12T17:59:52Z

- New: Added support for rendered note metadata, in particular the joplin-metadata-print-title tag ([5d84f80](https://github.com/laurent22/joplin/commit/5d84f80))
- New: Translation: Add sk_SK.po (Slovak) ([#11433](https://github.com/laurent22/joplin/issues/11433) by [@dodog](https://github.com/dodog))
- Improved: Accessibility: Prevent overwrite mode toggle shortcut from conflicting with screen reader shortcuts ([#11447](https://github.com/laurent22/joplin/issues/11447) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Prevent PDF and HTML export from failing when a plugin references a non-existent file ([d1fc69f](https://github.com/laurent22/joplin/commit/d1fc69f))
- Improved: Reactivate pCloud synchronisation ([23032b9](https://github.com/laurent22/joplin/commit/23032b9))
- Improved: Remove Better Code Blocks from the list of plugins incompatible with the new editor ([#11474](https://github.com/laurent22/joplin/issues/11474) by [@ckant](https://github.com/ckant))
- Improved: Removed deprecation notice on OneDrive sync method ([ceea0bc](https://github.com/laurent22/joplin/commit/ceea0bc))
- Fixed: Accessibility: Do not override focus order when pressing tab/shift-tab on the note list ([#11446](https://github.com/laurent22/joplin/issues/11446)) ([#11443](https://github.com/laurent22/joplin/issues/11443) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Allow zooming in/out in secondary windows ([#11467](https://github.com/laurent22/joplin/issues/11467)) ([#11444](https://github.com/laurent22/joplin/issues/11444) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Correct file path of OneNote converter on release build ([#11410](https://github.com/laurent22/joplin/issues/11410)) ([#11408](https://github.com/laurent22/joplin/issues/11408) by [@pedr](https://github.com/pedr))
- Fixed: Ensure spell-check toggle works on macOS ([#11388](https://github.com/laurent22/joplin/issues/11388)) ([#11261](https://github.com/laurent22/joplin/issues/11261) by [@dhakarRaghu](https://github.com/dhakarRaghu))
- Fixed: Fix `undefined` errors in translations ([#11407](https://github.com/laurent22/joplin/issues/11407) by Self Not Found)
- Fixed: Fix crash on startup if old read-only items are in the trash ([#11458](https://github.com/laurent22/joplin/issues/11458)) ([#11457](https://github.com/laurent22/joplin/issues/11457) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix the error caused by undefined isCodeBlock_ (turndown-plugin-gfm) ([#11471](https://github.com/laurent22/joplin/issues/11471) by Manabu Nakazawa)
- Fixed: Fixed checkboxes alignment in note viewer ([#11425](https://github.com/laurent22/joplin/issues/11425))
- Fixed: Fixed fallback icon size on HTML notes ([#11448](https://github.com/laurent22/joplin/issues/11448) by [@pedr](https://github.com/pedr))
- Fixed: Goto Anything fails for long strings ([#11436](https://github.com/laurent22/joplin/issues/11436)) ([#11409](https://github.com/laurent22/joplin/issues/11409))
- Fixed: Reduce application size by removing unnecessary Rust files ([#11412](https://github.com/laurent22/joplin/issues/11412)) ([#11405](https://github.com/laurent22/joplin/issues/11405) by [@pedr](https://github.com/pedr))
- Fixed: Upgrade CodeMirror packages ([#11440](https://github.com/laurent22/joplin/issues/11440)) ([#11318](https://github.com/laurent22/joplin/issues/11318) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.2.3](https://github.com/laurent22/joplin/releases/tag/v3.2.3) (Pre-release) - 2024-11-18T00:09:05Z

- New: Add OneNote Importer ([#11392](https://github.com/laurent22/joplin/issues/11392) by [@pedr](https://github.com/pedr))
- New: Plugins: Add support for editor.scrollToText on desktop ([6eac8d9](https://github.com/laurent22/joplin/commit/6eac8d9))
- Improved: Deprecated OneDrive sync method ([e36f377](https://github.com/laurent22/joplin/commit/e36f377))
- Improved: Trying to fix issue with permission errors when installing a plugin ([fb6a807](https://github.com/laurent22/joplin/commit/fb6a807))
- Improved: Mermaid version update ([#11367](https://github.com/laurent22/joplin/issues/11367) by [@LEVIII007](https://github.com/LEVIII007))
- Improved: Plugins: Allow specifying render options on renderMarkup command ([8e3c817](https://github.com/laurent22/joplin/commit/8e3c817))
- Improved: Remove the need for sync locks ([#11377](https://github.com/laurent22/joplin/issues/11377))
- Fixed: Fix PDF export fails with error ([#11390](https://github.com/laurent22/joplin/issues/11390) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix dropping files into the editor ([#11380](https://github.com/laurent22/joplin/issues/11380) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix race condition which may cause data loss, particularly before or after pasting text in the note editor ([#11334](https://github.com/laurent22/joplin/issues/11334)) ([#11317](https://github.com/laurent22/joplin/issues/11317) by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix vertical alignment of checkboxes when text wraps over multiple lines ([226a8b3](https://github.com/laurent22/joplin/commit/226a8b3))

## [v3.2.1](https://github.com/laurent22/joplin/releases/tag/v3.2.1) (Pre-release) - 2024-11-10T16:16:27Z

- New: Accessibility: Add ARIA information to the sidebar's notebook and tag list ([#11196](https://github.com/laurent22/joplin/issues/11196) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Accessibility: Add accessible label to the "remove from share" button ([#11233](https://github.com/laurent22/joplin/issues/11233) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Accessibility: Add missing labels to the note attachments screen and master password dialog ([#11231](https://github.com/laurent22/joplin/issues/11231) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add new encryption methods based on native crypto libraries ([#10696](https://github.com/laurent22/joplin/issues/10696) by Self Not Found)
- New: Add setting to disable markup autocompletion ([#11222](https://github.com/laurent22/joplin/issues/11222) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add support for overwrite mode in the Markdown editor ([#11262](https://github.com/laurent22/joplin/issues/11262) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Plugins: Add support for editor plugins ([#11296](https://github.com/laurent22/joplin/issues/11296))
- New: Plugins: Added a renderMarkup command to render MD or HTML markup to HTML ([ff09937](https://github.com/laurent22/joplin/commit/ff09937))
- Improved: Accessibility: Declare app locale with the HTML lang attribute ([#11218](https://github.com/laurent22/joplin/issues/11218) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Make keyboard focus visible for dropdowns ([#11177](https://github.com/laurent22/joplin/issues/11177) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessiblity: Make keyboard shortcuts settings screen keyboard-navigable ([#11232](https://github.com/laurent22/joplin/issues/11232) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow Markdown editor search dialog to be localised ([#11219](https://github.com/laurent22/joplin/issues/11219) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow user to generate deletion logs ([#11083](https://github.com/laurent22/joplin/issues/11083)) ([#10664](https://github.com/laurent22/joplin/issues/10664) by [@pedr](https://github.com/pedr))
- Improved: By default disable pasting colors in RTE, and added option to enable it ([e16f452](https://github.com/laurent22/joplin/commit/e16f452))
- Improved: Multiple window support ([#11181](https://github.com/laurent22/joplin/issues/11181) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.4.0), @playwright/test (v1.45.3), compare-versions (v6.1.1), dayjs (v1.11.12), highlight.js (v11.10.0), jsdom (v24.1.1), sass (v1.77.8)
- Improved: Upgrade CodeMirror packages ([#11221](https://github.com/laurent22/joplin/issues/11221) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to Electron 32.2.0 ([#11200](https://github.com/laurent22/joplin/issues/11200) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Change Resource filetype detecting strategy ([#10907](https://github.com/laurent22/joplin/issues/10907)) ([#10653](https://github.com/laurent22/joplin/issues/10653) by [@pedr](https://github.com/pedr))
- Fixed: Fix drop cursor styling issue ([#11336](https://github.com/laurent22/joplin/issues/11336)) ([#11345](https://github.com/laurent22/joplin/issues/11345) by [@LEVIII007](https://github.com/LEVIII007))
- Fixed: Fix errors found by automated accessibility testing ([#11246](https://github.com/laurent22/joplin/issues/11246) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix list renumbering in the Markdown editor resets the first list item number to 1 ([#11220](https://github.com/laurent22/joplin/issues/11220) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed vertical alignment of checkboxes ([49e86d1](https://github.com/laurent22/joplin/commit/49e86d1))
- Fixed: Prevent disabling of textbox inputs after entering an incorrect password ([#11241](https://github.com/laurent22/joplin/issues/11241)) ([#10887](https://github.com/laurent22/joplin/issues/10887) by [@mrjo118](https://github.com/mrjo118))

## [v3.1.24](https://github.com/laurent22/joplin/releases/tag/v3.1.24) - 2024-11-09T15:08:29Z

- Security: Fix title rendering in GotoAnything search results ([#11356](https://github.com/laurent22/joplin/issues/11356) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Markdown editor: Auto-close backticks ([#11351](https://github.com/laurent22/joplin/issues/11351)) ([#11335](https://github.com/laurent22/joplin/issues/11335) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.23](https://github.com/laurent22/joplin/releases/tag/v3.1.23) - 2024-11-07T10:56:45Z

- Fixed: Fix Markdown editor cursor is invisible on empty lines ([#11316](https://github.com/laurent22/joplin/issues/11316)) ([#11313](https://github.com/laurent22/joplin/issues/11313) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.22](https://github.com/laurent22/joplin/releases/tag/v3.1.22) - 2024-11-05T08:59:32Z

- New: Custom CSS: Add cm-listItem class to lines with list items, don't add region start/end markers for items that are always single-line ([#11291](https://github.com/laurent22/joplin/issues/11291) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Re-enable media with local file URLs in the note viewer ([#11244](https://github.com/laurent22/joplin/issues/11244) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Remove left/right edge margin around editor content when disabled in settings ([#11290](https://github.com/laurent22/joplin/issues/11290)) ([#11279](https://github.com/laurent22/joplin/issues/11279) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix content dropped into the Markdown editor is missing a cursor preview or dropped at the wrong location ([#11289](https://github.com/laurent22/joplin/issues/11289)) ([#11274](https://github.com/laurent22/joplin/issues/11274) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.20](https://github.com/laurent22/joplin/releases/tag/v3.1.20) - 2024-10-22T12:21:32Z

- Fixed: Fix error screen shown on opening settings when an incompatible plugin is installed ([#11223](https://github.com/laurent22/joplin/issues/11223) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Security: Improve KaTeX error handling ([#11207](https://github.com/laurent22/joplin/issues/11207) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Security: Improve Markdown viewer link handling ([#11201](https://github.com/laurent22/joplin/issues/11201) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator)) (CVE-2024-49362 - Thank you @jackfromeast for reporting this issue)
- Security: Open more target="_blank" links in a browser ([#11212](https://github.com/laurent22/joplin/issues/11212) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.18](https://github.com/laurent22/joplin/releases/tag/v3.1.18) (Pre-release) - 2024-10-11T23:27:10Z

- New: Plugins: Add support for joplin.settings.values and deprecate joplin.settings.value ([715abcc](https://github.com/laurent22/joplin/commit/715abcc))
- Improved: Downgrade CodeMirror packages to fix various Android regressions ([#11170](https://github.com/laurent22/joplin/issues/11170) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Name webview root attribute so that it can be styled ([75b8caf](https://github.com/laurent22/joplin/commit/75b8caf))
- Improved: Remove Math Mode from the list of plugins incompatible with the new editor ([#11143](https://github.com/laurent22/joplin/issues/11143) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages glob (v10.4.5), katex (v0.16.11), types
- Fixed: Accessibility: Fix context menu button doesn't open the note list context menu (regression) ([#11175](https://github.com/laurent22/joplin/issues/11175) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix incorrect list switching behavior ([#11137](https://github.com/laurent22/joplin/issues/11137)) ([#11135](https://github.com/laurent22/joplin/issues/11135) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Improve performance by allowing note list background timers to be cancelled ([#11133](https://github.com/laurent22/joplin/issues/11133)) ([#11129](https://github.com/laurent22/joplin/issues/11129) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.17](https://github.com/laurent22/joplin/releases/tag/v3.1.17) (Pre-release) - 2024-09-26T11:57:54Z

- Improved: Enable again auto-updates ([058a559](https://github.com/laurent22/joplin/commit/058a559))
- New: Fix horizontal rule button when cursor is not on a new line ([#11085](https://github.com/laurent22/joplin/issues/11085) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Automatically detect and use operating system theme by default ([5beb80b](https://github.com/laurent22/joplin/commit/5beb80b))
- Improved: Updated packages glob (v10.4.2), jsdom (v24.1.0), sass (v1.77.6), turndown (v7.2.0)
- Fixed: Delete revisions on the sync target when deleted locally ([#11035](https://github.com/laurent22/joplin/issues/11035)) ([#11017](https://github.com/laurent22/joplin/issues/11017) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix ctrl/cmd-n can create new notes while the trash folder is selected ([#11092](https://github.com/laurent22/joplin/issues/11092) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Improve performance when there are many selected items ([#11067](https://github.com/laurent22/joplin/issues/11067)) ([#11065](https://github.com/laurent22/joplin/issues/11065) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin API: Save changes made with `editor.setText` ([#11117](https://github.com/laurent22/joplin/issues/11117)) ([#11105](https://github.com/laurent22/joplin/issues/11105) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: WebDAV synchronisation not working because of URL encoding differences ([#11076](https://github.com/laurent22/joplin/issues/11076)) ([#10608](https://github.com/laurent22/joplin/issues/10608) by [@pedr](https://github.com/pedr))

## [v3.1.15](https://github.com/laurent22/joplin/releases/tag/v3.1.15) (Pre-release) - 2024-09-17T09:15:10Z

- New: Accessibility: Add "Move to" context menu action for notebooks ([#11039](https://github.com/laurent22/joplin/issues/11039) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve text read by screen readers when focusing the note viewer ([#11030](https://github.com/laurent22/joplin/issues/11030) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve the performance of GoToAnything ([#11064](https://github.com/laurent22/joplin/issues/11064)) ([#11063](https://github.com/laurent22/joplin/issues/11063) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Seamless-Updates: generated and uploaded latest-mac-arm64.yml to GitHub Releases ([#11042](https://github.com/laurent22/joplin/issues/11042) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Update plugin compatibility layer to allow more legacy plugins (e.g. Markdown Prettier) to run ([#11033](https://github.com/laurent22/joplin/issues/11033) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages jsdom (v24), markdown-it-ins (v4), markdown-it-sup (v2), sass (v1.77.5)
- Improved: Upgrade CodeMirror packages ([#11034](https://github.com/laurent22/joplin/issues/11034) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fix multi-note selection menu not tab-focusable ([#11018](https://github.com/laurent22/joplin/issues/11018) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Encryption screen: Fix "invalid password" border shown for some correct passwords ([#11027](https://github.com/laurent22/joplin/issues/11027) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix clicking on most non-media resource links opens them inline ([#11022](https://github.com/laurent22/joplin/issues/11022)) ([#11020](https://github.com/laurent22/joplin/issues/11020) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix editor/viewer loses focus when visible panels are changed with ctrl-l ([#11029](https://github.com/laurent22/joplin/issues/11029) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix table column and rows not being resizable on RTE ([#11037](https://github.com/laurent22/joplin/issues/11037)) ([#10560](https://github.com/laurent22/joplin/issues/10560) by [@pedr](https://github.com/pedr))
- Fixed: Fix unable to change incorrect decryption password if the same as the master password ([#11026](https://github.com/laurent22/joplin/issues/11026) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: MacOS: Fixed shortcut for permanent note deletion ([41b03f9](https://github.com/laurent22/joplin/commit/41b03f9))
- Fixed: Table options not visible on dark theme ([#11036](https://github.com/laurent22/joplin/issues/11036)) ([#10561](https://github.com/laurent22/joplin/issues/10561) by [@pedr](https://github.com/pedr))

## [v3.1.8](https://github.com/laurent22/joplin/releases/tag/v3.1.8) (Pre-release) - 2024-09-08T20:32:44Z

- Improved: Seamless-Updates - rename latest-mac.yml to latest-mac-arm64.yml ([#10985](https://github.com/laurent22/joplin/issues/10985) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Updated packages @playwright/test (v1.44.1), sass (v1.77.4), tesseract.js (v5.1.0)
- Fixed: Decrypt master keys only as needed ([#10990](https://github.com/laurent22/joplin/issues/10990)) ([#10856](https://github.com/laurent22/joplin/issues/10856) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Removed unneeded electron-log dependency ([#10865](https://github.com/laurent22/joplin/issues/10865))

## [v3.1.6](https://github.com/laurent22/joplin/releases/tag/v3.1.6) (Pre-release) - 2024-09-02T13:19:40Z

- New: Add left/right arrow keys as expand/collapse shortcuts for notebooks ([#10944](https://github.com/laurent22/joplin/issues/10944) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Seamless-Updates: added latest-mac-arm64.yml ([#10941](https://github.com/laurent22/joplin/issues/10941) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Accessibility: Improve note list keyboard and screen reader accessibility ([#10940](https://github.com/laurent22/joplin/issues/10940) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Seamless-Updates - added tests for autoUpdaterService ([#10935](https://github.com/laurent22/joplin/issues/10935) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Updated packages @playwright/test (v1.43.1), async-mutex (v0.5.0), dayjs (v1.11.11), glob (v10.3.16), re-resizable (v6.9.17), react, sass (v1.76.0), sharp (v0.33.4)
- Fixed: Windows portable: Fix keychain-backed storage incorrectly enabled ([#10942](https://github.com/laurent22/joplin/issues/10942) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.4](https://github.com/laurent22/joplin/releases/tag/v3.1.4) (Pre-release) - 2024-08-27T17:46:38Z

- Improved: Accessibility: Improve note title focus handling ([#10932](https://github.com/laurent22/joplin/issues/10932) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Added feature flag to disable sync lock support ([#10925](https://github.com/laurent22/joplin/issues/10925)) ([#10407](https://github.com/laurent22/joplin/issues/10407))
- Improved: Make feature flags advanced settings by default ([700ffa2](https://github.com/laurent22/joplin/commit/700ffa2))
- Improved: Seamless-Updates: implemented flow for prereleases ([#10892](https://github.com/laurent22/joplin/issues/10892) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Updated packages @fortawesome/react-fontawesome (v0.2.2), @rollup/plugin-commonjs (v25.0.8)
- Fixed: Fix "Enable auto-updates" enabled by default and visible on unsupported platforms ([#10897](https://github.com/laurent22/joplin/issues/10897)) ([#10896](https://github.com/laurent22/joplin/issues/10896) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix BMP image rendering in the Markdown viewer ([#10915](https://github.com/laurent22/joplin/issues/10915)) ([#10914](https://github.com/laurent22/joplin/issues/10914) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix Fix editing notes in "Conflicts" causes them to temporarily vanish ([#10913](https://github.com/laurent22/joplin/issues/10913)) ([#10737](https://github.com/laurent22/joplin/issues/10737) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix alt+up/alt+down fails to re-order multiple lines ([#10899](https://github.com/laurent22/joplin/issues/10899)) ([#10895](https://github.com/laurent22/joplin/issues/10895) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix viewer and panel plugins that check for the presence of `exports` fail to load ([#10900](https://github.com/laurent22/joplin/issues/10900) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed italic support in Fountain documents ([5fdd088](https://github.com/laurent22/joplin/commit/5fdd088))
- Fixed: Markdown editor: Fix toggling bulleted lists when items start with asterisks ([#10902](https://github.com/laurent22/joplin/issues/10902)) ([#10891](https://github.com/laurent22/joplin/issues/10891) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Security: Fix HTML parsing bug ([#10876](https://github.com/laurent22/joplin/issues/10876)) (reported by [@febou92](https://github.com/febou92))

## [v3.0.15](https://github.com/laurent22/joplin/releases/tag/v3.0.15) - 2024-08-21T09:19:58Z

- Fixed: Improve the reliability of fetching resources ([#10826](https://github.com/laurent22/joplin/issues/10826)) ([#10740](https://github.com/laurent22/joplin/issues/10740) by [@pedr](https://github.com/pedr))
- Security: Fix HTML parsing bug ([#10876](https://github.com/laurent22/joplin/issues/10876)) (reported by [@febou92](https://github.com/febou92))

## [v3.1.3](https://github.com/laurent22/joplin/releases/tag/v3.1.3) (Pre-release) - 2024-08-17T13:08:21Z

- Improved: Rich Text Editor: Add eight spaces when pressing tab ([#10880](https://github.com/laurent22/joplin/issues/10880)) ([#5762](https://github.com/laurent22/joplin/issues/5762) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Seamless-Updates: added flow for automatic updates for releases ([#10857](https://github.com/laurent22/joplin/issues/10857) by [@AliceHincu](https://github.com/AliceHincu))
- Fixed: Improve the reliability of fetching resources ([#10826](https://github.com/laurent22/joplin/issues/10826)) ([#10740](https://github.com/laurent22/joplin/issues/10740) by [@pedr](https://github.com/pedr))

## [v3.1.2](https://github.com/laurent22/joplin/releases/tag/v3.1.2) (Pre-release) - 2024-08-16T09:00:59Z

- Improved: Allow searching when only the note viewer is visible and sync search with editor ([#10866](https://github.com/laurent22/joplin/issues/10866) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Seamless-Updates: generate latest-mac.yml file ([#10869](https://github.com/laurent22/joplin/issues/10869) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Updated packages @fortawesome/react-fontawesome (v0.2.1)
- Improved: Upgrade electron to v29.4.5 ([#10847](https://github.com/laurent22/joplin/issues/10847) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.1.1](https://github.com/laurent22/joplin/releases/tag/v3.1.1) (Pre-release) - 2024-08-10T11:36:02Z

- New: Accessibility: Add missing labels and role information to several controls ([#10788](https://github.com/laurent22/joplin/issues/10788) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve focus handling for plugin and prompt dialogs ([#10801](https://github.com/laurent22/joplin/issues/10801) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve keyboard navigation in the Markdown and note toolbar ([#10819](https://github.com/laurent22/joplin/issues/10819) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve settings screen keyboard navigation and screen reader accessibility ([#10812](https://github.com/laurent22/joplin/issues/10812) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Restore keyboard focus when closing a dialog ([#10817](https://github.com/laurent22/joplin/issues/10817) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow specifying custom language data URLs ([#10846](https://github.com/laurent22/joplin/issues/10846)) ([#10835](https://github.com/laurent22/joplin/issues/10835) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Fix "View OCR text" not present in context menu when right-clicking an image ([#10842](https://github.com/laurent22/joplin/issues/10842)) ([#10746](https://github.com/laurent22/joplin/issues/10746) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve RTL support in the Markdown editor ([#10810](https://github.com/laurent22/joplin/issues/10810) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve focus handling for notebook edit, share, and sync dialogs ([#10779](https://github.com/laurent22/joplin/issues/10779) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Make the beta markdown editor the default ([#10796](https://github.com/laurent22/joplin/issues/10796)) ([#9450](https://github.com/laurent22/joplin/issues/9450) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Move the note viewer to a separate process ([#10678](https://github.com/laurent22/joplin/issues/10678)) ([#10424](https://github.com/laurent22/joplin/issues/10424) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Rich Text Editor: Preserve cursor location when updating editor content ([#10781](https://github.com/laurent22/joplin/issues/10781) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Seamless-Updates - creation of update notification ([#10791](https://github.com/laurent22/joplin/issues/10791) by [@AliceHincu](https://github.com/AliceHincu))
- Improved: Set min version for synchronising to 3.0.0 ([a1f9c9c](https://github.com/laurent22/joplin/commit/a1f9c9c))
- Improved: Update bundled Backup plugin to v1.4.2 ([#10760](https://github.com/laurent22/joplin/issues/10760) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages glob (v10.3.12), jsdom (v23.2.0), sharp (v0.33.3), style-to-js (v1.1.12), tar (v6.2.1)
- Improved: Use Electron `safeStorage` for keychain support ([#10535](https://github.com/laurent22/joplin/issues/10535) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Use relative time in note list for today and yesterday ([1437dd5](https://github.com/laurent22/joplin/commit/1437dd5))
- Fixed: Accessibility: Fix screen reader doesn't read Goto Anything search results or help button label ([#10816](https://github.com/laurent22/joplin/issues/10816) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: External editing: Fix notes often not updated when saved from Vim ([#10780](https://github.com/laurent22/joplin/issues/10780)) ([#10672](https://github.com/laurent22/joplin/issues/10672) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix Enter key submits dialogs even if a button has focus ([#10814](https://github.com/laurent22/joplin/issues/10814)) ([#10815](https://github.com/laurent22/joplin/issues/10815) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix crash on opening certain plugin dialogs ([#10838](https://github.com/laurent22/joplin/issues/10838) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error in plugin content scripts generated with Webpack ([#10680](https://github.com/laurent22/joplin/issues/10680) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error when canceling bulk PDF export ([#10839](https://github.com/laurent22/joplin/issues/10839)) ([#10828](https://github.com/laurent22/joplin/issues/10828) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix images fail to render in the preview pane for HTML notes ([#10806](https://github.com/laurent22/joplin/issues/10806) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix joplin install fails because ldconfig not found libfuse2 but it is indeed installed. ([#10717](https://github.com/laurent22/joplin/issues/10717)) ([#10716](https://github.com/laurent22/joplin/issues/10716) by [@sysescool](https://github.com/sysescool))
- Fixed: Fix math is invisible in certain mermaid diagrams ([#10820](https://github.com/laurent22/joplin/issues/10820)) ([#10785](https://github.com/laurent22/joplin/issues/10785) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix not-yet-created images lost while editing with the Rich Text Editor ([#10734](https://github.com/laurent22/joplin/issues/10734)) ([#10733](https://github.com/laurent22/joplin/issues/10733) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix prompt tag dialog input can be wider than its container ([#10818](https://github.com/laurent22/joplin/issues/10818) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Make `:w` trigger sync in the beta editor's Vim mode ([#10778](https://github.com/laurent22/joplin/issues/10778)) ([#10768](https://github.com/laurent22/joplin/issues/10768) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Show notification in case Joplin Cloud credential is not valid anymore ([#10649](https://github.com/laurent22/joplin/issues/10649)) ([#10645](https://github.com/laurent22/joplin/issues/10645) by [@pedr](https://github.com/pedr))
- Fixed: Tags and Delete note not being available on Search and on All Notes list ([#10729](https://github.com/laurent22/joplin/issues/10729)) ([#10668](https://github.com/laurent22/joplin/issues/10668) by [@pedr](https://github.com/pedr))

## [v2.14.23](https://github.com/laurent22/joplin/releases/tag/v2.14.23) - 2024-08-07T11:15:25Z

- Improved: Disable sync version check to allow compatibility between 2.14 and 3.0 for users who cannot upgrade ([a6cc5bd](https://github.com/laurent22/joplin/commit/a6cc5bd))

## [v3.0.14](https://github.com/laurent22/joplin/releases/tag/v3.0.14) - 2024-07-28T13:55:50Z

- Improved: Api: Do not return deleted notes in folders/: id/notes call ([3e0fb48](https://github.com/laurent22/joplin/commit/3e0fb48))
- Fixed: Fix incorrect text rendering on MacOS by changing the default font to `Avenir Next` ([#10686](https://github.com/laurent22/joplin/issues/10686)) ([#10679](https://github.com/laurent22/joplin/issues/10679) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix shift-delete asks to permanently delete the current note, rather than cut text, when the editor is selected. ([#10687](https://github.com/laurent22/joplin/issues/10687)) ([#10685](https://github.com/laurent22/joplin/issues/10685) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix sidebar performance regression with many nested notebooks ([#10676](https://github.com/laurent22/joplin/issues/10676)) ([#10674](https://github.com/laurent22/joplin/issues/10674) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.0.12](https://github.com/laurent22/joplin/releases/tag/v3.0.12) - 2024-07-02T17:11:14Z

- Improved: Set min version for synchronising to 3.0.0 ([e4b8976](https://github.com/laurent22/joplin/commit/e4b8976))
- Fixed: Show notification in case Joplin Cloud credential is not valid anymore ([#10649](https://github.com/laurent22/joplin/issues/10649)) ([#10645](https://github.com/laurent22/joplin/issues/10645) by [@pedr](https://github.com/pedr))

## [v3.0.11](https://github.com/laurent22/joplin/releases/tag/v3.0.11) (Pre-release) - 2024-06-29T10:20:02Z

- Updated Chinese and German translation

## [v3.0.10](https://github.com/laurent22/joplin/releases/tag/v3.0.10) (Pre-release) - 2024-06-19T15:24:07Z

- Improved: Don't render empty title page for Fountain ([#10631](https://github.com/laurent22/joplin/issues/10631) by [@XPhyro](https://github.com/XPhyro))
- Improved: Start synchronisation just after login is complete ([#10574](https://github.com/laurent22/joplin/issues/10574) by [@pedr](https://github.com/pedr))
- Improved: Updated packages chokidar (v3.6.0), css-loader (v6.10.0), follow-redirects (v1.15.6), jsdom (v23), sass (v1.71.0), style-to-js (v1.1.11), turndown (v7.1.3)
- Fixed: Prevent application from crashing when the syncInfoCache is corrupted ([#10546](https://github.com/laurent22/joplin/issues/10546)) ([#10030](https://github.com/laurent22/joplin/issues/10030) by [@pedr](https://github.com/pedr))
- Fixed: Don't re-order the note list when in search ([#10587](https://github.com/laurent22/joplin/issues/10587)) ([#10586](https://github.com/laurent22/joplin/issues/10586) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: English: Use the plural form of a localization for negative and zero items ([#10582](https://github.com/laurent22/joplin/issues/10582)) ([#10581](https://github.com/laurent22/joplin/issues/10581) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix paste adds newlines in the Rich Text Editor when certain plugins are enabled ([#10635](https://github.com/laurent22/joplin/issues/10635)) ([#10061](https://github.com/laurent22/joplin/issues/10061) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixes error when Joplin Cloud login is finished before the settings are saved ([#10575](https://github.com/laurent22/joplin/issues/10575) by [@pedr](https://github.com/pedr))

## [v3.0.9](https://github.com/laurent22/joplin/releases/tag/v3.0.9) (Pre-release) - 2024-06-12T19:07:50Z

- New: Add Joplin Cloud account information to configuration screen ([#10553](https://github.com/laurent22/joplin/issues/10553) by [@pedr](https://github.com/pedr))
- New: Add button on Synchronization to Joplin Cloud login screen ([#10569](https://github.com/laurent22/joplin/issues/10569) by [@pedr](https://github.com/pedr))
- Improved: Display description for settings field in the plugin customization screen ([#10469](https://github.com/laurent22/joplin/issues/10469)) ([#9959](https://github.com/laurent22/joplin/issues/9959) by [@pedr](https://github.com/pedr))
- Improved: Hide links to login after process is successful ([#10571](https://github.com/laurent22/joplin/issues/10571) by [@pedr](https://github.com/pedr))
- Improved: Re-render note when resources are changed ([#10459](https://github.com/laurent22/joplin/issues/10459) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Rich Text Editor: Allow toggling bulleted and numbered lists from the command palette ([#10559](https://github.com/laurent22/joplin/issues/10559) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Significantly reduces size of exported HTML files in most cases ([32710e4](https://github.com/laurent22/joplin/commit/32710e4))
- Improved: Update Mermaid to v10.9.1 ([#10475](https://github.com/laurent22/joplin/issues/10475) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages css-loader (v6.9.1), js-sha512 (v0.9.0), react, sass (v1.70.0), tesseract.js (v5.0.5)
- Improved: Upgrade KaTeX to v0.16.10 ([#10570](https://github.com/laurent22/joplin/issues/10570) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Beta editor: Fix crash when switching between notes that use CRLF line endings ([#10531](https://github.com/laurent22/joplin/issues/10531) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix focusing the note list doesn't work when the selected note is off screen ([#10515](https://github.com/laurent22/joplin/issues/10515)) ([#10514](https://github.com/laurent22/joplin/issues/10514) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix importing completed tasks ([#10528](https://github.com/laurent22/joplin/issues/10528) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix new note and to-do buttons greyed when initial selection is "all notes" or a tag ([#10434](https://github.com/laurent22/joplin/issues/10434)) ([#10230](https://github.com/laurent22/joplin/issues/10230) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix note disappears while editing during search ([#10568](https://github.com/laurent22/joplin/issues/10568)) ([#10236](https://github.com/laurent22/joplin/issues/10236) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix plugin settings stored in `settings.json` are lost on startup ([#10458](https://github.com/laurent22/joplin/issues/10458)) ([#10381](https://github.com/laurent22/joplin/issues/10381) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix tables missing source map attributes ([#10516](https://github.com/laurent22/joplin/issues/10516)) ([#10466](https://github.com/laurent22/joplin/issues/10466) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix wrong text selected when adding a link in the beta editor ([#10542](https://github.com/laurent22/joplin/issues/10542)) ([#10538](https://github.com/laurent22/joplin/issues/10538) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Images from behind a login cannot be pasted in RTE ([#10224](https://github.com/laurent22/joplin/issues/10224))
- Fixed: Rich text editor: Include "ctrl-click to open" in link tooltips ([#10547](https://github.com/laurent22/joplin/issues/10547)) ([#10199](https://github.com/laurent22/joplin/issues/10199) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Sort the note list soon after changing a note's title ([#10512](https://github.com/laurent22/joplin/issues/10512)) ([#10284](https://github.com/laurent22/joplin/issues/10284) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Watch resources for changes when opened from the Rich Text Editor ([#10554](https://github.com/laurent22/joplin/issues/10554)) ([#10551](https://github.com/laurent22/joplin/issues/10551) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Work around checkbox toggle broken when editor is hidden ([#10534](https://github.com/laurent22/joplin/issues/10534)) ([#10416](https://github.com/laurent22/joplin/issues/10416) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.0.8](https://github.com/laurent22/joplin/releases/tag/v3.0.8) (Pre-release) - 2024-05-22T14:20:45Z

- New: Api: Add support for note.source property ([a747828](https://github.com/laurent22/joplin/commit/a747828))
- Improved: Added capability to toggle visibility of the Menu Bar from the View menu ([#10324](https://github.com/laurent22/joplin/issues/10324)) ([#1752](https://github.com/laurent22/joplin/issues/1752) by [@LightTreasure](https://github.com/LightTreasure))
- Improved: Api: Exclude deleted and conflicted notes when calling /notes ([57c316a](https://github.com/laurent22/joplin/commit/57c316a))
- Improved: Improves formatting of log statements ([aac8d58](https://github.com/laurent22/joplin/commit/aac8d58))
- Improved: Note attachments screen: Allow searching for attachments ([#10442](https://github.com/laurent22/joplin/issues/10442) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Sidebar: Remove redundant focus indicator ([#10443](https://github.com/laurent22/joplin/issues/10443) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix cursor jumps to the top of the note editor on sync ([#10456](https://github.com/laurent22/joplin/issues/10456)) ([#8960](https://github.com/laurent22/joplin/issues/8960) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix default values for plugin settings stored in `settings.json` not applied ([#10383](https://github.com/laurent22/joplin/issues/10383)) ([#10382](https://github.com/laurent22/joplin/issues/10382) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix logger tests by adding time ([#10433](https://github.com/laurent22/joplin/issues/10433) by [@pedr](https://github.com/pedr))
- Fixed: Fix nonbreaking spaces and CRLF break search for adjacent words ([#10417](https://github.com/laurent22/joplin/issues/10417) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed an issue that could cause certain notes not to render when they contain an empty STYLE tag ([0a766d7](https://github.com/laurent22/joplin/commit/0a766d7))
- Fixed: Maintain cursor position when changing list indentation ([#10441](https://github.com/laurent22/joplin/issues/10441)) ([#10439](https://github.com/laurent22/joplin/issues/10439) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Security: Arbitrary JavaScript execution in PDF.js (CVE-2024-4367) ([#10450](https://github.com/laurent22/joplin/issues/10450) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v2.14.22](https://github.com/laurent22/joplin/releases/tag/v2.14.22) - 2024-05-22T19:19:02Z

- Security: Arbitrary JavaScript execution in PDF.js (CVE-2024-4367) ([#10450](https://github.com/laurent22/joplin/issues/10450) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.0.6](https://github.com/laurent22/joplin/releases/tag/v3.0.6) (Pre-release) - 2024-04-27T13:16:04Z

- New: Add context menu item to view OCR text of an attachment ([8bdec4c](https://github.com/laurent22/joplin/commit/8bdec4c))
- New: Added search list for configuration font input fields ([#10248](https://github.com/laurent22/joplin/issues/10248) by [@ab-elhaddad](https://github.com/ab-elhaddad))
- Improved: Attach log to crash dump when the application crashes ([c5dfa4c](https://github.com/laurent22/joplin/commit/c5dfa4c))
- Improved: Display a message when Joplin Cloud user don't have access to email to note feature ([#10322](https://github.com/laurent22/joplin/issues/10322) by [@pedr](https://github.com/pedr))
- Improved: Do not trim markdown upon saving in rich text ([#10321](https://github.com/laurent22/joplin/issues/10321)) ([#10315](https://github.com/laurent22/joplin/issues/10315) by [@chaNcharge](https://github.com/chaNcharge))
- Improved: Improved log formatting and allow saving last lines of log to memory ([74bc9b3](https://github.com/laurent22/joplin/commit/74bc9b3))
- Improved: Refactor sidebar to better handle thousands of tags and notebooks ([#10331](https://github.com/laurent22/joplin/issues/10331)) ([#4251](https://github.com/laurent22/joplin/issues/4251) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support URLs in plugin API imaging.createFromPath ([#10334](https://github.com/laurent22/joplin/issues/10334))
- Improved: Ubuntu 24.04: Work around unprivileged user namespace restrictions by adding the --no-sandbox flag to the launcher ([#10338](https://github.com/laurent22/joplin/issues/10338)) ([#10332](https://github.com/laurent22/joplin/issues/10332) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.3.3)
- Fixed: After deleting the last note from the conflicts folder, the application state is invalid ([#10189](https://github.com/laurent22/joplin/issues/10189))
- Fixed: Display correct sorting icon ([#10283](https://github.com/laurent22/joplin/issues/10283))
- Fixed: Do not invite user to create new notes in the trash folder ([#10356](https://github.com/laurent22/joplin/issues/10356)) ([#10191](https://github.com/laurent22/joplin/issues/10191) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix "new notebook" shown in context menu when right-clicking on the "Tags" header ([#10378](https://github.com/laurent22/joplin/issues/10378) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix note disappears while editing ([#10370](https://github.com/laurent22/joplin/issues/10370)) ([#10194](https://github.com/laurent22/joplin/issues/10194) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed error when processing certain PDF files for OCR ([#10056](https://github.com/laurent22/joplin/issues/10056))
- Fixed: Linux: Allow passing `--enable-wayland-ime` flag to fix input method issues on startup ([#10349](https://github.com/laurent22/joplin/issues/10349)) ([#10345](https://github.com/laurent22/joplin/issues/10345) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Old.reddit pages are not saved correctly as HTML by the Web Clipper ([#10274](https://github.com/laurent22/joplin/issues/10274))
- Fixed: Search results from API change when fields param is used ([#10088](https://github.com/laurent22/joplin/issues/10088))
- Fixed: When web clipper clipping code blocks, keep code in multiline and delete code number lines ([#10126](https://github.com/laurent22/joplin/issues/10126)) ([#5626](https://github.com/laurent22/joplin/issues/5626) by [@wljince007](https://github.com/wljince007))

## [v3.0.3](https://github.com/laurent22/joplin/releases/tag/v3.0.3) (Pre-release) - 2024-04-18T15:41:38Z

- Improved: Allow creating plugins that process pasted text in the beta editor ([#10310](https://github.com/laurent22/joplin/issues/10310) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow marking a plugin as mobile-only or desktop-only ([#10229](https://github.com/laurent22/joplin/issues/10229)) ([#10206](https://github.com/laurent22/joplin/issues/10206) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow marking sync errors as ignored in "sync status" ([#10290](https://github.com/laurent22/joplin/issues/10290) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow sorting by due date and completion date in detailed note list ([#5819](https://github.com/laurent22/joplin/issues/5819))
- Improved: Avoid unnecessary requests if Joplin Cloud credentials are empty ([#10256](https://github.com/laurent22/joplin/issues/10256) by [@pedr](https://github.com/pedr))
- Improved: Bump @codemirror/view version. ([#10174](https://github.com/laurent22/joplin/issues/10174) by [@itzTheMeow](https://github.com/itzTheMeow))
- Improved: Improve focus handling ([00084c5](https://github.com/laurent22/joplin/commit/00084c5))
- Improved: Make tables horizontally scrollable ([#10161](https://github.com/laurent22/joplin/issues/10161) by [@wljince007](https://github.com/wljince007))
- Improved: Plugin API: Add support for loading PDFs with the imaging API ([#10177](https://github.com/laurent22/joplin/issues/10177)) ([#9794](https://github.com/laurent22/joplin/issues/9794) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update farsi/persian translation fa.po ([#10181](https://github.com/laurent22/joplin/issues/10181) by [@mimeyn](https://github.com/mimeyn))
- Improved: Upgrade the built-in Backup plugin to version 1.4.1 ([#10197](https://github.com/laurent22/joplin/issues/10197) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Added hover effect to detailed renderer ([#10213](https://github.com/laurent22/joplin/issues/10213)) ([#10196](https://github.com/laurent22/joplin/issues/10196) by [@Mohamad-Shiro](https://github.com/Mohamad-Shiro))
- Fixed: Detailed note list doesn't follow preferred date and time formats ([#10204](https://github.com/laurent22/joplin/issues/10204)) ([#10182](https://github.com/laurent22/joplin/issues/10182) by [@cagnusmarlsen](https://github.com/cagnusmarlsen))
- Fixed: Email to note address not presented in configuration screen before synchronisation ([#10293](https://github.com/laurent22/joplin/issues/10293)) ([#10292](https://github.com/laurent22/joplin/issues/10292) by [@pedr](https://github.com/pedr))
- Fixed: Fix "open profile directory" shows a warning message ([#10294](https://github.com/laurent22/joplin/issues/10294) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix dragging notebooks to the toplevel notebook ([#10302](https://github.com/laurent22/joplin/issues/10302)) ([#10067](https://github.com/laurent22/joplin/issues/10067) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed auto scrolling with moving a note ([#10193](https://github.com/laurent22/joplin/issues/10193)) ([#10078](https://github.com/laurent22/joplin/issues/10078) by [@Mohamad-Shiro](https://github.com/Mohamad-Shiro))
- Fixed: Fixed error when exporting certain notes that contain plugin content ([f85db14](https://github.com/laurent22/joplin/commit/f85db14))
- Fixed: Fixed rendering of alarm time in detailed note list ([5b4477f](https://github.com/laurent22/joplin/commit/5b4477f))
- Fixed: Fixed sorting labels ([42900bc](https://github.com/laurent22/joplin/commit/42900bc))
- Fixed: Focus is lost when the hyperlink modal is cancelled ([#10258](https://github.com/laurent22/joplin/issues/10258)) ([#9970](https://github.com/laurent22/joplin/issues/9970) by Fabio Neto)
- Fixed: Link pased in RTE editor is not underlined until switch to another note ([#10202](https://github.com/laurent22/joplin/issues/10202)) ([#9950](https://github.com/laurent22/joplin/issues/9950) by [@danimnunes](https://github.com/danimnunes))
- Fixed: Plugin API: Fix unable to require `@codemirror/search`  ([#10205](https://github.com/laurent22/joplin/issues/10205) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Toggle external editing button overlaps with bold button. ([#10069](https://github.com/laurent22/joplin/issues/10069)) ([#10025](https://github.com/laurent22/joplin/issues/10025) by [@JanhaviAlekar](https://github.com/JanhaviAlekar))
- Fixed: When creating a note or to-do, focus is not set correctly ([#10108](https://github.com/laurent22/joplin/issues/10108))
- Security: Make attachment and file links safer ([#10250](https://github.com/laurent22/joplin/issues/10250) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [v3.0.2](https://github.com/laurent22/joplin/releases/tag/v3.0.2) (Pre-release) - 2024-03-21T18:18:49Z

- New: Add support for multiple columns note list ([#9924](https://github.com/laurent22/joplin/issues/9924))
- New: Api: Add capability of limiting downloads ([#9788](https://github.com/laurent22/joplin/issues/9788) by [@pedr](https://github.com/pedr))
- New: Add trash folder ([#9671](https://github.com/laurent22/joplin/issues/9671)) ([#483](https://github.com/laurent22/joplin/issues/483))
- Improved: Allow 'All Notes' to have 'Toggle own sort order' ([#10021](https://github.com/laurent22/joplin/issues/10021)) ([#9984](https://github.com/laurent22/joplin/issues/9984) by [@HahaBill](https://github.com/HahaBill))
- Improved: Beta editor: Fix search results not highlighted ([#9928](https://github.com/laurent22/joplin/issues/9928)) ([#9927](https://github.com/laurent22/joplin/issues/9927) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Change Joplin Cloud login process to allow MFA via browser ([#9445](https://github.com/laurent22/joplin/issues/9445) by [@pedr](https://github.com/pedr))
- Improved: Configure RTE to handle the first table row as header ([#10059](https://github.com/laurent22/joplin/issues/10059) by [@Marph](https://github.com/Marph))
- Improved: Fix Vim keymap error with beta editor ([#10049](https://github.com/laurent22/joplin/issues/10049)) ([#9981](https://github.com/laurent22/joplin/issues/9981) by [@RadCod3](https://github.com/RadCod3))
- Improved: Fix conflicts notebook doesn't work with the trash feature ([#10104](https://github.com/laurent22/joplin/issues/10104)) ([#10073](https://github.com/laurent22/joplin/issues/10073) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Fix hiding the note preview pane is very slow for large notes ([#10006](https://github.com/laurent22/joplin/issues/10006)) ([#9890](https://github.com/laurent22/joplin/issues/9890) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Fixed text wrapping in Spellcheck button ([#10005](https://github.com/laurent22/joplin/issues/10005)) ([#9998](https://github.com/laurent22/joplin/issues/9998) by [@RadCod3](https://github.com/RadCod3))
- Improved: Improve beta editor support for the Rich Markdown plugin ([#9935](https://github.com/laurent22/joplin/issues/9935) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve support for plugins in the Rich Text Editor (implement `webviewApi.postMesage`) ([#10158](https://github.com/laurent22/joplin/issues/10158)) ([#8931](https://github.com/laurent22/joplin/issues/8931) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Link "browse all plugins" to joplinapp.org/plugins ([#10113](https://github.com/laurent22/joplin/issues/10113) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Log user actions (deletions) ([#9585](https://github.com/laurent22/joplin/issues/9585)) ([#9465](https://github.com/laurent22/joplin/issues/9465) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Prevent race condition when download limit is reached ([#10124](https://github.com/laurent22/joplin/issues/10124) by [@pedr](https://github.com/pedr))
- Improved: Support Ctrl+Enter keyboard shortcut (Cmd+Enter on MacOS) ([#10003](https://github.com/laurent22/joplin/issues/10003)) ([#9980](https://github.com/laurent22/joplin/issues/9980) by [@cagnusmarlsen](https://github.com/cagnusmarlsen))
- Improved: Upgrade CodeMirror 6 packages ([#10032](https://github.com/laurent22/joplin/issues/10032)) ([#10031](https://github.com/laurent22/joplin/issues/10031) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to Electron 29 ([#10110](https://github.com/laurent22/joplin/issues/10110) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Beta editor plugins: Fix opening and closing settings can break some plugins with legacy code ([#10024](https://github.com/laurent22/joplin/issues/10024)) ([#10023](https://github.com/laurent22/joplin/issues/10023) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Beta markdown editor: Support overriding built-in keyboard shortcuts ([#10022](https://github.com/laurent22/joplin/issues/10022)) ([#10020](https://github.com/laurent22/joplin/issues/10020) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Command palette not showing note title ([#9961](https://github.com/laurent22/joplin/issues/9961)) ([#9919](https://github.com/laurent22/joplin/issues/9919) by [@pedr](https://github.com/pedr))
- Fixed: Creating a profile changes the language of Joplin ([#10038](https://github.com/laurent22/joplin/issues/10038)) ([#9960](https://github.com/laurent22/joplin/issues/9960) by [@cagnusmarlsen](https://github.com/cagnusmarlsen))
- Fixed: Filter Sync Target Info Logs ([#10014](https://github.com/laurent22/joplin/issues/10014)) ([#9985](https://github.com/laurent22/joplin/issues/9985) by Sagnik Mandal)
- Fixed: Fix "New note" button rendering when startup with Trash can selected. ([#10076](https://github.com/laurent22/joplin/issues/10076)) ([#10060](https://github.com/laurent22/joplin/issues/10060) by [@khuongduy354](https://github.com/khuongduy354))
- Fixed: Fix text not shown in plugin message boxes ([#10084](https://github.com/laurent22/joplin/issues/10084)) ([#10082](https://github.com/laurent22/joplin/issues/10082) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed Toggle Comment & Delete/Duplicate/Sort Line Options in Beta Editor ([#10016](https://github.com/laurent22/joplin/issues/10016)) ([#10007](https://github.com/laurent22/joplin/issues/10007) by Sagnik Mandal)
- Fixed: Fixed sizing of new note buttons ([9acbac6](https://github.com/laurent22/joplin/commit/9acbac6))
- Fixed: Improve visibility of selected note in OLED dark theme ([#10026](https://github.com/laurent22/joplin/issues/10026)) ([#9453](https://github.com/laurent22/joplin/issues/9453) by [@Mr-Kanister](https://github.com/Mr-Kanister))
- Fixed: Preserve indentation from plain text when pasting on Rich Text Editor ([#9828](https://github.com/laurent22/joplin/issues/9828)) ([#9264](https://github.com/laurent22/joplin/issues/9264) by [@pedr](https://github.com/pedr))
- Fixed: Show focus indicator when navigating with keyboard ([#9989](https://github.com/laurent22/joplin/issues/9989)) ([#9982](https://github.com/laurent22/joplin/issues/9982) by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Special characters in notebooks and tags are not sorted alphabetically ([#10085](https://github.com/laurent22/joplin/issues/10085)) ([#10077](https://github.com/laurent22/joplin/issues/10077) by [@cagnusmarlsen](https://github.com/cagnusmarlsen))

## [v2.14.20](https://github.com/laurent22/joplin/releases/tag/v2.14.20) - 2024-03-18T17:05:17Z

- Fixed: Fix OCR not working for certain languages ([#10097](https://github.com/laurent22/joplin/issues/10097))
- Fixed: ENEX does not import correctly when title of note matches the name of the attachment ([#10125](https://github.com/laurent22/joplin/issues/10125))