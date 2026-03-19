# Docker 利用仕様

## 目的
- `local-context` を Docker コンテナとして起動し、MCP クライアントから `docker run` 経由で利用できるようにする。
- 通信方式は既存実装と同じく `stdio` を使い、HTTP や独自ポートは使わない。
- 配布用エントリポイントは `dist/index.js` を使用する。

## 想定する利用形
- MCP クライアントは `docker` コマンドを使ってコンテナを直接起動する。
- MCP の JSON-RPC メッセージは、クライアントとコンテナの標準入出力をそのまま接続してやり取りする。

### 設定例

#### 最小構成
```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "obaratch/local-context-mcp-server"
      ]
    }
  }
}
```

#### `TZ` 明示設定あり
```json
{
  "mcpServers": {
    "local-context": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TZ=Asia/Tokyo",
        "obaratch/local-context-mcp-server"
      ]
    }
  }
}
```

## Docker ランタイム仕様

### 起動コマンド
- コンテナ内では `node dist/index.js` を起動する。
- Docker イメージでは `LOCAL_CONTEXT_STORE_DIR=/data` を既定設定とする。

### 通信方式
- `stdin` と `stdout` を MCP の `stdio` transport に使用する。
- `stdout` には MCP プロトコル以外のログやデバッグ出力を混ぜない。
- ログやエラー出力が必要な場合は `stderr` を使用する。

### コンテナ実行
- `docker run -i` を前提とする。
- `--rm` により、利用後にコンテナを自動削除する。
- ポート公開は不要とする。
- 使い捨て起動を前提とし、永続プロセス管理はコンテナランタイム側に持ち込まない。

## 永続化マウント自動化の検討

### 背景
- 一般利用者に `-v ...:/data` を毎回手で指定してもらうのは負担が大きい。
- 特に GeoIP cache の再利用だけが目的の利用者にとっては、Docker volume や bind mount の詳細を意識させたくない。

### 先に明確にしておく制約
- コンテナ起動後に、コンテナ自身が「未指定なら永続 volume を追加する」ことはできない。
- 永続 volume の有無は `docker run` の引数として、コンテナ起動前にホスト側で確定している必要がある。
- `--rm` 付き起動で匿名 volume に頼る方式は不適切とする。
- 匿名 volume は stable な再利用名を持たず、`--rm` 付きでは削除されるため、store 永続化要件を満たしにくい。

### 将来仕様の方向性
- 永続化マウントの自動化を行う場合は、コンテナ内実装ではなくホスト側ラッパーで吸収する。
- 想定例:
  - `local-context-docker` のような起動ラッパーを配布する。
  - ラッパーは利用者が明示的な mount を指定していない場合だけ、既定の named volume を `/data` へ mount する。
- この方式なら、利用者は MCP 設定で raw な `docker run` ではなくラッパーコマンドを指定するだけでよい。

### 既定 named volume の考え方
- 仮の既定名は `local-context-store` とする。
- 同一ホスト上でこのプロジェクト専用に再利用する前提で扱う。
- Docker は named volume を初回利用時に自動作成できるため、ホスト側の `/data` 作成や root 権限を前提にしない。
- 将来的に複数プロファイルを扱いたくなった場合は、volume 名 override を別オプションとして検討する。

### 明示指定との優先順位
- 利用者が bind mount または named volume を明示指定した場合は、その指定を最優先する。
- 自動 volume 作成は「永続化指定がない場合の補完」に限定する。
- `TZ` の優先順位と同様に、自動補完より明示設定を優先する。

### README と一般案内での扱い
- 実装前の段階では、README の一般利用手順には含めない。
- 仕様としては `docs/docker.md` に検討内容を残し、実装が入った時点で README と設定例を更新する。

## イメージ仕様

### イメージ名
- イメージ名は `obaratch/local-context-mcp-server` とする。

### ベースイメージ
- Node.js 24 系を使用する。

### イメージ内容
- 配布対象は `dist/` と production dependencies を基本とする。
- 実行に必要な `package.json` と lockfile を含める。
- 開発用ツールやテスト実行にのみ必要な依存は含めない構成を推奨する。

### 実行ユーザ
- 非 root ユーザでの実行を推奨する。

## タイムゾーン方針

### 基本方針
- Docker 版でも `when-is-now` はユーザが期待するタイムゾーンで動作することを重視する。
- タイムゾーン解決順序は以下とする。
1. `TZ` 明示設定
2. GeoIP cache 付きの自動取得
4. コンテナ実行環境のローカルタイムゾーン
- このため、`TZ` は必須ではないが、最優先の明示 override として扱う。

### `TZ` の位置づけ
- `TZ` はオプション設定とする。
- `TZ` を設定した場合、auto-tz や GeoIP cache より優先して使う。
- `TZ` を設定しない場合、GeoIP cache 付き自動取得で補完する。
- 正確なタイムゾーンを利用者が明示したい場合は、`TZ` を使う。

### 理由
- Docker コンテナは既定で UTC になる場合がある。
- ただし現在の `when-is-now` は、実行環境ローカルタイムゾーンだけではなく、`timezoneResolver` による解決結果を使う。
- このため、`TZ` 未設定でも一定の補完はできる。
- 一方で、ネットワーク制限や provider 失敗時には自動取得できない可能性があるため、利用者が意図を固定したい場合には `TZ` が有効である。

### 実行例
```bash
docker run -i --rm obaratch/local-context-mcp-server
```

```bash
docker run -i --rm -e TZ=Asia/Tokyo obaratch/local-context-mcp-server
```

- 自動取得 cache をコンテナ再作成後も再利用したい場合は、あわせて store 永続化を有効化する。
- 将来的にラッパー方式を導入する場合は、この永続化指定を利用者から隠蔽できる。

## store 永続化方針

### 基本方針
- Docker 利用時の store 永続化は named volume を標準とする。
- bind mount は上級者向けの明示 override として扱う。
- ホスト側の固定ディレクトリ作成や root 権限は前提にしない。
- Docker イメージは `LOCAL_CONTEXT_STORE_DIR=/data` を既定で持つため、通常利用ではこの環境変数を明示指定しなくてよい。

### 推奨実行例
```bash
docker run -i --rm \
  --mount source=local-context-store,target=/data \
  obaratch/local-context-mcp-server
```

```bash
docker run -i --rm \
  -e TZ=Asia/Tokyo \
  --mount source=local-context-store,target=/data \
  obaratch/local-context-mcp-server
```

- この構成では store と GeoIP cache の両方が named volume `local-context-store` に保存される。
- named volume は Docker が管理するため、ホストに `/data` のような固定ディレクトリを用意しなくてよい。
- named volume は初回利用時に自動作成される前提で扱う。

### bind mount を使う場合
```bash
docker run -i --rm \
  -v "$(pwd)/data:/data" \
  obaratch/local-context-mcp-server
```

- bind mount は保存ファイルをホストから直接見たい場合だけ使えばよい。
- 一般利用向けの標準案内は named volume を優先する。

### 将来の自動化方針
- 将来的にホスト側ラッパーを導入する場合、mount 未指定時は `local-context-store:/data` を自動付与する。
- このときも bind mount や別 named volume を利用者が明示指定した場合は、その指定を最優先する。

## 公開ツール方針
- Docker で公開する tool の種別は `docs/dev-mode.md` の方針に従う。
- 一般利用向けの Docker 実行では、公開用 tool だけを利用可能とする。
- 実装上は `ENABLE_DEV_TOOLS=true` を渡すことで `dev-*` を有効化できても、その使い方は一般向け仕様に含めない。
- README や通常の利用手順では `dev-*` 有効化を案内しない。

## 受け入れ条件
- `docker run -i --rm obaratch/local-context-mcp-server` で MCP サーバとして起動できること。
- 必要に応じて `-e TZ=Asia/Tokyo` を追加できること。
- store 永続化の推奨方式として named volume を案内していること。
- Docker イメージ既定で `LOCAL_CONTEXT_STORE_DIR=/data` を持ち、通常利用で明示指定不要であること。
- MCP クライアントから `initialize` に成功すること。
- `tools/list` で公開対象のツール一覧を取得できること。
- 一般利用向けの Docker 実行で `dev-*` を前提にしないこと。
- `when-is-now` が ISO 8601 形式かつタイムゾーンオフセット付きの現在日時文字列を返すこと。
- `when-is-now` が `structuredContent.timezone` を返すこと。
- `TZ` を設定した場合、その値が最優先で使われること。
- `stdout` に MCP メッセージ以外の不要な出力が混入しないこと。
- コンテナ終了後に不要なプロセスや一時リソースを残さないこと。

## 実装状況
- `Dockerfile` は実装済み。
- `.dockerignore` は実装済み。
- README に LM Studio 向け Docker 利用手順を記載済み。
- `npm run docker:build` でイメージをビルドできる。
- 一般利用向け Docker 結合テストは実装済み。
- store 永続化の opt-in Docker 結合テストは実装済み。
- 永続化マウント自動化は未実装で、現時点では検討仕様のみ。

## 関連ドキュメント
- `docs/auto-tz.md`
- `docs/dev-mode.md`
- `docs/store.md`
- `docs/testing.md`
