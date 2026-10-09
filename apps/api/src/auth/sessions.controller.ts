import { Body, Controller, HttpCode, Ip, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { RateLimit } from "../ratelimit/rate-limit.guard";
import { TokenService } from "./token.service";

export const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
  deviceName: z.string().max(120).optional(),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.string().min(10),
});
export type LogoutInput = z.infer<typeof LogoutSchema>;

const RotatedPairSchema = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    accessTokenExpiresAt: { type: "string", format: "date-time" },
    refreshToken: { type: "string" },
    refreshTokenExpiresAt: { type: "string", format: "date-time" },
    sessionId: { type: "string" },
  },
} as const;

/** Session lifecycle (C1.3 / KAN-113): rotating refresh tokens with reuse detection. */
@ApiTags("auth")
@Controller("v1/auth")
export class SessionsController {
  constructor(private readonly tokens: TokenService) {}

  @Post("refresh")
  @HttpCode(200)
  @RateLimit({ limit: 30, windowMs: 60_000 })
  @ApiOperation({
    summary: "Rotate the refresh token",
    description:
      "Exchanges a refresh token for a fresh access + refresh pair. The presented token is " +
      "invalidated; presenting an already-rotated token revokes the whole session (reuse detection).",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { refreshToken: { type: "string" }, deviceName: { type: "string" } },
      required: ["refreshToken"],
    },
  })
  @ApiResponse({ status: 200, description: "New token pair", schema: RotatedPairSchema })
  @ApiResponse({ status: 401, description: "TOKEN_INVALID | TOKEN_EXPIRED | REFRESH_REUSE_DETECTED" })
  @ApiResponse({ status: 403, description: "ACCOUNT_SUSPENDED | ACCOUNT_DELETED" })
  refresh(@Body(new ZodValidationPipe(RefreshSchema)) body: RefreshInput, @Ip() ip: string) {
    return this.tokens.refresh(body.refreshToken, body.deviceName, ip);
  }

  @Post("logout")
  @HttpCode(200)
  @RateLimit({ limit: 30, windowMs: 60_000 })
  @ApiOperation({
    summary: "Sign out",
    description: "Deletes the session server-side; the refresh token stops working immediately. Idempotent.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { refreshToken: { type: "string" } },
      required: ["refreshToken"],
    },
  })
  @ApiResponse({ status: 200, schema: { type: "object", properties: { revoked: { type: "boolean" } } } })
  logout(@Body(new ZodValidationPipe(LogoutSchema)) body: LogoutInput) {
    return this.tokens.logout(body.refreshToken);
  }
}
