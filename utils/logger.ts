type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
  if (level === "error") {
    // No-op when Sentry has no DSN — safe in dev and CI.
    void import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(new Error(message), { extra: context }))
      .catch(() => {});
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => emit("error", msg, ctx),
};
