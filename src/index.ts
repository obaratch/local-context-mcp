import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SERVER_NAME, VERSION } from "./constants.js";
import { devHelloworld } from "./tools/devHelloworld.js";

export function createServer(): McpServer {
	const server = new McpServer({
		name: SERVER_NAME,
		version: VERSION,
	});

	registerTools(server);

	return server;
}

export function registerTools(server: McpServer): void {
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
