import process from "node:process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_NAME, VERSION } from "./constants.js";
import { whenIsNow } from "./tools/whenIsNow.js";
import { whereAreWe } from "./tools/whereAreWe.js";

export async function createServer(): Promise<McpServer> {
	const server = new McpServer({
		name: SERVER_NAME,
		version: VERSION,
	});

	await registerTools(server);

	return server;
}

export async function registerTools(server: McpServer): Promise<void> {
	registerPublicTools(server);

	if (isDevToolsEnabled()) {
		await registerDevTools(server);
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

export async function registerDevTools(server: McpServer): Promise<void> {
	const [
		{ z },
		{ devErrorTest },
		{ devHelloworld },
		{ devStoreGet },
		{ devStoreSet },
	] = await Promise.all([
		import("zod"),
		import("./tools/devErrorTest.js"),
		import("./tools/devHelloworld.js"),
		import("./tools/devStoreGet.js"),
		import("./tools/devStoreSet.js"),
	]);
	const jsonValueSchema = buildJsonValueSchema(z);

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
	const server = await createServer();
	const transport = new StdioServerTransport();
	let shuttingDown = false;

	const shutdown = async (): Promise<void> => {
		if (shuttingDown) {
			return;
		}

		shuttingDown = true;
		removeProcessListeners();

		try {
			await server.close();
		} catch (error) {
			logProcessError("server close failed", error);
		}

		try {
			await transport.close();
		} catch (error) {
			logProcessError("transport close failed", error);
		}
	};

	const handleTermination = (): void => {
		const forceExitTimer = setTimeout(() => {
			process.stderr.write(
				"[local-context] shutdown timed out; forcing exit\n",
			);
			process.exit(1);
		}, 5_000);

		void shutdown().finally(() => {
			clearTimeout(forceExitTimer);
			process.exit(0);
		});
	};

	const removeProcessListeners = (): void => {
		process.off("SIGINT", handleTermination);
		process.off("SIGTERM", handleTermination);
		process.off("SIGHUP", handleTermination);
		process.stdin.off("end", handleTermination);
		process.stdin.off("close", handleTermination);
	};

	process.once("SIGINT", handleTermination);
	process.once("SIGTERM", handleTermination);
	process.once("SIGHUP", handleTermination);
	process.stdin.once("end", handleTermination);
	process.stdin.once("close", handleTermination);

	await server.connect(transport);
}

function buildJsonValueSchema(
	z: typeof import("zod").z,
): import("zod").ZodType<import("./utils/storeUtils.js").StoreValue> {
	const jsonValueSchema: import("zod").ZodType<
		import("./utils/storeUtils.js").StoreValue
	> = z.lazy(() =>
		z.union([
			z.string(),
			z.number(),
			z.boolean(),
			z.null(),
			z.array(jsonValueSchema),
			z.record(z.string(), jsonValueSchema),
		]),
	);

	return jsonValueSchema;
}

function logProcessError(message: string, error: unknown): void {
	const detail =
		error instanceof Error ? (error.stack ?? error.message) : String(error);
	process.stderr.write(`[local-context] ${message}: ${detail}\n`);
}

// テスト時に import しただけでサーバプロセス化しないよう、
// エントリポイントとして直接実行された場合だけ main を起動する。
const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;

if (isEntrypoint) {
	void main().catch((error) => {
		logProcessError("fatal", error);
		process.exitCode = 1;
	});
}
