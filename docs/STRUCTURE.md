# STRUCTURE

## Current State

- App entry: `src/app/page.tsx`
- Canvas host: `src/components/Scene.tsx`
- Current scene is still a placeholder box and grid

## Recommended Runtime Structure

- `src/components/Scene.tsx`
  - Canvas setup
  - camera defaults
  - top-level timeline progress
- `src/components/scene/PrismField.tsx`
  - prism placement
  - prism material
- `src/components/scene/HazeField.tsx`
  - haze group
  - layered plane generation
  - haze animation update
- `src/components/scene/Particles.tsx`
  - particle spawn
  - trail or afterimage logic
- `src/components/scene/FloatingCubes.tsx`
  - cube placement and drift
- `src/components/scene/Lighting.tsx`
  - ambient and directional lights
- `src/components/scene/Timeline.ts`
  - shared timing helpers
- `src/components/scene/config.ts`
  - color constants
  - numeric tuning parameters

## Data Separation

- Visual constants belong in `config.ts`
- Timeline math belongs in a dedicated helper, not inside each mesh loop
- Random seeds should be generated once per object and then reused
- Haze and particles should expose a small number of tunable props for iteration

## Document Ownership

- `docs/PRODUCT.md`: user-facing goals and success criteria
- `docs/DESIGN.md`: visual and motion specification
- `docs/TECH.md`: implementation rules and numeric defaults
- `docs/STRUCTURE.md`: code organization for implementation

## Next Implementation Order

- Build prism field and camera path
- Add haze field with layered planes
- Add particles and floating cubes
- Add ending timeline and fade
- Only then evaluate bloom or shader upgrades
