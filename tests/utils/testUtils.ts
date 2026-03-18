/**
 * テストコードから利用するための補助ユーティリティ集。
 * 本番ロジックではなく、テスト時の意図表現やデバッグ出力を扱う。
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { VERSION } from "../../src/constants.js";

/**
 * テストコードで未実装の意図を明示したいときに使う例外。
 */
export class NotImplementedError extends Error {
	constructor(message = "not implemented yet") {
		super(message);
		this.name = "NotImplementedError";
	}
}

/**
 * 主にテスト中のデバッグ出力を `stderr` に流すための補助関数。
 * MCP の `stdio` 利用時に `stdout` を汚さないことを目的とする。
 */
export function logToStdErr(value: unknown): void {
	const text =
		typeof value === "string" ? value : JSON.stringify(value, null, 2);
	process.stderr.write(`${text}\n`);
}

/**
 * 結合テスト用の MCP クライアントを生成して接続する。
 *
 * @param transports テスト終了時に close するため追跡している transport 一覧
 * @returns `dist/index.js` に接続済みの `Client`
 */
export async function createIntegrationTestClient(
	transports: StdioClientTransport[],
): Promise<Client> {
	const cwd = process.cwd();
	const serverEntryPoint = `${cwd}/dist/index.js`;

	const client = new Client(
		{
			name: "integration-test-client",
			version: VERSION,
		},
		{
			capabilities: {},
		},
	);

	const transport = new StdioClientTransport({
		command: process.execPath,
		args: [serverEntryPoint],
		cwd,
		stderr: "pipe",
	});

	transports.push(transport);

	await client.connect(transport);

	return client;
}

/**
 * 結合テストで生成した transport をまとめて close する。
 *
 * @param transports close 対象の transport 一覧
 */
export async function closeTrackedTransports(
	transports: StdioClientTransport[],
): Promise<void> {
	await Promise.all(
		transports.splice(0).map(async (transport) => transport.close()),
	);
}
