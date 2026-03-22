# 技術スタック
- Node.js 24以上 (stable)
- npm
- TypeScript
- Model Context Protocol (MCP)
- @modelcontextprotocol/sdk
- esbuild
- tsx
- Vitest
- Biome
- Oxlint

## 実行方針
- MCP サーバ実装には `@modelcontextprotocol/sdk` を使用する。
- 通信方式は stdio を使用する。
- 開発実行は `tsx` を使用し、`src/index.ts` を直接起動する。
- 配布物は `esbuild` で単一 bundle を `dist/index.js` として生成して利用する。
- パッケージのエントリポイントは `dist/index.js` を使用する。

## 関連資料
- [Lint](linting.md)
- [テスト](testing.md)
