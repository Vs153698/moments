import { describe, expect, it } from "vitest";
import { API_VERSION } from "./index";

describe("api placeholder", () => {
  it("exposes a version string", () => {
    expect(API_VERSION).toContain("placeholder");
  });
});
