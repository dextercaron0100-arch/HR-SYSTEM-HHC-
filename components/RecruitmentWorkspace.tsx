"use client";

import { useMemo, useState } from "react";
import type { RecruitmentApplicant, RecruitmentData } from "@hr/contracts";

import { Sparkline } from "./DashboardVisuals";

type RecruitmentWorkspaceProps = {
  recruitment: RecruitmentData;
};

type ApplicantTab = "all" | "application_received" | "interview_scheduled" | "final_interview" | "test_completed";
type VacancyMode = "all" | "on_site" | "remote" | "hybrid";
type ChartRange = 3 | 6 | 12;

const applicantTabs: { key: ApplicantTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "application_received", label: "Application Received" },
  { key: "interview_scheduled", label: "Interview Scheduled" },
  { key: "final_interview", label: "Final Interview" },
  { key: "test_completed", label: "Test Completed" }
];

const chartRanges: { label: string; value: ChartRange }[] = [
  { label: "Last 3 Months", value: 3 },
  { label: "Last 6 Months", value: 6 },
  { label: "Last 12 Months", value: 12 }
];

const vacancyModes: { label: string; value: VacancyMode }[] = [
  { label: "All", value: "all" },
  { label: "On-site", value: "on_site" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" }
];

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const stageSequence = [
  "application_received",
  "interview_scheduled",
  "final_interview",
  "test_completed",
  "hired"
] as const;

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-PH", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function stageProgress(stage: string) {
  const normalized = normalizeToken(stage);
  if (normalized === "offer_extended") {
    return 4;
  }
  const index = stageSequence.indexOf(normalized as (typeof stageSequence)[number]);
  return index === -1 ? 1 : index + 1;
}

function stageLabel(stage: string) {
  return formatTitle(stage);
}

function sourcePercent(value: string) {
  return `${Number.parseFloat(value).toFixed(1)}%`;
}

function getModeLabel(value: string) {
  return formatTitle(value).replace("On_site", "On-Site");
}

function truncateLabel(value: string) {
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 12)}...`;
}

function getApplicantTabMatches(tab: ApplicantTab, applicant: RecruitmentApplicant) {
  if (tab === "all") {
    return true;
  }
  const normalized = normalizeToken(applicant.stage);
  if (tab === "test_completed") {
    return ["test_completed", "offer_extended", "hired"].includes(normalized);
  }
  return normalized === tab;
}

export function RecruitmentWorkspace({ recruitment }: RecruitmentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ApplicantTab>("all");
  const [vacancyMode, setVacancyMode] = useState<VacancyMode>("all");
  const [chartRange, setChartRange] = useState<ChartRange>(6);

  const totalApplicants = recruitment.stats.find((item) => normalizeToken(item.label) === "total_applicants");
  const interviewed = recruitment.stats.find((item) => normalizeToken(item.label) === "interviewed");
  const hired = recruitment.stats.find((item) => normalizeToken(item.label) === "hired");

  const filteredVacancies = useMemo(() => {
    if (vacancyMode === "all") {
      return recruitment.vacancies;
    }
    return recruitment.vacancies.filter((vacancy) => normalizeToken(vacancy.mode) === vacancyMode);
  }, [recruitment.vacancies, vacancyMode]);

  const filteredApplicants = useMemo(
    () => recruitment.applicants.filter((applicant) => getApplicantTabMatches(activeTab, applicant)),
    [activeTab, recruitment.applicants]
  );

  const series = useMemo(() => {
    const base = recruitment.applicationSeries.length ? recruitment.applicationSeries : [0, 0, 0, 0, 0, 0];
    return base.slice(-chartRange);
  }, [chartRange, recruitment.applicationSeries]);

  const seriesStartIndex = Math.max(monthLabels.length - series.length, 0);
  const seriesMonths = monthLabels.slice(seriesStartIndex, seriesStartIndex + series.length);

  const maxDeptValue = Math.max(...recruitment.departmentBars.map((item) => item.value), 1);

  return (
    <section className="recruitment-v2">
      <header className="recruitment-v2-head card">
        <div>
          <h2>Recruitment</h2>
          <p className="breadcrumb">Dashboard / Recruitment</p>
        </div>
      </header>

      <div className="recruitment-v2-layout">
        <main className="recruitment-v2-main">
          <section className="recruitment-v2-top">
            <article className="card recruitment-v2-total">
              <div className="recruitment-v2-total-icon">📄</div>
              <strong>{totalApplicants?.value ?? "0"}</strong>
              <div className="recruitment-v2-delta">
                <span>{totalApplicants?.delta ?? "0%"}</span>
                <small>{totalApplicants?.note ?? "vs last month"}</small>
              </div>
              <p>Total Applicants</p>
            </article>

            <div className="recruitment-v2-mini-stats">
              <article className="card recruitment-v2-mini">
                <div>
                  <span>Interviewed</span>
                  <strong>{interviewed?.value ?? "0"}</strong>
                </div>
                <div className="recruitment-v2-mini-foot">
                  <span>{interviewed?.delta ?? "0%"}</span>
                  <small>{interviewed?.note ?? "of applicants"}</small>
                </div>
              </article>
              <article className="card recruitment-v2-mini">
                <div>
                  <span>Hired</span>
                  <strong>{hired?.value ?? "0"}</strong>
                </div>
                <div className="recruitment-v2-mini-foot">
                  <span>{hired?.delta ?? "0%"}</span>
                  <small>{hired?.note ?? "of applicants"}</small>
                </div>
              </article>
            </div>

            <article className="card recruitment-v2-application">
              <div className="section-title">
                <div>
                  <h2>Application</h2>
                  <p>Trend of applicant volume</p>
                </div>
                <select
                  className="recruitment-v2-select"
                  value={String(chartRange)}
                  onChange={(event) => setChartRange(Number(event.target.value) as ChartRange)}
                >
                  {chartRanges.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Sparkline values={series} />
              <div className="recruitment-v2-months">
                {seriesMonths.map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </article>
          </section>

          <section className="recruitment-v2-middle">
            <article className="card">
              <div className="section-title">
                <div>
                  <h2>Current Vacancies</h2>
                </div>
                <select
                  className="recruitment-v2-select"
                  value={vacancyMode}
                  onChange={(event) => setVacancyMode(event.target.value as VacancyMode)}
                >
                  {vacancyModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="vacancy-grid">
                {filteredVacancies.length ? (
                  filteredVacancies.map((vacancy) => (
                    <article key={`${vacancy.title}-${vacancy.mode}`} className="vacancy-card">
                      <div className="vacancy-title">{vacancy.title}</div>
                      <div className="vacancy-meta">
                        <span>{formatTitle(vacancy.type)}</span>
                        <span>{getModeLabel(vacancy.mode)}</span>
                        <span>{vacancy.count} applicants</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="muted recruitment-v2-empty">No vacancies for this filter.</p>
                )}
              </div>
            </article>

            <article className="card">
              <div className="section-title">
                <div>
                  <h2>Application by Department</h2>
                </div>
                <span className="menu-dots">...</span>
              </div>
              <div className="recruitment-v2-departments">
                {recruitment.departmentBars.map((item) => {
                  const height = Math.max(14, Math.round((item.value / maxDeptValue) * 100));
                  return (
                    <div key={item.label} className="recruitment-v2-department-item">
                      <strong>{item.value}</strong>
                      <div className="recruitment-v2-department-track">
                        <span style={{ height: `${height}%` }} />
                      </div>
                      <small title={item.label}>{truncateLabel(item.label)}</small>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <article className="card applicants-card">
            <div className="section-title">
              <div>
                <h2>Applicants</h2>
              </div>
            </div>
            <div className="applicant-tabs">
              {applicantTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`tab${activeTab === tab.key ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="applicant-table-wrap">
              <table className="table applicant-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Job Title</th>
                    <th>Applied Date</th>
                    <th>Application Received</th>
                    <th>Status (Stage)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.length ? (
                    filteredApplicants.map((applicant) => {
                      const progress = stageProgress(applicant.stage);
                      return (
                        <tr key={`${applicant.email}-${applicant.applied}`}>
                          <td>
                            <div className="applicant-person">
                              <div className="avatar applicant-avatar">{applicant.name.slice(0, 1)}</div>
                              <div>
                                <strong>{applicant.name}</strong>
                                <div className="muted">{applicant.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{applicant.role}</strong>
                            <div className="muted">{applicant.department}</div>
                          </td>
                          <td>{formatShortDate(applicant.applied)}</td>
                          <td>
                            <div className="recruitment-v2-tag-wrap">
                              <span className="badge">{formatTitle(applicant.received)}</span>
                              <span className="badge success">{getModeLabel(applicant.tag)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="stage-cell">
                              <span>{stageLabel(applicant.stage)}</span>
                              <div className="stage-progress">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <span key={index} className={index < progress ? "active" : ""}>
                                    {index + 1}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="recruitment-v2-empty-table">
                        No applicants in this stage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </main>

        <aside className="recruitment-v2-rail">
          <section className="card resource-card">
            <div className="section-title">
              <div>
                <h2>Applicant Resources</h2>
              </div>
              <span className="menu-dots">...</span>
            </div>
            <div className="resource-list">
              {recruitment.resources.map((resource) => (
                <div key={resource.label} className="resource-row">
                  <div className="resource-head">
                    <span>{resource.label}</span>
                    <strong>{sourcePercent(resource.value)}</strong>
                  </div>
                  <div className="resource-track">
                    <span style={{ width: resource.value }} />
                  </div>
                  <div className="resource-count">{resource.count}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card schedule-card recruitment-schedule">
            <div className="section-title">
              <div>
                <h2>Schedules</h2>
              </div>
              <span className="menu-dots">...</span>
            </div>

            <div className="mini-calendar">
              <div className="mini-calendar-head">
                <span>‹</span>
                <strong>June 2035</strong>
                <span>›</span>
              </div>
              <div className="mini-calendar-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <span key={day} className="mini-calendar-label">
                    {day}
                  </span>
                ))}
                {[17, 18, 19, 20, 21, 22, 23].map((date, index) => (
                  <span key={date} className={index === 3 ? "mini-calendar-day active" : "mini-calendar-day"}>
                    {date}
                  </span>
                ))}
              </div>
            </div>

            <div className="timeline">
              {recruitment.scheduleItems.map((item) => (
                <div key={`${item.title}-${item.time}`} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-card">
                    <div className="timeline-time">{item.time}</div>
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
