FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-*.yaml ./
RUN chown -R node:node /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base
RUN chown node:node .
USER node
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY --chown=node:node . .
RUN pnpm run build
EXPOSE 8080
CMD [ "pnpm", "run", "start" ]
