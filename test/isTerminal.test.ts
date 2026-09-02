import { describe, expect, it } from "vitest";
import { isTerminal } from "../src/index";

describe("isTerminal (server, exported reference implementation)", () => {
  it("recognises the exact canonical death phrases", () => {
    expect(isTerminal("Falconhoof: You are dead.")).toBe(true);
    expect(isTerminal("Game over.")).toBe(true);
  });

  it("recognises drifted death phrasing the model sometimes reaches for", () => {
    expect(isTerminal("You have died")).toBe(true);
    expect(isTerminal("Alas, you perish in the dark.")).toBe(true);
    expect(isTerminal("You have perished.")).toBe(true);
    expect(isTerminal("Your quest ends here, caller.")).toBe(true);
    expect(isTerminal("Your adventure is over.")).toBe(true);
    expect(isTerminal("Your journey has ended.")).toBe(true);
    expect(isTerminal("You have fallen at the gate.")).toBe(true);
    expect(isTerminal("You have been slain by the ogre.")).toBe(true);
  });

  it("treats a single restart-shaped choice as terminal even without death wording", () => {
    expect(isTerminal("» start a new adventure")).toBe(true);
    expect(isTerminal("» begin again")).toBe(true);
    expect(isTerminal("» try another call")).toBe(true);
  });

  it("does not treat ordinary narration as terminal", () => {
    expect(isTerminal("You step into the tavern and order an ale.")).toBe(false);
    expect(isTerminal("The corridor stretches on, dead quiet.")).toBe(false);
    expect(isTerminal("» search the room\n» open the door")).toBe(false);
  });

  it("does not treat a multi-choice list that happens to include a restart-like option as terminal", () => {
    // Only a SINGLE »-choice that is restart-shaped counts (issue #6's
    // structural fallback is deliberately narrow).
    expect(isTerminal("» fight on\n» start a new adventure")).toBe(false);
  });

  it("is not fooled by unrelated uses of the word 'dead' or 'over'", () => {
    expect(isTerminal("The deadbolt on the door is rusted shut.")).toBe(false);
    expect(isTerminal("The bridge is over the ravine.")).toBe(false);
  });
});
