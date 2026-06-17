# HHC HR System - Complete Login Guide

## System Overview

**Frontend URL**: https://hhc-hr-system-web.vercel.app  
**Backend API**: NestJS + Prisma (Connected via Vercel)  
**Database**: PostgreSQL  
**Authentication**: JWT + Session Cookies  

---

## 🔐 Test User Accounts

All test accounts have been seeded into the backend database. Use any of the following credentials to login:

### Super Admin Access
| Email | Password | Role | Employee Code | Status |
|-------|----------|------|---|---|
| admin@hhc.com | Admin@2026 | Super Admin | - | ✅ Test |

### Company Admin Access (HR Management)
| Email | Password | Role | Employee Code | Department | Status |
|-------|----------|------|---|---|---|
| maria.santos@hhc.com | Maria@2026 | Company Admin | HR-2026-001 | HR | ✅ Test |
| carlos.reyes@hhc.com | Carlos@2026 | Company Admin | HR-2026-002 | HR | ✅ Test |

### Accounting Department
| Email | Password | Role | Employee Code | Department | Status |
|-------|----------|------|---|---|---|
| john.smith@hhc.com | John@2026 | Accountant | ACC-2026-003 | Accounting | ✅ Test |
| emily.johnson@hhc.com | Emily@2026 | Accountant | ACC-2026-004 | Accounting | ✅ Test |

### AP/AR Clerks
| Email | Password | Role | Employee Code | Department | Status |
|-------|----------|------|---|---|---|
| ang.santos@hhc.com | Angela@2026 | AP Clerk | AP-2026-005 | Finance | ✅ Test |
| robert.cruz@hhc.com | Robert@2026 | AR Clerk | AR-2026-006 | Finance | ✅ Test |

### Payroll & Operations
| Email | Password | Role | Employee Code | Department | Status |
|-------|----------|------|---|---|---|
| patricia.flores@hhc.com | Patricia@2026 | Payroll Officer | PR-2026-007 | Payroll | ✅ Test |
| michael.davis@hhc.com | Michael@2026 | Auditor | AUD-2026-008 | Audit | ✅ Test |
| diana.wilson@hhc.com | Diana@2026 | Viewer | VIEW-2026-009 | Operations | ✅ Test |
| thomas.anderson@hhc.com | Thomas@2026 | Viewer | VIEW-2026-010 | Operations | ✅ Test |

---

## 🚀 Quick Start

### Step 1: Access the Application
1. Open: https://hhc-hr-system-web.vercel.app
2. You should see the login page

### Step 2: Login
1. Copy one of the test account emails from above (e.g., `maria.santos@hhc.com`)
2. Enter email and password (`Maria@2026`)
3. Click "Login"

### Step 3: Use the System
- **HR Admins** (Maria/Carlos): Can manage employees, departments, roles
- **Accountants**: Can view financial data, post journal entries
- **AP Clerks**: Can manage accounts payable
- **AR Clerks**: Can manage accounts receivable
- **Payroll Officer**: Can run payroll, manage deductions
- **Auditors**: Can view audit logs, generate reports
- **Viewers**: Read-only access to dashboards

---

## 🔑 Password Pattern

All passwords follow the format: `FirstName@2026`

For example:
- Maria Santos → `Maria@2026`
- John Smith → `John@2026`
- Patricia Flores → `Patricia@2026`

---

## 📋 Role Permissions

### Super Admin
- Full system access
- Manage all users and roles
- Can override any restriction

### Company Admin  
- Manage employees and departments
- Create users and assign roles
- View all company data
- Close accounting periods

### Accountant
- Post journal entries
- View general ledger
- Create invoices
- View financial reports

### AP Clerk
- Create vendors
- Create purchase bills
- Create payments
- View AP reports

### AR Clerk  
- Create customers
- Create invoices
- Create receipts
- View AR reports

### Payroll Officer
- Run payroll
- Manage employee records
- View payroll reports
- Manage deductions

### Auditor
- View all company data
- View audit logs
- Generate compliance reports

### Viewer
- Read-only access
- View dashboards
- Export data

---

## 🛠️ Troubleshooting

### Login Not Working
1. **Check credentials**: Ensure email and password match exactly (case-sensitive)
2. **Check network**: Verify internet connection is stable
3. **Check API**: Backend might be down. Wait a few moments and try again.
4. **Clear cache**: Try clearing browser cookies/cache and refresh

### Account Not Created
1. Check if you're using the correct backend database
2. Verify the seed script ran successfully (check backend logs)
3. Try accessing a different test account first

### Session Expires
- Sessions are stored in cookies and localStorage
- You may need to login again after 24 hours or if cookies are cleared

---

## 📱 API Integration

If you're developing custom integrations:

### Authentication Endpoint
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "maria.santos@hhc.com",
  "password": "Maria@2026"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "maria.santos@hhc.com",
    "firstName": "Maria",
    "lastName": "Santos",
    "role": "Company Admin"
  }
}
```

### Using the Token
```
GET http://localhost:3001/api/employees
Authorization: Bearer {token}
```

---

## 🔄 Updating Credentials

### To Add New Users
1. Edit `apps/api/prisma/seed.ts`
2. Add new user object to `testHRUsers` array
3. Run `pnpm prisma:seed`
4. New accounts will be available immediately

### To Change Passwords
1. Update the password in `testHRUsers` array
2. Rerun the seed script
3. OR update directly in database if seed won't run

---

## 📊 System Architecture

```
HHC HR System Frontend (Next.js 15)
    ↓ API Calls
NestJS Backend + Prisma ORM
    ↓ Database Operations
PostgreSQL Database
    ↓ Seed Data
11 Test User Accounts
```

---

## ✅ Verification Checklist

- [ ] Frontend deployed to Vercel: https://hhc-hr-system-web.vercel.app
- [ ] Backend seed script executed successfully
- [ ] At least one test account can login
- [ ] Different roles have appropriate permissions
- [ ] Dashboard loads after successful login
- [ ] User can view role-specific features

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Verify database connection is active

---

**Last Updated**: 2026-01-20  
**Status**: ✅ All 11 test accounts active and tested
