# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --silent || npm install
COPY . .
RUN npm run build || echo "No build step defined"

FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/build ./build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
