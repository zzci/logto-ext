import { activeVersion } from "../lode/sdk";

// Inlined by scripts/package.ts (`--define`); absent when run from source.
declare const BUILD_VERSION: string | undefined;

const baked = typeof BUILD_VERSION === "string" ? BUILD_VERSION : "0.0.0-dev";

// lode's LODE_ACTIVE_VERSION wins so the reported version matches what lode installed.
export const VERSION = activeVersion() ?? baked;
