import { describe, expect, test } from "vitest";
import { devErrorTest } from "../../src/tools/devErrorTest.js";

describe("単体: dev-error-test", () => {
	test("引数なしではテスト用デフォルト値の tool error result を返すこと", async () => {
		const result = await devErrorTest();

		expect(result.isError).toBe(true);
		expect(result.structuredContent).toEqual({
			code: -32000,
			message: "Expected test error",
		});
		expect(result.content[0]).toEqual({
			type: "text",
			text: expect.stringContaining("Expected test error"),
		});
	});

	test("code だけを指定した場合は message にデフォルト値を使うこと", async () => {
		const result = await devErrorTest({
			code: -999,
		});

		expect(result.isError).toBe(true);
		expect(result.structuredContent).toEqual({
			code: -999,
			message: "Expected test error",
		});
		expect(result.content[0]).toEqual({
			type: "text",
			text: expect.stringContaining("-999"),
		});
	});

	test("message だけを指定した場合は code にデフォルト値を使うこと", async () => {
		const result = await devErrorTest({
			message: "echo me",
		});

		expect(result.isError).toBe(true);
		expect(result.structuredContent).toEqual({
			code: -32000,
			message: "echo me",
		});
		expect(result.content[0]).toEqual({
			type: "text",
			text: expect.stringContaining("echo me"),
		});
	});

	test("code と message の両方を指定した場合はその値を tool error result に反映すること", async () => {
		const result = await devErrorTest({
			code: -999,
			message: "echo me",
		});

		expect(result.isError).toBe(true);
		expect(result.structuredContent).toEqual({
			code: -999,
			message: "echo me",
		});
		expect(result.content[0]).toEqual({
			type: "text",
			text: expect.stringContaining("echo me"),
		});
	});
});
