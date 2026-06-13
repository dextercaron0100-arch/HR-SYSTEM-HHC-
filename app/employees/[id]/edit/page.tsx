export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Employee, SettingsOverview } from "@hr/contracts";

import { AppShell } from "../../../../components/AppShell";
import { AddEmployeeWizard } from "../../../../components/AddEmployeeWizard";
import { apiGet } from "../../../../lib/api";

type EditEmployeeData = {
  employee: Employee & { birthDate?: string, sex?: string, governmentIds?: any };
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
  { id: "pos-hr-manager", title: "HR Manager", level: "Manager", departmentId: "dep-hr" }
];

function withReadyOrgOptions(settings: SettingsOverview): SettingsOverview {
  return {
    ...settings,
    departments: settings.departments?.length ? settings.departments : fallbackDepartments,
    positions: settings.positions?.length ? settings.positions : fallbackPositions
  };
}

async function loadData(id: string): Promise<EditEmployeeData | null> {
  try {
    const [employee, employees, settings] = await Promise.all([
      apiGet<Employee & { birthDate?: string, sex?: string, governmentIds?: any }>(`/employees/${id}`),
      apiGet<Employee[]>("/employees"),
      apiGet<SettingsOverview>("/settings")
    ]);
    if (!employee) return null;
    return { employee, employees, settings: withReadyOrgOptions(settings) };
  } catch {
    return null;
  }
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadData(id);

  if (!data) {
    notFound();
  }

  return (
    <AppShell activePath="/employees">
      <AddEmployeeWizard
        employees={data.employees}
        departments={data.settings.departments}
        positions={data.settings.positions}
        initialEmployee={{
          id: data.employee.id,
          employeeCode: data.employee.employeeCode,
          firstName: data.employee.firstName,
          middleName: data.employee.middleName ?? "",
          lastName: data.employee.lastName,
          birthDate: data.employee.birthDate ? data.employee.birthDate.slice(0, 10) : "",
          gender: data.employee.sex ?? "prefer_not_to_say",
          email: data.employee.email ?? "",
          phone: data.employee.phone ?? "",
          address: data.employee.address ?? "",
          departmentId: data.employee.departmentId,
          positionId: data.employee.positionId ?? "",
          managerId: data.employee.managerId ?? "",
          hireDate: data.employee.hireDate ? data.employee.hireDate.slice(0, 10) : "",
          salaryType: data.employee.salaryType as any,
          basicSalary: data.employee.basicSalary.toString(),
          employmentStatus: data.employee.employmentStatus as any,
          tin: data.employee.governmentIds?.tin ?? "",
          sssNo: data.employee.governmentIds?.sssNo ?? "",
          philhealthNo: data.employee.governmentIds?.philhealthNo ?? "",
          pagibigNo: data.employee.governmentIds?.pagibigNo ?? ""
        }}
      />
    </AppShell>
  );
}
