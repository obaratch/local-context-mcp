import { spawn } from "node:child_process";
import { once } from "node:events";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, test } from "vitest";
import {
	closeTrackedTransports,
	createTrackedIntegrationTestClient,
} from "../utils/testUtils.js";

const transports: StdioClientTransport[] = [];

async function waitForExit(
	child: ReturnType<typeof spawn>,
): Promise<number | null> {
	const timer = setTimeout(() => {
		child.kill("SIGKILL");
	}, 3_000);

	try {
		const [code] = await once(child, "exit");
		return code as number | null;
	} finally {
		clearTimeout(timer);
	}
}

afterEach(async () => {
	await closeTrackedTransports(transports);
});

describe("結合: 終了処理", () => {
	test("stdin が閉じられたら短時間で終了すること", async () => {
		const child = spawn(process.execPath, ["dist/index.js"], {
			cwd: process.cwd(),
			stdio: ["pipe", "pipe", "pipe"],
		});
		child.stdin.end();

		await expect(waitForExit(child)).resolves.toBe(0);
	});

	test("connect 後に SIGTERM を受けたら短時間で終了すること", async () => {
		const { client, process: child } =
			await createTrackedIntegrationTestClient(transports);
		await expect(client.ping()).resolves.toEqual({});

		child.kill("SIGTERM");
		await expect(waitForExit(child)).resolves.toBe(0);
	});
});
