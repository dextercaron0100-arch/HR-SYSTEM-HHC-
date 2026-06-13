"use client";

import { useMemo, useState } from "react";

type DashboardCalendarProps = {
  activeDates: string[];
  initialMonthIso?: string;
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value: number) => String(value).padStart(2, "0");

const formatIso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIso = (value: string | undefined) => {
  if (!value) {
    return null;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

type CalendarCell = {
  date: Date;
  iso: string;
  day: number;
  inCurrentMonth: boolean;
  active: boolean;
  selected: boolean;
};

export function DashboardCalendar({
  activeDates,
  initialMonthIso = "2035-06-01"
}: DashboardCalendarProps) {
  const [viewDate, setViewDate] = useState(() => parseIso(initialMonthIso) ?? new Date(2035, 5, 1));
  const [selectedDateIso, setSelectedDateIso] = useState(() => {
    const firstActive = activeDates[0];
    return firstActive && parseIso(firstActive) ? firstActive : initialMonthIso;
  });

  const activeSet = useMemo(() => new Set(activeDates), [activeDates]);

  const cells = useMemo<CalendarCell[]>(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    const created: CalendarCell[] = [];

    for (let index = 0; index < 42; index += 1) {
      const offset = index - firstWeekday;
      let cellDate: Date;
      let day: number;
      let inCurrentMonth = true;

      if (offset < 0) {
        day = daysInPreviousMonth + offset + 1;
        cellDate = new Date(year, month - 1, day);
        inCurrentMonth = false;
      } else if (offset >= daysInCurrentMonth) {
        day = offset - daysInCurrentMonth + 1;
        cellDate = new Date(year, month + 1, day);
        inCurrentMonth = false;
      } else {
        day = offset + 1;
        cellDate = new Date(year, month, day);
      }

      const iso = formatIso(cellDate);

      created.push({
        date: cellDate,
        iso,
        day,
        inCurrentMonth,
        active: activeSet.has(iso),
        selected: iso === selectedDateIso
      });
    }

    return created;
  }, [activeSet, selectedDateIso, viewDate]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
      }).format(viewDate),
    [viewDate]
  );

  return (
    <article className="card dashboard-v2-calendar">
      <div className="section-title">
        <div>
          <h2>{monthLabel}</h2>
        </div>
        <div className="dashboard-v2-nav-btns">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() =>
              setViewDate((current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1)
              )
            }
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setViewDate((current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1)
              )
            }
          >
            ›
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {dayLabels.map((day) => (
          <span key={day} className="calendar-label">
            {day}
          </span>
        ))}
        {cells.map((cell) => (
          <button
            key={cell.iso}
            type="button"
            className={[
              "calendar-day",
              cell.active ? "active" : "",
              !cell.inCurrentMonth ? "muted" : "",
              cell.selected ? "selected" : ""
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              setSelectedDateIso(cell.iso);
              if (!cell.inCurrentMonth) {
                setViewDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
              }
            }}
          >
            {cell.day}
          </button>
        ))}
      </div>
    </article>
  );
}

