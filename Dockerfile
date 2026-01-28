# Multi-stage build for AI Recruitment API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy Prisma schema
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Copy TypeScript config and source code
COPY apps/api/tsconfig*.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Remove test files and utils.ts (tailwind utility, not needed in backend)
RUN rm -f apps/api/src/lib/utils.ts && \
    find apps/api/src -name '*.spec.ts' -delete && \
    find apps/api/src -name '*.test.ts' -delete

# Build TypeScript
RUN cd apps/api && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies only
RUN npm install --production

# Copy Prisma schema and generated client from builder
COPY apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Generate Prisma Client in production stage
RUN cd apps/api && npx prisma generate

# Expose port
EXPOSE 3000

# Set working directory to API
WORKDIR /app/apps/api

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
