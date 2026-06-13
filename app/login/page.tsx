"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const localhostFallbackApiBaseUrl = "http://localhost:3001";
const authCookieName = "hr_session";

const css = `
.lp-wrap {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 520px);
  background: linear-gradient(180deg, #e9f4ef 0%, #dbeae3 100%);
  font-family: "Segoe UI Variable", "Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}
.lp-left {
  padding: 48px 56px;
  display: grid;
  align-content: center;
  gap: 20px;
  color: #17322c;
}
.lp-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(32, 92, 74, 0.16);
  background: rgba(255, 255, 255, 0.7);
  color: #1f8e7d;
  font-size: 0.82rem;
  font-weight: 700;
}
.lp-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1f8e7d;
}
.lp-left h1 {
  margin: 0;
  font-size: clamp(2rem, 3.4vw, 3.2rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}
.lp-left p {
  margin: 0;
  max-width: 52ch;
  color: #4f6c63;
  line-height: 1.65;
}
.lp-highlights {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}
.lp-highlights li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #47645c;
  font-size: 0.9rem;
}
.lp-highlights li::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ab49a;
}
.lp-right {
  border-left: 1px solid rgba(32, 92, 74, 0.12);
  background: rgba(255, 255, 255, 0.92);
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 40px 34px;
}
.lp-right h2 {
  margin: 0;
  font-size: 1.55rem;
  letter-spacing: -0.02em;
  color: #17322c;
}
.lp-sub {
  margin: 0 0 8px;
  color: #5f7a71;
  font-size: 0.9rem;
}
.lp-field {
  display: grid;
  gap: 6px;
}
.lp-label {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #6d867e;
  text-transform: uppercase;
}
.lp-input,
.lp-submit {
  min-height: 46px;
  border: 1px solid rgba(32, 92, 74, 0.16);
  border-radius: 12px;
}
.lp-input {
  background: #f2f8f4;
  color: #17322c;
  padding: 0 14px;
  outline: none;
}
.lp-input:focus {
  border-color: #1f8e7d;
}
.lp-error {
  margin: 2px 0 0;
  color: #b91c1c;
  font-size: 0.84rem;
  min-height: 18px;
}
.lp-submit {
  margin-top: 6px;
  background: #1e7a67;
  border-color: #1e7a67;
  color: #fff;
  font-weight: 700;
}
.lp-footer {
  margin-top: 10px;
  color: #6d867e;
  font-size: 0.8rem;
  text-align: center;
}
.lp-submit:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

@media (max-width: 920px) {
  .lp-wrap {
    grid-template-columns: 1fr;
  }
  .lp-left {
    padding: 30px 22px 14px;
  }
  .lp-right {
    border-left: 0;
    border-top: 1px solid rgba(32, 92, 74, 0.12);
    padding: 24px 18px 28px;
  }
}
`;

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return "";
  }
  const target = `${name}=`;
  const found = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(target));
  if (!found) {
    return "";
  }
  return decodeURIComponent(found.slice(target.length));
}

function setAuthCookie(token: string) {
  if (typeof document === "undefined") {
    return;
  }
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${authCookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=43200; SameSite=Lax${secureFlag}`;
}

function normalizeApiBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export default function LoginPage() {
  const router = useRouter();
  const codeRef = useRef<HTMLInputElement>(null);
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkReady, setNetworkReady] = useState(false);
  const [resolvedApiBaseUrl, setResolvedApiBaseUrl] = useState(normalizeApiBaseUrl(apiBaseUrl));

  useEffect(() => {
    if (getCookieValue(authCookieName)) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const checkHealth = async () => {
      const configured = normalizeApiBaseUrl(apiBaseUrl);
      const fallback = normalizeApiBaseUrl(localhostFallbackApiBaseUrl);
      const isLocalHost = typeof window !== "undefined" && window.location.hostname === "localhost";
      const candidates = configured === fallback || !isLocalHost ? [configured] : [configured, fallback];

      for (const candidate of candidates) {
        try {
          const response = await fetch(`${candidate}/api/health`, { cache: "no-store" });
          if (response.ok) {
            setResolvedApiBaseUrl(candidate);
            setNetworkReady(true);
            return;
          }
        } catch {
          // Try next candidate.
        }
      }

      setNetworkReady(false);
    };

    void checkHealth();
    const timer = window.setInterval(() => {
      void checkHealth();
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const handleLogin = async () => {
    if (!employeeCode.trim()) {
      setError("Please enter your employee code.");
      codeRef.current?.focus();
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`${resolvedApiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeCode: employeeCode.trim(), password })
      });

      if (!response.ok) {
        let message = "Invalid employee code or password.";
        try {
          const payload = (await response.json()) as { message?: string | string[] };
          if (Array.isArray(payload.message)) {
            message = payload.message[0] ?? message;
          } else if (payload.message) {
            message = payload.message;
          }
        } catch {
          // Keep fallback message when payload is not JSON.
        }
        setError(message);
        setPassword("");
        return;
      }

      const payload = (await response.json()) as {
        accessToken?: string;
        user?: unknown;
      };

      if (!payload.accessToken) {
        setError("Login failed: missing session token.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("hr_token", payload.accessToken);
        window.localStorage.setItem("hr_user", JSON.stringify(payload.user ?? {}));
      }
      setAuthCookie(payload.accessToken);
      router.push("/dashboard");
    } catch {
      setError("Unable to reach auth service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <section className="lp-wrap">
        <div className="lp-left">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            HR System Access
          </div>
          <h1>Welcome to HHC HR Command Center</h1>
          <p>
            Sign in with your employee code and password to manage attendance, leave,
            payroll, and daily HR operations.
          </p>
          <ul className="lp-highlights">
            <li>Attendance, payroll, and approvals in one workspace</li>
            <li>Role-based navigation and centralized employee records</li>
            <li>Built for desktop and mobile operations</li>
          </ul>
        </div>

        <div className="lp-right">
          <h2>Employee Login</h2>
          <p className="lp-sub">
            API: {networkReady ? "Online" : "Offline"} | {resolvedApiBaseUrl}
          </p>

          <label className="lp-field">
            <span className="lp-label">Employee Code</span>
            <input
              ref={codeRef}
              className="lp-input"
              type="text"
              autoComplete="off"
              value={employeeCode}
              onChange={(event) => {
                setEmployeeCode(event.target.value);
                setError("");
              }}
              placeholder="e.g. HR-2026-001"
              disabled={isSubmitting}
            />
          </label>

          <label className="lp-field">
            <span className="lp-label">Password</span>
            <input
              className="lp-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
              disabled={isSubmitting}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleLogin();
                }
              }}
            />
          </label>

          <p className="lp-error">{error}</p>

          <button type="button" className="lp-submit" onClick={() => void handleLogin()} disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          <p className="lp-footer">Powered By: Herrera Technologies</p>
        </div>
      </section>
    </>
  );
}
