# STRUCTURE

## Current State

- App entry: `src/app/page.tsx`
- Canvas host: `src/components/Scene.tsx`
- Scene は placeholder（box + grid）のまま

## Target File Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Scene をフルスクリーンで表示
├── components/
│   ├── Scene.tsx                   # Canvas + 全体オーケストレーション
│   └── scene/
│       ├── config.ts               # 全パラメータ定数
│       ├── timeline.ts             # タイムライン / フェーズ計算ヘルパー
│       ├── PrismField.tsx          # InstancedMesh による柱群
│       ├── GroundPlane.tsx         # 地面
│       ├── CentralGlow.tsx         # PointLight + 発光スプライト
│       ├── FloatingCubes.tsx       # 半透明浮遊キューブ
│       ├── ParticleTrails.tsx      # ライン状パーティクル軌跡
│       ├── Lighting.tsx            # DirectionalLight + AmbientLight
│       ├── CameraRig.tsx           # スクリプトカメラ制御
│       └── FadeOverlay.tsx         # 暗転用 CSS overlay
└── lib/
    └── glowTexture.ts              # 発光スプライト用 Canvas テクスチャ生成
```

## Component Responsibilities

### `Scene.tsx`

- `<Canvas>` の設定（shadow map 有効化、背景色、gl オプション）
- タイムラインの進行管理（`useFrame` で elapsed time を計測）
- 全子コンポーネントの配置
- `FadeOverlay` は Canvas の **外側**（CSS レイヤ）に配置

### `config.ts`

- すべてのチューニングパラメータを一箇所に集約
- DESIGN.md / TECH.md の数値がここに反映される
- export は `as const` で型安全に

```typescript
export const CONFIG = {
  prism: {
    gridCols: 10,
    gridRows: 7,
    spacing: 0.5,
    cullRate: 0.15,
    heightMin: 0.3,
    heightMax: 3.5,
    baseColor: '#B8BCC8',
  },
  glow: {
    color: '#4A57A8',
    intensity: 3.0,
    distance: 8,
  },
  camera: {
    startDistance: 12,
    endDistance: 3,
    startElevation: 1.3,
    endElevation: 1.05,
    calmSpeed: 0.08,
    rushSpeed: 1.2,
  },
  timeline: {
    duration: 9.5,
    accelStart: 7.5,
    rushStart: 8.5,
  },
  particle: {
    count: 4,
    speed: 1.0,
    trailLength: 30,
  },
  lighting: {
    directional: { intensity: 1.2, color: '#FFFFFF' },
    ambient: { intensity: 0.2, color: '#8890A8' },
  },
} as const
```

### `timeline.ts`

- `getProgress(elapsed: number): number` → 0.0–1.0
- `getPhase(t: number): 'calm' | 'accel' | 'rush'`
- `getFadeFactor(t: number): number` → 1.0–0.0
- `getSpeedMultiplier(t: number): number` → 1.0–2.0+
- `lerp`, `smoothstep` などのユーティリティ

### `PrismField.tsx`

- `useMemo` でグリッド配置データを生成（間引き + ジッター）
- `THREE.InstancedMesh` で一括描画
- `castShadow`, `receiveShadow` を有効化
- props: なし（`config.ts` から直接読む）

### `GroundPlane.tsx`

- `PlaneGeometry` の暗い地面
- `receiveShadow: true`
- 柱群の 2 倍の面積

### `CentralGlow.tsx`

- `PointLight`（castShadow）+ 発光 `Sprite` × 2–3
- スプライトは `AdditiveBlending`、`depthWrite: false`
- テクスチャは `lib/glowTexture.ts` から生成
- タイムラインの fade に連動して intensity を減衰

### `FloatingCubes.tsx`

- `useMemo` で初期配置をランダム生成
- `useFrame` で回転 + 上下漂いアニメーション
- `MeshPhysicalMaterial` で半透明表現

### `ParticleTrails.tsx`

- 各トレイルの軌跡ポイントを `useRef` で管理
- `useFrame` で先頭に新ポイント追加 + 末尾削除
- `THREE.Line` or `Line2` で描画
- 頂点カラーで先端→末尾のアルファグラデーション

### `Lighting.tsx`

- `DirectionalLight` + `AmbientLight`
- タイムラインの fade に連動して intensity を減衰
- Shadow camera の frustum を柱群にフィット

### `CameraRig.tsx`

- `useFrame` 内でカメラ位置を毎フレーム計算
- `timeline.ts` の phase に応じて回転速度・距離を補間
- `camera.lookAt(0, 0, 0)` で常に中心を注視

### `FadeOverlay.tsx`

- Canvas の外側に置く `<div>` 要素
- `background: black`, `pointer-events: none`
- `opacity` を React state で制御
- `useFrame` からの callback で更新

## Data Flow

```
useFrame (elapsed time)
  → timeline.ts (progress, phase, fadeFactor)
    → CameraRig (position update)
    → Lighting (intensity fade)
    → CentralGlow (intensity fade)
    → ParticleTrails (speed multiplier)
    → FadeOverlay (opacity)
```

- タイムラインの進行は **Scene.tsx** が一元管理
- 各コンポーネントは `useFrame` で自身のアニメーションを更新
- 共有状態は React context ではなく、各コンポーネントが `timeline.ts` のヘルパーを直接呼ぶ

## Random Seed Policy

- 柱の配置・高さ・色オフセットは `useMemo` で初期化時に確定
- 毎フレーム再計算しない
- Seed は固定値（再現性のため）または `Math.random` の結果を保持

## Implementation Order

1. **Phase 1: Static Scene**
   - `config.ts` + `timeline.ts` 作成
   - `PrismField.tsx`（InstancedMesh）
   - `GroundPlane.tsx`
   - `Lighting.tsx`（DirectionalLight + AmbientLight + shadow）
   - `CameraRig.tsx`（固定位置で構図確認）
   - → 動画 frame_001 と比較

2. **Phase 2: Central Glow**
   - `CentralGlow.tsx`（PointLight + sprites）
   - `lib/glowTexture.ts`
   - → 光漏れの見え方を確認

3. **Phase 3: Camera Animation**
   - `CameraRig.tsx` にタイムライン連動を追加
   - Calm → Accel → Rush の遷移確認
   - → 動画と並べて軌道比較

4. **Phase 4: Decorations**
   - `FloatingCubes.tsx`
   - `ParticleTrails.tsx`
   - → 中盤フレーム（4s 付近）と比較

5. **Phase 5: Ending**
   - `FadeOverlay.tsx`
   - Lighting / Glow の fade 連動
   - → 暗転タイミングを動画と比較

6. **Phase 6: Polish**
   - Bloom 検討（必要最小限）
   - パフォーマンス計測
   - 各フレームでの動画比較

## Document Ownership

| File | Content |
|------|---------|
| `docs/PRODUCT.md` | ゴール、スコープ、成功基準、原典ルール |
| `docs/DESIGN.md` | ビジュアル仕様、カラーパレット、モーション仕様 |
| `docs/TECH.md` | 実装方針、数値デフォルト、パフォーマンス制約 |
| `docs/STRUCTURE.md` | ファイル構成、コンポーネント責務、実装順序 |
| `docs/VERIFICATION.md` | フレーム比較検証手順、チェックポイント |
| `docs/assets/PS2 Startup Screen.mp4` | **原典動画（唯一の正解）** |
| `docs/reference-frames/` | 原典から抽出した参照フレーム画像 |
