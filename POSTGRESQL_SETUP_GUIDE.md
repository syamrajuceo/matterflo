# PostgreSQL Setup Guide for ERP Builder

## Overview
The ERP Builder backend requires PostgreSQL 16.x to run. You have several options to set it up.

---

## Option 1: Install PostgreSQL Locally (Recommended for Development)

### Windows Installation Steps

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Or use installer: https://www.postgresql.org/download/windows/installer/
   - Download PostgreSQL 16.x installer

2. **Run the Installer**
   - Run the downloaded `.exe` file
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` user
   - Default port: `5432` (keep this)
   - Default user: `postgres`

3. **Verify Installation**
   ```powershell
   # Check if PostgreSQL service is running
   Get-Service -Name postgresql*
   
   # Or check if psql is available
   psql --version
   ```

4. **Create Database**
   ```powershell
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE erp_builder;
   
   # Exit psql
   \q
   ```

5. **Update Backend .env**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/erp_builder?schema=public
   ```

---

## Option 2: Use Docker (Easiest - If Docker is Available)

### Install Docker Desktop for Windows
1. Download: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop
3. Start Docker Desktop

### Start PostgreSQL with Docker Compose
```powershell
cd C:\Users\Goutham\Downloads\matterflo\matterflo

# Start only PostgreSQL and Redis
docker compose up -d postgres redis

# Check status
docker compose ps
```

This will:
- Start PostgreSQL on port 5432
- Create database `erp_builder`
- Default credentials: `postgres/postgres`

---

## Option 3: Use Cloud PostgreSQL (Free Tier Available)

### Options:
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app (Free tier available)
- **ElephantSQL**: https://www.elephantsql.com (Free tier available)

### Steps:
1. Sign up for a free account
2. Create a new PostgreSQL database
3. Copy the connection string
4. Update `backend/.env`:
   ```env
   DATABASE_URL=your_cloud_connection_string
   ```

---

## Quick Setup Script (After PostgreSQL is Installed)

Once PostgreSQL is installed, run these commands:

```powershell
# Navigate to backend
cd C:\Users\Goutham\Downloads\matterflo\matterflo\backend

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start the backend server
npm run dev
```

---

## Troubleshooting

### PostgreSQL Service Not Running
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-16

# Or use Services GUI
services.msc
# Find "postgresql-x64-16" and start it
```

### Connection Refused
- Check if PostgreSQL is running: `Get-Service postgresql*`
- Check if port 5432 is available: `netstat -ano | findstr :5432`
- Verify DATABASE_URL in `.env` file

### Authentication Failed
- Verify username and password in DATABASE_URL
- Check PostgreSQL authentication settings in `pg_hba.conf`

### Database Doesn't Exist
```powershell
# Connect and create database
psql -U postgres
CREATE DATABASE erp_builder;
\q
```

---

## Recommended: Quick Start with Docker

If you can install Docker Desktop, this is the easiest option:

```powershell
# 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/

# 2. Start Docker Desktop

# 3. Start PostgreSQL and Redis
cd C:\Users\Goutham\Downloads\matterflo\matterflo
docker compose up -d postgres redis

# 4. Wait for services to be healthy (about 10 seconds)

# 5. Run migrations
cd backend
npm run prisma:migrate

# 6. Start backend
npm run dev
```

---

## Current Status Check

To check if PostgreSQL is available:

```powershell
# Check if PostgreSQL service exists
Get-Service -Name postgresql* -ErrorAction SilentlyContinue

# Check if psql command is available
psql --version

# Try to connect (will prompt for password)
psql -U postgres -h localhost
```

---

## Next Steps After PostgreSQL Setup

1. ✅ PostgreSQL installed and running
2. ✅ Database `erp_builder` created
3. ✅ Backend `.env` file updated with DATABASE_URL
4. ✅ Run `npm run prisma:generate` in backend
5. ✅ Run `npm run prisma:migrate` in backend
6. ✅ Start backend: `npm run dev`
7. ✅ Start frontend: `cd frontend && npm run dev`

---

## Need Help?

If you encounter issues:
1. Check PostgreSQL service is running
2. Verify DATABASE_URL format in `.env`
3. Check PostgreSQL logs
4. Ensure port 5432 is not blocked by firewall

