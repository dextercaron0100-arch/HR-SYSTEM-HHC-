export const dynamic = "force-dynamic";

import { AppShell } from "../../../components/AppShell";
import { AddAttendanceForm } from "../../../components/AddAttendanceForm";
import { apiGet } from "../../../lib/api";
import type { Employee } from "@hr/contracts";

async function loadEmployees() {
  try {
    return await apiGet<Employee[]>("/employees");
  } catch {
    return [];
  }
}

export default async function NewAttendancePage() {
  const employees = await loadEmployees();

  return (
    <AppShell activePath="/attendance">
      <AddAttendanceForm employees={employees} />
    </AppShell>
  );
}
