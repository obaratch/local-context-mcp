import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import {
	buildDockerIntegrationTestImage,
	closeTrackedTransports,
	createDockerIntegrationTestClient,
} from "../utils/testUtils.js";

const transports: StdioClientTransport[] = [];

let imageTag = "";

beforeAll(() => {
	imageTag = buildDockerIntegrationTestImage();
}, 60_000);

afterEach(async () => {
	await closeTrackedTransports(transports);
});

describe("結合: Docker サーバ起動", () => {
	test("一般利用向けの Docker 起動では tools/list に dev-* が含まれないこと", async () => {
		const client = await createDockerIntegrationTestClient(
			transports,
			imageTag,
		);

		const result = await client.listTools();

		expect(result.tools).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "when-is-now",
				}),
			]),
		);
		expect(result.tools).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "dev-helloworld",
				}),
				expect.objectContaining({
					name: "dev-error-test",
				}),
				expect.objectContaining({
					name: "dev-store-set",
				}),
				expect.objectContaining({
					name: "dev-store-get",
				}),
			]),
		);
	}, 60_000);
});
