# Build stage
FROM --platform=linux/arm64 node:20-alpine as builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build the application
RUN pnpm run build

# Runner stage
FROM --platform=linux/arm64 node:20-alpine as runner

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only the necessary package files from the builder stage
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml ./
COPY --from=builder /usr/src/app/src/worker.js ./

# Install production dependencies only
RUN pnpm install --prod

# Copy the built files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the application port
EXPOSE 5001

# Command to run the application
ENTRYPOINT ["pnpm", "run", "start"]
