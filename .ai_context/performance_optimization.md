# 效能優化 (Performance Optimization)

## Status and comparison baseline

- Optimization date: 2026-07-15
- Before optimization: `26f2c08`
- Verified code version before this documentation commit: `4a8d57f`
- Branch: `agent/reduce-3d-runtime-load`
- PR: `#1 Reduce 3D runtime load`

This document records the changes that reduced idle GPU/CPU/physics cost without changing the warehouse's intended physical behavior. Read it before editing `App.jsx`, conveyors, rollers, cranes, move tables, shelf culling, physics settings, or mission conveyor steps.

## 2026-07-15 change record

- `aa0b7c9 Reduce 3D runtime load`: demand rendering, 30 FPS limiter, DPR/mobile graphics limits, lower-cost Cannon settings, static stopped rollers, unused sensor removal, transform-write reduction, and throttled shelf culling.
- `cf5346b Preserve conveyor roller axis`: restored local-Y axial visual rotation after direct z-axis Euler animation caused the roller cylinders to tumble/orbit.
- `a2ef27d Restore reliable conveyor transitions`: restored exact 16-segment per-roller colliders after approximate stopped-conveyor geometry blocked inbound transfer.
- `2ee8372 Wake outbound boxes with conveyors`: wakes sleeping outbound box bodies when their conveyor starts.
- `4a8d57f Drive boxes onto outbound exits`: briefly drives the final destination conveyor, stops it after confirmed arrival, and propagates failed mission state correctly.

## Original performance problem

The scene had a high baseline cost even with very few boxes:

- Canvas rendered continuously at the display refresh rate.
- High-DPI devices could render at DPR 2.
- Shadows and antialiasing stayed enabled on mobile/low-power devices.
- Physics ran at approximately 60 Hz with many always-kinematic bodies.
- 152 conveyor rollers remained Kinematic even while stopped.
- Each of 19 conveyors created two unused sensor trigger bodies in addition to the bulk sensor.
- Stationary crane-related components repeatedly sent unchanged transforms to the Cannon worker.
- Shelf culling checked all shelves every frame.
- Ground was mounted once in `App.jsx` and again through `Scene.jsx`.

## Implemented optimizations

### Rendering

`src/App.jsx` and `src/components/FrameRateLimiter.jsx`:

- Canvas uses `frameloop="demand"`.
- `FrameRateLimiter` invalidates at 30 FPS.
- Desktop DPR is capped at 1.5.
- Coarse-pointer/mobile layouts cap DPR at 1.25.
- Shadows and antialiasing are disabled on low-power/mobile layouts.
- Physics uses `shouldInvalidate={false}` so physics does not independently force extra renders.

Expected pixel reduction at a 1280x720 viewport:

- DPR 2 -> 1.5: 2560x1440 -> 1920x1080, approximately 44% fewer pixels per frame.
- DPR 2 -> 1.25: approximately 61% fewer pixels per frame.
- 60 FPS -> 30 FPS: approximately 50% fewer frame updates.

These are workload estimates, not measured power or temperature results. Device thermals still require before/after measurement on the same hardware.

### Physics

`src/App.jsx`, `src/components/ConveyorWithPhysics.jsx`, `src/components/RollerCylinder.jsx`, and `src/components/ConveyorExtras.jsx`:

- Cannon sleeping is enabled.
- Broadphase is `SAP`.
- Physics `stepSize` is 1/30 with at most two substeps.
- The duplicate Ground mount was removed from `App.jsx`; `Scene.jsx` owns Ground.
- 38 unused `Sensor_0`/`Sensor_1` trigger bodies were removed. The functional `InvisibleBulkSensor` remains.
- All 152 exact roller cylinder colliders remain for correct box transfer.
- A stopped roller is `Static`; a running roller is recreated as `Kinematic` and receives angular velocity.
- Roller colliders remain 16-segment cylinders. Do not reduce them to 8 segments without full seam/mission regression testing.

Typical idle state now has 152 static roller bodies rather than 152 continuously kinematic rollers. Body count is not eliminated, but worker activity is reduced.

### Per-frame CPU and worker traffic

- `Crane.jsx` does movement work only while the crane has a target movement.
- `MoveTable.jsx` sends position/quaternion updates only when crane position, crane rotation, or table offset changed.
- `CraneInvisibleBulkSensor.jsx` avoids unchanged transform writes.
- `Shelf.jsx` throttles culling checks to at most four times per second and skips recomputation when the camera and loaded batches did not change.
- Broad, unused Zustand subscriptions and legacy handlers were removed from `App.jsx`.

## 450-shelf scale test (18 x 5 x 5)

Verified layout in `src/data/ShelfData.js`:

- X: 18 positions (`2` through `36`)
- Y: 5 levels (`0` through `8`)
- Z: 5 rows (`-8`, `-4`, `-2`, `2`, `4`)
- Total: 450 shelf locations (`shelf001` through `shelf450`)

### Physics scaling contract

The naive 450-shelf version created one table body and one trigger body per shelf, approximately 900 shelf physics bodies. It still rendered at 30 FPS, but Cannon fell behind real time and a clean `shelf001` inbound stopped at the `conv3` check after 7.6 seconds. The same mission with 90 shelves completed in 21.2 seconds.

The verified implementation groups the 18 contiguous X positions for each `(Y, Z)` pair:

- 25 physical rows total.
- One continuous static table body and one trigger body per row: approximately 50 shelf physics bodies.
- The row trigger resolves the exact shelf ID from the box's current world X through `boxStore.getBoxWorldPosition()`.
- Do not use collision-event `body.position` as the X source; it was unavailable in this event path and incorrectly mapped `shelf090` to `shelf073`.
- Pure helpers and regression tests live in `src/components/shelfLayout.js` and `shelfLayout.test.js`.

### Visual scaling contract

- Shelf tables and four legs render as five instanced meshes rather than 450 cloned GLTF scenes.
- Camera-distance visual culling still controls which instance matrices are active.
- At the tested camera, desktop draw calls dropped from 1042 to 492 and a 390 x 844 mobile viewport dropped from 850 to 339.
- Both desktop and mobile viewport tests held the intentional 30 FPS steady-state cap.
- A development-only probe is available at `?perf=1`; it writes R3F FPS, max frame gap, draw calls, triangles, geometries, and textures to `data-warehouse-perf` on the root element.

### Mission timing baseline

Measured with a clean temporary SQLite database and isolated local frontend/backend:

- `shelf001` inbound with 90 shelves: 21.19 seconds.
- `shelf001` inbound with optimized 450 shelves: 21.19 seconds.
- `shelf001` outbound with optimized 450 shelves: 28.49 seconds.
- Far/high `shelf090` (`x=36`, `y=8`, `z=-8`) inbound: 31.66 seconds.
- `shelf090` outbound: 38.96 seconds.
- The extra `shelf090` time is expected travel distance, not lag; mission FPS remained approximately 30 and both directions completed.

Residual note: initial scene setup can show one roughly 300 ms frame gap while the warehouse is loading. Steady state and mission execution recover to 30 FPS; do not confuse that one-time load spike with mission-time lag.

## Conveyor correctness safeguards added during optimization

Performance work exposed workflow assumptions that must remain documented:

- Starting a conveyor explicitly wakes the mission box. An outbound box may have slept while waiting on a shelf or stopped conveyor.
- The outbound destination conveyor (`conv4`, `conv7`, or `conv19`) briefly starts with a 100 ms handoff delay.
- After `checkBoxOnEquipment` confirms arrival, the destination conveyor stops immediately.
- Outbound must not rely on momentum to cross into a stopped destination conveyor.
- A failed mission step marks the step, task, and mission as `error`; the operator UI must not report a false completion.

## Roller visual-axis contract

This is a critical GLTF contract, not a styling preference.

- `Roller_*` geometry is authored with its cylinder length along local Y.
- The GLTF roller node is pre-rotated (including an X-axis rotation) to lay the roller across the conveyor.
- Visual animation must preserve that authored transform and rotate around the roller's local Y axis:

```js
const ROLLER_LOCAL_AXIS = new THREE.Vector3(0, 1, 0);
roller.rotateOnAxis(ROLLER_LOCAL_AXIS, rotationStep);
```

Do not replace this with `roller.rotation.x/y/z += ...` or a world-axis rotation. In particular, the previously attempted `roller.rotation.z += rotationStep` made rollers tumble/orbit visually instead of spinning around their cylindrical centerline.

Do not overwrite the roller quaternion inside `useFrame`. `getWorldQuaternion()` is used to align the Cannon cylinder body, while the visual mesh must retain its GLTF-local orientation.

Before changing this code, inspect the actual GLTF node/geometry axes and validate straight, reversed, turned, and sloped conveyors.

## Rejected or rolled-back approaches

### One box collider per stopped conveyor

An early optimization replaced the eight stopped roller colliders with one static box surface. It was removed because the box collider created a square leading edge that blocked transfers into `conv3` and other stopped conveyor seams.

Rule: do not restore an approximate full-conveyor box collider unless it is proven not to obstruct every inbound/outbound seam and slope transition.

### Eight-segment roller colliders

An early optimization reduced cylinder segments from 16 to 8. It was reverted to preserve smooth box transfer and collision fidelity.

### Momentum-only outbound destination

Leaving the final destination conveyor stopped produced intermittent success. The box could stop at the last seam. The verified flow briefly runs and then stops the destination conveyor.

## Verification baseline

Automated:

```bash
npm run test:mission-builder
npm run test:mission-production-factory
npm run test:mission-runner
npm run test:shelf-layout
npm run build
npx eslint <changed-files>
```

Verified at `4a8d57f`:

- Mission builder: 6/6
- Production mission factory: 6/6
- Mission runner: 6/6
- Production build passes
- `shelf001 -> conv4` outbound passed three consecutive runs
- `shelf045 -> conv7` outbound passed
- Inbound regressions reached `conv3` and completed
- Final browser run had no console warnings or errors

## Required regression checklist

For any conveyor, roller, physics timestep, sleep, collider, GLTF transform, or mission timing change:

1. Verify a stopped conveyor still supports boxes without a blocking leading edge.
2. Verify visual rollers spin around their own cylindrical centerline.
3. Verify roller physics pushes in the same direction as visual rotation.
4. Run Inbound through `conv1 -> conv2 -> conv3`.
5. Run Outbound repeatedly through `conv6 -> conv5 -> conv4`.
6. Run the crane2 route through `conv9 -> conv8 -> conv7`.
7. Check turned/sloped route components (`conv14`, `conv16`, `conv17`).
8. Treat `checkBoxOnEquipment` timeout as a failure even if the box appears visually close.
9. Check browser console warnings/errors.
10. Re-run all mission tests and the production build.
