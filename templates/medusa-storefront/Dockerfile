FROM node:20-slim

WORKDIR /app/storefront

# Copy package files and yarn configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy source
COPY . .

# Expose port
EXPOSE 8000

# Use dev mode with turbopack (more stable than production build without backend)
CMD ["yarn", "dev", "--turbopack"]
