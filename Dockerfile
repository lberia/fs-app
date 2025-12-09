# Use the official Bun image
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Expose the port on which the API will listen
EXPOSE 3000/tcp

# Run the server when the container launches
RUN bun install

# Declare /data as a volume mount point
VOLUME /app/data
RUN bun run migrate

CMD ["bun", "run", "dev"]