# Build context must be the monorepo root: `docker-compose up` handles this automatically.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/client/package.json ./packages/client/
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/client ./packages/client
RUN npm run build -w packages/shared
RUN npm run build -w packages/client

FROM nginx:alpine AS runner
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
EXPOSE 80
