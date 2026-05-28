// Copy bundled mock JSON into the compiled output so the server can read it at
// runtime. tsc does not emit non-TS assets, so we mirror src/mocks → dist/src/mocks.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/src", { recursive: true });
cpSync("src/mocks", "dist/src/mocks", { recursive: true });
console.log("Copied src/mocks → dist/src/mocks");
