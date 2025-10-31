# Build stage
FROM node:20-slim AS builder
WORKDIR /usr/src/app

# Instalar OpenSSL
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npx prisma generate
RUN npm run build || echo "No build step defined"

# Production stage
FROM node:20-slim
WORKDIR /usr/src/app

# Instalar OpenSSL en producción también
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --production --silent || true

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 5000
CMD ["sh", "/usr/src/app/entrypoint.sh"]