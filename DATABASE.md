# Database Management Guide

## 🗄️ Database Reset & Seeding

### Quick Commands

```bash
# Complete database reset (drops all collections)
npm run db:reset

# Seed SuperAdmin and Admin users
npm run seed:admin

# Reset + Seed in one command
npm run db:fresh
```

### Default Users After Reset

#### 1. SuperAdmin (Platform Owner)
- **Email:** `superadmin@teammanagement.com`
- **Password:** `superadmin123`
- **Role:** `SuperAdmin`
- **Access:** Complete system access

#### 2. Platform Admin
- **Email:** `admin@teammanagement.com`
- **Password:** `admin123`
- **Role:** `Admin`
- **Access:** Manage organizations and users

---

## 🔐 Security Notes

⚠️ **IMPORTANT:** Change default passwords immediately after first login!

### Password Requirements
- Minimum 6 characters (increase to 8+ in production)
- Use strong passwords in production environment
- Enable 2FA for SuperAdmin accounts

---

## 📊 Database Structure

### Collections Created
- `users` - All system users (SuperAdmin, Admin, OrgOwner, OrgAdmin, OrgMember)
- `organizations` - Organization details and settings
- `teams` - Team management within organizations
- `invitations` - Pending user invitations
- `notifications` - System notifications

---

## 🔄 Migration Commands

```bash
# Migrate existing users to new role system
npm run migrate:roles
```

---

## 🛠️ Manual Database Operations

### Connect to MongoDB Shell
```bash
docker exec -it team-mgmt-mongodb mongosh
```

### View All Databases
```bash
docker exec team-mgmt-mongodb mongosh --eval "show dbs"
```

### Check User Count
```bash
docker exec team-mgmt-mongodb mongosh team_management --eval "db.users.countDocuments()"
```

### View All Users
```bash
docker exec team-mgmt-mongodb mongosh team_management --eval "db.users.find().pretty()"
```

---

## 📝 Development Workflow

### Fresh Start
```bash
# 1. Reset database
npm run db:reset

# 2. Create admin users
npm run seed:admin

# 3. Start dev server
npm run dev
```

### Or use the combined command
```bash
npm run db:fresh && npm run dev
```

---

## 🐛 Troubleshooting

### "SuperAdmin already exists" error
Run `npm run db:reset` first, then `npm run seed:admin`

### MongoDB connection error
1. Check if Docker containers are running: `docker ps`
2. Restart containers: `docker-compose restart`

### Authentication error in MongoDB
The scripts use the connection string from `.env` file which includes credentials.

---

## 🔒 Production Considerations

1. **Never** use default passwords in production
2. Set strong `JWT_SECRET` in environment
3. Enable MongoDB authentication
4. Use environment-specific `.env` files
5. Regularly backup database
6. Monitor user activity logs

---

## 📚 Related Scripts

- `src/scripts/resetDatabase.ts` - Drops all collections
- `src/scripts/seedAdmin.ts` - Creates default users
- `src/scripts/migrate-roles.ts` - Migrates to new role system
