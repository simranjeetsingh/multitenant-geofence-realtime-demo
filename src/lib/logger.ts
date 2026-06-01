type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

/**
 * Tiny structured logger used across the app.
 *
 * It intentionally has zero dependencies so it works the same inside Next.js
 * middleware (Edge runtime), API routes (Node runtime) and the Socket.io
 * server. Each line is emitted as a single JSON object for easy grepping.
 */
function emit(level: LogLevel, scope: string, message: string, context?: LogContext): void {
  const entry = {
    level,
    scope,
    message,
    ...(context ?? {}),
    ts: new Date().toISOString(),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, context?: LogContext) => emit("debug", scope, message, context),
    info: (message: string, context?: LogContext) => emit("info", scope, message, context),
    warn: (message: string, context?: LogContext) => emit("warn", scope, message, context),
    error: (message: string, context?: LogContext) => emit("error", scope, message, context),
  };
}

export type Logger = ReturnType<typeof createLogger>;
