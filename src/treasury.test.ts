import { describe, it, expect } from "vitest";
import {
  ensureWeek,
  seed,
  setCompletion,
  pointsInRange,
  updateSettings,
  rankFor,
} from "./model";
import { valid } from "./storage";
import { loginEmail, familyGuestEmail } from "./auth";
describe("Treasury", () => {
  it("counts both endpoints and splits weeks across a year boundary", () => {
    let d = ensureWeek(seed(), "2025-12-29");
    d = setCompletion(d, "2025-12-29", "bed", 0);
    d = setCompletion(d, "2025-12-29", "teeth", 3);
    d = ensureWeek(d, "2026-01-05");
    d = setCompletion(d, "2026-01-05", "toys", 0);
    expect(pointsInRange(d)).toBe(20);
    expect(pointsInRange(d, "2025-12-29", "2026-01-01")).toBe(10);
    expect(pointsInRange(d, "2026-01-01", "2026-01-01")).toBe(5);
    expect(pointsInRange(d, "2026-01-02", "2026-01-05")).toBe(10);
  });
  it("keeps earned values after a points edit or chore deletion", () => {
    let d = ensureWeek(seed(), "2026-11-02");
    d = setCompletion(d, "2026-11-02", "bed", 0);
    d = updateSettings(
      d,
      "2026-11-02",
      d.chores.map((c) => (c.id === "bed" ? { ...c, points: 99 } : c)),
      d.reward,
    );
    expect(pointsInRange(d)).toBe(5);
    d = updateSettings(d, "2026-11-02", [], d.reward);
    expect(pointsInRange(d)).toBe(5);
  });
  it("captures legacy completion values before modifying the current routine", () => {
    let d = ensureWeek(seed(), "2026-11-02");
    d.weeks["2026-11-02"].completed["bed:0"] = true;
    expect(pointsInRange(d)).toBe(5);
    d = updateSettings(d, "2026-11-02", [], d.reward);
    expect(pointsInRange(d)).toBe(5);
  });
  it("does not double-count toggles and removes points on undo", () => {
    let d = ensureWeek(seed(), "2026-11-02");
    for (let i = 0; i < 3; i++) d = setCompletion(d, "2026-11-02", "bed", 0);
    expect(pointsInRange(d)).toBe(5);
    d = setCompletion(d, "2026-11-02", "bed", 0);
    expect(pointsInRange(d)).toBe(0);
  });
  it("handles empty and inverted ranges without counting future awards", () => {
    expect(pointsInRange(seed())).toBe(0);
    let d = ensureWeek(seed(), "2026-11-02");
    d = setCompletion(d, "2026-11-02", "bed", 0);
    expect(pointsInRange(d, "2026-11-03", "2026-11-01")).toBe(0);
    expect(pointsInRange(d, "2026-11-04", "2026-11-05")).toBe(0);
  });
  it("advances rank exactly at a lifetime threshold", () => {
    expect(rankFor(99).title).toBe("Squire");
    expect(rankFor(100).title).toBe("Apprentice knight");
    expect(rankFor(1500).title).toBe("Champion");
  });
  it("reads old data and validates new milestone and award fields", () => {
    expect(valid(seed())).toBe(true);
    expect(
      valid({
        ...seed(),
        milestones: [{ id: "one", title: "Treat", target: 50 }],
      }),
    ).toBe(true);
    expect(
      valid({
        ...seed(),
        milestones: [{ id: "one", title: "Treat", target: -1 }],
      }),
    ).toBe(false);
    const d = ensureWeek(seed(), "2026-11-02");
    d.weeks["2026-11-02"].earned = { "bed:0": -4 };
    expect(valid(d)).toBe(false);
  });
});
describe("Family guest alias", () => {
  it("maps the username to its dedicated Supabase identity", () => {
    expect(loginEmail(" FAMILY ")).toBe(familyGuestEmail);
  });
  it("keeps normal email sign-ins available", () => {
    expect(loginEmail(" parent@example.com ")).toBe("parent@example.com");
  });
});
