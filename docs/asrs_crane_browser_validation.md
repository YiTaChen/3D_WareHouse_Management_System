# AS/RS Crane Browser Validation

Date: 2026-08-13

Branch: agent/fit-asrs-pallet-crane

Environment: local Vite frontend, local Express backend, fresh SQLite demo database.

## Completed browser scenarios

| Crane | Shelf | X | Scenario | Result |
| --- | --- | ---: | --- | --- |
| crane001 | shelf001 | 2 | inbound | completed |
| crane001 | shelf002 | 4 | adjacent inbound while shelf001 occupied | completed |
| crane001 | shelf001 | 2 | outbound | completed |
| crane001 | shelf002 | 4 | adjacent outbound | completed |
| crane002 | shelf037 | 2 | inbound | completed |
| crane002 | shelf037 | 2 | outbound | completed |
| crane003 | shelf078 | 12 | final-cell inbound | completed |
| crane003 | shelf078 | 12 | final-cell outbound | completed |

The adjacent inbound positions persisted exactly as [2, 3, -8] and [4, 3, -8].
The final test run produced no new browser warnings or errors. Three earlier warnings
in the retained browser log were stale box components created by resetting SQLite
between test iterations, before the final clean run.

## Rail coverage

- Active rail: low-profile grey `asrs_single_guide_rail_4m.glb`
- Preserved alternative: train-style `asrs_ground_rail_4m.glb`
- Segment centers: X = -4, 0, 4, 8, 12
- Segment length: 4 m
- Continuous rail extent: X = -6 through 14
- Final shelf center: X = 12
- Final shelf cell outer edge: X = 13

The rail therefore continues 1 m beyond the final shelf cell. Browser inspection
confirmed crane003 remained centered over the rail while servicing shelf078.
The 2026-08-13 visual revision changed only the displayed rail profile, keeping these
centers and extents unchanged.

## Single-guide-rail browser retest

- All three crane lanes rendered the new narrow grey single guide rail.
- No train-style sleepers or double running rail appeared in the runtime scene.
- crane003 completed inbound and outbound at shelf078 after the rail asset switch.
- The final browser log contained no warnings or errors.

## Clearance checks

- 1 m load remains centered between 1.22 m mast inner faces.
- Visible fork width is 0.60 m.
- Fork tine length is 0.90 m.
- Consecutive shelf001/shelf002 storage did not contact or displace the adjacent load.
- The selected destination shelf is recorded after placement so transient overlapping
  sensor events cannot route a later outbound mission to the wrong crane lane.
