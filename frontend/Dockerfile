FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend
COPY frontend frontend
ARG BACKEND_URL=http://backend:4227
ENV BACKEND_URL=$BACKEND_URL
RUN pnpm --filter frontend build

FROM node:22-alpine
WORKDIR /repo
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate
COPY --from=build /repo /repo
WORKDIR /repo/frontend
EXPOSE 3227
CMD ["pnpm", "start"]
