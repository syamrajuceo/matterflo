# Quick PostgreSQL Installation Guide

## ✅ Current Status
- ✅ Backend `.env` file configured
- ❌ PostgreSQL not installed
- ❌ Docker not available

---

## 🚀 Easiest Option: Install PostgreSQL Locally

### Step 1: Download PostgreSQL Installer

**Option A: Official Installer (Recommended)**
- Visit: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- Select: **Windows x86-64** → **PostgreSQL 16.x**
- Download the installer (about 200MB)

**Option B: Using Chocolatey (If you have it)**
```powershell
choco install postgresql16
```

### Step 2: Install PostgreSQL

1. Run the downloaded installer
2. **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\16`)
3. **Data Directory**: Keep default (`C:\Program Files\PostgreSQL\16\data`)
4. **Password**: Set a password for `postgres` user (remember this!)
   - **Recommended**: Use `postgres` for development (matches your .env)
5. **Port**: Keep default `5432`
6. **Advanced Options**: Keep defaults
7. **Pre Installation Summary**: Click Next
8. **Ready to Install**: Click Next
9. Wait for installation to complete

### Step 3: Verify Installation

After installation, PostgreSQL service should start automatically. Verify:

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Should show something like:
# postgresql-x64-16    Running    PostgreSQL 16 Database Server
```

### Step 4: Create Database

Open **Command Prompt** or **PowerShell** and run:

```powershell
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\16\bin"

# Connect to PostgreSQL (will prompt for password)
.\psql.exe -U postgres

# Enter password when prompted (the one you set during installation)
# Then run:
CREATE DATABASE erp_builder;

# Exit psql
\q
```

**OR** use pgAdmin (GUI tool installed with PostgreSQL):
1. Open **pgAdmin 4** from Start Menu
2. Connect to PostgreSQL server (password you set)
3. Right-click "Databases" → Create → Database
4. Name: `erp_builder`
5. Click Save

### Step 5: Update Backend .env (if needed)

Your `.env` already has:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_builder
```

**If you used a different password**, update it:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/erp_builder
```

### Step 6: Run Database Migrations

```powershell
cd C:\Users\Goutham\Downloads\matterflo\matterflo\backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Start the backend
npm run dev
```

---

## 🔄 Alternative: Use Docker (If You Install Docker Desktop)

If you prefer Docker:

1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Start Docker Desktop**
3. **Run this command**:
   ```powershell
   cd C:\Users\Goutham\Downloads\matterflo\matterflo
   docker compose up -d postgres redis
   ```
4. This automatically:
   - Downloads PostgreSQL image
   - Creates `erp_builder` database
   - Sets up with default credentials (postgres/postgres)
   - No manual database creation needed!

---

## ✅ Quick Verification

After PostgreSQL is installed, verify everything works:

```powershell
# 1. Check PostgreSQL service
Get-Service -Name postgresql*

# 2. Test connection (will prompt for password)
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql.exe -U postgres -d erp_builder

# If connection works, you'll see:
# erp_builder=#

# Type \q to exit
```

---

## 🆘 Troubleshooting

### Service Not Running
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-16

# Or use Services GUI
services.msc
# Find "postgresql-x64-16" → Right-click → Start
```

### Can't Connect
- Verify password matches `.env` file
- Check if port 5432 is available: `netstat -ano | findstr :5432`
- Ensure PostgreSQL service is running

### Database Already Exists Error
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Drop and recreate (WARNING: Deletes all data!)
DROP DATABASE IF EXISTS erp_builder;
CREATE DATABASE erp_builder;
\q
```

---

## 📝 Summary

**What you need:**
1. ✅ PostgreSQL 16.x installed
2. ✅ Database `erp_builder` created
3. ✅ Backend `.env` configured (already done!)
4. ✅ Run `npm run prisma:migrate` in backend
5. ✅ Start backend: `npm run dev`

**Download PostgreSQL:** https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

