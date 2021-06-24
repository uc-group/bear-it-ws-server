FROM node:14.17.1-buster-slim AS build
WORKDIR /home/node/app
COPY server /home/node/app
RUN npm install && npm run build

FROM node:14.17.1-buster-slim
WORKDIR /home/node/app
RUN mkdir /home/node/app/dist
COPY --from=build /home/node/app/dist/server.js dist/server.js
COPY server/package.json server/package-lock.json ./
RUN npm install --production
CMD ["npm", "start"]