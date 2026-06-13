"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Employee } from "@hr/contracts";

type AddAttendanceFormProps = {
  employees: Employee[];
};

export function AddAttendanceForm({ employees }: AddAttendanceFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [logType, setLogType] = useState("time_in");
  const [logDateTime, setLogDateTime] = useState("");
  const [remarks, setRemarks] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !logType || !logDateTime) {
      setFormMessage("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    setFormMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/attendance/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          logType,
          logDateTime: new Date(logDateTime).toISOString(),
          remarks: remarks || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance log");
      }

      router.push("/attendance");
      router.refresh();
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="add-employee-page">
      <header className="add-employee-head">
        <div className="add-employee-head-copy">
          <p className="breadcrumb">Dashboard / Attendance / Log Attendance</p>
          <h1>Log Attendance</h1>
        </div>
        <Link href="/attendance" className="add-employee-back">
          ← Back to Attendance
        </Link>
      </header>

      <div className="add-employee-layout" style={{ display: 'block' }}>
        <main className="card add-employee-main" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={submitForm}>
            <div className="add-employee-section">
              <section className="add-employee-block">
                <h3>Manual Attendance Entry</h3>
                {formMessage && (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--surface)', color: 'var(--warning)', borderRadius: '4px', marginBottom: '1rem' }}>
                    {formMessage}
                  </div>
                )}
                <div className="add-employee-grid two" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <label>
                    <span>Employee *</span>
                    <select
                      className="add-employee-input"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Log Type *</span>
                    <select
                      className="add-employee-input"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      required
                    >
                      <option value="time_in">Time In</option>
                      <option value="time_out">Time Out</option>
                      <option value="break_in">Break In</option>
                      <option value="break_out">Break Out</option>
                    </select>
                  </label>

                  <label>
                    <span>Date and Time *</span>
                    <input
                      type="datetime-local"
                      className="add-employee-input"
                      value={logDateTime}
                      onChange={(e) => setLogDateTime(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    <span>Remarks</span>
                    <input
                      type="text"
                      className="add-employee-input"
                      placeholder="Optional remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>
                </div>
              </section>
            </div>
            <div className="add-employee-step-foot" style={{ marginTop: '2rem' }}>
              <button type="submit" className="button" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Log"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </section>
  );
}
