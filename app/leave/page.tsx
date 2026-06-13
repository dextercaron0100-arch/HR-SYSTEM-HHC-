export const dynamic = "force-dynamic";

import { AppShell } from "../../components/AppShell";
import { apiGet } from "../../lib/api";

type LeaveData = {
  types: { id: string; name: string; code: string; paid: boolean; annualLimit: number }[];
  balances: { employeeId: string; employeeName: string; leaveType: string; year: number; earned: number; used: number; remaining: number }[];
  requests: {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveTypeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: string;
    approvedBy: string;
    approvedAt: string;
  }[];
};

const fallbackLeave: LeaveData = { types: [], balances: [], requests: [] };

async function loadLeave() {
  try {
    return await apiGet<LeaveData>("/leave");
  } catch {
    return fallbackLeave;
  }
}

export default async function LeavePage() {
  const leave = await loadLeave();

  return (
    <AppShell activePath="/leave">
      <section className="hero">
        <div>
          <span className="eyebrow">Leave management</span>
          <h1>Request, approve, and track leave balances.</h1>
          <p>The system updates balances, attendance, and payroll from one approved leave action.</p>
        </div>
      </section>

      <div className="grid two-col">
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Leave types</h2>
              <p>Configured from the backend.</p>
            </div>
          </div>
          <div className="stack">
            {leave.types.map((type) => (
              <div key={type.id} className="schedule-item">
                <div>
                  <strong>{type.name}</strong>
                  <p>
                    {type.code} • {type.annualLimit} days
                  </p>
                </div>
                <span className={`badge ${type.paid ? "success" : ""}`}>{type.paid ? "Paid" : "Unpaid"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <div>
              <h2>Workflow behavior</h2>
              <p>Leave is connected to balance, attendance, and payroll.</p>
            </div>
          </div>
          <div className="stack">
            <span className="badge">Balance check before submit</span>
            <span className="badge">Manager approval routing</span>
            <span className="badge">Automatic status history</span>
            <span className="badge">Payroll impact rules for unpaid leave</span>
            <span className="badge">Leave calendar visibility</span>
          </div>
        </div>
      </div>

      <div className="grid two-col" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Balances</h2>
              <p>Remaining leave by employee and type.</p>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Earned</th>
                <th>Used</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {leave.balances.map((balance) => (
                <tr key={`${balance.employeeId}-${balance.leaveType}-${balance.year}`}>
                  <td>{balance.employeeName}</td>
                  <td>{balance.leaveType}</td>
                  <td>{balance.earned}</td>
                  <td>{balance.used}</td>
                  <td>
                    <span className="badge success">{balance.remaining}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-title">
            <div>
              <h2>Requests</h2>
              <p>Approval routing is based on manager and step history.</p>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leave.requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.employeeName}</td>
                  <td>
                    {request.startDate.slice(0, 10)} to {request.endDate.slice(0, 10)}
                  </td>
                  <td>{request.days}</td>
                  <td>
                    <span className={`badge ${request.status === "approved" ? "success" : "warning"}`}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
