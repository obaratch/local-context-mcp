# dev-error-test

## 目的
- 結合テストで意図的にエラー系を確認するための開発者向け機能。

## 概要
- `dev-error-test` は、MCP の tool 呼び出し結果としてエラーを返す。
- JSON-RPC レベルの `error` オブジェクトそのものではなく、tools/callの標準的エラー表現である `isError: true` を持つ tool error result を返す想定とする。
- `data` フィールドは簡素化のためこの機能では扱わない。

## 入力
- `code?: number`
- `message?: string`

## デフォルト値
- `code = -32000`
- `message = "Expected test error"`
- `-32000` は JSON-RPC のサーバーエラー用レンジ (`-32000` 〜 `-32099`) に含まれる値として使う。

## 返却方針
- `isError: true` を返す。
- `code`, `message` が指定されていれば、その値を返却内容に反映する。
- 引数未指定時は、テスト用デフォルト値の内容を返す。
