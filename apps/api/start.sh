#!/bin/sh
set -e

echo "🔍 Checking environment..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting server..."
exec node dist/server.js
