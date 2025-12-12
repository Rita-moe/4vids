FROM node:latest

RUN mkdir -p /home/node/app/node_modules 

WORKDIR /home/node/app

COPY ["package.json", "pnpm-*.yaml", "webpack.config.js", "./"]

RUN chown -R node:node /home/node/app

USER node

RUN pnpm install

COPY --chown=node:node . .

RUN npm run build

EXPOSE 8080

CMD [ "npm", "run", "start" ]
