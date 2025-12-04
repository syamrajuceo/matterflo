# 🚀 QUICK START GUIDE
# Start Building Your ERP Builder in 15 Minutes

**This guide gets you from zero to first working feature as fast as possible.**

---

## ⚡ Prerequisites Check (5 minutes)

### Required Software
```bash
# Check Node.js (need 20.x)
node --version

# Check npm
npm --version

# Check PostgreSQL (need 16.x)
psql --version

# Check Redis (need 7.x)
redis-cli --version

# Check Git
git --version
```

**Don't have them? Install now:**
- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/download/
- Git: https://git-scm.com/downloads

---

## 📁 Project Setup (5 minutes)

### Step 1: Create Project Structure
```bash
# Create main folder
mkdir erp-builder
cd erp-builder

# Create subfolders
mkdir backend frontend docs

# Initialize git
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "dist/" >> .gitignore
echo "build/" >> .gitignore
```

### Step 2: Copy Documentation
```bash
# Place all .md files in docs/
cp 00_MASTER_INDEX.md docs/
cp 01_TECHNICAL_ARCHITECTURE.md docs/
cp 02_DATABASE_SCHEMA.md docs/
cp 03_MEGA_PROMPT_PART2.md docs/
```

---

## 🔧 Backend Setup (3 minutes)

### Step 1: Initialize Backend
```bash
cd backend

# Create package.json
npm init -y

# Install dependencies
npm install express cors dotenv bcrypt jsonwebtoken
npm install @prisma/client
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken
npm install -D ts-node nodemon prisma

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init
```

### Step 2: Configure Prisma

**backend/prisma/schema.prisma** - Copy from `02_DATABASE_SCHEMA.md`

**backend/.env:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/erpbuilder?schema=public"
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
```

### Step 3: Run Database Migration
```bash
# Create database
createdb erpbuilder

# OR if using psql:
psql -U postgres
CREATE DATABASE erpbuilder;
\q

# Run migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Step 4: Update package.json scripts
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## 🎨 Frontend Setup (2 minutes)

### Step 1: Create React App with Vite
```bash
cd ../frontend

# Create Vite app with React + TypeScript
npm create vite@latest . -- --template react-ts

# Install when prompted
npm install

# Install additional dependencies
npm install react-router-dom axios zustand
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react

# Initialize Tailwind
npx tailwindcss init -p
```

### Step 2: Configure Tailwind

**frontend/tailwind.config.js:**
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#1A1F2E',
      }
    },
  },
  plugins: [],
}
```

**frontend/src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🚀 First Feature - Authentication (Using Cursor)

### Step 1: Open in Cursor
```bash
# From project root
code .
```

### Step 2: Create .cursorrules File

**Create `.cursorrules` in project root:**
```
# ERP Builder Project Rules

## Tech Stack
- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + TypeScript + Vite + Tailwind
- Database: PostgreSQL
- Cache: Redis

## Coding Standards
- Use TypeScript strict mode
- Use async/await (not callbacks)
- Use functional components (React)
- Use arrow functions
- Always add error handling
- Always add TypeScript types

## File Naming
- Files: kebab-case (auth.service.ts)
- Components: PascalCase (LoginForm.tsx)
- Variables: camelCase

## Import Order
1. External packages
2. Internal modules
3. Types
4. Styles

## API Response Format
{
  "success": boolean,
  "data": any,
  "error": { "code": string, "message": string }
}
```

### Step 3: Use Cursor to Generate Auth Backend

**Copy this prompt to Cursor:**
```
Create authentication system in backend/src/modules/auth/:

Files to create:
1. auth.types.ts - TypeScript interfaces
2. auth.service.ts - Business logic
3. auth.controller.ts - Route handlers
4. auth.middleware.ts - JWT verification
5. auth.routes.ts - Express routes

auth.types.ts:
- IUser interface
- ILoginRequest interface
- IRegisterRequest interface
- IAuthResponse interface

auth.service.ts:
- register(email, password, firstName, lastName)
- login(email, password)
- verifyToken(token)
Use bcrypt for password hashing
Use jsonwebtoken for JWT
Hash password with 10 rounds

auth.controller.ts:
- POST /register - Create new user
- POST /login - Login user
Return JWT token on success

auth.middleware.ts:
- authenticateToken - Express middleware
- Extract token from Authorization header
- Verify and decode JWT
- Attach user to req.user

auth.routes.ts:
- Define routes
- Use express.Router()
- Export router

Also create:
backend/src/app.ts - Express app setup with CORS and JSON parser
backend/src/server.ts - Start server on PORT from .env

Use error handling
Return proper HTTP status codes
```

### Step 4: Test Backend
```bash
cd backend
npm run dev

# Should see: Server running on port 3000
```

### Step 5: Use Cursor to Generate Auth Frontend

**Copy this prompt to Cursor:**
```
Create authentication UI in frontend/src/features/auth/:

Files to create:
1. components/LoginForm.tsx
2. components/RegisterForm.tsx
3. services/auth.service.ts
4. store/authStore.ts
5. types/auth.types.ts

LoginForm.tsx:
- Email and password inputs
- Submit button
- Use react-hook-form
- Call login API
- Store token in localStorage
- Redirect to /dashboard on success
- Show errors

RegisterForm.tsx:
- Email, password, firstName, lastName inputs
- Submit button
- Use react-hook-form
- Call register API
- Redirect to login on success

auth.service.ts:
- login(email, password) - Call POST /api/auth/login
- register(data) - Call POST /api/auth/register
- logout() - Clear localStorage
Use axios

authStore.ts:
- Use zustand
- State: user, token, isAuthenticated
- Actions: setUser, setToken, logout

Also update:
frontend/src/App.tsx:
- Add React Router
- Route / -> LoginForm
- Route /register -> RegisterForm
- Route /dashboard -> Dashboard (protected)

Style with Tailwind CSS
Dark theme (#1A1F2E background)
Blue accent (#3B82F6)
```

### Step 6: Test Frontend
```bash
cd frontend
npm run dev

# Open http://localhost:5173
# Should see login form
```

### Step 7: Manual Testing
```
1. Register new user
   - Fill form
   - Click register
   - Should redirect to login

2. Login
   - Enter credentials
   - Click login
   - Should redirect to dashboard

3. Check localStorage
   - Should see token stored
```

---

## 🧪 First Test - Verify Everything Works

### Test Backend API
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Should return: {"success":true,"data":{"token":"..."}}

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123"
  }'

# Should return: {"success":true,"data":{"token":"..."}}
```

### Test Frontend
```
1. Open http://localhost:5173
2. Click "Register" link
3. Fill form and register
4. Should redirect to login
5. Login with credentials
6. Should redirect to dashboard
```

---

## ✅ Success Checklist

After completing Quick Start, you should have:

- [x] Project structure created
- [x] Backend initialized
- [x] Frontend initialized
- [x] Database created and migrated
- [x] .cursorrules file created
- [x] Authentication backend working
- [x] Authentication frontend working
- [x] Successful registration test
- [x] Successful login test
- [x] Token stored in localStorage

---

## 🎯 What's Next?

Now that you have the foundation working:

### Option 1: Continue with Cursor (Recommended)
1. Open `03_MEGA_PROMPT_PART2.md`
2. But FIRST: You need `04_MEGA_PROMPT_PART1.md` for Days 1-41
3. Request creation of Part 1 which includes:
   - Task Builder backend
   - Task Builder frontend
   - Flow Builder backend

### Option 2: Build One Feature Manually
Pick one feature and build it yourself to understand the patterns:
- Task Builder OR
- Simple CRUD module (Users, Departments)

### Option 3: Start from Day 42 (If You're Comfortable)
- Jump to `03_MEGA_PROMPT_PART2.md`
- Start with Flow Builder frontend (Prompt 3.3)
- But you'll need to have Task Builder already done

---

## 💡 Pro Tips

### Cursor Usage Tips
1. **Be specific:** The more details, the better code
2. **One feature at a time:** Don't try to build everything at once
3. **Review everything:** AI makes mistakes, always review
4. **Test immediately:** Don't accumulate untested code
5. **Commit often:** Git is your safety net

### Development Tips
1. **Keep backend running:** `npm run dev` in one terminal
2. **Keep frontend running:** `npm run dev` in another terminal
3. **Keep database running:** PostgreSQL and Redis services
4. **Check logs:** Watch console for errors
5. **Use Prisma Studio:** `npx prisma studio` to view database

### Debugging Tips
1. **Backend not starting?** Check .env file, check database connection
2. **Frontend not starting?** Clear node_modules, npm install again
3. **API not working?** Check CORS, check request format
4. **Database error?** Check Prisma schema, run migration again
5. **Cursor not working?** Restart VS Code, check .cursorrules file

---

## 📚 Essential Commands Reference

### Backend
```bash
# Start development server
npm run dev

# Run Prisma Studio (database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name feature_name

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma Client (after schema change)
npx prisma generate
```

### Frontend
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git
```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "feat: add authentication"

# View log
git log --oneline

# Create branch
git checkout -b feature/task-builder

# Switch branch
git checkout main
```

### Database
```bash
# Create database
createdb erpbuilder

# Drop database (careful!)
dropdb erpbuilder

# Connect to database
psql erpbuilder

# Inside psql:
\dt        # List tables
\d users   # Describe table
SELECT * FROM users;  # Query
\q         # Quit
```

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Cannot connect to database"
```bash
# Fix: Check if PostgreSQL is running
# Mac:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
# Start PostgreSQL service from Services app
```

### Issue: "Port 3000 already in use"
```bash
# Fix: Kill process on port 3000
# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

### Issue: "Module not found"
```bash
# Fix: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Prisma Client not generated"
```bash
# Fix: Generate Prisma Client
npx prisma generate
```

### Issue: "CORS error in frontend"
```bash
# Fix: Check backend CORS config
# In backend/src/app.ts:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## 📈 Progress Tracker

### Day 1 ✅
- [x] Environment setup
- [x] Project structure
- [x] Backend initialized
- [x] Frontend initialized
- [x] Database created
- [x] Authentication working

### Day 2-7 (Upcoming)
- [ ] Task Builder backend
- [ ] Task Builder frontend
- [ ] Basic CRUD operations
- [ ] File upload
- [ ] Form validation

---

## 🎉 Congratulations!

If you've completed this guide, you now have:
- ✅ Working development environment
- ✅ Backend API with authentication
- ✅ Frontend with login/register
- ✅ Database with Prisma ORM
- ✅ Understanding of project structure

**You're ready to build the full ERP Builder!**

---

## 📞 Need Help?

1. **Check documentation:**
   - `00_MASTER_INDEX.md` - Overview
   - `01_TECHNICAL_ARCHITECTURE.md` - System design
   - `02_DATABASE_SCHEMA.md` - Database

2. **Review your code:**
   - Check console logs
   - Check network tab
   - Check database with Prisma Studio

3. **Use Cursor:**
   - Ask Cursor to debug
   - Ask Cursor to explain code
   - Ask Cursor to add console.logs

4. **Search online:**
   - Stack Overflow
   - Official docs
   - GitHub issues

---

## 🚀 Ready to Continue?

**Next step:** Request creation of `04_MEGA_PROMPT_PART1.md` which will guide you through Days 1-41:
- Complete authentication features
- Task Builder backend implementation
- Task Builder frontend with drag-and-drop
- Form validation and testing
- File uploads

**Then:** Use `03_MEGA_PROMPT_PART2.md` for Days 42-90:
- Flow Builder
- Trigger System
- Event Bus
- Condition Builder
- Action Builder

---

**Happy Coding!** 🎯
