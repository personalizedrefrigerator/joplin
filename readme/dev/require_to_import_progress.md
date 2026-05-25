# `require()` → `import` Migration Progress

Tracks the effort to migrate `const X = require('...')` to typed `import` statements so values pulled in from other modules carry real types instead of implicit `any`.

## Goal

Replace `const X = require('...')` with a typed `import` whenever possible and the change is mechanical. `require()` is fine to keep when the imported module has no types — it already returns implicit `any`, so no `: any` or eslint-disable is needed. The aim is to narrow `require` to the cases where it's actually load-bearing, and let the type checker cover the rest.

## Rules

For each `const X = require('...')`:

1. **Convert to a typed `import`** when types exist:
   - The module ships its own `.d.ts` (check `node_modules/<pkg>/package.json` for a `types` field).
   - A matching `@types/<pkg>` is already installed.
   - The module is an internal `@joplin/*` package or a relative path to a `.ts` file.
   - It's a Node built-in (`path`, `fs`, etc.) — but confirm the installed `@types/node` covers the specific submodule (e.g. `readline/promises` needs ≥ 17).
2. **Pick the import form that matches the module's shape:**
   - Named exports: `import { foo, bar } from 'pkg'` (use `{ foo as bar }` to rename rather than a separate `const`).
   - `module.exports = X` style: with `esModuleInterop: false` (this repo's setting), use `import * as X from 'pkg'`. `import X from 'pkg'` only works when the typings declare a real default export.
3. **Leave the `require()` in place** when:
   - The module has no types available — migrating would force a `// @ts-ignore`, a new `declare module` shim, or a fresh `@types/*` install.
   - There's an explicit comment explaining why `require()` is needed (RN bundler compatibility, conditional / lazy / side-effect load, dynamic path).
   - It's part of a `: typeof X = require(...)` pattern already typed via a paired `import type` — a deliberate runtime workaround.
   - Converting would require non-mechanical refactoring.
4. **Don't install new `@types/*` packages or upgrade dependencies** as part of this migration. The aim is to surface existing types, not expand the dependency graph.
5. **Don't make whitespace-only changes** to surrounding code (per `CLAUDE.md`).
6. **Don't add explanatory comments** unless the *why* is non-obvious (e.g. "needs `import *` because the package uses `module.exports = ...`").
7. After each package, run `yarn tsc --noEmit` from the package directory to verify nothing broke. The pre-commit hook handles linting and spellcheck.

## Files to never touch

- `packages/generator-joplin/generators/app/templates/**` — Yeoman template; package lacks a `typescript` dep.
- `packages/app-cli/tests/support/plugins/*/api/types.ts` and similar — regenerated plugin API copies.
- Anything under `**/node_modules/**` or `**/build/**`.

## Workflow

- One PR per package, smallest first.
- **Update this file as you go, not at the end.** Sessions can be auto-compacted or interrupted; the on-disk file is the source of truth.
  - After each file: add an entry to the package's **Per-package detail** subsection.
  - After each package: update the **Status** table row.
  - For large packages (`lib`, `app-desktop`, `app-mobile`), checkpoint the row every ~20 files.
- When resuming, re-read this file first and compare entries against the live state with:
  ```bash
  grep -rn --include="*.ts" --include="*.tsx" -E "^\s*const\s+[^=]+=\s*require\(" packages/<name>/
  ```
  Trust the file, not memory.

## Status

Counts captured 2026-05-25, before any work. `const X = require(...)` occurrences in `*.ts`/`*.tsx` source files, excluding `node_modules/` and `build/`. Some will legitimately stay as `require()` after evaluation (untyped libraries, RN bundler workarounds, etc.) — the "Converted" column tracks how many were actually migrated.

| # | Package | Requires (start) | Converted | Remaining | Status |
|---|---|---:|---:|---:|---|
| 1 | pdf-viewer | 1 | 0 | 1 | done (2026-05-25) |
| 2 | fork-uslug | 1 | 0 | 1 | done (2026-05-25) |
| 3 | default-plugins | 1 | 1 | 0 | done (2026-05-25) |
| 4 | editor | 2 | 0 | 2 | done (2026-05-25) |
| 5 | plugin-repo-cli | 2 | 0 | 2 | done (2026-05-25) |
| 6 | htmlpack | 3 | 3 | 0 | done (2026-05-25) |
| 7 | utils | 9 | 4 | 5 | done (2026-05-25) |
| 8 | renderer | 23 | 7 | 16 | done (2026-05-25) |
| 9 | server | 26 | 9 | 17 | done (2026-05-25) |
| 10 | tools | 49 | 29 | 20 | done (2026-05-25) |
| 11 | app-cli | 49 | 18 | 31 | done (2026-05-25) |
| 12 | app-mobile | 61 |  |  | pending |
| 13 | app-desktop | 131 |  |  | pending |
| 14 | lib | 195 |  |  | pending |
| — | generator-joplin | 1 | — | — | excluded (template) |

Total in-scope `require()` calls at start: **558** (counted across `*.ts`/`*.tsx`, excluding `**/node_modules/**`, `**/build/**` and `**/dist/**`).

## Recommended order

Smallest first so the workflow stabilises before the large ones:

1. Warm-up: pdf-viewer, fork-uslug, default-plugins, editor, plugin-repo-cli, htmlpack (~10 requires total)
2. utils (9)
3. renderer (23)
4. server (27)
5. tools (49)
6. app-cli (54)
7. app-mobile (61)
8. app-desktop (131)
9. lib (195) — biggest; do last so prior packages inform the work

## Per-package detail

Each package gets a subsection added below when work begins. Format:

```markdown
## packages/<name>
Session date: YYYY-MM-DD

Files processed:
- path/to/file.ts — N converted, M left (reasons for skips)

Files skipped entirely:
- path/to/file.ts — reason
```

## packages/pdf-viewer
Session date: 2026-05-25

Files skipped entirely:
- main.tsx — `react-dom/client` has types and tsc passes the conversion, but the package's build scripts are all disabled (`tsc: ""`, `build: ""`) and the bundling pipeline that produces the `vendor/lib/@joplin/pdf-viewer/` artifact isn't traceable from this repo. The author explicitly chose `require()` to fix a React 18 warning (commit 58da15432). Leave alone until the bundling path is understood.

## packages/fork-uslug
Session date: 2026-05-25

Files skipped entirely:
- lib/uslug.ts — `node-emoji` has no types installed.

## packages/default-plugins
Session date: 2026-05-25

Files processed:
- build.ts — 1 converted (`yargs` → `import * as yargs from 'yargs'`).

## packages/editor
Session date: 2026-05-25

Files skipped entirely:
- CodeMirror/utils/formatting/RegionSpec.ts — imports from `@joplin/lib/string-utils-common`, which is a deliberate `.js` file (no `.d.ts`) per the comment at the top of that file.
- CodeMirror/CodeMirror5Emulation/CodeMirror5Emulation.ts — same as above.

## packages/plugin-repo-cli
Session date: 2026-05-25

Files skipped entirely:
- commands/updateRelease.ts — `node-fetch` is `require(...).default` with an explicit comment linking the known node-fetch issue; `gh-release-assets` has no types installed.

## packages/htmlpack
Session date: 2026-05-25

Files processed:
- packToWriter.ts — 1 converted (`html-entities`).
- index.ts — 1 converted (`datauri/sync` — uses `import X = require(...)` because the package uses `export = X`).
- utils/parseHtmlAsync.ts — 1 converted (`@joplin/fork-htmlparser2`).

## packages/utils
Session date: 2026-05-25

Files processed:
- Logger.ts — 2 converted (`moment`, `async-mutex`), 1 left (`sprintf-js` — no @types installed).
- html.ts — 2 converted (`html-entities`, `@joplin/fork-htmlparser2`).

## packages/renderer
Session date: 2026-05-25

Files processed:
- htmlUtils.ts — 2 converted (`html-entities`, `@joplin/fork-htmlparser2`).
- utils.ts — 1 converted (`html-entities`).
- highlight.ts — 1 converted (`highlight.js/lib/core`).
- MdToHtml.ts — 1 converted (`html-entities`); 4 left: `md5` (no types), `@joplin/fork-uslug` (types describe `{ default: fn }` but `index.js` unwraps `.default`, so types are misaligned with runtime), `markdown-it-anchor` (no types), `./defaultNoteStyle` (JS, no `.d.ts`).
- MdToHtml/renderMedia.ts — 1 converted (`html-entities`).
- MdToHtml/linkReplacement.ts — 1 converted (`html-entities`); 2 left: `../urlUtils.js` (JS, no `.d.ts`), `font-awesome-filetypes` (no types).

Files skipped entirely:
- MarkupToHtml.ts — `markdown-it` is paired with `import type * as MarkdownItType` (deliberate workaround for mobile bundling, per the convention this plan skips).
- HtmlToHtml.ts — `md5` (no types).
- MdToHtml/rules/katex.ts — `md5`, `json-stringify-safe` (no types); `./katex_mhchem.js` (JS, no `.d.ts`).
- MdToHtml/rules/highlight_keywords.ts — `md5` (no types); `../../stringUtils.js` (JS).
- MdToHtml/rules/sanitize_html.ts — `md5` (no types).
- MdToHtml/rules/link_open.ts — `../../urlUtils.js` (JS).
- MdToHtml/rules/fountain.ts — `../../vendor/fountain.min.js` (vendor JS).

## packages/server
Session date: 2026-05-25

Files processed:
- app.ts — 1 converted (`sqlite3`); 2 left: `@koa/cors` (no types), `@joplin/lib/shim-init-node.js` (lib's `.ts` source uses `module.exports = { ... }` rather than ES `export`, so a typed `import {}` fails — would require modifying lib to convert).
- utils/htmlUtils.ts — 1 converted (`html-entities`).
- utils/bytes.ts — 1 converted (`pretty-bytes`, via `import X = require()` because the package uses `export =`).
- utils/joplinUtils.ts — 1 converted (`@joplin/lib/string-utils`); 1 left (`@joplin/lib/database-driver-node.js` — JS only, no `.d.ts`).
- utils/testing/populateDatabase.ts — 1 converted (`sqlite3`); 1 left (`shim-init-node`, same reason as app.ts).
- utils/routeUtils.ts — 1 converted (`@joplin/lib/path-utils`).
- utils/testing/testRouters.ts — 2 converted (`query-string`, `child_process.spawn`); 1 left (inline `require('child_process').exec` inside a function — would require refactoring to top-level).
- routes/admin/emails.ts — 1 converted (`@joplin/lib/string-utils`).

Files skipped entirely:
- config.ts — `require(`${__dirname}/packageInfo.js`)` uses a template-literal path; the line is also already typed via `: PackageJson`.
- utils/crypto.ts, models/UserModel.ts, routes/index/mfa.ts — `thirty-two` (no types).
- utils/prettycron.ts — `dayjs` and its plugins (`advancedFormat`, `calendar`) are convertible, but this is a vendored file (see its header comment) so kept untouched; converting also surfaces a pre-existing `noImplicitReturns` issue at line 153. `later` has no types.
- utils/stripe.ts — `stripe` has types, but the existing call site uses `stripeLib(secretKey)` as a function; the typed `Stripe` is a class requiring `new Stripe(secretKey, config)`. Converting would force a logic/signature change.
- services/TaskService.ts — `node-cron` (no types).
- routes/admin/tasks.ts — `prettycron` (no types).
- tools/generateTypes.ts — inline `require('fs')` inside a function (would require refactoring to top-level).

## packages/tools
Session date: 2026-05-25

Files processed:
- release-clipper.ts — 1 converted (`md5-file`).
- generate-database-types.ts — 2 converted (`@rmp135/sql-ts` merged with existing named import; `fs-extra`).
- generate-images.ts — 2 converted (`md5-file`, `sharp`). The typed `sharp` import surfaced a latent issue at line 682 where `s = s.toFile(destPath)` assigned a `Promise<OutputInfo>` to a `Sharp` variable, which fixed in the same follow-up: replaced with `await s.toFile(destPath)`.
- build-release-stats.ts — 1 converted (`yargs-parser`).
- update-readme-contributors.ts — 1 converted (`./tool-utils.js` merged into the existing `import { rootDir }`); 1 left (`request`, no types).
- release-android.ts — 3 converted (`path`, `uri-template`, `node-fetch`). The typed `node-fetch` import surfaced a latent issue at line 230 where `'Content-Length': binaryBody.length` (a `number`) didn't match `HeadersInit`'s `string` requirement; fixed in the same follow-up by wrapping in `String(...)`.
- website/utils/news.ts — 1 converted (`moment`).
- update-readme-sponsors.ts — 1 converted (`@joplin/lib/string-utils`).
- website/build.ts — 3 converted (`glob`, `path`, `md5-file`).
- tool-utils.ts — 3 converted at top level (`node-fetch`, `execa`, `moment`); 7 inline `require()` calls left inside functions (`child_process.exec`/`.spawn`, `path`, `https`, `crypto`, `fs`, `readline`) — converting needs moving to module top, which is a small refactor.
- fuzzer/model/FolderRecord.test.ts — 1 converted (`sqlite3`); 1 left (`@joplin/lib/shim-init-node`, same `module.exports = { ... }` issue as in server).
- website/processDocs.ts — 4 converted (`md5-file`, `@joplin/fork-htmlparser2`, `style-to-js` — drop `.default` since `export = X` is callable, `crypto`).
- website/utils/applyTranslations.ts — 2 converted (`html-entities`, `@joplin/fork-htmlparser2`).
- website/utils/frontMatter.ts, website/utils/frontMatter.test.ts — 1 each (`moment`).
- website/utils/openGraph.ts — 1 converted (`@joplin/lib/string-utils`).
- website/buildTranslations.ts — 1 converted (`gettext-extractor`).

Files skipped entirely:
- 6 inline `const argv = require('yargs').argv;` calls inside `main`-style async functions (postPreReleasesToForum.ts, tagServerLatest.ts, build-translation.ts, git-changelog.ts, release-android.ts, website/updateNews.ts) — would require a top-level import and a refactor to keep semantics; skipped per the inline-require policy.
- fuzzer/cli.ts — `@joplin/lib/shim-init-node` (same as above).
- convertThemesToCss.ts — `require(`${baseThemeDir}/${themeFile}`)` is a dynamic template-literal path.
- checkLibPaths.test.ts — inline `require('../lib/shim')` inside a function.
- utils/translation.ts — `gettext-parser` (no types).
- website/updateNews.ts — `rss` (no types).

## packages/app-cli
Session date: 2026-05-25

Files processed:
- tests/MdToHtml.ts — 2 converted (`@joplin/lib/path-utils`, `@joplin/lib/theme`).
- tests/HtmlToMd.ts — 2 converted (`os`, `@joplin/lib/path-utils`).
- app/command-version.ts — 2 converted (`@joplin/lib/locale`, `@joplin/lib/versionInfo` — dropped the `.default` since `import X from` resolves the default export).
- app/command-settingschema.ts, command-testing.ts, command-mkbook.ts, command-e2ee.ts — 1 each converted (`./base-command` — TS file with `export default class BaseCommand`).
- app/command-apidoc.ts — 1 converted (`@joplin/lib/string-utils.js` → `@joplin/lib/string-utils`).
- app/cli-integration-tests.test.ts — 3 converted (`sqlite3`, `@joplin/lib/services/SettingUtils`, `./utils/shimInitCli`); 2 left: `@joplin/lib/database-driver-node.js` (JS-only), `@joplin/lib/shim-init-node.js` (lib uses `module.exports = {}`). The typed `shimInitCli` surfaced a latent interface mismatch (`ShimInitOptions` declares `sharp`, `React`, `electronBridge`, `pdfJs` as required, runtime defaults them to null); fixed in a follow-up by passing them as `null` explicitly.
- app/gui/StatusBarWidget.ts — 2 converted (`chalk`, `strip-ansi`); 3 left (`tkwidgets/BaseWidget.js`, `tkwidgets/framework/termutils.js` — no types, `../autocompletion.js` — JS).
- app/LinkSelector.ts — 1 converted (`open`).

Files skipped entirely (sibling command files use the CommonJS `module.exports = Command` pattern — converting requires changing the exported file too, which is out of scope):
- app/command-unpublish.test.ts, command-publish.test.ts, command-done.test.ts, command-rmbook.test.ts, command-rmnote.test.ts, command-share.test.ts, command-mkbook.test.ts — `require('./command-X')` patterns.

Files skipped entirely (other reasons):
- app/command-sync.ts — 1 converted (`./base-command`); the typed `BaseCommand` surfaced a latent issue at line 65 (a variadic `log: (...s: string[])` callback spread-passed to single-arg `stdout`); fixed in the follow-up by narrowing the callback to single-arg. Other requires in the file (`@joplin/lib/onedrive-api-node-utils.js` JS-only, `./cli-utils.js` JS-only, `md5` no types) left.
- app/command-keymap.ts, command-ls.ts, command-help.ts, command-import.ts, app/app.ts — `./cli-utils.js` and `./help-utils.js` are JS-only.
- app/app.ts — `@joplin/lib/Cache` is JS-only; line 164 `require(\`./${path}\`)` and line 442 `require('./app-gui.js')` are dynamic/JS.
- app/services/plugins/PluginRunner.ts, tests/services/plugins/sandboxProxy.ts — `@joplin/lib/services/plugins/sandboxProxy` is JS-only.
- app/utils/shimInitCli.ts — `@joplin/lib/shim-init-node.js` (same lib issue as elsewhere).
- app/gui/FolderListWidget.ts — `tkwidgets/ListWidget.js` (no types).
- app/command-edit.ts, command-e2ee.ts, command-ls.ts — inline `require()` calls inside functions, or untyped (`sprintf-js`, `md5`, `fs-extra` inline).
- tests/services/plugins/PluginService.ts — dynamic `require(contentScript.path).default`.

Files skipped entirely:
- time.ts — 2 deliberate `const X: typeof X = require(...)` workarounds for React Native bundler compatibility (already typed via paired `import type`).
- ipc.ts — `tcp-port-used` has no types.
- cli.ts — `readline/promises` is not in the installed `@types/node` (16.x); migrating would require a node-types upgrade.
