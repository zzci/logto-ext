#!/usr/bin/env bun
/**
 * Build the lode release asset: dist/logto-ext.tar.gz
 *
 *   index.js      the server, bundled into one file (no node_modules needed)
 *   public/       the built user account SPA
 *   package.json  name/version + `start` script
 *
 * lode downloads the asset, verifies it, and runs `bun index.js` in the version dir.
 *
 * Usage: bun scripts/package.ts [--version <v>]
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const ASSET_NAME = "logto-ext.tar.gz"; // lode selection key ([update].asset) — keep version-free

const { values: args } = parseArgs({ options: { version: { type: "string" } } });

const ROOT = resolve(import.meta.dir, "..");
const DIST = resolve(ROOT, "dist");
const STAGE = resolve(DIST, "package");
const WEB_DIST = resolve(ROOT, "frontend/dist");

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8")) as { name: string; version: string };
const version = args.version ?? process.env.RELEASE_VERSION ?? pkg.version;

async function run(cmd: string[], cwd = ROOT): Promise<void> {
  console.log(`[package] ${cmd.join(" ")}`);
  const code = await Bun.spawn(cmd, { cwd, stdio: ["inherit", "inherit", "inherit"] }).exited;
  if (code !== 0) throw new Error(`command failed (${code}): ${cmd.join(" ")}`);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });

await run(["bun", "run", "build"], resolve(ROOT, "frontend"));
if (!existsSync(resolve(WEB_DIST, "index.html"))) throw new Error("frontend build produced no index.html");

const result = await Bun.build({
  entrypoints: [resolve(ROOT, "app/index.ts")],
  outdir: STAGE,
  target: "bun",
  minify: true,
  define: { BUILD_VERSION: JSON.stringify(version) },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

cpSync(WEB_DIST, resolve(STAGE, "public"), { recursive: true });
await Bun.write(
  resolve(STAGE, "package.json"),
  `${JSON.stringify({ name: pkg.name, version, private: true, type: "module", scripts: { start: "bun index.js" } }, null, 2)}\n`,
);

const assetPath = resolve(DIST, ASSET_NAME);
await run(["tar", "-czf", assetPath, "-C", STAGE, "."]);

const hasher = new Bun.CryptoHasher("sha256");
hasher.update(await Bun.file(assetPath).arrayBuffer());
const sha256 = hasher.digest("hex");
await Bun.write(resolve(DIST, "checksums.txt"), `${sha256}  ${ASSET_NAME}\n`);

console.log(`[package] ${assetPath} (version ${version})`);
console.log(`[package] sha256 ${sha256}`);
