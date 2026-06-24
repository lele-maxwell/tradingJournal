"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/LanguageSelector";

const navItems = [
  {
    labelKey: "nav.dashboard",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    labelKey: "nav.newTrade",
    href: "/trades/new",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    labelKey: "nav.trades",
    href: "/trades",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 6h16M4 10h16M4 14h10M4 18h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    labelKey: "nav.reports",
    href: "/reports/weekly",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 16l4-5 4 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <Link href="/">
        <div
          style={{
            padding: "20px 16px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              M
            </div>
            <span
              style={{
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {t("common.appName")}<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/trades/new" &&
                item.href !== "/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 10px",
                  borderRadius: 7,
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-hover)" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "var(--bg-hover)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "var(--text-secondary)";
                  }
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>

        {/* Reports sub-nav */}
        {pathname.startsWith("/reports") && (
          <div
            style={{
              marginTop: 2,
              marginLeft: 16,
              paddingLeft: 12,
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {[
              { labelKey: "nav.weekly", href: "/reports/weekly" },
              { labelKey: "nav.monthly", href: "/reports/monthly" },
            ].map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                style={{
                  padding: "5px 8px",
                  fontSize: 12.5,
                  borderRadius: 5,
                  color:
                    pathname === sub.href
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  background:
                    pathname === sub.href ? "var(--accent-muted)" : "transparent",
                  textDecoration: "none",
                  fontWeight: pathname === sub.href ? 500 : 400,
                  transition: "all 0.12s",
                }}
              >
                {t(sub.labelKey)}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer: language selector + logout */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <LanguageSelector />
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start", gap: 9, fontSize: 13.5 }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}
