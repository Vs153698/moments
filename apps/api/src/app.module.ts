import { Module, type LoggerService } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { APP_ENV, parseEnv } from "./config/env";
import { APP_LOGGER, betterStackDrain, createLogger } from "./common/logger";
import { GlobalExceptionFilter } from "./common/global-exception.filter";
import { HealthController } from "./health/health.controller";
import { DatabaseService, HealthService } from "./health/health.service";
import { IdempotencyInterceptor } from "./idempotency/idempotency.interceptor";
import { MomentsController } from "./moments/moments.controller";
import { OtpController } from "./auth/otp.controller";
import { OtpService } from "./auth/otp.service";
import { QueueService } from "./queue/queue.service";
import { RateLimitGuard } from "./ratelimit/rate-limit.guard";
import { SlidingWindowRateLimiter } from "./ratelimit/sliding-window";
import { RedisService } from "./redis/redis.service";

@Module({
  controllers: [HealthController, MomentsController, OtpController],
  providers: [
    { provide: APP_ENV, useFactory: () => parseEnv() },
    {
      provide: APP_LOGGER,
      useFactory: (env: ReturnType<typeof parseEnv>) =>
        createLogger(env.LOG_LEVEL, console, env.BETTERSTACK_SOURCE_TOKEN ? betterStackDrain(env.BETTERSTACK_SOURCE_TOKEN) : undefined),
      inject: [APP_ENV],
    },
    {
      provide: APP_FILTER,
      useFactory: (env: ReturnType<typeof parseEnv>) =>
        new GlobalExceptionFilter(createLogger(env.LOG_LEVEL) as unknown as LoggerService),
      inject: [APP_ENV],
    },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    RedisService,
    OtpService,
    DatabaseService,
    QueueService,
    SlidingWindowRateLimiter,
    HealthService,
  ],
})
export class AppModule {}
