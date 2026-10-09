import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { RateLimit } from "../ratelimit/rate-limit.guard";
import { OtpService } from "./otp.service";

export const RequestOtpSchema = z.object({
  /** E.164 phone number, e.g. +919876543210 */
  phone: z.string().regex(/^\+\d{8,15}$/, "phone must be E.164 (+countrycode, 8-15 digits)"),
});
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^\+\d{8,15}$/, "phone must be E.164 (+countrycode, 8-15 digits)"),
  code: z.string().regex(/^\d{6}$/, "code must be exactly 6 digits"),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

/** Phone OTP login (C1.2 / KAN-112). Dev builds show the OTP on screen (devOtp field). */
@ApiTags("auth")
@Controller("v1/auth/otp")
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post("request")
  @HttpCode(200)
  @RateLimit({ limit: 5, windowMs: 60_000 })
  @ApiOperation({
    summary: "Request a phone OTP",
    description:
      "Issues a 6-digit OTP (5-min validity, 5/hour/phone). Outside production the OTP is " +
      "returned in `devOtp` for on-screen display during dev testing; production sends via MSG91.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: { phone: { type: "string", example: "+919876543210" } },
      required: ["phone"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "OTP issued (devOtp present in dev mode)",
    schema: {
      type: "object",
      properties: {
        requestId: { type: "string" },
        phone: { type: "string" },
        channel: { type: "string", enum: ["dev_screen", "sms", "whatsapp"] },
        expiresInSeconds: { type: "number" },
        devOtp: { type: "string", nullable: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: "VALIDATION_ERROR | OTP_RATE_LIMITED" })
  request(@Body(new ZodValidationPipe(RequestOtpSchema)) body: RequestOtpInput) {
    return this.otp.requestOtp(body.phone);
  }

  @Post("verify")
  @HttpCode(200)
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @ApiOperation({ summary: "Verify OTP and receive a dev session token (7-day expiry)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        phone: { type: "string", example: "+919876543210" },
        code: { type: "string", example: "123456" },
      },
      required: ["phone", "code"],
    },
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: "object",
      properties: {
        token: { type: "string" },
        phone: { type: "string" },
        expiresAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "OTP_INVALID | OTP_EXPIRED" })
  @ApiResponse({ status: 401, description: "OTP_WRONG | OTP_LOCKED | TOKEN_INVALID" })
  verify(@Body(new ZodValidationPipe(VerifyOtpSchema)) body: VerifyOtpInput) {
    return this.otp.verifyOtp(body.phone, body.code);
  }
}
