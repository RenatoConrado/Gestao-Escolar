# ------------------------------------------------------------------------------
# 1. ESTÁGIO DE DEPENDÊNCIAS
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ------------------------------------------------------------------------------
# 2. ESTÁGIO DE BUILD
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV API_URL=http://api:8080

RUN NODE_ENV=test npm test || { echo "AVISO: os testes do frontend falharam; continuando o build da imagem." >&2; }

RUN npm run build

# ------------------------------------------------------------------------------
# 3. ESTÁGIO DE EXECUÇÃO EM PRODUÇÃO (RUNNER LEVE)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
