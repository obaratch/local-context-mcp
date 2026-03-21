# セキュリティ運用

## 目的
- 認証情報や秘密情報がリポジトリに混入するリスクを減らす。
- 開発者が手元で補助的な security scan を実行できるようにする。
- 現時点では CI の必須ゲートにせず、手動実行ベースで運用する方針を明確にする。

## 現時点の運用方針
- secret scan には Betterleaks を使用する。
- 実行コマンドは `npm run security:scan` とする。
- Betterleaks は補助的な開発者向けチェックとして扱い、現時点では CI の必須チェックには組み込まない。
- 編集のたびに毎回実行することは求めず、push の直前を主な実行タイミングとして推奨する。
- 開発者は、secret が混入しうる変更を行った場合に push 前の確認として手動で実行する。

## `npm run security:scan` の役割
- `scripts/security-scan.sh` を起点として Betterleaks を実行する。
- Betterleaks は Docker 経由で起動する。
- Betterleaks の Docker イメージは、現時点では評価目的のため `ghcr.io/betterleaks/betterleaks:latest` を使用する。
- project root をコンテナへ mount し、リポジトリの作業ツリーを走査する。
- 出力は SARIF 形式で `sarif/betterleaks.sarif` に保存する。
- 直前の結果が存在する場合は `sarif/betterleaks.last.sarif` に退避してから新しい結果を出力する。

## 実行を推奨するケース
- `.env`、API key、token、秘密鍵、接続文字列など、認証情報や秘密情報を新規追加または更新したとき。
- OpenAI などの外部 API 連携を追加または変更したとき。
- 設定ファイル、CI 設定、Dockerfile、shell script のように secret が紛れ込みやすい箇所を変更したとき。
- 一時的なデバッグのために実データや credential を貼った可能性があるとき。
- README、サンプルコード、fixture、テストデータに値を書いたとき。
- push 前、PR 作成前、公開前に最終確認したいとき。

## Betterleaks の対象と限界
- Betterleaks は主に secret scanning のためのツールであり、依存パッケージの脆弱性検査やサプライチェーン全般の評価を主目的としない。
- 既知パターンに基づく検出が中心であり、独自形式の秘密情報や文脈依存の問題は見逃す可能性がある。
- 検出結果が 0 件でも安全性が完全に保証されるわけではない。
- 依存関係の脆弱性やサプライチェーンリスクは、必要に応じて別の仕組みで扱う。

## 走査対象と除外方針
- Betterleaks の設定は `.betterleaks.toml` で管理する。
- 現時点では `node_modules/`, `dist/`, `sarif/` を走査対象から除外する。
- `node_modules/` は外部依存の展開物であり、secret scan のノイズ源になりやすいため除外する。
- `dist/` は生成物であり、通常は source と重複するため除外する。
- `sarif/` はスキャン結果そのものの保存先であり、再走査しても有益性が低いため除外する。

## CI に組み込まない理由
- Betterleaks 自体がまだ新しく、このリポジトリでの運用経験が十分ではない。
- 手元運用でノイズや誤検知の傾向を見ながら、導入範囲を慎重に判断したい。
- 現時点では、開発速度よりも「必要なときに開発者が補助的に使えること」を優先する。
- 同様の理由で、現時点では Docker イメージの再現性固定よりも追従性を優先し、固定タグではなく `:latest` を使用する。

## SARIF の扱い
- 最新結果は `sarif/betterleaks.sarif` とする。
- 直前の結果は `sarif/betterleaks.last.sarif` とする。
- 差分確認が必要なときは、この 2 ファイルを比較する。
- 古い結果を無制限に保持する運用は行わない。
- 現時点では、試行中の運用を開発者間で共有しやすくするため、`sarif/` は Git 管理対象とする。
- agent が `npm run security:scan` などで scan を実行した場合は、結果を開発者の使用言語に合わせて要約して説明する。
- このリポジトリでは、agent からの結果説明は原則として日本語で行う。

## 前提条件
- `npm run security:scan` の実行には Docker が必要である。
- Docker CLI が利用可能で、Docker daemon が起動していることを前提とする。

## 関連ドキュメント
- `docs/docker.md`
- `docs/dev-mode.md`
- `docs/testing.md`
