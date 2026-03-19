import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, test } from "vitest";
import {
	cleanupTrackedTempDirs,
	createTrackedTempDir,
} from "../utils/tempDirUtils.js";
import {
	closeTrackedTransports,
	createIntegrationTestClient,
} from "../utils/testUtils.js";

const transports: StdioClientTransport[] = [];
const tempDirs: string[] = [];

async function createTestStoreDir(): Promise<string> {
	return createTrackedTempDir(tempDirs, "local-context-dev-store-integration-");
}

afterEach(async () => {
	await closeTrackedTransports(transports);
	await cleanupTrackedTempDirs(tempDirs);
});

describe("結合: dev-store-*", () => {
	test("callTool で保存した値を同じサーバプロセスから読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const client = await createIntegrationTestClient(transports, {
			env: {
				ENABLE_DEV_TOOLS: "true",
				LOCAL_CONTEXT_STORE_DIR: storeDir,
			},
		});

		const setResult = await client.callTool({
			name: "dev-store-set",
			arguments: {
				key: "counter",
				value: 42,
			},
		});

		expect(setResult.content).toEqual([{ type: "text", text: "stored" }]);
		expect(setResult.structuredContent).toEqual({
			key: "counter",
			value: 42,
		});

		const getResult = await client.callTool({
			name: "dev-store-get",
			arguments: {
				key: "counter",
			},
		});

		expect(getResult.content).toEqual([{ type: "text", text: "found" }]);
		expect(getResult.structuredContent).toEqual({
			key: "counter",
			found: true,
			value: 42,
		});
	});

	test("callTool で未保存キーを読むと not found を返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const client = await createIntegrationTestClient(transports, {
			env: {
				ENABLE_DEV_TOOLS: "true",
				LOCAL_CONTEXT_STORE_DIR: storeDir,
			},
		});

		const result = await client.callTool({
			name: "dev-store-get",
			arguments: {
				key: "missing-key",
			},
		});

		expect(result.content).toEqual([{ type: "text", text: "not found" }]);
		expect(result.structuredContent).toEqual({
			key: "missing-key",
			found: false,
		});
	});
});
