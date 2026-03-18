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

describe("結合: dev-helloworld", () => {
	test("callTool でメインメッセージとして hello world を返すこと", async () => {
		const client = await createIntegrationTestClient(transports);

		const result = await client.callTool({
			name: "dev-helloworld",
			arguments: {},
		});

		expect(result.content).toEqual([
			{
				type: "text",
				text: "hello world",
			},
		]);
	});
});
