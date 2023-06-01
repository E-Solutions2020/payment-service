FROM node:19-alpine as builder

WORKDIR /home/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

FROM node:19-alpine

ENV NODE_ENV production

USER node
WORKDIR /home/app

COPY --from=builder /home/app/package*.json ./
COPY --from=builder /home/app/node_modules/ ./node_modules/
COPY --from=builder /home/app/dist/ ./dist/

ENTRYPOINT [ "npm", "run", "start:prod" ]