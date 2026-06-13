export const dynamic = "force-dynamic";

import type {
  Employee,
  EmployeeKpiRecord,
  EmployeeTask,
  KpiDefinition,
  PerformanceReview,
  PerformanceSummary
} from "@hr/contracts";

import { AppShell } from "../../components/AppShell";
import { PerformanceWorkspace } from "../../components/PerformanceWorkspace";
import { apiGet } from "../../lib/api";

type PerformancePageData = {
  employees: Employee[];
  reviews: PerformanceReview[];
  summary: PerformanceSummary;
  kpiDefinitions: KpiDefinition[];
  kpiRecords: EmployeeKpiRecord[];
  tasks: EmployeeTask[];
};

const fallbackData: PerformancePageData = {
  employees: [],
  reviews: [],
  summary: {
    metrics: {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0
    },
    monthly: [],
    categoryAverages: {
      teamwork: 0,
      workQuality: 0,
      problemSolving: 0,
      timeManagement: 0
    },
    overallAverage: 0,
    topPerformers: [],
    alerts: [],
    lastUpdated: ""
  },
  kpiDefinitions: [],
  kpiRecords: [],
  tasks: []
};

async function loadData(): Promise<PerformancePageData> {
  try {
    const [employees, reviews, summary, kpiDefinitions, kpiRecords, tasks] = await Promise.all([
      apiGet<Employee[]>("/employees"),
      apiGet<PerformanceReview[]>("/performance/reviews"),
      apiGet<PerformanceSummary>("/performance/summary"),
      apiGet<KpiDefinition[]>("/performance/kpis/definitions"),
      apiGet<EmployeeKpiRecord[]>("/performance/kpis/records"),
      apiGet<EmployeeTask[]>("/performance/tasks")
    ]);

    return { employees, reviews, summary, kpiDefinitions, kpiRecords, tasks };
  } catch {
    return fallbackData;
  }
}

export default async function PerformancePage() {
  const data = await loadData();

  return (
    <AppShell activePath="/performance">
      <PerformanceWorkspace
        employees={data.employees}
        reviews={data.reviews}
        summary={data.summary}
        kpiDefinitions={data.kpiDefinitions}
        kpiRecords={data.kpiRecords}
        tasks={data.tasks}
      />
    </AppShell>
  );
}
