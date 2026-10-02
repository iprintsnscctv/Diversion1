FROM node:20-alpine

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy application source files
COPY . .

# Build frontend production assets
RUN npm run build

# Change ownership to node user
RUN chown -R node:node /app

USER node

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
