# backend/Dockerfile
FROM node:20-slim

WORKDIR /usr/src/app

# Instalar OpenSSL (requerido por Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package*.json ./

# Instalar dependencias (usar npm install en lugar de ci para desarrollo)
RUN npm install --silent

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build || echo "No build step defined"

# Copiar entrypoint
COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

ENV NODE_ENV=development

EXPOSE 5000

CMD ["sh", "/usr/src/app/entrypoint.sh"]