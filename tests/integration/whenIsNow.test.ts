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

describe("結合: when-is-now", () => {
	test("TZ が明示されている場合はそのタイムゾーンで現在日時を返すこと", async () => {
		const client = await createIntegrationTestClient(transports, {
			env: { TZ: "Asia/Tokyo" },
		});

		const result = await client.callTool({
			name: "when-is-now",
			arguments: {},
		});
		const content = result.content[0];

		expect(content).toEqual({
			type: "text",
			text: expect.stringMatching(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
			),
		});
		expect(result.structuredContent).toEqual({
			now: content.text,
			timezone: "Asia/Tokyo",
		});
	});
});
