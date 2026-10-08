import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

const schema = z.object({ title: z.string().min(1), type: z.enum(["hangout", "event"]).default("hangout") });
const pipe = new ZodValidationPipe(schema);

describe("ZodValidationPipe", () => {
  it("returns parsed data with defaults applied", () => {
    const out = pipe.transform({ title: "Chai walk" }, { type: "body", metatype: Object });
    expect(out).toEqual({ title: "Chai walk", type: "hangout" });
  });

  it("rejects invalid bodies with VALIDATION_ERROR details", () => {
    try {
      pipe.transform({ title: "" }, { type: "body", metatype: Object });
      expect.unreachable();
    } catch (err) {
      const response = (err as { getResponse(): unknown }).getResponse() as {
        code: string;
        details: { fieldErrors: Record<string, unknown> };
      };
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.details.fieldErrors.title).toBeTruthy();
    }
  });

  it("passes through non-body metadata untouched", () => {
    expect(pipe.transform("raw", { type: "param", metatype: String })).toBe("raw");
  });
});
