# ---- deps ----
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- build ----
FROM oven/bun:1-alpine AS builder
WORKDIR /app
# Public vars are inlined at build time — pass real values via --build-arg in CI.
ARG NEXT_PUBLIC_MAPBOX_TOKEN=""
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_placeholder"
ARG CLERK_SECRET_KEY="sk_test_placeholder"
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- run ----
FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["bun", "server.js"]
