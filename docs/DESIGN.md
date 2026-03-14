# DESIGN SPEC

## Visual Direction

- Mood: 冷たく静寂、神秘的でやや不穏
- Era feel: 2000 年代前半の抽象 CG ムービー。フォトリアルではなくスタイライズド
- Contrast: 背景は純黒、柱は白～クールグレーのハイコントラスト
- Glow: 中央から漏れ出す青紫の光。bloom ではなく光源として表現

## Color Palette

### Scene Base

| Role | Hex | Note |
|------|-----|------|
| Background | `#000000` | 純黒。動画の背景には色付きの空や霧はない |
| Ground plane | `#0A0A0E` | 柱の根元が見える程度のごく暗いダークグレー |

### Prism (Pillars)

| Role | Hex | Note |
|------|-----|------|
| Base | `#B8BCC8` | クールグレー、わずかに青味 |
| Top highlight | `#D8DCE8` | ライト上面。直接光を受ける面 |
| Side shadow | `#6A6E7A` | 光が当たらない側面 |
| Deep shadow | `#3A3E4A` | 柱同士の隙間、奥まった面 |

### Central Glow

| Role | Hex | Note |
|------|-----|------|
| Core | `#4A57A8` | 発光の中心色。インディゴブルー |
| Spread | `#313972` | 拡散領域。やや暗い青紫 |
| Edge falloff | `#1A1F45` | 光の外縁、背景に溶ける |

### Particles

| Role | Hex | Note |
|------|-----|------|
| Red trail | `#E2516A` | 赤い光線 |
| Green trail | `#49D8A8` | 緑の光線 |
| Blue trail | `#3557D6` | 青紫の光線 |

### Floating Cubes

| Role | Hex | Note |
|------|-----|------|
| Surface | `#2A2E3C` | ダークグレー半透明 |
| Edge highlight | `#4A5068` | エッジにわずかな反射 |

## Prism Field Spec

### Layout

- 柱数: **60–80 本**（動画フレームから逆算）
- 配置パターン: 7×10 程度のグリッドベース
- グリッド間隔: 柱幅の 1.1–1.3 倍（密集感を出すため狭め）
- 一部のグリッドセルは空（ランダムに 10–20% 間引く）
- グリッド位置に ±0.05 程度の微小なジッターを加える

### Geometry

- 各柱: `BoxGeometry` で表現
- 断面サイズ: `0.4 × 0.4` を基本に、`0.35–0.5` のバリエーション
- 高さ: `0.3–3.5` の範囲でランダム（分布は低めの柱が多く、一部が突出する）
- 高さ分布: 30% が `0.3–0.8`、50% が `0.8–2.0`、20% が `2.0–3.5`

### Material

- `MeshStandardMaterial` を使用
- `color`: `#B8BCC8`
- `roughness`: `0.75`（マットだが完全にフラットではない）
- `metalness`: `0.05`（金属感はほぼなし）
- 柱ごとに色のわずかな揺れ（±0.03 の明度差）

## Ground Plane Spec

- `PlaneGeometry` で十分な面積をカバー（柱群の 2 倍程度）
- `MeshStandardMaterial`
- `color`: `#0A0A0E`
- `roughness`: `0.9`
- 柱からの影を受ける（`receiveShadow: true`）

## Central Glow Spec

### 実装アプローチ

- 柱群の中心（Y=0 付近、柱の根元レベル）にポイントライトを配置
- 光色: `#4A57A8`
- 強度: `2.0–4.0`（要調整）
- 減衰距離: 柱群の半径程度
- 追加で **加算ブレンドの発光スプライト** を中心に 2–3 枚重ねて光の「塊」感を出す
- スプライトのアルファは中心が高く外周で 0 に減衰するラジアルグラデーション

### Light Rays

- 中央の光が柱の隙間から漏れ出す表現が重要
- `VolumetricSpotLight` や god-ray エフェクトは使わず、柱自体が光を遮る **自然なシャドウ** で表現する
- ポイントライトの `castShadow: true` を活用

## Floating Cubes Spec

- 数: **3–5 個**
- サイズ: `0.3–0.7` の立方体
- 配置: 柱群の間（柱の上ではない）、柱の高さの中間あたりに浮遊
- Material: `MeshPhysicalMaterial`
  - `color`: `#2A2E3C`
  - `transparent: true`
  - `opacity`: `0.4–0.6`
  - `roughness`: `0.3`
  - `metalness`: `0.1`
- アニメーション:
  - 各軸でゆっくり回転（`0.1–0.3 rad/s`）
  - `position.y` に `sin` で微小な上下漂い（振幅 `0.05–0.15`、周期 `3–6s`）

## Particle Trail Spec

### Visual Character

- 「点」ではなく **細いライン状の軌跡**
- 柱群の間を水平方向に横切るように移動
- レーザービームのような鋭い線、ただし非常に細い

### Parameters

- 同時表示数: **3–6 本**
- 各トレイルの長さ: 柱群の幅の 30–60%
- 移動速度: `0.5–1.5 units/s`（通常時）、終盤 `2.0x` まで加速
- 線の太さ: `0.01–0.02`（画面上でごく細い線として見える）
- 色: 赤 / 緑 / 青紫（各色 1–2 本）
- 残像: 進行方向の後ろに `0.5–1.5` の長さのフェードする尾

### Motion

- 直線的ではなく、ゆるやかなカーブを描いて移動
- 柱にぶつかっても貫通する（物理判定なし）
- Y 座標は柱の高さの中間あたり（`0.5–2.0`）で水平移動

## Camera Spec

### Orbit Path

- **回転中心**: 柱群の重心（`x=0, y=0, z=0`）
- **初期位置**: ほぼ真上（仰角 ~75°）、距離 ~12 units
- **軌道**: Y 軸周りの反時計回り円軌道
- **仰角変化**: 75° → 60°（9.5s かけて緩やかに降下）

### Timeline

| Phase | Time | Camera Speed | Zoom Speed | Note |
|-------|------|-------------|------------|------|
| Calm | 0.0–7.5s | 0.08 rad/s | -0.15 units/s | ゆったりした俯瞰 |
| Accel | 7.5–8.5s | 0.08→0.5 rad/s | -0.15→-1.5 units/s | 急加速 |
| Rush | 8.5–9.5s | 0.5→1.2 rad/s | -1.5→-3.0 units/s | 高速接近 + 暗転 |

### Easing

- Calm→Accel 遷移: `easeInCubic` 的な加速カーブ
- 急激な切り替えではなく滑らかに加速する

## Ending Spec

### Fade Timeline

| Time | Brightness | Note |
|------|-----------|------|
| 0.0–7.5s | 100% | 通常表示 |
| 7.5–8.5s | 100%→70% | 暗転開始、まだシーンは見える |
| 8.5–9.0s | 70%→30% | 急速に暗くなる |
| 9.0–9.5s | 30%→0% | 完全暗転 |

### Implementation

- CSS overlay の `opacity` ではなく、**シーン内のグローバルライト強度** を下げる方式を基本とする
- 最終段階（30%→0%）では CSS overlay の黒フェードを併用してもよい
- 暗転はシーン全体に均一にかかる（特定要素だけ先に消えたりしない）

## Lighting Spec

### Primary Light (Top)

- `DirectionalLight`
- 方向: 斜め上から（`position: [5, 10, 5]` 程度）
- 強度: `1.0–1.5`
- 色: `#FFFFFF`（純白）
- `castShadow: true`
- 柱の上面を明るく、側面に陰影を作る

### Ambient

- `AmbientLight`
- 強度: `0.15–0.25`
- 色: `#8890A8`（わずかに青味のあるグレー）

### Central Point Light

- `PointLight`
- 位置: 柱群の中心、地面レベル（`y=0`）
- 色: `#4A57A8`
- 強度: `2.0–4.0`
- 減衰: `distance = 8, decay = 2`
- `castShadow: true`（柱の隙間からの光漏れを作る）

## Post Process

- Bloom は **最後に** 必要最小限だけ検討する
- まず bloom なしで中央発光が成立するか確認
- 使う場合: `intensity = 0.3`, `radius = 0.5`, `threshold = 0.8`
- 白飛びは絶対に避ける

## Do Not Do

- 遠景に色付きの霧や大気を入れない（背景は純黒）
- 柱を発光させない（発光するのは中央のライトだけ）
- 白く大きい bloom
- 高速すぎる回転や脈動
- 彩度の高いネオン表現
- 粒子を「粒」として表現しない（ライン/トレイルとして表現する）
