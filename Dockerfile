FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false --silent
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
