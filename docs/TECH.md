# TECH

## Stack

- Renderer: `@react-three/fiber` + `three`
- UI: React 19 + Tailwind CSS 4
- Build: Vite 8 + vinext
- Language: TypeScript 5.9

## Rendering Strategy

- Main scene: procedural `BoxGeometry` のみ
- 透明オブジェクトの sorting は `renderOrder` で明示制御
- Shadow map を有効にし、柱群の自然な陰影と中央光の遮光を表現
- Post-processing は最終段階でのみ検討

## Scene Graph Structure

```
Canvas
├── PerspectiveCamera (animated)
├── AmbientLight
├── DirectionalLight (castShadow)
├── PointLight (central glow, castShadow)
├── GroundPlane (receiveShadow)
├── PrismField (group)
│   └── Prism × 60-80 (castShadow, receiveShadow)
├── CentralGlowSprites (group, renderOrder: 1)
│   └── Sprite × 2-3 (additive blend)
├── FloatingCubes (group, renderOrder: 2)
│   └── Cube × 3-5
├── ParticleTrails (group, renderOrder: 3)
│   └── Trail × 3-6
└── FadeOverlay (renderOrder: 999)
```

## Prism Field Implementation

### Generation

- `useMemo` でシーン初期化時に配置データを一括生成
- 各柱のデータ: `{ x, z, width, depth, height, colorOffset }`
- グリッドベース生成 → 間引き → ジッター付与

### Instancing

- `InstancedMesh` を使用して draw call を 1 回に集約
- 柱数が 60–80 あるため、個別 mesh は避ける
- `InstancedMesh` の `count` は生成した柱数
- 各インスタンスの `matrix` に position + scale を設定
- `instanceColor` で微妙な色差を表現

```typescript
// 概念コード
const mesh = new THREE.InstancedMesh(geometry, material, count)
for (let i = 0; i < count; i++) {
  dummy.position.set(x, height / 2, z)
  dummy.scale.set(width, height, depth)
  dummy.updateMatrix()
  mesh.setMatrixAt(i, dummy.matrix)
  mesh.setColorAt(i, color.offsetHSL(0, 0, colorOffset))
}
```

## Central Glow Implementation

### Point Light

- `THREE.PointLight` を `(0, 0.2, 0)` に配置
- `castShadow: true` で柱による遮光を実現
- `shadow.mapSize`: `1024 × 1024`
- `shadow.bias`: `-0.001`

### Glow Sprites

- `THREE.Sprite` + `SpriteMaterial` で光の塊感を表現
- `AdditiveBlending` で重ね合わせ
- テクスチャ: ラジアルグラデーション（中心 alpha=0.3、外周 alpha=0）
- Canvas 2D で procedural 生成:

```typescript
function createGlowTexture(size = 256): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(74, 87, 168, 0.3)')
  gradient.addColorStop(0.4, 'rgba(49, 57, 114, 0.15)')
  gradient.addColorStop(1, 'rgba(26, 31, 69, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  return texture
}
```

## Particle Trail Implementation

### Approach: Line Geometry with Fading

- 各トレイルは `THREE.Line2` (fat lines) または `THREE.BufferGeometry` + `LineBasicMaterial`
- トレイルの先端が移動し、後端がフェードアウト
- 各フレームで先頭に新しい点を追加し、末尾を削除

### Trail Data Structure

```typescript
interface Trail {
  points: THREE.Vector3[]   // 軌跡ポイント配列（最新が先頭）
  maxPoints: number         // 最大ポイント数（残像の長さ）
  color: THREE.Color
  speed: number
  direction: THREE.Vector3  // 現在の移動方向
  curvature: number         // カーブの強さ
}
```

### Line Material

- `LineMaterial` or `LineBasicMaterial`
- `transparent: true`
- `vertexColors: true`（先端が不透明、末尾が透明のグラデーション）
- `blending: AdditiveBlending`
- `depthWrite: false`

## Camera Animation

### Orbital Camera

- `OrbitControls` は使わない（スクリプトカメラ）
- `useFrame` 内で毎フレーム camera position を更新

```typescript
function updateCamera(camera: THREE.PerspectiveCamera, t: number) {
  const phase = getPhase(t)

  // 角速度と距離の補間
  const angularSpeed = lerp(phase, CALM_SPEED, RUSH_SPEED)
  const distance = lerp(phase, START_DISTANCE, END_DISTANCE)
  const elevation = lerp(phase, START_ELEVATION, END_ELEVATION)

  const angle = baseAngle + angularSpeed * elapsed

  camera.position.x = Math.cos(angle) * distance * Math.cos(elevation)
  camera.position.y = Math.sin(elevation) * distance
  camera.position.z = Math.sin(angle) * distance * Math.cos(elevation)
  camera.lookAt(0, 0, 0)
}
```

### Phase System

```typescript
const DURATION = 9.5           // タワーシーン全体尺
const ACCEL_START = 7.5 / 9.5  // ≈ 0.789
const RUSH_START = 8.5 / 9.5   // ≈ 0.895

function getPhase(t: number): 'calm' | 'accel' | 'rush' {
  if (t < ACCEL_START) return 'calm'
  if (t < RUSH_START) return 'accel'
  return 'rush'
}
```

## Fade / Ending Implementation

### Dual Approach

1. **Scene lighting fade**: `DirectionalLight` と `AmbientLight` の intensity を `t` に応じて下げる
2. **CSS overlay**: `<div>` を Canvas の上に重ね、`background: black` の `opacity` を 0→1 に変化

### Timeline

```typescript
function getFadeFactor(t: number): number {
  if (t < ACCEL_START) return 1.0                    // 100%
  if (t < RUSH_START) return lerp(t, ACCEL_START, RUSH_START, 1.0, 0.7)  // 100%→70%
  return lerp(t, RUSH_START, 1.0, 0.7, 0.0)         // 70%→0%
}
```

## Shadow Configuration

- `renderer.shadowMap.enabled = true`
- `renderer.shadowMap.type = THREE.PCFSoftShadowMap`
- DirectionalLight shadow:
  - `shadow.camera.left/right/top/bottom`: 柱群の範囲をカバー
  - `shadow.mapSize`: `2048 × 2048`
- PointLight shadow:
  - `shadow.mapSize`: `1024 × 1024`
  - 柱による遮光パターンが光漏れ表現の核

## Performance Constraints

- `InstancedMesh` で柱の draw call を 1 回に
- Shadow map は合計 2 枚（Directional + Point）
- 透明オブジェクト（スプライト、キューブ、トレイル）は計 10 個以下
- Post-processing は最終段階でのみ、bloom は弱く限定的に
- Target: mid-range laptop GPU で安定 60fps

## Tunable Parameters (config.ts)

### Prism

| Key | Type | Default | Range |
|-----|------|---------|-------|
| `prism.gridCols` | `number` | `10` | `8–12` |
| `prism.gridRows` | `number` | `7` | `5–9` |
| `prism.spacing` | `number` | `0.5` | `0.4–0.7` |
| `prism.cullRate` | `number` | `0.15` | `0.1–0.25` |
| `prism.heightMin` | `number` | `0.3` | – |
| `prism.heightMax` | `number` | `3.5` | – |
| `prism.baseColor` | `string` | `#B8BCC8` | – |

### Central Glow

| Key | Type | Default | Range |
|-----|------|---------|-------|
| `glow.color` | `string` | `#4A57A8` | – |
| `glow.intensity` | `number` | `3.0` | `2.0–4.0` |
| `glow.distance` | `number` | `8` | `6–12` |

### Camera

| Key | Type | Default | Range |
|-----|------|---------|-------|
| `camera.startDistance` | `number` | `12` | `10–15` |
| `camera.endDistance` | `number` | `3` | `2–5` |
| `camera.startElevation` | `number` | `1.3` | `1.1–1.4` rad |
| `camera.endElevation` | `number` | `1.05` | `0.9–1.1` rad |
| `camera.calmSpeed` | `number` | `0.08` | `0.05–0.12` rad/s |
| `camera.rushSpeed` | `number` | `1.2` | `0.8–1.5` rad/s |

### Timeline

| Key | Type | Default | Range |
|-----|------|---------|-------|
| `timeline.duration` | `number` | `9.5` | – |
| `timeline.accelStart` | `number` | `7.5` | `7.0–8.0` |
| `timeline.rushStart` | `number` | `8.5` | `8.0–9.0` |

### Particles

| Key | Type | Default | Range |
|-----|------|---------|-------|
| `particle.count` | `number` | `4` | `3–6` |
| `particle.speed` | `number` | `1.0` | `0.5–1.5` |
| `particle.trailLength` | `number` | `30` | `20–50` points |

## Validation Checklist

- [ ] 真上からのスクリーンショットが動画 frame_001 と構図一致
- [ ] 中央発光が柱の隙間から漏れ出して見える
- [ ] 柱の陰影がリアル（上面が明るく、側面に影）
- [ ] 背景が純黒（色付きの霧や大気が無い）
- [ ] カメラ軌道が動画と一致（開始角度、回転方向、加速タイミング）
- [ ] パーティクルがライン状の軌跡として見える
- [ ] 浮遊キューブが暗い半透明として見える
- [ ] 暗転タイミングが動画と一致（9.5s で完全黒）
- [ ] bloom なしでシーンが成立する
- [ ] 60fps 安定
