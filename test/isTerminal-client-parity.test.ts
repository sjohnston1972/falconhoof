import { beforeAll, describe, expect, it } from "vitest";
import { isTerminal as serverIsTerminal } from "../src/index";
import {
  extractClientIsTerminal,
  fetchIndexHtml,
  type ClientIsTerminal,
} from "./helpers/embeddedClient";

// Regression guard for issue #6/#7: the client's isTerminal(), embedded
// inside the INDEX_HTML template literal, used to hand-type its own \b
// regexes. Inside a TS template literal a single backslash in `\b` is not
// a raw backslash — it must be written `\\b` so the *emitted* JS source
// contains `\b`. The old code wrote a single backslash, which (depending
// on the exact literal) either produced a literal backspace control
// character or otherwise failed to compile into a working word-boundary
// regex, so death-drift detection silently never matched in the browser
// even though the server-side equivalent worked. Re-typing "corrected"
// regex source directly into a test would not catch a regression here —
// only exercising the bytes actually served to the browser would. See
// test/helpers/embeddedClient.ts for how those bytes are extracted.
describe("isTerminal: client (embedded in served INDEX_HTML) vs server parity", () => {
  let clientIsTerminal: ClientIsTerminal;

  beforeAll(async () => {
    const html = await fetchIndexHtml();
    clientIsTerminal = extractClientIsTerminal(html);
  });

  const corpus: string[] = [
    "Falconhoof: You are dead.",
    "Game over.",
    "you ARE dead.",
    "You have died",
    "Alas, you perish in the dark.",
    "You have perished.",
    "Your quest ends here, caller.",
    "Your adventure is over.",
    "Your journey has ended.",
    "You have fallen at the gate.",
    "You have been slain by the ogre.",
    "» start a new adventure",
    "» begin again",
    "» try another call",
    "» fight on\n» start a new adventure",
    "You step into the tavern and order an ale.",
    "The corridor stretches on, dead quiet.",
    "» search the room\n» open the door",
    "The deadbolt on the door is rusted shut.",
    "you have diedown from exhaustion",
  ];

  it("agrees with the server's isTerminal() on every case in the shared corpus", () => {
    for (const text of corpus) {
      expect(clientIsTerminal(text), `mismatch for: ${JSON.stringify(text)}`).toBe(
        serverIsTerminal(text)
      );
    }
  });

  it("both recognise the drift phrase 'You have died' as terminal (the bug this guards against)", () => {
    expect(serverIsTerminal("You have died")).toBe(true);
    expect(clientIsTerminal("You have died")).toBe(true);
  });

  it("both leave ordinary narration non-terminal", () => {
    expect(serverIsTerminal("You step into the tavern.")).toBe(false);
    expect(clientIsTerminal("You step into the tavern.")).toBe(false);
  });
});
