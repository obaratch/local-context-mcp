import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
	StdioClientTransport as ClientStdioTransport,
	type StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { VERSION } from "../../src/constants.js";
import {
	buildDockerIntegrationTestImage,
	closeTrackedTransports,
} from "../utils/testUtils.js";

const describeIf =
	process.env.RUN_DOCKER_PERSISTENCE_TESTS === "true"
		? describe
		: describe.skip;

const transports: StdioClientTransport[] = [];
let imageTag = "";
const dockerStoreDir = join(process.cwd(), "data", "docker-store-persistence");

function prepareDockerStoreDir(): string {
	rmSync(dockerStoreDir, {
		force: true,
		recursive: true,
	});
	mkdirSync(dockerStoreDir, {
		recursive: true,
	});

	return dockerStoreDir;
}

async function createDockerStoreClient(
	image: string,
	storeDir: string,
): Promise<Client> {
	const client = new Client(
		{
			name: "docker-store-persistence-test-client",
			version: VERSION,
		},
		{
			capabilities: {},
		},
	);

	const transport = new ClientStdioTransport({
		command: "docker",
		args: [
			"run",
			"-i",
			"--rm",
			"-e",
			"TZ=Asia/Tokyo",
			"-e",
			"ENABLE_DEV_TOOLS=true",
			"-e",
			"LOCAL_CONTEXT_STORE_DIR=/data",
			"-v",
			`${storeDir}:/data`,
			image,
		],
		cwd: process.cwd(),
		stderr: "pipe",
	});

	transports.push(transport);
	await client.connect(transport);

	return client;
}

describeIf("結合: Docker store 永続化", () => {
	beforeAll(() => {
		imageTag = buildDockerIntegrationTestImage();
	}, 60_000);

	afterEach(async () => {
		await closeTrackedTransports(transports);
	});

	test("同じ bind mount 先を再利用すると別コンテナからも保存値を読み出せること", async () => {
		const storeDir = prepareDockerStoreDir();

		const firstClient = await createDockerStoreClient(imageTag, storeDir);
		const setResult = await firstClient.callTool({
			name: "dev-store-set",
			arguments: {
				key: "persisted",
				value: {
					message: "hello from docker",
					ok: true,
				},
			},
		});

		expect(setResult.content).toEqual([{ type: "text", text: "stored" }]);
		expect(setResult.structuredContent).toEqual({
			key: "persisted",
			value: {
				message: "hello from docker",
				ok: true,
			},
		});

		await closeTrackedTransports(transports);

		const secondClient = await createDockerStoreClient(imageTag, storeDir);
		const getResult = await secondClient.callTool({
			name: "dev-store-get",
			arguments: {
				key: "persisted",
			},
		});

		expect(getResult.content).toEqual([{ type: "text", text: "found" }]);
		expect(getResult.structuredContent).toEqual({
			key: "persisted",
			found: true,
			value: {
				message: "hello from docker",
				ok: true,
			},
		});
	}, 60_000);
});
