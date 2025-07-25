# Joplin Android Changelog

## [android-v3.4.1](https://github.com/laurent22/joplin/releases/tag/android-v3.4.1) (Pre-release) - 2025-07-24T10:57:44Z

- New: Add Joplin Server SAML support (#11865 by [@ttcchhmm](https://github.com/ttcchhmm))
- New: Add delete line, duplicate line and sort selected lines buttons to editor toolbar (#12555 by [@mrjo118](https://github.com/mrjo118))
- New: Add missing title to the revision viewer for mobile (#12611 by [@mrjo118](https://github.com/mrjo118))
- New: Add note revision viewer (#12305 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add support for scanning multi-page documents (#12635 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Voice typing: Add setting to allow specifying a glossary (#12370 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Auto-fill the editor search input with the global search (#12291 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Add information about failing tests of OneNote importer inside test names  (#12159) (#12157 by [@pedr](https://github.com/pedr))
- Improved: Adjust list toggle behavior for consistency with other apps (#12360) (#11845 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow recording to continue while the app is in the background (#12330 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Change revisions to be presented in reverse order in the dropdown (#12406 by [@mrjo118](https://github.com/mrjo118))
- Improved: Default to a larger voice typing model (#12352 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Extend the maximum note history expiry days to 99999 (#12374 by [@mrjo118](https://github.com/mrjo118))
- Improved: Implement tag screen redesign (#12551 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Increase space available for revisions dropdown (#12379 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Joplin Cloud/Server: Support publishing notes (#12350 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Move the conflicts folder to the top of the notebook list to improve visibility (#12688) (#12594 by [@mrjo118](https://github.com/mrjo118))
- Improved: Set new encryption methods as default (#12229 by Self Not Found)
- Improved: Switch library used for biometrics (#12682 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update js-draw to v1.30.0 (#12322 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.4.2), @babel/plugin-transform-export-namespace-from (v7.25.9), @react-native-clipboard/clipboard (v1.16.2), @react-native-community/cli (v16.0.3), @react-native-community/cli-platform-android (v16.0.3), @react-native-community/cli-platform-ios (v16.0.3), @react-native-community/geolocation (v3.4.0), @rollup/plugin-commonjs (v28.0.3), @rollup/plugin-node-resolve (v16.0.1), @rollup/plugin-replace (v6.0.2), crypto-browserify (v3.12.1), dayjs (v1.11.13), domutils (v3.2.2), form-data (v4.0.2), glob (v11.0.2), highlight.js (v11.11.1), jsdom (v25), katex (v0.16.22), license-checker-rseidelsohn (v4.4.2), mermaid (v11.6.0), nanoid (v3.3.9), node (v18.20.7), react, react-native-device-info (v14.0.4), react-native-image-picker (v7.2.3), react-native-localize (v3.4.1), react-native-modal-datetime-picker (v18), react-native-quick-crypto (v0.7.13), react-native-share (v12.0.9), react-native-vector-icons (v10.2.0), react-native-zip-archive (v7), sass (v1.86.3), sharp (v0.33.5), standard (v17.1.2), style-to-js (v1.1.16), tesseract.js (v5.1.1), uuid (v11.1.0), webpack-dev-server (v5.2.1)
- Improved: Upgrade to React Native 0.77 (#12179 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to React Native 0.79 (#12337 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Improve silence detection (#12404 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Update whisper.cpp to v1.7.5 (#12353 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Add ability to delete all history for individual notes (#12381) (#12097 by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix adding lists to blank lines using toolbar buttons (#12745) (#12744 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix camera screen (#12624 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix cursor jumps to the beginning of inputs on tap (#12499) (#12484 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix voice typing fails to start on certain devices (#12351 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Moving sub-notebook of shared notebook should unshare it (#12647) (#12089)

## [android-v3.3.11](https://github.com/laurent22/joplin/releases/tag/android-v3.3.11) (Pre-release) - 2025-07-09T22:51:55Z

- Fixed: Biometrics: Fix notebook list can still be accessed when the app is locked (#12691 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.10](https://github.com/laurent22/joplin/releases/tag/android-v3.3.10) (Pre-release) - 2025-06-10T08:07:25Z

- New: Add additional checks when updating sidebar state (#12428 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.9](https://github.com/laurent22/joplin/releases/tag/android-v3.3.9) (Pre-release) - 2025-06-09T17:11:04Z

- Fixed: Voice typing: Fix memory leak (#12402 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.8](https://github.com/laurent22/joplin/releases/tag/android-v3.3.8) (Pre-release) - 2025-05-01T15:45:35Z

- New: Force quick action shortcuts to have the same size (#12195 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Increase space between new note/to-do buttons (#12194 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix new note menu size (#12193) (#12191 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.7](https://github.com/laurent22/joplin/releases/tag/android-v3.3.7) (Pre-release) - 2025-04-29T13:06:06Z

- New: Add plural forms for notes, users, hours, minutes, days (#12171 by [@SilverGreen93](https://github.com/SilverGreen93))
- Improved: Allow new note and new to-do buttons to wrap (#12163 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update immer to v9.0.21 (#12182 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Editor: Allow syntax highlighting within ==highlight==s (#12167) (#12110 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.6](https://github.com/laurent22/joplin/releases/tag/android-v3.3.6) (Pre-release) - 2025-04-24T08:34:56Z

- Improved: Improve UI for downloading updated models (#12145 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Note editor: Hash links: Move cursor to header or anchor associated with link target (#12129 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Print name of file when import fails (c3fe0ed)
- Improved: Update to js-draw v1.29.2 (#12074 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error when attempting to show message boxes in some cases (#12142 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Make list continuation logic more predictable (#11919) (#10226 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Markdown Editor: Fix numbered sublist renumbering (#12091 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Settings: Fix desktop-specific setting visible in note &gt; advanced (#12146 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.5](https://github.com/laurent22/joplin/releases/tag/android-v3.3.5) (Pre-release) - 2025-04-07T19:31:26Z

- New: Add "swap line up" and "swap line down" to toolbar extended options (#12053 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Plugins: Add command to hide the plugin panel viewer (#12018 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Explain why items could not be decrypted (#12048) (#11872 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Implement new note menu redesign (#11780 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Remove slider component module and replace integer settings with new validated component (#11822) (#10883 by [@mrjo118](https://github.com/mrjo118))
- Improved: Update react-native-quick-crypto (#12067 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Default to a larger model (#12009 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Disable "Download update" button while downloading an updated model (#12015 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Improve transcription at the end of paragraphs (#12013 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Performance: Disable preview generation logic (#12008 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Changing the type of one list changes it for all the lists (#11986) (#11971 by [@Paramesh-T-S](https://github.com/Paramesh-T-S))
- Fixed: Fix cursor moves to incorrect position when revising TextInput value (#11821) (#11820 by [@mrjo118](https://github.com/mrjo118))
- Fixed: Restoring a note which was in a deleted notebook  (#12016) (#11934)
- Fixed: Voice typing: Fix incorrectly-calculated audio length (#12012 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.4](https://github.com/laurent22/joplin/releases/tag/android-v3.3.4) (Pre-release) - 2025-03-21T18:07:00Z

- Improved: Voice typing: Improve processing with larger models (#11983 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Improve re-download button UI (#11979) (#11955 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.3](https://github.com/laurent22/joplin/releases/tag/android-v3.3.3) (Pre-release) - 2025-03-16T10:29:52Z

- New: Add setting migration for ocr.enabled (ab86b95)
- Improved: Accessibility: Improve focus handling in the note actions menu and modal dialogs (#11929 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Make default modal close button accessible (#11957 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Voice typing: Transcribe more unprocessed audio after pressing "done" (#11960) (#11956 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fix missing label on note actions menu dismiss button (#11954 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Make tab size consistent between Markdown editor and viewer (and RTE) (#11940) (#11673)
- Fixed: Voice typing: Fix potential output duplication when finalizing voice typing (#11953 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.2](https://github.com/laurent22/joplin/releases/tag/android-v3.3.2) (Pre-release) - 2025-03-03T22:35:08Z

- Improved: Improve encryption config screen accessibility (#11874) (#11846 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Switch default library used for Whisper voice typing (#11881 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @bam.tech/react-native-image-resizer (v3.0.11)
- Fixed: Accessibility: Fix "new note" and "new to-do" buttons are focusable even while invisible (#11899 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix disabled encryption keys list showing enabled keys (#11861) (#11858 by [@pedr](https://github.com/pedr))
- Fixed: Fix voice recorder crash (#11876) (#11864 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.3.1](https://github.com/laurent22/joplin/releases/tag/android-v3.3.1) (Pre-release) - 2025-02-19T16:01:54Z

- New: Add support for plugin editor views (#11831)
- Improved: Accessibility: Improve contrast of faded URLs in Markdown editor (#11635 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Make it possible to create and edit profiles with a screen reader (#11797 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow adjusting the default note viewer font size (#11633) (#10824 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow internal links to target elements using the name attribute (#11671 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Do not add double newlines around attached files (#11690)
- Improved: Harden failsafe logic to check for the presence of info.json, rather than just the item count (#11750 by [@mrjo118](https://github.com/mrjo118))
- Improved: Highlight `==marked==` text in the Markdown editor (#11794 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve Welcome Notes with clearer instructions (#11656) (#11647 by [@pedr](https://github.com/pedr))
- Improved: Logging: Log less information at level `warn` when a decryption error occurs (#11771 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Move S3 sync target out of beta (798e1b8)
- Improved: Plugins: Legacy editor API: Fix delayed crash caused by out-of-bounds inputs (#11714 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Simplify getting the ID of the note open in an editor (#11841 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Support the showToast API (#11787 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Render strikethrough text in the editor (#11795) (#11790 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support attaching audio recordings (#11836 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Toolbar: Show only half of last button to indicate scroll (#11772 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update js-draw to version 1.27.2 (#11788 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.4.1), @react-native-clipboard/clipboard (v1.14.3), @react-native-community/slider (v4.5.5)
- Fixed: Adjust how items are queried by ID (#11734) (#11630 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Cancelling dev plugin path setup shows error (#11828) (#11827 by [@rathoreSahil](https://github.com/rathoreSahil))
- Fixed: Fix error logged when opening the note editor (#11761 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix home screen new-note shortcuts are re-applied after switching notes (#11779 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix unable to sync with multiple Nextcloud accounts in different profiles (#11674) (#11292 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Sync: Fix share not marked as readonly if the recipient has an outgoing share (#11770 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Use alternative fix to set the sqlite CursorWindow size to 50mb (#11726) (#11571 by [@mrjo118](https://github.com/mrjo118))
- Security: Improve comment escaping (#11706 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.2.7](https://github.com/laurent22/joplin/releases/tag/android-v3.2.7) (Pre-release) - 2025-01-13T17:03:36Z

- Fixed: Clicking on an external note link from within a note logs an error (#11619) (#11455 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix clicking "Draw picture" results in blank screen with very old WebView versions (#11604 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.2.5](https://github.com/laurent22/joplin/releases/tag/android-v3.2.5) (Pre-release) - 2025-01-07T23:35:43Z

- Improved: Allow re-downloading voice typing models on URL change and error (#11557 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade js-draw to 1.26.0 (#11589 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.2.4](https://github.com/laurent22/joplin/releases/tag/android-v3.2.4) (Pre-release) - 2025-01-06T12:50:23Z

- New: Plugin API: Add support for the renderMarkup command (#11494 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve sidemenu notebook list accessibility (#11556 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Add an accordion for disabled master keys on encryption screen (#11529) (#11486 by [@pedr](https://github.com/pedr))
- Improved: Add more options when long pressing the icon on mobile (#11517) (#10374)
- Improved: Display html notes using white theme (#11510) (#10609)
- Improved: Plugin API: Implement the `toggleVisiblePanes` command (#11496 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Removed old hack that was making the note body move up and down (#11511)
- Improved: Updated packages @react-native-clipboard/clipboard (v1.14.2), @react-native-community/netinfo (v11.3.3), @react-native-community/slider (v4.5.3), @rollup/plugin-node-resolve (v15.2.4), adm-zip (v0.5.16)
- Improved: Use real timers for sync operations (#11081)
- Fixed: Fix editor shows nothing when there are no selected note IDs (#11514) (#11264 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix missing "Insert Time" button (#11542) (#11539 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Locked out of mobile app due to broken fingerprint scanner (#10926)

## [android-v3.2.3](https://github.com/laurent22/joplin/releases/tag/android-v3.2.3) (Pre-release) - 2024-12-11T13:58:14Z

- New: Accessibility: Add checked/unchecked accessibility information to the "sort notes by" dialog (#11411 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Translation: Add sk_SK.po (Slovak) (#11433 by [@dodog](https://github.com/dodog))
- Improved: Accessibility: Describe the notebook dropdown for accessibility tools (#11430 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve note list accessibility (#11419 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve note selection screen reader accessibility (#11424 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve screen reader accessibility of the tag list (#11420 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve side menu and heading screen reader accessibility (#11427 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve tag dialog screen reader accessibility (#11421 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve voice typing dialog screen reader accessibility (#11428 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Mark note properties buttons as buttons (#11432 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Search screen: Hide the progress bar from accessibility tools when invisible (#11431 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Close voice typing session when closing the editor (#11466 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Editor: Switch to a scrolling toolbar, allow adding/removing toolbar items (#11472 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Reactivate pCloud synchronisation (23032b9)
- Improved: Removed deprecation notice on OneDrive sync method (ceea0bc)
- Fixed: Accessibility: Fix screen reader is unable to scroll settings tab list (#11429 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix switching notes then unloading app causes blank screen (#11396) (#11384 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix the error caused by undefined isCodeBlock_ (turndown-plugin-gfm) (#11471 by Manabu Nakazawa)
- Fixed: Upgrade CodeMirror packages (#11440) (#11318 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.2.2](https://github.com/laurent22/joplin/releases/tag/android-v3.2.2) (Pre-release) - 2024-11-19T01:12:43Z

- Improved: Accessibility: Improve dialog accessibility (#11395 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Deprecated OneDrive sync method (e36f377)
- Improved: Remove the need for sync locks (#11377)
- Fixed: Fix `undefined` errors in translations (#11407 by Self Not Found)
- Fixed: Fix race condition which may cause data loss, particularly before or after pasting text in the note editor (#11334) (#11317 by [@mrjo118](https://github.com/mrjo118))
- Fixed: Fix vertical alignment of checkboxes when text wraps over multiple lines (226a8b3)

## [android-v3.2.1](https://github.com/laurent22/joplin/releases/tag/android-v3.2.1) (Pre-release) - 2024-11-10T14:23:47Z

- New: Add new encryption methods based on native crypto libraries (#10696 by Self Not Found)
- New: Add setting to disable markup autocompletion (#11222 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add support for overwrite mode in the Markdown editor (#11262 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Accessibility: Improve setting control accessibility (#11358 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow switching the voice typing library to Whisper (#11158 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow user to generate deletion logs (#11083) (#10664 by [@pedr](https://github.com/pedr))
- Improved: Camera screen: Support scanning QR codes (#11245 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Center sidebar icons (#11299 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.4.0), @react-native-community/datetimepicker (v8.2.0), @react-native-community/geolocation (v3.3.0), @react-native/babel-preset (v0.74.86), @react-native/metro-config (v0.74.87), compare-versions (v6.1.1), dayjs (v1.11.12), expo (v51.0.26), highlight.js (v11.10.0), jsdom (v24.1.1), react-native-localize (v3.2.1), react-native-paper (v5.12.5), react-native-quick-crypto (v0.7.2), react-native-safe-area-context (v4.10.8), react-native-webview (v13.10.5), sass (v1.77.8), url (v0.11.4)
- Improved: Upgrade CodeMirror packages (#11221 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Use a FontAwesome icon for the trash folder (#11357) (#11202 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix list renumbering in the Markdown editor resets the first list item number to 1 (#11220 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed vertical alignment of checkboxes (49e86d1)
- Fixed: Handle callback url triggered app launch (#11280) (#9204 by [@tiberiusteng](https://github.com/tiberiusteng))
- Fixed: Upgrade react-native-quick-crypto to v0.7.5 (#11294 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.1.8](https://github.com/laurent22/joplin/releases/tag/android-v3.1.8) (Pre-release) - 2024-11-09T13:02:33Z

- Fixed: Fix error on creating new notes if the user is a share recipient (#11326) (#11325 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix new note button is pushed off-screen on certain Android devices (#11323) (#11276 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix sharing to Joplin causes back navigation to get stuck (#11355) (#11324 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.1.7](https://github.com/laurent22/joplin/releases/tag/android-v3.1.7) (Pre-release) - 2024-11-04T20:27:52Z

- Fixed: Fix search result note hidden after powering on device (#11297) (#11197 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.1.6](https://github.com/laurent22/joplin/releases/tag/android-v3.1.6) (Pre-release) - 2024-10-17T22:13:06Z

- Improved: Downgrade CodeMirror packages to fix various Android regressions (#11170 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Name webview root attribute so that it can be styled (75b8caf)
- Improved: Updated packages @react-native/babel-preset (v0.74.85), @react-native/metro-config (v0.74.85), glob (v10.4.5), katex (v0.16.11), react-native-document-picker (v9.3.0), react-native-safe-area-context (v4.10.7), stream (v0.0.3)
- Fixed: Fix automatic resource download mode (#11144) (#11134 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix incorrect list switching behavior (#11137) (#11135 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix new note/edit buttons only work if pressed quickly (#11185) (#11183 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix regression: Search screen not hidden when cached for search result navigation (#11131) (#11130 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.1.5](https://github.com/laurent22/joplin/releases/tag/android-v3.1.5) (Pre-release) - 2024-10-11T22:11:20Z

- Improved: Downgrade CodeMirror packages to fix various Android regressions (#11170 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Name webview root attribute so that it can be styled (75b8caf)
- Improved: Updated packages @react-native/babel-preset (v0.74.85), @react-native/metro-config (v0.74.85), glob (v10.4.5), katex (v0.16.11), react-native-document-picker (v9.3.0), react-native-safe-area-context (v4.10.7), stream (v0.0.3)
- Fixed: Fix automatic resource download mode (#11144) (#11134 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix incorrect list switching behavior (#11137) (#11135 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix new note/edit buttons only work if pressed quickly (#11185) (#11183 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix regression: Search screen not hidden when cached for search result navigation (#11131) (#11130 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.1.4](https://github.com/laurent22/joplin/releases/tag/android-v3.1.4) (Pre-release) - 2024-09-24T14:21:42Z

- Improved: Automatically detect and use operating system theme by default (5beb80b)
- Improved: Make pressing "back" navigate to the previous note after following a link (#11086) (#11082 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Scroll dropdown to selected value when first opened (#11091 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Show loading indicator while loading search results (#11104 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support permanent note deletion on mobile  (#10786) (#10763 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @js-draw/material-icons (v1.20.3), @react-native/babel-preset (v0.74.84), @react-native/metro-config (v0.74.84), @rollup/plugin-replace (v5.0.7), glob (v10.4.2), js-draw (v1.20.3), jsdom (v24.1.0), markdown-it-ins (v4), markdown-it-sup (v2), react-native-device-info (v10.14.0), react-native-document-picker (v9.2.0), react-native-localize (v3.1.0), react-native-safe-area-context (v4.10.5), react-native-share (v10.2.1), react-native-webview (v13.10.4), sass (v1.77.6), tesseract.js (v5.1.0), turndown (v7.2.0)
- Improved: Upgrade CodeMirror packages (#11034 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Use fade animation for edit link dialog (#11090 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Accessibility: Fix sidebar broken in right-to-left mode, improve screen reader accessibility (#11056) (#11028 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Decrypt master keys only as needed (#10990) (#10856 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Delete revisions on the sync target when deleted locally (#11035) (#11017 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Drawing: Fix clicking "cancel" after starting a new drawing in editing mode creates an empty resource (#10986 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix scroll issues and incorrect main content height (#11071 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix unable to change incorrect decryption password if the same as the master password (#11026 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Improve performance when there are many selected items (#11067) (#11065 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Move accessibility focus to the first note action menu item on open (#11031) (#10253 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: WebDAV synchronisation not working because of URL encoding differences (#11076) (#10608 by [@pedr](https://github.com/pedr))

## [android-v3.1.3](https://github.com/laurent22/joplin/releases/tag/android-v3.1.3) (Pre-release) - 2024-09-02T12:16:46Z

- Improved: Added feature flag to disable sync lock support (#10925) (#10407)
- Improved: Make feature flags advanced settings by default (700ffa2)
- Improved: Updated packages @bam.tech/react-native-image-resizer (v3.0.10), @js-draw/material-icons (v1.20.2), @react-native-clipboard/clipboard (v1.14.1), @react-native-community/datetimepicker (v8.0.1), @react-native-community/netinfo (v11.3.2), @rollup/plugin-commonjs (v25.0.8), async-mutex (v0.5.0), dayjs (v1.11.11), glob (v10.3.16), react, react-native-device-info (v10.13.2), react-native-safe-area-context (v4.10.3), react-native-webview (v13.8.7), react-native-zip-archive (v6.1.2), sass (v1.76.0), sharp (v0.33.4)
- Fixed: Fix "Enable auto-updates" enabled by default and visible on unsupported platforms (#10897) (#10896 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix BMP image rendering in the Markdown viewer (#10915) (#10914 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix crash on opening settings on old versions of Android (#10793 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix toolbar overflow menu is invisible (#10871) (#10867 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fixed italic support in Fountain documents (5fdd088)
- Fixed: Markdown editor: Fix toggling bulleted lists when items start with asterisks (#10902) (#10891 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.1.2](https://github.com/laurent22/joplin/releases/tag/android-v3.1.2) (Pre-release) - 2024-08-10T11:44:30Z

- Fixed: Fix WebDAV sync on mobile (#10849) (#10848 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve RTL support in the Markdown editor (#10810 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Include commit information in version information screen (#10829 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support building for web (#10650 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support pasting images (#10751) (#9017 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @react-native-community/geolocation (v3.2.1), @react-native-community/slider (v4.5.2), glob (v10.3.12), jsdom (v23.2.0), react-native-device-info (v10.13.1), react-native-get-random-values (v1.11.0), react-native-webview (v13.8.4), sharp (v0.33.3), style-to-js (v1.1.12), tar (v6.2.1)
- Improved: Upgrade react-native-webview to 13.8.6 to fix CI (#10761 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix Dropbox sync for certain device languages (#10759) (#10681 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix dayjs-related startup error (#10652 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix math is invisible in certain mermaid diagrams (#10820) (#10785 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix pasting PNG and JPEG images from the clipboard (#10777 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugins: Fix incorrect Node exports emulation (#10776 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Remove search bar from plugins screen (#10648) (#10596 by Siddhant Paritosh Rao)
- Fixed: Show notification in case Joplin Cloud credential is not valid anymore (#10649) (#10645 by [@pedr](https://github.com/pedr))

## [android-v3.0.9](https://github.com/laurent22/joplin/releases/tag/android-v3.0.9) (Pre-release) - 2024-07-28T14:00:59Z

- Fixed: #10677: Following a link to a previously open note wouldn't work (#10750) (#10677 by [@pedr](https://github.com/pedr))
- Fixed: Fix manual resource download mode (#10748 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.8](https://github.com/laurent22/joplin/releases/tag/android-v3.0.8) (Pre-release) - 2024-07-06T10:26:06Z

- Fixed: Fix sidebar performance regression with many nested notebooks (#10676) (#10674 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.7](https://github.com/laurent22/joplin/releases/tag/android-v3.0.7) (Pre-release) - 2024-07-01T15:47:15Z

- Improved: Set min version for synchronising to 3.0.0 (e4b8976)
- Fixed: Show notification in case Joplin Cloud credential is not valid anymore (#10649) (#10645 by [@pedr](https://github.com/pedr))

## [android-v3.0.6](https://github.com/laurent22/joplin/releases/tag/android-v3.0.6) (Pre-release) - 2024-06-29T09:41:10Z

- Updated Chinese and German translation (#10660 by [@cedecode](https://github.com/cedecode))
- Fixed: Fix refocusing the note editor (#10644) (#10637 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.5](https://github.com/laurent22/joplin/releases/tag/android-v3.0.5) (Pre-release) - 2024-06-19T12:02:12Z

- Improved: Don't render empty title page for Fountain (#10631 by [@XPhyro](https://github.com/XPhyro))
- Improved: Don't show an "expand" arrow by "Installed plugins" when no plugins are installed (#10583 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Implement callback url (#9803) (#8639 by [@tiberiusteng](https://github.com/tiberiusteng))
- Improved: Make mobile plugin settings screen UI closer to desktop (#10598) (#10592 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Mark plugin support as in beta (#10585 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Move mobile plugin setting tabs under a separate section (#10600) (#10594 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Start synchronisation just after login is complete (#10574 by [@pedr](https://github.com/pedr))
- Improved: Update farsi/persian translation fa.po (#10634 by [@mimeyn](https://github.com/mimeyn))
- Improved: Updated packages @react-native-community/netinfo (v11.3.1), chokidar (v3.6.0), follow-redirects (v1.15.6), jsdom (v23), react-native-image-picker (v7.1.1), react-native-webview (v13.8.1), sass (v1.71.0), style-to-js (v1.1.11), turndown (v7.1.3)
- Fixed: English: Use the plural form of a localization for negative and zero items (#10582) (#10581 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix cmd-i no longer italicizes text (#10604 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix plugin list not cached in config screen (#10599) (#10593 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix selected note changes on moving to a different folder (#10630) (#10589 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Not able to change notebook when using 'New Note' quick action (#10252) (#10588 by [@pedr](https://github.com/pedr))
- Fixed: Plugin settings screen: Fix plugin states not set correctly when installing multiple plugins at once (#10580 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin settings: Fix plugins without settings can't be disabled without reinstall (#10579 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.4](https://github.com/laurent22/joplin/releases/tag/android-v3.0.4) (Pre-release) - 2024-06-12T20:38:44Z

- New: Add Joplin Cloud account information to configuration screen (#10553 by [@pedr](https://github.com/pedr))
- New: Add button on Synchronization to Joplin Cloud login screen (#10569 by [@pedr](https://github.com/pedr))
- Improved: Dismiss dialogs on background tap (#10557 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Hide links to login after process is successful (#10571 by [@pedr](https://github.com/pedr))
- Improved: Implement plugin screen redesign (#10465 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improve dialog styling on large and notched screens (#10470 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Improves formatting of log statements (aac8d58)
- Improved: Plugin API: Implement the `newNote` command (#10524 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Make panel opening/closing more consistent with desktop (#10385 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Show information page before enabling plugin support (#10348 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Settings screen: Show touch feedback when pressing a tab (#10544 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Share screen: Update headings and labels for consistency with desktop (#10395 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Show WebView version in settings (#10518 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Simplify Dropbox sync workaround (#10415 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update Mermaid to v10.9.1 (#10475 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update js-draw to version 1.20.2 (#10438 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages react, react-native-device-info (v10.12.1), react-native-document-picker (v9.1.1), react-native-paper (v5.12.3), sass (v1.70.0), tesseract.js (v5.0.5)
- Improved: Upgrade KaTeX to v0.16.10 (#10570 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade to React Native 0.74.1 (#10401 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Automatically set focus on title or body when creating a new note (#10237)
- Fixed: Fix Dropbox sync (#10400) (#10396 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix accepting encrypted shared notebooks (#10429) (#10409 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix logger tests by adding time (#10433 by [@pedr](https://github.com/pedr))
- Fixed: Fix nonbreaking spaces and CRLF break search for adjacent words (#10417 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix plugins aren't visible after switching to a new profile (#10386 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix plugins not reloaded when the plugin runner reloads (#10540 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Maintain cursor position when changing list indentation (#10441) (#10439 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.3](https://github.com/laurent22/joplin/releases/tag/android-v3.0.3) (Pre-release) - 2024-04-27T11:21:48Z

- Improved: Display a message when Joplin Cloud user don't have access to email to note feature (#10322 by [@pedr](https://github.com/pedr))
- Improved: Make editor styles closer to desktop (#10377 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Make most plugins default to being desktop-only (#10376) (#10360 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugin support: Simplify reporting plugin issues (#10319 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support copying app information (#10336 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Updated packages @adobe/css-tools (v4.3.3)
- Fixed: After deleting the last note from the conflicts folder, the application state is invalid (#10189)
- Fixed: Do not invite user to create new notes in the trash folder (#10356) (#10191 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix cursor jumps before end of word while typing -- update `@codemirror/view` to v6.26.3 (#10353) (#10352 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix quickly enabling/disabling multiple plugins can lead to errors and missing plugins (#10380 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix sync icon off-center (#10350) (#10351 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugins: Fix API incompatibility in arguments to `onMessage` listeners in panels (#10375 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.2](https://github.com/laurent22/joplin/releases/tag/android-v3.0.2) (Pre-release) - 2024-04-15T18:06:46Z

- Improved: Allow marking a plugin as mobile-only or desktop-only (#10229) (#10206 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Allow marking items as "ignored" in sync status  (#10261) (#10245 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Avoid unnecessary requests if Joplin Cloud credentials are empty (#10256 by [@pedr](https://github.com/pedr))
- Improved: Bump @codemirror/view version. (#10174 by [@itzTheMeow](https://github.com/itzTheMeow))
- Improved: Default to tab indentation for consistency with desktop platforms (#10242 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Display recommended plugin alert (#10281) (#10207 by [@DarkFalc0n](https://github.com/DarkFalc0n))
- Improved: Do not repeat failed requests with ENOTFOUND error (#6173)
- Improved: Improve focus handling (00084c5)
- Improved: Make tables horizontally scrollable (#10161 by [@wljince007](https://github.com/wljince007))
- Improved: Plugin API: Improve support for the Kanban and similar plugins (#10247 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugin API: Support `clipboard.availableFormats` (#10209 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Plugins: Autohide the plugin panel toggle in toolbar to increase size for notebook dropdown (#10212 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Show plugin versions in settings (#10289) (#10288 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Show sync version and client id in More Info (#10254 by Self Not Found)
- Improved: Support accepting Joplin Cloud shares (#10300 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support description banners on plugin-registered settings screens (#10286 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Support importing from JEX files (#10269 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Toggle plugin panels using a button in the toolbar (#10180 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Update farsi/persian translation fa.po (#10181 by [@mimeyn](https://github.com/mimeyn))
- Fixed: Email to note address not presented in configuration screen before synchronisation (#10293) (#10292 by [@pedr](https://github.com/pedr))
- Fixed: Fix "new note" button is shown in the trash notebook (#10227) (#10188 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix dropdowns invisible when opening settings by clicking "synchronize" (#10271) (#10270 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix error on retry or ignore attachment too large error (#10314) (#10313 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix plugin card titles are clipped (#10296 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin API: Fix crash when a plugin registers an enum setting with no default (#10263 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin API: Fix error when calling `plugins.dataDir` (#10262 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugin API: Fix unable to require `@codemirror/search`  (#10205 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Plugins: Fix event listener memory leak when disabling/uninstalling plugins (#10280 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))

## [android-v3.0.1](https://github.com/laurent22/joplin/releases/tag/android-v3.0.1) (Pre-release) - 2024-03-21T18:27:47Z

- New: Add support for Markdown editor plugins (#10086 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add support for plugin panels and dialogs (#10121 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add support for renderer plugins (#10135 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- New: Add trash folder (#9671) (#483)
- Improved: Added empty trash option on long pressing the trash folder (#10120) (#10092 by [@Sidd-R](https://github.com/Sidd-R))
- Improved: Allow debugging plugins (#10156 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Change Joplin Cloud login process to allow MFA via browser (#9776 by [@pedr](https://github.com/pedr))
- Improved: Fix conflicts notebook doesn't work with the trash feature (#10104) (#10073 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Log user actions (deletions) (#9585) (#9465 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Improved: Upgrade CodeMirror 6 packages (#10032) (#10031 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix broken plugin API: editor.execCommand (#10153) (#10152 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix clicking on a link results in a blank screen (#10168) (#10166 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix note editor's settings and plugins updated on every keystroke (#10116 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix plugin API memory leak (#10115 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix screen reader touch-to-focus broken on note list and note viewer pages (#10123) (#10122 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix shared data lost if Joplin is closed immediately after receiving a share (#10171) (#10170 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Fix trash folder sometimes has wrong icon (#10173) (#10172 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Improve note editor performance when quickly entering text (#10134) (#10130 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: New note button crashes app when there are no notebooks (#10087) (#10065 by [@Sidd-R](https://github.com/Sidd-R))
- Fixed: Plugins: Fix warning after reloading plugins (#10165 by [@personalizedrefrigerator](https://github.com/personalizedrefrigerator))
- Fixed: Shows only the real folders in the dropdown of parent folders. (#10147) (#10143 by [@Sidd-R](https://github.com/Sidd-R))

## [android-v2.14.9](https://github.com/laurent22/joplin/releases/tag/android-v2.14.9) (Pre-release) - 2024-02-26T19:56:11Z

- Fixed: Note editor: Support older WebView versions (#9986) (#9521 by Henry Heino)
- Fixed: Sort notebooks in a case-insensitive way (#9996)

## [android-v2.14.8](https://github.com/laurent22/joplin/releases/tag/android-v2.14.8) (Pre-release) - 2024-02-22T22:29:24Z

- Improved: Immediately sort notes after toggling a checkbox (5820f63)
- Fixed: Fix auto-indentation in some types of code blocks (#9972) (#9971 by Henry Heino)

## [android-v2.14.7](https://github.com/laurent22/joplin/releases/tag/android-v2.14.7) (Pre-release) - 2024-02-19T10:40:10Z

- Improved: Migrate profile in preparation for trash feature (115eb5d)
- Improved: Updated packages tar-stream (v3.1.7)
- Fixed: Fix full text search broken on Android 7 and earlier (#9914) (#9905 by Henry Heino)

## [android-v2.14.6](https://github.com/laurent22/joplin/releases/tag/android-v2.14.6) (Pre-release) - 2024-02-09T12:41:18Z

- Improved: Improve search engine error handling when preparing text for search (#9871 by Henry Heino)
- Improved: Updated packages @js-draw/material-icons (v1.16.1), @react-native-community/netinfo (v11.2.1), @react-native-community/slider (v4.5.0), async-mutex (v0.4.1), follow-redirects (v1.15.5), js-draw (v1.16.1), moment (v2.30.1), react-native-document-picker (v9.1.0), react-native-localize (v3.0.6), react-native-paper (v5.11.7), react-native-safe-area-context (v4.8.2), react-native-share (v10.0.2), react-native-webview (v13.6.4), sass (v1.69.7), sharp (v0.33.2), sqlite3 (v5.1.7)
- Fixed: Correctly search HTML-entity encoded text (#9694)
- Fixed: Fix deeply-nested subnotebook titles invisible in the folder dropdown (#9906) (#9858 by Henry Heino)
- Fixed: Fix regression: Crash when opening appearance/sync settings on some devices (#9864) (#7974 by Henry Heino)
- Fixed: Fix share to Joplin when only "All notes" has been opened (#9876) (#9863 by Henry Heino)
- Fixed: Increase space available for Notebook icon (#9877) (#9475 by [@pedr](https://github.com/pedr))

## [android-v2.14.5](https://github.com/laurent22/joplin/releases/tag/android-v2.14.5) (Pre-release) - 2024-02-02T23:09:50Z

- Improved: Allow note viewer to extend to the edge of the screen while pinch zooming (#9820) (#9819 by Henry Heino)
- Improved: Do not allow switching the sync target if not all resources are downloaded (#9263)
- Improved: Removed ability to search by note ID to fix issue with certain plugins (#9769)
- Improved: Updated packages react-native-paper (v5.11.6)
- Fixed: Fix crash on opening settings on some devices (#9806) (#7974 by Henry Heino)
- Fixed: Clear "Some items cannot be synchronised" banner after situation is resolved (#9157)
- Fixed: Detect faster left-right swipes to open the sidemenu (#9802) (#9142 by Henry Heino)
- Fixed: Fix broken synchronisation link in welcome notes (#9804) (#9799 by Henry Heino)
- Fixed: Fix note editor errors/logs not sent to Joplin's logs (#9808) (#9807 by Henry Heino)
- Fixed: Fix synchronization happens every 10 seconds even if nothing has changed (#9814) (#9800 by Henry Heino)

## [android-v2.14.4](https://github.com/laurent22/joplin/releases/tag/android-v2.14.4) (Pre-release) - 2024-01-26T10:46:28Z

- New: Add support for showing only lines of log that contain a filter (#9728 by Henry Heino)
- Improved: Allow setting a minimum app version on the sync target (#9778)
- Improved: Display an error if a resource cannot be downloaded (cbf7e24)
- Improved: Don't log OneDrive `Authorization` tokens (#9707) (#9706 by Henry Heino)
- Improved: Hide advanced settings by default (#9730 by Henry Heino)
- Improved: Updated packages @js-draw/material-icons (v1.15.0), follow-redirects (v1.15.4), fs-extra (v11.2.0), js-draw (v1.15.0), react, react-native-device-info (v10.12.0), react-native-image-picker (v7.1.0), react-native-paper (v5.11.5), react-native-vector-icons (v10.0.3), sharp (v0.33.1)
- Fixed: Fix AWS S3 sync error (#9696) (#8891 by Henry Heino)

## [android-v2.14.3](https://github.com/laurent22/joplin/releases/tag/android-v2.14.3) (Pre-release) - 2024-01-06T12:30:29Z

- Improved: Fix table-of-contents links to headings with duplicate content (#9610) (#9594 by Henry Heino)
- Improved: Improve sync by reducing how often note list is sorted (f95ee68)
- Improved: Render mermaid diagrams in dark mode when Joplin is in dark mode (#9631) (#3201 by Henry Heino)
- Improved: Updated packages deprecated-react-native-prop-types (v5), react-native-paper (v5.11.4)

## [android-v2.14.2](https://github.com/laurent22/joplin/releases/tag/android-v2.14.2) (Pre-release) - 2023-12-31T16:14:25Z

- Improved: Updated packages react-native-get-random-values (v1.10.0)

## [android-v2.14.1](https://github.com/laurent22/joplin/releases/tag/android-v2.14.1) (Pre-release) - 2023-12-29T22:12:14Z

- Improved: CodeMirror 6 markdown editor: Support highlighting more languages (#9563) (#9562 by Henry Heino)
- Improved: Don't attach empty drawings when a user exits without saving (#9386) (#9377 by Henry Heino)
- Improved: Handle Dropbox payload_too_large error (f267d88)
- Improved: Make backspace delete auto-matching brackets (#9527) (#9526 by Henry Heino)
- Improved: Optimise synchronisation by making delta call return whole items (5341501)
- Improved: Updated packages @react-native-community/datetimepicker (v7.6.2), @react-native-community/netinfo (v9.5.0), @react-native-community/slider (v4.4.4), @rmp135/sql-ts (v1.18.1), @testing-library/react-native (v12.3.3), highlight.js (v11.9.0), mermaid (v10.6.1), nanoid (v3.3.7), nodemon (v3.0.2), punycode (v2.3.1), react, react-native-image-picker (v7.0.3), react-native-localize (v3.0.4), react-native-paper (v5.11.3), react-native-vector-icons (v10.0.2), react-native-webview (v13.6.3), style-to-js (v1.1.9), tesseract.js (v5.0.3), ts-loader (v9.5.1)
- Fixed: #9361: Fix to-dos options toggle don't toggle a rerender in  (#9364) (#9361 by [@pedr](https://github.com/pedr))
- Fixed: Fix Beta Editor diff highlighting (#9525) (#9524 by Henry Heino)
- Fixed: Fix KaTeX rendering (#9456) (#9455 by Henry Heino)
- Fixed: Fix code block borders in headers of Beta Markdown editor (#9523) (#9522 by Henry Heino)
- Fixed: Fix cursor location on opening the editor and attachments inserted in wrong location (#9536) (#9532 by Henry Heino)
- Fixed: Fix editor scrollbar on iOS (#9531) (#9322 by Henry Heino)
- Fixed: Fix font for the inbox email address not using the theme color (#9503) (#9500 by [@pedr](https://github.com/pedr))
- Fixed: Fix inline code at beginning of line in table breaks formatting (#9478) (#9477 by Henry Heino)
- Fixed: Fix list renumbering and enable multiple selections (#9506) (#9200 by Henry Heino)
- Fixed: Fix new note/to-do buttons not visible on app startup in some cases (#9329) (#9328 by Henry Heino)
- Fixed: Fix note editor crash when trying to edit text quickly after opening a note (#9581) (#9502 by Henry Heino)
- Fixed: Fix tooltips don't disappear on some devices (upgrade to js-draw 1.13.2) (#9401) (#9374 by Henry Heino)
- Fixed: Sidebar is not dismissed when creating a note (#9376)

## [android-v2.13.10](https://github.com/laurent22/joplin/releases/tag/android-v2.13.10) (Pre-release) - 2023-12-01T11:16:17Z

- Improved: Drawing: Revert recent changes to input system (#9426) (#9427 by Henry Heino)

## [android-v2.13.9](https://github.com/laurent22/joplin/releases/tag/android-v2.13.9) (Pre-release) - 2023-11-30T17:55:54Z

- Improved: Don't attach empty drawings when a user exits without saving (#9386) (#9377 by Henry Heino)
- Fixed: Fix tooltips don't disappear on some devices (upgrade to js-draw 1.13.2) (#9401) (#9374 by Henry Heino)

## [android-v2.13.8](https://github.com/laurent22/joplin/releases/tag/android-v2.13.8) (Pre-release) - 2023-11-26T12:37:00Z

- Fixed: Fix to-dos options toggle don't toggle a rerender (#9364) (#9361 by [@pedr](https://github.com/pedr))
- Fixed: Fix new note/to-do buttons not visible on app startup in some cases (#9329) (#9328 by Henry Heino)
- Fixed: Sidebar is not dismissed when creating a note (#9376)

## [android-v2.13.7](https://github.com/laurent22/joplin/releases/tag/android-v2.13.7) (Pre-release) - 2023-11-16T13:17:53Z

- Improved: Add more space between settings title and description (#9270) (#9258 by Henry Heino)
- Improved: Fade settings screen icons (#9268) (#9260 by Henry Heino)
- Improved: Implement settings search (#9320) (#9294 by Henry Heino)
- Improved: Improve image editor load performance (#9281 by Henry Heino)
- Improved: Update js-draw to version 1.11.2 (#9120) (#9195 by Henry Heino)
- Improved: Updated packages @testing-library/react-native (v12.3.1), mermaid (v10.5.1), react-native-safe-area-context (v4.7.4), react-native-vector-icons (v10.0.1), sass (v1.69.5)
- Fixed: Config screen: Fix section list scroll (#9267) (#9259 by Henry Heino)
- Fixed: Disable notebook list side menu in config screen (#9311) (#9308 by Henry Heino)
- Fixed: Fix encryption when a resource doesn't have an associated file (#9222) (#9123 by Henry Heino)
- Fixed: Fix settings save confirmation not shown when navigating to encryption/profile/log screens (#9313) (#9312 by Henry Heino)
- Fixed: Restore scroll position when returning to the note viewer from the editor or camera (#9324) (#9321 by Henry Heino)

## [android-v2.13.6](https://github.com/laurent22/joplin/releases/tag/android-v2.13.6) (Pre-release) - 2023-11-09T19:45:21Z

- Improved: Add a "Retry all" button when multiple resources could not be downloaded (#9158)
- Improved: Image editor: Allow loading from save when the image editor is reloaded in the background (#9135) (#9134 by Henry Heino)
- Improved: Settings screen: Create separate pages for each screen (#8567 by Henry Heino)
- Improved: Updated packages @react-native-community/datetimepicker (v7.6.1), deprecated-react-native-prop-types (v4.2.3), sass (v1.68.0)
- Fixed: Disable selection match highlighting (#9202) (#9201 by Henry Heino)
- Fixed: Fix OneDrive sync crash on throttle (#9143) (#8561 by Henry Heino)
- Fixed: Fix fast search (#9191) (#9159 by Henry Heino)
- Fixed: Fix search highlighting (#9206) (#9207 by Henry Heino)
- Fixed: Image editor resets on theme change (#9190) (#9188 by Henry Heino)

## [android-v2.13.5](https://github.com/laurent22/joplin/releases/tag/android-v2.13.5) (Pre-release) - 2023-10-30T22:49:19Z

- Improved: Allow searching by note ID or using a callback URL (3667bf3)
- Improved: Updated packages @react-native-community/datetimepicker (v7.6.0), react-native-device-info (v10.11.0), react-native-webview (v13.6.2)
- Fixed: Beta editor: Fix image timestamps not updated after editing (#9176) (#9175 by Henry Heino)

## [android-v2.13.4](https://github.com/laurent22/joplin/releases/tag/android-v2.13.4) (Pre-release) - 2023-10-24T18:29:09Z

- Improved: Allow modifying a resource metadata only when synchronising (#9114)
- Improved: Support for plural translations (#9033)
- Improved: Updated packages @react-native-community/datetimepicker (v7.5.0), @react-native-community/geolocation (v3.1.0), @testing-library/react-native (v12.3.0), dayjs (v1.11.10), follow-redirects (v1.15.3), glob (v10.3.6), katex (v0.16.9), markdown-it (v13.0.2), react, react-native-device-info (v10.9.0), react-native-dropdownalert (v5), react-native-image-picker (v5.7.0), react-native-paper (v5.10.6), react-native-share (v9.4.1), react-native-webview (v13.6.0), react-native-zip-archive (v6.1.0), react-redux (v8.1.3), sass (v1.67.0), sharp (v0.32.6), tar (v6.2.0)
- Fixed: Fix sidebar folder icon (cd55a9a)
- Fixed: Fix writing UTF-8 data to a file replaces non-ASCII characters with ?s (#9076) (#9069 by Henry Heino)
- Fixed: Fixed issues related to sharing notes on read-only notebooks (1c7d22e)
- Fixed: Improve list toggle logic (#9103) (#9066 by Henry Heino)

## [android-v2.13.2](https://github.com/laurent22/joplin/releases/tag/android-v2.13.2) (Pre-release) - 2023-10-07T16:42:16Z

- New: Add share button to log screen (#8364 by Henry Heino)
- New: Add support for drawing pictures (#7588 by Henry Heino)
- Improved: Apply correct size to images imported from ENEX files (#8684)
- Improved: Bump mermaid version to 10.4.0 to support new chart types (#8890) (#8728 by [@oj-lappi](https://github.com/oj-lappi))
- Improved: Enable ignoreTlsErrors and custom certificates for S3 sync (#8980 by Jens Böttge)
- Improved: Fix random crash due to sidebar animation (#8792) (#8791 by Henry Heino)
- Improved: Improved handling of invalid sync info (#6978)
- Improved: Remember whether "All notes", a notebook or a tag was opened when re-opening the app (#8021)
- Improved: Updated packages @bam.tech/react-native-image-resizer (v3.0.7), @react-native-community/datetimepicker (v7.4.2), @react-native-community/slider (v4.4.3), @testing-library/jest-native (v5.4.3), @testing-library/react-native (v12.2.2), compare-versions (v6.1.0), deprecated-react-native-prop-types (v4.2.1), glob (v10.3.4), katex (v0.16.8), markdown-it-multimd-table (v4.2.3), nodemon (v3.0.1), react, react-native-device-info (v10.8.0), react-native-exit-app (v2), react-native-gesture-handler (v2.12.1), react-native-image-picker (v5.6.1), react-native-modal-datetime-picker (v17.1.0), react-native-paper (v5.10.4), react-native-safe-area-context (v4.7.2), react-native-share (v9.2.4), react-native-url-polyfill (v2), react-native-vector-icons (v10), react-native-webview (v13.4.0), sass (v1.66.1), sharp (v0.32.5), sprintf-js (v1.1.3), url (v0.11.3), uuid (v9.0.1)
- Fixed: Fix complex queries that contain quotes or filters (#8050)
- Fixed: Fix not all dropdown items focusable with VoiceOver (#8714) (#8707 by Henry Heino)
- Fixed: Fix search engine ranking algorithm (f504cf1)
- Fixed: Fix sharing image to Joplin (#8970) (#8533 by Self Not Found)
- Fixed: Fix unordered list button creates checklists (#8957) (#8956 by Henry Heino)
- Fixed: Fixed code block not default line wrap in pdf view (#8626) (#8517 by [@wljince007](https://github.com/wljince007))
- Fixed: Hide the keyboard when showing the attach dialog (#8911) (#8774 by Henry Heino)
- Fixed: Prevent accessibility tools from focusing the notes list when it's invisible (#8799) (#8798 by Henry Heino)

## [android-v2.12.3](https://github.com/laurent22/joplin/releases/tag/android-v2.12.3) (Pre-release) - 2023-09-11T20:01:44Z

- Improved: Add screen reader labels to search/note actions buttons (#8797) (#8796 by Henry Heino)
- Improved: Improve accessibility of side menu (#8839 by Henry Heino)
- Fixed: Fix older Android versions unable to set alarms (#8837) (#8789 by Henry Heino)
- Fixed: Revert to `react-native-sidemenu-updated` for navigation drawers (#8820) (#8791 by Henry Heino)

## [android-v2.12.2](https://github.com/laurent22/joplin/releases/tag/android-v2.12.2) (Pre-release) - 2023-08-22T13:15:18Z

- Improved: Only include "armeabi-v7a", "x86", "arm64-v8a", "x86_64" in APK (4e2d366)

## [android-v2.12.1](https://github.com/laurent22/joplin/releases/tag/android-v2.12.1) (Pre-release) - 2023-08-19T22:32:39Z

- New: Add JEX export (#8428 by Henry Heino)
- New: Add support for Joplin Cloud email to note functionality (#8460 by [@pedr](https://github.com/pedr))
- New: Add support for Voice Typing for most languages (#8309)
- New: Add support for share permissions (#8491)
- Improved: Add an option to disable the image resizing prompt (#8575) (#8566 by [@hubert](https://github.com/hubert))
- Improved: Add option to autodetect theme (#8498) (#8490 by Henry Heino)
- Improved: Improved Vosk error handling (1eeb5ab)
- Improved: Temporarily revert to AES-128 as encryption method due to severe performance issues (#8657)
- Improved: Updated packages @react-native-community/datetimepicker (v7.4.1), @react-native-community/geolocation (v3.0.6), @react-native-community/netinfo (v9.4.1), @rmp135/sql-ts (v1.18.0), @testing-library/react-native (v12.1.3), buildTools, clean-html (v2), dayjs (v1.11.9), domhandler (v5), gettext-parser (v7.0.1), glob (v10.3.3), highlight.js (v11.8.0), jsdom (v22.1.0), react-native-device-info (v10.7.0), react-native-document-picker (v9), react-native-drawer-layout (v3.2.1), react-native-gesture-handler (v2.12.0), react-native-get-random-values (v1.9.0), react-native-image-picker (v5.6.0), react-native-localize (v3.0.2), react-native-modal-datetime-picker (v15.0.1), react-native-paper (v5.9.1), react-native-reanimated (v3.2.0), react-native-safe-area-context (v4.6.4), react-redux (v8.1.2), sass (v1.63.6), sharp (v0.32.4), standard (v17.1.0), ts-loader (v9.4.4), url (v0.11.1), word-wrap (v1.2.5)
- Improved: Upgrade react-native-webview to v12 (9ceb7b9)
- Improved: Upgrade to React Native 0.71 (e740914)
- Improved: WebDAV: Show a more descriptive error message when the password is empty (#8477) (#8466 by Henry Heino)
- Fixed: Do not log data shared with the app (#8495) (#8211 by Henry Heino)
- Fixed: Fix frequent crashing on Android 12 ARM (#8516) (#8425 by Henry Heino)
- Fixed: Fixed link modal position on devices with notch (#8029) (#8027 by [@Letty](https://github.com/Letty))
- Fixed: Fixed text update issue when attaching a file to an empty note (78f3f1c)
- Fixed: Hide markdown toolbar completely when low on vertical space (#8688) (#8687 by Henry Heino)
- Fixed: Preserve image rotation (and other metadata) when resizing (#8669) (#8310 by Henry Heino)
- Fixed: Show warning if some items could not be decrypted (#8481) (#8381 by Henry Heino)
- Fixed: The voice typing box covers the texts in the editor (#8685) (#8510 by [@hubert](https://github.com/hubert))
- Fixed: Trying to fix sharing issues (#8533)
- Fixed: Unrevert #7953: Migrate to react-native-drawer-layout (#8379) (#7918 by Henry Heino)
- Security: Prevent XSS when passing specially encoded string to a link (57b4198)

## [android-v2.11.32](https://github.com/laurent22/joplin/releases/tag/android-v2.11.32) (Pre-release) - 2023-07-03T11:33:54Z

- Improved: Allow configuring voice typing model URL (2aab85f)

## [android-v2.11.31](https://github.com/laurent22/joplin/releases/tag/android-v2.11.31) (Pre-release) - 2023-06-25T14:26:21Z

- Improved: Upgrade E2EE encryption method to AES-256 (#7686)

## [android-v2.11.30](https://github.com/laurent22/joplin/releases/tag/android-v2.11.30) (Pre-release) - 2023-06-20T15:21:15Z

- New: Add support for Voice Typing for most languages (#8309)

## [android-v2.11.27](https://github.com/laurent22/joplin/releases/tag/android-v2.11.27) (Pre-release) - 2023-06-10T15:58:58Z

- Upgraded to React Native 0.71
- Improved: Updated packages @react-native-community/datetimepicker (v7), buildTools, domutils (v3.1.0), react-native-document-picker (v8.2.1), react-native-safe-area-context (v4.5.3), tar (v6.1.15)

## [android-v2.11.26](https://github.com/laurent22/joplin/releases/tag/android-v2.11.26) (Pre-release) - 2023-06-08T16:13:02Z

- Improved: Updated packages @react-native-community/datetimepicker (v7), buildTools, domutils (v3.1.0), react-native-document-picker (v8.2.1), react-native-safe-area-context (v4.5.3), tar (v6.1.15)
- Fixed: Allow certain HTML anchor tags (#8286)
- Fixed: Fix alarms for latest Android versions (#8229)
- Fixed: Fix sharing data with the app (#8285)

## [android-v2.11.25](https://github.com/laurent22/joplin/releases/tag/android-v2.11.25) (Pre-release) - 2023-06-03T16:40:08Z

- Fixed: Fix Vosk logic (60b3921)
- Fixed: Fixed error "Download interrupted" when downloading resources from Joplin Cloud/Server.

## [android-v2.11.24](https://github.com/laurent22/joplin/releases/tag/android-v2.11.24) (Pre-release) - 2023-06-02T15:22:04Z

- Improved: Write to note in realtime using voice typing (7779879)

## [android-v2.11.23](https://github.com/laurent22/joplin/releases/tag/android-v2.11.23) (Pre-release) - 2023-06-01T17:19:16Z

- Improved: Auto-detect language on start (e48d55c)
- Improved: Implement parenting of notebooks (#7980) (#8193 by [@jcgurango](https://github.com/jcgurango))
- Improved: Updated packages @react-native-community/netinfo (v9.3.10), @react-native-community/push-notification-ios (v1.11.0), aws, jsdom (v21.1.2), markdown-it-multimd-table (v4.2.2), react-native-paper (v5.8.0), react-native-reanimated (v3.1.0), react-native-safe-area-context (v4.5.2), sass (v1.62.1), sharp (v0.32.1), tar (v6.1.14), yargs (v17.7.2)
- Improved: When resetting the master password, also create a new master key with that password (e647775)
- Fixed: Fixed regression in biometric check (b19f1a1)
- Fixed: Improve selection of active E2EE key (#8254)
- Fixed: Support monochrome icons (#7772) (#7766 by Andrey Mukamolov)
- Security: Disable SVG tag support in editor to prevent XSS (caf6606)
- Security: Prevent XSS by sanitizing certain HTML attributes (9e90d90)

## [android-v2.11.22](https://github.com/laurent22/joplin/releases/tag/android-v2.11.22) (Pre-release) - 2023-05-14T13:44:28Z

- Fixed: Fix "Download interrupted" error (b023f58)

## [android-v2.11.21](https://github.com/laurent22/joplin/releases/tag/android-v2.11.21) (Pre-release) - 2023-05-14T11:05:15Z

- Improved: Updated packages react-native-paper (v5.6.0)

## [android-v2.11.16](https://github.com/laurent22/joplin/releases/tag/android-v2.11.16) (Pre-release) - 2023-05-12T12:43:08Z

- Improved: Sync as soon as the app starts, and immediately after changing a note (3eb44d2)

## [android-v2.11.14](https://github.com/laurent22/joplin/releases/tag/android-v2.11.14) (Pre-release) - 2023-05-10T12:24:40Z

- Improved: Translate Welcome notes (#8154)

## [android-v2.11.13](https://github.com/laurent22/joplin/releases/tag/android-v2.11.13) (Pre-release) - 2023-05-08T20:28:29Z

- Improved: Tells whether Hermes engine is enabled or not (5ecae17)

## [android-v2.11.10](https://github.com/laurent22/joplin/releases/tag/android-v2.11.10) (Pre-release) - 2023-05-08T10:26:14Z

- Improved: Disable Hermes engine (e9e9986)
- Fixed: Fix voice typing (d5eeb12)

## [android-v2.11.7](https://github.com/laurent22/joplin/releases/tag/android-v2.11.7) (Pre-release) - 2023-05-07T14:29:08Z

- Fixed crash when starting voice typing.

## [android-v2.11.6](https://github.com/laurent22/joplin/releases/tag/android-v2.11.6) (Pre-release) - 2023-05-07T13:53:31Z

- Disabled Hermes engine

## [android-v2.11.5](https://github.com/laurent22/joplin/releases/tag/android-v2.11.5) (Pre-release) - 2023-05-07T12:14:21Z

- Improved: Improved Vosk support (beta, fr only) (#8131)
- Improved: Updated packages react-native-share (v8.2.2), reselect (v4.1.8), sharp (v0.32.0)

## [android-v2.11.4](https://github.com/laurent22/joplin/releases/tag/android-v2.11.4) (Pre-release) - 2023-05-03T11:57:27Z

- New: Add support for offline speech to text (Beta - FR only) (#8115)
- Improved: Updated packages @react-native-community/netinfo (v9.3.9), aws, react-native-document-picker (v8.2.0), react-native-paper (v5.5.2), react-native-safe-area-context (v4.5.1), sass (v1.60.0)
- Fixed: Fixed sync crash (#8056) (#8017 by Arun Kumar)
- Fixed: Fixes issue where the note body is not updated after attaching a file (991c120)

## [android-v2.11.2](https://github.com/laurent22/joplin/releases/tag/android-v2.11.2) (Pre-release) - 2023-04-09T12:04:06Z

- Improved: Resolve #8022: Editor syntax highlighting was broken (#8023) (#8022 by Henry Heino)
- Improved: Updated packages @react-native-community/netinfo (v9.3.8)
- Fixed: Removed `MasterKey` from Sync Status report (#8026) (#7940 by Arun Kumar)
- Security: Prevent bypassing fingerprint lock on certain devices (6b72f86)

## [android-v2.11.1](https://github.com/laurent22/joplin/releases/tag/android-v2.11.1) (Pre-release) - 2023-04-08T08:49:19Z

- New: Add log info for biometrics feature (efdbaeb)
- New: Add setting to enable/disable the markdown toolbar (#7929 by Henry Heino)
- Fixed: Encode the non-ASCII characters in OneDrive URI (#7868) (#7851 by Self Not Found)
- Fixed: Fix OneDrive sync attempting to call method on `null` variable (#7987) (#7986 by Henry Heino)
- Updated packages @lezer/highlight (v1.1.4), fs-extra (v11.1.1), jsdom (v21.1.1), markdown-it-multimd-table (v4.2.1), nanoid (v3.3.6), node-persist (v3.1.3), nodemon (v2.0.22), react-native-document-picker (v8.1.4), react-native-image-picker (v5.3.1), react-native-paper (v5.4.1), react-native-share (v8.2.1), sass (v1.59.3), sqlite3 (v5.1.6), turndown (v7.1.2), yargs (v17.7.1)

## [android-v2.10.9](https://github.com/laurent22/joplin/releases/tag/android-v2.10.9) (Pre-release) - 2023-03-22T18:40:57Z

- Improved: Mark biometrics feature as beta and ensure no call is made if it is not enabled (e44a934)

## [android-v2.10.8](https://github.com/laurent22/joplin/releases/tag/android-v2.10.8) (Pre-release) - 2023-02-28T18:09:21Z

- Improved: Stop synchronization with unsupported WebDAV providers (#7819) (#7661 by [@julien](https://github.com/julien))
- Fixed: Custom sort order not synchronized (#7729) (#6956 by Tao Klerks)
- Fixed: Fix camera attachment (#7775) (#7675 by [@vikneshwar](https://github.com/vikneshwar))
- Fixed: Fixed duplicate sharing issue (#7799) (#7791 by [@jd1378](https://github.com/jd1378))
- Fixed: Fixed error when sharing a file (#7801) (#6942 by [@jd1378](https://github.com/jd1378))
- Fixed: Fixed issue where app would close after sharing a file (#7791)
- Fixed: Hide main content while biometric is enabled and not authenticated (#7781) (#7762 by [@pedr](https://github.com/pedr))
- Fixed: Sharing pictures to Joplin creates recurring duplications (#7807) (#7791 by [@jd1378](https://github.com/jd1378))

## [android-v2.10.6](https://github.com/laurent22/joplin/releases/tag/android-v2.10.6) (Pre-release) - 2023-02-10T16:22:28Z

- Improved: Add create sub-notebook feature (#7728) (#1044 by [@carlosngo](https://github.com/carlosngo))
- Fixed: Fix double-scroll issue in long notes (#7701) (#7700 by Henry Heino)
- Fixed: Fix startup error (#7688) (#7687 by Henry Heino)
- Fixed: Sharing file to Joplin does not work (#7691)

## [android-v2.10.5](https://github.com/laurent22/joplin/releases/tag/android-v2.10.5) (Pre-release) - 2023-01-21T14:21:23Z

- Improved: Improve dialogue spacing in Fountain renderer (#7628) (#7627 by [@Elleo](https://github.com/Elleo))
- Improved: Improve filesystem sync performance (#7637) (#6942 by [@jd1378](https://github.com/jd1378))
- Fixed: Fixes non-working alarms (138bc81)

## [android-v2.10.4](https://github.com/laurent22/joplin/releases/tag/android-v2.10.4) (Pre-release) - 2023-01-14T17:30:34Z

- New: Add support for multiple profiles (6bb52d5)
- Improved: Configurable editor font size (#7596 by Henry Heino)
- Improved: Confirm closing settings with unsaved changes (#7566 by Henry Heino)
- Improved: Upgrade to React Native 0.69 (7e29804)
- Improved: Upgrade to React Native 0.70 (4bdb3d0)
- Fixed: Fixed biometrics prompt on new devices (9eff7e6)
- Fixed: Fixed issue when floating keyboard is visible (#7593) (#6682 by Henry Heino)
- Fixed: Remove gray line around text editor (#7595) (#7594 by Henry Heino)

## [android-v2.10.3](https://github.com/laurent22/joplin/releases/tag/android-v2.10.3) (Pre-release) - 2023-01-05T11:29:06Z

- New: Add support for locking the app using biometrics (f10d9f7)
- Improved: Make the new text editor the default one (f5ef318)
- Fixed: Fixed proxy timeout setting UI (275c80a)
- Fixed: Settings save button visible even when no settings have been changed (#7503)

## [android-v2.10.2](https://github.com/laurent22/joplin/releases/tag/android-v2.10.2) (Pre-release) - 2023-01-02T17:44:15Z

- New: Add support for realtime search (767213c)
- Fixed: Enable autocorrect with spellcheck (#7532) (#6175 by Henry Heino)

## [android-v2.10.1](https://github.com/laurent22/joplin/releases/tag/android-v2.10.1) (Pre-release) - 2022-12-29T13:55:48Z

- Improved: Switch license to AGPL-3.0 (faf0a4e)
- Improved: Tag search case insensitive (#7368 by [@JackGruber](https://github.com/JackGruber))
- Improved: Update Mermaid: 9.1.7 to 9.2.2 (#7330 by Helmut K. C. Tessarek)
- Improved: Upgrade to react-native 0.68.5 (e2d59ee)
- Fixed: Could not attach images to notes anymore (#7471)
- Fixed: Fix CodeMirror syntax highlighting (#7386 by Henry Heino)
- Fixed: Fix attaching multiple files (#7196) (#7195 by Self Not Found)
- Fixed: Update CodeMirror (#7262) (#7253 by Henry Heino)
- Security: Fix XSS when a specially crafted string is passed to the renderer (762b4e8)

## [android-v2.9.8](https://github.com/laurent22/joplin/releases/tag/android-v2.9.8) (Pre-release) - 2022-11-01T15:45:36Z

- Updated translations

## [android-v2.9.7](https://github.com/laurent22/joplin/releases/tag/android-v2.9.7) (Pre-release) - 2022-10-30T10:25:01Z

- Fixed: Fixed notebook icons alignment (ea6b7ca)
- Fixed: Fixed crash when attaching a file.

## [android-v2.9.6](https://github.com/laurent22/joplin/releases/tag/android-v2.9.6) (Pre-release) - 2022-10-23T16:23:25Z

- New: Add monochrome icon (#6954 by Tom Bursch)
- Fixed: Fix file system sync issues (#6943 by [@jd1378](https://github.com/jd1378))
- Fixed: Fix note attachment issue (#6932 by [@jd1378](https://github.com/jd1378))
- Fixed: Fixed notebook icon spacing (633c9ac)
- Fixed: Support non-ASCII characters in OneDrive (#6916) (#6838 by Self Not Found)

## [android-v2.9.5](https://github.com/laurent22/joplin/releases/tag/android-v2.9.5) (Pre-release) - 2022-10-11T13:52:00Z

- Improved: Disable multi-highlighting to fix context menu (9b348fd)
- Improved: Display icon for all notebooks if at least one notebook has an icon (ec97dd8)

## [android-v2.9.3](https://github.com/laurent22/joplin/releases/tag/android-v2.9.3) (Pre-release) - 2022-10-07T11:12:56Z

- Improved: Convert empty bolded regions to bold-italic regions in beta editor (#6807) (#6808 by Henry Heino)
- Improved: Increase the attachment size limit to 200MB (#6848 by Self Not Found)
- Improved: Show client ID in log (#6897 by Self Not Found)
- Improved: Supports attaching multiple files to a note at once (#6831 by Self Not Found)
- Improved: Update Mermaid 8.13.9 to 9.1.7 (#6849 by Helmut K. C. Tessarek)
- Fixed: Double/triple-tap selection doesn't show context menu  (#6803) (#6802 by Henry Heino)
- Fixed: Fix multiple webview instances (#6841 by Henry Heino)
- Fixed: Fix resources sync when proxy is set (#6817) (#6688 by Self Not Found)
- Fixed: Fixed crash when trying to move note to notebook (#6898)

## [android-v2.9.2](https://github.com/laurent22/joplin/releases/tag/android-v2.9.2) (Pre-release) - 2022-09-01T11:14:58Z

- New: Add Markdown toolbar (#6753 by Henry Heino)
- New: Add long-press tooltips (#6758 by Henry Heino)
- Improved: Enable spellcheck by default on beta editor (#6778 by Henry Heino)
- Improved: Setting to disable spellcheck in beta editor (#6780 by Henry Heino)
- Fixed: Don't reload the application on screen rotation (#6737) (#6732 by Henry Heino)
- Fixed: Fix default font in beta editor (#6760) (#6759 by Henry Heino)
- Fixed: Fix side menu width on wide screen devices (#6662 by Tolulope Malomo)
- Fixed: Fixed Android filesystem sync (resources) (#6789) (#6779 by [@jd1378](https://github.com/jd1378))
- Fixed: Fixed handling of normal paths in filesystem sync (#6792) (#6791 by [@jd1378](https://github.com/jd1378))

## [android-v2.9.1](https://github.com/laurent22/joplin/releases/tag/android-v2.9.1) (Pre-release) - 2022-08-12T17:14:49Z

- New: Add alt text/roles to some buttons to improve accessibility (#6616 by Henry Heino)
- New: Add keyboard-activatable markdown commands (e.g. bold, italicize) on text editor (#6707 by Henry Heino)
- Improved: Ctrl+F search support in beta editor (#6587 by Henry Heino)
- Improved: Improve syntax highlighting on mobile beta editor (#6684 by Henry Heino)
- Improved: Removes whitespace above navigation component (#6597 by [@tmclo](https://github.com/tmclo))
- Fixed: Do not encrypt non-owned note if it was not shared encrypted (#6645)
- Fixed: Fix checklist continuation in beta editor (#6577) (#6576 by Henry Heino)
- Fixed: Fixed android filesystem sync (#6395) (#5779 by [@jd1378](https://github.com/jd1378))
- Fixed: Note links with HTML notation did not work (#6515)
- Fixed: Scroll selection into view in beta editor when window resizes (#6610) (#5949 by Henry Heino)

## [android-v2.8.1](https://github.com/laurent22/joplin/releases/tag/android-v2.8.1) (Pre-release) - 2022-05-18T13:35:01Z

- Improved: Allow filtering tags in tag dialog (#6221 by [@shinglyu](https://github.com/shinglyu))
- Improved: Automatically start sync after setting the sync parameters (ff066ba)
- Improved: Color of Date-Time text changed to match theme (#6279 by Ayush Srivastava)
- Improved: Handle invalid revision patches (#6209)
- Improved: Improve error message when revision metadata cannot be decoded, to improve debugging (a325bf6)
- Improved: Make search engine filter keywords case insensitive (#6267) (#6266 by [@JackGruber](https://github.com/JackGruber))
- Improved: Sort sync target options (814a5a0)
- Fixed: "Move Note" dropdown menu can be very narrow (#6306) (#3564 by Ayush Srivastava)
- Fixed: Cursor hard to see in dark mode (#6307) (#5987 by Henry Heino)
- Fixed: Ensure that note revision markup type is set correctly (#6261)
- Fixed: Error when pressing undo or redo button while editor is closed (#6426) (#6328 by Tolulope Malomo)
- Fixed: Long path in "Export profile" prevents tapping OK button (#6359) (#6026 by Tolulope Malomo)
- Fixed: Prevent multiline note titles (#6144) (#5482 by [@Daeraxa](https://github.com/Daeraxa))
- Fixed: Support inserting attachments from Beta Editor (#6325) (#6324 by Henry Heino)
- Fixed: The camera button remains clickable after taking a photo bug (#6222 by [@shinglyu](https://github.com/shinglyu))

## [android-v2.7.2](https://github.com/laurent22/joplin/releases/tag/android-v2.7.2) (Pre-release) - 2022-02-12T12:51:29Z

- New: Add additional time format HH.mm (#6086 by [@vincentjocodes](https://github.com/vincentjocodes))
- Improved: Do not duplicate resources when duplicating a note (721d008)
- Improved: Make heading 4, 5 and 6 styling more consistent (fca5875)
- Improved: Show login prompt for OneDrive (#5933 by Jonathan Heard)
- Improved: Update Mermaid 8.13.5 -&gt; 8.13.9 and Katex dependencies (#6039 by Helmut K. C. Tessarek)
- Fixed: Shared resource was not encrypted with correct encryption key (#6092)

## [android-v2.6.9](https://github.com/laurent22/joplin/releases/tag/android-v2.6.9) - 2021-12-20T14:58:42Z

- Fixed: Fixed issue where synchroniser would try to update a shared folder that is not longer accessible (667d642)

## [android-v2.6.8](https://github.com/laurent22/joplin/releases/tag/android-v2.6.8) - 2021-12-17T10:15:00Z

- Improved: Update Mermaid: 8.12.1 -&gt; 8.13.5 (#5831 by Helmut K. C. Tessarek)
- Fixed: Links in flowchart Mermaid diagrams (#5830) (#5801 by Helmut K. C. Tessarek)

## [android-v2.6.5](https://github.com/laurent22/joplin/releases/tag/android-v2.6.5) (Pre-release) - 2021-12-13T09:41:18Z

- Fixed: Fixed "Invalid lock client type" error when migrating sync target (e0e93c4)

## [android-v2.6.4](https://github.com/laurent22/joplin/releases/tag/android-v2.6.4) (Pre-release) - 2021-12-01T11:38:49Z

- Improved: Also duplicate resources when duplicating a note (c0a8c33)
- Improved: Improved S3 sync error handling and reliability, and upgraded S3 SDK (#5312 by Lee Matos)
- Fixed: Alarm setting buttons were no longer visible (#5777)
- Fixed: Alarms were not being triggered in some cases (#5798) (#5216 by Roman Musin)
- Fixed: Fixed opening attachments (6950c40)
- Fixed: Handle duplicate attachments when the parent notebook is shared (#5796)

## [android-v2.6.3](https://github.com/laurent22/joplin/releases/tag/android-v2.6.3) (Pre-release) - 2021-11-21T16:59:46Z

- New: Add date format YYYY/MM/DD (#5759 by Helmut K. C. Tessarek)
- New: Add support for faster built-in sync locks (#5662)
- New: Add support for sharing notes when E2EE is enabled (#5529)
- New: Added support for notebook icons (e97bb78)
- Improved: Improved error message when synchronising with Joplin Server (#5754)
- Improved: Makes it impossible to have multiple instances of the app open (#5587 by Filip Stanis)
- Improved: Remove non-OSS dependencies (#5735 by [@muelli](https://github.com/muelli))
- Fixed: Fixed issue that could cause application to needlessly lock the sync target (0de6e9e)
- Fixed: Fixed issue with parts of HTML notes not being displayed in some cases (#5687)
- Fixed: Sharing multiple notebooks via Joplin Server with the same user results in an error (#5721)

## [android-v2.6.1](https://github.com/laurent22/joplin/releases/tag/android-v2.6.1) (Pre-release) - 2021-11-02T20:49:53Z

- Improved: Upgraded React Native from 0.64 to 0.66 (66e79cc)
- Fixed: Fixed potential infinite loop when Joplin Server session is invalid (c5569ef)

## [android-v2.5.5](https://github.com/laurent22/joplin/releases/tag/android-v2.5.5) (Pre-release) - 2021-10-31T11:03:16Z

- New: Add padding around beta text editor (365e152)
- Improved: Capitalise first word of sentence in beta editor (4128be9)
- Fixed: Do not render very large code blocks to prevent app from freezing (#5593)

## [android-v2.5.3](https://github.com/laurent22/joplin/releases/tag/android-v2.5.3) (Pre-release) - 2021-10-28T21:47:18Z

- New: Add support for public-private key pairs and improved master password support (#5438)
- New: Added mechanism to migrate default settings to new values (72db8e4)
- Improved: Ensure that shared notebook children are not deleted when shared, unshared and shared again, and a conflict happens (ccf9882)
- Improved: Improve delete dialog message (#5481) (#4701 by Helmut K. C. Tessarek)
- Improved: Improved Joplin Server configuration check to better handle disabled accounts (72c1235)
- Improved: Improved handling of expired sessions when using Joplin Server (33249ca)
- Fixed: Certain attachments were not being automatically deleted (#932)
- Fixed: Fixed logic of setting master password in Encryption screen (#5585)

## [android-v2.4.3](https://github.com/laurent22/joplin/releases/tag/android-v2.4.3) - 2021-09-29T18:47:24Z

- Fixed: Fix default sync target (4b39d30)

## [android-v2.4.2](https://github.com/laurent22/joplin/releases/tag/android-v2.4.2) (Pre-release) - 2021-09-22T17:02:37Z

- Improved: Allow disabling any master key, including default or active one (9407efd)
- Improved: Update Mermaid 8.10.2 -&gt; 8.12.1 and fix gitGraph crash (#5448) (#5295 by Helmut K. C. Tessarek)
- Fixed: Misinterpreted search term after filter in quotation marks (#5445) (#5444 by [@JackGruber](https://github.com/JackGruber))

## [android-v2.4.1](https://github.com/laurent22/joplin/releases/tag/android-v2.4.1) (Pre-release) - 2021-08-30T13:37:34Z

- New: Add a way to disable a master key (7faa58e)
- New: Add support for single master password, to simplify handling of multiple encryption keys (ce89ee5)
- New: Added "None" sync target to allow disabling synchronisation (f5f05e6)
- Improved: Do not display master key upgrade warnings for new master keys (70efadd)
- Improved: Improved sync locks so that they do not prevent upgrading a sync target (06ed58b)
- Improved: Show the used tags first in the tagging dialog (#5315 by [@JackGruber](https://github.com/JackGruber))
- Fixed: Fixed crash when a required master key does not exist (#5391)

## [android-v2.3.4](https://github.com/laurent22/joplin/releases/tag/android-v2.3.4) (Pre-release) - 2021-08-15T13:27:57Z

- Fixed: Bump highlight.js to v11.2 (#5278) (#5245 by Roman Musin)

## [android-v2.3.3](https://github.com/laurent22/joplin/releases/tag/android-v2.3.3) (Pre-release) - 2021-08-12T20:46:15Z

- Improved: Improved E2EE usability by making its state a property of the sync target (#5276)

## [android-v2.2.5](https://github.com/laurent22/joplin/releases/tag/android-v2.2.5) (Pre-release) - 2021-08-11T10:54:38Z

- Revert "Plugins: Add ability to make dialogs fit the application window (#5219)" as it breaks several plugin webviews.
- Revert "Resolves #4810, Resolves #4610: Fix AWS S3 sync error and upgrade framework to v3 (#5212)" due to incompatibility with some AWS providers.
- Improved: Upgraded React Native to v0.64 (afb7e1a)

## [android-v2.2.3](https://github.com/laurent22/joplin/releases/tag/android-v2.2.3) (Pre-release) - 2021-08-09T18:48:29Z

- Improved: Ensure that timestamps are not changed when sharing or unsharing a note (cafaa9c)
- Improved: Fix AWS S3 sync error and upgrade framework to v3 (#5212) (#4810 by Lee Matos)
- Improved: Handles OneDrive throttling responses and sets User-Agent based on Microsoft best practices (#5246) (#5244 by [@alec](https://github.com/alec))
- Improved: Make sync icon spin in the right direction (#5275) (#4588 by Lee Matos)
- Fixed: Fixed issue with orphaned resource being created in case of a resource conflict (#5223)

## [android-v2.2.1](https://github.com/laurent22/joplin/releases/tag/android-v2.2.1) (Pre-release) - 2021-07-13T17:37:38Z

- New: Added improved editor (beta)
- Improved: Disable backup to Google Drive (#5114 by Roman Musin)
- Improved: Interpret only valid search filters (#5103) (#3871 by [@JackGruber](https://github.com/JackGruber))
- Improved: Removed old editor code (e01a175)

## [android-v2.1.4](https://github.com/laurent22/joplin/releases/tag/android-v2.1.4) - 2021-07-03T08:31:36Z

- Fixed: Fixes #5133: Items keep being uploaded to Joplin Server after a note has been shared.
- Fixed: Fixed issue where untitled notes where created after a note had been shared and synced

## [android-v2.1.3](https://github.com/laurent22/joplin/releases/tag/android-v2.1.3) - 2021-06-27T13:34:12Z

- New: Add support for X-API-MIN-VERSION header (51f3c00)
- Improved: Activate Joplin Server optimisations (3d03321)
- Improved: Also allow disabling TLS errors for Joplin Cloud to go around error UNABLE_TO_GET_ISSUER_CERT_LOCALLY (118a2f9)
- Fixed: Fixed search when the index contains non-existing notes (5ecac21)
- Fixed: Fixed version number on config screen (65e9268)

## [android-v2.1.2](https://github.com/laurent22/joplin/releases/tag/android-v2.1.2) (Pre-release) - 2021-06-20T18:36:23Z

- Fixed: Fixed error that could prevent a revision from being created, and that would prevent the revision service from processing the rest of the notes (#5051)
- Fixed: Fixed issue when trying to sync an item associated with a share that no longer exists (5bb68ba)

## [android-v2.1.1](https://github.com/laurent22/joplin/releases/tag/android-v2.1.1) (Pre-release) - 2021-06-19T16:42:57Z

- New: Add version number to log (525ab01)
- New: Added feature flags to disable Joplin Server sync optimisations by default, so that it still work with server 2.0 (326fef4)
- Improved: Allow enabling and disabling feature flags (5b368e3)
- Improved: Allow uploading items in batch when synchronising with Joplin Server (0222c0f)
- Improved: Improved first sync speed when synchronising with Joplin Server (4dc1210)
- Improved: Mask auth token and password in log (0d33955)
- Improved: Optimise first synchronisation, when items have never been synced before (15ce5cd)
- Improved: Update Mermaid: 8.8.4 -&gt; 8.10.2 (#5092 by Helmut K. C. Tessarek)

## [android-v2.0.4](https://github.com/laurent22/joplin/releases/tag/android-v2.0.4) - 2021-06-16T12:15:56Z

- Improved: Prevent sync process from being stuck when the download state of a resource is invalid (5c6fd93)

## [android-v2.0.3](https://github.com/laurent22/joplin/releases/tag/android-v2.0.3) (Pre-release) - 2021-06-16T09:48:58Z

- Improved: Verbose mode for synchronizer (4bbb3d1)

## [android-v2.0.2](https://github.com/laurent22/joplin/releases/tag/android-v2.0.2) - 2021-06-15T20:03:21Z

- Improved: Conflict notes will now populate a new field with the ID of the conflict note. (#5049 by [@Ahmad45123](https://github.com/Ahmad45123))
- Improved: Filter out form elements from note body to prevent potential XSS (thanks to Dmytro Vdovychinskiy for the PoC) (feaecf7)
- Improved: Focus note editor where tapped instead of scrolling to the end (#4998) (#4216 by Roman Musin)
- Improved: Improve search with Asian scripts (#5018) (#4613 by [@mablin7](https://github.com/mablin7))
- Fixed: Fixed and improved alarm notifications (#4984) (#4912 by Roman Musin)
- Fixed: Fixed opening URLs that contain non-alphabetical characters (#4494)
- Fixed: Fixed user content URLs when sharing note via Joplin Server (2cf7067)
- Fixed: Inline Katex gets broken when editing in Rich Text editor (#5052) (#5025 by [@Subhra264](https://github.com/Subhra264))
- Fixed: Items are filtered in the API search (#5017) (#5007 by [@JackGruber](https://github.com/JackGruber))
- Fixed: Wrong field removed in API search (#5066 by [@JackGruber](https://github.com/JackGruber))
