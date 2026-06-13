import "./globals.css";

export const metadata = {
  title: "HR System for Company Operations",
  description: "Centralized HR platform for employee records, attendance, leave, payroll, and approvals."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
