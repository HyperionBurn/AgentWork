FROM node:18-alpine

WORKDIR /app

# Copy root package.json if it exists (for monorepo context if needed)
# But for now, we'll just build inside agents/express-server
COPY package*.json ./
RUN npm install

COPY . .

# Expose all agent ports
EXPOSE 4021 4022 4023 4024

CMD ["npx", "tsx", "server.ts"]
