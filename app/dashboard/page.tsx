export const dynamic = "force-dynamic";

import type { DashboardData, EmployeeKpiRecord, EmployeeTask, RecruitmentData } from "@hr/contracts";

import { AppShell } from "../../components/AppShell";
import { DashboardCalendar } from "../../components/DashboardCalendar";
import { apiGet } from "../../lib/api";

const emptyDashboard: DashboardData = {
  summary: {
    headcount: 0,
    pendingApprovals: 0,
    activeLeaves: 0,
    openPayrollPeriods: 0,
    attendanceExceptions: 0
  },
  approvalQueue: [],
  leaveSnapshot: [],
  payrollSnapshot: [],
  scheduleItems: [],
  employeeStatus: [],
  performanceSeries: [],
  attendanceCells: Array.from({ length: 35 }, () => 0),
  satisfaction: "0%",
  satisfactionBreakdown: [],
  quickStats: []
};

const emptyRecruitment: RecruitmentData = {
  stats: [],
  vacancies: [],
  applicants: [],
  resources: [],
  departmentBars: [],
  scheduleItems: [],
  applicationSeries: []
};

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const numericFromText = (value: string) => Number(value.replace(/[^0-9.]/g, "")) || 0;

const toPercentText = (value: number) => `${value.toFixed(2)}%`;

const ratingText = (score: string) => {
  const numeric = Number(score.replace(/[^0-9.]/g, "")) || 0;
  const full = Math.max(0, Math.min(5, Math.round(numeric)));
  return `${"*".repeat(full)}${".".repeat(5 - full)} ${score}`;
};

const parseIsoDateUtc = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
};

const formatIsoDateUtc = (value: Date) =>
  `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(
    value.getUTCDate()
  ).padStart(2, "0")}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));

const todayInManilaIso = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
};

async function loadDashboard() {
  try {
    const [dashboard, recruitment, kpiRecords, performanceTasks] = await Promise.all([
      apiGet<DashboardData>("/dashboard"),
      apiGet<RecruitmentData>("/recruitment").catch(() => emptyRecruitment),
      apiGet<EmployeeKpiRecord[]>("/performance/kpis/records").catch(() => []),
      apiGet<EmployeeTask[]>("/performance/tasks").catch(() => [])
    ]);
    return { dashboard, recruitment, kpiRecords, performanceTasks };
  } catch {
    return {
      dashboard: emptyDashboard,
      recruitment: emptyRecruitment,
      kpiRecords: [] as EmployeeKpiRecord[],
      performanceTasks: [] as EmployeeTask[]
    };
  }
}

export default async function DashboardPage() {
  const { dashboard, recruitment, kpiRecords, performanceTasks } = await loadDashboard();

  const attendanceRateText = dashboard.quickStats.find((item) => normalizeToken(item.label) === "attendance")?.value ?? "0%";
  const attendanceRate = numericFromText(attendanceRateText);

  const approvedLeaves = dashboard.leaveSnapshot.filter((item) => normalizeToken(item.status) === "approved").length;
  const pendingLeaves = dashboard.leaveSnapshot.filter((item) => normalizeToken(item.status) === "pending").length;

  const totalApplicantsStat = recruitment.stats.find((item) => normalizeToken(item.label) === "total_applicants");
  const jobApplicantsValue = totalApplicantsStat?.value ?? "0";
  const jobApplicantsDelta = totalApplicantsStat?.delta ?? "+0.0%";

  const performanceSeries = dashboard.performanceSeries.map((value) => (value <= 10 ? value * 10 : value));
  const performanceCurrent = performanceSeries.at(-1) ?? 0;
  const performancePrevious = performanceSeries.at(-2) ?? performanceCurrent;
  const performanceDelta = performancePrevious
    ? ((performanceCurrent - performancePrevious) / performancePrevious) * 100
    : 0;
  const performanceLineData = performanceSeries.slice(-6);
  const perfMax = Math.max(...performanceLineData, 1);
  const perfMin = Math.min(...performanceLineData, 0);
  const perfWidth = 300;
  const perfHeight = 110;
  const perfPoints = performanceLineData
    .map((value, index) => {
      const x = (index / Math.max(performanceLineData.length - 1, 1)) * perfWidth;
      const normalized = perfMax === perfMin ? 0.5 : (value - perfMin) / (perfMax - perfMin);
      const y = perfHeight - normalized * (perfHeight - 18) - 8;
      return `${x},${y}`;
    })
    .join(" ");
  const markerIndex = Math.max(performanceLineData.length - 2, 0);
  const markerX = (markerIndex / Math.max(performanceLineData.length - 1, 1)) * perfWidth;
  const markerY = (() => {
    const value = performanceLineData[markerIndex] ?? performanceCurrent;
    const normalized = perfMax === perfMin ? 0.5 : (value - perfMin) / (perfMax - perfMin);
    return perfHeight - normalized * (perfHeight - 18) - 8;
  })();
  const attendanceDelta = attendanceRate >= 90 ? "+1.54%" : "+0.88%";

  const employeeStatusTotal = dashboard.employeeStatus.reduce((sum, item) => sum + item.width, 0) || 1;
  const todayIso = todayInManilaIso();
  const approvedKpis = kpiRecords.filter((record) => record.status === "approved").length;
  const submittedKpis = kpiRecords.filter((record) => record.status === "submitted").length;
  const kpiCompletionRate = kpiRecords.length ? Math.round((approvedKpis / kpiRecords.length) * 100) : 0;

  const overdueTaskCount = performanceTasks.filter(
    (task) =>
      task.status === "overdue" ||
      (task.status !== "completed" &&
        task.status !== "done_pending_approval" &&
        task.dueDate < todayIso)
  ).length;
  const dueTodayCount = performanceTasks.filter((task) => task.dueDate === todayIso).length;
  const pendingTaskApprovals = performanceTasks.filter(
    (task) => task.status === "done_pending_approval"
  ).length;
  const myPendingApprovals = submittedKpis + pendingTaskApprovals;

  const tasks = performanceTasks.slice(0, 6).map((task) => ({
    id: task.id,
    title: task.title,
    tag: task.status.replaceAll("_", " "),
    due: formatDate(task.dueDate)
  }));

  const calendarActiveDates = (() => {
    const dates = new Set<string>();

    for (const leave of dashboard.leaveSnapshot) {
      const start = parseIsoDateUtc(leave.startDate);
      const end = parseIsoDateUtc(leave.endDate);
      if (!start || !end) {
        continue;
      }

      const cursor = new Date(start);
      let guard = 0;
      while (cursor <= end && guard < 90) {
        dates.add(formatIsoDateUtc(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        guard += 1;
      }
    }

    if (!dates.size) {
      [
        "2035-06-05",
        "2035-06-11",
        "2035-06-16",
        "2035-06-17",
        "2035-06-22",
        "2035-06-26"
      ].forEach((value) => dates.add(value));
    }

    return [...dates].sort();
  })();

  const calendarInitialMonthIso =
    calendarActiveDates[0]?.slice(0, 7) + "-01" || "2035-06-01";

  return (
    <AppShell activePath="/dashboard">
      <div className="dashboard-v2">
        <section className="dashboard-v2-greeting">
          <div>
            <p className="dashboard-v2-hello">Hello Hr Dexter!</p>
            <h2>Good Morning</h2>
          </div>
        </section>

        <section className="dashboard-v2-kpis">
          <article className="card dashboard-v2-kpi">
            <div className="head">
              <span>Total Employees</span>
              <span className="dots">...</span>
            </div>
            <strong>{dashboard.summary.headcount}</strong>
            <p>{dashboard.summary.headcount} employees</p>
            <small>You are part of a <b>growing team!</b></small>
          </article>
          <article className="card dashboard-v2-kpi">
            <div className="head">
              <span>Attendance</span>
              <span className="dots">...</span>
            </div>
            <strong>{Math.round(attendanceRate)}%</strong>
            <p>Present · 3 Days Off, 1 Late Arrival</p>
            <small>Your attendance this month is looking <b>solid</b></small>
          </article>
          <article className="card dashboard-v2-kpi">
            <div className="head">
              <span>Leave Requests</span>
              <span className="dots">...</span>
            </div>
            <strong>{dashboard.summary.activeLeaves}</strong>
            <p>
              <b>{approvedLeaves}</b> Approved &nbsp; <b>{pendingLeaves || dashboard.summary.pendingApprovals}</b> Pending Review
            </p>
            <small>
              You have submitted <b>{dashboard.summary.activeLeaves}</b> leave request(s) this month
            </small>
          </article>
          <article className="card dashboard-v2-kpi">
            <div className="head">
              <span>Job Applicants</span>
              <span className="dots">...</span>
            </div>
            <strong>{jobApplicantsDelta}</strong>
            <p>compared to last month</p>
            <small>
              Your team has <b>{jobApplicantsValue} new applicants</b>
            </small>
          </article>
        </section>

        <section className="dashboard-v2-kpi-widgets">
          <article className="card dashboard-v2-widget">
            <span>KPI Completion Rate</span>
            <strong>{kpiCompletionRate}%</strong>
            <small>{approvedKpis} approved KPI records</small>
          </article>
          <article className="card dashboard-v2-widget">
            <span>Pending KPI Approvals</span>
            <strong>{submittedKpis}</strong>
            <small>Submitted KPI records awaiting approval</small>
          </article>
          <article className="card dashboard-v2-widget">
            <span>Tasks Today / Overdue</span>
            <strong>
              {dueTodayCount} / {overdueTaskCount}
            </strong>
            <small>Due today and overdue task counts</small>
          </article>
          <article className="card dashboard-v2-widget">
            <span>My Pending Approvals</span>
            <strong>{myPendingApprovals}</strong>
            <small>KPI + task approvals pending action</small>
          </article>
        </section>

        <section className="dashboard-v2-grid">
          <DashboardCalendar
            activeDates={calendarActiveDates}
            initialMonthIso={calendarInitialMonthIso}
          />

          <article className="card dashboard-v2-attendance">
            <div className="section-title">
              <div>
                <h2>Attendance Report</h2>
                <p>
                  {Math.round(attendanceRate)}% <span className="dashboard-v2-up">↗ {attendanceDelta}</span>
                </p>
              </div>
              <span className="chip">This Month</span>
            </div>
            <div className="dashboard-v2-attendance-grid">
              <div className="dashboard-v2-time-col">
                {["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM"].map((time) => (
                  <span key={time}>{time}</span>
                ))}
              </div>
              <div className="dashboard-v2-heat-wrap">
                {Array.from({ length: 30 }).map((_, index) => {
                  const level = Math.max(0, Math.min(3, dashboard.attendanceCells[index] ?? 0));
                  return <span key={index} className={`dashboard-v2-heat level-${level}`} />;
                })}
              </div>
            </div>
            <div className="dashboard-v2-day-row">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </article>

          <article className="card dashboard-v2-performance">
            <div className="section-title">
              <div>
                <h2>Team Performance</h2>
                <p>Last 6 Months</p>
              </div>
              <span className="chip">Last 6 Months</span>
            </div>
            <div className="dashboard-v2-performance-head">
              <strong>{toPercentText(performanceCurrent)}</strong>
              <small>{performanceDelta >= 0 ? "+" : ""}{performanceDelta.toFixed(2)}% Increased vs last week</small>
            </div>
            <div className="dashboard-v2-performance-chart">
              <svg viewBox={`0 0 ${perfWidth} ${perfHeight}`} preserveAspectRatio="none" aria-hidden="true">
                {[0, 25, 50, 75, 100].map((line) => {
                  const y = perfHeight - (line / 100) * (perfHeight - 14) - 6;
                  return <line key={line} x1="0" y1={y} x2={perfWidth} y2={y} className="grid-line" />;
                })}
                <line x1={markerX} y1="4" x2={markerX} y2={perfHeight - 2} className="marker-line" />
                <polyline points={perfPoints} className="perf-line" />
                <circle cx={markerX} cy={markerY} r="4.5" className="marker-dot" />
              </svg>
              <div className="dashboard-v2-marker-label">
                <span>May 2035</span>
                <strong>{toPercentText(performanceLineData[markerIndex] ?? performanceCurrent)}</strong>
              </div>
            </div>
            <div className="dashboard-v2-months-row">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </article>

          <article className="card dashboard-v2-schedules">
            <div className="section-title">
              <div>
                <h2>Schedules</h2>
                <p>Today&apos;s plan</p>
              </div>
              <span className="chip">21 Jun</span>
            </div>
            <div className="stack">
              {dashboard.scheduleItems.map((item, index) => (
                <div key={`${item.title}-${item.time}`} className="dashboard-v2-schedule-item">
                  <div>
                    <span className="dashboard-v2-schedule-dept">{["Talent Acquisition", "Employee Development", "Workplace Engagement"][index % 3]}</span>
                    <strong>{item.title}</strong>
                    <p>{item.tag} · {item.time}</p>
                  </div>
                  <div className="dashboard-v2-avatar-group">
                    <span>AA</span>
                    <span>FR</span>
                    <span>+{index + 2}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card dashboard-v2-satisfaction">
            <div className="section-title">
              <div>
                <h2>Employee Satisfaction</h2>
                <p>Employee Satisfied</p>
              </div>
              <span className="dots">...</span>
            </div>
            <div className="dashboard-v2-satisfaction-top">
              <div>
                <strong>{dashboard.satisfaction}</strong>
                <span>{ratingText(dashboard.satisfactionBreakdown[0]?.score ?? "4.2/5")}</span>
              </div>
              <div className="dashboard-v2-half-gauge" aria-hidden="true">
                <svg viewBox="0 0 120 64">
                  <path d="M 12 56 A 48 48 0 0 1 108 56" className="track" />
                  <path
                    d="M 12 56 A 48 48 0 0 1 108 56"
                    className="fill"
                    style={{ strokeDasharray: `${Math.PI * 48}`, strokeDashoffset: `${(1 - (numericFromText(dashboard.satisfaction) / 100)) * Math.PI * 48}` }}
                  />
                  <circle
                    cx={12 + (96 * Math.min(1, Math.max(0, numericFromText(dashboard.satisfaction) / 100)))}
                    cy={56 - (34 * Math.min(1, Math.max(0, numericFromText(dashboard.satisfaction) / 100)))}
                    r="3.8"
                    className="dot"
                  />
                </svg>
              </div>
            </div>
            <div className="dashboard-v2-satisfaction-note">
              That&apos;s an <b>increase of 6%</b> from last month
            </div>
            <div className="dashboard-v2-score-list">
              <div className="stack">
                {dashboard.satisfactionBreakdown.map((item) => (
                  <div key={item.label} className="dashboard-v2-score-item">
                    <div>
                      <span>{item.label}</span>
                    </div>
                    <strong>{ratingText(item.score)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="card dashboard-v2-employment">
            <div className="section-title">
              <div>
                <h2>Employment Status</h2>
                <p>{dashboard.summary.headcount} employees</p>
              </div>
              <span className="dots">...</span>
            </div>
            <div className="dashboard-v2-status-track" aria-hidden="true">
              {dashboard.employeeStatus.map((item) => (
                <span key={item.label} style={{ width: `${(item.width / employeeStatusTotal) * 100}%` }} />
              ))}
            </div>
            <div className="dashboard-v2-status-list">
              {dashboard.employeeStatus.map((item) => (
                <div key={item.label} className="dashboard-v2-status-item">
                  <strong>{item.label}</strong>
                  <span>{item.value} — {item.note}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="card dashboard-v2-tasks">
            <div className="section-title">
              <div>
                <h2>Tasks</h2>
              </div>
              <span className="dots">...</span>
            </div>
            <div className="dashboard-v2-task-list">
              {tasks.length ? (
                tasks.map((task) => (
                  <div key={task.id} className="dashboard-v2-task-item">
                    <span className="checkbox" aria-hidden="true" />
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.tag} · {task.due}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No live tasks yet. Assign tasks from Performance &gt; Tasks.</p>
              )}
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
