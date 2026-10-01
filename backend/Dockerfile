FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter backend --ignore-scripts
COPY backend backend
RUN pnpm --filter backend db:generate && pnpm --filter backend build

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
COPY --from=build /repo /repo
WORKDIR /repo/backend
EXPOSE 4227
CMD ["sh", "-c", "pnpm db:migrate && node dist/src/main"]
