import { VERSION } from "./utils/version";

// `bun index.js version` (also `lode version` passthrough) prints the version
// without requiring the server env to be configured.
if (["version", "--version", "-v"].includes(process.argv[2] ?? "")) {
  console.log(VERSION);
  process.exit(0);
}

await import("./server");
