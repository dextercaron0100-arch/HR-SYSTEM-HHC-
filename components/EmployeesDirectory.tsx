"use client";

import { useMemo, useState } from "react";
import type { Department, Employee, Position } from "@hr/contracts";
import Link from "next/link";

type EmployeeDirectoryProps = {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
};

type EmployeeCardView = {
  id: string;
  code: string;
  fullName: string;
  initials: string;
  profilePhotoUrl?: string;
  department: string;
  position: string;
  employmentType: string;
  workMode: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger";
  hireDate: string;
};

const salaryTypeToEmploymentType: Record<Employee["salaryType"], string> = {
  monthly: "Full-Time",
  daily: "Part-Time",
  hourly: "Freelance"
};

const workModes = ["On-Site", "Remote", "Hybrid"] as const;

const hashString = (value: string) =>
  value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

const toInitials = (firstName: string, lastName: string) =>
  `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();

const statusToLabel = (status: Employee["employmentStatus"]) => {
  switch (status) {
    case "active":
      return { label: "Active", tone: "success" as const };
    case "probation":
      return { label: "Probation", tone: "warning" as const };
    case "on_leave":
      return { label: "On Leave", tone: "warning" as const };
    default:
      return { label: "Inactive", tone: "danger" as const };
  }
};

const normalize = (value: string) => value.trim().toLowerCase();

export function EmployeesDirectory({
  employees,
  departments,
  positions
}: EmployeeDirectoryProps) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  const departmentMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments]
  );
  const positionMap = useMemo(
    () => new Map(positions.map((position) => [position.id, position.title])),
    [positions]
  );

  const cards = useMemo<EmployeeCardView[]>(
    () =>
      employees.map((employee) => {
        const department = departmentMap.get(employee.departmentId) ?? "Unassigned";
        const position = positionMap.get(employee.positionId) ?? "Unassigned";
        const profilePhotoUrl = (employee as Employee & { profilePhotoUrl?: string })
          .profilePhotoUrl;
        const status = statusToLabel(employee.employmentStatus);
        const fallbackMode = workModes[hashString(employee.id) % workModes.length];

        let workMode = fallbackMode;
        if (/operations|service|support/i.test(department)) {
          workMode = "On-Site";
        } else if (/design|product/i.test(department)) {
          workMode = "Remote";
        }

        return {
          id: employee.id,
          code: employee.employeeCode,
          fullName: `${employee.firstName} ${employee.lastName}`,
          initials: toInitials(employee.firstName, employee.lastName),
          profilePhotoUrl,
          department,
          position,
          employmentType: salaryTypeToEmploymentType[employee.salaryType],
          workMode,
          statusLabel: status.label,
          statusTone: status.tone,
          hireDate: employee.hireDate
        };
      }),
    [departmentMap, employees, positionMap]
  );

  const filteredCards = useMemo(() => {
    const query = normalize(search);

    const filtered = cards.filter((card) => {
      const matchesSearch =
        !query ||
        normalize(card.fullName).includes(query) ||
        normalize(card.code).includes(query) ||
        normalize(card.position).includes(query);
      const matchesDepartment =
        departmentFilter === "all" || card.department === departmentFilter;
      const matchesPosition =
        positionFilter === "all" || card.position === positionFilter;

      return matchesSearch && matchesDepartment && matchesPosition;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "name_desc":
        sorted.sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime()
        );
        break;
      default:
        sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
    }

    return sorted;
  }, [cards, departmentFilter, positionFilter, search, sortBy]);

  return (
    <section className="employees-panel">
      <div className="employees-panel-head">
        <div>
          <h2>Employees</h2>
          <p className="breadcrumb">Dashboard / Employees</p>
        </div>
        <div className="employees-head-actions">
          <span className="chip">{filteredCards.length} records</span>
          <Link href="/employees/new?draft=1" className="button-secondary">
            Draft
          </Link>
          <Link href="/employees/new" className="button-secondary">
            New Employee
          </Link>
        </div>
      </div>

      <div className="employees-toolbar">
        <label className="employees-search-input">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search employee"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
        >
          <option value="all">All Department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.name}>
              {department.name}
            </option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(event) => setPositionFilter(event.target.value)}
        >
          <option value="all">All Position</option>
          {positions.map((position) => (
            <option key={position.id} value={position.title}>
              {position.title}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="employees-sort"
        >
          <option value="name_asc">Sort: Name A-Z</option>
          <option value="name_desc">Sort: Name Z-A</option>
          <option value="newest">Sort: Newest Hire</option>
          <option value="oldest">Sort: Oldest Hire</option>
        </select>
      </div>

      <div className="employees-grid">
        {filteredCards.map((card) => (
          <Link key={card.id} href={`/employees/${card.id}`} className="employee-card-link">
            <article className="employee-card">
            <div className={`employee-avatar${card.profilePhotoUrl ? " has-photo" : ""}`}>
              {card.profilePhotoUrl ? (
                <img src={card.profilePhotoUrl} alt={`${card.fullName} photo`} />
              ) : (
                card.initials
              )}
            </div>
            <span className="employee-code">{card.code}</span>
            <h3>{card.fullName}</h3>

            <div className="employee-meta-table">
              <div className="employee-meta-row">
                <span>Job Title</span>
                <strong>{card.position}</strong>
              </div>
              <div className="employee-meta-row">
                <span>Department</span>
                <strong>{card.department}</strong>
              </div>
            </div>

            <div className="employee-badges">
              <span className="badge">{card.employmentType}</span>
              <span className="badge">{card.workMode}</span>
              <span className={`badge ${card.statusTone}`}>{card.statusLabel}</span>
            </div>
            </article>
          </Link>
        ))}
      </div>

      {!filteredCards.length ? (
        <div className="employees-empty">No employees match your filter.</div>
      ) : null}
    </section>
  );
}
