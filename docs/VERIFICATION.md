# Kraterika bootstrap verification — evidence log

**Date:** 2026-11-18 · **Source commit reviewed:** `9b7a064adf77d859062f4eea213f83bfc065fed7`
**Scope:** G1 repository/design/toolchain bootstrap, **not** gameplay acceptance.

## Exact CI receipts

| Verification | Execution evidence | Result |
| --- | --- | --- |
| Node.js 22 `npm ci --ignore-scripts --no-audit --no-fund` | [Quality run 44277904210](https://github.com/m-amirov/Kraterika/actions/runs/44277904210) | SUCCESS |
| 6 contract tests (manifest, pinned metadata, linked GDD, economy bounds, gating) | [Quality run 44277904210](https://github.com/m-amirov/Kraterika/actions/runs/44277904210) | 6/6 PASS |
| `tsc --noEmit && vite build` and emitted manifest matches canonical JSON | [Quality run 44277904210](https://github.com/m-amirov/Kraterika/actions/runs/44277904210) | SUCCESS |
| Ludory Core `defineGame` of real pinned source `933c73b195eaf3bfffd12a31ab1cbadb27989eea` | [Integration run 44277904079](https://github.com/m-amirov/Kraterika/actions/runs/44277904079), Linux job | CORE_MANIFEST_VERIFIED |
| WFA pinned `6c8d80d15155cd8ccfbd245fce9450f61b5133f3` dry-run and scoped Skill installation, selected Skill presence | [Integration run 44277904079](https://github.com/m-amirov/Kraterika/actions/runs/44277904079), disposable Windows job | WFA_EPHEMERAL_INSTALL_VERIFIED |

`package-lock.json` was captured from the earlier successful npm resolution in [run 44277496646](https://github.com/m-amirov/Kraterika/actions/runs/44277496646) and then validated by `npm ci` in the exact above quality run. The one-time public CI log export step was removed before final verification.

## Important non-claims

- WFA install completed **only inside an ephemeral Windows GitHub Actions runner**; it did NOT install Skills on the owner's machine. Real Codex activation: **NOT_RUN**.
- Ludory verified its **Core manifest v1 contract**; Studio native creation provenance, `@ludory/runtime-phaser` integration, save/restore, Connect SDK and generic Phaser ZIP exporter: **NOT_RUN / NOT_VERIFIED**.
- Phaser production build proves basic bundling and TypeScript compilation, not gameplay, browser rendering on physical phones, art quality, rights or platform SDK.
- GDD and feature descriptions are **G1 DRAFT**; owner approved the title and game direction B, but not every proposed number/mechanic.
- G2 playable loop, G3 six missions and three functional buildings, G4 content coverage, G5 human playtest, G6 platform packages, G7 official acceptance: **NOT_RUN / BLOCKED**.
- Publication, IAP, rewarded ads and rights clearance are not authorized or demonstrated.

## Revalidation after changes

Run `npm ci && npm run check` on the changed HEAD; for WFA/Ludory pin changes re-run both integration jobs and examine their console receipts. For G2/G3 add native simulation tests, representative real browser captures and source-bound content traces instead of treating these bootstrap checks as product acceptance.
