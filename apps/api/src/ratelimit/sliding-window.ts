import { Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export interface SlidingWindowStore {
  hit(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitDecision>;
}

/** Redis sliding-window store — sorted set of request timestamps per key. */
export class RedisSlidingWindowStore implements SlidingWindowStore {
  constructor(private readonly redis: RedisService) {}

  async hit(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitDecision> {
    const redis = this.redis.client;
    if (!redis) return { allowed: true, remaining: limit };
    const member = `${now}:${Math.random().toString(36).slice(2)}`;
    const windowStart = now - windowMs;
    const tx = redis.multi();
    tx.zremrangebyscore(key, 0, windowStart);
    tx.zadd(key, now, member);
    tx.zcard(key);
    tx.pexpire(key, windowMs);
    const results = await tx.exec();
    const used = (results?.[2]?.[1] as number) ?? 0;
    if (used > limit) {
      // Roll back this request's marker so rejected hits don't count.
      await redis.zrem(key, member);
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const oldestScore = Number(oldest[1] ?? now);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldestScore + windowMs - now),
      };
    }
    return { allowed: true, remaining: Math.max(0, limit - used) };
  }
}

/** In-memory fallback for tests and local dev without Redis. */
export class MemorySlidingWindowStore implements SlidingWindowStore {
  private readonly hits = new Map<string, number[]>();

  async hit(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitDecision> {
    const fresh = (this.hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (fresh.length >= limit) {
      this.hits.set(key, fresh);
      return { allowed: false, remaining: 0, retryAfterMs: fresh[0]! + windowMs - now };
    }
    fresh.push(now);
    this.hits.set(key, fresh);
    return { allowed: true, remaining: limit - fresh.length };
  }
}

@Injectable()
export class SlidingWindowRateLimiter {
  readonly store: SlidingWindowStore;

  constructor(redis: RedisService) {
    this.store = redis.client ? new RedisSlidingWindowStore(redis) : new MemorySlidingWindowStore();
  }

  consume(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now(),
  ): Promise<RateLimitDecision> {
    return this.store.hit(key, limit, windowMs, now);
  }
}
