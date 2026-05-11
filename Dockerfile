FROM --platform=linux/amd64 node:22-alpine

USER root

WORKDIR /app

# canvas (node-canvas) native build: Python + toolchain + Cairo stack headers/libs
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

COPY package.json ./
RUN npm install

COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 8080

# ts-node + Node ESM fails to resolve extensionless ./faceVerification; tsx matches package.json "start"
CMD ["npx", "tsx", "src/index.ts"]
