"use client";

import { useMemo, useState } from "react";

type PayrollData = {
  periods: { id: string; name: string; dateFrom: string; dateTo: string; payDate: string; status: string }[];
  runs: {
    id: string;
    payrollPeriodId: string;
    employeeId: string;
    employeeName: string;
    payrollPeriodName: string;
    basicPay: string;
    overtimePay: string;
    holidayPay: string;
    allowances: string;
    grossPay: string;
    employeeDeductions: string;
    employerContributions: string;
    taxableIncome: string;
    withholdingTax: string;
    netPay: string;
    status: string;
  }[];
  payslips: { id: string; payrollRunId: string; employeeId: string; employeeName: string; pdfUrl: string; generatedAt: string }[];
  adjustments: { id: string; payrollRunId: string; type: string; label: string; amount: string; taxable: boolean; remarks: string }[];
};

type PayrollWorkspaceProps = {
  payroll: PayrollData;
};

type PayrollStatusFilter = "all" | "completed" | "processing" | "draft";

type ParsedRun = {
  id: string;
  employeeName: string;
  payrollPeriodName: string;
  payDate: string;
  salary: number;
  allowances: number;
  overtime: number;
  incentives: number;
  deductions: number;
  total: number;
  status: string;
};

type BreakdownCategory = {
  key: string;
  label: string;
  amount: number;
  percent: number;
  tone: "salary" | "allowances" | "deductions" | "incentives" | "overtime";
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const numericValue = (raw: string | number) => {
  if (typeof raw === "number") {
    return raw;
  }
  const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

const compactCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);

const asPercent = (current: number, previous: number) => {
  if (!previous) {
    return "+0%";
  }
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "2-digit" }).format(parsed);
};

const chartPoints = (values: number[], width: number, height: number) => {
  const source = values.length > 1 ? values : [0, 0];
  const max = Math.max(...source, 1);
  const min = Math.min(...source, 0);
  return source
    .map((value, index) => {
      const x = (index / (source.length - 1)) * width;
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - normalized * (height - 12) - 6;
      return `${x},${y}`;
    })
    .join(" ");
};

const normalizeStatus = (status: string) => status.toLowerCase().replace(/[\s-]+/g, "_");

export function PayrollWorkspace({ payroll }: PayrollWorkspaceProps) {
  const [periodRange, setPeriodRange] = useState("last_year");
  const [breakdownRange, setBreakdownRange] = useState("month");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatusFilter>("all");

  const periodById = useMemo(
    () =>
      Object.fromEntries(
        payroll.periods.map((period) => [
          period.id,
          {
            payDate: period.payDate,
            status: period.status,
            name: period.name
          }
        ])
      ),
    [payroll.periods]
  );

  const incentiveByRun = useMemo(() => {
    const map = new Map<string, number>();
    payroll.adjustments.forEach((adjustment) => {
      const token = `${adjustment.type} ${adjustment.label}`.toLowerCase();
      if (token.includes("incentive") || token.includes("bonus")) {
        map.set(adjustment.payrollRunId, (map.get(adjustment.payrollRunId) ?? 0) + numericValue(adjustment.amount));
      }
    });
    return map;
  }, [payroll.adjustments]);

  const parsedRuns = useMemo<ParsedRun[]>(() => {
    return payroll.runs.map((run) => {
      const incentives = incentiveByRun.get(run.id) ?? numericValue(run.holidayPay);
      const payDate = periodById[run.payrollPeriodId]?.payDate ?? "";
      return {
        id: run.id,
        employeeName: run.employeeName,
        payrollPeriodName: run.payrollPeriodName,
        payDate,
        salary: numericValue(run.basicPay),
        allowances: numericValue(run.allowances),
        overtime: numericValue(run.overtimePay),
        incentives,
        deductions: numericValue(run.employeeDeductions) + numericValue(run.withholdingTax),
        total: numericValue(run.netPay),
        status: normalizeStatus(run.status)
      };
    });
  }, [incentiveByRun, payroll.runs, periodById]);

  const effectiveRuns = parsedRuns;

  const runsByPeriod = useMemo(() => {
    const bucket = new Map<string, ParsedRun[]>();
    effectiveRuns.forEach((run) => {
      const key = run.payrollPeriodName || "Current";
      const current = bucket.get(key) ?? [];
      current.push(run);
      bucket.set(key, current);
    });
    return bucket;
  }, [effectiveRuns]);

  const orderedPeriods = useMemo(() => {
    const withDates = Array.from(runsByPeriod.keys()).map((name) => {
      const match = payroll.periods.find((period) => period.name === name);
      return { name, date: match?.payDate ?? "" };
    });
    return withDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [payroll.periods, runsByPeriod]);

  const periodTotals = useMemo(() => {
    return orderedPeriods.map((period) => {
      const runs = runsByPeriod.get(period.name) ?? [];
      return {
        period: period.name,
        salary: runs.reduce((sum, run) => sum + run.salary, 0),
        allowances: runs.reduce((sum, run) => sum + run.allowances, 0),
        overtime: runs.reduce((sum, run) => sum + run.overtime, 0),
        incentives: runs.reduce((sum, run) => sum + run.incentives, 0),
        deductions: runs.reduce((sum, run) => sum + run.deductions, 0),
        net: runs.reduce((sum, run) => sum + run.total, 0)
      };
    });
  }, [orderedPeriods, runsByPeriod]);

  const latest = periodTotals.at(-1) ?? { salary: 0, allowances: 0, overtime: 0, incentives: 0, deductions: 0, net: 0 };
  const previous = periodTotals.at(-2) ?? { salary: 0, allowances: 0, overtime: 0, incentives: 0, deductions: 0, net: 0 };

  const chartSeries = useMemo(() => {
    const salary = Array.from({ length: 12 }, () => 0);
    const overtime = Array.from({ length: 12 }, () => 0);
    const incentives = Array.from({ length: 12 }, () => 0);
    effectiveRuns.forEach((run) => {
      const date = new Date(run.payDate);
      const monthIndex = Number.isNaN(date.getTime()) ? new Date().getMonth() : date.getMonth();
      salary[monthIndex] += run.salary;
      overtime[monthIndex] += run.overtime;
      incentives[monthIndex] += run.incentives;
    });

    const scale = (values: number[]) => values.map((value) => Number((value / 1000).toFixed(1)));
    return {
      salary: scale(salary),
      overtime: scale(overtime),
      incentives: scale(incentives)
    };
  }, [effectiveRuns]);

  const totalPayThisMonth = latest.salary + latest.allowances + latest.overtime + latest.incentives;
  const breakdownBase = Math.max(totalPayThisMonth, 1);

  const breakdownCategories = useMemo<BreakdownCategory[]>(
    () => [
      {
        key: "salary",
        label: "Salary",
        amount: latest.salary,
        percent: (latest.salary / breakdownBase) * 100,
        tone: "salary"
      },
      {
        key: "allowances",
        label: "Allowances",
        amount: latest.allowances,
        percent: (latest.allowances / breakdownBase) * 100,
        tone: "allowances"
      },
      {
        key: "deductions",
        label: "Deductions",
        amount: latest.deductions,
        percent: (latest.deductions / breakdownBase) * 100,
        tone: "deductions"
      },
      {
        key: "incentives",
        label: "Incentives",
        amount: latest.incentives,
        percent: (latest.incentives / breakdownBase) * 100,
        tone: "incentives"
      },
      {
        key: "overtime",
        label: "Overtime",
        amount: latest.overtime,
        percent: (latest.overtime / breakdownBase) * 100,
        tone: "overtime"
      }
    ],
    [breakdownBase, latest.allowances, latest.deductions, latest.incentives, latest.overtime, latest.salary]
  );

  const payslipByRun = useMemo(
    () => new Map(payroll.payslips.map((payslip) => [payslip.payrollRunId, payslip])),
    [payroll.payslips]
  );

  const fallbackPayslipDataUrl = (run: ParsedRun) =>
    `data:text/plain;charset=utf-8,${encodeURIComponent(
      `Payslip Summary\nEmployee: ${run.employeeName}\nPeriod: ${run.payrollPeriodName}\nDate: ${run.payDate}\nSalary: ${currency(run.salary)}\nAllowances: ${currency(run.allowances)}\nOvertime: ${currency(run.overtime)}\nIncentives: ${currency(run.incentives)}\nDeductions: ${currency(run.deductions)}\nNet Pay: ${currency(run.total)}\nStatus: ${run.status}`
    )}`;

  const filteredRuns = useMemo(() => {
    const token = search.trim().toLowerCase();
    return effectiveRuns.filter((run) => {
      const statusMatch = statusFilter === "all" ? true : run.status === statusFilter;
      const textMatch = !token
        ? true
        : `${run.employeeName} ${run.payrollPeriodName} ${run.id}`.toLowerCase().includes(token);
      return statusMatch && textMatch;
    });
  }, [effectiveRuns, search, statusFilter]);

  const totalSegments = 72;
  const segmentOrder = breakdownCategories.flatMap((item) => {
    const count = Math.round((item.percent / 100) * totalSegments);
    return Array.from({ length: count }, () => item.tone);
  });
  const segments = Array.from({ length: totalSegments }, (_, index) => segmentOrder[index] ?? "deductions");

  const salaryPath = chartPoints(chartSeries.salary, 640, 170);
  const overtimePath = chartPoints(chartSeries.overtime, 640, 170);
  const incentivesPath = chartPoints(chartSeries.incentives, 640, 170);

  return (
    <section className="payroll-v2">
      <header className="payroll-v2-head card">
        <div>
          <h2>Payroll</h2>
          <p className="breadcrumb">Dashboard / Payroll</p>
        </div>
      </header>

      <section className="payroll-v2-metrics">
        <article className="card payroll-v2-metric-card">
          <span>Total Salary</span>
          <strong>{compactCurrency(latest.salary)}</strong>
          <small>{asPercent(latest.salary, previous.salary)} from previous period</small>
        </article>
        <article className="card payroll-v2-metric-card">
          <span>Total Allowances</span>
          <strong>{compactCurrency(latest.allowances)}</strong>
          <small>{asPercent(latest.allowances, previous.allowances)} from previous period</small>
        </article>
        <article className="card payroll-v2-metric-card">
          <span>Total Overtime</span>
          <strong>{compactCurrency(latest.overtime)}</strong>
          <small>{asPercent(latest.overtime, previous.overtime)} from previous period</small>
        </article>
        <article className="card payroll-v2-metric-card">
          <span>Total Incentives</span>
          <strong>{compactCurrency(latest.incentives)}</strong>
          <small>{asPercent(latest.incentives, previous.incentives)} from previous period</small>
        </article>
      </section>

      <section className="payroll-v2-top">
        <article className="card payroll-v2-overview">
          <div className="section-title">
            <div>
              <h2>Payroll Overview</h2>
            </div>
            <select className="payroll-v2-select" value={periodRange} onChange={(event) => setPeriodRange(event.target.value)}>
              <option value="last_year">Last Year</option>
              <option value="last_6">Last 6 Months</option>
            </select>
          </div>
          <div className="payroll-v2-legend">
            <span><i className="tone salary" />Salary</span>
            <span><i className="tone overtime" />Overtime</span>
            <span><i className="tone incentives" />Incentives</span>
          </div>
          <svg className="payroll-v2-chart" viewBox="0 0 640 200" preserveAspectRatio="none" aria-hidden="true">
            <polyline className="line salary" points={salaryPath} />
            <polyline className="line overtime" points={overtimePath} />
            <polyline className="line incentives" points={incentivesPath} />
          </svg>
          <div className="payroll-v2-month-row">
            {monthLabels.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </article>

        <article className="card payroll-v2-breakdown">
          <div className="section-title">
            <div>
              <h2>Payroll Breakdown</h2>
            </div>
            <select className="payroll-v2-select" value={breakdownRange} onChange={(event) => setBreakdownRange(event.target.value)}>
              <option value="month">This Month</option>
              <option value="period">Current Period</option>
            </select>
          </div>
          <div className="payroll-v2-breakdown-total">
            <strong>{currency(totalPayThisMonth)}</strong>
            <span>Total Pay This Month</span>
          </div>
          <div className="payroll-v2-segment-bar" aria-hidden="true">
            {segments.map((tone, index) => (
              <span key={`${tone}-${index}`} className={`segment ${tone}`} />
            ))}
          </div>
          <div className="payroll-v2-breakdown-grid">
            {breakdownCategories.map((category) => (
              <div key={category.key} className="payroll-v2-breakdown-item">
                <div className="head">
                  <span><i className={`tone ${category.tone}`} />{category.label}</span>
                  <strong>{category.percent.toFixed(1)}%</strong>
                </div>
                <small>{currency(category.amount)}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="card payroll-v2-table-card">
        <div className="section-title">
          <div>
            <h2>Payroll List</h2>
          </div>
          <div className="payroll-v2-table-actions">
            <label className="payroll-v2-search">
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, period, ID"
                aria-label="Search payroll list"
              />
            </label>
            <select
              className="payroll-v2-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PayrollStatusFilter)}
            >
              <option value="all">All Status</option>
              <option value="completed">Paid</option>
              <option value="processing">Processing</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="applicant-table-wrap">
          <table className="table payroll-v2-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Job Title</th>
                <th>Date</th>
                <th>Salary</th>
                <th>Allowances</th>
                <th>Overtime</th>
                <th>Incen.</th>
                <th>Deduct.</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.length ? (
                filteredRuns.map((run) => {
                  const payslip = payslipByRun.get(run.id);
                  return (
                    <tr key={run.id}>
                      <td>
                        <div className="applicant-person">
                          <div className="avatar applicant-avatar">{run.employeeName.slice(0, 1)}</div>
                          <div>
                            <strong>{run.employeeName}</strong>
                            <div className="muted">{run.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>—</strong>
                        <div className="muted">{run.payrollPeriodName}</div>
                      </td>
                      <td>{formatDate(run.payDate)}</td>
                      <td>{currency(run.salary)}</td>
                      <td>{currency(run.allowances)}</td>
                      <td>{currency(run.overtime)}</td>
                      <td>{currency(run.incentives)}</td>
                      <td>{currency(run.deductions)}</td>
                      <td>
                        <strong className="payroll-v2-total">{currency(run.total)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${run.status === "completed" ? "success" : "warning"}`}>
                          {run.status === "completed" ? "Paid" : run.status}
                        </span>
                      </td>
                      <td>
                        {payslip?.pdfUrl ? (
                          <a className="badge" href={payslip.pdfUrl} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        ) : (
                          <a
                            className="badge"
                            href={fallbackPayslipDataUrl(run)}
                            download={`${run.employeeName.replace(/\s+/g, "-").toLowerCase()}-payslip.txt`}
                          >
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="recruitment-v2-empty-table">
                    No payroll runs match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
