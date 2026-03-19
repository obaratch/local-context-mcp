import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, test } from "vitest";
import {
	closeTrackedTransports,
	createIntegrationTestClient,
} from "../utils/testUtils.js";

const transports: StdioClientTransport[] = [];

afterEach(async () => {
	await closeTrackedTransports(transports);
});

describe("結合: サーバ起動", () => {
	test("起動後に connect と ping で待機中であることを確認できること", async () => {
		const client = await createIntegrationTestClient(transports);

		// MCP の ping 応答は空オブジェクトになる:
		// https://modelcontextprotocol.io/specification/draft/basic/utilities/ping
		// Anthropic の MCP 概要:
		// https://docs.anthropic.com/en/docs/mcp
		await expect(client.ping()).resolves.toEqual({});
	});
});

describe("結合: MCPツールリスト取得", () => {
	test("起動後に tools/list で公開用ツール一覧を取得できること", async () => {
		const client = await createIntegrationTestClient(transports);

		const result = await client.listTools();
		// レスポンス例を取得するときだけコメント↓を外して stderr に出力
		// logToStdErr(result);

		// 期待するレスポンス例:
		// {
		//   "tools": [
		//     {
		//       "name": "dev-helloworld",
		//       "description": "メインメッセージとして hello world を返す開発者向けツール",
		//       "inputSchema": {
		//         "type": "object",
		//         "properties": {
		//           "ignored": {}
		//         },
		//         "$schema": "http://json-schema.org/draft-07/schema#"
		//       },
		//       "execution": {
		//         "taskSupport": "forbidden"
		//       }
		//     }
		//   ]
		// }
		expect(result.tools).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "when-is-now",
				}),
			]),
		);
		expect(result.tools).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "dev-helloworld",
				}),
				expect.objectContaining({
					name: "dev-error-test",
				}),
				expect.objectContaining({
					name: "dev-store-set",
				}),
				expect.objectContaining({
					name: "dev-store-get",
				}),
			]),
		);
	});

	test("ENABLE_DEV_TOOLS=true で起動すると tools/list に dev-* が含まれること", async () => {
		const client = await createIntegrationTestClient(transports, {
			env: {
				ENABLE_DEV_TOOLS: "true",
			},
		});

		const result = await client.listTools();

		expect(result.tools).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "when-is-now",
				}),
				expect.objectContaining({
					name: "dev-helloworld",
				}),
				expect.objectContaining({
					name: "dev-error-test",
				}),
				expect.objectContaining({
					name: "dev-store-set",
				}),
				expect.objectContaining({
					name: "dev-store-get",
				}),
			]),
		);
	});
});
