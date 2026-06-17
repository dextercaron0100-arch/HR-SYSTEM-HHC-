/**
 * Test Employee Accounts with Credentials
 * These are sample accounts for testing the HR System
 * Use these employee codes and passwords to login
 */

export interface TestEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "super_admin" | "hr_admin" | "manager" | "employee" | "finance";
  departmentId: string;
  positionId: string;
  basicSalary: number;
}

export const testEmployees: TestEmployee[] = [
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
    basicSalary: 65000
  },

  // HR Admins
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
    basicSalary: 52000
  },
  {
    id: "emp-hr-002",
    employeeCode: "HR-2026-002",
    firstName: "Carlos",
    lastName: "Santos",
    email: "carlos.santos@company.com",
    password: "Carlos@2026",
    role: "hr_admin",
    departmentId: "dep-hr",
    positionId: "pos-hr-officer",
    basicSalary: 48000
  },
  {
    id: "emp-hr-003",
    employeeCode: "HR-2026-003",
    firstName: "Ana",
    lastName: "Herrera",
    email: "ana.herrera@company.com",
    password: "Ana@2026",
    role: "hr_admin",
    departmentId: "dep-hr",
    positionId: "pos-hr-officer",
    basicSalary: 46000
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
    basicSalary: 48000
  },
  {
    id: "emp-fin-002",
    employeeCode: "FIN-2026-009",
    firstName: "Robert",
    lastName: "Fernandez",
    email: "robert.fernandez@company.com",
    password: "Robert@2026",
    role: "finance",
    departmentId: "dep-finance",
    positionId: "pos-accountant",
    basicSalary: 45000
  },

  // Managers
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
    basicSalary: 42000
  },
  {
    id: "emp-mgr-002",
    employeeCode: "SLS-2026-015",
    firstName: "Patricia",
    lastName: "Gonzales",
    email: "patricia.gonzales@company.com",
    password: "Patricia@2026",
    role: "manager",
    departmentId: "dep-sales",
    positionId: "pos-sales-manager",
    basicSalary: 44000
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
    basicSalary: 28000
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
    basicSalary: 30000
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
    basicSalary: 42000
  },
  {
    id: "emp-emp-004",
    employeeCode: "MKT-2026-019",
    firstName: "Jennifer",
    lastName: "Wong",
    email: "jennifer.wong@company.com",
    password: "Jennifer@2026",
    role: "employee",
    departmentId: "dep-marketing",
    positionId: "pos-specialist",
    basicSalary: 35000
  }
];

/**
 * Get employee by employee code
 */
export function getEmployeeByCode(code: string): TestEmployee | undefined {
  return testEmployees.find(emp => emp.employeeCode === code);
}

/**
 * Verify employee credentials
 */
export function verifyCredentials(
  employeeCode: string,
  password: string
): TestEmployee | null {
  const employee = getEmployeeByCode(employeeCode);
  if (employee && employee.password === password) {
    return employee;
  }
  return null;
}

/**
 * Get all employees by role
 */
export function getEmployeesByRole(
  role: TestEmployee["role"]
): TestEmployee[] {
  return testEmployees.filter(emp => emp.role === role);
}

/**
 * Export formatted for CSV/Database import
 */
export function exportAsCSV(): string {
  const headers = [
    "Employee Code",
    "First Name",
    "Last Name",
    "Email",
    "Password",
    "Role",
    "Department",
    "Salary"
  ].join(",");

  const rows = testEmployees.map(emp =>
    [
      emp.employeeCode,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.password,
      emp.role,
      emp.departmentId,
      emp.basicSalary
    ].join(",")
  );

  return [headers, ...rows].join("\n");
}
