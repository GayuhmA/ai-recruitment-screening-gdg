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

# Set workdir langsung ke api folder
WORKDIR /app/apps/api

# Copy package files
COPY apps/api/package*.json ./

# Install production dependencies
RUN npm install --production

# Copy prisma schema
COPY apps/api/prisma ./prisma

# Generate Prisma Client di lokasi yang benar
RUN npx prisma generate

# Copy built files dari builder stage
COPY --from=builder /app/apps/api/dist ./dist

# Copy start script
COPY apps/api/start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Debug: Show what's in the directory
RUN echo "=== Directory Contents ===" && ls -la && echo "=== Dist Contents ===" && ls -la dist/ 2>/dev/null || echo "No dist folder"

# Start dengan logging
CMD ["./start.sh"]
