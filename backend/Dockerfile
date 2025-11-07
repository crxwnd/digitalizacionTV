# backend/Dockerfile
FROM node:20-slim

WORKDIR /usr/src/app

# Instalar OpenSSL (requerido por Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package*.json ./

# Instalar dependencias usando npm install
RUN npm install --silent

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate || echo "Prisma generate skipped"

# Compilar TypeScript si existe tsconfig
RUN npm run build || echo "Build step skipped"

# Crear directorio de uploads
RUN mkdir -p /app/uploads

ENV NODE_ENV=development

EXPOSE 5000

# Usar node directamente si no hay dist, o el archivo compilado si existe
CMD ["sh", "-c", "if [ -f dist/index.js ]; then node dist/index.js; else node src/index.js || npx tsx src/index.ts; fi"]
