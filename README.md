# Team Management SaaS

A complete multi-tenant team management platform with role-based access control, billing, and analytics.

## ✨ Features

- **5-Role RBAC System**: SuperAdmin, Admin, OrgOwner, OrgAdmin, OrgMember
- **Multi-Tenant Architecture**: Each organization is isolated with its own teams and members
- **Stripe Integration**: Subscription plans with automatic billing
- **Self-Service Registration**: Users create organizations and invite members
- **Admin Portal**: Platform admins can create and manage organizations
- **Real-Time Analytics**: Track users, teams, and platform metrics
- **Email Notifications**: Automated invitations and setup emails

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>

# Start all services with Docker
bash dev.sh docker

# Or run individually
cd team-management-backend && npm install && npm run dev
cd team-management-frontend && npm install && npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## 🏗️ Architecture

**Backend**: Express + TypeScript + MongoDB + Redis  
**Frontend**: React + TypeScript + Redux Toolkit + Shadcn/UI  
**Payments**: Stripe  
**Email**: Nodemailer (SMTP)

## 👥 Role Hierarchy

| Role | Description | Key Permissions |
|------|-------------|----------------|
| **SuperAdmin** | Platform Owner | Full system access |
| **Admin** | Platform Admin | Manage all organizations |
| **OrgOwner** | Organization Owner | Full org control + billing |
| **OrgAdmin** | Organization Admin | Manage teams (no billing) |
| **OrgMember** | Regular Member | View-only access |

## 💳 Subscription Plans

| Plan | Users | Teams | Storage | Price |
|------|-------|-------|---------|-------|
| Free | 5 | 3 | 1GB | $0 |
| Professional | 50 | 20 | 50GB | $29/mo |
| Business | 200 | 100 | 500GB | $99/mo |
| Enterprise | ∞ | ∞ | ∞ | Custom |

## 📦 Environment Setup

**Backend** (`.env`)
```env
DATABASE_URL=mongodb://localhost:27017/team-management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## 🔑 Key API Endpoints

```
POST   /api/v1/auth/register              # Self-service signup
POST   /api/v1/auth/login                 # Login
GET    /api/v1/organizations              # Get organizations
POST   /api/v1/teams                      # Create team
POST   /api/v1/invitations/send           # Invite member
POST   /api/v1/billing/create-checkout    # Upgrade plan
GET    /api/v1/analytics/platform         # Platform stats
```

## 🧪 Testing Workflow

1. **SuperAdmin** → Create Admin accounts
2. **Admin** → Create organizations for clients
3. **OrgOwner** → Invite members, manage billing
4. **OrgAdmin** → Create teams, assign members
5. **OrgMember** → View teams and collaborate

## 🛠️ Tech Stack

**Backend**: Express.js, TypeScript, MongoDB, Redis, Zod, JWT, Stripe  
**Frontend**: React, Redux Toolkit, Tailwind CSS v4, Shadcn/UI, React Router

## 📝 Development

```bash
# Run migrations
npm run migrate:roles

# Start backend dev
cd team-management-backend
npm run dev

# Start frontend dev
cd team-management-frontend
npm run dev
```

## 🚢 Deployment

- **Backend**: Deploy to Vercel
- **Frontend**: Deploy to Vercel
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud

