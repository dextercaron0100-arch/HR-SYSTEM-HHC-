/**
 * Employee Account Seeding Script
 * Use this to initialize test accounts in your backend database
 * 
 * Instructions:
 * 1. Copy this file to your backend project
 * 2. Run with Node.js: node seed-employees.js
 * 3. Or import and use the functions in your backend setup
 */

const testEmployees = [
  // Super Admin
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

  // HR Admin
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

  // Finance
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

  // Manager
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

  // Regular Employees
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

// Print accounts in table format
console.log("\n=== TEST EMPLOYEE ACCOUNTS ===\n");
console.log("Employee Code | Password      | Role        | Name");
console.log("-".repeat(60));

testEmployees.forEach(emp => {
  console.log(
    `${emp.employeeCode.padEnd(13)} | ${emp.password.padEnd(13)} | ${emp.role.padEnd(11)} | ${emp.firstName} ${emp.lastName}`
  );
});

console.log("\n=== IMPORT INSTRUCTIONS ===\n");
console.log("1. Copy the SQL below and run in your database:");
console.log("2. Or use the JSON array for API batch insert:\n");

// Generate SQL INSERT statements
console.log("-- SQL INSERT STATEMENTS:");
testEmployees.forEach(emp => {
  console.log(`INSERT INTO employees (id, employeeCode, firstName, lastName, email, password, role, departmentId, positionId, basicSalary, hireDate, employmentStatus, salaryType) VALUES ('${emp.id}', '${emp.employeeCode}', '${emp.firstName}', '${emp.lastName}', '${emp.email}', '${emp.password}', '${emp.role}', '${emp.departmentId}', '${emp.positionId}', ${emp.basicSalary}, '${emp.hireDate}', '${emp.employmentStatus}', '${emp.salaryType}');`);
});

console.log("\n-- OR use this JSON:\n");
console.log(JSON.stringify(testEmployees, null, 2));

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testEmployees };
}
