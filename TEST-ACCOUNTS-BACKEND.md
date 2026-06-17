# HR System - Test Login Credentials (Backend Integrated)

## ✅ Status: All 11 Test Accounts Active

The frontend now authenticates against the NestJS backend. All test accounts have been successfully seeded into the database.

---

## 🔐 Test User Accounts

### Super Admin
| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@hhc.com | Admin@2026 | Super Admin | ✅ Active |

### HR Administration
| Email | Password | Role | Employee Code | Status |
|-------|----------|------|---|---|
| maria.santos@hhc.com | Maria@2026 | Company Admin | HR-2026-001 | ✅ Active |
| carlos.reyes@hhc.com | Carlos@2026 | Company Admin | HR-2026-002 | ✅ Active |

### Finance & Accounting
| Email | Password | Role | Employee Code | Status |
|-------|----------|------|---|---|
| john.smith@hhc.com | John@2026 | Accountant | ACC-2026-003 | ✅ Active |
| emily.johnson@hhc.com | Emily@2026 | Accountant | ACC-2026-004 | ✅ Active |

### Accounts Payable & Receivable
| Email | Password | Role | Employee Code | Status |
|-------|----------|------|---|---|
| ang.santos@hhc.com | Angela@2026 | AP Clerk | AP-2026-005 | ✅ Active |
| robert.cruz@hhc.com | Robert@2026 | AR Clerk | AR-2026-006 | ✅ Active |

### Payroll & Audit
| Email | Password | Role | Employee Code | Status |
|-------|----------|------|---|---|
| patricia.flores@hhc.com | Patricia@2026 | Payroll Officer | PR-2026-007 | ✅ Active |
| michael.davis@hhc.com | Michael@2026 | Auditor | AUD-2026-008 | ✅ Active |
| diana.wilson@hhc.com | Diana@2026 | Viewer | VIEW-2026-009 | ✅ Active |
| thomas.anderson@hhc.com | Thomas@2026 | Viewer | VIEW-2026-010 | ✅ Active |

---

## 🚀 System Access

| Component | URL |
|-----------|-----|
| **Production Frontend** | https://hhc-hr-system-web.vercel.app |
| **Local Frontend** | http://localhost:4002 |
| **Local Backend API** | http://localhost:3001 |
| **Production Backend** | Connected via Vercel |

---

## 🔑 Password Pattern

All passwords follow: **FirstName@2026**

Examples:
- `Maria@2026` (for Maria Santos)
- `John@2026` (for John Smith)
- `Patricia@2026` (for Patricia Flores)

---

## 📋 Quick Login Steps

1. Go to: https://hhc-hr-system-web.vercel.app
2. Enter email: `maria.santos@hhc.com`
3. Enter password: `Maria@2026`
4. Click "Login"
5. Dashboard loads with HR Admin permissions

---

## 🛠️ Role Permissions

### Super Admin
✓ Full system access  
✓ Manage users and roles  
✓ System configuration  
✓ Override all restrictions  

### Company Admin (HR)
✓ Manage employees  
✓ Create user accounts  
✓ Assign roles  
✓ Close accounting periods  
✓ View all company data  

### Accountant
✓ Post journal entries  
✓ View general ledger  
✓ Create invoices  
✓ View financial reports  

### AP Clerk
✓ Create vendors  
✓ Create purchase bills  
✓ Create payments  
✓ View AP reports  

### AR Clerk
✓ Create customers  
✓ Create invoices  
✓ Create receipts  
✓ View AR reports  

### Payroll Officer
✓ Run payroll  
✓ View employees  
✓ Manage employees  
✓ View payroll reports  

### Auditor
✓ View all data  
✓ View audit logs  

### Viewer
✓ View all data (read-only)  

---

## 🔄 Backend Seeding

The test accounts were created by running the Prisma seed script:

```bash
cd apps/api
pnpm prisma:seed
```

This command:
1. Creates 11 test users with bcrypt-hashed passwords
2. Associates users with test roles
3. Sets up company relationships
4. Creates accounting infrastructure

---

## ✅ Verification Checklist

- [ ] Frontend accessible at https://hhc-hr-system-web.vercel.app
- [ ] Can login with maria.santos@hhc.com / Maria@2026
- [ ] Dashboard displays HR admin features
- [ ] Backend database contains all 11 users
- [ ] Password hashing verified (bcrypt, 12 rounds)
- [ ] Role-based permissions working correctly

---

## 📝 Adding New Test Accounts

To add more test users:

1. Edit: `apps/api/prisma/seed.ts`
2. Add to `testHRUsers` array:
```typescript
{ 
  email: 'newuser@hhc.com', 
  firstName: 'New', 
  lastName: 'User', 
  password: 'New@2026', 
  role: 'Accountant' 
}
```
3. Run: `pnpm prisma:seed`

---

## 🚨 Troubleshooting

**Login fails with "Invalid credentials"**
- Verify email matches exactly (case-sensitive)
- Verify password matches exactly (case-sensitive)
- Check backend is running (if local)

**Backend seed didn't run**
```bash
cd apps/api
pnpm install
pnpm prisma:seed
```

**Users not visible in database**
```bash
cd apps/api
npx prisma studio  # Opens database GUI at http://localhost:5555
```

---

## 📚 Related Documentation

- Backend Setup: See `BACKEND-SETUP.md`
- Frontend Code: See `lib/test-employees.ts`
- Seeding Template: See `backend-seed-endpoint.ts`

---

**Last Updated**: 2026-01-21  
**Deployment**: Vercel (Frontend + Backend via NestJS Vercel integration)  
**Database**: PostgreSQL with Prisma ORM  
**Status**: ✅ All 11 test accounts verified and active
