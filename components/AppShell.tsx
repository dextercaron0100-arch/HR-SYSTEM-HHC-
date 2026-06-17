"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavIconName =
  | "dashboard"
  | "employees"
  | "attendance"
  | "performance"
  | "leave"
  | "payroll"
  | "recruitment"
  | "onboarding"
  | "documents"
  | "reports"
  | "roles";

type RoleName = "super_admin" | "hr_admin" | "finance" | "manager" | "employee";

const allNavigation: Array<{ href: string; label: string; icon: NavIconName; roles: RoleName[] }> = [
  { href: "/dashboard",   label: "Dashboard",        icon: "dashboard",   roles: ["super_admin", "hr_admin", "finance", "manager", "employee"] },
  { href: "/employees",   label: "Employee Records", icon: "employees",   roles: ["super_admin", "hr_admin", "finance", "manager"] },
  { href: "/attendance",  label: "Attendance",       icon: "attendance",  roles: ["super_admin", "hr_admin", "manager", "employee"] },
  { href: "/performance", label: "Performance",      icon: "performance", roles: ["super_admin", "hr_admin", "manager", "employee"] },
  { href: "/leave",       label: "Leave Management", icon: "leave",       roles: ["super_admin", "hr_admin", "manager", "employee"] },
  { href: "/payroll",     label: "Payroll",          icon: "payroll",     roles: ["super_admin", "finance"] },
  { href: "/recruitment", label: "Recruitment",      icon: "recruitment", roles: ["super_admin", "hr_admin"] },
  { href: "/onboarding",  label: "Onboarding",       icon: "onboarding",  roles: ["super_admin", "hr_admin"] },
  { href: "/documents",   label: "Documents",        icon: "documents",   roles: ["super_admin", "hr_admin"] },
  { href: "/reports",     label: "Reports",          icon: "reports",     roles: ["super_admin", "hr_admin", "finance", "manager"] },
  { href: "/settings",    label: "Roles & Access",   icon: "roles",       roles: ["super_admin", "hr_admin"] }
];

function getNavigation(role: RoleName) {
  return allNavigation.filter((item) => item.roles.includes(role));
}

const labels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Employee Records",
  "/attendance": "Attendance",
  "/performance": "Performance",
  "/leave": "Leave Management",
  "/payroll": "Payroll",
  "/recruitment": "Recruitment",
  "/onboarding": "Onboarding",
  "/documents": "Documents",
  "/reports": "Reports",
  "/settings": "Roles & Access"
};

type TopbarNotification = {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  body: string;
  isRead: boolean;
  status: string;
  createdAt: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const notificationsEndpoint = `${apiBaseUrl}/api/notifications`;

const formatNotificationTime = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.8 1.8 0 0 1 0 2.6 1.8 1.8 0 0 1-2.6 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.9 1.9 0 0 1-3.8 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.8 1.8 0 0 1-2.6 0 1.8 1.8 0 0 1 0-2.6l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.9 1.9 0 0 1 0-3.8h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.8 1.8 0 0 1 0-2.6 1.8 1.8 0 0 1 2.6 0l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .5-.9V4a1.9 1.9 0 1 1 3.8 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.8 1.8 0 0 1 2.6 0 1.8 1.8 0 0 1 0 2.6l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.5H20a1.9 1.9 0 0 1 0 3.8h-.2a1 1 0 0 0-.9.6Z" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 17H5.8a1 1 0 0 1-.8-1.6l1.2-1.6V10a5.8 5.8 0 0 1 11.6 0v3.8l1.2 1.6a1 1 0 0 1-.8 1.6H18" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
      <path d="M12 3.2V5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function BrandLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.2 6.2 9.1 11" />
      <path d="M9.1 6.2 4.2 11" />
      <path d="M10.2 12.1 15.1 17" />
      <path d="M15.1 12.1 10.2 17" />
      <path d="M14.9 7.2h5.2" />
      <path d="M17.5 4.6v5.2" />
      <path d="M3.8 16.4h5.2" />
      <path d="M6.4 13.8V19" />
    </svg>
  );
}

function SidebarNavIcon({ name }: { name: NavIconName }) {
  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="6.7" height="6.7" rx="1.5" />
          <rect x="13.3" y="4" width="6.7" height="6.7" rx="1.5" />
          <rect x="4" y="13.3" width="6.7" height="6.7" rx="1.5" />
          <rect x="13.3" y="13.3" width="6.7" height="6.7" rx="1.5" />
        </svg>
      );
    case "employees":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2.4" />
          <circle cx="9" cy="10" r="2.2" />
          <path d="M6.8 16.2c.5-1.5 1.7-2.4 3.2-2.4s2.7.9 3.2 2.4" />
          <path d="M14.7 9.2h3.3M14.7 12h3.3M14.7 14.8h2.1" />
        </svg>
      );
    case "attendance":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.2" y="5.2" width="15.6" height="14.8" rx="2.2" />
          <path d="M8 3.9v2.6M16 3.9v2.6M4.2 9.2h15.6" />
          <path d="M9.3 13.2h5.4M9.3 16.1h3.2" />
        </svg>
      );
    case "performance":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 18V7.2M4.5 18h14.8" />
          <path d="M8.5 15.4 11.2 12.5l2.4 2.1 4.8-5.2" />
          <path d="M16.8 9.4h1.6V11" />
        </svg>
      );
    case "leave":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.8v3.4M16 3.8v3.4M4 9.8h16" />
        </svg>
      );
    case "payroll":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.8" y="6.3" width="16.4" height="11.4" rx="2.3" />
          <circle cx="12" cy="12" r="2.4" />
          <path d="M6.8 12h.1M17.1 12h.1" />
        </svg>
      );
    case "recruitment":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10" cy="10" r="3.2" />
          <path d="M4.8 17.2c.8-2.6 2.7-4.1 5.2-4.1 1.3 0 2.5.4 3.5 1.2" />
          <circle cx="16.8" cy="16.8" r="2.6" />
          <path d="M18.7 18.7 21 21" />
        </svg>
      );
    case "onboarding":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5.2" y="4.1" width="13.6" height="15.8" rx="2.2" />
          <path d="M9.2 8.8h5.6M9.2 12.2h5.6M9.2 15.6h3.7" />
          <path d="M15.8 4.1v4.3h3" />
        </svg>
      );
    case "documents":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h7l4 4v12H7z" />
          <path d="M14 4v4h4M9.5 12h5M9.5 15h5" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 19V10M11.5 19V6.4M18 19v-5.6" />
          <path d="M4 19h16M5.2 8.1l6.2-2.6 6.2 2.6" />
        </svg>
      );
    case "roles":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.8 18.2 6v5.2c0 4-2.5 6.9-6.2 9-3.7-2.1-6.2-5-6.2-9V6z" />
          <path d="M9.3 12.1 11 13.8l3.7-3.7" />
        </svg>
      );
    default:
      return null;
  }
}

type StoredUser = {
  role?: string;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
};

function readStoredUser(): StoredUser {
  try {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem("hr_user");
    if (!raw) return {};
    return JSON.parse(raw) as StoredUser;
  } catch {
    return {};
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "super_admin": return "Super Admin";
    case "hr_admin":    return "HR Admin";
    case "finance":     return "Finance";
    case "manager":     return "Manager";
    case "employee":    return "Employee";
    default:            return "HR";
  }
}

function getInitials(user: StoredUser): string {
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "HR";
}

export function AppShell({
  children,
  activePath
}: {
  children: React.ReactNode;
  activePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("");
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const hasLoadedNotifications = useRef(false);
  const [currentUser, setCurrentUser] = useState<StoredUser>({});

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await fetch(notificationsEndpoint, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load notifications: ${response.status}`);
      }
      const rows = (await response.json()) as TopbarNotification[];
      setNotifications(rows);
      hasLoadedNotifications.current = true;
    } catch {
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    setIsUpdatingNotifications(true);
    try {
      const response = await fetch(`${notificationsEndpoint}/${notificationId}/read`, {
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error(`Failed to update notification: ${response.status}`);
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true, status: "read" }
            : notification
        )
      );
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!unreadCount) {
      return;
    }

    setIsUpdatingNotifications(true);
    try {
      const response = await fetch(`${notificationsEndpoint}/read-all`, {
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error(`Failed to update notifications: ${response.status}`);
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          status: "read"
        }))
      );
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  useEffect(() => {
    setCurrentUser(readStoredUser());
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    setPendingPath("");
  }, [pathname]);

  useEffect(() => {
    if (isPanelOpen && !hasLoadedNotifications.current) {
      void loadNotifications();
    }
  }, [isPanelOpen]);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPanelOpen]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("hr_token");
      window.localStorage.removeItem("hr_user");
      const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `hr_session=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
      document.cookie = `hr_role=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
    }
    setIsPanelOpen(false);
    setPendingPath("/login");
    router.push("/login");
  };

  return (
    <div className={`shell ${isMobileNavOpen ? "mobile-nav-open" : ""}`}>
      <div
        className={`route-progress ${pendingPath ? "is-active" : ""}`}
        role="progressbar"
        aria-label="Loading page"
      />
      <aside className={`sidebar ${isMobileNavOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BrandLogoIcon />
          </div>
          <div>
            <strong>HHC HUB MANAGEMENT</strong>
            <span>Operations command center</span>
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {getNavigation((currentUser.role as RoleName) ?? "employee").map((item) => (
            <Link
              key={item.href}
              className="nav-item"
              href={item.href}
              aria-current={activePath === item.href ? "page" : undefined}
              data-pending={pendingPath === item.href ? "true" : undefined}
              onClick={() => {
                setIsMobileNavOpen(false);
                if (pathname !== item.href) {
                  setPendingPath(item.href);
                }
              }}
            >
              <span className="nav-icon" aria-hidden="true">
                <SidebarNavIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
              <span className="nav-arrow" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          Future Android apps can reuse the same REST API and shared contracts.
        </div>
      </aside>
      <button
        className="mobile-nav-backdrop"
        type="button"
        aria-label="Close navigation"
        onClick={() => setIsMobileNavOpen(false)}
      />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow eyebrow-soft">Workforce visibility</p>
            <h1>{labels[activePath] ?? "HR System"}</h1>
          </div>
          <label className="search">
            <span aria-hidden="true">Search</span>
            <input type="search" placeholder="Search anything" aria-label="Search anything" />
          </label>
          <div className="topbar-actions">
            <button
              className="icon-button mobile-nav-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((current) => !current)}
            >
              <MenuIcon />
            </button>
            <Link
              className="icon-button icon-link"
              href="/settings"
              aria-label="Settings"
              onClick={() => {
                if (pathname !== "/settings") {
                  setPendingPath("/settings");
                }
              }}
            >
              <SettingsIcon />
            </Link>
            <div className="notification-wrap" ref={panelRef}>
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                aria-expanded={isPanelOpen}
                onClick={() => setIsPanelOpen((current) => !current)}
              >
                <NotificationIcon />
                {unreadCount > 0 ? <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
              </button>
              {isPanelOpen ? (
                <section className="notification-panel" aria-label="Notifications panel">
                  <div className="notification-panel-head">
                    <strong>Notifications</strong>
                    <div className="notification-panel-actions">
                      <button
                        type="button"
                        className="notification-link"
                        onClick={() => void loadNotifications()}
                        disabled={isLoadingNotifications || isUpdatingNotifications}
                      >
                        Refresh
                      </button>
                      <button
                        type="button"
                        className="notification-link"
                        onClick={() => void markAllNotificationsRead()}
                        disabled={!unreadCount || isUpdatingNotifications}
                      >
                        Mark all read
                      </button>
                    </div>
                  </div>
                  <div className="notification-list">
                    {isLoadingNotifications ? <p className="notification-empty">Loading notifications...</p> : null}
                    {!isLoadingNotifications && notifications.length === 0 ? (
                      <p className="notification-empty">No notifications available.</p>
                    ) : null}
                    {!isLoadingNotifications
                      ? notifications.map((notification) => (
                          <article
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? "is-read" : "is-unread"}`}
                          >
                            <div className="notification-row">
                              <strong>{notification.title}</strong>
                              <span>{formatNotificationTime(notification.createdAt)}</span>
                            </div>
                            <p>{notification.body}</p>
                            <div className="notification-row">
                              <small>{notification.userEmail}</small>
                              <button
                                type="button"
                                className="notification-link"
                                onClick={() => void markNotificationRead(notification.id)}
                                disabled={notification.isRead || isUpdatingNotifications}
                              >
                                {notification.isRead ? "Read" : "Mark read"}
                              </button>
                            </div>
                          </article>
                        ))
                      : null}
                  </div>
                </section>
              ) : null}
            </div>
            <div className="profile-chip">
              <div className="avatar">{getInitials(currentUser)}</div>
              <div>
                <strong>{currentUser.firstName && currentUser.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : (currentUser.employeeCode ?? "User")}</strong>
                <span>{getRoleLabel(currentUser.role ?? "")}</span>
              </div>
            </div>
            <button
              type="button"
              className="button-secondary topbar-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>
        <div className="content-inner">{children}</div>
        <footer className="app-powered-footer">Powered By: Herrera Technologies</footer>
      </main>
    </div>
  );
}
