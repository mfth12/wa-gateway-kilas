# Tahap 1: Builder
# GANTI DARI 18 KE 20
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependensi build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    sqlite-dev

COPY package*.json ./

# Tambahkan flag --no-audit agar lebih ringan di GitHub Actions
RUN npm install --network-timeout=100000 --no-audit

COPY . .

# Tahap 2: Production
# GANTI JUGA DI SINI KE 20
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init sqlite-libs

# Salin dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./ 

# Setup User & Permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p sessions media media/uploads public/images && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]