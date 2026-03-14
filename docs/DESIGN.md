# DESIGN SPEC

## Visual Direction

- Mood: 冷たく静かで、少し神秘的
- Era feel: 現代的な写実表現ではなく、2000年代前半の抽象 CG ムービー寄り
- Contrast: 真っ黒には落とさず、暗い青灰の空気感を残す
- Glow: 白く飛ばさず、青紫の色光としてにじませる

## Base Palette

- Background base: `#171A1C`
- Background deep shadow: `#0C1018`
- Prism base: `#B9CAED`
- Prism highlight: `#E8F1FF`
- Prism shadow tint: `#8EA0C7`
- Haze base: `#313972`
- Haze highlight: `#4A57A8`
- Haze deep tone: `#222755`
- Accent blue: `#3557D6`
- Accent green particle: `#49D8A8`
- Accent red particle: `#E2516A`

## Atmosphere Spec

### Chosen Approach

- 真の volumetric は使わず、2.5D の layered transparent planes で表現する
- 奥行き補助として `FogExp2` をごく薄く使う
- 発光感は bloom 頼みではなく、加算ブレンドの重なりで作る

### Haze Layout

- Haze group は柱群より奥、カメラから見て `z = -6` から `z = -16` の範囲に置く
- Haze plane 数は `8` 枚を基準値とし、調整レンジは `6` から `12`
- 1 枚ごとの初期スケールは `0.8` から `2.6`
- 各 plane のサイズは完全ランダムではなく、大 `3` / 中 `3` / 小 `2` の比率を基本にする
- 画面中央に寄せすぎず、左右に少し偏りを持たせて塊感を出す

### Haze Material

- Base color は `#313972` を中心に、`#2A2F68` から `#4A57A8` の範囲で揺らす
- Opacity 初期値は `0.08` から `0.18`
- Blend は `AdditiveBlending` を基本とする
- `transparent: true`
- `depthWrite: false`
- `depthTest: true`
- `side: DoubleSide`
- 白寄りにしない。彩度を落としすぎて灰色にも寄せない

### Texture Character

- エッジが立った雲ではなく、ぼけた楕円とノイズを重ねたアルファ
- 中心は少し密度があり、外周は長く消える
- 1 枚ごとに UV offset と rotation を変え、同じ形に見えないようにする
- ノイズは高周波ではなく低周波。細かい煙感より大きい漂いを優先する

## Motion Spec

### Haze Animation

- `rotation.z` はゆっくり回し、速度は `0.015` から `0.05 rad/s`
- `scale` は `1.00` から `1.06` の範囲で脈動させる
- `position.x` は最大 `0.12`
- `position.y` は最大 `0.18`
- UV の `offset.x` は `0.003` から `0.01 /s`
- UV の `offset.y` は `0.002` から `0.008 /s`
- どの値も同期させず、位相をずらす

### Particle Motion

- 粒子はモヤと独立したレイヤで管理する
- 粒子数は常時 `18` から `32`
- 移動速度は低速基準、終盤のみ `1.8x` まで加速
- 尾の長さは短めで、線より残像に近い見え方にする

### Camera Motion

- 全体尺は `10.0s`
- `0.0s` から `7.4s` は低速の回転とズーム
- `7.4s` から `8.8s` で回転・ズーム・粒子速度を加速
- `8.8s` から `10.0s` は暗転主体で、奥のモヤもフェードさせる

## Depth And Fog

- `FogExp2` は空気遠近補助専用
- Fog color は背景寄りの `#171A1C`
- density 基準値は `0.028`
- 調整レンジは `0.018` から `0.04`
- Fog が主役にならないこと。モヤの塊感を消すなら濃すぎる

## Post Process

- Bloom は使う場合のみ弱く入れる
- 強度は「白飛びしない」を最優先に決める
- 目標は輪郭の発光ではなく、青紫の滲み
- まず bloom なしで成立させ、最後に必要最小限だけ加える
- 初期の評価値は `intensity = 0.22`, `radius = 0.45`, `threshold = 0.72`

## Do Not Do

- ガチの volumetric cloud
- raymarching 前提の重い構成
- 白く大きい bloom
- 霧だけでモヤを表現する構成
- 高速すぎる回転や脈動
- 彩度の高すぎるネオン表現

## Acceptance Criteria

- モヤが「遠景の発光する雲状の塊」として見える
- 柱より前に出て見えず、奥レイヤとして読める
- 静止画でも塊感があり、動画ではゆっくり漂って見える
- 青紫の気配はあるが、画面全体が青一色に潰れない
- 終盤の暗転時にモヤだけが不自然に残らない

## Open Decisions

- Haze 用のアルファを画像で持つか、`ShaderMaterial` で手続き生成するか
- Bloom を入れるか、加算ブレンドだけで完結させるか
- 粒子の残像をラインで作るか、後処理で作るか
- 尺を `10.0s` 固定にするか、`8.0s` 前後へ短縮するか
- 音と同期するなら、加速開始点を秒数固定ではなく進行率基準にするか

## Decisions To Lock Before Build

- ループ形式を固定する
  - `10.0s` ワンショット
  - `10.0s + black hold` のループ
- Haze ノイズ源を固定する
  - PNG alpha
  - `ShaderMaterial` の 2D procedural noise
- レイヤ構成を固定する
  - `8` 枚固定
  - `6` から `12` の調整余地を残す
- ブレンド方針を固定する
  - 全面 `AdditiveBlending`
  - 手前 `2` 枚のみ `NormalBlending`
- 終盤フェード順を固定する
  - モヤ先行
  - 粒子同時
- 承認用の比較フレームを固定する
  - 通常時
  - 加速開始直前
  - 暗転直前
