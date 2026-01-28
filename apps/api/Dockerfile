# ===== BUILDER STAGE =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files untuk monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies (termasuk dev dependencies untuk build)
RUN npm install

# Copy prisma schema
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Copy source code (exclude test files dan unused utils)
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Remove unused frontend utilities and test files
RUN rm -f apps/api/src/lib/utils.ts && \
    find apps/api/src -name '*.spec.ts' -delete && \
    find apps/api/src -name '*.test.ts' -delete

# Build TypeScript
RUN cd apps/api && npm run build

# ===== PRODUCTION STAGE =====
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies
RUN npm install --production

# Copy prisma untuk migrations
COPY apps/api/prisma ./apps/api/prisma

# Copy built files dari builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Expose port (internal, tidak langsung ke public)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start aplikasi
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
