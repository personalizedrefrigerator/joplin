# `styled-components` → RSCSS/SCSS Migration Progress

Tracks the effort to remove [`styled-components`](https://styled-components.com/) from the desktop app (`packages/app-desktop`) in favour of plain SCSS + [RSCSS](https://ricostacruz.com/rscss/) classes, which is the styling method we use for new components.

This file is both the **strategy** (how to migrate a component) and the **index** (what's left). It is the source of truth — read it first when resuming, and update it as you go.

## Goal

Replace each `styled.foo\`...\`` / `styled(Component)\`...\`` definition with a CSS class in a `style.scss`, applied to a plain element via `className`, **without changing the rendered appearance**. The end state is that `styled-components` can be removed from `packages/app-desktop/package.json`.

## Background

Read these first:

- [readme/dev/spec/desktop_styling.md](spec/desktop_styling.md) — how stylesheets are built and included.
- [readme/dev/spec/rscss.md](spec/rscss.md) — the RSCSS conventions, theme CSS variables, and a worked example.

The reference for a fully-migrated component is the Sidebar ([Sidebar/styles/](https://github.com/laurent22/joplin/tree/dev/packages/app-desktop/gui/Sidebar/styles)), and [ShareFolderDialog](https://github.com/laurent22/joplin/tree/dev/packages/app-desktop/gui/ShareFolderDialog) is the first component migrated under this effort.

## Rules

For each file:

1. **Create one stylesheet per component** (RSCSS keeps each component in its own file — see [css-structure.md](https://github.com/rstacruz/rscss/blob/main/docs/css-structure.md)). A simple component → `MyComponent/style.scss`. A component made of several sub-components → a `MyComponent/styles/` folder with one file per component plus a `MyComponent/style.scss` that `@use`s them (as the Sidebar and ShareFolderDialog do). Register the component's `style.scss` with an `@use` line:
	- Component-local styles → root [packages/app-desktop/style.scss](https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/style.scss).
	- App-wide / reusable styles → a file in [gui/styles/](https://github.com/laurent22/joplin/tree/dev/packages/app-desktop/gui/styles), registered in [gui/styles/index.scss](https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/gui/styles/index.scss). `link-button.scss` is the model for a small shared style.

2. **Name with RSCSS:** component classes are two+ dash-separated words; element classes are one word targeted with a single `>`; variants are dash-prefixed (`-active`). **Keep selectors at most one `>` deep** — if a block has its own elements, make it its own component (e.g. `.share-recipient`, not `.recipients > .recipient-list > .recipient`). Scope generic element names (`.error`, `.name`, `.icon`) under their component so they don't leak.

3. **Map theme lookups to CSS variables.** `props.theme.fooBar` → `var(--joplin-foo-bar)` (see [themeToCss.ts](https://github.com/laurent22/joplin/blob/dev/packages/lib/services/style/themeToCss.ts)). Numeric sizes already carry a unit, so use the variable directly; use `calc()` for arithmetic (`calc(var(--joplin-main-padding) / 2)`).

4. **Replace prop-driven styles with CSS.** A styled-component that branched on a prop (`index`, `selected`, `disabled`) becomes a dash-variant class toggled in the component, or a structural selector (`&:nth-child(even)`). Drop the now-unused prop and any parameter that only fed it.

5. **Shared helpers in [gui/style/](https://github.com/laurent22/joplin/tree/dev/packages/app-desktop/gui/style)** (`StyledMessage`, `StyledInput`, `StyledLink`, …) are imported by several components. Migrate each helper in its own commit that moves the style into a `gui/styles/*.scss` class **and** updates every consumer to use `className`. Delete the helper file once it has no importers. If a helper turns out to have a single consumer, fold it into that component's stylesheet instead (as was done for `StyledFormLabel`).

6. **`styled-components` infrastructure** (`ThemeProvider`, `StyleSheetManager`, `createGlobalStyle` in `Root.tsx` and `EditorWindow.tsx`) is what makes `props.theme` available. **Migrate it last**, only once no component reads the theme through styled-components. Removing it early breaks every not-yet-migrated component.

7. **Don't change unrelated code.** No whitespace-only edits, no comments unless the *why* is non-obvious (the `&:nth-child(even)` row-colour trick is a good example).

8. **Links to `packages/**` in docs must be GitHub URLs** (`https://github.com/laurent22/joplin/blob/dev/...`), not repo-relative paths — relative paths break the documentation website build. Links between docs under `readme/` may stay relative.

## Validation (per commit)

- `yarn tsc --noEmit` in `packages/app-desktop` — type-check.
- `yarn eslint <changed files>` — lint.
- Compile the stylesheet to catch SCSS errors. The build uses `compileSass` (see [gulpfile.ts](https://github.com/laurent22/joplin/blob/dev/packages/app-desktop/gulpfile.ts)); a quick standalone check:
	```bash
	cd packages/app-desktop
	node -e "require('@joplin/tools/compileSass')(__dirname+'/style.scss','/tmp/check.css').then(()=>console.log('ok'))"
	```
- `yarn cspell <changed docs>` for any documentation.
- Where practical, visually compare the component before/after — appearance must not change.

## Workflow

- **One commit per file** (or per shared helper + its consumers), smallest first.
- If you add a new `.scss` or `.ts`/`.tsx` file, run `yarn updateIgnored` from the repo root.
- **Update the Status table below as you go**, not at the end — sessions can be interrupted or compacted.
- When resuming, trust this file, then reconcile against the live state:
	```bash
	grep -rl "styled-components" packages/app-desktop --include="*.ts" --include="*.tsx" | grep -vE "node_modules|/build/"
	```

## Notes / known special cases

- `gui/style/StyledTextInput.tsx` has **no importers** — it is dead code and can simply be deleted.
- `gui/Sidebar/styles/index.ts` is **partially migrated**: most of the Sidebar already uses SCSS (see `Sidebar/styles/*.scss`), but this file still holds ~12 styled-components. Finish by moving each into the existing `Sidebar/styles/` folder.
- `utils/checkForUpdatesUtilsTestData.ts` matches a `styled-components` grep but only inside changelog **text** — it is **not** a real usage and needs no migration.
- `Button.tsx` is depended on widely; several other styled-components do `styled(Button)\`...\``. Migrating `Button` may simplify those call sites, so it's a good high-leverage target despite its size.

## Status

Legend: ✅ done · 🚧 in progress · ⬜ not started · ➖ no migration needed

| File | styled defs | Shared-helper deps | Status | Notes |
| --- | --- | --- | --- | --- |
| `gui/ShareFolderDialog/ShareFolderDialog.tsx` | 12 | StyledFormLabel, StyledMessage | ✅ | First migration; reference example. |
| `gui/style/StyledFormLabel.tsx` | 1 | — | ✅ | Single consumer; folded into ShareFolderDialog and deleted. |
| `gui/style/StyledTextInput.tsx` | 1 | — | ✅ | Dead code — deleted. |
| `gui/style/StyledInput.tsx` | 1 | — | ✅ | → reusable `.styled-input` in `gui/styles`; consumers (EditFolderDialog, PasswordInput, SearchInput) use plain inputs. Alpha colours → `color-mix(..., transparent)`. Helper deleted. |
| `gui/style/StyledLink.tsx` | 1 | — | ✅ | → `.styled-link` in `gui/styles` (PluginsStates). MissingPasswordHelpLink already had an inline `urlStyle` that fully overrode it, so it became a plain `<a>`. Helper deleted. |
| `gui/style/StyledMessage.tsx` | 1 | — | ✅ | Single consumer (PluginsStates' `RepoApiErrorMessage`, always `type="error"`); folded into `.repo-api-error` in `controls/plugins/styles`. Helper deleted. |
| `gui/ConfigScreen/ButtonBar.tsx` | 1 | — | ✅ | `button-bar` → `ConfigScreen/styles/button-bar.scss`. |
| `gui/DialogTitle.tsx` | 1 | — | ✅ | `dialog-title` → `gui/styles/`. Dropped unused `justifyContent` prop (only ever `center`, the default). |
| `gui/MainScreen.tsx` | 1 | — | ✅ | Reused existing `.user-webview-dialog-container` (identical styles already in `gui/styles`). |
| `gui/NoteListWrapper/NoteListWrapper.tsx` | 1 | — | ✅ | `note-list-wrapper` → `NoteListWrapper/note-list-wrapper.scss`. |
| `gui/SearchBar/SearchBar.tsx` | 1 | — | ✅ | `search-bar` → `SearchBar/search-bar.scss`. Dropped the unused `Root` export. |
| `gui/StatusScreen/StatusScreen.tsx` | 1 | — | ✅ | `advanced-tool-item` → `StatusScreen/advanced-tool-item.scss`. |
| `services/plugins/UserWebviewDialogButtonBar.tsx` | 1 | — | ✅ | Dropped the redundant `styled(Button)` + `mr` prop; inter-button spacing is now `gap: 6px` on the container. |
| `gui/ConfigScreen/controls/plugins/SearchPlugins.tsx` | 2 | — | ✅ | `.search-plugins > .results`; empty `Root` became a plain anchor div. |
| `gui/PdfViewer.tsx` | 2 | — | ✅ | `.pdf-viewer > .frame` → `gui/pdf-viewer.scss`. |
| `gui/QuitSyncDialog.tsx` | 2 | — | ✅ | `.quit-sync-dialog > .message` → `gui/quit-sync-dialog.scss`. |
| `gui/ResizableLayout/utils/style.ts` | 3 | — | ✅ | → `ResizableLayout/styles/` (`.resizable-layout-item`, `.move-overlay`, `.move-mode-message`). Dynamic size stays inline; the appearance-based overlay scrim is fed via a `--move-overlay-background` custom property (ResizableLayout now takes `themeId`). File deleted. |
| `gui/ConfigScreen/controls/plugins/PluginsStates.tsx` | 4 | StyledLink, StyledMessage | ✅ | `.plugins-states`, `.user-plugins` (+`-spaced`), `.tools-button`; `.repo-api-error` done earlier with StyledMessage. |
| `gui/ResizableLayout/MoveButtons.tsx` | 4 | — | ✅ | `.move-buttons` / `.move-button-row` with `> .arrow` / `> .empty`; disabled-arrow opacity via `:disabled`, hidden placeholder via `.empty`. |
| `gui/NoteListControls/NoteListControls.tsx` | 7 | — | ✅ | `note-list-controls.scss`; button overrides scoped under `.note-list-controls`. Per-instance padding/gap and the pair-button width stay inline (computed). |
| `gui/Button/Button.tsx` | 9 | — | ✅ | `.app-button` with `-primary/-secondary/-tertiary/-recommended/-sidebar-secondary`, `-small`, `-square` variants and `> .icon` / `> .title` elements (`app-button.scss`). Dropped styled-system `space`; the `ml` consumers (EditFolderDialog, PluginBox) now use CSS/inline margin. `styled(Button)` still works via `className` forwarding. |
| `gui/ConfigScreen/controls/plugins/PluginBox.tsx` | 11 | — | ⬜ | |
| `gui/Sidebar/styles/index.ts` | 12 | — | ⬜ | Partially migrated; finish into `Sidebar/styles/`. |
| `gui/SyncWizard/Dialog.tsx` | 14 | — | ⬜ | Largest. |
| `gui/NoteEditor/EditorWindow.tsx` | 0 | — | ➖ | Infrastructure (`StyleSheetManager`); migrate last. |
| `gui/Root.tsx` | 0 | — | ➖ | Infrastructure (`ThemeProvider`/`StyleSheetManager`/`createGlobalStyle`); migrate last. |

When every row above is ✅/➖, remove `styled-components` from `packages/app-desktop/package.json` and run `yarn install`.
