import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { once } from "node:events";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, test } from "vitest";
import {
	closeTrackedTransports,
	createIntegrationTestClient,
} from "../utils/testUtils.js";

const childProcesses: ChildProcess[] = [];
const transports: StdioClientTransport[] = [];

async function waitForExit(child: ChildProcess): Promise<number | null> {
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

function getTransportChildProcess(
	transport: StdioClientTransport,
): ChildProcess {
	const child = (
		transport as StdioClientTransport & { _process?: ChildProcess }
	)._process;

	if (!child?.pid) {
		throw new Error("transport child process is not available");
	}

	return child;
}

afterEach(async () => {
	await closeTrackedTransports(transports);
	await Promise.all(
		childProcesses.splice(0).map(async (child) => {
			if (child.exitCode !== null || child.signalCode !== null) {
				return;
			}

			child.kill("SIGKILL");
			await once(child, "exit");
		}),
	);
});

describe("結合: 終了処理", () => {
	test("stdin が閉じられたら短時間で終了すること", async () => {
		const child = spawn(process.execPath, ["dist/index.js"], {
			cwd: process.cwd(),
			stdio: ["pipe", "pipe", "pipe"],
		});

		childProcesses.push(child);
		child.stdin.end();

		await expect(waitForExit(child)).resolves.toBe(0);
	});

	test("connect 後に SIGTERM を受けたら短時間で終了すること", async () => {
		const client = await createIntegrationTestClient(transports);
		await expect(client.ping()).resolves.toEqual({});

		const transport = transports.at(-1);
		if (!transport) {
			throw new Error("tracked transport is not available");
		}

		const child = getTransportChildProcess(transport);
		childProcesses.push(child);
		child.kill("SIGTERM");

		await expect(waitForExit(child)).resolves.toBe(0);
	});
});
