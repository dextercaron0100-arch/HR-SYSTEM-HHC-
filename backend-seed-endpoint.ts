/**
 * Backend API Endpoint for Seeding Test Employees
 * Add this file to your backend: /api/admin/seed-employees.ts or .js
 * 
 * Endpoint: POST /api/admin/seed-employees
 * Headers: Content-Type: application/json
 * Body: { force: true } (optional - force reseed)
 * 
 * Usage:
 * curl -X POST http://localhost:3001/api/admin/seed-employees \
 *   -H "Content-Type: application/json" \
 *   -d '{"force": true}'
 */

const testEmployees = [
  {
    id: "emp-sa-001",
    employeeCode: "ADM-2026-SUPER",
    firstName: "System",
    lastName: "Administrator",
    email: "admin@company.com",
    password: "Admin@2026",
    role: "super_admin",
    departmentId: "dep-admin",
    positionId: "pos-administrator",
    basicSalary: 65000,
    hireDate: "2024-01-01",
    employmentStatus: "active",
    salaryType: "monthly"
  },
  {
    id: "emp-001",
    employeeCode: "HR-2026-001",
    firstName: "Maria",
    lastName: "Cruz",
    email: "maria.cruz@company.com",
    password: "Maria@2026",
    role: "hr_admin",
    departmentId: "dep-hr",
    positionId: "pos-hrm",
    basicSalary: 52000,
    hireDate: "2024-02-12",
    employmentStatus: "active",
    salaryType: "monthly"
  },
  {
    id: "emp-003",
    employeeCode: "FIN-2026-008",
    firstName: "Angela",
    lastName: "Dizon",
    email: "angela.dizon@company.com",
    password: "Angela@2026",
    role: "finance",
    departmentId: "dep-finance",
    positionId: "pos-payroll",
    basicSalary: 48000,
    hireDate: "2022-06-20",
    employmentStatus: "active",
    salaryType: "monthly"
  },
  {
    id: "emp-002",
    employeeCode: "OPS-2026-014",
    firstName: "Jose",
    lastName: "Reyes",
    email: "jose.reyes@company.com",
    password: "Jose@2026",
    role: "manager",
    departmentId: "dep-ops",
    positionId: "pos-supervisor",
    basicSalary: 42000,
    hireDate: "2023-09-01",
    employmentStatus: "active",
    salaryType: "monthly",
    managerId: "emp-001"
  },
  {
    id: "emp-emp-001",
    employeeCode: "OPS-2026-016",
    firstName: "Michael",
    lastName: "Torres",
    email: "michael.torres@company.com",
    password: "Michael@2026",
    role: "employee",
    departmentId: "dep-ops",
    positionId: "pos-associate",
    basicSalary: 28000,
    hireDate: "2024-03-15",
    employmentStatus: "active",
    salaryType: "monthly",
    managerId: "emp-002"
  },
  {
    id: "emp-emp-002",
    employeeCode: "SLS-2026-017",
    firstName: "Sophia",
    lastName: "Villanueva",
    email: "sophia.villanueva@company.com",
    password: "Sophia@2026",
    role: "employee",
    departmentId: "dep-sales",
    positionId: "pos-sales-rep",
    basicSalary: 30000,
    hireDate: "2024-01-20",
    employmentStatus: "active",
    salaryType: "monthly"
  },
  {
    id: "emp-emp-003",
    employeeCode: "IT-2026-018",
    firstName: "David",
    lastName: "Lim",
    email: "david.lim@company.com",
    password: "David@2026",
    role: "employee",
    departmentId: "dep-it",
    positionId: "pos-developer",
    basicSalary: 42000,
    hireDate: "2023-11-10",
    employmentStatus: "active",
    salaryType: "monthly"
  }
];

/**
 * Next.js API Route Handler
 * File: pages/api/admin/seed-employees.ts
 */
export async function seedEmployeesHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { force } = req.body;
    const results = [];

    for (const emp of testEmployees) {
      try {
        // Replace with your actual database insert logic
        // Example with Prisma:
        // const employee = await prisma.employee.upsert({
        //   where: { employeeCode: emp.employeeCode },
        //   update: emp,
        //   create: emp
        // });
        
        // Or with raw SQL:
        // await db.query('INSERT INTO employees (...) VALUES (...)')
        
        results.push({
          employeeCode: emp.employeeCode,
          status: "created",
          message: `Employee ${emp.employeeCode} seeded successfully`
        });
      } catch (err) {
        results.push({
          employeeCode: emp.employeeCode,
          status: "error",
          message: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${testEmployees.length} test accounts processed`,
      results: results,
      credentials: testEmployees.map(emp => ({
        employeeCode: emp.employeeCode,
        password: emp.password,
        role: emp.role
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Export for use in different frameworks
export { testEmployees };
