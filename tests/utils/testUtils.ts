/**
 * テストコードから利用するための補助ユーティリティ集。
 * 本番ロジックではなく、テスト時の意図表現やデバッグ出力を扱う。
 */

import { type ChildProcess, execFileSync } from "node:child_process";
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

type IntegrationTestClientOptions = {
	env?: NodeJS.ProcessEnv;
};

type DockerIntegrationTestClientOptions = {
	env?: NodeJS.ProcessEnv;
};

const dockerIntegrationImageTag = "local-context-mcp:test-integration";

export type IntegrationTestConnection = {
	client: Client;
	transport: StdioClientTransport;
	process: ChildProcess;
};

/**
 * 結合テスト用の MCP クライアントを生成して接続する。
 *
 * @param transports テスト終了時に close するため追跡している transport 一覧
 * @param options サーバ起動時に追加で渡したいオプション
 * @returns `dist/index.js` に接続済みの `Client` と関連情報
 */
export async function createTrackedIntegrationTestClient(
	transports: StdioClientTransport[],
	options?: IntegrationTestClientOptions,
): Promise<IntegrationTestConnection> {
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
		env: {
			...process.env,
			...options?.env,
		},
		stderr: "pipe",
	});

	transports.push(transport);

	await client.connect(transport);

	const childProcess = getTransportChildProcess(transport);

	return {
		client,
		transport,
		process: childProcess,
	};
}

export async function createIntegrationTestClient(
	transports: StdioClientTransport[],
	options?: IntegrationTestClientOptions,
): Promise<Client> {
	const { client } = await createTrackedIntegrationTestClient(
		transports,
		options,
	);

	return client;
}

/**
 * Docker イメージをビルドし、コンテナ経由の結合テストを実行できる状態にする。
 */
export function buildDockerIntegrationTestImage(): string {
	execFileSync("docker", ["build", "-t", dockerIntegrationImageTag, "."], {
		cwd: process.cwd(),
		stdio: "inherit",
	});

	return dockerIntegrationImageTag;
}

/**
 * Docker コンテナ経由で MCP サーバに接続する結合テスト用クライアントを生成する。
 *
 * @param transports テスト終了時に close するため追跡している transport 一覧
 * @param imageTag 接続先 Docker イメージ名
 * @param options サーバ起動時に追加で渡したいオプション
 * @returns Docker コンテナに接続済みの `Client`
 */
export async function createDockerIntegrationTestClient(
	transports: StdioClientTransport[],
	imageTag: string,
	options?: DockerIntegrationTestClientOptions,
): Promise<Client> {
	const client = new Client(
		{
			name: "docker-integration-test-client",
			version: VERSION,
		},
		{
			capabilities: {},
		},
	);

	const transport = new StdioClientTransport({
		command: "docker",
		args: ["run", "-i", "--rm", ...buildDockerEnvArgs(options?.env), imageTag],
		cwd: process.cwd(),
		stderr: "pipe",
	});

	transports.push(transport);

	await client.connect(transport);

	return client;
}

/**
 * `StdioClientTransport` の子プロセス本体を取得する。
 *
 * `StdioClientTransport` の public API では child process 本体を取得できないため、
 * 終了シグナルの結合テストでは内部の `_process` を参照している。
 * SDK の実装詳細に依存するため、`@modelcontextprotocol/sdk` の更新時は
 * このヘルパーと shutdown テストの動作確認を必ず行うこと。
 */
function getTransportChildProcess(
	transport: StdioClientTransport,
): ChildProcess {
	const childProcess = (
		transport as StdioClientTransport & { _process?: ChildProcess }
	)._process;

	if (!childProcess?.pid) {
		throw new Error("transport child process is not available");
	}

	return childProcess;
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

function buildDockerEnvArgs(env?: NodeJS.ProcessEnv): string[] {
	if (!env) {
		return [];
	}

	return Object.entries(env).flatMap(([key, value]) =>
		value === undefined ? [] : ["-e", `${key}=${value}`],
	);
}
