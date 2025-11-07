# Build stage
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Usar npm install en lugar de npm ci para generar package-lock si no existe
RUN npm install --silent

# Copy source code
COPY . .

# Build the app
RUN npm run build || echo "Build step skipped"

# Production stage
FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx si existe
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \
    echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
