import "reflect-metadata";
import fs from "fs";
import path from "path";

/**
 * Static guard: scans every package's `src` (excluding tests) for **executable** uses of
 * CommonJS-only globals — `__dirname`, `__filename`, and `import.meta` — that break in a
 * bundled-ESM runtime. `__dirname`/`__filename` are undefined in ESM (`ReferenceError` when read
 * bare); a literal `import.meta` is a syntax error the instant a file loads as CommonJS. Any of
 * them reached during DI construction crashes an ESM-bundled app at kernel start, so this guard
 * fails the build before such code can ship.
 *
 * The only sanctioned use is a `typeof`-guarded read (`typeof __dirname !== "undefined" ? ...`);
 * those lines are allowed. Comments and string literals are stripped before scanning, so
 * documentation or messages that merely mention these tokens do not trip the guard.
 */

/** Walk up from this test file to the monorepo root (the directory that contains `packages/`). */
const findRepoRoot = (): string => {
  let dir = __dirname;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, "packages")) && fs.existsSync(path.join(dir, "lerna.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not locate the monorepo root from " + __dirname);
};

/** Remove comments and blank the interior of string/template literals so only real code remains. */
const stripCommentsAndStrings = (source: string): string => {
  let out = "";
  let i = 0;
  const n = source.length;
  let state: "code" | "line" | "block" | "string" = "code";
  let quote = "";
  while (i < n) {
    const c = source[i];
    const c2 = i + 1 < n ? source[i + 1] : "";
    if (state === "line") {
      if (c === "\n") { state = "code"; out += c; }
      i++;
      continue;
    }
    if (state === "block") {
      if (c === "*" && c2 === "/") { state = "code"; i += 2; } else { if (c === "\n") out += c; i++; }
      continue;
    }
    if (state === "string") {
      if (c === "\\") { i += 2; continue; }
      if (c === quote) { state = "code"; out += quote; i++; continue; }
      if (c === "\n") out += c; // preserve line count
      i++;
      continue;
    }
    // state === "code"
    if (c === "/" && c2 === "/") { state = "line"; i += 2; continue; }
    if (c === "/" && c2 === "*") { state = "block"; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") { state = "string"; quote = c; out += c; i++; continue; }
    out += c;
    i++;
  }
  return out;
};

/** Recursively collect non-test `.ts` files under a directory. */
const collectSourceFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "generated") continue;
      files.push(...collectSourceFiles(full));
    } else if (entry.name.endsWith(".ts") && !/\.(spec|test)\.ts$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

interface Violation {
  file: string;
  line: number;
  token: string;
  text: string;
}

const scanFile = (file: string): Violation[] => {
  const code = stripCommentsAndStrings(fs.readFileSync(file, "utf8"));
  const violations: Violation[] = [];
  code.split("\n").forEach((line, index) => {
    // A `typeof`-guarded read of the CJS globals is the sanctioned pattern — allow the whole line.
    const guarded = /typeof\s+(__dirname|__filename)/.test(line);
    for (const token of ["__dirname", "__filename", "import.meta"]) {
      if (!line.includes(token)) continue;
      if (guarded && (token === "__dirname" || token === "__filename")) continue;
      violations.push({file, line: index + 1, token, text: line.trim()});
    }
  });
  return violations;
};

describe("ESM-safety guard: no unguarded CommonJS-only globals in package sources", () => {
  it("has no bare __dirname/__filename/import.meta in any packages/*/src (outside typeof guards)", () => {
    const repoRoot = findRepoRoot();
    const packagesDir = path.join(repoRoot, "packages");
    const packages = fs.readdirSync(packagesDir, {withFileTypes: true})
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(packagesDir, entry.name, "src"))
      .filter(srcDir => fs.existsSync(srcDir));

    const violations = packages.flatMap(collectSourceFiles).flatMap(scanFile);

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${path.relative(repoRoot, v.file)}:${v.line}  [${v.token}]  ${v.text}`)
        .join("\n");
      throw new Error(
        "Found unguarded CommonJS-only global(s) that break in bundled-ESM runtimes.\n" +
        "Use a `typeof __dirname !== \"undefined\"` guard, or a build-time constant (see " +
        "scripts/generate-version.mjs) instead:\n" + report,
      );
    }

    expect(violations).toEqual([]);
  });
});
