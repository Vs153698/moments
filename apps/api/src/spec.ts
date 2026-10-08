import "reflect-metadata";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

/**
 * Export the OpenAPI document without listening on a port (F6.1).
 * Output: packages/api-client/spec/openapi.json (relative to the monorepo root).
 */
async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle("Moments API")
    .setDescription("Moments REST API — Phase 0 skeleton (F5/F6)")
    .setVersion(process.env.APP_VERSION ?? "0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await app.close();

  const outPath = join(__dirname, "..", "..", "..", "packages", "api-client", "spec", "openapi.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2) + "\n");
  console.log(`[spec] wrote ${outPath}`);
  process.exit(0);
}

void main();
