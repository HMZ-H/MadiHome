# Database Setup Instructions

## Option 1: Use SQLite (Easiest for Development)

1. Install SQLite if not already installed
2. Create a database file:
   ```bash
   sqlite3 madihome.db
   ```

3. Update your database connection in `Infrastructure/database/db.go` to use SQLite:
   ```go
   // Change the connection string to:
   DATABASE_URL="sqlite3://madihome.db"
   ```

## Option 2: Use PostgreSQL (Production-like)

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE madihome;
   ```

3. Set environment variable:
   ```bash
   export DATABASE_URL="postgres://username:password@localhost:5432/madihome?sslmode=disable"
   ```

## Option 3: Use Docker (Recommended)

1. Create `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: madihome
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
       ports:
         - "5432:5432"
   ```

2. Run: `docker-compose up -d`

3. Set environment variable:
   ```bash
   export DATABASE_URL="postgres://postgres:password@localhost:5432/madihome?sslmode=disable"
   ```




