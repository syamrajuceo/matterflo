# ERP Builder - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Database Setup](#database-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling](#scaling)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: 20.x LTS or higher
- **PostgreSQL**: 16.x or higher
- **Redis**: 7.x or higher (optional, for caching)
- **Docker**: 24.x or higher (for Docker deployment)
- **Docker Compose**: 2.x or higher

### Recommended Hardware (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB minimum, 16GB+ recommended
- **Storage**: 50GB+ SSD
- **Network**: Stable internet connection

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/erp-builder.git
cd erp-builder
```

### 2. Configure Environment Variables
Create `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

**Critical Environment Variables:**
```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/erp_builder

# JWT Secret (MUST change in production)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Origin (Frontend URL)
CORS_ORIGIN=https://your-domain.com

# Frontend API URL
VITE_API_URL=https://api.your-domain.com/api

# Redis (Optional, for caching)
REDIS_URL=redis://localhost:6379

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
```

## Docker Deployment (Recommended)

### 1. Quick Start
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Access the Application
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Stop Services
```bash
docker-compose down
```

### 4. Update and Restart
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

## Manual Deployment

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
npm ci --only=production
```

#### 2. Generate Prisma Client
```bash
npx prisma generate
```

#### 3. Run Database Migrations
```bash
npx prisma migrate deploy
```

#### 4. Build TypeScript
```bash
npm run build
```

#### 5. Start Backend
```bash
npm start
```

#### 6. Setup PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name erp-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm ci --only=production
```

#### 2. Build for Production
```bash
npm run build
```

#### 3. Serve with Nginx

**Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**Configure Nginx:**
Create `/etc/nginx/sites-available/erp-builder`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/erp-builder/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/erp-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Database Setup

### 1. Create PostgreSQL User and Database
```bash
sudo -u postgres psql

CREATE DATABASE erp_builder;
CREATE USER erp_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE erp_builder TO erp_user;
\q
```

### 2. Run Migrations
```bash
cd backend
DATABASE_URL="postgresql://erp_user:your_secure_password@localhost:5432/erp_builder" npx prisma migrate deploy
```

### 3. Seed Data (Optional)
```bash
npm run seed
```

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

#### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### 2. Obtain Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 3. Auto-Renewal
Certbot automatically sets up a cron job. Test renewal:
```bash
sudo certbot renew --dry-run
```

## Monitoring & Logging

### Application Logs
- **Backend logs**: `backend/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **PM2 logs**: `~/.pm2/logs/`

### View Logs
```bash
# Backend logs (PM2)
pm2 logs erp-backend

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks
- **Backend**: http://your-domain.com/health
- **Database**: `SELECT 1;` query

## Backup & Recovery

### Database Backup

#### Manual Backup
```bash
pg_dump -U erp_user -h localhost erp_builder > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Automated Daily Backups
Create `/etc/cron.daily/erp-backup`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/erp-builder"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U erp_user -h localhost erp_builder | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Make it executable:
```bash
sudo chmod +x /etc/cron.daily/erp-backup
```

### Restore Database
```bash
psql -U erp_user -h localhost erp_builder < backup_20240101_120000.sql
```

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

#### 1. Use Load Balancer (Nginx)
```nginx
upstream backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

#### 2. Start Multiple Instances
```bash
PORT=3000 pm2 start dist/server.js --name erp-backend-1
PORT=3001 pm2 start dist/server.js --name erp-backend-2
PORT=3002 pm2 start dist/server.js --name erp-backend-3
```

### Database Scaling
- **Read Replicas**: Configure PostgreSQL replication
- **Connection Pooling**: Already configured in Prisma
- **Caching**: Use Redis for frequently accessed data

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Check connection
psql -U erp_user -h localhost -d erp_builder
```

#### 2. Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Nginx 502 Bad Gateway
```bash
# Check backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

#### 4. Frontend Shows API Errors
- Verify `VITE_API_URL` is correct
- Check CORS_ORIGIN in backend `.env`
- Verify backend is accessible

### Performance Issues

#### 1. Slow Database Queries
```bash
# Enable query logging in PostgreSQL
sudo nano /etc/postgresql/16/main/postgresql.conf

# Add:
log_statement = 'all'
log_duration = on

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 2. High Memory Usage
```bash
# Check memory usage
free -h
pm2 monit

# Restart services
pm2 restart all
```

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban for SSH
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Environment variables secured

## Support

For issues and questions:
- **GitHub Issues**: https://github.com/your-org/erp-builder/issues
- **Documentation**: https://docs.your-domain.com
- **Email**: support@your-domain.com

---

**Last Updated**: December 2024

