export const dynamic = "force-dynamic";

import type { Employee, SettingsOverview } from "@hr/contracts";

import { AppShell } from "../../../components/AppShell";
import { AddEmployeeWizard } from "../../../components/AddEmployeeWizard";
import { apiGet } from "../../../lib/api";

type AddEmployeeData = {
  employees: Employee[];
  settings: SettingsOverview;
};

const fallbackDepartments = [
  { id: "dep-hr", name: "HR", code: "HR" },
  { id: "dep-admin", name: "Admin", code: "ADM" },
  { id: "dep-operations", name: "Operations", code: "OPS" },
  { id: "dep-sales", name: "Sales", code: "SAL" },
  { id: "dep-marketing", name: "Marketing", code: "MKT" },
  { id: "dep-it", name: "IT Department", code: "IT" },
  { id: "dep-purchasing", name: "Purchasing", code: "PUR" },
  { id: "dep-training", name: "Training Department", code: "TRN" }
];

const fallbackPositions = [
  { id: "pos-hr-manager", title: "HR Manager", level: "Manager", departmentId: "dep-hr" },
  { id: "pos-hr-assistant", title: "HR Assistant", level: "Associate", departmentId: "dep-hr" },
  { id: "pos-hr-officer", title: "HR Officer", level: "Specialist", departmentId: "dep-hr" },
  { id: "pos-administrator", title: "Administrator", level: "Manager", departmentId: "dep-admin" },
  { id: "pos-head-admin", title: "Head Admin", level: "Manager", departmentId: "dep-admin" },
  { id: "pos-branch-operations-officer", title: "Branch Operations Officer", level: "Officer", departmentId: "dep-operations" },
  { id: "pos-training-officer-ops", title: "Training Officer", level: "Officer", departmentId: "dep-operations" },
  { id: "pos-branch-operation-and-training-officer", title: "Branch Operation and Training Officer", level: "Officer", departmentId: "dep-operations" },
  { id: "pos-sales-admin", title: "Sales Admin", level: "Associate", departmentId: "dep-sales" },
  { id: "pos-csr", title: "CSR", level: "Associate", departmentId: "dep-sales" },
  { id: "pos-graphic-artist", title: "Graphic Artist", level: "Specialist", departmentId: "dep-marketing" },
  { id: "pos-marketing-officer", title: "Marketing Officer", level: "Officer", departmentId: "dep-marketing" },
  { id: "pos-it-manager", title: "IT Manager", level: "Manager", departmentId: "dep-it" },
  { id: "pos-it-supervisor", title: "IT Supervisor", level: "Supervisor", departmentId: "dep-it" },
  { id: "pos-system-admin", title: "System Administrator", level: "Senior", departmentId: "dep-it" },
  { id: "pos-network-admin", title: "Network Administrator", level: "Senior", departmentId: "dep-it" },
  { id: "pos-database-admin", title: "Database Administrator", level: "Senior", departmentId: "dep-it" },
  { id: "pos-it-support", title: "IT Support Specialist", level: "Associate", departmentId: "dep-it" },
  { id: "pos-helpdesk", title: "Help Desk Technician", level: "Associate", departmentId: "dep-it" },
  { id: "pos-software-engineer", title: "Software Engineer", level: "Specialist", departmentId: "dep-it" },
  { id: "pos-web-developer", title: "Web Developer", level: "Specialist", departmentId: "dep-it" },
  { id: "pos-mobile-developer", title: "Mobile Developer", level: "Specialist", departmentId: "dep-it" },
  { id: "pos-qa-engineer", title: "QA Engineer", level: "Specialist", departmentId: "dep-it" },
  { id: "pos-devops-engineer", title: "DevOps Engineer", level: "Specialist", departmentId: "dep-it" },
  { id: "pos-cybersecurity-analyst", title: "Cybersecurity Analyst", level: "Analyst", departmentId: "dep-it" },
  { id: "pos-cloud-engineer", title: "Cloud Engineer", level: "Specialist", departmentId: "dep-it" },
  { id: "pos-systems-analyst", title: "Systems Analyst", level: "Analyst", departmentId: "dep-it" },
  { id: "pos-pharmacist", title: "Pharmacist", level: "Specialist", departmentId: "dep-purchasing" },
  { id: "pos-stock-custodian", title: "Stock Custodian", level: "Associate", departmentId: "dep-purchasing" },
  { id: "pos-liaison-officer", title: "Liaison Officer", level: "Officer", departmentId: "dep-purchasing" },
  { id: "pos-purchasing-assistant", title: "Purchasing Assistant", level: "Associate", departmentId: "dep-purchasing" },
  { id: "pos-purchasing-officer", title: "Purchasing Officer", level: "Officer", departmentId: "dep-purchasing" },
  { id: "pos-encoder", title: "Encoder", level: "Associate", departmentId: "dep-training" }
];

const fallbackSettings: SettingsOverview = {
  roles: [],
  departments: fallbackDepartments,
  positions: fallbackPositions,
  activeUsers: 0
};

function withReadyOrgOptions(settings: SettingsOverview): SettingsOverview {
  return {
    ...settings,
    departments: settings.departments.length ? settings.departments : fallbackDepartments,
    positions: settings.positions.length ? settings.positions : fallbackPositions
  };
}

async function loadData(): Promise<AddEmployeeData> {
  try {
    const [employees, settings] = await Promise.all([
      apiGet<Employee[]>("/employees"),
      apiGet<SettingsOverview>("/settings")
    ]);
    return { employees, settings: withReadyOrgOptions(settings) };
  } catch {
    return {
      employees: [],
      settings: fallbackSettings
    };
  }
}

export default async function NewEmployeePage() {
  const data = await loadData();

  return (
    <AppShell activePath="/employees">
      <AddEmployeeWizard
        employees={data.employees}
        departments={data.settings.departments}
        positions={data.settings.positions}
      />
    </AppShell>
  );
}
