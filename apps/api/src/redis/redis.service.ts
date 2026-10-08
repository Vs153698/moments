import { Injectable } from "@nestjs/common";
import Redis from "ioredis";

/** Redis connection — null when REDIS_URL is not configured (dev without cache). */
@Injectable()
export class RedisService {
  readonly client: Redis | null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    this.client = redisUrl ? new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: 2 }) : null;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client) await this.client.quit();
  }
}
