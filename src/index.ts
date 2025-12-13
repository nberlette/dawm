// @ts-types="./wasm/index.d.ts"
import * as dawm from "./wasm/index.js";

export * from "./serialize.ts";
export * from "./dom.ts";
export * from "./types.ts";
export * from "./parse.ts";
export * from "./guards.ts";
export * from "./collections.ts";
export * from "./options.ts";
export * from "./tree.ts";
export * from "./wire.ts";

export { dawm };

// circular default export for compatibility with CJS conventions
export * as default from "./index.ts";
