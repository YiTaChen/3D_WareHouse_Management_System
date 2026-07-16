# Agent Instructions

Before modifying this repository, read:

1. `.ai_context/agent_entrypoint.md`
2. `.ai_context/known_risks.md`
3. `.ai_context/change_guidelines.md`

For performance, React Three Fiber, Cannon physics, conveyor, roller, or GLTF work, also read:

- `.ai_context/performance_optimization.md`
- `.ai_context/functions/frontend.md`

The conveyor roller axis is a tested model contract. Do not change roller Euler axes, quaternion handling, collider shape, or stopped/running body types without following the conveyor regression checklist in those files.

When behavior, architecture, risks, or verification steps change, update the matching `.ai_context` documentation in the same change.
