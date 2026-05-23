# `.js` → `.ts` Migration Progress — details

Per-package detail for the migration plan in [./js_to_ts_progress.md](./js_to_ts_progress.md). Add a subsection per package when work begins, and write per-file entries immediately so a session interrupt loses at most one entry.

## Format

```
## packages/<name>
Session date: YYYY-MM-DD
Branch: <branch-name>

Files processed:
- `relative/path/file.ts` — short note on notable changes (caller updates, type fixes, dead code removed, etc.). If trivial, just "converted; no caller updates" is enough.

Files skipped:
- `relative/path/file.js` — reason (vendored, config, blocked by <X>, etc.)

Verification:
- `yarn tsc --noEmit`: <result>
- `yarn test` / `cd packages/<name> && yarn jest <pattern>` (where applicable): <result>
- `yarn syncFuzzer start --steps 5` (for app-cli / lib sync-target work): <result>

Notes / `review-later.md` entries added:
- <file:line> — <one-liner about what was logged>
```

## Conventions for "Files processed" entries

- **Caller updates** are part of the same commit as the conversion. Mention them in the entry only if there are several or they are non-obvious. A single `.default` add at the consumer is implicit.
- **Type fixes the conversion surfaces** (e.g. a previously-`any` parameter that the cast reveals to be too narrow) are noted. If applied as a separate commit, mention the commit subject.
- **Dead code removed** (unused private fields, unreachable branches) is noted with the original-line reference.
- **Pre-existing smells flagged to `review-later.md`** are noted (file path + one-line summary).

---

<!-- Add per-package sections below as work begins. -->
