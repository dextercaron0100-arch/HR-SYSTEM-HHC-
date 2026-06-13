export type RoleName = "super_admin" | "hr_admin" | "manager" | "employee" | "finance";

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Position {
  id: string;
  title: string;
  level: string;
  departmentId: string;
}

export interface EmployeeGovernmentIds {
  tin?: string;
  sssNo?: string;
  philhealthNo?: string;
  pagibigNo?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  hireDate: string;
  employmentStatus: "active" | "probation" | "terminated" | "on_leave";
  salaryType: "hourly" | "daily" | "monthly";
  basicSalary: number;
  phone?: string;
  email?: string;
  address?: string;
  governmentIds?: EmployeeGovernmentIds;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  logType: "time_in" | "time_out" | "break_out" | "break_in";
  logDateTime: string;
  source: "web" | "mobile" | "device";
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled";
}

export interface PayrollPeriod {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  payDate: string;
  status: "draft" | "processing" | "completed";
}

export interface DashboardSummary {
  headcount: number;
  pendingApprovals: number;
  activeLeaves: number;
  openPayrollPeriods: number;
  attendanceExceptions: number;
}

export interface DashboardApprovalItem {
  title: string;
  status: string;
}

export interface DashboardLeaveItem {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface DashboardPayrollItem {
  id: string;
  name: string;
  payDate: string;
  status: string;
}

export interface DashboardScheduleItem {
  title: string;
  time: string;
  tag: string;
}

export interface DashboardEmployeeStatus {
  label: string;
  value: string;
  note: string;
  width: number;
}

export interface DashboardQuickStat {
  label: string;
  value: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  approvalQueue: DashboardApprovalItem[];
  leaveSnapshot: DashboardLeaveItem[];
  payrollSnapshot: DashboardPayrollItem[];
  scheduleItems: DashboardScheduleItem[];
  employeeStatus: DashboardEmployeeStatus[];
  performanceSeries: number[];
  attendanceCells: number[];
  satisfaction: string;
  satisfactionBreakdown: { label: string; score: string }[];
  quickStats: DashboardQuickStat[];
}

export type PerformanceReviewStatus = "draft" | "submitted" | "approved";

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  role: string;
  department: string;
  reviewPeriod: string;
  teamwork: number;
  workQuality: number;
  problemSolving: number;
  timeManagement: number;
  overallScore: number;
  status: PerformanceReviewStatus;
  comments: string;
  reviewerName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface PerformanceSummary {
  metrics: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
  };
  monthly: Array<{
    period: string;
    label: string;
    score: number;
  }>;
  categoryAverages: {
    teamwork: number;
    workQuality: number;
    problemSolving: number;
    timeManagement: number;
  };
  overallAverage: number;
  topPerformers: Array<{
    employeeId: string;
    name: string;
    role: string;
    score: number;
  }>;
  alerts: Array<{
    employeeId: string;
    name: string;
    role: string;
    timeManagement: number;
    message: string;
  }>;
  lastUpdated: string;
}

export type KpiRecordStatus = "draft" | "submitted" | "approved";
export type TaskStatus =
  | "assigned"
  | "in_progress"
  | "done_pending_approval"
  | "completed"
  | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  defaultTarget: number;
  defaultWeight: number;
  scopeDepartmentId?: string;
  scopePositionId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeKpiRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  role: string;
  kpiDefinitionId: string;
  kpiName: string;
  unit: string;
  period: string;
  targetValue: number;
  actualValue: number;
  weight: number;
  scorePercent: number;
  weightedScore: number;
  status: KpiRecordStatus;
  notes: string;
  createdByRole: string;
  submittedByRole?: string;
  approvedByRole?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface EmployeeKpiSummary {
  period: string;
  completionRate: number;
  pendingApprovals: number;
  totalWeightedScore: number;
  normalizedWeightedScore: number;
  items: number;
}

export interface EmployeeTask {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  percentComplete: number;
  assignedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  linkedKpiRecordId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeTaskUpdate {
  id: string;
  taskId: string;
  actorId: string;
  actorRole: string;
  progressNote: string;
  percentComplete: number;
  createdAt: string;
}

export interface EmployeeTaskSummary {
  dueToday: number;
  overdue: number;
  pendingApprovals: number;
  completionRate: number;
}

export interface EmployeePerformanceSnapshot {
  employeeId: string;
  period: string;
  kpiSummary: EmployeeKpiSummary;
  kpiRecords: EmployeeKpiRecord[];
  tasks: EmployeeTask[];
  taskUpdates: EmployeeTaskUpdate[];
  taskSummary: EmployeeTaskSummary;
}

export interface RecruitmentStat {
  label: string;
  value: string;
  delta: string;
  note: string;
}

export interface RecruitmentVacancy {
  title: string;
  type: string;
  mode: string;
  count: string;
}

export interface RecruitmentApplicant {
  name: string;
  email: string;
  role: string;
  department: string;
  applied: string;
  received: string;
  stage: string;
  tag: string;
}

export interface RecruitmentResource {
  label: string;
  value: string;
  count: string;
}

export interface RecruitmentDepartmentBar {
  label: string;
  value: number;
}

export interface RecruitmentScheduleItem {
  time: string;
  title: string;
  subtitle: string;
}

export interface RecruitmentData {
  stats: RecruitmentStat[];
  vacancies: RecruitmentVacancy[];
  applicants: RecruitmentApplicant[];
  resources: RecruitmentResource[];
  departmentBars: RecruitmentDepartmentBar[];
  scheduleItems: RecruitmentScheduleItem[];
  applicationSeries: number[];
}

export interface OnboardingSummary {
  newHires: number;
  inProgress: number;
  completed: number;
  pendingActions: number;
}

export interface OnboardingWorkflowItem {
  id: string;
  employeeName: string;
  department: string;
  role: string;
  startDate: string;
  stage: "paperwork" | "orientation" | "probation" | "completed";
  progress: number;
  owner: string;
  hasSignedContract: boolean;
  hasGovernmentIds: boolean;
  hasEquipmentRequest: boolean;
  hasBuddy: boolean;
}

export interface OnboardingTaskItem {
  id: string;
  title: string;
  employeeName: string;
  dueDate: string;
  status: "pending" | "completed";
}

export interface OnboardingChecklistItem {
  code: string;
  label: string;
}

export interface OnboardingData {
  summary: OnboardingSummary;
  workflows: OnboardingWorkflowItem[];
  tasks: OnboardingTaskItem[];
  checklist: OnboardingChecklistItem[];
}

export interface SettingsOverview {
  roles: { id: string; name: RoleName; description: string | null }[];
  departments: Department[];
  positions: Position[];
  activeUsers: number;
}
