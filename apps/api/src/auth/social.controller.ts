import { Body, Controller, HttpCode, Ip, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { RateLimit } from "../ratelimit/rate-limit.guard";
import { SocialService } from "./social.service";

export const GoogleLoginSchema = z.object({
  /** Google ID token from the native / web sign-in SDK. */
  idToken: z.string().min(20),
  deviceName: z.string().max(120).optional(),
});
export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;

export const AppleLoginSchema = z.object({
  /** Apple identity token (JWT) from Sign in with Apple. */
  idToken: z.string().min(20),
  deviceName: z.string().max(120).optional(),
});
export type AppleLoginInput = z.infer<typeof AppleLoginSchema>;

const TokenPairSchema = {
  type: "object",
  properties: {
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        handle: { type: "string" },
        displayName: { type: "string" },
        email: { type: "string", nullable: true },
        avatarUrl: { type: "string", nullable: true },
      },
    },
    isNewUser: { type: "boolean" },
    accessToken: { type: "string" },
    accessTokenExpiresAt: { type: "string", format: "date-time" },
    refreshToken: { type: "string" },
    refreshTokenExpiresAt: { type: "string", format: "date-time" },
  },
} as const;

/** Social login (C1.1 / KAN-111). Returns a token pair plus isNewUser for onboarding routing. */
@ApiTags("auth")
@Controller("v1/auth")
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post("google")
  @HttpCode(200)
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @ApiOperation({
    summary: "Sign in / sign up with Google",
    description:
      "Verifies the Google ID token, links the provider account by verified email " +
      "(no duplicate accounts), blocks under-18 and suspended accounts, and issues a token pair.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { idToken: { type: "string" }, deviceName: { type: "string" } },
      required: ["idToken"],
    },
  })
  @ApiResponse({ status: 200, description: "Token pair; isNewUser=true flags first-time users", schema: TokenPairSchema })
  @ApiResponse({ status: 401, description: "INVALID_ID_TOKEN | EMAIL_NOT_VERIFIED" })
  @ApiResponse({ status: 403, description: "UNDERAGE_BLOCK | ACCOUNT_SUSPENDED | ACCOUNT_DELETED" })
  google(@Body(new ZodValidationPipe(GoogleLoginSchema)) body: GoogleLoginInput, @Ip() ip: string) {
    return this.social.google(body.idToken, body.deviceName, ip);
  }

  @Post("apple")
  @HttpCode(200)
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @ApiOperation({
    summary: "Sign in / sign up with Apple",
    description:
      "Verifies the Apple identity token against Apple's JWKS, links by email when present, " +
      "blocks under-18 and suspended accounts, and issues a token pair.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { idToken: { type: "string" }, deviceName: { type: "string" } },
      required: ["idToken"],
    },
  })
  @ApiResponse({ status: 200, description: "Token pair; isNewUser=true flags first-time users", schema: TokenPairSchema })
  @ApiResponse({ status: 401, description: "INVALID_ID_TOKEN" })
  @ApiResponse({ status: 403, description: "UNDERAGE_BLOCK | ACCOUNT_SUSPENDED | ACCOUNT_DELETED" })
  apple(@Body(new ZodValidationPipe(AppleLoginSchema)) body: AppleLoginInput, @Ip() ip: string) {
    return this.social.apple(body.idToken, body.deviceName, ip);
  }
}
