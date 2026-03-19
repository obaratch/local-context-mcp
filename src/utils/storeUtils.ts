import Conf from "conf";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
	| JsonPrimitive
	| JsonValue[]
	| { [key: string]: JsonValue };
export type StoreValue = JsonValue;

type StoreData = Record<string, StoreValue>;

let store: Conf<StoreData> | undefined;

function createStore(): Conf<StoreData> {
	return new Conf<StoreData>({
		projectName: "local-context-mcp",
		configName: "store",
		cwd: process.env.LOCAL_CONTEXT_STORE_DIR ?? undefined,
	});
}

function getStore(): Conf<StoreData> {
	store ??= createStore();

	return store;
}

export function getValue(key: string): StoreValue | undefined {
	return getStore().get(key);
}

export function setValue(key: string, value: StoreValue): void {
	getStore().set(key, value);
}

export function deleteKey(key: string): void {
	getStore().delete(key);
}

/**
 * 単体テストでシングルトン状態を初期化するためのテスト専用 API。
 */
export function resetStoreForTest(): void {
	store = undefined;
}
