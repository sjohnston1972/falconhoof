import { describe, expect, it } from "vitest";
import { cleanChoiceLine, isChoiceLike, parseChoices } from "../src/index";

describe("parseChoices", () => {
  it("parses a well-formed <choices> tag block", () => {
    const text =
      'Falconhoof: You reach the crossroads.\n<choices>\n» Take the left path\n» Take the right path\n</choices>';
    expect(parseChoices(text)).toEqual(["Take the left path", "Take the right path"]);
  });

  it("tolerates the mangled <hoices> (missing leading c) tag variant", () => {
    const text = 'Falconhoof: You reach the crossroads.\n<hoices>\n» Search the alcove\n</hoices>';
    expect(parseChoices(text)).toEqual(["Search the alcove"]);
  });

  it("tolerates a singular <choice> tag variant", () => {
    const text = '<choice>\n» Knock on the door\n</choice>';
    expect(parseChoices(text)).toEqual(["Knock on the door"]);
  });

  it("falls back to trailing »-prefixed lines when there is no tag block", () => {
    const text = "Falconhoof: The corridor forks ahead.\n» Go left\n» Go right\n» Wait and listen";
    expect(parseChoices(text)).toEqual(["Go left", "Go right", "Wait and listen"]);
  });

  it("stops collecting »-lines once a non-choice line breaks the trailing run", () => {
    const text = "» Go left\nFalconhoof: interrupting narration\n» Go right";
    // Walking from the bottom, "Go right" is collected, then the narration
    // line breaks the run, so the earlier "Go left" is never reached.
    expect(parseChoices(text)).toEqual(["Go right"]);
  });

  it("returns no more than 6 choices even when more are offered", () => {
    const lines = Array.from({ length: 8 }, (_, i) => `» Option ${i + 1}`).join("\n");
    const result = parseChoices(lines);
    expect(result).toHaveLength(6);
    expect(result).toEqual(["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"]);
  });

  it("returns an empty array when there is nothing choice-shaped", () => {
    expect(parseChoices("Falconhoof: just narration, no choices at all.")).toEqual([]);
  });
});

describe("cleanChoiceLine", () => {
  it("strips the » marker and surrounding whitespace", () => {
    expect(cleanChoiceLine("  » Open the door  ")).toBe("Open the door");
  });

  it("strips alternative leading markers (>>, -, *, •, numbered)", () => {
    expect(cleanChoiceLine(">> Wait here")).toBe("Wait here");
    expect(cleanChoiceLine("- Flee the scene")).toBe("Flee the scene");
    expect(cleanChoiceLine("1. Search the room")).toBe("Search the room");
    expect(cleanChoiceLine("• Listen at the door")).toBe("Listen at the door");
  });

  it("strips a trailing stray tag fragment", () => {
    expect(cleanChoiceLine("Open the door</choices>")).toBe("Open the door");
  });
});

describe("isChoiceLike", () => {
  it("accepts an ordinary short line", () => {
    expect(isChoiceLike("Open the door")).toBe(true);
  });

  it("rejects an empty or whitespace-only line", () => {
    expect(isChoiceLike("")).toBe(false);
    expect(isChoiceLike("   ")).toBe(false);
  });

  it("rejects a line that is itself a tag fragment", () => {
    expect(isChoiceLike("<choices>")).toBe(false);
    expect(isChoiceLike("choices")).toBe(false);
    expect(isChoiceLike("hoices>")).toBe(false);
  });

  it("rejects an overlong line", () => {
    expect(isChoiceLike("x".repeat(140))).toBe(false);
    expect(isChoiceLike("x".repeat(139))).toBe(true);
  });
});
