// Extracts and evaluates the ACTUAL client-side isTerminal() implementation
// as it is served to the browser inside the INDEX_HTML template literal in
// src/index.ts — not a hand-copied re-implementation.
//
// Why: issue #6/#7 was exactly a hand-maintained client copy silently
// diverging from the server (double-escaped \\b regexes that collapsed to
// literal backspace characters and never matched). A test that re-types the
// client logic would never have caught that class of bug. Instead we drive
// the worker's real GET / handler (which returns INDEX_HTML verbatim, no
// AI binding required), pull the exact <script> source for isTerminal() and
// its two supporting consts out of the response body, and eval that source
// so the test exercises the bytes that actually ship to the browser.
import app, { type Env } from "../../src/index";

export type ClientIsTerminal = (text: string) => boolean;

export async function fetchIndexHtml(): Promise<string> {
  const res = await app.fetch(new Request("http://localhost/"), {} as Env);
  return res.text();
}

// Pulls matching braces starting at the first "{" at or after `fromIndex`.
function extractBalancedBraces(source: string, fromIndex: number): string {
  const start = source.indexOf("{", fromIndex);
  if (start === -1) {
    throw new Error("extractBalancedBraces: no opening brace found");
  }
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(fromIndex, i + 1);
    }
  }
  throw new Error("extractBalancedBraces: unbalanced braces");
}

export function extractClientIsTerminal(html: string): ClientIsTerminal {
  const constsMatch = html.match(
    /const DEATH_PHRASES_EXACT = (\[[\s\S]*?\]);\s*\n\s*const DEATH_DRIFT_RE = (\/[\s\S]*?\/[a-z]*);/
  );
  if (!constsMatch) {
    throw new Error(
      "Could not find embedded DEATH_PHRASES_EXACT / DEATH_DRIFT_RE consts in served INDEX_HTML"
    );
  }
  const constsSrc = constsMatch[0];

  const fnMarker = "function isTerminal(text) {";
  const fnStart = html.indexOf(fnMarker);
  if (fnStart === -1) {
    throw new Error("Could not find embedded function isTerminal(text) { ... } in served INDEX_HTML");
  }
  const fnSrc = "function isTerminal(text) " + extractBalancedBraces(html, fnStart + fnMarker.length - 1);

  const factory = new Function(`${constsSrc}\n${fnSrc}\nreturn isTerminal;`);
  return factory() as ClientIsTerminal;
}
