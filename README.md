# ERP Builder - Enterprise Resource Planning System

A modern, full-stack ERP system built with React, TypeScript, Node.js, and PostgreSQL. Design custom workflows, automate business processes, and manage your organization with ease.

[![CI/CD](https://github.com/your-org/erp-builder/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/erp-builder/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🎨 **Visual Workflow Builder**
- Drag-and-drop flow designer
- Multi-level approval workflows
- Conditional branching logic
- Role-based task assignments

### 📋 **Dynamic Form Builder**
- 15+ field types (text, number, date, file upload, signatures, etc.)
- Conditional field logic
- Field validations
- Form versioning

### 🔄 **Automation & Triggers**
- Event-based automation
- Webhook integrations
- Email notifications
- Database actions
- Custom API calls

### 📊 **Custom Databases**
- Visual table designer
- Multiple field types
- Relationships & foreign keys
- CSV import/export
- RESTful API auto-generation

### 📈 **Dataset Builder & Reporting**
- Custom dashboards
- Charts & visualizations (Recharts)
- Table views
- Data cards
- Real-time updates

### 🏢 **Company Hierarchy Management**
- Department tree structure
- Role & permission management
- User assignments
- Drag-and-drop organization

### 🔗 **Integrations**
- Webhook endpoints
- Gmail integration
- Custom API connectors
- Workflow triggers

### 📜 **Audit Logs**
- Complete activity tracking
- User action logs
- System events
- Export capabilities

### 👥 **Client Portal**
- Task completion interface
- Flow tracking
- Progress visualization
- Clean, simple UI

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.x or higher
- **PostgreSQL** 16.x or higher
- **npm** or **yarn**

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/your-org/erp-builder.git
cd erp-builder
```

#### 2. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database URL
# For Docker Compose: Use port 5433 (to avoid conflicts with local PostgreSQL)
# For Local PostgreSQL: Use port 5432 (default)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/erp_builder?schema=public

JWT_SECRET=your-secret-key-min-32-characters
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
```

#### 3. Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 4. Set up database
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

#### 5. Start development servers
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

#### 6. Access the application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

### Default Credentials
Create your first admin account through the registration page.

## 📦 Docker Deployment

### Quick Start with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5433 (external port, internal is 5432)
- **Redis**: localhost:6379

**Note:** PostgreSQL is exposed on port 5433 externally to avoid conflicts with locally installed PostgreSQL. Update your `backend/.env` file accordingly:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/erp_builder?schema=public
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

## 🏗️ Architecture

### Tech Stack

#### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 16.x
- **Cache**: Redis 7.x
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit
- **Logging**: Winston

#### Frontend
- **Framework**: React 19.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 7.x
- **State Management**: Zustand 5.x
- **Routing**: React Router v7
- **UI Components**: Radix UI + Tailwind CSS
- **Styling**: Tailwind CSS 4.x
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

### Project Structure
```
erp-builder/
├── backend/                # Node.js backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── flows/
│   │   │   ├── triggers/
│   │   │   ├── database/
│   │   │   ├── datasets/
│   │   │   ├── company/
│   │   │   ├── integrations/
│   │   │   ├── audit/
│   │   │   ├── client/
│   │   │   └── execution/
│   │   ├── common/        # Shared utilities
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── errors/
│   │   ├── app.ts         # Express app setup
│   │   └── server.ts      # Server entry point
│   ├── prisma/            # Database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/              # React frontend
│   ├── src/
│   │   ├── features/      # Feature modules
│   │   │   ├── auth/
│   │   │   ├── task-builder/
│   │   │   ├── flow-builder/
│   │   │   ├── trigger-builder/
│   │   │   ├── database-builder/
│   │   │   ├── dataset-builder/
│   │   │   ├── company/
│   │   │   ├── integrations/
│   │   │   ├── audit-logs/
│   │   │   └── client-portal/
│   │   ├── components/    # Shared components
│   │   │   ├── ui/        # Shadcn components
│   │   │   └── shared/    # App-wide components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml      # CI/CD pipeline
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## 🔒 Security Features

- **Authentication**: JWT-based auth with secure password hashing (bcrypt)
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for secure HTTP headers
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and CSP headers
- **CORS**: Configurable CORS policies
- **Error Handling**: Centralized error handling (no stack traces in production)

## 📖 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Flows
- `GET /api/flows` - List all flows
- `POST /api/flows` - Create new flow
- `GET /api/flows/:id` - Get flow by ID
- `PUT /api/flows/:id` - Update flow
- `DELETE /api/flows/:id` - Delete flow

#### Executions
- `GET /api/executions/tasks/my-tasks` - Get my pending tasks
- `PUT /api/executions/tasks/:id` - Submit task completion
- `GET /api/executions/flows/my-flows` - Get my flow instances

See full API documentation at `/api/docs` (Swagger UI) when running the server.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📊 Performance

- **Load Time**: < 2s on 4G connection
- **Time to Interactive**: < 3s
- **API Response Time**: < 100ms (p95)
- **Database Queries**: Optimized with proper indexes
- **Caching**: Redis for hot data
- **Bundle Size**: Code splitting with Vite

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow existing code patterns
- Use TypeScript strict mode
- Add tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Prisma](https://www.prisma.io/) for excellent ORM
- [React](https://react.dev/) for the UI framework
- [Express](https://expressjs.com/) for the backend framework

## 📞 Support

- **Documentation**: [docs.your-domain.com](https://docs.your-domain.com)
- **GitHub Issues**: [github.com/your-org/erp-builder/issues](https://github.com/your-org/erp-builder/issues)
- **Email**: support@your-domain.com
- **Discord**: [Join our community](https://discord.gg/your-invite)

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered workflow suggestions
- [ ] Multi-language support (i18n)
- [ ] Advanced reporting engine
- [ ] Marketplace for templates
- [ ] SSO integration (OAuth, SAML)
- [ ] Offline mode support

---

**Made with ❤️ by the ERP Builder Team**

Last updated: December 2024

