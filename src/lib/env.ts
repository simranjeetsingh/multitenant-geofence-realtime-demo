import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * We parse `process.env` exactly once through a Zod schema so the rest of the
 * codebase can import a strongly-typed `env` object instead of reaching into
 * `process.env` (which is always `string | undefined`).
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://postgres:postgres@localhost:5432/screening_demo?schema=public"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable message instead of a cryptic runtime crash later.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env: Env = parsed.data;
