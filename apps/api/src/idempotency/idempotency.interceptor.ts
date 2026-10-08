import { createHash } from "node:crypto";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, of, tap } from "rxjs";
import { RedisService } from "../redis/redis.service";

const TTL_SECONDS = 24 * 60 * 60;

interface StoredResponse {
  statusCode: number;
  body: unknown;
}

interface ReplayStore {
  get(key: string): Promise<StoredResponse | undefined>;
  set(key: string, value: StoredResponse): Promise<void>;
}

class MemoryReplayStore implements ReplayStore {
  private readonly map = new Map<string, { value: StoredResponse; expiresAt: number }>();
  async get(key: string): Promise<StoredResponse | undefined> {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }
  async set(key: string, value: StoredResponse): Promise<void> {
    this.map.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }
}

class RedisReplayStore implements ReplayStore {
  constructor(private readonly redis: RedisService) {}
  private key(k: string): string {
    return `idem:${k}`;
  }
  async get(key: string): Promise<StoredResponse | undefined> {
    const raw = await this.redis.client?.get(this.key(key));
    return raw ? (JSON.parse(raw) as StoredResponse) : undefined;
  }
  async set(key: string, value: StoredResponse): Promise<void> {
    await this.redis.client?.set(this.key(key), JSON.stringify(value), "EX", TTL_SECONDS);
  }
}

/**
 * Idempotency-Key interceptor (F5.2): POST/PATCH/PUT requests carrying an
 * Idempotency-Key header replay the stored response instead of re-executing.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly store: ReplayStore;

  constructor(redis: RedisService) {
    this.store = redis.client ? new RedisReplayStore(redis) : new MemoryReplayStore();
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const keyHeader = req.headers["idempotency-key"];
    const method = req.method.toUpperCase();

    if (!keyHeader || !["POST", "PUT", "PATCH"].includes(method)) {
      return next.handle();
    }

    const hash = createHash("sha256")
      .update(`${method} ${req.baseUrl}${req.path} ${String(keyHeader)}`)
      .digest("hex");

    const cached = await this.store.get(hash);
    if (cached) {
      res.setHeader("idempotent-replay", "true");
      res.status(cached.statusCode);
      return of(cached.body);
    }

    return next.handle().pipe(
      tap((body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          void this.store.set(hash, { statusCode: res.statusCode, body });
        }
      }),
    );
  }
}
