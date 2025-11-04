#!/usr/bin/env sh
set -e

echo ">>> Generando Prisma Client..."
npx prisma generate

echo ">>> Ejecutando migraciones..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss || echo "Migraciones fallaron, continuando..."

echo ">>> Ejecutando seed..."
npm run seed || echo "Seed ya ejecutado o falló"

echo ">>> Iniciando servidor..."
node dist/index.js