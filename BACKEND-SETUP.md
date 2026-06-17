# Backend Seeding Setup for Vercel

This guide helps you add test employee accounts to your **Vercel-deployed backend API**.

---

## 📁 Step 1: Find Your Backend Repository

Your backend should be in one of these locations:
- Separate repository (e.g., `HR-SYSTEM-HHC-backend`)
- Inside the frontend repo in `/backend` or `/server` folder
- One of your other TypeScript repos (TOPSECRET-ACADEMY, ACCOUNTING-HHC)

**What to look for:**
- Has `package.json` with Express, Nest, Next.js API routes
- Has database connection code (MongoDB, PostgreSQL, etc.)
- Has `/api` or `/routes` folder with endpoints

---

## 🚀 Step 2: Add Seeding Endpoint to Backend

### If using **Next.js API Routes**:

Create: `pages/api/admin/seed-employees.ts`

```typescript
// pages/api/admin/seed-employees.ts
import { seedEmployeesHandler, testEmployees } from '../../../lib/seed-data';

export default async function handler(req, res) {
  return await seedEmployeesHandler(req, res);
}
```

### If using **Express.js**:

Create: `routes/admin/seed.js`

```javascript
const express = require('express');
const router = express.Router();
const { testEmployees } = require('../../lib/seed-data');

router.post('/seed-employees', async (req, res) => {
  try {
    const results = [];
    for (const emp of testEmployees) {
      // Use your database library (Mongoose, TypeORM, Sequelize, etc.)
      // Example with Mongoose:
      // await Employee.updateOne(
      //   { employeeCode: emp.employeeCode },
      //   emp,
      //   { upsert: true }
      // );
      
      results.push({
        employeeCode: emp.employeeCode,
        status: 'created'
      });
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### If using **NestJS**:

Create: `src/admin/seed.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('admin')
export class AdminController {
  constructor(private seedService: SeedService) {}

  @Post('seed-employees')
  async seedEmployees(@Body() body: { force?: boolean }) {
    return await this.seedService.seedEmployees(body.force);
  }
}
```

---

## 📊 Step 3: Add Seed Data File to Backend

Copy `seed-employees.js` content and create in your backend:
- `lib/seed-data.ts` (TypeScript)
- `lib/seed-data.js` (JavaScript)

Or use the JSON directly in your endpoint.

---

## 🌐 Step 4: Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Add employee seeding endpoint"
git push origin main
```

2. **Vercel auto-deploys** from your main branch

3. **Seed your database**:
```bash
curl -X POST https://your-backend.vercel.app/api/admin/seed-employees \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

---

## ✅ Step 5: Test Login

Try logging in with:
- **Code**: HR-2026-001
- **Password**: Maria@2026

If it works, all test accounts are now seeded! ✨

---

## 🔍 Troubleshooting

### Endpoint not found?
- Verify file path in your backend
- Check it's properly exported/imported
- Restart Vercel build

### Database connection error?
- Check environment variables on Vercel
- Verify database credentials are set in Vercel dashboard
- Check database permissions

### Still getting "Invalid employee code or password"?
- Confirm endpoint was called and returned success
- Check if passwords need hashing (bcrypt, argon2)
- Verify employees were actually inserted

---

## 📝 If Your Backend Uses Password Hashing

The seeding endpoint needs to hash passwords before storing:

```typescript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(emp.password, 10);
// Save hashedPassword to database instead of plain password
```

Make sure your login endpoint verifies with:
```typescript
const isValid = await bcrypt.compare(inputPassword, storedHashedPassword);
```

---

## 🔗 Your Vercel URLs

- **Frontend**: https://hhc-hr-system-web.vercel.app/
- **Backend**: https://your-backend.vercel.app (update with actual URL)
- **Seed Endpoint**: `POST https://your-backend.vercel.app/api/admin/seed-employees`

---

## 📋 Test Accounts Created

All 7 accounts will be seeded:

| Code | Password | Role |
|---|---|---|
| ADM-2026-SUPER | Admin@2026 | super_admin |
| HR-2026-001 | Maria@2026 | hr_admin |
| FIN-2026-008 | Angela@2026 | finance |
| OPS-2026-014 | Jose@2026 | manager |
| OPS-2026-016 | Michael@2026 | employee |
| SLS-2026-017 | Sophia@2026 | employee |
| IT-2026-018 | David@2026 | employee |

---

**Need help?** Share your backend repository URL and I can create the exact setup for your stack!
