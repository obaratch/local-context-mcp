import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type StoreUtilsModule = {
	getValue: (key: string) => JsonValue | undefined;
	setValue: (key: string, value: JsonValue) => void;
	deleteKey: (key: string) => void;
	resetStoreForTest: () => void;
};

const originalStoreDir = process.env.LOCAL_CONTEXT_STORE_DIR;
const tempDirs: string[] = [];

async function createTestStoreDir(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "local-context-store-test-"));
	tempDirs.push(directory);

	return directory;
}

async function loadStoreUtils(storeDir: string): Promise<StoreUtilsModule> {
	process.env.LOCAL_CONTEXT_STORE_DIR = storeDir;
	vi.resetModules();

	return (await import(
		new URL("../../src/utils/storeUtils.js", import.meta.url).href
	)) as StoreUtilsModule;
}

beforeEach(() => {
	vi.resetModules();
});

afterEach(async () => {
	if (originalStoreDir === undefined) {
		delete process.env.LOCAL_CONTEXT_STORE_DIR;
	} else {
		process.env.LOCAL_CONTEXT_STORE_DIR = originalStoreDir;
	}
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

describe.sequential("単体: storeUtils", () => {
	test("string を保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("greeting", "hello");

		expect(store.getValue("greeting")).toBe("hello");
	});

	test("number を保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("count", 42);

		expect(store.getValue("count")).toBe(42);
	});

	test("boolean を保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("enabled", true);

		expect(store.getValue("enabled")).toBe(true);
	});

	test("null を JSON 値として保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("nullable", null);

		expect(store.getValue("nullable")).toBeNull();
	});

	test("ドットを含むキーを文字列キーとして保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("time.zone", "Asia/Tokyo");

		expect(store.getValue("time.zone")).toBe("Asia/Tokyo");
		expect(store.getValue("time")).toBeUndefined();
	});

	test("primitive 配列を保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("labels", ["alpha", "beta"]);
		store.setValue("scores", [1, 2, 3]);
		store.setValue("flags", [true, false, true]);

		expect(store.getValue("labels")).toEqual(["alpha", "beta"]);
		expect(store.getValue("scores")).toEqual([1, 2, 3]);
		expect(store.getValue("flags")).toEqual([true, false, true]);
	});

	test("object を JSON 値として保存して読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("profile", {
			name: "takashi",
			active: true,
			count: 3,
			tags: ["dev", "test"],
			nested: {
				flag: false,
			},
		});

		expect(store.getValue("profile")).toEqual({
			name: "takashi",
			active: true,
			count: 3,
			tags: ["dev", "test"],
			nested: {
				flag: false,
			},
		});
	});

	test("未保存キーの読み出しでは undefined を返すこと", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();

		expect(store.getValue("missing-key")).toBeUndefined();
	});

	test("deleteKey で保存済みキーを削除できること", async () => {
		const storeDir = await createTestStoreDir();
		const store = await loadStoreUtils(storeDir);

		store.resetStoreForTest();
		store.setValue("temporary", "value");
		store.deleteKey("temporary");

		expect(store.getValue("temporary")).toBeUndefined();
	});

	test("同じ保存先を再利用するとモジュール再読込後も値を読み出せること", async () => {
		const storeDir = await createTestStoreDir();
		const firstStore = await loadStoreUtils(storeDir);

		firstStore.resetStoreForTest();
		firstStore.setValue("persisted", {
			message: "stored once",
			ok: true,
		});

		const secondStore = await loadStoreUtils(storeDir);

		expect(secondStore.getValue("persisted")).toEqual({
			message: "stored once",
			ok: true,
		});
	});
});
