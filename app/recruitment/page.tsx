export const dynamic = "force-dynamic";

import type { RecruitmentData } from "@hr/contracts";

import { AppShell } from "../../components/AppShell";
import { RecruitmentWorkspace } from "../../components/RecruitmentWorkspace";
import { apiGet } from "../../lib/api";

const fallbackRecruitment: RecruitmentData = {
  stats: [],
  vacancies: [],
  applicants: [],
  resources: [],
  departmentBars: [],
  scheduleItems: [],
  applicationSeries: []
};

async function loadRecruitment() {
  try {
    return await apiGet<RecruitmentData>("/recruitment");
  } catch {
    return fallbackRecruitment;
  }
}

export default async function RecruitmentPage() {
  const recruitment = await loadRecruitment();

  return (
    <AppShell activePath="/recruitment">
      <RecruitmentWorkspace recruitment={recruitment} />
    </AppShell>
  );
}
