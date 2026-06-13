"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Department, Employee, Position } from "@hr/contracts";

type AddEmployeeWizardProps = {
  departments: Department[];
  positions: Position[];
  employees: Employee[];
  initialEmployee?: Partial<FormState> & { id: string };
};

type StepKey = "personal" | "employment" | "compliance";

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  managerId: string;
  hireDate: string;
  salaryType: "monthly" | "daily" | "hourly";
  basicSalary: string;
  employmentStatus: "active" | "probation" | "on_leave" | "terminated";
  tin: string;
  sssNo: string;
  philhealthNo: string;
  pagibigNo: string;
};

const steps: { key: StepKey; title: string; subtitle: string }[] = [
  {
    key: "personal",
    title: "Personal & Contact Information",
    subtitle: "Enter personal details and primary contact information."
  },
  {
    key: "employment",
    title: "Employment & Payroll Details",
    subtitle: "Assign department, position, salary type, and payroll details."
  },
  {
    key: "compliance",
    title: "Allowances, Benefits & Documents",
    subtitle: "Add statutory IDs and finalize the employee registration."
  }
];

const defaultState: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  gender: "male",
  email: "",
  phone: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  employeeCode: "",
  departmentId: "",
  positionId: "",
  managerId: "",
  hireDate: "",
  salaryType: "monthly",
  basicSalary: "",
  employmentStatus: "active",
  tin: "",
  sssNo: "",
  philhealthNo: "",
  pagibigNo: ""
};

function getInitialState(
  departments: Department[],
  positions: Position[]
): FormState {
  const initialDepartmentId = departments[0]?.id ?? "";
  const initialPositionId =
    positions.find((position) => position.departmentId === initialDepartmentId)?.id ??
    positions[0]?.id ??
    "";

  return {
    ...defaultState,
    departmentId: initialDepartmentId,
    positionId: initialPositionId
  };
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const draftStorageKey = "hr-system:add-employee-draft:v1";

const inputClass = (hasError: boolean) =>
  `add-employee-input${hasError ? " is-error" : ""}`;

export function AddEmployeeWizard({
  departments,
  positions,
  employees,
  initialEmployee
}: AddEmployeeWizardProps) {
  const router = useRouter();
  const hasHydratedDraft = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<FormState>(() => {
    const base = getInitialState(departments, positions);
    return initialEmployee ? { ...base, ...initialEmployee } : base;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  const currentStep = steps[stepIndex];
  const progressPercentage = ((stepIndex + 1) / steps.length) * 100;

  const positionChoices = useMemo(
    () =>
      state.departmentId
        ? positions.filter((position) => position.departmentId === state.departmentId)
        : positions,
    [positions, state.departmentId]
  );

  useEffect(() => {
    const defaultDepartmentId = departments[0]?.id ?? "";
    const selectedDepartmentId = departments.some(
      (department) => department.id === state.departmentId
    )
      ? state.departmentId
      : defaultDepartmentId;

    const validPositionChoices = positions.filter(
      (position) => position.departmentId === selectedDepartmentId
    );
    const fallbackPositionId =
      validPositionChoices[0]?.id ?? positions[0]?.id ?? "";
    const selectedPositionId = positions.some(
      (position) =>
        position.id === state.positionId &&
        (!selectedDepartmentId || position.departmentId === selectedDepartmentId)
    )
      ? state.positionId
      : fallbackPositionId;

    if (
      selectedDepartmentId !== state.departmentId ||
      selectedPositionId !== state.positionId
    ) {
      setState((current) => ({
        ...current,
        departmentId: selectedDepartmentId,
        positionId: selectedPositionId
      }));
    }
  }, [departments, positions, state.departmentId, state.positionId]);

  useEffect(() => {
    if (hasHydratedDraft.current) {
      return;
    }
    hasHydratedDraft.current = true;

    if (typeof window === "undefined") {
      return;
    }

    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      if (urlSearchParams.get("draft") === "1") {
        setFormMessage("No saved draft found yet. Fill the form and click Save as Draft.");
      }
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as {
        state?: Partial<FormState>;
        stepIndex?: number;
        savedAt?: string;
      };

      if (parsed.state && typeof parsed.state === "object") {
        setState((current) => ({ ...current, ...parsed.state }));
      }
      if (typeof parsed.stepIndex === "number") {
        const boundedStep = Math.max(0, Math.min(parsed.stepIndex, steps.length - 1));
        setStepIndex(boundedStep);
      }

      const savedAtLabel = parsed.savedAt
        ? new Date(parsed.savedAt).toLocaleString()
        : "previous session";
      setFormMessage(`Draft restored (${savedAtLabel}).`);
    } catch {
      window.localStorage.removeItem(draftStorageKey);
      setFormMessage("Corrupted draft was removed. You can save a new draft now.");
    }
  }, []);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) {
        return current;
      }
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  };

  const validatePersonal = () => {
    const nextErrors: Record<string, string> = {};
    if (!state.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!state.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!state.birthDate) nextErrors.birthDate = "Date of birth is required.";
    if (!state.gender) nextErrors.gender = "Gender is required.";
    if (!state.email.trim()) nextErrors.email = "Email is required.";
    if (!state.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!state.address.trim()) nextErrors.address = "Address is required.";
    if (!state.emergencyName.trim())
      nextErrors.emergencyName = "Emergency contact name is required.";
    if (!state.emergencyPhone.trim())
      nextErrors.emergencyPhone = "Emergency phone is required.";
    return nextErrors;
  };

  const validateEmployment = () => {
    const nextErrors: Record<string, string> = {};
    if (!state.departmentId) nextErrors.departmentId = "Department is required.";
    if (!state.positionId) nextErrors.positionId = "Position is required.";
    if (!state.hireDate) nextErrors.hireDate = "Hire date is required.";
    if (!state.basicSalary || Number(state.basicSalary) <= 0) {
      nextErrors.basicSalary = "Enter a valid salary amount.";
    }
    return nextErrors;
  };

  const validateCurrentStep = () => {
    if (currentStep.key === "personal") {
      return validatePersonal();
    }
    if (currentStep.key === "employment") {
      return validateEmployment();
    }
    return {};
  };

  const goNext = () => {
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setFormMessage("");
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const goBack = () => {
    setFormMessage("");
    setErrors({});
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const resetForm = () => {
    setState(getInitialState(departments, positions));
    setErrors({});
    setStepIndex(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey);
    }
    setFormMessage("Form cleared and draft removed.");
  };

  const saveDraft = () => {
    if (typeof window === "undefined") {
      setFormMessage("Draft can only be saved in a browser session.");
      return;
    }

    try {
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          state,
          stepIndex,
          savedAt: new Date().toISOString()
        })
      );
      setFormMessage("Draft saved locally. Complete all steps to submit.");
    } catch {
      setFormMessage("Unable to save draft locally on this device.");
    }
  };

  const submitForm = async () => {
    const personalErrors = validatePersonal();
    const employmentErrors = validateEmployment();
    const nextErrors = { ...personalErrors, ...employmentErrors };
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStepIndex(Object.keys(personalErrors).length ? 0 : 1);
      return;
    }

    setIsSaving(true);
    setFormMessage("");
    try {
      const url = initialEmployee?.id 
        ? `${apiBaseUrl}/api/employees/${initialEmployee.id}`
        : `${apiBaseUrl}/api/employees`;
        
      const response = await fetch(url, {
        method: initialEmployee?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: state.employeeCode || undefined,
          firstName: state.firstName.trim(),
          middleName: state.middleName.trim() || undefined,
          lastName: state.lastName.trim(),
          birthDate: state.birthDate || undefined,
          sex: state.gender || undefined,
          departmentId: state.departmentId,
          positionId: state.positionId,
          managerId: state.managerId || undefined,
          hireDate: state.hireDate,
          employmentStatus: state.employmentStatus,
          salaryType: state.salaryType,
          basicSalary: Number(state.basicSalary),
          phone: state.phone.trim(),
          email: state.email.trim(),
          address: state.address.trim(),
          governmentIds: {
            tin: state.tin.trim() || undefined,
            sssNo: state.sssNo.trim() || undefined,
            philhealthNo: state.philhealthNo.trim() || undefined,
            pagibigNo: state.pagibigNo.trim() || undefined
          }
        })
      });

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(
          bodyText?.trim()
            ? `Failed to create employee (${response.status}): ${bodyText}`
            : `Failed to create employee (${response.status})`
        );
      }

      const bodyText = await response.text();
      let employeeId: string | undefined;

      if (bodyText.trim()) {
        try {
          const parsed = JSON.parse(bodyText) as string | { id?: string };
          employeeId = typeof parsed === "string" ? parsed : parsed.id;
        } catch {
          employeeId = bodyText.trim();
        }
      }

      if (employeeId) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(draftStorageKey);
        }
        if (employeeId.startsWith("emp-local-")) {
          router.push("/employees");
          return;
        }
        router.push(`/employees/${employeeId}`);
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
      }
      router.push("/employees");
    } catch (error) {
      const isLocalhostApi = apiBaseUrl.includes("localhost");
      const isDeployedWeb =
        typeof window !== "undefined" &&
        !["localhost", "127.0.0.1"].includes(window.location.hostname);
      const rawMessage =
        error instanceof Error
          ? error.message
          : "Unable to save employee right now.";

      if (isLocalhostApi && isDeployedWeb) {
        setFormMessage(
          "Unable to save employee: production web is still pointing to localhost API. Set NEXT_PUBLIC_API_URL to your live backend URL."
        );
      } else if (
        rawMessage.includes("Failed to fetch") ||
        rawMessage.includes("NetworkError")
      ) {
        setFormMessage(
          "Unable to save employee: backend API is unreachable. Please start the API server and database first."
        );
      } else {
        setFormMessage(rawMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="add-employee-page">
      <header className="add-employee-head">
        <div className="add-employee-head-copy">
          <p className="breadcrumb">Dashboard / Employees / {initialEmployee ? "Edit Employee" : "Add New Employee"}</p>
          <h1>{initialEmployee ? "Edit Employee Details" : "Register New Employee"}</h1>
        </div>
        <Link href="/employees" className="add-employee-back">
          ← Back to Employees
        </Link>
      </header>

      <div className="add-employee-layout">
        <aside className="card add-employee-sidebar">
          <h2>{initialEmployee ? "Edit Employee" : "Register New Employee"}</h2>
          <p>
            Enter all required employment details to formally add a new member to
            your organization.
          </p>
          <div className="add-employee-sidebar-progress">
            <div className="add-employee-sidebar-progress-row">
              <strong>{Math.round(progressPercentage)}%</strong>
              <span>Completion</span>
            </div>
            <div className="add-employee-sidebar-track" aria-hidden="true">
              <span style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
          <div className="add-employee-steps">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`add-employee-step${
                  index === stepIndex ? " current" : ""
                }${index < stepIndex ? " done" : ""}`}
                style={{ "--step-index": index } as CSSProperties}
              >
                <span className="add-employee-step-index">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="card add-employee-main">
          <div className="add-employee-step-head">
            <div className="add-employee-step-head-top">
              <span>Step {stepIndex + 1} of {steps.length}</span>
              <div className="add-employee-step-pill" aria-hidden="true">
                <strong>{stepIndex + 1}</strong>
                <small>/ {steps.length}</small>
              </div>
            </div>
            <h2>{currentStep.title}</h2>
            <p>{currentStep.subtitle}</p>
            <div className="add-employee-progress">
              <div style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          {currentStep.key === "personal" ? (
            <div className="add-employee-section">
              <section className="add-employee-block">
                <h3>Personal Info</h3>
                <div className="add-employee-grid two">
                  <label>
                    <span>First Name</span>
                    <input
                      className={inputClass(Boolean(errors.firstName))}
                      placeholder="Enter first name"
                      value={state.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                    />
                    {errors.firstName ? <small>{errors.firstName}</small> : null}
                  </label>
                  <label>
                    <span>Date of Birth</span>
                    <input
                      type="date"
                      className={inputClass(Boolean(errors.birthDate))}
                      value={state.birthDate}
                      onChange={(event) => updateField("birthDate", event.target.value)}
                    />
                    {errors.birthDate ? <small>{errors.birthDate}</small> : null}
                  </label>
                </div>
                <div className="add-employee-grid two">
                  <label>
                    <span>Middle Name</span>
                    <input
                      className={inputClass(false)}
                      placeholder="Optional"
                      value={state.middleName}
                      onChange={(event) => updateField("middleName", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Last Name</span>
                    <input
                      className={inputClass(Boolean(errors.lastName))}
                      placeholder="Enter last name"
                      value={state.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                    />
                    {errors.lastName ? <small>{errors.lastName}</small> : null}
                  </label>
                </div>
                <div className="add-employee-radio-group">
                  <span>Gender</span>
                  <div>
                    {["male", "female", "prefer_not_to_say"].map((gender) => (
                      <label
                        key={gender}
                        className={`add-employee-radio${
                          state.gender === gender ? " active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          checked={state.gender === gender}
                          onChange={() => updateField("gender", gender)}
                        />
                        <span>
                          {gender === "prefer_not_to_say"
                            ? "Prefer not to say"
                            : gender[0].toUpperCase() + gender.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="add-employee-block">
                <h3>Contact Info</h3>
                <div className="add-employee-grid two">
                  <label>
                    <span>Email Address</span>
                    <input
                      className={inputClass(Boolean(errors.email))}
                      placeholder="example@company.com"
                      value={state.email}
                      onChange={(event) => updateField("email", event.target.value)}
                    />
                    {errors.email ? <small>{errors.email}</small> : null}
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input
                      className={inputClass(Boolean(errors.phone))}
                      placeholder="+63 9XX XXX XXXX"
                      value={state.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                    />
                    {errors.phone ? <small>{errors.phone}</small> : null}
                  </label>
                </div>
                <label>
                  <span>Address</span>
                  <input
                    className={inputClass(Boolean(errors.address))}
                    placeholder="Street, City, Province"
                    value={state.address}
                    onChange={(event) => updateField("address", event.target.value)}
                  />
                  {errors.address ? <small>{errors.address}</small> : null}
                </label>
              </section>

              <section className="add-employee-block">
                <h3>Emergency Contact</h3>
                <div className="add-employee-grid two">
                  <label>
                    <span>Contact Name</span>
                    <input
                      className={inputClass(Boolean(errors.emergencyName))}
                      placeholder="Full name"
                      value={state.emergencyName}
                      onChange={(event) =>
                        updateField("emergencyName", event.target.value)
                      }
                    />
                    {errors.emergencyName ? <small>{errors.emergencyName}</small> : null}
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input
                      className={inputClass(Boolean(errors.emergencyPhone))}
                      placeholder="+63 9XX XXX XXXX"
                      value={state.emergencyPhone}
                      onChange={(event) =>
                        updateField("emergencyPhone", event.target.value)
                      }
                    />
                    {errors.emergencyPhone ? <small>{errors.emergencyPhone}</small> : null}
                  </label>
                </div>
              </section>
            </div>
          ) : null}

          {currentStep.key === "employment" ? (
            <div className="add-employee-section">
              <section className="add-employee-block">
                <h3>Employment Profile</h3>
                <div className="add-employee-grid two">
                  <label>
                    <span>Employee Code</span>
                    <input
                      className={inputClass(false)}
                      placeholder="Auto-generated if blank"
                      value={state.employeeCode}
                      onChange={(event) => updateField("employeeCode", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Hire Date</span>
                    <input
                      type="date"
                      className={inputClass(Boolean(errors.hireDate))}
                      value={state.hireDate}
                      onChange={(event) => updateField("hireDate", event.target.value)}
                    />
                    {errors.hireDate ? <small>{errors.hireDate}</small> : null}
                  </label>
                </div>
                <div className="add-employee-grid two">
                  <label>
                    <span>Department</span>
                    <select
                      className={inputClass(Boolean(errors.departmentId))}
                      value={state.departmentId}
                      onChange={(event) => {
                        const nextDepartmentId = event.target.value;
                        updateField("departmentId", nextDepartmentId);
                        const nextPositionId =
                          positions.find(
                            (position) => position.departmentId === nextDepartmentId
                          )?.id ?? "";
                        updateField("positionId", nextPositionId);
                      }}
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId ? <small>{errors.departmentId}</small> : null}
                  </label>
                  <label>
                    <span>Position</span>
                    <select
                      className={inputClass(Boolean(errors.positionId))}
                      value={state.positionId}
                      onChange={(event) => updateField("positionId", event.target.value)}
                    >
                      <option value="">Select position</option>
                      {positionChoices.map((position) => (
                        <option key={position.id} value={position.id}>
                          {position.title}
                        </option>
                      ))}
                    </select>
                    {errors.positionId ? <small>{errors.positionId}</small> : null}
                  </label>
                </div>
                <div className="add-employee-grid two">
                  <label>
                    <span>Manager</span>
                    <select
                      className={inputClass(false)}
                      value={state.managerId}
                      onChange={(event) => updateField("managerId", event.target.value)}
                    >
                      <option value="">No manager assigned</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Employment Status</span>
                    <select
                      className={inputClass(false)}
                      value={state.employmentStatus}
                      onChange={(event) =>
                        updateField(
                          "employmentStatus",
                          event.target.value as FormState["employmentStatus"]
                        )
                      }
                    >
                      <option value="active">Active</option>
                      <option value="probation">Probation</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="add-employee-block">
                <h3>Payroll Details</h3>
                <div className="add-employee-grid two">
                  <label>
                    <span>Salary Type</span>
                    <select
                      className={inputClass(false)}
                      value={state.salaryType}
                      onChange={(event) =>
                        updateField(
                          "salaryType",
                          event.target.value as FormState["salaryType"]
                        )
                      }
                    >
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </label>
                  <label>
                    <span>Basic Salary</span>
                    <input
                      type="number"
                      className={inputClass(Boolean(errors.basicSalary))}
                      placeholder="0.00"
                      value={state.basicSalary}
                      onChange={(event) => updateField("basicSalary", event.target.value)}
                    />
                    {errors.basicSalary ? <small>{errors.basicSalary}</small> : null}
                  </label>
                </div>
              </section>
            </div>
          ) : null}

          {currentStep.key === "compliance" ? (
            <div className="add-employee-section">
              <section className="add-employee-block">
                <h3>Government IDs</h3>
                <div className="add-employee-grid two">
                  <label>
                    <span>TIN</span>
                    <input
                      className={inputClass(false)}
                      placeholder="000-000-000-000"
                      value={state.tin}
                      onChange={(event) => updateField("tin", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>SSS Number</span>
                    <input
                      className={inputClass(false)}
                      placeholder="00-0000000-0"
                      value={state.sssNo}
                      onChange={(event) => updateField("sssNo", event.target.value)}
                    />
                  </label>
                </div>
                <div className="add-employee-grid two">
                  <label>
                    <span>PhilHealth Number</span>
                    <input
                      className={inputClass(false)}
                      placeholder="00-000000000-0"
                      value={state.philhealthNo}
                      onChange={(event) =>
                        updateField("philhealthNo", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <span>Pag-IBIG Number</span>
                    <input
                      className={inputClass(false)}
                      placeholder="0000-0000-0000"
                      value={state.pagibigNo}
                      onChange={(event) => updateField("pagibigNo", event.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="add-employee-summary">
                <h4>Submission Summary</h4>
                <p>
                  {state.firstName || "First"} {state.lastName || "Last"} will be added to{" "}
                  {departments.find((department) => department.id === state.departmentId)
                    ?.name || "selected department"}{" "}
                  as{" "}
                  {positions.find((position) => position.id === state.positionId)?.title ||
                    "selected position"}
                  .
                </p>
              </section>
            </div>
          ) : null}

          <footer className="add-employee-footer">
            <div className="add-employee-footer-left">
              <button
                type="button"
                className="button-secondary"
                onClick={saveDraft}
                disabled={isSaving}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={resetForm}
                disabled={isSaving}
              >
                Discard
              </button>
            </div>
            <div className="add-employee-footer-right">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={goBack}
                  disabled={isSaving}
                >
                  Back
                </button>
              ) : null}
              {stepIndex < steps.length - 1 ? (
                <button type="button" className="button" onClick={goNext} disabled={isSaving}>
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="button"
                  onClick={submitForm}
                  disabled={isSaving}
                >
                  {isSaving ? "Creating..." : "Create Employee"}
                </button>
              )}
            </div>
          </footer>
          {formMessage ? <p className="add-employee-message">{formMessage}</p> : null}
        </main>
      </div>
    </section>
  );
}
