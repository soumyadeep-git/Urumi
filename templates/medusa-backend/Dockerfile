FROM node:20-slim

WORKDIR /app/medusa

# Install dependencies
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy source
COPY . .

# Build
RUN yarn build

# Expose port
EXPOSE 9000

# Start command
CMD ["yarn", "start"]
