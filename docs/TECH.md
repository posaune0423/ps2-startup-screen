# TECH

## Rendering Strategy

- Renderer: `@react-three/fiber` + `three`
- Main scene style: procedural geometry only
- Haze implementation: layered transparent planes or sprites
- Recommended first pass: `MeshBasicMaterial` or `ShaderMaterial` for haze, not full volumetric rendering

## Haze Implementation Rules

- Keep haze in a dedicated `group`
- Place haze group behind prism field
- Use `depthWrite: false` to avoid transparency artifacts stacking into hard cutouts
- Keep `depthTest: true` so haze stays visually behind scene geometry
- Prefer manual `renderOrder` if transparent sorting becomes unstable
- Drive motion with elapsed time and per-plane seeds instead of frame-count logic

## Suggested Numeric Defaults

- Haze plane count: `8`
- Haze z range: `-6` to `-16`
- Haze opacity range: `0.08` to `0.18`
- Haze scale range: `0.8` to `2.6`
- Haze pulse amplitude: `6%`
- Haze drift amplitude: `x = 0.12`, `y = 0.18`
- FogExp2 density: `0.028`
- Particle count: `24`
- Total duration: `10.0s`
- Acceleration start: `7.4s`
- Fade emphasis start: `8.8s`

## Animation Model

- Use normalized progress `t = elapsed / duration`
- Split timing into three phases:
  - `0.00` to `0.74`: calm drift
  - `0.74` to `0.88`: acceleration
  - `0.88` to `1.00`: fade to dark
- Keep haze motion low-frequency and phase-shifted per plane
- Fade haze opacity with the global ending curve, not independently

## Performance Constraints

- Avoid 3D textures and raymarching for this scene
- Avoid large overdraw spikes from full-screen additive quads
- Keep haze cards concentrated in the back half of the frame
- Start without postprocessing; only add bloom after base image is correct
- Approval target is stable realtime playback on a mid-range laptop GPU
- If transparency sorting flickers, solve with explicit layering and `renderOrder` before adding heavier rendering paths

## Tunable Parameters

- `haze.count`
- `haze.opacityMin`
- `haze.opacityMax`
- `haze.scaleMin`
- `haze.scaleMax`
- `haze.driftX`
- `haze.driftY`
- `haze.rotationSpeedMin`
- `haze.rotationSpeedMax`
- `timeline.duration`
- `timeline.accelStart`
- `timeline.fadeStart`
- `fog.density`

## Validation Checklist

- Haze remains behind prisms during the full camera move
- Color palette stays in blue-violet range without whitening
- Fog supports depth but does not replace haze volume
- Ending fade removes both particles and haze cleanly
- Scene still reads correctly with bloom disabled
- Haze and postprocess settings do not become the main FPS regression
