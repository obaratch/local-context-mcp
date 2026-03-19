import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type DevStoreSetParams = {
	key: string;
	value: JsonValue;
};

type DevStoreGetParams = {
	key: string;
};

type DevStoreModule = {
	devStoreSet: (params: DevStoreSetParams) => Promise<{
		content: [{ type: "text"; text: "stored" }];
		structuredContent: {
			key: string;
			value: JsonValue;
		};
	}>;
	devStoreGet: (params: DevStoreGetParams) => Promise<{
		content: [{ type: "text"; text: "found" | "not found" }];
		structuredContent:
			| {
					key: string;
					found: true;
					value: JsonValue;
			  }
			| {
					key: string;
					found: false;
			  };
	}>;
	resetStoreForTest: () => void;
};

const originalStoreDir = process.env.LOCAL_CONTEXT_STORE_DIR;
const tempDirs: string[] = [];

async function createTestStoreDir(): Promise<string> {
	const directory = await mkdtemp(
		join(tmpdir(), "local-context-dev-store-test-"),
	);
	tempDirs.push(directory);

	return directory;
}

async function loadDevStoreModule(storeDir: string): Promise<DevStoreModule> {
	process.env.LOCAL_CONTEXT_STORE_DIR = storeDir;
	vi.resetModules();

	const setModule = await import(
		new URL("../../src/tools/devStoreSet.js", import.meta.url).href
	);
	const getModule = await import(
		new URL("../../src/tools/devStoreGet.js", import.meta.url).href
	);
	const storeModule = await import(
		new URL("../../src/utils/storeUtils.js", import.meta.url).href
	);

	return {
		devStoreSet: setModule.devStoreSet,
		devStoreGet: getModule.devStoreGet,
		resetStoreForTest: storeModule.resetStoreForTest,
	};
}

beforeEach(() => {
	vi.resetModules();
});

afterEach(async () => {
	process.env.LOCAL_CONTEXT_STORE_DIR = originalStoreDir;
	vi.resetModules();

	await Promise.all(
		tempDirs.splice(0).map(async (dir) =>
			rm(dir, {
				force: true,
				recursive: true,
			}),
		),
	);
});

describe.sequential("単体: dev-store-*", () => {
	test("dev-store-set は stored と保存値を返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const tools = await loadDevStoreModule(storeDir);

		tools.resetStoreForTest();
		const result = await tools.devStoreSet({
			key: "profile",
			value: {
				name: "takashi",
				active: true,
			},
		});

		expect(result.content).toEqual([{ type: "text", text: "stored" }]);
		expect(result.structuredContent).toEqual({
			key: "profile",
			value: {
				name: "takashi",
				active: true,
			},
		});
	});

	test("dev-store-get は保存済みキーで found と値を返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const tools = await loadDevStoreModule(storeDir);

		tools.resetStoreForTest();
		await tools.devStoreSet({
			key: "flags",
			value: [true, false, true],
		});

		const result = await tools.devStoreGet({
			key: "flags",
		});

		expect(result.content).toEqual([{ type: "text", text: "found" }]);
		expect(result.structuredContent).toEqual({
			key: "flags",
			found: true,
			value: [true, false, true],
		});
	});

	test("dev-store-get は未保存キーで not found を返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const tools = await loadDevStoreModule(storeDir);

		tools.resetStoreForTest();
		const result = await tools.devStoreGet({
			key: "missing-key",
		});

		expect(result.content).toEqual([{ type: "text", text: "not found" }]);
		expect(result.structuredContent).toEqual({
			key: "missing-key",
			found: false,
		});
	});

	test("dev-store-set と dev-store-get は null を JSON 値として扱えること", async () => {
		const storeDir = await createTestStoreDir();
		const tools = await loadDevStoreModule(storeDir);

		tools.resetStoreForTest();
		const setResult = await tools.devStoreSet({
			key: "nullable",
			value: null,
		});
		const getResult = await tools.devStoreGet({
			key: "nullable",
		});

		expect(setResult.structuredContent).toEqual({
			key: "nullable",
			value: null,
		});
		expect(getResult.content).toEqual([{ type: "text", text: "found" }]);
		expect(getResult.structuredContent).toEqual({
			key: "nullable",
			found: true,
			value: null,
		});
	});
});
