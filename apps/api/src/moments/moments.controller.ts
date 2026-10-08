import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { RateLimit } from "../ratelimit/rate-limit.guard";

export const CreateMomentSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  type: z.enum(["hangout", "event", "trip", "celebration", "activity"]).default("hangout"),
  privacy: z.enum(["public", "invite_only", "private"]).default("public"),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  city: z.string().max(80).optional(),
});

export type CreateMomentInput = z.infer<typeof CreateMomentSchema>;

/** Validation demo endpoint — full CRUD lands with E04 (KAN-7). */
@ApiTags("moments")
@Controller("v1/moments")
export class MomentsController {
  @Post()
  @HttpCode(201)
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @ApiOperation({ summary: "Create a moment (validation demo — persistence in E04)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string", example: "Sunset chai at Marine Drive" },
        type: { type: "string", enum: ["hangout", "event", "trip", "celebration", "activity"] },
        privacy: { type: "string", enum: ["public", "invite_only", "private"] },
      },
      required: ["title"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Validated moment payload",
    schema: {
      type: "object",
      properties: {
        received: { type: "boolean" },
        moment: { type: "object" },
        receivedAt: { type: "string", format: "date-time" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "VALIDATION_ERROR" })
  @ApiResponse({ status: 429, description: "RATE_LIMITED" })
  create(@Body(new ZodValidationPipe(CreateMomentSchema)) body: CreateMomentInput) {
    return { received: true, moment: body, receivedAt: new Date().toISOString() };
  }
}
