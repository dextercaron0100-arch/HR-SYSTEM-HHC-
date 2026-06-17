# HR System - Test Login Credentials

## Quick Login Reference

### Default Test Accounts

Use these credentials to login to the HR System at `http://localhost:4002/login`

| Employee Code | Password | Role | Name | Department |
|---|---|---|---|---|
| **ADM-2026-SUPER** | Admin@2026 | Super Admin | System Administrator | Admin |
| **HR-2026-001** | Maria@2026 | HR Admin | Maria Cruz | Human Resources |
| **HR-2026-002** | Carlos@2026 | HR Admin | Carlos Santos | Human Resources |
| **FIN-2026-008** | Angela@2026 | Finance | Angela Dizon | Finance |
| **FIN-2026-009** | Robert@2026 | Finance | Robert Fernandez | Finance |
| **OPS-2026-014** | Jose@2026 | Manager | Jose Reyes | Operations |
| **SLS-2026-015** | Patricia@2026 | Manager | Patricia Gonzales | Sales |
| **OPS-2026-016** | Michael@2026 | Employee | Michael Torres | Operations |
| **SLS-2026-017** | Sophia@2026 | Employee | Sophia Villanueva | Sales |
| **IT-2026-018** | David@2026 | Employee | David Lim | IT |
| **MKT-2026-019** | Jennifer@2026 | Employee | Jennifer Wong | Marketing |

---

## Role Descriptions

### Super Admin
- **Username**: ADM-2026-SUPER
- **Password**: Admin@2026
- **Permissions**: Full system access, user management, system configuration
- **Use Case**: System administration, setup, troubleshooting

### HR Admin
- **Username**: HR-2026-001 or HR-2026-002
- **Password**: Maria@2026 / Carlos@2026
- **Permissions**: Employee management, leave approvals, attendance control, hiring
- **Use Case**: HR department operations, employee record management

### Finance
- **Username**: FIN-2026-008 or FIN-2026-009
- **Password**: Angela@2026 / Robert@2026
- **Permissions**: Payroll management, salary processing, financial reports
- **Use Case**: Payroll processing, financial transactions

### Manager
- **Username**: OPS-2026-014 or SLS-2026-015
- **Password**: Jose@2026 / Patricia@2026
- **Permissions**: Team management, leave approvals, performance reviews, attendance reports
- **Use Case**: Team oversight, approval workflows

### Employee
- **Username**: OPS-2026-016, SLS-2026-017, IT-2026-018, MKT-2026-019
- **Password**: Michael@2026, Sophia@2026, David@2026, Jennifer@2026
- **Permissions**: Personal record access, leave requests, attendance viewing, performance reviews
- **Use Case**: Employee self-service

---

## System Access URLs

| Component | URL | Port |
|---|---|---|
| Frontend (Web App) | http://localhost:4002 | 4002 |
| Backend API | http://localhost:3001 | 3001 |
| Login Page | http://localhost:4002/login | 4002 |

---

## Setting Up Test Accounts in Backend

### Option 1: Using Node.js Script

```bash
node seed-employees.js
```

This will output:
- A table of all test accounts
- SQL INSERT statements
- JSON format for API import

### Option 2: Direct Database Import

Use the SQL statements from `seed-employees.js` in your database:

```sql
INSERT INTO employees 
(id, employeeCode, firstName, lastName, email, password, role, departmentId, positionId, basicSalary, hireDate, employmentStatus, salaryType) 
VALUES 
('emp-001', 'HR-2026-001', 'Maria', 'Cruz', 'maria.cruz@company.com', 'Maria@2026', 'hr_admin', 'dep-hr', 'pos-hrm', 52000, '2024-02-12', 'active', 'monthly');
```

### Option 3: API Batch Import

```bash
curl -X POST http://localhost:3001/api/employees/seed \
  -H "Content-Type: application/json" \
  -d @seed-employees.json
```

---

## Password Policy

Current test passwords follow this format:
- **Format**: `[FirstName]@2026`
- **Example**: Maria@2026, Jose@2026
- **Security Note**: For production, implement strong password requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character

---

## Creating Additional Accounts

### Using the Frontend

1. Login as **HR Admin** (HR-2026-001 / Maria@2026)
2. Navigate to **Employees** → **Add New Employee**
3. Fill in the employee details (required fields marked with *)
4. Set temporary password in user management
5. Employee will be able to login after first setup

### Using TypeScript (Frontend)

```typescript
import { testEmployees, getEmployeeByCode, verifyCredentials } from './lib/test-employees';

// Verify login
const employee = verifyCredentials('HR-2026-001', 'Maria@2026');
if (employee) {
  console.log('Login successful:', employee);
}

// Get all employees by role
const admins = getEmployeesByRole('hr_admin');
```

### Using Backend API

```javascript
POST /api/employees
Content-Type: application/json

{
  "employeeCode": "NEW-2026-001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "password": "John@2026",
  "role": "employee",
  "departmentId": "dep-ops",
  "positionId": "pos-associate",
  "basicSalary": 30000,
  "hireDate": "2026-01-15",
  "employmentStatus": "active",
  "salaryType": "monthly"
}
```

---

## Testing Workflows

### Complete Leave Request Flow
1. Login as **Employee** (OPS-2026-016 / Michael@2026)
2. Go to **Leave** → **Request Leave**
3. Logout, login as **Manager** (OPS-2026-014 / Jose@2026)
4. Go to **Dashboard** → **Pending Approvals**
5. Approve the leave request

### Payroll Processing
1. Login as **Finance** (FIN-2026-008 / Angela@2026)
2. Go to **Payroll** → **New Period**
3. Process salaries for all employees
4. Generate payslips

### Performance Review
1. Login as **Manager** (OPS-2026-014 / Jose@2026)
2. Go to **Performance** → **Create Review**
3. Set KPIs and targets for team members
4. Track progress

---

## Troubleshooting

### Can't Login?
- Verify **API is running** on http://localhost:3001
- Check that **Frontend is running** on http://localhost:4002
- Ensure employee code matches exactly (case-sensitive)
- Verify password (also case-sensitive)

### Test Accounts Not Available?
- Run `node seed-employees.js` to generate SQL
- Check backend database for existing accounts
- Import test data using provided SQL or JSON

### Account Locked or Password Reset?
- Contact HR Admin (Maria Cruz / HR-2026-001)
- Or run seed script again to reset test environment

---

## File Locations

- **Test Data**: `lib/test-employees.ts` (TypeScript)
- **Seeding Script**: `seed-employees.js` (Node.js)
- **This Guide**: `TEST-ACCOUNTS.md`

---

## Notes

- ⚠️ **These are test accounts only** - use strong passwords in production
- 🔐 **Never commit real passwords** to version control
- 📋 **Test accounts reset** when seed script is re-run
- 🔄 **Use for development/testing** - not for production
- 💾 **Export data regularly** before environment resets

---

**Last Updated**: 2026-06-17
**Backend API**: http://localhost:3001
**Frontend App**: http://localhost:4002
