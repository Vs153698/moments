/** Minimal structured JSON logger — one JSON object per line, level-gated. */

export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}

export function createLogger(level: LogLevel = "info", out: Pick<Console, "log"> = console): Logger {
  const min = ORDER[level];
  const write = (lvl: LogLevel, msg: string, ctx?: Record<string, unknown>) => {
    if (ORDER[lvl] < min) return;
    out.log(
      JSON.stringify({
        level: lvl,
        time: new Date().toISOString(),
        msg,
        pid: process.pid,
        ...(ctx ?? {}),
      }),
    );
  };
  return {
    debug: (msg, ctx) => write("debug", msg, ctx),
    info: (msg, ctx) => write("info", msg, ctx),
    warn: (msg, ctx) => write("warn", msg, ctx),
    error: (msg, ctx) => write("error", msg, ctx),
  };
}

export const APP_LOGGER = Symbol("APP_LOGGER");
