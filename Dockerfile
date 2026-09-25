# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Set up the Node.js Backend
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy the compiled React files from Stage 1 into the final container
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Expose the port your Express server uses
EXPOSE 3000

# Start the server
CMD ["node", "server.mjs"]