import { spawn } from "node:child_process";
import { once } from "node:events";
import { afterEach, describe, expect, test } from "vitest";

const childProcesses: ReturnType<typeof spawn>[] = [];

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
	await Promise.all(
		childProcesses.splice(0).map(async (child) => {
			if (child.exitCode !== null) {
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
});
