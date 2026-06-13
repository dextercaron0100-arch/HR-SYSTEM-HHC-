export const dynamic = "force-dynamic";

import type { Employee, SettingsOverview } from "@hr/contracts";

import { AppShell } from "../../components/AppShell";
import { EmployeesDirectory } from "../../components/EmployeesDirectory";
import { apiGet } from "../../lib/api";

type EmployeePageData = {
  employees: Employee[];
  settings: SettingsOverview;
};

async function loadEmployees(): Promise<EmployeePageData> {
  try {
    const [employees, settings] = await Promise.all([apiGet<Employee[]>("/employees"), apiGet<SettingsOverview>("/settings")]);
    return { employees, settings };
  } catch {
    return { employees: [], settings: { roles: [], departments: [], positions: [], activeUsers: 0 } };
  }
}

export default async function EmployeesPage() {
  const data = await loadEmployees();

  return (
    <AppShell activePath="/employees">
      <EmployeesDirectory
        employees={data.employees}
        departments={data.settings.departments}
        positions={data.settings.positions}
      />
    </AppShell>
  );
}
