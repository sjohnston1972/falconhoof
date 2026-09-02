#!/usr/bin/env node
// Guards against a specific footgun (issue #7): src/index.ts embeds the
// entire browser UI as JavaScript inside one big template literal called
// INDEX_HTML. A template literal consumes ONE level of backslash escaping
// before the browser ever sees the text — so a regex metacharacter such as
// \b, \s, \w, \d, \n, or \* written with a SINGLE backslash inside that
// literal is silently corrupted (e.g. \b collapses to a literal backspace
// character, not a word-boundary — see issue #1/#5). The fix is always to
// double the backslash (\\b) so a real backslash survives into the served
// page.
//
// This script extracts the INDEX_HTML template literal's literal text
// content (skipping ${...} interpolated expressions, which are ordinary
// TypeScript evaluated once at module load, not text re-parsed by the
// browser) and fails if it finds a run of an ODD number of backslashes
// immediately followed by one of b/s/w/d/n/* — i.e. a single-backslash
// "regex metacharacter" that will NOT survive the literal.
//
// Run: node scripts/check-embedded-regex.mjs   (wired up as `npm run lint:regex`)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_PATH = path.join(__dirname, "..", "src", "index.ts");

// Extract the literal text content of `const INDEX_HTML = \`...\`;`,
// skipping over ${...} interpolations (tracking { } nesting depth so an
// interpolated object/array literal doesn't terminate the scan early).
export function extractIndexHtmlLiteral(source) {
  const marker = "const INDEX_HTML = `";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error("Could not find `const INDEX_HTML = `` in src/index.ts");
  }
  const literalStartIndex = start + marker.length;
  let i = literalStartIndex;
  let out = "";
  let depth = 0; // ${ ... } nesting depth while inside an interpolation

  while (i < source.length) {
    const ch = source[i];
    if (depth === 0) {
      if (ch === "\\") {
        // Preserve escaped-char pairs verbatim so the metacharacter scan
        // below still sees them (this is exactly the text under test).
        out += ch + (source[i + 1] ?? "");
        i += 2;
        continue;
      }
      if (ch === "`") {
        // End of the template literal.
        i++;
        break;
      }
      if (ch === "$" && source[i + 1] === "{") {
        depth = 1;
        i += 2;
        continue;
      }
      out += ch;
      i++;
      continue;
    } else {
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        i++;
        continue;
      }
      i++;
      continue;
    }
  }

  if (depth !== 0) {
    throw new Error("Unbalanced ${...} interpolation while scanning INDEX_HTML — check src/index.ts syntax.");
  }

  return { text: out, literalStartIndex };
}

export function findBrokenEscapes(text) {
  const problems = [];
  const re = /\\+[bswdn*]/g;
  let m;
  while ((m = re.exec(text))) {
    const matched = m[0];
    const backslashCount = matched.length - 1;
    if (backslashCount % 2 === 1) {
      problems.push({ index: m.index, snippet: matched });
    }
  }
  return problems;
}

function lineOf(fullSource, offsetInLiteral, literalStartIndex) {
  const absoluteIndex = literalStartIndex + offsetInLiteral;
  return fullSource.slice(0, absoluteIndex).split("\n").length;
}

function main() {
  const source = readFileSync(SRC_PATH, "utf8");
  const { text, literalStartIndex } = extractIndexHtmlLiteral(source);
  const problems = findBrokenEscapes(text);

  if (problems.length === 0) {
    console.log(
      "check-embedded-regex: OK — no single-backslash regex metacharacters found inside INDEX_HTML."
    );
    return;
  }

  console.error(
    `check-embedded-regex: FAILED — found ${problems.length} single-backslash regex metacharacter(s) inside INDEX_HTML.`
  );
  console.error(
    "A single backslash before b/s/w/d/n/* inside the INDEX_HTML template literal is consumed by"
  );
  console.error(
    "template-literal escaping before the browser ever sees it (e.g. \\b becomes a backspace"
  );
  console.error(
    'character, not a word-boundary). Double the backslash (e.g. "\\\\b") so it survives. See issue #7.'
  );
  console.error("");
  for (const p of problems) {
    const line = lineOf(source, p.index, literalStartIndex);
    console.error(`  src/index.ts:${line} — found "${p.snippet}" (odd number of backslashes before a regex metacharacter)`);
  }
  process.exitCode = 1;
}

main();
