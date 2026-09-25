import { z } from "zod";

const serverSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is missing"),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

const clientSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1, "NEXT_PUBLIC_MAPBOX_TOKEN is missing"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/** Validates server env. Skipped during `next build` so Docker builds don't need secrets. */
export function validateServerEnv(): ServerEnv {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return process.env as unknown as ServerEnv;
  }
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment:\n${parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n")}`
    );
  }
  return parsed.data;
}

/** Validates public (client) env. Safe to call in the browser. */
export function validateClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment:\n${parsed.error.issues.map((i) => ` - ${i.path.join(".")}: ${i.message}`).join("\n")}`
    );
  }
  return parsed.data;
}
