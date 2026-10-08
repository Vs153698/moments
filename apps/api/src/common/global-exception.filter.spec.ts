import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  LoggerService,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { GlobalExceptionFilter } from "./global-exception.filter";

function makeHost(): { host: ArgumentsHost; res: Response; req: Request } {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
  const req = { url: "/v1/moments" } as unknown as Request;
  const host = { switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }) } as unknown as ArgumentsHost;
  return { host, res, req };
}

describe("GlobalExceptionFilter", () => {
  const logger = { error: vi.fn() } as unknown as LoggerService;
  const filter = new GlobalExceptionFilter(logger);

  it("passes through shaped error bodies from the Zod pipe", () => {
    const { host, res } = makeHost();
    const shaped = new BadRequestException({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: { fieldErrors: { title: ["required"] } },
    });
    filter.catch(shaped, host);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION_ERROR", details: expect.any(Object) }),
    );
  });

  it("maps unknown errors to 500 INTERNAL_ERROR", () => {
    const { host, res } = makeHost();
    filter.catch(new Error("boom"), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "INTERNAL_ERROR", path: "/v1/moments" }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
