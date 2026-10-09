/** Minimal structured JSON logger — one JSON object per line, level-gated. */

export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}

/** Fire-and-forget log shipper (Better Stack ingest, F8). */
export interface LogDrain {
  (line: string): void;
}

const BETTERSTACK_INGEST = "https://in.logs.betterstack.com";

/**
 * Drain that ships each JSON log line to Better Stack when a source token is
 * configured. Fetch failures are swallowed — logging must never crash the API.
 */
export function betterStackDrain(sourceToken: string, fetchImpl: typeof fetch = fetch): LogDrain {
  return (line: string) => {
    void fetchImpl(`${BETTERSTACK_INGEST}/${sourceToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: line,
    }).catch(() => {
      /* best-effort */
    });
  };
}

export function createLogger(
  level: LogLevel = "info",
  out: Pick<Console, "log"> = console,
  drain?: LogDrain,
): Logger {
  const min = ORDER[level];
  const write = (lvl: LogLevel, msg: string, ctx?: Record<string, unknown>) => {
    if (ORDER[lvl] < min) return;
    const line = JSON.stringify({
      level: lvl,
      time: new Date().toISOString(),
      msg,
      pid: process.pid,
      ...(ctx ?? {}),
    });
    out.log(line);
    drain?.(line);
  };
  return {
    debug: (msg, ctx) => write("debug", msg, ctx),
    info: (msg, ctx) => write("info", msg, ctx),
    warn: (msg, ctx) => write("warn", msg, ctx),
    error: (msg, ctx) => write("error", msg, ctx),
  };
}

export const APP_LOGGER = Symbol("APP_LOGGER");
