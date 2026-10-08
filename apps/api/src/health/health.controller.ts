import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { HealthCheckResult } from "@moments/types";
import { HealthService } from "./health.service";

@ApiTags("system")
@Controller("v1")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get("health")
  @ApiOperation({ summary: "Liveness/readiness probe with database, Redis and queue checks" })
  @ApiResponse({ status: 200, description: "Health report" })
  async check(): Promise<HealthCheckResult> {
    return this.health.check();
  }
}
