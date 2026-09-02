import { describe, expect, it } from "vitest";
import { detectPerilMarker, stripPerilMarker } from "../src/index";

describe("detectPerilMarker", () => {
  it("detects a trailing [peril] marker on its own line", () => {
    expect(
      detectPerilMarker(
        "Falconhoof: The world tips sideways.\n\n» steady yourself\n» cry out\n\n[peril]"
      )
    ).toBe(true);
  });

  it("detects the marker even with surrounding whitespace", () => {
    expect(detectPerilMarker("Some narration.\n   [peril]   \n")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(detectPerilMarker("Some narration.\n[PERIL]")).toBe(true);
  });

  it("returns false when there is no marker", () => {
    expect(detectPerilMarker("Falconhoof: You are perfectly safe, for now.")).toBe(false);
  });

  it("does not false-positive on the word 'peril' used in ordinary prose", () => {
    expect(detectPerilMarker("You sense great peril ahead, but no marker follows.")).toBe(false);
  });
});

describe("stripPerilMarker", () => {
  it("removes the marker line and leaves the rest of the text intact", () => {
    const text = "Falconhoof: The world tips sideways.\n\n» steady yourself\n\n[peril]";
    const stripped = stripPerilMarker(text);
    expect(stripped).not.toContain("[peril]");
    expect(stripped).toContain("Falconhoof: The world tips sideways.");
    expect(stripped).toContain("» steady yourself");
  });

  it("is a no-op when there is no marker present", () => {
    const text = "Falconhoof: Nothing perilous here.";
    expect(stripPerilMarker(text)).toBe(text);
  });
});
