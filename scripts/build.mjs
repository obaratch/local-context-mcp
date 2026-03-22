import { mkdirSync, rmSync } from "node:fs";
import { build } from "esbuild";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

await build({
	entryPoints: ["src/index.ts"],
	outdir: "dist",
	bundle: true,
	format: "esm",
	platform: "node",
	target: "node24",
	minify: true,
	legalComments: "none",
	splitting: true,
});
