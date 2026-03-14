# PS2 Startup Screen

This project recreates the tower sequence from the PlayStation 2 startup screen with Three.js and React Three Fiber.

The canonical reference is `docs/assets/PS2 Startup Screen.mp4`. If the implementation and the docs disagree, the video wins.

## Overview

- Recreates the tower scene from `0.0s` to `9.5s`
- Includes prism towers, central glow, floating cubes, particle trails, camera acceleration, and full fade to black
- Built with React 19, Vite 8, vinext, Three.js, and React Three Fiber
- Structured for deployment on Cloudflare Workers

## Setup

Requirements:

- Bun
- A Node.js-compatible environment

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

Start the production server locally:

```bash
bun run start
```

## Scripts

- `bun run dev`: start the development server
- `bun run build`: create a production build
- `bun run start`: run the built app locally
- `bun run lint`: run lint checks
- `bun run typecheck`: run type-aware linting
- `bun run check`: run formatting, lint, and type checks together
- `bun run fmt`: check formatting
- `bun run fmt:fix`: write formatting fixes

## Verification

Visual correctness is validated against the source video frame by frame, not by approximation.

Reference docs:

- `docs/PRODUCT.md`
- `docs/TECH.md`
- `docs/STRUCTURE.md`
- `docs/VERIFICATION.md`
- `docs/reference-frames/`

Minimum verification:

```bash
bun test
bun run lint
bun run check
bun run build
```

Extract a reference frame at any timestamp:

```bash
ffmpeg -ss <seconds> -i "docs/assets/PS2 Startup Screen.mp4" -frames:v 1 -q:v 2 /tmp/ps2-ref-<seconds>s.jpg
```

Key checkpoints:

- `0.0s`: top-down angle and pillar density
- `1.0s`: early rotation perspective and central glow
- `4.0s`: particle trails and floating cubes
- `7.0s`: zoom level before acceleration
- `8.5s`: fade progression during acceleration
- `9.5s`: fully black frame

## Project Structure

```text
src/
  app/
  components/
    Scene.tsx
    scene/
  lib/
  shaders/
worker/
docs/
public/
```

Key areas:

- `src/components/Scene.tsx`: canvas setup and high-level orchestration
- `src/components/scene/`: camera, lighting, prism field, particles, fade, and related scene pieces
- `src/lib/`: helper logic such as texture generation
- `src/shaders/`: custom shader code
- `worker/`: Cloudflare Worker entrypoint
- `docs/`: source-of-truth specs and verification workflow

## Notes

- Resolve visual uncertainty by checking the source video, not by guessing.
- Keep the background pure black throughout the sequence.
- Avoid excessive bloom or a look that feels too modern and sharp.
- Audio playback is expected to start after user interaction.
