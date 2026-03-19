import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SERVER_NAME, VERSION } from "./constants.js";
import { devErrorTest } from "./tools/devErrorTest.js";
import { devHelloworld } from "./tools/devHelloworld.js";
import { devStoreGet } from "./tools/devStoreGet.js";
import { devStoreSet } from "./tools/devStoreSet.js";
import { whenIsNow } from "./tools/whenIsNow.js";
import { whereAreWe } from "./tools/whereAreWe.js";
import type { StoreValue } from "./utils/storeUtils.js";

const jsonValueSchema: z.ZodType<StoreValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(jsonValueSchema),
		z.record(z.string(), jsonValueSchema),
	]),
);

export function createServer(): McpServer {
	const server = new McpServer({
		name: SERVER_NAME,
		version: VERSION,
	});

	registerTools(server);

	return server;
}

export function registerTools(server: McpServer): void {
	registerPublicTools(server);

	if (isDevToolsEnabled()) {
		registerDevTools(server);
	}
}

export function registerPublicTools(server: McpServer): void {
	server.registerTool(
		"when-is-now",
		{
			description: "現在日時を返す基本機能",
			inputSchema: {},
		},
		async (params) => {
			return whenIsNow(params);
		},
	);

	server.registerTool(
		"where-are-we",
		{
			description: "GeoIP 由来の大まかな場所文字列を返す基本機能",
			inputSchema: {},
		},
		async (params) => {
			return whereAreWe(params);
		},
	);
}

export function registerDevTools(server: McpServer): void {
	server.registerTool(
		"dev-helloworld",
		{
			description: "メインメッセージとして hello world を返す開発者向けツール",
			inputSchema: {
				ignored: z.unknown().optional(),
			},
		},
		async (params) => {
			return devHelloworld(params);
		},
	);

	server.registerTool(
		"dev-error-test",
		{
			description: "結合テスト用。MCP仕様に沿ったエラーを返す。",
			inputSchema: {
				code: z.number().int().optional(),
				message: z.string().optional(),
			},
		},
		async (params) => {
			return devErrorTest(params);
		},
	);

	server.registerTool(
		"dev-store-set",
		{
			description: "結合テスト用。キーに JSON 値を保存する。",
			inputSchema: {
				key: z.string(),
				value: jsonValueSchema,
			},
		},
		async (params) => {
			return devStoreSet(params);
		},
	);

	server.registerTool(
		"dev-store-get",
		{
			description: "結合テスト用。キーに保存された JSON 値を取得する。",
			inputSchema: {
				key: z.string(),
			},
		},
		async (params) => {
			return devStoreGet(params);
		},
	);
}

export function isDevToolsEnabled(): boolean {
	return process.env.ENABLE_DEV_TOOLS === "true";
}

export async function main(): Promise<void> {
	const server = createServer();
	const transport = new StdioServerTransport();

	await server.connect(transport);
}

// テスト時に import しただけでサーバプロセス化しないよう、
// エントリポイントとして直接実行された場合だけ main を起動する。
const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;

if (isEntrypoint) {
	void main();
}
