import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Express } from "express";
import { AppModule } from "./app.module";
import { APP_ENV } from "./config/env";
import { initSentry } from "./common/sentry";
import { initPostHog, shutdownPostHog } from "./common/posthog";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ["error", "warn"] });
  const env = app.get(APP_ENV);

  initSentry(env);
  initPostHog(env);
  app.use(helmet());

  const config = new DocumentBuilder()
    .setTitle("Moments API")
    .setDescription("Moments REST API — Phase 0 skeleton (F5)")
    .setVersion(env.APP_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  // Machine-readable spec next to the API surface (epic DoD).
  (app.getHttpAdapter().getInstance() as Express).get("/v1/openapi.json", (_req, res) =>
    res.json(document),
  );

  await app.listen(env.PORT);
  console.log(
    JSON.stringify({
      level: "info",
      msg: "api listening",
      port: env.PORT,
      docs: `http://localhost:${env.PORT}/docs`,
      openapi: `http://localhost:${env.PORT}/v1/openapi.json`,
    }),
  );

  app.enableShutdownHooks();
  process.on("beforeExit", () => void shutdownPostHog());
}

void bootstrap();
