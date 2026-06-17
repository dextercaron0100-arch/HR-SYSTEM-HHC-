"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const externalApiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const localhostFallbackApiBaseUrl = "http://localhost:3001";
const internalAuthEndpoint = "/api/auth/login";
const authCookieName = "hr_session";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.lp-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #0d2b23 0%, #1a4a3a 40%, #205c4a 70%, #0d2b23 100%);
  font-family: "Inter", "Segoe UI Variable", "Segoe UI", sans-serif;
  position: relative;
  overflow: hidden;
}

/* Subtle background decoration */
.lp-root::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 20% 50%, rgba(31,142,125,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 30%, rgba(31,142,125,0.12) 0%, transparent 65%);
  pointer-events: none;
}

.lp-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

/* Card */
.lp-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,0.97);
  border-radius: 24px;
  padding: 44px 40px 40px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.12),
    0 24px 64px rgba(0,0,0,0.35),
    0 4px 16px rgba(0,0,0,0.15);
  animation: lp-rise 420ms cubic-bezier(0.22,1,0.36,1) both;
}

@keyframes lp-rise {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

/* Logo mark */
.lp-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.lp-logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e7a67 0%, #2ab49a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(30,122,103,0.35);
}

.lp-logo-mark svg {
  width: 22px;
  height: 22px;
  stroke: #fff;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.lp-logo-text strong {
  display: block;
  font-size: 0.88rem;
  font-weight: 700;
  color: #17322c;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.lp-logo-text span {
  display: block;
  font-size: 0.72rem;
  font-weight: 400;
  color: #6d867e;
  letter-spacing: 0.02em;
  margin-top: 1px;
}

/* Heading */
.lp-heading {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f2920;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 6px;
}

.lp-sub {
  font-size: 0.875rem;
  color: #5f7a71;
  line-height: 1.5;
  margin-bottom: 28px;
}

/* Status dot */
.lp-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1f8e7d;
  margin-bottom: 28px;
}

.lp-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2ab49a;
  box-shadow: 0 0 0 2px rgba(42,180,154,0.25);
}

.lp-status-dot.offline {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.25);
}

/* Divider */
.lp-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2ece8, transparent);
  margin-bottom: 24px;
}

/* Form fields */
.lp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.lp-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4f6c63;
}

.lp-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.lp-input-icon {
  position: absolute;
  left: 14px;
  width: 16px;
  height: 16px;
  stroke: #8fa89f;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
  transition: stroke 150ms ease;
}

.lp-input {
  width: 100%;
  height: 48px;
  padding: 0 14px 0 42px;
  background: #f4f8f6;
  border: 1.5px solid #dce8e3;
  border-radius: 12px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #17322c;
  outline: none;
  transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;
}

.lp-input::placeholder { color: #a4bdb5; }

.lp-input:focus {
  border-color: #1f8e7d;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(31,142,125,0.12);
}

.lp-input:focus + .lp-input-focus-icon,
.lp-input-wrap:focus-within .lp-input-icon {
  stroke: #1f8e7d;
}

.lp-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Error */
.lp-error {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 20px;
  font-size: 0.82rem;
  color: #b91c1c;
  padding: 0 2px;
  margin-top: -6px;
  margin-bottom: 4px;
}

.lp-error svg {
  width: 14px;
  height: 14px;
  stroke: #b91c1c;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  flex-shrink: 0;
}

/* Submit button */
.lp-submit {
  width: 100%;
  height: 50px;
  margin-top: 8px;
  background: linear-gradient(135deg, #1a6e5d 0%, #1e7a67 50%, #22917a 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.02em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  box-shadow: 0 4px 14px rgba(30,122,103,0.4), 0 1px 3px rgba(0,0,0,0.1);
}

.lp-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(30,122,103,0.45), 0 2px 6px rgba(0,0,0,0.12);
}

.lp-submit:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
  box-shadow: 0 2px 8px rgba(30,122,103,0.35);
}

.lp-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Spinner */
.lp-spinner {
  width: 17px;
  height: 17px;
  border: 2.5px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: lp-spin 600ms linear infinite;
}

@keyframes lp-spin { to { transform: rotate(360deg); } }

/* Footer */
.lp-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #edf3f1;
  text-align: center;
  font-size: 0.75rem;
  color: #8fa89f;
  letter-spacing: 0.01em;
}

/* Responsive */
@media (max-width: 480px) {
  .lp-card {
    padding: 32px 24px 28px;
    border-radius: 20px;
  }
  .lp-heading { font-size: 1.4rem; }
}

@media (prefers-reduced-motion: reduce) {
  .lp-card { animation: none; }
  .lp-spinner { animation-duration: 1200ms; }
}
`;

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  const target = `${name}=`;
  const found = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(target));
  if (!found) return "";
  return decodeURIComponent(found.slice(target.length));
}

function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${authCookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=43200; SameSite=Lax${secureFlag}`;
}

function setRoleCookie(role: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `hr_role=${encodeURIComponent(role)}; Path=/; Max-Age=43200; SameSite=Lax${secureFlag}`;
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
  const [networkReady, setNetworkReady] = useState(true);
  const [resolvedApiBaseUrl, setResolvedApiBaseUrl] = useState(normalizeApiBaseUrl(externalApiBaseUrl));

  useEffect(() => {
    router.prefetch("/dashboard");
    if (getCookieValue(authCookieName)) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const checkHealth = async () => {
      // Internal auth always works — mark ready immediately
      setNetworkReady(true);

      // Optionally try to resolve the external backend for future API calls
      const configured = normalizeApiBaseUrl(externalApiBaseUrl);
      const fallback = normalizeApiBaseUrl(localhostFallbackApiBaseUrl);
      const isLocalHost = typeof window !== "undefined" && window.location.hostname === "localhost";
      const candidates = configured === fallback || !isLocalHost ? [configured] : [configured, fallback];

      for (const candidate of candidates) {
        try {
          const response = await fetch(`${candidate}/api/health`, { cache: "no-store" });
          if (response.ok) {
            setResolvedApiBaseUrl(candidate);
            return;
          }
        } catch {
          // external backend unavailable — internal auth still works
        }
      }
    };

    void checkHealth();
    const timer = window.setInterval(() => void checkHealth(), 30000);
    return () => window.clearInterval(timer);
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
      // Try internal auth first; fall back to external backend if available
      let response = await fetch(internalAuthEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeCode: employeeCode.trim(), password })
      });

      // If internal says not found, try external backend as fallback
      if (!response.ok && response.status === 401) {
        try {
          const externalResponse = await fetch(`${resolvedApiBaseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeCode: employeeCode.trim(), password })
          });
          if (externalResponse.ok) {
            response = externalResponse;
          }
        } catch {
          // external unavailable, keep internal response
        }
      }

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
          // keep fallback
        }
        setError(message);
        setPassword("");
        return;
      }

      const payload = (await response.json()) as {
        accessToken?: string;
        user?: { role?: string; firstName?: string; lastName?: string; employeeCode?: string };
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
      setRoleCookie(payload.user?.role ?? "employee");
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
      <div className="lp-root">
        <div className="lp-grid-bg" aria-hidden="true" />

        <div className="lp-card">
          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4.2 6.2 9.1 11" />
                <path d="M9.1 6.2 4.2 11" />
                <path d="M10.2 12.1 15.1 17" />
                <path d="M15.1 12.1 10.2 17" />
                <path d="M14.9 7.2h5.2" />
                <path d="M17.5 4.6v5.2" />
                <path d="M3.8 16.4h5.2" />
                <path d="M6.4 13.8V19" />
              </svg>
            </div>
            <div className="lp-logo-text">
              <strong>HHC HUB MANAGEMENT</strong>
              <span>HR Command Center</span>
            </div>
          </div>

          {/* API status */}
          <div className="lp-status">
            <span className={`lp-status-dot ${networkReady ? "" : "offline"}`} />
            {networkReady ? "System Online" : "Connecting…"}
          </div>

          <div className="lp-divider" />

          {/* Heading */}
          <h1 className="lp-heading">Welcome back</h1>
          <p className="lp-sub">Sign in with your employee code to continue.</p>

          {/* Employee Code */}
          <label className="lp-field">
            <span className="lp-label">Employee Code</span>
            <div className="lp-input-wrap">
              <svg className="lp-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                <circle cx="12" cy="13" r="1.5" />
              </svg>
              <input
                ref={codeRef}
                className="lp-input"
                type="text"
                autoComplete="off"
                value={employeeCode}
                onChange={(e) => { setEmployeeCode(e.target.value); setError(""); }}
                placeholder="e.g. HR-2026-001"
                disabled={isSubmitting}
                aria-label="Employee Code"
              />
            </div>
          </label>

          {/* Password */}
          <label className="lp-field">
            <span className="lp-label">Password</span>
            <div className="lp-input-wrap">
              <svg className="lp-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <circle cx="12" cy="16" r="1" />
              </svg>
              <input
                className="lp-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                disabled={isSubmitting}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleLogin(); } }}
                aria-label="Password"
              />
            </div>
          </label>

          {/* Error */}
          {error ? (
            <p className="lp-error" role="alert">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </p>
          ) : (
            <div style={{ minHeight: "20px", marginTop: "-6px", marginBottom: "4px" }} />
          )}

          {/* Submit */}
          <button
            type="button"
            className="lp-submit"
            onClick={() => void handleLogin()}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="lp-spinner" aria-hidden="true" /> : null}
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

          {/* Footer */}
          <p className="lp-footer">Powered by Herrera Technologies</p>
        </div>
      </div>
    </>
  );
}
