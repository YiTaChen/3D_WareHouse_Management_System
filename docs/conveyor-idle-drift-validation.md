# Stopped conveyor drift investigation

Branch: `fix/conveyor-idle-drift`, based on `main` commit `898fa80`.

## Reproduction and cause

The production page shows gradual movement on an unpowered inlet. A local copy
of main, with the same `[-8, 4, -8]` spawn and a private SQLite backend, reproduced
it with every conveyor's `rotate` flag false. World-position samples changed
from `[-6.7369294, 1.6998116, -7.9359961]` to
`[-6.0010829, 1.6977844, -7.9155579]` in 34.933 seconds: approximately 0.736 m.
This is physical motion, not camera movement or a database position refresh.

Stopped rollers already have zero angular velocity and Static bodies. The
contact solver uses the default relaxation of 3 with exact 16-sided cylinders,
a 1/30-second step and five solver iterations. Small repeated contact impulses
can keep the box above its sleep threshold. Very low roller friction (0.001)
allows the resulting lateral motion to persist. Increasing friction alone did
not reliably settle the fixture; it still drifted. A GLTF-based Cannon fixture
reproduces the issue without React, a backend, or mission commands.

## Scoped correction

Only stopped roller/box contacts use `contactEquationRelaxation: 20`. This
reduces the contact correction oscillation enough for ordinary Cannon sleep.
Running contacts retain their previous material and parameters. Both states
retain friction 0.001 and restitution 0. Roller geometry, segment count, axes,
quaternion calculation, Static/Kinematic transitions, timestep, gravity, box
sleep settings, mission wake calls, and crane/shelf mechanics are unchanged.
No box is frozen, teleported, or artificially held in place.

## Reproduce

- `npm run test:conveyor-drift`: loads actual shipped GLTF transforms/bounds,
  reproduces baseline creep, checks five resting placements/orientations over
  60 simulated seconds after settling, and wakes/transports each box.
- Browser suite: use a fresh empty SQLite database. Run the backend from `backend/`:

  ```sh
  PORT=3033 DATABASE_URL='' DB_ENV=sqlite SQLITE_STORAGE=/private/tmp/warehouse-drift-check.sqlite node index.js
  ```

- From the repository root:

  ```sh
  VITE_API_BASE_URL=http://localhost:3033 npm run dev -- --config tools/physics/vite.config.js --host 127.0.0.1 --port 5205
  ```

- Open `http://127.0.0.1:5205/?perf=1` and click **Run conveyor regression**.
  The harness rejects non-local APIs and nonempty inventory. It uses production
  box creation, mission builders and runtime. Its test boxes are soft-removed
  between round trips. No test panel is injected by the normal Vite config.
- The existing development performance probe now also exposes read-only box
  world transforms and conveyor running flags in `data-warehouse-boxes`.

## Browser results

The initial corrected run passed shelf001 inbound/outbound twice (18.68/27.04 s
and 19.31/27.10 s). Both exits reached conv4 and all conveyors stopped.

The subsequent shelf090 inbound encountered a crane release confirmation
failure after reaching the target shelf. The bound box was at Y=10.667304
versus the requested Y=10.7, outside the existing 0.02 m confirmation tolerance.
The baseline-contact control subsequently passed shelf090 both ways
(30.81/38.59 s). This one failure is retained here, not counted as a pass.
The corrected-branch repeat passed all six remaining missions with no console
warnings/errors:

| Shelf | Inbound seconds | Outbound seconds | Exit |
| --- | ---: | ---: | --- |
| shelf090 | 29.98 | 38.55 | conv4 |
| shelf181 | 20.37 | 32.32 | conv7 |
| shelf361 | 19.31 | 27.27 | conv19 |

All six reached the expected equipment and stopped all conveyors. Across both
corrected runs there were ten successful missions and one failed high-shelf
attempt. The full-scene checks cover all three cranes, far/high storage, inlet
wake-up, reversed exits, turns and slopes. Automated tests: 53 passed; lint:
zero errors and 61 pre-existing warnings; production build passed.

The release discrepancy (0.032696 m) is consistent with two 1/30-second gravity
steps after a transform reset. The release logic and box physics are unchanged;
this suggests timing sensitivity, but the control pass alone does not prove
that the failure is unrelated to this change. Do not describe this as exhaustive
regression-free verification.

The harness supports `?shelves=shelf090,shelf181,shelf361` to select a bounded
route set. `CONVEYOR_BASELINE=1` on the harness Vite command restores relaxation
3 for controlled comparison. These flags are only part of the local test tooling.

## Final browser idle check

After a fresh load of the final relaxation-20 build, the stopped inlet's box
world position remained exactly `[-7.976783275604248, 1.6876461505889893,
-7.999346733093262]` across samples 49.887 seconds apart; its quaternion was
also unchanged. All conveyor rotate flags were false. This confirms the actual
React/Cannon scene settles, in addition to the 60-second Node physics tests.

The candidate is kept on a feature branch. No merge to main or Firebase release
was performed for this investigation.
