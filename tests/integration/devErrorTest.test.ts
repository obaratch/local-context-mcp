import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, test } from "vitest";
import {
	closeTrackedTransports,
	createIntegrationTestClient,
} from "../utils/testUtils.js";

const transports: StdioClientTransport[] = [];

afterEach(async () => {
	await closeTrackedTransports(transports);
});

describe("結合: dev-error-test", () => {
	test("callTool で message を上書きした tool error result を返すこと", async () => {
		const client = await createIntegrationTestClient(transports);

		const result = await client.callTool({
			name: "dev-error-test",
			arguments: {
				message: "echo me",
			},
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
});
