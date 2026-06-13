"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import type {
  Employee,
  EmployeeKpiRecord,
  EmployeeTask,
  KpiDefinition,
  KpiRecordStatus,
  PerformanceReview,
  PerformanceReviewStatus,
  PerformanceSummary,
  TaskPriority,
  TaskStatus
} from "@hr/contracts";

type PerformanceWorkspaceProps = {
  employees: Employee[];
  reviews: PerformanceReview[];
  summary: PerformanceSummary;
  kpiDefinitions: KpiDefinition[];
  kpiRecords: EmployeeKpiRecord[];
  tasks: EmployeeTask[];
};

type PeriodValue = "6m" | "12m";
type ReviewFilter = "all" | PerformanceReviewStatus;

type ReviewFormState = {
  employeeId: string;
  reviewPeriod: string;
  teamwork: string;
  workQuality: string;
  problemSolving: string;
  timeManagement: string;
  reviewerName: string;
  comments: string;
};

type KpiRecordFormState = {
  employeeId: string;
  kpiDefinitionId: string;
  period: string;
  targetValue: string;
  actualValue: string;
  weight: string;
  notes: string;
};

type TaskFormState = {
  employeeId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  linkedKpiRecordId: string;
};

type TaskProgressFormState = {
  progressNote: string;
  percentComplete: string;
};

type LocalAuthUser = {
  role?: string;
  employeeId?: string;
  id?: string;
  email?: string;
};

type SegmentTone = "teal" | "gray" | "yellow";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toPercent = (value: number) => `${Math.round(clamp(value, 0, 100))}%`;
const normalizeRole = (value: string | undefined) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
const privilegedRoleSet = new Set([
  "hr_admin",
  "manager",
  "super_admin",
  "admin",
  "administrator",
  "head_admin"
]);

function SegmentedBar({ percent, tone, segments = 40 }: { percent: number; tone: SegmentTone; segments?: number }) {
  const activeCount = Math.round((percent / 100) * segments);

  return (
    <div className="performance-v2-segmented-row">
      {Array.from({ length: segments }).map((_, index) => (
        <span
          key={index}
          className={`performance-v2-segment${index < activeCount ? ` tone-${tone}` : " tone-empty"}`}
        />
      ))}
    </div>
  );
}

function VerticalSegmentedBar({ stacks }: { stacks: [number, number, number] }) {
  const total = stacks.reduce((sum, value) => sum + value, 0);
  const remainder = Math.max(0, 100 - total);

  return (
    <div className="performance-v2-vbar">
      <div className="performance-v2-vbar-empty" style={{ height: `${remainder}%` }} />
      <div className="performance-v2-vbar-soft" style={{ height: `${stacks[2]}%` }} />
      <div className="performance-v2-vbar-mid" style={{ height: `${stacks[1]}%` }} />
      <div className="performance-v2-vbar-dark" style={{ height: `${stacks[0]}%` }} />
    </div>
  );
}

function normalizeReviewPeriod(period: string) {
  if (!period) {
    return "";
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    return period;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return period.slice(0, 7);
  }
  return period;
}

function formatReviewPeriod(period: string) {
  const normalized = normalizeReviewPeriod(period);
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    return period;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(5, 7));
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return period;
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function currentReviewPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function createEmptyForm(employees: Employee[]): ReviewFormState {
  return {
    employeeId: employees[0]?.id ?? "",
    reviewPeriod: currentReviewPeriod(),
    teamwork: "4.0",
    workQuality: "4.0",
    problemSolving: "4.0",
    timeManagement: "4.0",
    reviewerName: "HR Dexter",
    comments: ""
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message[0] ?? fallback;
    }
    if (payload.message) {
      return payload.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function statusLabel(status: PerformanceReviewStatus) {
  if (status === "submitted") {
    return "Submitted";
  }
  if (status === "approved") {
    return "Approved";
  }
  return "Draft";
}

function kpiStatusLabel(status: KpiRecordStatus) {
  if (status === "submitted") {
    return "Submitted";
  }
  if (status === "approved") {
    return "Approved";
  }
  return "Draft";
}

function taskStatusLabel(status: TaskStatus) {
  if (status === "in_progress") {
    return "In Progress";
  }
  if (status === "done_pending_approval") {
    return "Pending Approval";
  }
  if (status === "completed") {
    return "Completed";
  }
  if (status === "overdue") {
    return "Overdue";
  }
  return "Assigned";
}

function priorityLabel(priority: TaskPriority) {
  if (priority === "critical") {
    return "Critical";
  }
  if (priority === "high") {
    return "High";
  }
  if (priority === "medium") {
    return "Medium";
  }
  return "Low";
}

export function PerformanceWorkspace({
  employees,
  reviews,
  summary,
  kpiDefinitions,
  kpiRecords,
  tasks
}: PerformanceWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<"reviews" | "kpis" | "tasks">("reviews");
  const [period, setPeriod] = useState<PeriodValue>("12m");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [reviewRows, setReviewRows] = useState<PerformanceReview[]>(reviews);
  const [summaryState, setSummaryState] = useState<PerformanceSummary>(summary);
  const [kpiDefinitionsState, setKpiDefinitionsState] = useState<KpiDefinition[]>(kpiDefinitions);
  const [kpiRows, setKpiRows] = useState<EmployeeKpiRecord[]>(kpiRecords);
  const [taskRows, setTaskRows] = useState<EmployeeTask[]>(tasks);
  const [kpiFilterPeriod, setKpiFilterPeriod] = useState(currentReviewPeriod());
  const [kpiFilterStatus, setKpiFilterStatus] = useState<"all" | KpiRecordStatus>("all");
  const [taskFilterStatus, setTaskFilterStatus] = useState<"all" | TaskStatus>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formState, setFormState] = useState<ReviewFormState>(() => createEmptyForm(employees));
  const [currentUser, setCurrentUser] = useState<LocalAuthUser | null>(null);

  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [editingKpiRecordId, setEditingKpiRecordId] = useState<string | null>(null);
  const [kpiFormError, setKpiFormError] = useState("");
  const [kpiFormState, setKpiFormState] = useState<KpiRecordFormState>({
    employeeId: employees[0]?.id ?? "",
    kpiDefinitionId: kpiDefinitions[0]?.id ?? "",
    period: currentReviewPeriod(),
    targetValue: "100",
    actualValue: "0",
    weight: "25",
    notes: ""
  });
  const [newDefinitionState, setNewDefinitionState] = useState({
    name: "",
    description: "",
    unit: "%",
    defaultTarget: "100",
    defaultWeight: "25"
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormError, setTaskFormError] = useState("");
  const [taskFormState, setTaskFormState] = useState<TaskFormState>({
    employeeId: employees[0]?.id ?? "",
    title: "",
    description: "",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
    linkedKpiRecordId: ""
  });
  const [progressTaskId, setProgressTaskId] = useState<string | null>(null);
  const [progressFormState, setProgressFormState] = useState<TaskProgressFormState>({
    progressNote: "",
    percentComplete: "0"
  });
  const [progressFormError, setProgressFormError] = useState("");

  const employeeOptions = useMemo(
    () =>
      employees
        .slice()
        .sort((first, second) => {
          const firstName = `${first.firstName} ${first.lastName}`.trim();
          const secondName = `${second.firstName} ${second.lastName}`.trim();
          return firstName.localeCompare(secondName);
        })
        .map((employee) => ({
          id: employee.id,
          label: `${employee.firstName} ${employee.lastName}`.trim(),
          code: employee.employeeCode
        })),
    [employees]
  );

  const normalizedRole = normalizeRole(currentUser?.role ?? "employee");
  const actorEmployeeId = currentUser?.employeeId || currentUser?.id || "";
  const canManagePerformance = privilegedRoleSet.has(normalizedRole);

  const authHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("hr_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      if (normalizedRole) {
        headers["x-hr-role"] = normalizedRole;
      }
      if (actorEmployeeId) {
        headers["x-hr-employee-id"] = actorEmployeeId;
      }
      if (currentUser?.id) {
        headers["x-hr-user-id"] = currentUser.id;
      }
      if (currentUser?.email) {
        headers["x-hr-user-email"] = currentUser.email;
      }
    }
    return headers;
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem("hr_user");
      if (!raw) {
        setCurrentUser({ role: "employee" });
        return;
      }
      const parsed = JSON.parse(raw) as LocalAuthUser;
      setCurrentUser(parsed ?? { role: "employee" });
    } catch {
      setCurrentUser({ role: "employee" });
    }
  }, []);

  const monthlySeries = useMemo(() => {
    const source = summaryState.monthly.length
      ? summaryState.monthly
      : monthLabels.map((label, index) => ({
          period: `0000-${String(index + 1).padStart(2, "0")}`,
          label,
          score: 0
        }));

    const selected = period === "6m" ? source.slice(-6) : source.slice(-12);
    return selected.map((entry) => {
      const dark = Math.round(entry.score * 0.24);
      const mid = Math.round(entry.score * 0.31);
      const soft = Math.max(0, entry.score - dark - mid);
      return {
        period: entry.period,
        label: entry.label,
        score: entry.score,
        stacks: [dark, mid, soft] as [number, number, number]
      };
    });
  }, [period, summaryState.monthly]);

  const categoryScores = useMemo(() => {
    const values = summaryState.categoryAverages;
    return [
      {
        label: "Team Work",
        score: values.teamwork,
        percent: Math.round((values.teamwork / 5) * 100),
        tone: "teal" as const
      },
      {
        label: "Work Quality",
        score: values.workQuality,
        percent: Math.round((values.workQuality / 5) * 100),
        tone: "teal" as const
      },
      {
        label: "Problem-Solving",
        score: values.problemSolving,
        percent: Math.round((values.problemSolving / 5) * 100),
        tone: "gray" as const
      },
      {
        label: "Time Management",
        score: values.timeManagement,
        percent: Math.round((values.timeManagement / 5) * 100),
        tone: "yellow" as const
      }
    ];
  }, [summaryState.categoryAverages]);

  const filteredRows = useMemo(() => {
    const normalized = reviewRows.slice().sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
    if (reviewFilter === "all") {
      return normalized;
    }
    return normalized.filter((review) => review.status === reviewFilter);
  }, [reviewFilter, reviewRows]);

  const filteredKpiRows = useMemo(() => {
    const source = kpiRows
      .slice()
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
      .filter((record) => (kpiFilterStatus === "all" ? true : record.status === kpiFilterStatus))
      .filter((record) => (kpiFilterPeriod ? record.period === kpiFilterPeriod : true));

    if (!canManagePerformance && actorEmployeeId) {
      return source.filter((record) => record.employeeId === actorEmployeeId);
    }
    return source;
  }, [actorEmployeeId, canManagePerformance, kpiFilterPeriod, kpiFilterStatus, kpiRows]);

  const filteredTaskRows = useMemo(() => {
    const source = taskRows
      .slice()
      .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
      .filter((task) => (taskFilterStatus === "all" ? true : task.status === taskFilterStatus));

    if (!canManagePerformance && actorEmployeeId) {
      return source.filter((task) => task.employeeId === actorEmployeeId);
    }
    return source;
  }, [actorEmployeeId, canManagePerformance, taskFilterStatus, taskRows]);

  const kpiOverview = useMemo(() => {
    const total = filteredKpiRows.length;
    const approved = filteredKpiRows.filter((record) => record.status === "approved").length;
    const submitted = filteredKpiRows.filter((record) => record.status === "submitted").length;
    const completionRate = total ? Math.round((approved / total) * 100) : 0;
    const weightedTotal = Number(
      filteredKpiRows.reduce((sum, row) => sum + row.weightedScore, 0).toFixed(2)
    );

    return {
      total,
      approved,
      submitted,
      completionRate,
      weightedTotal
    };
  }, [filteredKpiRows]);

  const taskOverview = useMemo(() => {
    const total = filteredTaskRows.length;
    const dueTodayIso = new Date().toISOString().slice(0, 10);
    const dueToday = filteredTaskRows.filter((task) => task.dueDate === dueTodayIso).length;
    const overdue = filteredTaskRows.filter((task) => task.status === "overdue").length;
    const pendingApproval = filteredTaskRows.filter(
      (task) => task.status === "done_pending_approval"
    ).length;
    const completed = filteredTaskRows.filter((task) => task.status === "completed").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      dueToday,
      overdue,
      pendingApproval,
      completionRate
    };
  }, [filteredTaskRows]);

  const topPerformers = summaryState.topPerformers;
  const alerts = summaryState.alerts;
  const overallScore = summaryState.overallAverage;
  const gaugeCircumference = Math.PI * 50;
  const gaugeOffset = gaugeCircumference * (1 - overallScore / 100);

  const refreshPerformanceData = async () => {
    setActionError("");
    try {
      const [reviewsResponse, summaryResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/performance/reviews`, { cache: "no-store" }),
        fetch(`${apiBaseUrl}/api/performance/summary`, { cache: "no-store" })
      ]);

      if (!reviewsResponse.ok) {
        throw new Error(await readErrorMessage(reviewsResponse, "Unable to refresh performance reviews."));
      }
      if (!summaryResponse.ok) {
        throw new Error(await readErrorMessage(summaryResponse, "Unable to refresh performance summary."));
      }

      const [nextReviews, nextSummary] = (await Promise.all([
        reviewsResponse.json(),
        summaryResponse.json()
      ])) as [PerformanceReview[], PerformanceSummary];

      startTransition(() => {
        setReviewRows(nextReviews);
        setSummaryState(nextSummary);
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to refresh performance data.");
    }
  };

  const refreshKpiTaskData = async () => {
    const employeeFilter =
      !canManagePerformance && actorEmployeeId
        ? `?employeeId=${encodeURIComponent(actorEmployeeId)}`
        : "";

    const [definitionsResponse, kpiRecordsResponse, tasksResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/performance/kpis/definitions`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/performance/kpis/records${employeeFilter}`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/performance/tasks${employeeFilter}`, { cache: "no-store" })
    ]);

    if (!definitionsResponse.ok) {
      throw new Error(await readErrorMessage(definitionsResponse, "Unable to load KPI definitions."));
    }
    if (!kpiRecordsResponse.ok) {
      throw new Error(await readErrorMessage(kpiRecordsResponse, "Unable to load KPI records."));
    }
    if (!tasksResponse.ok) {
      throw new Error(await readErrorMessage(tasksResponse, "Unable to load tasks."));
    }

    const [nextDefinitions, nextKpis, nextTasks] = (await Promise.all([
      definitionsResponse.json(),
      kpiRecordsResponse.json(),
      tasksResponse.json()
    ])) as [KpiDefinition[], EmployeeKpiRecord[], EmployeeTask[]];

    setKpiDefinitionsState(nextDefinitions);
    setKpiRows(nextKpis);
    setTaskRows(nextTasks);
  };

  const refreshAllPerformanceData = async () => {
    setIsRefreshing(true);
    setActionError("");
    try {
      await Promise.all([refreshPerformanceData(), refreshKpiTaskData()]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to refresh KPI/task data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    void refreshKpiTaskData().catch(() => {
      // Keep page usable even if new endpoints are temporarily unavailable.
    });
  }, [currentUser?.role, currentUser?.employeeId, currentUser?.id]);

  const openNewReviewModal = () => {
    setEditingReviewId(null);
    setFormState(createEmptyForm(employees));
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditReviewModal = (review: PerformanceReview) => {
    setEditingReviewId(review.id);
    setFormState({
      employeeId: review.employeeId,
      reviewPeriod: normalizeReviewPeriod(review.reviewPeriod),
      teamwork: review.teamwork.toFixed(1),
      workQuality: review.workQuality.toFixed(1),
      problemSolving: review.problemSolving.toFixed(1),
      timeManagement: review.timeManagement.toFixed(1),
      reviewerName: review.reviewerName || "HR Dexter",
      comments: review.comments || ""
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const saveReview = async () => {
    const employeeId = formState.employeeId.trim();
    const reviewPeriod = normalizeReviewPeriod(formState.reviewPeriod.trim());
    const teamwork = Number(formState.teamwork);
    const workQuality = Number(formState.workQuality);
    const problemSolving = Number(formState.problemSolving);
    const timeManagement = Number(formState.timeManagement);

    if (!employeeId) {
      setFormError("Employee is required.");
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(reviewPeriod)) {
      setFormError("Review period must be in YYYY-MM format.");
      return;
    }

    const scoreMap = { teamwork, workQuality, problemSolving, timeManagement };
    for (const [field, value] of Object.entries(scoreMap)) {
      if (!Number.isFinite(value) || value < 1 || value > 5) {
        setFormError(`${field} must be between 1 and 5.`);
        return;
      }
    }

    setIsSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        editingReviewId
          ? `${apiBaseUrl}/api/performance/reviews/${editingReviewId}`
          : `${apiBaseUrl}/api/performance/reviews`,
        {
          method: editingReviewId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            reviewPeriod,
            teamwork,
            workQuality,
            problemSolving,
            timeManagement,
            reviewerName: formState.reviewerName.trim(),
            comments: formState.comments.trim()
          })
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to save performance review."));
      }

      closeModal();
      await refreshPerformanceData();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save performance review.");
    } finally {
      setIsSaving(false);
    }
  };

  const submitReview = async (reviewId: string) => {
    setActionError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/reviews/${reviewId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerName: "HR Dexter" })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to submit review."));
      }

      await refreshPerformanceData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to submit review.");
    }
  };

  const approveReview = async (reviewId: string) => {
    setActionError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/reviews/${reviewId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerName: "HR Dexter" })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to approve review."));
      }

      await refreshPerformanceData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to approve review.");
    }
  };

  const openNewKpiModal = () => {
    setEditingKpiRecordId(null);
    setKpiFormState({
      employeeId: employees[0]?.id ?? "",
      kpiDefinitionId: kpiDefinitionsState[0]?.id ?? "",
      period: currentReviewPeriod(),
      targetValue: "100",
      actualValue: "0",
      weight: "25",
      notes: ""
    });
    setKpiFormError("");
    setIsKpiModalOpen(true);
  };

  const openEditKpiModal = (record: EmployeeKpiRecord) => {
    setEditingKpiRecordId(record.id);
    setKpiFormState({
      employeeId: record.employeeId,
      kpiDefinitionId: record.kpiDefinitionId,
      period: record.period,
      targetValue: String(record.targetValue),
      actualValue: String(record.actualValue),
      weight: String(record.weight),
      notes: record.notes
    });
    setKpiFormError("");
    setIsKpiModalOpen(true);
  };

  const saveKpiDefinition = async () => {
    if (!canManagePerformance) {
      setActionError("Only HR/Manager can create KPI definitions.");
      return;
    }
    if (!newDefinitionState.name.trim()) {
      setActionError("KPI definition name is required.");
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/kpis/definitions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: newDefinitionState.name.trim(),
          description: newDefinitionState.description.trim(),
          unit: newDefinitionState.unit.trim() || "%",
          defaultTarget: Number(newDefinitionState.defaultTarget),
          defaultWeight: Number(newDefinitionState.defaultWeight)
        })
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to create KPI definition."));
      }
      setNewDefinitionState({
        name: "",
        description: "",
        unit: "%",
        defaultTarget: "100",
        defaultWeight: "25"
      });
      await refreshKpiTaskData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to create KPI definition.");
    }
  };

  const saveKpiRecord = async () => {
    const employeeId = kpiFormState.employeeId.trim();
    const kpiDefinitionId = kpiFormState.kpiDefinitionId.trim();
    const periodValue = normalizeReviewPeriod(kpiFormState.period.trim());
    const targetValue = Number(kpiFormState.targetValue);
    const actualValue = Number(kpiFormState.actualValue);
    const weight = Number(kpiFormState.weight);

    if (!employeeId || !kpiDefinitionId) {
      setKpiFormError("Employee and KPI definition are required.");
      return;
    }
    if (!/^\d{4}-\d{2}$/.test(periodValue)) {
      setKpiFormError("Period must be in YYYY-MM format.");
      return;
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setKpiFormError("Target value must be greater than 0.");
      return;
    }
    if (!Number.isFinite(actualValue) || actualValue < 0) {
      setKpiFormError("Actual value must be 0 or higher.");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setKpiFormError("Weight must be greater than 0.");
      return;
    }

    setIsSaving(true);
    setKpiFormError("");
    try {
      const endpoint = editingKpiRecordId
        ? `${apiBaseUrl}/api/performance/kpis/records/${editingKpiRecordId}`
        : `${apiBaseUrl}/api/performance/kpis/records`;
      const response = await fetch(endpoint, {
        method: editingKpiRecordId ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          employeeId,
          kpiDefinitionId,
          period: periodValue,
          targetValue,
          actualValue,
          weight,
          notes: kpiFormState.notes.trim()
        })
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to save KPI record."));
      }
      setIsKpiModalOpen(false);
      await refreshKpiTaskData();
    } catch (error) {
      setKpiFormError(error instanceof Error ? error.message : "Unable to save KPI record.");
    } finally {
      setIsSaving(false);
    }
  };

  const submitKpiRecord = async (recordId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/kpis/records/${recordId}/submit`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to submit KPI record."));
      }
      await refreshKpiTaskData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to submit KPI record.");
    }
  };

  const approveKpiRecord = async (recordId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/kpis/records/${recordId}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to approve KPI record."));
      }
      await refreshKpiTaskData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to approve KPI record.");
    }
  };

  const openNewTaskModal = () => {
    setEditingTaskId(null);
    setTaskFormState({
      employeeId: employees[0]?.id ?? "",
      title: "",
      description: "",
      priority: "medium",
      dueDate: new Date().toISOString().slice(0, 10),
      linkedKpiRecordId: ""
    });
    setTaskFormError("");
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: EmployeeTask) => {
    setEditingTaskId(task.id);
    setTaskFormState({
      employeeId: task.employeeId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      linkedKpiRecordId: task.linkedKpiRecordId ?? ""
    });
    setTaskFormError("");
    setIsTaskModalOpen(true);
  };

  const saveTask = async () => {
    const employeeId = taskFormState.employeeId.trim();
    const title = taskFormState.title.trim();
    const dueDate = taskFormState.dueDate.trim();
    if (!employeeId || !title || !dueDate) {
      setTaskFormError("Employee, title, and due date are required.");
      return;
    }

    setIsSaving(true);
    setTaskFormError("");
    try {
      const endpoint = editingTaskId
        ? `${apiBaseUrl}/api/performance/tasks/${editingTaskId}`
        : `${apiBaseUrl}/api/performance/tasks`;
      const response = await fetch(endpoint, {
        method: editingTaskId ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          employeeId,
          title,
          description: taskFormState.description.trim(),
          priority: taskFormState.priority,
          dueDate,
          linkedKpiRecordId: taskFormState.linkedKpiRecordId || undefined
        })
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to save task."));
      }
      setIsTaskModalOpen(false);
      await refreshKpiTaskData();
    } catch (error) {
      setTaskFormError(error instanceof Error ? error.message : "Unable to save task.");
    } finally {
      setIsSaving(false);
    }
  };

  const markTaskDone = async (taskId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/tasks/${taskId}/mark-done`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to mark task done."));
      }
      await refreshKpiTaskData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to mark task done.");
    }
  };

  const approveTask = async (taskId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/tasks/${taskId}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to approve task."));
      }
      await refreshKpiTaskData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to approve task.");
    }
  };

  const openProgressModal = (taskId: string, percentComplete: number) => {
    setProgressTaskId(taskId);
    setProgressFormState({
      progressNote: "",
      percentComplete: String(percentComplete)
    });
    setProgressFormError("");
  };

  const saveTaskProgress = async () => {
    if (!progressTaskId) {
      return;
    }
    const percentComplete = Number(progressFormState.percentComplete);
    if (!progressFormState.progressNote.trim()) {
      setProgressFormError("Progress note is required.");
      return;
    }
    if (!Number.isFinite(percentComplete) || percentComplete < 0 || percentComplete > 100) {
      setProgressFormError("Percent complete must be between 0 and 100.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/performance/tasks/${progressTaskId}/progress`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          progressNote: progressFormState.progressNote.trim(),
          percentComplete
        })
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Unable to save task progress."));
      }
      setProgressTaskId(null);
      await refreshKpiTaskData();
    } catch (error) {
      setProgressFormError(error instanceof Error ? error.message : "Unable to save task progress.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="performance-v2">
      <header className="performance-v2-intro performance-v2-intro-row">
        <div>
          <h2>Performance</h2>
          <p className="breadcrumb">Dashboard / Performance</p>
        </div>
        <div className="performance-v2-toolbar">
          {activeSection === "reviews" ? (
            <button
              type="button"
              className="performance-v2-primary-btn"
              onClick={openNewReviewModal}
            >
              Add Review
            </button>
          ) : null}
          {activeSection === "kpis" && canManagePerformance ? (
            <button
              type="button"
              className="performance-v2-primary-btn"
              onClick={openNewKpiModal}
            >
              Add KPI Record
            </button>
          ) : null}
          {activeSection === "tasks" && canManagePerformance ? (
            <button
              type="button"
              className="performance-v2-primary-btn"
              onClick={openNewTaskModal}
            >
              Assign Task
            </button>
          ) : null}
          <button
            type="button"
            className="performance-v2-secondary-btn"
            onClick={() => void refreshAllPerformanceData()}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="performance-v2-tabs">
        <button
          type="button"
          className={activeSection === "reviews" ? "is-active" : ""}
          onClick={() => setActiveSection("reviews")}
        >
          Reviews
        </button>
        <button
          type="button"
          className={activeSection === "kpis" ? "is-active" : ""}
          onClick={() => setActiveSection("kpis")}
        >
          KPIs
        </button>
        <button
          type="button"
          className={activeSection === "tasks" ? "is-active" : ""}
          onClick={() => setActiveSection("tasks")}
        >
          Tasks
        </button>
      </div>

      {activeSection === "reviews" ? (
      <div className="performance-v2-stats-row">
        <article className="card performance-v2-stat-card">
          <span>Total Reviews</span>
          <strong>{summaryState.metrics.total}</strong>
        </article>
        <article className="card performance-v2-stat-card">
          <span>Draft</span>
          <strong>{summaryState.metrics.draft}</strong>
        </article>
        <article className="card performance-v2-stat-card">
          <span>Submitted</span>
          <strong>{summaryState.metrics.submitted}</strong>
        </article>
        <article className="card performance-v2-stat-card">
          <span>Approved</span>
          <strong>{summaryState.metrics.approved}</strong>
        </article>
      </div>
      ) : null}

      {activeSection === "reviews" ? (
      <div className="performance-v2-layout">
        <main className="performance-v2-main">
          <section className="performance-v2-top">
            <article className="card performance-v2-team">
              <div className="section-title">
                <div>
                  <h2>Team Performance</h2>
                </div>
                <select
                  className="performance-v2-select"
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as PeriodValue)}
                >
                  <option value="12m">Last Year</option>
                  <option value="6m">Last 6 Months</option>
                </select>
              </div>
              <div className="performance-v2-team-plot">
                <div className="performance-v2-bars">
                  {monthlySeries.map((point) => (
                    <div key={point.period} className="performance-v2-bar-item">
                      <strong>{toPercent(point.score)}</strong>
                      <VerticalSegmentedBar stacks={point.stacks} />
                      <small>{point.label}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="performance-v2-team-foot">
                {topPerformers.slice(0, 4).map((performer) => (
                  <span key={performer.employeeId}>{performer.name}</span>
                ))}
              </div>
            </article>

            <article className="card performance-v2-categories">
              <div className="section-title">
                <div>
                  <h2>Performance by Category</h2>
                </div>
                <span className="badge">Live API</span>
              </div>
              <div className="performance-v2-category-list">
                {categoryScores.map((item) => (
                  <div key={item.label} className="performance-v2-category-row">
                    <div className="performance-v2-category-head">
                      <span>{item.label}</span>
                      <strong>
                        {item.score.toFixed(1)}/5 | {item.percent}%
                      </strong>
                    </div>
                    <SegmentedBar percent={item.percent} tone={item.tone} />
                  </div>
                ))}
              </div>
            </article>
          </section>

          <article className="card performance-v2-table-card">
            <div className="section-title">
              <div>
                <h2>Employee Performance</h2>
              </div>
              <select
                className="performance-v2-select"
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value as ReviewFilter)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            {actionError ? <p className="performance-v2-error">{actionError}</p> : null}

            <div className="applicant-table-wrap">
              <table className="table performance-v2-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Job Title</th>
                    <th>Period</th>
                    <th>Teamwork</th>
                    <th>Work Quality</th>
                    <th>Problem Solving</th>
                    <th>Time Management</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="applicant-person">
                            <div className="avatar applicant-avatar">{row.employeeName.slice(0, 1)}</div>
                            <div>
                              <strong>{row.employeeName}</strong>
                              <div className="muted">{row.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{row.role}</strong>
                          <div className="muted">{row.department}</div>
                        </td>
                        <td>{formatReviewPeriod(row.reviewPeriod)}</td>
                        <td>{row.teamwork.toFixed(1)}</td>
                        <td>{row.workQuality.toFixed(1)}</td>
                        <td>{row.problemSolving.toFixed(1)}</td>
                        <td>{row.timeManagement.toFixed(1)}</td>
                        <td>
                          <strong className="performance-v2-score">{row.overallScore}</strong>
                        </td>
                        <td>
                          <span className={`performance-v2-status performance-v2-status-${row.status}`}>
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td>
                          <div className="performance-v2-row-actions">
                            {row.status === "draft" ? (
                              <>
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => openEditReviewModal(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => void submitReview(row.id)}
                                >
                                  Submit
                                </button>
                              </>
                            ) : null}
                            {row.status === "submitted" ? (
                              <button
                                type="button"
                                className="performance-v2-link-btn"
                                onClick={() => void approveReview(row.id)}
                              >
                                Approve
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="performance-v2-empty-table">
                        No performance reviews found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="performance-v2-table-footer">
              <span>
                Showing <strong>{filteredRows.length}</strong> of <strong>{reviewRows.length}</strong> reviews
              </span>
            </footer>
          </article>
        </main>

        <aside className="performance-v2-rail">
          <section className="card performance-v2-average">
            <div className="section-title">
              <div>
                <h2>Average Performance</h2>
              </div>
              <span className="menu-dots">...</span>
            </div>
            <div className="performance-v2-gauge">
              <svg viewBox="0 0 120 70" aria-label={`Average performance ${overallScore}%`}>
                <path d="M 10 60 A 50 50 0 0 1 110 60" className="performance-v2-gauge-bg" />
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  className="performance-v2-gauge-fg"
                  style={{
                    strokeDasharray: `${gaugeCircumference}`,
                    strokeDashoffset: `${gaugeOffset}`
                  }}
                />
              </svg>
              <div className="performance-v2-gauge-text">
                <span>Total Score</span>
                <strong>{overallScore}%</strong>
                <small>Live summary</small>
              </div>
            </div>
          </section>

          <section className="card performance-v2-top-list">
            <div className="section-title">
              <div>
                <h2>Top Performers</h2>
              </div>
              <span className="menu-dots">...</span>
            </div>
            <div className="stack">
              {topPerformers.length ? (
                topPerformers.map((performer) => (
                  <div key={performer.employeeId} className="performance-v2-person">
                    <div className="applicant-person">
                      <div className="avatar applicant-avatar">{performer.name.slice(0, 1)}</div>
                      <div>
                        <strong>{performer.name}</strong>
                        <div className="muted">{performer.role}</div>
                      </div>
                    </div>
                    <strong>{performer.score}/100</strong>
                  </div>
                ))
              ) : (
                <p className="muted">No performance reviews yet.</p>
              )}
            </div>
          </section>

          <section className="card performance-v2-alerts">
            <div className="section-title">
              <div>
                <h2>Time Management Alerts</h2>
              </div>
              <span className="menu-dots">...</span>
            </div>
            <div className="stack">
              {alerts.length ? (
                alerts.map((alert) => (
                  <article key={alert.employeeId} className="performance-v2-alert-item">
                    <div className="applicant-person">
                      <div className="avatar applicant-avatar">{alert.name.slice(0, 1)}</div>
                      <div>
                        <strong>{alert.name}</strong>
                        <span>{alert.role}</span>
                      </div>
                    </div>
                    <p>{alert.message}</p>
                  </article>
                ))
              ) : (
                <p className="muted">No alerts yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
      ) : null}

      {activeSection === "kpis" ? (
        <div className="performance-v2-kpi-layout">
          <div className="performance-v2-stats-row">
            <article className="card performance-v2-stat-card">
              <span>KPI Definitions</span>
              <strong>{kpiDefinitionsState.length}</strong>
            </article>
            <article className="card performance-v2-stat-card">
              <span>KPI Records</span>
              <strong>{kpiOverview.total}</strong>
            </article>
            <article className="card performance-v2-stat-card">
              <span>Pending Approvals</span>
              <strong>{kpiOverview.submitted}</strong>
            </article>
            <article className="card performance-v2-stat-card">
              <span>Completion Rate</span>
              <strong>{kpiOverview.completionRate}%</strong>
            </article>
          </div>

          {canManagePerformance ? (
            <article className="card performance-v2-quick-form">
              <div className="section-title">
                <div>
                  <h2>Create KPI Definition</h2>
                  <p>Add reusable KPIs for departments and positions.</p>
                </div>
              </div>
              <div className="performance-v2-form-grid performance-v2-kpi-definition-form">
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    value={newDefinitionState.name}
                    onChange={(event) =>
                      setNewDefinitionState((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Attendance Compliance"
                  />
                </label>
                <label>
                  <span>Unit</span>
                  <input
                    type="text"
                    value={newDefinitionState.unit}
                    onChange={(event) =>
                      setNewDefinitionState((current) => ({ ...current, unit: event.target.value }))
                    }
                    placeholder="%"
                  />
                </label>
                <label>
                  <span>Default Target</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDefinitionState.defaultTarget}
                    onChange={(event) =>
                      setNewDefinitionState((current) => ({
                        ...current,
                        defaultTarget: event.target.value
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Default Weight</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDefinitionState.defaultWeight}
                    onChange={(event) =>
                      setNewDefinitionState((current) => ({
                        ...current,
                        defaultWeight: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="performance-v2-full-span">
                  <span>Description</span>
                  <textarea
                    rows={2}
                    value={newDefinitionState.description}
                    onChange={(event) =>
                      setNewDefinitionState((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                    placeholder="How the KPI is measured."
                  />
                </label>
              </div>
              <div className="performance-v2-modal-actions">
                <button
                  type="button"
                  className="performance-v2-primary-btn"
                  onClick={() => void saveKpiDefinition()}
                  disabled={isSaving}
                >
                  Create KPI Definition
                </button>
              </div>
            </article>
          ) : null}

          <article className="card performance-v2-table-card">
            <div className="section-title">
              <div>
                <h2>KPI Records</h2>
                <p>Monthly target vs actual with weighted scoring.</p>
              </div>
              <div className="performance-v2-inline-actions">
                <input
                  type="month"
                  className="performance-v2-select performance-v2-month-input"
                  value={kpiFilterPeriod}
                  onChange={(event) => setKpiFilterPeriod(event.target.value)}
                />
                <select
                  className="performance-v2-select"
                  value={kpiFilterStatus}
                  onChange={(event) =>
                    setKpiFilterStatus(event.target.value as "all" | KpiRecordStatus)
                  }
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {actionError ? <p className="performance-v2-error">{actionError}</p> : null}

            <div className="applicant-table-wrap">
              <table className="table performance-v2-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>KPI</th>
                    <th>Period</th>
                    <th>Target</th>
                    <th>Actual</th>
                    <th>Weight</th>
                    <th>Score %</th>
                    <th>Weighted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKpiRows.length ? (
                    filteredKpiRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="applicant-person">
                            <div className="avatar applicant-avatar">{row.employeeName.slice(0, 1)}</div>
                            <div>
                              <strong>{row.employeeName}</strong>
                              <div className="muted">{row.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{row.kpiName}</strong>
                          <div className="muted">{row.department}</div>
                        </td>
                        <td>{formatReviewPeriod(row.period)}</td>
                        <td>{row.targetValue.toFixed(2)}</td>
                        <td>{row.actualValue.toFixed(2)}</td>
                        <td>{row.weight.toFixed(2)}%</td>
                        <td>{row.scorePercent.toFixed(2)}%</td>
                        <td>{row.weightedScore.toFixed(2)}</td>
                        <td>
                          <span className={`performance-v2-status performance-v2-status-${row.status}`}>
                            {kpiStatusLabel(row.status)}
                          </span>
                        </td>
                        <td>
                          <div className="performance-v2-row-actions">
                            {row.status === "draft" && canManagePerformance ? (
                              <>
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => openEditKpiModal(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => void submitKpiRecord(row.id)}
                                >
                                  Submit
                                </button>
                              </>
                            ) : null}
                            {row.status === "submitted" && canManagePerformance ? (
                              <button
                                type="button"
                                className="performance-v2-link-btn"
                                onClick={() => void approveKpiRecord(row.id)}
                              >
                                Approve
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="performance-v2-empty-table">
                        No KPI records found for the selected period and status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="performance-v2-table-footer">
              <span>
                Showing <strong>{filteredKpiRows.length}</strong> KPI records
              </span>
              <span>
                Total weighted score <strong>{kpiOverview.weightedTotal.toFixed(2)}</strong>
              </span>
            </footer>
          </article>
        </div>
      ) : null}

      {activeSection === "tasks" ? (
        <div className="performance-v2-task-layout">
          <div className="performance-v2-stats-row">
            <article className="card performance-v2-stat-card">
              <span>Total Tasks</span>
              <strong>{taskOverview.total}</strong>
            </article>
            <article className="card performance-v2-stat-card">
              <span>Due Today</span>
              <strong>{taskOverview.dueToday}</strong>
            </article>
            <article className="card performance-v2-stat-card">
              <span>Overdue</span>
              <strong>{taskOverview.overdue}</strong>
            </article>
            <article className="card performance-v2-stat-card">
              <span>Completion Rate</span>
              <strong>{taskOverview.completionRate}%</strong>
            </article>
          </div>

          <article className="card performance-v2-table-card">
            <div className="section-title">
              <div>
                <h2>Employee Tasks</h2>
                <p>Assign, track progress, and approve completion.</p>
              </div>
              <div className="performance-v2-inline-actions">
                <select
                  className="performance-v2-select"
                  value={taskFilterStatus}
                  onChange={(event) =>
                    setTaskFilterStatus(event.target.value as "all" | TaskStatus)
                  }
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done_pending_approval">Pending Approval</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {actionError ? <p className="performance-v2-error">{actionError}</p> : null}

            <div className="applicant-table-wrap">
              <table className="table performance-v2-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Task</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTaskRows.length ? (
                    filteredTaskRows.map((row) => {
                      const isOwner = actorEmployeeId && row.employeeId === actorEmployeeId;
                      const canUpdateProgress = canManagePerformance || isOwner;
                      const canMarkDone =
                        canUpdateProgress &&
                        ["assigned", "in_progress", "overdue"].includes(row.status);

                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="applicant-person">
                              <div className="avatar applicant-avatar">{row.employeeName.slice(0, 1)}</div>
                              <div>
                                <strong>{row.employeeName}</strong>
                                <div className="muted">{row.employeeCode}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{row.title}</strong>
                            <div className="muted">{row.description || "No description"}</div>
                          </td>
                          <td>{formatDate(row.dueDate)}</td>
                          <td>
                            <span className={`performance-v2-status performance-v2-priority-${row.priority}`}>
                              {priorityLabel(row.priority)}
                            </span>
                          </td>
                          <td>
                            <div className="performance-v2-task-progress">
                              <span>{row.percentComplete}%</span>
                              <div className="performance-v2-task-progress-track">
                                <i style={{ width: `${Math.min(100, Math.max(0, row.percentComplete))}%` }} />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`performance-v2-status performance-v2-task-status-${row.status}`}>
                              {taskStatusLabel(row.status)}
                            </span>
                          </td>
                          <td>
                            <div className="performance-v2-row-actions">
                              {canManagePerformance && row.status !== "completed" ? (
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => openEditTaskModal(row)}
                                >
                                  Edit
                                </button>
                              ) : null}
                              {canUpdateProgress && row.status !== "completed" ? (
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => openProgressModal(row.id, row.percentComplete)}
                                >
                                  Progress
                                </button>
                              ) : null}
                              {canMarkDone ? (
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => void markTaskDone(row.id)}
                                >
                                  Mark Done
                                </button>
                              ) : null}
                              {canManagePerformance && row.status === "done_pending_approval" ? (
                                <button
                                  type="button"
                                  className="performance-v2-link-btn"
                                  onClick={() => void approveTask(row.id)}
                                >
                                  Approve
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="performance-v2-empty-table">
                        No tasks found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className="performance-v2-table-footer">
              <span>
                Pending approval <strong>{taskOverview.pendingApproval}</strong> task(s)
              </span>
              <span>
                Showing <strong>{filteredTaskRows.length}</strong> tasks
              </span>
            </footer>
          </article>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="performance-v2-modal-backdrop" role="dialog" aria-modal="true">
          <div className="performance-v2-modal card">
            <div className="section-title">
              <div>
                <h2>{editingReviewId ? "Edit Performance Review" : "Add Performance Review"}</h2>
                <p>Record employee performance scorecards and approval flow.</p>
              </div>
            </div>

            <div className="performance-v2-form-grid">
              <label>
                <span>Employee</span>
                <select
                  value={formState.employeeId}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, employeeId: event.target.value }))
                  }
                >
                  {employeeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} ({option.code})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Review Period</span>
                <input
                  type="month"
                  value={formState.reviewPeriod}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, reviewPeriod: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="performance-v2-score-grid">
              <label>
                <span>Teamwork (1-5)</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formState.teamwork}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, teamwork: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Work Quality (1-5)</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formState.workQuality}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, workQuality: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Problem Solving (1-5)</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formState.problemSolving}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, problemSolving: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Time Management (1-5)</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formState.timeManagement}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, timeManagement: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="performance-v2-form-grid">
              <label>
                <span>Reviewer</span>
                <input
                  type="text"
                  value={formState.reviewerName}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, reviewerName: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Comments</span>
                <textarea
                  rows={3}
                  value={formState.comments}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, comments: event.target.value }))
                  }
                />
              </label>
            </div>

            {formError ? <p className="performance-v2-error">{formError}</p> : null}

            <div className="performance-v2-modal-actions">
              <button
                type="button"
                className="performance-v2-secondary-btn"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="performance-v2-primary-btn"
                onClick={() => void saveReview()}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editingReviewId ? "Update Draft" : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isKpiModalOpen ? (
        <div className="performance-v2-modal-backdrop" role="dialog" aria-modal="true">
          <div className="performance-v2-modal card">
            <div className="section-title">
              <div>
                <h2>{editingKpiRecordId ? "Edit KPI Record" : "Add KPI Record"}</h2>
                <p>Track monthly KPI targets, actuals, and weighted scores.</p>
              </div>
            </div>

            <div className="performance-v2-form-grid">
              <label>
                <span>Employee</span>
                <select
                  value={kpiFormState.employeeId}
                  onChange={(event) =>
                    setKpiFormState((current) => ({ ...current, employeeId: event.target.value }))
                  }
                >
                  {employeeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} ({option.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>KPI Definition</span>
                <select
                  value={kpiFormState.kpiDefinitionId}
                  onChange={(event) =>
                    setKpiFormState((current) => ({
                      ...current,
                      kpiDefinitionId: event.target.value
                    }))
                  }
                >
                  {kpiDefinitionsState.map((definition) => (
                    <option key={definition.id} value={definition.id}>
                      {definition.name} ({definition.unit})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Period</span>
                <input
                  type="month"
                  value={kpiFormState.period}
                  onChange={(event) =>
                    setKpiFormState((current) => ({ ...current, period: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Target Value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={kpiFormState.targetValue}
                  onChange={(event) =>
                    setKpiFormState((current) => ({ ...current, targetValue: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Actual Value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={kpiFormState.actualValue}
                  onChange={(event) =>
                    setKpiFormState((current) => ({ ...current, actualValue: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Weight (%)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={kpiFormState.weight}
                  onChange={(event) =>
                    setKpiFormState((current) => ({ ...current, weight: event.target.value }))
                  }
                />
              </label>
              <label className="performance-v2-full-span">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={kpiFormState.notes}
                  onChange={(event) =>
                    setKpiFormState((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </label>
            </div>

            {kpiFormError ? <p className="performance-v2-error">{kpiFormError}</p> : null}

            <div className="performance-v2-modal-actions">
              <button
                type="button"
                className="performance-v2-secondary-btn"
                onClick={() => {
                  setIsKpiModalOpen(false);
                  setKpiFormError("");
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="performance-v2-primary-btn"
                onClick={() => void saveKpiRecord()}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editingKpiRecordId ? "Update Record" : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isTaskModalOpen ? (
        <div className="performance-v2-modal-backdrop" role="dialog" aria-modal="true">
          <div className="performance-v2-modal card">
            <div className="section-title">
              <div>
                <h2>{editingTaskId ? "Edit Task" : "Assign Task"}</h2>
                <p>Assign and track employee work items tied to performance.</p>
              </div>
            </div>

            <div className="performance-v2-form-grid">
              <label>
                <span>Employee</span>
                <select
                  value={taskFormState.employeeId}
                  onChange={(event) =>
                    setTaskFormState((current) => ({ ...current, employeeId: event.target.value }))
                  }
                >
                  {employeeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} ({option.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Priority</span>
                <select
                  value={taskFormState.priority}
                  onChange={(event) =>
                    setTaskFormState((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority
                    }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
              <label className="performance-v2-full-span">
                <span>Task Title</span>
                <input
                  type="text"
                  value={taskFormState.title}
                  onChange={(event) =>
                    setTaskFormState((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Complete monthly attendance reconciliation"
                />
              </label>
              <label className="performance-v2-full-span">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={taskFormState.description}
                  onChange={(event) =>
                    setTaskFormState((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Due Date</span>
                <input
                  type="date"
                  value={taskFormState.dueDate}
                  onChange={(event) =>
                    setTaskFormState((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Linked KPI Record (optional)</span>
                <select
                  value={taskFormState.linkedKpiRecordId}
                  onChange={(event) =>
                    setTaskFormState((current) => ({
                      ...current,
                      linkedKpiRecordId: event.target.value
                    }))
                  }
                >
                  <option value="">Not Linked</option>
                  {kpiRows
                    .filter((record) => record.employeeId === taskFormState.employeeId)
                    .map((record) => (
                      <option key={record.id} value={record.id}>
                        {record.kpiName} ({record.period})
                      </option>
                    ))}
                </select>
              </label>
            </div>

            {taskFormError ? <p className="performance-v2-error">{taskFormError}</p> : null}

            <div className="performance-v2-modal-actions">
              <button
                type="button"
                className="performance-v2-secondary-btn"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setTaskFormError("");
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="performance-v2-primary-btn"
                onClick={() => void saveTask()}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : editingTaskId ? "Update Task" : "Assign Task"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {progressTaskId ? (
        <div className="performance-v2-modal-backdrop" role="dialog" aria-modal="true">
          <div className="performance-v2-modal card performance-v2-progress-modal">
            <div className="section-title">
              <div>
                <h2>Update Task Progress</h2>
                <p>Log employee progress and keep an audit trail.</p>
              </div>
            </div>

            <div className="performance-v2-form-grid">
              <label className="performance-v2-full-span">
                <span>Progress Note</span>
                <textarea
                  rows={3}
                  value={progressFormState.progressNote}
                  onChange={(event) =>
                    setProgressFormState((current) => ({
                      ...current,
                      progressNote: event.target.value
                    }))
                  }
                  placeholder="Describe completed work and blockers."
                />
              </label>
              <label>
                <span>Percent Complete</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={progressFormState.percentComplete}
                  onChange={(event) =>
                    setProgressFormState((current) => ({
                      ...current,
                      percentComplete: event.target.value
                    }))
                  }
                />
              </label>
            </div>

            {progressFormError ? <p className="performance-v2-error">{progressFormError}</p> : null}

            <div className="performance-v2-modal-actions">
              <button
                type="button"
                className="performance-v2-secondary-btn"
                onClick={() => {
                  setProgressTaskId(null);
                  setProgressFormError("");
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="performance-v2-primary-btn"
                onClick={() => void saveTaskProgress()}
                disabled={isSaving}
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
