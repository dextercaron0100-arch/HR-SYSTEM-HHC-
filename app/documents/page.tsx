export const dynamic = "force-dynamic";

import { AppShell } from "../../components/AppShell";
import { apiGet } from "../../lib/api";

type DocumentRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
};

async function loadDocuments() {
  try {
    return await apiGet<DocumentRow[]>("/documents");
  } catch {
    return [];
  }
}

export default async function DocumentsPage() {
  const docs = await loadDocuments();
  const categories = ["Contracts", "Government IDs", "Disciplinary files", "Onboarding forms", "HR notices"];

  return (
    <AppShell activePath="/documents">
      <section className="hero">
        <div>
          <span className="eyebrow">Documents</span>
          <h1>Keep employee files, forms, and company notices organized.</h1>
          <p>Document storage supports uploads, approval context, and audit-ready file history.</p>
        </div>
      </section>

      <div className="card">
        <div className="section-title">
          <div>
            <h2>Document categories</h2>
            <p>Designed for secure access by role.</p>
          </div>
        </div>
        <div className="grid three-col">
          {categories.map((doc) => (
            <div key={doc} className="card" style={{ boxShadow: "none", background: "var(--surface-2)" }}>
              <strong>{doc}</strong>
              <div className="muted" style={{ marginTop: 8 }}>
                Store file URL, uploader, and timestamp.
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="section-title">
          <div>
            <h2>Latest uploads</h2>
            <p>Live file metadata from the backend.</p>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>File</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.employeeName || doc.employeeId || "Unassigned"}</td>
                <td>{doc.documentType}</td>
                <td>
                  <a href={doc.fileUrl} className="button-secondary">
                    {doc.fileName}
                  </a>
                </td>
                <td>{doc.uploadedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
