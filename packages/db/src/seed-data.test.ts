import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  DEMO_MOMENT_COUNT,
  DEMO_USER_COUNT,
  MOMENT_PRIVACIES,
  MOMENT_STATUSES,
  MOMENT_TYPES,
  demoUsers,
  photoUrl,
  rng,
} from "./seed-data";

describe("seed data (F4.3)", () => {
  it("provides categories in English and Hindi", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(10);
    for (const c of CATEGORIES) {
      expect(c.nameEn.length).toBeGreaterThan(0);
      expect(c.nameHi).toBeTruthy();
    }
  });

  it("generates 50 unique demo users deterministically", () => {
    const a = demoUsers(DEMO_USER_COUNT);
    const b = demoUsers(DEMO_USER_COUNT);
    expect(a).toHaveLength(50);
    expect(new Set(a.map((u) => u.handle)).size).toBe(50);
    expect(a).toEqual(b);
  });

  it("covers all moment types, statuses and privacies", () => {
    expect(MOMENT_TYPES).toHaveLength(5);
    expect(MOMENT_STATUSES).toHaveLength(6);
    expect(MOMENT_PRIVACIES).toHaveLength(3);
    expect(DEMO_MOMENT_COUNT).toBe(30);
  });

  it("rng is deterministic and in [0, 1)", () => {
    const r1 = rng(7);
    const r2 = rng(7);
    const seq1 = [r1(), r1(), r1()];
    const seq2 = [r2(), r2(), r2()];
    expect(seq1).toEqual(seq2);
    for (const v of seq1) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("photo urls are stable placeholders", () => {
    expect(photoUrl(1)).toBe("https://cdn.moments.example.com/seed/photos/0001.jpg");
  });
});
