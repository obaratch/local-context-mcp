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

describe("結合: where-are-we", () => {
	test("GeoIP を使えない場合でも場所文字列を返すこと", async () => {
		const client = await createIntegrationTestClient(transports);

		const result = await client.callTool({
			name: "where-are-we",
			arguments: {},
		});

		expect(result.content[0]).toEqual({
			type: "text",
			text: expect.any(String),
		});
		expect(result.structuredContent).toEqual(
			expect.objectContaining({
				locationText: result.content[0]?.text,
			}),
		);
	});
});
