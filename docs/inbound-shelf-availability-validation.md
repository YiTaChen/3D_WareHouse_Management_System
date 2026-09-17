# Inbound shelf availability

Date: 2026-09-17. Base: main `1193935`.

## Cause and fix

The operator and engineering mission panels subscribed to stable Zustand getter
functions, so a sensor/equipment update did not refresh their shelf options.
The original availability query also treated a sensor-end event as empty even
when box-to-shelf mapping still identified an occupant. Previously loaded
missions had no execution-time destination check.

Panels now subscribe to shelf/equipment data; availability checks both occupancy
signals. The inbound builder checks its target and records its shelf position;
the shared mission store rechecks before the first runtime step. Operator inbound
also checks before clearing the entrance or creating a box. Runtime preflight
failure reports an error and executes zero movement steps. New mission state
objects ensure React observes status changes.

No conveyor, crane, box transform, collision shape, or database schema changed.
This guard covers a browser's current warehouse state, not concurrent allocation
by multiple clients. Reload occupancy still relies on existing shelf sensors.

## Automated checks

- 55 Node tests passed, including four new availability/preflight regressions.
- Availability cases: inbound exclusion, sensor-only occupancy, sleeping occupant,
  multiple boxes, outbound release, invalid destination, distant cell/other row.
- A pending mission that becomes occupied fails before any movement.
- ESLint: zero errors, 59 pre-existing warnings.
- Production build targets the existing Render API; existing bundle-size warning.

## Browser scenario

Chrome via Playwright, 1440 x 1000, local Vite on 5191 and isolated SQLite API on
3031. Uses real production operator buttons, builders, runner, physics and API.

1. Inbound to shelf001; without switching tabs verify it disappears and shelf002
   becomes selected. Attempt to build a duplicate inbound; expect rejection.
2. Inbound to shelf002; verify automatic advance to shelf003.
3. Reload and reopen the control panel; both occupied shelves remain excluded.
4. Outbound from shelf001; verify its removal from outbound options and return to
   inbound options, while shelf002 stays excluded.
5. Inbound to the freed shelf001 again; verify exclusion on completion.
6. Check browser console/page errors and capture the resulting scene.

Final run: all six checks passed with no browser console/page errors. Inbound
shelf001: 18.614 s; inbound shelf002: 19.570 s; outbound shelf001: 25.485 s;
inbound to the freed shelf001: 18.574 s. The first browser attempt's immediate
post-tab-switch assertion read React's initial empty option list; the final
check waits for the option to attach before asserting availability.
