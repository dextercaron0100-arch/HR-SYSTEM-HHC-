export const dynamic = "force-dynamic";

import type { OnboardingData } from "@hr/contracts";

import { AppShell } from "../../components/AppShell";
import { OnboardingWorkspace } from "../../components/OnboardingWorkspace";
import { apiGet } from "../../lib/api";

const fallbackOnboarding: OnboardingData = {
  summary: {
    newHires: 0,
    inProgress: 0,
    completed: 0,
    pendingActions: 0
  },
  workflows: [],
  tasks: [],
  checklist: [
    { code: "profile", label: "Employee profile created" },
    { code: "contract", label: "Contract signed and stored" },
    { code: "ids", label: "Government IDs verified" },
    { code: "equipment", label: "Equipment request submitted" },
    { code: "buddy", label: "Buddy assigned and intro call done" }
  ]
};

async function loadOnboarding() {
  try {
    return await apiGet<OnboardingData>("/onboarding");
  } catch {
    return fallbackOnboarding;
  }
}

export default async function OnboardingPage() {
  const onboarding = await loadOnboarding();

  return (
    <AppShell activePath="/onboarding">
      <OnboardingWorkspace onboarding={onboarding} />
    </AppShell>
  );
}

