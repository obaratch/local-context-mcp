# Lint 方針
- Biome を formatter + 基本 lint として使う。
- Oxlint を追加 lint として使う。
- `lint` は Biome と Oxlint の両方を通過条件にする。
- `lint` はローカルと CI の両方で実行する。
- ソースを修正して保存したら、必ず `npm run format` と `npm run lint` を実行する。
- Biome の設定は `biome.json` で管理する。
- `dist/` は生成物のため、Biome の対象から除外する。

## コマンド
- `npm run format`
- `npm run lint`
- `npm run lint:biome`
- `npm run lint:oxlint`

## 次の導入対象
- Oxlint 設定ファイル
- CI の lint 必須化
