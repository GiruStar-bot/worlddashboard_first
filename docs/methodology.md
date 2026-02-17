# World Dashboard Methodology

最終更新: 2026-02-17

この文書は、実装中のレイヤー計算ロジック（FSI再定義・US/China/Natural Resources index）を、コードと配布JSONの現状に合わせて固定フォーマットで整理したものです。

---

## Layer: Geopolitical Risk (FSI 再定義)

- **入力指標**
  - `fsi_total`（0〜120想定。`canonical.risk.fsi_total.value`）
  - `stability_score`（0〜100想定。`ui_view.scores.stability_score`）
  - `normalized_fsi = (fsi_total / 120) * 100`
  - `stability_penalty = 100 - stability_score`
- **重み**
  - `normalized_fsi`: `0.85`
  - `stability_penalty`: `0.15`
- **欠損時処理**
  - `fsi_total` が `null/undefined` の場合: レイヤースコアは `null`（更新しない）
  - `stability_score` が `null/undefined` の場合: `stability_penalty = 0` として扱う
- **最終スコア式**
  - `final_score = clamp[0,100](0.85*normalized_fsi + 0.15*stability_penalty)`
  - 表示値は小数1桁に丸め

---

## Layer: US Influence

- **入力指標**（いずれも 0〜100 の事前正規化）
  - `allied_institutions_exposure`
  - `fdi_from_us`
  - `trade_with_us_pct`
  - `security_ties`
  - `tech_dependency`
  - `financial_exposure`
  - `logistics_exposure`
- **重み**
  - `allied_institutions_exposure`: `0.10`
  - `fdi_from_us`: `0.12`
  - `trade_with_us_pct`: `0.14`
  - `security_ties`: `0.30`
  - `tech_dependency`: `0.12`
  - `financial_exposure`: `0.17`
  - `logistics_exposure`: `0.05`
  - 定数項: `+12`
- **欠損時処理**
  - 生成済み `public/us_influence_index.json` の `countries` に存在しない ISO3 は、アプリ上では実質 `null` 扱い（塗り分けは no-data 色）
  - 個別指標欠損の補完ルールは生成パイプライン側実装依存（本リポジトリには生成スクリプト未同梱）。JSONには `raw_values.estimated_fields` が残る場合あり
- **最終スコア式**
  - `score = clamp[0,100](12 + 0.10*A + 0.12*B + 0.14*C + 0.30*D + 0.12*E + 0.17*F + 0.05*G)`

---

## Layer: China Influence

- **入力指標**
  - base score の構成要素（メタ情報定義）
    - trade exposure `30%`
    - BRI participation `20%`
    - Chinese FDI `20%`
    - AIIB membership `10%`
    - infrastructure exposure `20%`
- **重み**
  - base score 内部重みは上記
  - 再変換式の係数
    - `0.90*base_score`
    - `+12`
    - `+0.08*max(base_score-45,0)`
    - `-0.04*max(20-base_score,0)`
- **欠損時処理**
  - `public/china_influence_index.json` に国スコアがなければ、アプリ上は `null` 扱い（no-data 色）
  - base component 欠損時の補完ロジックは生成パイプライン側実装依存（本リポジトリに生成スクリプト未同梱）
- **最終スコア式**
  - `score = clamp[0,100](0.90*base_score + 12 + 0.08*max(base_score-45,0) - 0.04*max(20-base_score,0))`

---

## Layer: Natural Resources (GNR-PRI)

- **入力指標**
  - `prod`（0〜100, 生産能力 index）
  - `dep`（天然資源レント GDP比, 想定 0〜60+）
  - `res`（0〜100, 効率/レジリエンス）
  - `dep_norm = clamp[0,100](dep * 100 / 60)`
- **重み**
  - `prod`: `0.50`
  - `dep_norm`: `0.22`
  - `res`: `0.28`
  - 定数項: `+8`
  - 戦略的補正: `+0.10*max(prod-70,0)`
  - 低レジリエンス補正: `-0.06*max(25-res,0)`
- **欠損時処理**
  - 生成済み `public/natural_resources_index.json` に国スコアがなければ、アプリ上は `null` 扱い（no-data 色）
  - `dep > 60` は `dep_norm=100` にクリップ
- **最終スコア式**
  - `score = clamp[0,100](8 + 0.50*prod + 0.22*dep_norm + 0.28*res + 0.10*max(prod-70,0) - 0.06*max(25-res,0))`

---

## 実装注記（重要）

- 本アプリで「再定義（redefine）」は、**FSIレイヤーのみ**に対して実行。
  - 読み込み後に `fsi_total` を再計算スコアへ差し替える。
  - 同時に `ui_view.score_breakdown.fsi` に構成要素（`normalized_fsi`, `stability_penalty`, `final_score` など）を保存する。
- US/China/Natural Resources は `public/*_index.json` の `score` をそのまま参照し、アプリ側で再計算しない。
- US/China index の「生成元」は現リポジトリでは配布JSON（`public/us_influence_index.json`, `public/china_influence_index.json`）に含まれる `meta` 記述が一次情報。
