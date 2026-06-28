FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies only
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
RUN npm ci

# Copy Prisma schema and generate
COPY packages/api/prisma ./packages/api/prisma
RUN npx prisma generate --schema=packages/api/prisma/schema.prisma

# Copy source code
COPY packages/api ./packages/api
COPY packages/web ./packages/web

# Build
RUN npm run build

EXPOSE 3001

CMD ["node", "packages/api/dist/index.js"]
