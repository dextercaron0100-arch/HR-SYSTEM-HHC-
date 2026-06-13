export const dynamic = "force-dynamic";

import type { SettingsOverview } from "@hr/contracts";

import { AppShell } from "../../components/AppShell";
import { apiGet } from "../../lib/api";

async function loadSettings() {
  try {
    return await apiGet<SettingsOverview>("/settings");
  } catch {
    return { roles: [], departments: [], positions: [], activeUsers: 0 };
  }
}

export default async function SettingsPage() {
  const settings = await loadSettings();

  return (
    <AppShell activePath="/settings">
      <section className="hero">
        <div>
          <span className="eyebrow">Roles & access</span>
          <h1>Control access, audit logs, and approval rights.</h1>
          <p>Keep security simple for non-technical users while preserving traceability for major actions.</p>
        </div>
      </section>

      <div className="grid two-col">
        <div className="card">
          <div className="section-title">
            <div>
              <h2>Primary roles</h2>
              <p>Role-based login and permissions are part of the MVP.</p>
            </div>
          </div>
          <div className="stack">
            {settings.roles.map((role) => (
              <span key={role.id} className="badge">
                {role.name}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <div>
              <h2>Security essentials</h2>
              <p>Minimum controls for an internal HR system.</p>
            </div>
          </div>
          <div className="stack">
            <span className="badge">Encrypted access</span>
            <span className="badge">Password protection</span>
            <span className="badge">Permission control</span>
            <span className="badge">Audit logs</span>
            <span className="badge">Daily backup support</span>
          </div>
        </div>
      </div>

      <div className="grid metrics" style={{ marginTop: 24 }}>
        <div className="card metric-card">
          <div className="metric-head">
            <span>Active users</span>
          </div>
          <strong>{settings.activeUsers}</strong>
          <div className="metric-track">
            <span style={{ width: "100%" }} />
          </div>
          <small>Users with access enabled</small>
        </div>
        <div className="card metric-card">
          <div className="metric-head">
            <span>Departments</span>
          </div>
          <strong>{settings.departments.length}</strong>
          <div className="metric-track">
            <span style={{ width: `${Math.min(100, settings.departments.length * 18)}%` }} />
          </div>
          <small>Backend department masters</small>
        </div>
        <div className="card metric-card">
          <div className="metric-head">
            <span>Positions</span>
          </div>
          <strong>{settings.positions.length}</strong>
          <div className="metric-track">
            <span style={{ width: `${Math.min(100, settings.positions.length * 10)}%` }} />
          </div>
          <small>Job titles ready for assignment</small>
        </div>
      </div>
    </AppShell>
  );
}
