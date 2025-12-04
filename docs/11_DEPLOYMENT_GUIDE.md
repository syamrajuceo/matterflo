# DEPLOYMENT GUIDE
# ERP Builder - Production Deployment

**Version:** 1.0  
**Target Environment:** Production  
**Est. Deployment Time:** 4-6 hours

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Requirements](#server-requirements)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Environment Variables](#environment-variables)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring Setup](#monitoring-setup)
11. [Backup Strategy](#backup-strategy)
12. [Rollback Plan](#rollback-plan)

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage >80%
- [ ] No ESLint/TypeScript errors
- [ ] Security audit completed
- [ ] Performance tests passed
- [ ] Documentation updated

### Infrastructure
- [ ] Server provisioned
- [ ] Domain registered
- [ ] DNS configured
- [ ] SSL certificate obtained
- [ ] Database created
- [ ] Redis installed
- [ ] Backup system configured

### Configuration
- [ ] Production environment variables set
- [ ] API keys secured
- [ ] SMTP configured for emails
- [ ] Monitoring tools configured
- [ ] Log aggregation configured

---

## 🖥️ Server Requirements

### Minimum Requirements (Phase 1)

**Application Server:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS

**Database Server** (can be same as app server initially):
- CPU: 2 cores
- RAM: 4 GB
- Storage: 100 GB SSD

**Recommended for Production:**
- CPU: 8 cores
- RAM: 16 GB
- Storage: 200 GB SSD
- Load balancer (for scaling)

---

## 🗄️ Database Setup

### Install PostgreSQL

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16 -y

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE erpbuilder;
postgres=# CREATE USER erpbuilder_user WITH ENCRYPTED PASSWORD 'your-secure-password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE erpbuilder TO erpbuilder_user;
postgres=# \q
```

### Configure PostgreSQL

**Edit:** `/etc/postgresql/16/main/postgresql.conf`

```conf
# Performance tuning
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 6MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
```

**Edit:** `/etc/postgresql/16/main/pg_hba.conf`

```conf
# Allow connections from app server
host    erpbuilder    erpbuilder_user    127.0.0.1/32    md5
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Install Redis

```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

## 🔧 Backend Deployment

### Install Node.js

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Deploy Backend

```bash
# Create app directory
sudo mkdir -p /var/www/erp-builder
sudo chown $USER:$USER /var/www/erp-builder
cd /var/www/erp-builder

# Clone repository
git clone https://github.com/your-repo/erp-builder.git .
cd backend

# Install dependencies
npm install --production

# Set up environment variables
cp .env.example .env
nano .env
```

### Environment Variables (.env)

```env
# Node
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://erpbuilder_user:your-secure-password@localhost:5432/erpbuilder"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-change-this"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="https://yourdomain.com"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="ERP Builder <noreply@yourdomain.com>"

# File Upload
FILE_UPLOAD_PATH="/var/www/erp-builder/uploads"
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL="info"
LOG_FILE="/var/www/erp-builder/logs/app.log"
```

### Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate deploy

# Seed database (optional)
npm run seed
```

### Build Backend

```bash
# Build TypeScript
npm run build

# Test build
node dist/server.js
# Should start without errors
```

### Set Up PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'erp-builder-backend',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

```bash
# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions shown

# Check status
pm2 status
pm2 logs
```

---

## 🎨 Frontend Deployment

### Build Frontend

```bash
cd /var/www/erp-builder/frontend

# Install dependencies
npm install

# Create production environment file
nano .env.production
```

**.env.production:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=ERP Builder
VITE_APP_VERSION=1.0.0
```

```bash
# Build for production
npm run build

# Build output will be in dist/ folder
ls -la dist/
```

---

## 🌐 Nginx Configuration

### Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configure Nginx

**Create backend config:** `/etc/nginx/sites-available/erp-builder-backend`

```nginx
# Backend API
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # API endpoint
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer sizes
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # File uploads endpoint
    location /uploads {
        alias /var/www/erp-builder/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

**Create frontend config:** `/etc/nginx/sites-available/erp-builder-frontend`

```nginx
# Frontend Application
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/erp-builder/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main application
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/erp-builder-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/erp-builder-frontend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/TLS Setup

### Install Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain SSL Certificates

```bash
# Get certificates for both domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

### Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot will automatically renew certificates before expiration
# Check cron job
sudo systemctl status certbot.timer
```

### Final Nginx Configuration (with SSL)

Certbot will automatically update your Nginx configs. Verify:

```bash
sudo nano /etc/nginx/sites-available/erp-builder-backend

# Should now have:
# listen 443 ssl;
# ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
```

---

## 🔑 Environment Variables Security

### Secure Environment Files

```bash
# Set correct permissions
chmod 600 /var/www/erp-builder/backend/.env

# Set ownership
sudo chown www-data:www-data /var/www/erp-builder/backend/.env
```

### Use Secrets Manager (Optional)

For enhanced security, use a secrets manager:

**AWS Secrets Manager:**
```javascript
// Load secrets at runtime
const AWS = require('aws-sdk');
const client = new AWS.SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName) {
  const data = await client.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}
```

**HashiCorp Vault:**
```javascript
const vault = require('node-vault')({
  endpoint: 'https://vault.yourdomain.com',
  token: process.env.VAULT_TOKEN
});

async function getSecret(path) {
  const result = await vault.read(path);
  return result.data;
}
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### Create Workflow File

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies (Backend)
        run: |
          cd backend
          npm install
      
      - name: Run tests (Backend)
        run: |
          cd backend
          npm test
      
      - name: Install dependencies (Frontend)
        run: |
          cd frontend
          npm install
      
      - name: Run tests (Frontend)
        run: |
          cd frontend
          npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/erp-builder
            git pull origin main
            cd backend
            npm install --production
            npm run build
            npm run prisma:generate
            npm run prisma:migrate deploy
            pm2 restart erp-builder-backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/erp-builder/frontend/"
          strip_components: 2

  notify:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Slack Notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Set up GitHub Secrets

In GitHub repository settings, add:
- `SERVER_HOST`: Your server IP or domain
- `SERVER_USER`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key
- `SLACK_WEBHOOK`: (Optional) For notifications

---

## 📊 Monitoring Setup

### Install Monitoring Tools

```bash
# Install monitoring dependencies
npm install -g pm2-logrotate
pm2 install pm2-logrotate
```

### Application Monitoring

**Add health check endpoint** in backend:

```typescript
// backend/src/routes/health.routes.ts
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: 'checking...',
      redis: 'checking...'
    }
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'connected';
  } catch (error) {
    health.checks.database = 'disconnected';
    health.status = 'ERROR';
  }

  try {
    // Check Redis
    await redis.ping();
    health.checks.redis = 'connected';
  } catch (error) {
    health.checks.redis = 'disconnected';
    health.status = 'ERROR';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Set Up Uptime Monitoring

**Use UptimeRobot or similar:**
1. Monitor `https://api.yourdomain.com/health`
2. Alert if down for >5 minutes
3. Check every 5 minutes

### Log Aggregation

**Using PM2 logs:**
```bash
# View logs
pm2 logs erp-builder-backend

# Save logs
pm2 logs erp-builder-backend --out /var/log/erp-builder/app.log
```

**Or use external service:**
- Datadog
- Loggly
- Papertrail

---

## 💾 Backup Strategy

### Database Backups

**Create backup script:** `/usr/local/bin/backup-erp-db.sh`

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/erp-builder/postgresql"
DB_NAME="erpbuilder"
DB_USER="erpbuilder_user"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/erpbuilder_$TIMESTAMP.sql.gz"

# Create backup
PGPASSWORD="your-secure-password" pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -name "erpbuilder_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log result
if [ -f "$BACKUP_FILE" ]; then
    echo "Backup successful: $BACKUP_FILE"
else
    echo "Backup failed!" >&2
    exit 1
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-erp-db.sh

# Set up cron job (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-erp-db.sh >> /var/log/erp-backup.log 2>&1
```

### File Backups

```bash
# Backup uploads folder
sudo rsync -avz /var/www/erp-builder/uploads/ /var/backups/erp-builder/uploads/
```

### Automated Offsite Backup

**Using AWS S3:**
```bash
# Install AWS CLI
sudo apt install awscli -y

# Configure AWS credentials
aws configure

# Upload to S3
aws s3 sync /var/backups/erp-builder/ s3://your-bucket/erp-builder-backups/
```

---

## 🔙 Rollback Plan

### Rollback Procedure

**1. Identify the issue:**
```bash
# Check application logs
pm2 logs erp-builder-backend --lines 100

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
```

**2. Rollback code:**
```bash
cd /var/www/erp-builder

# Check recent commits
git log --oneline -10

# Rollback to previous version
git checkout <previous-commit-hash>

# Rebuild
cd backend
npm install
npm run build

# Restart
pm2 restart erp-builder-backend
```

**3. Rollback database (if needed):**
```bash
# Find backup
ls -lh /var/backups/erp-builder/postgresql/

# Restore backup
gunzip -c /var/backups/erp-builder/postgresql/erpbuilder_20240120_020000.sql.gz | \
  PGPASSWORD="your-password" psql -h localhost -U erpbuilder_user erpbuilder
```

**4. Verify rollback:**
```bash
# Check health
curl https://api.yourdomain.com/health

# Check application
curl https://yourdomain.com

# Monitor logs
pm2 logs erp-builder-backend
```

---

## 🎯 Post-Deployment Verification

### Smoke Tests

```bash
# 1. Health check
curl https://api.yourdomain.com/health
# Expected: {"status":"OK"}

# 2. Frontend loads
curl -I https://yourdomain.com
# Expected: HTTP/2 200

# 3. API authentication works
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123!"}'
# Expected: {"success":true,"data":{"token":"..."}}

# 4. Database connection
pm2 logs erp-builder-backend --lines 10 | grep "Database connected"
# Expected: See "Database connected" message

# 5. Redis connection
redis-cli ping
# Expected: PONG
```

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API endpoint
ab -n 1000 -c 10 https://api.yourdomain.com/health

# Should handle >100 requests/sec
```

---

## 📱 Mobile Considerations (Future)

For Phase 2, when deploying mobile apps:

**PWA Configuration:**
- Add `manifest.json`
- Configure service worker
- Enable offline mode

**App Store Deployment:**
- iOS: Submit to App Store
- Android: Submit to Google Play

---

## ✅ Deployment Completion Checklist

- [ ] Server provisioned and configured
- [ ] PostgreSQL installed and configured
- [ ] Redis installed and configured
- [ ] Node.js installed
- [ ] Backend deployed and running
- [ ] Frontend built and deployed
- [ ] Nginx configured
- [ ] SSL certificates installed
- [ ] Environment variables secured
- [ ] PM2 configured for auto-restart
- [ ] Database migrations applied
- [ ] Backup system configured
- [ ] Monitoring configured
- [ ] Health checks working
- [ ] Smoke tests passed
- [ ] DNS records configured
- [ ] CI/CD pipeline configured
- [ ] Documentation updated

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: Backend won't start**
```bash
# Check logs
pm2 logs erp-builder-backend

# Check environment variables
cat /var/www/erp-builder/backend/.env

# Check database connection
psql -h localhost -U erpbuilder_user erpbuilder
```

**Issue: 502 Bad Gateway**
```bash
# Check if backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

**Production deployment guide complete!** 🚀

Your ERP Builder is now ready for production deployment.
