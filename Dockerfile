# Multi-stage production Dockerfile for Personal Gemini Journal
# Optimized for Google Cloud Run with Next.js Standalone output

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time Firebase environment variables for Next.js client bundling
ARG NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC1edI6oiBKVrvgEnxQ2OIZVuwEVQgdMNI"
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID="personal-gemini-journal-507520"
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="personal-gemini-journal-507520.firebaseapp.com"
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="personal-gemini-journal-507520.firebasestorage.app"
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
ARG NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef"

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Security: Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
