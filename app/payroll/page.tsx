export const dynamic = "force-dynamic";

import { AppShell } from "../../components/AppShell";
import { PayrollWorkspace } from "../../components/PayrollWorkspace";
import { apiGet } from "../../lib/api";

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

const fallbackPayroll: PayrollData = { periods: [], runs: [], payslips: [], adjustments: [] };

async function loadPayroll() {
  try {
    return await apiGet<PayrollData>("/payroll");
  } catch {
    return fallbackPayroll;
  }
}

export default async function PayrollPage() {
  const payroll = await loadPayroll();

  return (
    <AppShell activePath="/payroll">
      <PayrollWorkspace payroll={payroll} />
    </AppShell>
  );
}
