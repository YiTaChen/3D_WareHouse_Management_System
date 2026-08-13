# AS/RS Crane Browser Validation

Date: 2026-08-13

Branch: `agent/fit-asrs-pallet-crane`

## Clean deployment

The final browser regression used an isolated deployment rather than the earlier
long-running development state:

- Frontend: `http://127.0.0.1:5183`
- Backend: `http://localhost:3012`
- Database: new temporary SQLite file at
  `/private/tmp/asrs-crane-clean-3012.sqlite`
- Initial inventory: 0 boxes, 90 available shelves

The earlier `5173` run and its pre-existing boxes were excluded from the final
result. The clean page was loaded with no cargo before the first mission.

## Completed browser scenarios

| Crane | Shelf | Scenario | Result |
| --- | --- | --- | --- |
| crane001 | shelf001 | inbound | completed |
| crane001 | shelf002 | adjacent inbound while shelf001 occupied | completed |
| crane002 | shelf037 | inbound | completed |
| crane003 | shelf078 | final-cell inbound | completed |
| crane001 | shelf001 | outbound | completed |
| crane001 | shelf002 | adjacent outbound | completed |
| crane002 | shelf037 | outbound | completed |
| crane003 | shelf078 | final-cell outbound | completed |

After the four outbound missions, the browser inventory reported 0 boxes,
0 occupied shelves, and 90 available shelves. No warning or error was recorded
for the clean `5183` deployment.

## Visual and clearance observations

- Mid-mission screenshots confirmed cargo traveled between the two mast columns
  on all three cranes rather than through a column or the exterior cabinet.
- The white control cabinet is outside the right mast; the counterweight is
  outside the left mast. The central 1 m cargo corridor is clear.
- The visible double fork is 0.60 m wide and 1.30 m long. It supports the full
  1 m cargo depth with 0.15 m visual overhang at each end while remaining
  inside the unchanged 2 m plateTable physics envelope. Consecutive
  shelf001/shelf002 missions both completed without displacing neighboring cargo.
- While cargo is bound, its quaternion is aligned to the crane and residual
  angular velocity is cleared so the load remains level rather than hovering
  at a slight rotating angle.
- The replacement fork's visible upper contact surface is local Y=0.10. The
  unchanged 0.6 binding offset places the bottom of a 1 m box at the same Y=0.10.
- The original `main` plateTable physics collider remains `[2, 0.02, 2]`.
  Production mission coordinates, binding/unbinding behavior, and persistence
  behavior remain the `main` implementation.

## Rail coverage

- Active rail: low-profile grey `asrs_single_guide_rail_4m.glb`
- Preserved alternative: train-style `asrs_ground_rail_4m.glb`
- Segment centers: X = -4, 0, 4, 8, 12
- Segment length: 4 m
- Continuous rail extent: X = -6 through 14
- Final shelf center: X = 12
- Final shelf cell outer edge: X = 13

The rail extends 1 m past the last shelf cell. Browser observation during the
shelf078 inbound and outbound missions confirmed crane003 stayed centered above
the single rail at the final cell.

## Automated verification

- `npm run test:crane-fit`
- `npm run test:mission-builder`
- `npm run test:mission-production-factory`
- `npm run test:mission-runner`
- `npm run build`
- `blender --background --factory-startup --python tools/blender/validate_fitted_asrs_assets.py`

The fit test explicitly asserts the unchanged `main` plateTable offsets, initial
logical crane positions, collider dimensions, and box binding offset.
