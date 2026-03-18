import { describe, expect, test } from "vitest";
import { devHelloworld } from "../../src/tools/devHelloworld.js";

describe("単体: dev-helloworld", () => {
	test("メインメッセージとして hello world を返すこと", async () => {
		const result = await devHelloworld();
		expect(result.content[0]).toEqual({ type: "text", text: "hello world" });
	});

	test("不要な入力があってもメインメッセージとして hello world を返すこと", async () => {
		const result = await devHelloworld({ any: "value" });
		expect(result.content[0]).toEqual({ type: "text", text: "hello world" });
	});
});
