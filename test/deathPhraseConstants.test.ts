import { describe, expect, it } from "vitest";
import {
  CHOICE_LINE,
  DEATH_DRIFT_RE,
  DEATH_PHRASES_EXACT,
  TAG_BLOCK,
  TAG_OPEN,
} from "../src/index";

describe("DEATH_PHRASES_EXACT / DEATH_DRIFT_RE (shared death-phrase data)", () => {
  it("lists exactly the two canonical prescribed death phrases", () => {
    expect(DEATH_PHRASES_EXACT).toEqual(["You are dead.", "Game over."]);
  });

  it("DEATH_DRIFT_RE matches drift wording case-insensitively with word boundaries", () => {
    expect(DEATH_DRIFT_RE.test("You have died")).toBe(true);
    expect(DEATH_DRIFT_RE.test("you have DIED")).toBe(true);
    expect(DEATH_DRIFT_RE.test("your journey has ended")).toBe(true);
    // Word-boundary wrapped: a run-on word containing the fragment as a
    // substring (not a whole-word match) must not trigger it.
    expect(DEATH_DRIFT_RE.test("you have diedown from exhaustion")).toBe(false);
    expect(DEATH_DRIFT_RE.test("nothing to see here")).toBe(false);
  });
});

describe("CHOICE_LINE / TAG_BLOCK / TAG_OPEN", () => {
  it("CHOICE_LINE matches a »-prefixed line and captures the choice text", () => {
    const m = "  » Open the door  ".match(CHOICE_LINE);
    expect(m?.[1]).toBe("Open the door");
  });

  it("CHOICE_LINE does not match a plain narration line", () => {
    expect(CHOICE_LINE.test("Falconhoof: You open the door.")).toBe(false);
  });

  it("TAG_OPEN matches choices/hoices tag variants, open or close", () => {
    expect(TAG_OPEN.test("<choices>")).toBe(true);
    expect(TAG_OPEN.test("</choices>")).toBe(true);
    expect(TAG_OPEN.test("<hoices>")).toBe(true);
    expect(TAG_OPEN.test("<choice>")).toBe(true);
    expect(TAG_OPEN.test("plain text")).toBe(false);
  });

  it("TAG_BLOCK matches from a tag marker to the end of the string", () => {
    const text = "Falconhoof: narration.\n<choices>\n» a\n» b\n</choices>";
    const m = text.match(TAG_BLOCK);
    expect(m?.[0]).toBe("<choices>\n» a\n» b\n</choices>");
  });
});
