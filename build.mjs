/**
 * Build lib/client.js from src/.
 *
 * The stylesheet lives in its own file so it can be edited with syntax
 * highlighting, and the build injects it as a JSON string literal.
 * JSON.stringify is deliberate: it escapes backticks, ${ } and quotes on its
 * own, so the CSS can never terminate the surrounding JavaScript by accident.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(root, "src", "mobile.css"), "utf8");
const template = readFileSync(join(root, "src", "client.js"), "utf8");

if (!template.includes("__MOBILE_CSS__")) {
  throw new Error("src/client.js: __MOBILE_CSS__ placeholder is missing");
}

/* the replacer function keeps $& / $1 sequences inside the CSS from being
   interpreted as replacement patterns */
const out = template.replace("__MOBILE_CSS__", () => JSON.stringify(css));

mkdirSync(join(root, "lib"), { recursive: true });
writeFileSync(join(root, "lib", "client.js"), out);
console.log(`built lib/client.js  css=${css.length}B  out=${out.length}B`);
