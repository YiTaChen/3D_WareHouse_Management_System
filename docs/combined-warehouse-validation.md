# Combined warehouse validation

Validated locally on 2026-09-07. GitHub main published on 2026-09-08. Firebase Hosting updated on 2026-09-08 at the user's request.

Merged remote main `5fc0549` and local `agent/fit-asrs-pallet-crane` `047fcd8`.
Preserved 450 shelf locations, 25 aggregated physics rows, instanced shelf
visuals, exact conveyor rollers and the confirmed binding implementation.
Crane body and fork visuals now use the same current mission state in ordered
frame callbacks. Rail coverage is X=-6..38 and mast height is 11.7 m.

## Browser integration checks

Fresh isolated SQLite database; real production builders, runner, Cannon
physics and API. Mission coordinates are read through `getShelfPosition`,
matching the operator panel. Five inbound and five outbound missions completed.
Every inbound was verified at the exact requested shelf after settling.

| Shelf | Direction | Seconds | Status | Final sensor |
|---|---|---:|---|---|
| shelf001 | inbound | 21.76 | done | shelf001 |
| shelf001 | outbound | 27.11 | done | conv4 |
| shelf002 | inbound | 20.91 | done | shelf002 |
| shelf002 | outbound | 27.55 | done | conv5 |
| shelf090 | inbound | 32.60 | done | shelf090 |
| shelf090 | outbound | 38.98 | done | conv4 |
| shelf270 | inbound | 33.43 | done | shelf270 |
| shelf270 | outbound | 43.32 | done | conv7 |
| shelf450 | inbound | 32.06 | done | shelf450 |
| shelf450 | outbound | 38.33 | done | conv19 |

Outbound destinations were confirmed by the runner before their conveyor was
stopped; a later overlapping sensor can report an adjacent conveyor. All
three lanes and the third-lane turned/sloped route were exercised.
No new warning/error was recorded during the corrected full regression run.
Earlier failed development attempts are excluded from these results.

## Automated checks

35 Node tests cover builders, factory, runner, box binding, aggregated shelves,
asset contracts, highest-level clearance and full-length rails. Lint has no
errors (existing warnings remain). Production build succeeds. Blender GLB
validation checks actual mast/cabinet/fork/rail geometry.

## Film provenance

Historical stages use actual Git snapshots 41a8714 (prototype), e71ffd4
(gravity), af7ef4d (90 locations), 5fc0549 (450 locations), and this merge
(new crane). Filming hooks only schedule existing actions, move the camera,
adjust lighting, composite English titles and record the running WebGL canvas.
Filming code is provided separately and is not enabled in the production app.

## 2026-09-08 publication validation

35 Node checks passed again. A fresh 62-second recording uses the integrated main source, unchanged production physics and one box. Both shelf056 inbound and outbound missions completed. The README lists the latest demo first and the corrected 70-second evolution film second. Filming code is isolated under `tools/video/latest`; no filming code is mounted in production.

## Firebase release and video opening

The integrated application was built with the existing Render API URL and deployed to Firebase project `r3f-gravity-apply-test`. The live page loaded the crane assets and existing inventory with no browser errors. The latest-demo MP4 now omits its first two seconds (60 seconds total), with a visible warehouse frame at the start. The 70-second evolution film is unchanged.
