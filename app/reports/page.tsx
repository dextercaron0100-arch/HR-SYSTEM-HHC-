export const dynamic = "force-dynamic";

import { AppShell } from "../../components/AppShell";
import { apiGet } from "../../lib/api";

type ReportsData = {
  headcount: number;
  departmentCount: number;
  leaveRequests: number;
  payrollPeriods: number;
  approvals: number;
  attendanceExceptions: number;
  notifications: number;
};

async function loadReports() {
  try {
    return await apiGet<ReportsData>("/reports/summary");
  } catch {
    return { headcount: 0, departmentCount: 0, leaveRequests: 0, payrollPeriods: 0, approvals: 0, attendanceExceptions: 0, notifications: 0 };
  }
}

export default async function ReportsPage() {
  const reports = await loadReports();
  const summaryCards = [
    { label: "Headcount", value: reports.headcount },
    { label: "Departments", value: reports.departmentCount },
    { label: "Leave requests", value: reports.leaveRequests },
    { label: "Payroll periods", value: reports.payrollPeriods },
    { label: "Approvals", value: reports.approvals },
    { label: "Attendance exceptions", value: reports.attendanceExceptions }
  ];

  return (
    <AppShell activePath="/reports">
      <section className="hero">
        <div>
          <span className="eyebrow">Reports</span>
          <h1>Give management clear, downloadable HR visibility.</h1>
          <p>Reports support decision-making without requiring manual spreadsheet consolidation.</p>
        </div>
      </section>

      <div className="grid three-col">
        {summaryCards.map((card) => (
          <div key={card.label} className="card">
            <strong>{card.value}</strong>
            <p className="muted">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid three-col" style={{ marginTop: 24 }}>
        {[
          "Headcount",
          "Attendance summary",
          "Payroll summary",
          "Leave liabilities",
          "Employee movement"
        ].map((report) => (
          <div key={report} className="card">
            <strong>{report}</strong>
            <p className="muted">Export-ready summary for management review.</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
