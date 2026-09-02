import { describe, expect, it } from "vitest";
import { gateDeath } from "../src/index";

describe("gateDeath (server-side survive/peril death gate)", () => {
  it("is a no-op when no death phrase is present", () => {
    const text = "Falconhoof: You edge along the ledge, heart pounding.\n\n» keep going\n» turn back";
    expect(gateDeath(text)).toBe(text);
  });

  it("truncates at an exact death phrase and grafts the peril cliffhanger", () => {
    const text =
      "Falconhoof: You press forward into the dark.\nFalconhoof: You are dead.\n\n» try again";
    const result = gateDeath(text);
    expect(result.startsWith("Falconhoof: You press forward into the dark.")).toBe(true);
    expect(result).not.toContain("You are dead.");
    expect(result).toContain("[peril]");
    expect(result.endsWith("[peril]")).toBe(true);
  });

  it("truncates at a drifted death phrase, not just the exact canonical ones", () => {
    const text = "Falconhoof: The blow lands true.\nYou have been slain by the ogre.";
    const result = gateDeath(text);
    expect(result.startsWith("Falconhoof: The blow lands true.")).toBe(true);
    expect(result).not.toMatch(/slain/i);
    expect(result).toContain("[peril]");
  });

  it("gates case-insensitively", () => {
    const text = "Falconhoof: The room goes silent.\nyou ARE dead.";
    const result = gateDeath(text);
    expect(result.startsWith("Falconhoof: The room goes silent.")).toBe(true);
    expect(result).toContain("[peril]");
  });

  it("gates a death line prefixed with a speaker tag", () => {
    const text = "Falconhoof: You stumble in the dark.\nFalconhoof: Game over.\n";
    const result = gateDeath(text);
    expect(result.startsWith("Falconhoof: You stumble in the dark.")).toBe(true);
    expect(result).not.toContain("Game over.");
    expect(result).toContain("[peril]");
  });

  it("strips a trailing choice block emitted alongside the death before grafting", () => {
    const text =
      "Falconhoof: You limp toward the door.\n» push the door\n» wait quietly\nFalconhoof: You are dead.";
    const result = gateDeath(text);
    expect(result.startsWith("Falconhoof: You limp toward the door.")).toBe(true);
    expect(result).not.toContain("push the door");
    expect(result).not.toContain("wait quietly");
    expect(result).not.toContain("You are dead.");
    expect(result).toContain("[peril]");
  });

  it("does NOT gate a death-shaped phrase that only appears mid-sentence, not at a line start (near miss)", () => {
    // DEATH_GATE_RE is deliberately anchored to the start of a narration
    // line (with only an optional speaker tag / asterisk before it) so
    // incidental mid-sentence uses of the wording aren't treated as an
    // engine-level death. This is the negative case the position anchor
    // exists for.
    const text =
      'Falconhoof: The old drunk mutters, "you are dead if you go in there," and cackles.';
    expect(gateDeath(text)).toBe(text);
  });

  it("does NOT gate a near-miss that isn't a contiguous drift phrase", () => {
    const text = "Falconhoof: You have almost died twice tonight, caller.";
    expect(gateDeath(text)).toBe(text);
  });
});
