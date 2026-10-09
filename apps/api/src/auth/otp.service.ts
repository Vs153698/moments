import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { APP_ENV, type AppEnv } from "../config/env";
import { RedisService } from "../redis/redis.service";

export interface OtpRequestResult {
  requestId: string;
  phone: string;
  channel: "dev_screen" | "sms" | "whatsapp";
  expiresInSeconds: number;
  /** Present only when DEV_OTP_ON_SCREEN is active (dev testing) — display on screen, never log. */
  devOtp?: string;
}

export interface OtpVerifyResult {
  token: string;
  phone: string;
  expiresAt: string;
}

interface OtpRecord {
  hash: string;
  attempts: number;
  exp: number;
}

const recordKey = (phone: string) => `otp:${phone}`;
const rateKey = (phone: string) => `otp:rl:${phone}`;

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/**
 * Phone OTP login (C1.2 / KAN-112).
 *
 * Dev testing (owner directive): outside production the OTP is returned in the
 * API response (`devOtp`) so the client shows it on screen instead of sending
 * an SMS. Production path sends via MSG91 once the account + DLT template from
 * KAN-101 are provisioned.
 *
 * Limits per ticket spec: 5-minute validity, 5-attempt limit, 5 requests/hour/phone.
 */
@Injectable()
export class OtpService {
  private readonly secret: string;
  private readonly devOnScreen: boolean;

  constructor(
    private readonly redisService: RedisService,
    @Inject(APP_ENV) private readonly env: AppEnv,
  ) {
    if (env.OTP_JWT_SECRET) {
      this.secret = env.OTP_JWT_SECRET;
    } else if (env.NODE_ENV === "production") {
      throw new Error("OTP_JWT_SECRET is required in production");
    } else {
      // Ephemeral per-boot secret for dev/test — tokens invalidate on restart.
      this.secret = randomBytes(32).toString("hex");
    }
    this.devOnScreen = env.DEV_OTP_ON_SCREEN
      ? env.DEV_OTP_ON_SCREEN === "true"
      : env.NODE_ENV !== "production";
  }

  async requestOtp(phone: string): Promise<OtpRequestResult> {
    const redis = this.client();
    const count = await redis.incr(rateKey(phone));
    if (count === 1) await redis.expire(rateKey(phone), 3600);
    if (count > this.env.OTP_MAX_PER_HOUR) {
      throw new BadRequestException({
        code: "OTP_RATE_LIMITED",
        message: `Too many OTP requests — max ${this.env.OTP_MAX_PER_HOUR}/hour/phone`,
      });
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const record: OtpRecord = {
      hash: hmac(this.secret, `${phone}:${code}`),
      attempts: 0,
      exp: Date.now() + this.env.OTP_TTL_SECONDS * 1000,
    };
    await redis.set(recordKey(phone), JSON.stringify(record), "PX", this.env.OTP_TTL_SECONDS * 1000);

    if (this.devOnScreen) {
      return {
        requestId: randomBytes(8).toString("hex"),
        phone,
        channel: "dev_screen",
        expiresInSeconds: this.env.OTP_TTL_SECONDS,
        devOtp: code,
      };
    }

    await this.sendViaMsg91(phone, code);
    return {
      requestId: randomBytes(8).toString("hex"),
      phone,
      channel: "sms",
      expiresInSeconds: this.env.OTP_TTL_SECONDS,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
    const redis = this.client();
    const raw = await redis.get(recordKey(phone));
    if (!raw) throw new BadRequestException({ code: "OTP_INVALID", message: "OTP not found or expired" });

    const record = JSON.parse(raw) as OtpRecord;
    if (record.exp < Date.now()) {
      await redis.del(recordKey(phone));
      throw new BadRequestException({ code: "OTP_EXPIRED", message: "OTP expired — request a new one" });
    }
    if (record.attempts >= this.env.OTP_MAX_ATTEMPTS) {
      await redis.del(recordKey(phone));
      throw new UnauthorizedException({ code: "OTP_LOCKED", message: "Too many wrong attempts — request a new OTP" });
    }

    const expected = Buffer.from(record.hash);
    const actual = Buffer.from(hmac(this.secret, `${phone}:${code}`));
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      record.attempts += 1;
      if (record.attempts >= this.env.OTP_MAX_ATTEMPTS) {
        await redis.del(recordKey(phone));
        throw new UnauthorizedException({
          code: "OTP_LOCKED",
          message: "Too many wrong attempts — request a new OTP",
        });
      }
      await redis.set(recordKey(phone), JSON.stringify(record), "PX", this.env.OTP_TTL_SECONDS * 1000);
      throw new UnauthorizedException({
        code: "OTP_WRONG",
        message: `Incorrect OTP — ${this.env.OTP_MAX_ATTEMPTS - record.attempts} attempt(s) left`,
      });
    }

    await redis.del(recordKey(phone));
    const expMs = Date.now() + 7 * 24 * 3600 * 1000;
    return { token: this.signToken(phone, expMs), phone, expiresAt: new Date(expMs).toISOString() };
  }

  /** HMAC-signed dev session token: "<b64url json>.<hmac>". Verified by future auth guards. */
  signToken(phone: string, expMs: number): string {
    const payload = b64url(JSON.stringify({ phone, exp: expMs }));
    return `${payload}.${hmac(this.secret, payload)}`;
  }

  verifyToken(token: string): { phone: string } {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || hmac(this.secret, payload) !== sig) {
      throw new UnauthorizedException({ code: "TOKEN_INVALID", message: "Invalid token" });
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { phone: string; exp: number };
    if (data.exp < Date.now()) {
      throw new UnauthorizedException({ code: "TOKEN_EXPIRED", message: "Token expired" });
    }
    return { phone: data.phone };
  }

  private client() {
    if (!this.redisService.client) {
      throw new ServiceUnavailableException({
        code: "REDIS_UNAVAILABLE",
        message: "OTP requires REDIS_URL to be configured",
      });
    }
    return this.redisService.client;
  }

  private async sendViaMsg91(phone: string, code: string): Promise<void> {
    const { MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID } = this.env;
    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
      throw new ServiceUnavailableException({
        code: "MSG91_NOT_CONFIGURED",
        message:
          "MSG91 account/template not provisioned yet (KAN-101). Use DEV_OTP_ON_SCREEN=true outside production.",
      });
    }
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", MSG91_TEMPLATE_ID);
    url.searchParams.set("mobile", phone);
    url.searchParams.set("authkey", MSG91_AUTH_KEY);
    if (MSG91_SENDER_ID) url.searchParams.set("sender", MSG91_SENDER_ID);
    url.searchParams.set("otp", code);
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) {
      throw new ServiceUnavailableException({
        code: "MSG91_SEND_FAILED",
        message: `MSG91 rejected the OTP request (HTTP ${res.status})`,
      });
    }
  }
}
