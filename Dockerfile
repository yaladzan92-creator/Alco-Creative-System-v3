# Use a slim Node base image
FROM node:19-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install productive and development dependencies to carry out builds
RUN npm ci

# Copy full application codebase
COPY . .

# Build both client static assets and server.cjs using configured script
RUN npm run build

# Remove unneeded dev-dependencies to cut package size
RUN npm prune --production

# Expose port 3000 as configured on server ingress
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run standalone backend server
CMD ["npm", "run", "start"]
