# Test before handoff (every slice)

Run this **before** marking a slice done, committing, or pushing. Do not ask the user to prompt you — this is the default end of every slice.

## Slice closure loop (mandatory)

```
Implement → Update docs (`.cursor/rules/docs-and-testing.mdc`) → Tier 1 → Tier 2 (localhost) → Tier 3 (Bugbot) → fix findings → commit → push → Log BUILD-PROGRESS → Next slice
```

**Never stop after Tier 1 only** when the slice touched UI. **Never push without Bugbot.** **Never wait for the user** to say "continue" — start the next slice in BUILD-PROGRESS immediately after push.

---

## Tier 1 — Automated (required)

```powershell
cd web
npm run build
npm run page-guides:check
```

If schema changed:

```powershell
cd ..
npm run supabase:push-remote
```

Log commands and exit codes in `docs/BUILD-PROGRESS.md` → **Verification log**.

---

## Tier 2 — Browser smoke on localhost (required for UI slices)

1. Ensure dev server: `cd web && npm run dev` (default `http://localhost:3000`, or next free port).
2. Open **localhost** (prefer local over Amplify for pre-push checks).
3. Walk **What you can test** for this slice in `docs/BUILD-PROGRESS.md`.
4. Confirm:
   - Page loads without error
   - Save persists after refresh (when applicable)
   - Audit footer visible
   - No console errors on the path tested
5. Log pass/fail + route in BUILD-PROGRESS → **Browser verification log**.

Skip Tier 2 only for pure backend/migration slices with no UI surface.

Use Cursor browser MCP (`browser_navigate`, `browser_snapshot`, `browser_click`) or manual walkthrough.

---

## Tier 3 — Bugbot (required before every push to `main`)

1. Launch Bugbot subagent on **`uncommitted changes`** (pre-commit) or **`branch changes`** (pre-push).
2. Fix **Critical** and **High** before push; fix **Medium/Low** when straightforward.
3. **Commit Bugbot fixes immediately** — see `.cursor/rules/bugbot-commit.mdc` (dedicated `fix: Bugbot — …` commit, then push).
4. Record in BUILD-PROGRESS → **Code review log**.

---

## Handoff message template

```
## Verification
- npm run build — exit 0
- npm run page-guides:check — exit 0
- Browser (localhost) — pass/fail — <route>
- Bugbot — pass / N findings — <summary>

## Next slice
<WP id from BUILD-PROGRESS>
```

Then **immediately continue** implementing the next slice without waiting for user input.
