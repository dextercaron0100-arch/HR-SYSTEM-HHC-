"use client";

import { useMemo, useState } from "react";
import type { OnboardingData } from "@hr/contracts";

type OnboardingWorkspaceProps = {
  onboarding: OnboardingData;
};

type StageFilter = "all" | "paperwork" | "orientation" | "probation" | "completed";

const stageOptions: { value: StageFilter; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "paperwork", label: "Paperwork" },
  { value: "orientation", label: "Orientation" },
  { value: "probation", label: "Probation" },
  { value: "completed", label: "Completed" }
];

const stageLabel = (value: string) =>
  value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-PH", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
};

export function OnboardingWorkspace({ onboarding }: OnboardingWorkspaceProps) {
  const data = onboarding;

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  const filteredWorkflows = useMemo(() => {
    const token = search.trim().toLowerCase();
    return data.workflows.filter((workflow) => {
      const matchesStage = stageFilter === "all" ? true : workflow.stage === stageFilter;
      const matchesSearch = token
        ? `${workflow.employeeName} ${workflow.department} ${workflow.role} ${workflow.owner}`
            .toLowerCase()
            .includes(token)
        : true;
      return matchesStage && matchesSearch;
    });
  }, [data.workflows, search, stageFilter]);

  const workflowProgressAverage = useMemo(() => {
    if (!data.workflows.length) {
      return 0;
    }
    const total = data.workflows.reduce((sum, workflow) => sum + workflow.progress, 0);
    return Math.round(total / data.workflows.length);
  }, [data.workflows]);

  const tasks = useMemo(
    () =>
      data.tasks.map((task) => ({
        ...task,
        status: completedTaskIds.has(task.id) ? "completed" : task.status
      })),
    [completedTaskIds, data.tasks]
  );

  const completedTasksCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <section className="onboarding-v2">
      <header className="onboarding-v2-head card">
        <div>
          <h2>Onboarding Workflows</h2>
          <p className="breadcrumb">Dashboard / Onboarding</p>
        </div>
      </header>

      <section className="onboarding-v2-kpis">
        <article className="card onboarding-v2-kpi">
          <span>New Hires</span>
          <strong>{data.summary.newHires}</strong>
          <small>Current onboarding cycle</small>
        </article>
        <article className="card onboarding-v2-kpi">
          <span>In Progress</span>
          <strong>{data.summary.inProgress}</strong>
          <small>Paperwork to probation</small>
        </article>
        <article className="card onboarding-v2-kpi">
          <span>Completed</span>
          <strong>{data.summary.completed}</strong>
          <small>Finished onboarding journeys</small>
        </article>
        <article className="card onboarding-v2-kpi">
          <span>Pending Actions</span>
          <strong>{Math.max(data.summary.pendingActions - completedTasksCount, 0)}</strong>
          <small>Tasks waiting on HR/manager</small>
        </article>
      </section>

      <section className="onboarding-v2-layout">
        <main className="onboarding-v2-main">
          <article className="card onboarding-v2-workflows">
            <div className="section-title">
              <div>
                <h2>Employee Onboarding Pipeline</h2>
                <p>{workflowProgressAverage}% average completion</p>
              </div>
              <div className="onboarding-v2-actions">
                <label className="onboarding-v2-search">
                  <span>Search</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Employee, department, role"
                    aria-label="Search onboarding records"
                  />
                </label>
                <select
                  className="onboarding-v2-select"
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value as StageFilter)}
                >
                  {stageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="applicant-table-wrap">
              <table className="table onboarding-v2-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Start Date</th>
                    <th>Stage</th>
                    <th>Owner</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkflows.length ? (
                    filteredWorkflows.map((workflow) => (
                      <tr key={workflow.id}>
                        <td>
                          <div className="applicant-person">
                            <div className="avatar applicant-avatar">{workflow.employeeName.slice(0, 1)}</div>
                            <div>
                              <strong>{workflow.employeeName}</strong>
                              <div className="muted">{workflow.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td>{workflow.department}</td>
                        <td>{workflow.role}</td>
                        <td>{formatDate(workflow.startDate)}</td>
                        <td>
                          <span className={`badge ${workflow.stage === "completed" ? "success" : ""}`}>
                            {stageLabel(workflow.stage)}
                          </span>
                        </td>
                        <td>{workflow.owner}</td>
                        <td>
                          <div className="onboarding-v2-progress">
                            <span style={{ width: `${workflow.progress}%` }} />
                            <strong>{workflow.progress}%</strong>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="recruitment-v2-empty-table">
                        No onboarding records match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </main>

        <aside className="onboarding-v2-rail">
          <section className="card onboarding-v2-checklist">
            <div className="section-title">
              <div>
                <h2>Checklist Template</h2>
              </div>
            </div>
            <div className="stack">
              {data.checklist.map((item) => (
                <div key={item.code} className="onboarding-v2-check-item">
                  <span className="dot" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card onboarding-v2-tasks">
            <div className="section-title">
              <div>
                <h2>Action Queue</h2>
              </div>
            </div>
            <div className="stack">
              {tasks.length ? (
                tasks.map((task) => (
                  <article key={task.id} className={`onboarding-v2-task-item ${task.status === "completed" ? "is-complete" : ""}`}>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.employeeName}</p>
                      <small>Due {formatDate(task.dueDate)}</small>
                    </div>
                    <button
                      type="button"
                      className="button-secondary onboarding-v2-task-btn"
                      disabled={task.status === "completed"}
                      onClick={() => {
                        setCompletedTaskIds((current) => {
                          const next = new Set(current);
                          next.add(task.id);
                          return next;
                        });
                      }}
                    >
                      {task.status === "completed" ? "Done" : "Mark Done"}
                    </button>
                  </article>
                ))
              ) : (
                <p className="muted">No onboarding tasks available.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </section>
  );
}
