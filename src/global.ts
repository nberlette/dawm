/**
 * This module exposes the `@nick/dawm` library on the global scope. It is
 * primarily intended for use in environments where ES module imports are not
 * supported, such as traditional web browsers. By including this script via a
 * `<script>` tag, developers can access the `dawm` functionalities globally
 * without the need for module imports.
 *
 * @example
 * ```html
 * <script src="https://esm.sh/jsr/@nick/dawm/global.js?bundle"></script>
 * <script>
 *   const doc = dawm.parseFragment("<div>Hello, world!</div>", "body");
 *   console.log(doc.body.firstChild.textContent); // "Hello, world!"
 * </script>
 * ```
 * @module global
 */
import * as $dawm from "@nick/dawm";

declare global {
  // deno-lint-ignore no-var
  export var dawm: dawm;
  export type dawm = typeof $dawm;
}

// @ts-ignore -- @nick/dawm global export
globalThis.dawm = $dawm;
