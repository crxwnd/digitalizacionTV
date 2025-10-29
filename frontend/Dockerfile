# Build stage
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN npm ci --silent

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Create nginx config for SPA routing
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]