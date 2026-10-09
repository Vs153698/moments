import { describe, expect, it } from "vitest";
import { ROUTES, ROUTE_GROUPS } from "./routes";

describe("route manifest (KAN-109 — epic KAN-5: all 22+ routes navigable)", () => {
  it("declares at least 22 routes", () => {
    expect(ROUTES.length).toBeGreaterThanOrEqual(22);
  });

  it("has unique paths", () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("every route has a non-empty title and a known group", () => {
    for (const route of ROUTES) {
      expect(route.title.length).toBeGreaterThan(0);
      expect(ROUTE_GROUPS).toContain(route.group);
    }
  });

  it("dynamic segments use expo-router [param] syntax", () => {
    for (const route of ROUTES) {
      expect(route.path.startsWith("/")).toBe(true);
      for (const seg of route.path.split("/")) {
        if (seg.includes("[")) expect(seg).toMatch(/^\[(id|slug)\]$/);
      }
    }
  });
});
