export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { HeatGrid, Sparkline } from "../../components/DashboardVisuals";
import { apiGet } from "../../lib/api";

type AttendanceData = {
  logs: {
    id: string;
    employeeName: string;
    logType: string;
    logDateTime: string;
    source: string;
    deviceId: string;
    remarks: string;
  }[];
  summary: {
    id: string;
    employeeName: string;
    workDate: string;
    timeIn: string;
    timeOut: string;
    lateMinutes: number;
    undertimeMinutes: number;
    overtimeMinutes: number;
    workHours: number;
    holidayType: string;
    status: string;
  }[];
  shifts: { id: string; name: string; startTime: string; endTime: string; graceMinutes: number; breakMinutes: number }[];
  dashboard: {
    summary: {
      headcount: number;
      pendingApprovals: number;
      activeLeaves: number;
      openPayrollPeriods: number;
      attendanceExceptions: number;
    };
    performanceSeries: number[];
    attendanceCells: number[];
    satisfaction: string;
    satisfactionBreakdown: { label: string; score: string }[];
    quickStats: { label: string; value: string }[];
    employeeStatus: { label: string; value: string; note: string; width: number }[];
    scheduleItems: { title: string; time: string; tag: string }[];
    approvalQueue: { title: string; status: string }[];
    leaveSnapshot: unknown[];
    payrollSnapshot: unknown[];
  };
};

const fallbackAttendance: AttendanceData = {
  logs: [],
  summary: [],
  shifts: [],
  dashboard: {
    summary: { headcount: 0, pendingApprovals: 0, activeLeaves: 0, openPayrollPeriods: 0, attendanceExceptions: 0 },
    performanceSeries: [],
    attendanceCells: [],
    satisfaction: "0%",
    satisfactionBreakdown: [],
    quickStats: [],
    employeeStatus: [],
    scheduleItems: [],
    approvalQueue: [],
    leaveSnapshot: [],
    payrollSnapshot: []
  }
};

async function loadAttendance() {
  try {
    return await apiGet<AttendanceData>("/attendance");
  } catch {
    return fallbackAttendance;
  }
}

export default async function AttendancePage() {
  const attendance = await loadAttendance();

  return (
    <AppShell activePath="/attendance">
      <section className="hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="eyebrow">Attendance</span>
          <h1>Time in, time out, overtime, and exception tracking.</h1>
          <p>Attendance corrections and shifts are part of the same workflow so payroll stays accurate.</p>
        </div>
        <Link href="/attendance/new" className="button" style={{ padding: '0.75rem 1.5rem', borderRadius: '4px', border: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', backgroundColor: 'var(--surface)' }}>
          Log Attendance
        </Link>
      </section>

      <div className="grid metrics">
        <div className="card metric-card">
          <div className="metric-head">
            <span>Headcount</span>
          </div>
          <strong>{attendance.dashboard.summary.headcount}</strong>
          <div className="metric-track">
            <span style={{ width: "100%" }} />
          </div>
          <small>Employee base from backend</small>
        </div>
        <div className="card metric-card">
          <div className="metric-head">
            <span>Attendance exceptions</span>
          </div>
          <strong>{attendance.dashboard.summary.attendanceExceptions}</strong>
          <div className="metric-track">
            <span style={{ width: "62%" }} />
          </div>
          <small>Late and undertime cases</small>
        </div>
        <div className="card metric-card">
          <div className="metric-head">
            <span>Shifts</span>
          </div>
          <strong>{attendance.shifts.length}</strong>
          <div className="metric-track">
            <span style={{ width: `${Math.min(100, attendance.shifts.length * 30)}%` }} />
          </div>
          <small>Configured shift rules</small>
        </div>
      </div>

      <div className="grid two-col">
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Daily log summary</h2>
              <p>Supports mobile and desktop capture later.</p>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Time in</th>
                <th>Time out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.summary.slice(0, 8).map((row) => (
                <tr key={row.id}>
                  <td>{row.employeeName}</td>
                  <td>{row.timeIn.slice(11, 16)}</td>
                  <td>{row.timeOut.slice(11, 16)}</td>
                  <td>
                    <span className={`badge ${row.status === "present" ? "success" : "warning"}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-title">
            <div>
              <h2>What the backend calculates</h2>
              <p>Ready for attendance corrections and shift logic.</p>
            </div>
          </div>
          <div className="stack">
            <span className="badge">Late minutes</span>
            <span className="badge">Undertime minutes</span>
            <span className="badge">Overtime requests</span>
            <span className="badge">Holiday rules</span>
            <span className="badge">Attendance correction approvals</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <Sparkline values={attendance.dashboard.performanceSeries} />
          </div>
        </div>
      </div>

      <div className="grid two-col" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Attendance logs</h2>
              <p>Recent in/out events from the backend.</p>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Log type</th>
                <th>Time</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {attendance.logs.slice(0, 8).map((log) => (
                <tr key={log.id}>
                  <td>{log.employeeName}</td>
                  <td>{log.logType}</td>
                  <td>{log.logDateTime.slice(11, 19)}</td>
                  <td>{log.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-title">
            <div>
              <h2>Shift setup</h2>
              <p>Rules that drive time computations.</p>
            </div>
          </div>
          <div className="stack">
            {attendance.shifts.map((shift) => (
              <div key={shift.id} className="schedule-item">
                <div>
                  <strong>{shift.name}</strong>
                  <p>
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <span className="badge success">
                  {shift.graceMinutes}m grace
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <HeatGrid rows={5} cols={7} cells={attendance.dashboard.attendanceCells} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
