import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function createTrackedTempDir(
	tempDirs: string[],
	prefix: string,
): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), prefix));
	tempDirs.push(directory);

	return directory;
}

export async function cleanupTrackedTempDirs(
	tempDirs: string[],
): Promise<void> {
	await Promise.all(
		tempDirs.splice(0).map((dir) =>
			rm(dir, {
				force: true,
				recursive: true,
			}),
		),
	);
}
