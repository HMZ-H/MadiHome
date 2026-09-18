#!/bin/bash

# Set local database URL for SQLite
export DATABASE_URL="sqlite3://madihome.db"
export PORT=8080
export JWT_SECRET="your-secret-key-here"

echo "Starting MadiHome backend with SQLite database..."
echo "Database: $DATABASE_URL"
echo "Port: $PORT"

# Run the application
go run main.go




