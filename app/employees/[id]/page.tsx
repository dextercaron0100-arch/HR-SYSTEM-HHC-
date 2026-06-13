export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Employee, EmployeePerformanceSnapshot } from "@hr/contracts";

import { AppShell } from "../../../components/AppShell";
import { Sparkline } from "../../../components/DashboardVisuals";
import { EmployeePhotoUploader } from "../../../components/EmployeePhotoUploader";
import { apiGet } from "../../../lib/api";

type EmployeeDetail = Employee & {
  department?: string;
  position?: string;
  profilePhotoUrl?: string;
};

type AttendanceSummaryRow = {
  id: string;
  employeeName: string;
  workDate: string;
  workHours: number;
  status: string;
};

type LeaveBalanceRow = {
  employeeId: string;
  leaveType: string;
  earned: number;
  used: number;
  remaining: number;
};

type LeaveRequestRow = {
  id: string;
  employeeId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: string;
};

type PayrollRunRow = {
  id: string;
  employeeId: string;
  basicPay: string;
  allowances: string;
  employeeDeductions: string;
  withholdingTax: string;
  netPay: string;
};

type DocumentRow = {
  id: string;
  employeeId: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  uploadedAt: string;
};

type EmployeeDetailData = {
  employee: EmployeeDetail;
  attendance: AttendanceSummaryRow[];
  leaveBalances: LeaveBalanceRow[];
  leaveRequests: LeaveRequestRow[];
  payrollRuns: PayrollRunRow[];
  documents: DocumentRow[];
  performanceSnapshot: EmployeePerformanceSnapshot | null;
};

type LeaveMetric = {
  label: string;
  value: number;
  total: number;
  percent: number;
  unit: string;
};

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const fullNameOf = (employee: EmployeeDetail) =>
  `${employee.firstName} ${employee.lastName}`.trim();

const matchesEmployeeName = (name: string, employee: EmployeeDetail) => {
  const firstLast = normalize(`${employee.firstName} ${employee.lastName}`);
  const withMiddle = normalize(
    `${employee.firstName} ${employee.middleName ?? ""} ${employee.lastName}`
  );
  const value = normalize(name);
  return value === firstLast || value === withMiddle || value.includes(firstLast);
};

const parseMoney = (value: string | number) =>
  Number(String(value).replace(/,/g, ""));

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
    new Date(value)
  );

const shortDay = (value: string) =>
  new Intl.DateTimeFormat("en-PH", { weekday: "narrow" }).format(new Date(value));

function toLeaveMetric(
  label: string,
  rows: LeaveBalanceRow[],
  predicate: (leaveType: string) => boolean,
  unit = "Days"
): LeaveMetric {
  const selected = rows.filter((row) => predicate(row.leaveType));
  const source = selected.length ? selected : rows;

  const value = source.reduce((sum, row) => sum + row.remaining, 0);
  const total = source.reduce(
    (sum, row) => sum + Math.max(row.earned, row.used + row.remaining),
    0
  );
  const safeTotal = total > 0 ? total : Math.max(value, 1);
  const percent = Math.round((value / safeTotal) * 100);

  return {
    label,
    value,
    total: safeTotal,
    percent: Math.max(0, Math.min(100, percent)),
    unit
  };
}

function LeaveRing({ metric }: { metric: LeaveMetric }) {
  return (
    <article className="employee-leave-ring-card">
      <span>{metric.label}</span>
      <div
        className="employee-leave-ring"
        style={{ ["--ring-progress" as string]: `${metric.percent}%` }}
      >
        <strong>{metric.value}</strong>
        <small>/{metric.total}</small>
      </div>
      <p>{metric.unit}</p>
    </article>
  );
}

function PersonalInfoIcon({
  name
}: {
  name: "gender" | "birth" | "email" | "phone" | "address" | "tin";
}) {
  switch (name) {
    case "gender":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10" cy="14" r="4.4" />
          <path d="M14.2 9.8 20 4M16.6 4H20v3.4" />
        </svg>
      );
    case "birth":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.2" y="5.3" width="15.6" height="14.2" rx="2.1" />
          <path d="M8 3.8v2.6M16 3.8v2.6M4.2 9.2h15.6" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.8" y="5.7" width="16.4" height="12.6" rx="2.2" />
          <path d="m4.8 8 7.2 5.1L19.2 8" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.2 4.5c.4-.5 1-.7 1.6-.5l2.1.7c.7.2 1.1 1 .9 1.7l-.6 2.2c1 1.8 2.5 3.4 4.4 4.4l2.2-.6c.7-.2 1.4.2 1.7.9l.7 2.1c.2.6 0 1.2-.5 1.6l-1.2 1.1c-.6.6-1.5.8-2.2.6-2.6-.7-5.2-2.1-7.4-4.3-2.2-2.2-3.7-4.8-4.3-7.4-.2-.8 0-1.7.6-2.2l1.1-1.3Z" />
        </svg>
      );
    case "address":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20c4.3-4 6.4-7 6.4-9.6A6.4 6.4 0 1 0 5.6 10.4C5.6 13 7.7 16 12 20Z" />
          <circle cx="12" cy="10.2" r="2.2" />
        </svg>
      );
    case "tin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.2" y="4.8" width="15.6" height="14.4" rx="2.2" />
          <path d="M8 9.6h8M8 13h4.8" />
        </svg>
      );
    default:
      return null;
  }
}

function SocialIcon({ name }: { name: "linkedin" | "x" | "instagram" }) {
  switch (name) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.2 9.5V17" />
          <circle cx="7.2" cy="6.8" r="1.2" />
          <path d="M11.2 17v-4.1c0-1.8 1-2.9 2.5-2.9 1.4 0 2.3 1 2.3 2.7V17" />
          <path d="M11.2 11.2v-1.7" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5 19 19M19 5 5 19" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.3" y="4.3" width="15.4" height="15.4" rx="4.2" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="16.8" cy="7.2" r="1" />
        </svg>
      );
    default:
      return null;
  }
}

function buildMonthCells(referenceDate: Date, activeDates: Set<string>) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const startOffset = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const cells: { day: number; inMonth: boolean; iso: string; active: boolean }[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ day: 0, inMonth: false, iso: "", active: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), day);
    const iso = date.toISOString().slice(0, 10);
    cells.push({ day, inMonth: true, iso, active: activeDates.has(iso) });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, inMonth: false, iso: "", active: false });
  }

  return cells;
}

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch {
    return fallback;
  }
}

async function loadEmployeeDetail(id: string): Promise<EmployeeDetailData | null> {
  const employee = await safeGet<EmployeeDetail | null>(`/employees/${id}`, null);
  if (!employee) {
    return null;
  }

  const [attendanceSummary, leaveBalances, leaveRequests, payrollRuns, documents] =
    await Promise.all([
      safeGet<AttendanceSummaryRow[]>("/attendance/summary", []),
      safeGet<LeaveBalanceRow[]>("/leave/balances", []),
      safeGet<LeaveRequestRow[]>("/leave/requests", []),
      safeGet<PayrollRunRow[]>("/payroll/runs", []),
      safeGet<DocumentRow[]>("/documents", [])
    ]);

  const performanceSnapshot = await safeGet<EmployeePerformanceSnapshot | null>(
    `/performance/employee/${employee.id}/snapshot`,
    null
  );

  return {
    employee,
    attendance: attendanceSummary.filter((row) =>
      matchesEmployeeName(row.employeeName, employee)
    ),
    leaveBalances: leaveBalances.filter((row) => row.employeeId === employee.id),
    leaveRequests: leaveRequests.filter((row) => row.employeeId === employee.id),
    payrollRuns: payrollRuns.filter((row) => row.employeeId === employee.id),
    documents: documents.filter((row) => row.employeeId === employee.id),
    performanceSnapshot
  };
}

function createDemoEmployeeDetail(id: string): EmployeeDetailData {
  const today = new Date();
  const demoEmployee: EmployeeDetail = {
    id,
    employeeCode: "EMP-0289",
    firstName: "Mia",
    lastName: "Torres",
    departmentId: "dep-hr",
    positionId: "pos-hr-officer",
    department: "Human Resources",
    position: "HR Officer",
    hireDate: "2033-02-14",
    employmentStatus: "active",
    salaryType: "monthly",
    basicSalary: 3200,
    phone: "+62 812-3456-7890",
    email: "mia.torres@company.com",
    address: "Jl. Melati No. 45, Sleman, Yogyakarta, Indonesia",
    governmentIds: {
      tin: "123-456-789-000"
    }
  };

  const attendance: AttendanceSummaryRow[] = Array.from({ length: 14 }).map((_, index) => {
    const workDate = new Date(today);
    workDate.setDate(today.getDate() - (13 - index));
    return {
      id: `demo-att-${index + 1}`,
      employeeName: "Mia Torres",
      workDate: workDate.toISOString(),
      workHours: [7.3, 8, 7, 8, 7.4, 0, 0, 7.8, 7.6, 8, 7.2, 8, 7.5, 0][index] ?? 8,
      status: [5, 6, 13].includes(index) ? "leave" : index === 2 ? "late" : "present"
    };
  });

  return {
    employee: demoEmployee,
    attendance,
    leaveBalances: [
      { employeeId: id, leaveType: "Annual Leave", earned: 20, used: 6, remaining: 14 },
      { employeeId: id, leaveType: "Casual Leave", earned: 15, used: 5, remaining: 10 },
      { employeeId: id, leaveType: "Sick Leave", earned: 24, used: 16, remaining: 8 }
    ],
    leaveRequests: [
      {
        id: "demo-leave-1",
        employeeId: id,
        reason: "Promotion feedback: promoted from HR Assistant to HR Officer.",
        startDate: "2035-06-10",
        endDate: "2035-06-10",
        status: "approved"
      },
      {
        id: "demo-leave-2",
        employeeId: id,
        reason: "Employee appreciation: led Q2 training rollout with 98% participation.",
        startDate: "2035-05-02",
        endDate: "2035-05-02",
        status: "pending"
      }
    ],
    payrollRuns: [
      {
        id: "demo-payroll-1",
        employeeId: id,
        basicPay: "3200",
        allowances: "300",
        employeeDeductions: "120",
        withholdingTax: "70",
        netPay: "3310"
      }
    ],
    documents: [
      {
        id: "doc-1",
        employeeId: id,
        fileName: "Performance Evaluation.pdf",
        fileUrl: "#",
        documentType: "PDF",
        uploadedAt: "2035-09-01"
      },
      {
        id: "doc-2",
        employeeId: id,
        fileName: "Contract Agreement.pdf",
        fileUrl: "#",
        documentType: "PDF",
        uploadedAt: "2035-08-16"
      },
      {
        id: "doc-3",
        employeeId: id,
        fileName: "Curriculum Vitae.pdf",
        fileUrl: "#",
        documentType: "PDF",
        uploadedAt: "2035-07-21"
      },
      {
        id: "doc-4",
        employeeId: id,
        fileName: "Portfolio.pdf",
        fileUrl: "#",
        documentType: "PDF",
        uploadedAt: "2035-06-11"
      }
    ],
    performanceSnapshot: {
      employeeId: id,
      period: "2035-06",
      kpiSummary: {
        period: "2035-06",
        completionRate: 50,
        pendingApprovals: 1,
        totalWeightedScore: 81.4,
        normalizedWeightedScore: 81.4,
        items: 4
      },
      kpiRecords: [
        {
          id: "demo-kpi-1",
          employeeId: id,
          employeeName: "Mia Torres",
          employeeCode: "EMP-0289",
          department: "Human Resources",
          role: "HR Officer",
          kpiDefinitionId: "kpi-attendance",
          kpiName: "Attendance Compliance",
          unit: "%",
          period: "2035-06",
          targetValue: 95,
          actualValue: 97,
          weight: 30,
          scorePercent: 102.11,
          weightedScore: 30.63,
          status: "approved",
          notes: "Consistent attendance this month.",
          createdByRole: "hr_admin",
          submittedByRole: "manager",
          approvedByRole: "manager",
          createdAt: "2035-06-01T01:00:00.000Z",
          updatedAt: "2035-06-20T01:00:00.000Z",
          submittedAt: "2035-06-15T01:00:00.000Z",
          approvedAt: "2035-06-18T01:00:00.000Z"
        },
        {
          id: "demo-kpi-2",
          employeeId: id,
          employeeName: "Mia Torres",
          employeeCode: "EMP-0289",
          department: "Human Resources",
          role: "HR Officer",
          kpiDefinitionId: "kpi-task",
          kpiName: "Task Completion",
          unit: "%",
          period: "2035-06",
          targetValue: 90,
          actualValue: 84,
          weight: 30,
          scorePercent: 93.33,
          weightedScore: 27.99,
          status: "submitted",
          notes: "One pending activity still in review.",
          createdByRole: "hr_admin",
          submittedByRole: "manager",
          createdAt: "2035-06-01T01:00:00.000Z",
          updatedAt: "2035-06-20T01:00:00.000Z",
          submittedAt: "2035-06-19T01:00:00.000Z"
        },
        {
          id: "demo-kpi-3",
          employeeId: id,
          employeeName: "Mia Torres",
          employeeCode: "EMP-0289",
          department: "Human Resources",
          role: "HR Officer",
          kpiDefinitionId: "kpi-quality",
          kpiName: "Quality Score",
          unit: "%",
          period: "2035-06",
          targetValue: 90,
          actualValue: 88,
          weight: 20,
          scorePercent: 97.78,
          weightedScore: 19.56,
          status: "approved",
          notes: "Quality is stable and within target range.",
          createdByRole: "hr_admin",
          submittedByRole: "manager",
          approvedByRole: "manager",
          createdAt: "2035-06-01T01:00:00.000Z",
          updatedAt: "2035-06-20T01:00:00.000Z",
          submittedAt: "2035-06-15T01:00:00.000Z",
          approvedAt: "2035-06-18T01:00:00.000Z"
        },
        {
          id: "demo-kpi-4",
          employeeId: id,
          employeeName: "Mia Torres",
          employeeCode: "EMP-0289",
          department: "Human Resources",
          role: "HR Officer",
          kpiDefinitionId: "kpi-team",
          kpiName: "Team Collaboration",
          unit: "%",
          period: "2035-06",
          targetValue: 85,
          actualValue: 78,
          weight: 20,
          scorePercent: 91.76,
          weightedScore: 18.35,
          status: "draft",
          notes: "Awaiting final team feedback.",
          createdByRole: "hr_admin",
          createdAt: "2035-06-01T01:00:00.000Z",
          updatedAt: "2035-06-20T01:00:00.000Z"
        }
      ],
      tasks: [
        {
          id: "demo-task-1",
          employeeId: id,
          employeeName: "Mia Torres",
          employeeCode: "EMP-0289",
          title: "Complete Q2 onboarding checklist audit",
          description: "Validate missing checklist items and submit summary.",
          priority: "high",
          dueDate: "2035-06-24",
          status: "in_progress",
          percentComplete: 70,
          assignedBy: "manager",
          linkedKpiRecordId: "demo-kpi-2",
          createdAt: "2035-06-10T02:00:00.000Z",
          updatedAt: "2035-06-20T08:00:00.000Z"
        },
        {
          id: "demo-task-2",
          employeeId: id,
          employeeName: "Mia Torres",
          employeeCode: "EMP-0289",
          title: "Prepare monthly leave utilization report",
          description: "Submit leave trend report for management review.",
          priority: "medium",
          dueDate: "2035-06-21",
          status: "done_pending_approval",
          percentComplete: 100,
          assignedBy: "hr_admin",
          linkedKpiRecordId: "demo-kpi-1",
          createdAt: "2035-06-07T03:00:00.000Z",
          updatedAt: "2035-06-20T10:00:00.000Z"
        }
      ],
      taskUpdates: [
        {
          id: "demo-task-upd-1",
          taskId: "demo-task-1",
          actorId: id,
          actorRole: "employee",
          progressNote: "Collected missing onboarding files from department leads.",
          percentComplete: 70,
          createdAt: "2035-06-20T08:00:00.000Z"
        }
      ],
      taskSummary: {
        dueToday: 0,
        overdue: 0,
        pendingApprovals: 1,
        completionRate: 0
      }
    }
  };
}

export default async function EmployeeDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loadedData = await loadEmployeeDetail(id);
  const data = loadedData ?? createDemoEmployeeDetail(id);

  const employeeName = fullNameOf(data.employee);
  const employeeInitials = `${data.employee.firstName.slice(0, 1)}${data.employee.lastName.slice(0, 1)}`.toUpperCase();
  const snapshot = data.performanceSnapshot;
  const orderedAttendance = [...data.attendance].sort((a, b) =>
    a.workDate.localeCompare(b.workDate)
  );
  const attendanceWindow = orderedAttendance.slice(-12);
  const attendanceSeries = attendanceWindow.map((row) => Math.round((row.workHours / 8) * 100));
  const performanceSeries = snapshot?.kpiRecords.length
    ? snapshot.kpiRecords
        .slice()
        .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
        .map((record) => Math.round(record.scorePercent))
    : attendanceSeries;
  const performanceScore = performanceSeries.length
    ? Number(
        (
          performanceSeries.reduce((sum, value) => sum + value, 0) /
          performanceSeries.length
        ).toFixed(2)
      )
    : 0;
  const performanceDelta =
    performanceSeries.length > 1
      ? performanceSeries[performanceSeries.length - 1] - performanceSeries[0]
      : 0;

  const kpiSummaryScore = snapshot?.kpiSummary.normalizedWeightedScore ?? performanceScore;
  const kpiCompletionRate = snapshot?.kpiSummary.completionRate ?? 0;
  const kpiPendingApprovals = snapshot?.kpiSummary.pendingApprovals ?? 0;
  const kpiBreakdown = snapshot?.kpiRecords.slice(0, 4) ?? [];
  const taskSummary = snapshot?.taskSummary ?? {
    dueToday: 0,
    overdue: 0,
    pendingApprovals: 0,
    completionRate: 0
  };
  const employeeTasks = snapshot?.tasks.slice(0, 5) ?? [];

  const weeklyHours = orderedAttendance.slice(-7);
  const weekTotalHours = weeklyHours.reduce((sum, row) => sum + row.workHours, 0);
  const activeDates = new Set(orderedAttendance.map((row) => row.workDate.slice(0, 10)));
  const monthReference = orderedAttendance.length
    ? new Date(orderedAttendance[orderedAttendance.length - 1].workDate)
    : new Date();
  const calendarCells = buildMonthCells(monthReference, activeDates);

  const leaveMetrics: LeaveMetric[] = [
    toLeaveMetric("All Leaves", data.leaveBalances, () => true),
    toLeaveMetric("Annual Leaves", data.leaveBalances, (type) =>
      /annual|vacation/i.test(type)
    ),
    toLeaveMetric("Casual Leaves", data.leaveBalances, (type) => /casual/i.test(type), "Hours"),
    toLeaveMetric("Sick Leaves", data.leaveBalances, (type) => /sick/i.test(type))
  ];

  const latestPayroll = data.payrollRuns.length
    ? data.payrollRuns[0]
    : null;

  const payrollSummary = latestPayroll
    ? [
        { label: "Base Salary", amount: parseMoney(latestPayroll.basicPay) },
        { label: "Allowances", amount: parseMoney(latestPayroll.allowances) },
        { label: "Deductions", amount: parseMoney(latestPayroll.employeeDeductions) },
        { label: "Withholding Tax", amount: parseMoney(latestPayroll.withholdingTax) },
        { label: "Net Pay", amount: parseMoney(latestPayroll.netPay), strong: true }
      ]
    : [{ label: "Base Salary", amount: data.employee.basicSalary, strong: true }];

  const statusCounts = {
    present: orderedAttendance.filter((row) => row.status === "present").length,
    late: orderedAttendance.filter((row) => row.status === "late").length,
    onLeave: orderedAttendance.filter((row) => row.status === "leave").length,
    absent: orderedAttendance.filter((row) => row.status === "absent").length
  };

  const notesFromTasks = snapshot?.taskUpdates.slice(0, 2).map((update) => ({
    title: "Task Progress Update",
    date: formatDate(update.createdAt),
    content: update.progressNote
  })) ?? [];

  const notesFromLeave = data.leaveRequests.slice(0, 2).map((request) => ({
    title: request.status === "approved" ? "Approved Leave" : "Pending Request",
    date: formatDate(request.startDate),
    content: request.reason
  }));

  const notes = notesFromTasks.length ? notesFromTasks : notesFromLeave;

  const profileStatus =
    data.employee.employmentStatus === "active"
      ? "Active"
      : data.employee.employmentStatus === "on_leave"
        ? "On Leave"
        : data.employee.employmentStatus === "probation"
          ? "Probation"
          : "Inactive";

  const profileExtended = data.employee as EmployeeDetail & {
    sex?: string;
    gender?: string;
    birthDate?: string;
  };
  const genderValue = profileExtended.gender ?? profileExtended.sex ?? "Not set";
  const birthDateValue = profileExtended.birthDate
    ? formatDate(profileExtended.birthDate)
    : "Not set";

  return (
    <AppShell activePath="/employees">
      <section className="employee-details-page">
        <header className="employee-details-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/employees" className="employee-details-back">
              ← Employee Details
            </Link>
            <p className="breadcrumb">Dashboard / Employees / Employee Details</p>
          </div>
          <Link href={`/employees/${id}/edit`} className="button-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
            Edit Employee
          </Link>
        </header>

        <div className="employee-details-grid">
          <aside className="employee-details-left">
            <section className="card employee-profile-card">
              <div
                className={`employee-profile-avatar${
                  data.employee.profilePhotoUrl ? " has-photo" : ""
                }`}
              >
                {data.employee.profilePhotoUrl ? (
                  <img src={data.employee.profilePhotoUrl} alt={`${employeeName} photo`} />
                ) : (
                  employeeInitials
                )}
              </div>
              <h2>{employeeName}</h2>
              <p>
                {data.employee.position ?? "Unassigned"} ·{" "}
                {data.employee.department ?? "Unassigned"}
              </p>
              <div className="employee-profile-tags">
                <span className="badge">{data.employee.employeeCode}</span>
                <span className="badge success">{profileStatus}</span>
              </div>
              <div className="employee-profile-meta">
                <div>
                  <span>Employment Type</span>
                  <strong>
                    {data.employee.salaryType === "monthly"
                      ? "Full-Time"
                      : data.employee.salaryType === "daily"
                        ? "Part-Time"
                        : "Freelance"}
                  </strong>
                </div>
                <div>
                  <span>Work Model</span>
                  <strong>
                    {/design|product/i.test(data.employee.department ?? "")
                      ? "Remote"
                      : /operations|service|support/i.test(data.employee.department ?? "")
                        ? "On-Site"
                        : "Hybrid"}
                  </strong>
                </div>
                <div>
                  <span>Join Date</span>
                  <strong>{formatDate(data.employee.hireDate)}</strong>
                </div>
              </div>
              <div className="employee-social-row">
                <span>Social Media</span>
                <div className="employee-social-icons">
                  <button type="button" aria-label="LinkedIn">
                    <SocialIcon name="linkedin" />
                  </button>
                  <button type="button" aria-label="X">
                    <SocialIcon name="x" />
                  </button>
                  <button type="button" aria-label="Instagram">
                    <SocialIcon name="instagram" />
                  </button>
                </div>
              </div>
              <EmployeePhotoUploader
                employeeId={data.employee.id}
                currentPhotoUrl={data.employee.profilePhotoUrl}
              />
            </section>

            <section className="card employee-personal-card">
              <div className="section-title">
                <div>
                  <h2>Personal Info</h2>
                  <p>Master profile details</p>
                </div>
              </div>
              <div className="employee-personal-list">
                <div className="employee-personal-item">
                  <span className="employee-personal-icon">
                    <PersonalInfoIcon name="gender" />
                  </span>
                  <div>
                    <span>Gender</span>
                    <strong>{genderValue}</strong>
                  </div>
                </div>
                <div className="employee-personal-item">
                  <span className="employee-personal-icon">
                    <PersonalInfoIcon name="birth" />
                  </span>
                  <div>
                    <span>Date of Birth</span>
                    <strong>{birthDateValue}</strong>
                  </div>
                </div>
                <div className="employee-personal-item">
                  <span className="employee-personal-icon">
                    <PersonalInfoIcon name="email" />
                  </span>
                  <div>
                    <span>Email</span>
                    <strong>{data.employee.email ?? "Not set"}</strong>
                  </div>
                </div>
                <div className="employee-personal-item">
                  <span className="employee-personal-icon">
                    <PersonalInfoIcon name="phone" />
                  </span>
                  <div>
                    <span>Phone</span>
                    <strong>{data.employee.phone ?? "Not set"}</strong>
                  </div>
                </div>
                <div className="employee-personal-item">
                  <span className="employee-personal-icon">
                    <PersonalInfoIcon name="address" />
                  </span>
                  <div>
                    <span>Address</span>
                    <strong>{data.employee.address ?? "Not set"}</strong>
                  </div>
                </div>
                <div className="employee-personal-item">
                  <span className="employee-personal-icon">
                    <PersonalInfoIcon name="tin" />
                  </span>
                  <div>
                    <span>TIN</span>
                    <strong>{data.employee.governmentIds?.tin ?? "Not set"}</strong>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <main className="employee-details-main">
            <section className="employee-leave-rings">
              {leaveMetrics.map((metric) => (
                <LeaveRing key={metric.label} metric={metric} />
              ))}
            </section>

            <section className="card employee-performance-card">
              <div className="section-title">
                <div>
                  <h2>Performance Overview</h2>
                  <p>Monthly KPI weighted score trend</p>
                </div>
                <span className="chip">Last Year</span>
              </div>
              <div className="employee-performance-value">
                <strong>{kpiSummaryScore.toFixed(2)}%</strong>
                <span className={performanceDelta >= 0 ? "badge success" : "badge danger"}>
                  {performanceDelta >= 0 ? "+" : ""}
                  {performanceDelta.toFixed(2)}%
                </span>
              </div>
              <Sparkline values={performanceSeries} />
              {kpiBreakdown.length ? (
                <div className="employee-kpi-inline-list">
                  {kpiBreakdown.map((record) => (
                    <div key={record.id} className="employee-kpi-inline-item">
                      <span>{record.kpiName}</span>
                      <strong>{record.scorePercent.toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="employee-middle-row">
              <article className="card employee-hours-card">
                <div className="section-title">
                  <div>
                    <h2>Hours Logged</h2>
                    <p>This Week</p>
                  </div>
                  <span className="chip">{weekTotalHours.toFixed(1)} hrs</span>
                </div>
                <div className="employee-hours-bars">
                  {weeklyHours.map((entry) => (
                    <div key={entry.id} className="employee-hours-bar">
                      <strong>{entry.workHours.toFixed(1)}</strong>
                      <div
                        style={{
                          height: `${Math.max(18, Math.round((entry.workHours / 8) * 92))}%`
                        }}
                      />
                      <span>{shortDay(entry.workDate)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card employee-documents-card">
                <div className="section-title">
                  <div>
                    <h2>Documents</h2>
                    <p>Employee files</p>
                  </div>
                </div>
                <div className="employee-document-list">
                  {data.documents.slice(0, 4).map((document) => (
                    <a key={document.id} className="employee-document-item" href={document.fileUrl}>
                      <div className="employee-document-icon">PDF</div>
                      <div>
                        <strong>{document.fileName}</strong>
                        <span>
                          {document.documentType} · {formatShortDate(document.uploadedAt)}
                        </span>
                      </div>
                    </a>
                  ))}
                  {!data.documents.length ? (
                    <p className="muted">No documents found for this employee.</p>
                  ) : null}
                </div>
              </article>
            </section>

            <section className="employee-kpi-task-row">
              <article className="card employee-kpi-summary-card">
                <div className="section-title">
                  <div>
                    <h2>KPI Snapshot</h2>
                    <p>Live monthly KPI status</p>
                  </div>
                </div>
                <div className="employee-kpi-summary-metrics">
                  <div>
                    <span>Completion Rate</span>
                    <strong>{kpiCompletionRate}%</strong>
                  </div>
                  <div>
                    <span>Pending Approvals</span>
                    <strong>{kpiPendingApprovals}</strong>
                  </div>
                  <div>
                    <span>Weighted Score</span>
                    <strong>{kpiSummaryScore.toFixed(2)}%</strong>
                  </div>
                </div>
                <div className="employee-kpi-summary-list">
                  {kpiBreakdown.length ? (
                    kpiBreakdown.map((record) => (
                      <div key={record.id} className="employee-kpi-summary-item">
                        <div>
                          <strong>{record.kpiName}</strong>
                          <span>{record.weight.toFixed(1)}% weight</span>
                        </div>
                        <div>
                          <strong>{record.scorePercent.toFixed(1)}%</strong>
                          <span>{record.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No KPI records yet for this employee.</p>
                  )}
                </div>
              </article>

              <article className="card employee-task-summary-card">
                <div className="section-title">
                  <div>
                    <h2>Assigned Tasks</h2>
                    <p>Progress and approval state</p>
                  </div>
                </div>
                <div className="employee-task-summary-metrics">
                  <span>Due today {taskSummary.dueToday}</span>
                  <span>Overdue {taskSummary.overdue}</span>
                  <span>Pending approval {taskSummary.pendingApprovals}</span>
                  <span>Completed {taskSummary.completionRate}%</span>
                </div>
                <div className="employee-task-summary-list">
                  {employeeTasks.length ? (
                    employeeTasks.map((task) => (
                      <div key={task.id} className="employee-task-summary-item">
                        <div>
                          <strong>{task.title}</strong>
                          <span>
                            {formatShortDate(task.dueDate)} · {task.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        <div className="employee-task-progress-mini">
                          <i style={{ width: `${Math.max(0, Math.min(100, task.percentComplete))}%` }} />
                          <span>{task.percentComplete}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">No active tasks assigned yet.</p>
                  )}
                </div>
              </article>
            </section>

            <section className="card employee-notes-card">
              <div className="section-title">
                <div>
                  <h2>Internal Notes</h2>
                  <p>Leave and request history highlights</p>
                </div>
              </div>
              <div className="employee-notes-grid">
                {notes.map((note, index) => (
                  <article key={`${note.title}-${index}`} className="employee-note-item">
                    <strong>{note.title}</strong>
                    <span>{note.date}</span>
                    <p>{note.content}</p>
                  </article>
                ))}
                {!notes.length ? (
                  <article className="employee-note-item">
                    <strong>No internal notes yet</strong>
                    <span>{formatDate(new Date().toISOString())}</span>
                    <p>Approval comments and leave reasons will appear here.</p>
                  </article>
                ) : null}
              </div>
            </section>
          </main>

          <aside className="employee-details-right">
            <section className="card employee-calendar-card">
              <div className="section-title">
                <div>
                  <h2>
                    {monthReference.toLocaleString("en-PH", {
                      month: "long",
                      year: "numeric"
                    })}
                  </h2>
                </div>
              </div>
              <div className="employee-calendar-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <span key={day} className="employee-calendar-label">
                    {day}
                  </span>
                ))}
                {calendarCells.map((cell, index) => (
                  <span
                    key={`${cell.iso || "blank"}-${index}`}
                    className={`employee-calendar-day${cell.active ? " active" : ""}${
                      cell.inMonth ? "" : " muted"
                    }`}
                  >
                    {cell.day || ""}
                  </span>
                ))}
              </div>
              <div className="employee-calendar-legend">
                <span>Present {statusCounts.present}</span>
                <span>Late {statusCounts.late}</span>
                <span>On Leave {statusCounts.onLeave}</span>
                <span>Absent {statusCounts.absent}</span>
              </div>
            </section>

            <section className="card employee-payroll-card">
              <div className="section-title">
                <div>
                  <h2>Payroll Summary</h2>
                  <p>Latest run snapshot</p>
                </div>
              </div>
              <div className="employee-payroll-list">
                {payrollSummary.map((line) => (
                  <div key={line.label} className="employee-payroll-row">
                    <span>{line.label}</span>
                    <strong className={line.strong ? "strong" : ""}>{formatMoney(line.amount)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
