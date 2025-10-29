#!/usr/bin/env sh
set -e

echo ">>> Entrypoint: Generando Prisma client..."
npx prisma generate

if [ "$NODE_ENV" = "production" ]; then
  echo ">>> Production: prisma migrate deploy"
  npx prisma migrate deploy || true
else
  echo ">>> Development: prisma migrate dev (o db push si falla)"
  npx prisma migrate dev --name init || npx prisma db push
fi

# Ejecutar seed si existe
if [ -f prisma/seed.js ] || [ -f prisma/seed.ts ]; then
  echo ">>> Ejecutando seed..."
  node prisma/seed.js || npx ts-node prisma/seed.ts || true
fi

echo ">>> Iniciando backend..."
if [ "$NODE_ENV" = "development" ]; then
  npm run dev || node dist/index.js
else
  node dist/index.js
fi
