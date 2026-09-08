# Use lightweight alpine Node.js environment
FROM node:20-alpine

# Set internal app context
WORKDIR /app

# Copy configuration manifests
COPY package*.json tsconfig.json ./

# Install compile and execution dependencies
RUN npm ci

# Copy TypeScript source code
COPY server.ts ./

# Build source to standalone JavaScript in /dist
RUN npm run build

# Clean development packages to lower production container size
RUN npm prune --production

# Expose server ingress port
EXPOSE 3000

# Set performance context indicators
ENV NODE_ENV=production
ENV PORT=3000

# Run compiled backend
CMD ["node", "dist/server.js"]
