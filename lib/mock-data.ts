import type { DashboardSummary, Employee, LeaveRequest, PayrollPeriod } from "@hr/contracts";

export const dashboardSummary: DashboardSummary = {
  headcount: 248,
  pendingApprovals: 17,
  activeLeaves: 8,
  openPayrollPeriods: 2,
  attendanceExceptions: 11
};

export const employees: Employee[] = [
  {
    id: "emp-001",
    employeeCode: "HR-2026-001",
    firstName: "Maria",
    middleName: "S.",
    lastName: "Cruz",
    departmentId: "dept-hr",
    positionId: "pos-hrm",
    hireDate: "2024-02-12",
    employmentStatus: "active",
    salaryType: "monthly",
    basicSalary: 52000,
    phone: "+63 917 100 2000",
    email: "maria.cruz@company.com"
  },
  {
    id: "emp-002",
    employeeCode: "OPS-2026-014",
    firstName: "Jose",
    lastName: "Reyes",
    departmentId: "dept-ops",
    positionId: "pos-supervisor",
    managerId: "emp-001",
    hireDate: "2023-09-01",
    employmentStatus: "active",
    salaryType: "monthly",
    basicSalary: 42000,
    phone: "+63 918 200 3000",
    email: "jose.reyes@company.com"
  },
  {
    id: "emp-003",
    employeeCode: "FIN-2026-008",
    firstName: "Angela",
    lastName: "Dizon",
    departmentId: "dept-finance",
    positionId: "pos-payroll",
    hireDate: "2022-06-20",
    employmentStatus: "active",
    salaryType: "monthly",
    basicSalary: 48000,
    phone: "+63 919 300 4000",
    email: "angela.dizon@company.com"
  }
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: "lr-1001",
    employeeId: "emp-002",
    leaveType: "Vacation Leave",
    startDate: "2026-04-07",
    endDate: "2026-04-09",
    days: 3,
    reason: "Family travel",
    status: "pending"
  },
  {
    id: "lr-1002",
    employeeId: "emp-003",
    leaveType: "Sick Leave",
    startDate: "2026-04-03",
    endDate: "2026-04-03",
    days: 1,
    reason: "Medical rest",
    status: "approved"
  }
];

export const payrollPeriods: PayrollPeriod[] = [
  {
    id: "pp-001",
    name: "April 1-15, 2026",
    dateFrom: "2026-04-01",
    dateTo: "2026-04-15",
    payDate: "2026-04-18",
    status: "processing"
  },
  {
    id: "pp-002",
    name: "March 16-31, 2026",
    dateFrom: "2026-03-16",
    dateTo: "2026-03-31",
    payDate: "2026-04-03",
    status: "completed"
  }
];
