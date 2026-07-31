"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction, type AuthState } from "@/lib/actions/auth.actions";

const initialState: AuthState = {};

export default function SecuritySettingsPage() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        Security Settings
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>
        Manage your password and account security
      </p>

      {/* Password Update Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          Change Password
        </h2>

        {state.success && (
          <div
            style={{
              background: "var(--success-muted)",
              border: "1px solid var(--success)",
              borderRadius: 7,
              padding: "10px 12px",
              fontSize: 13,
              color: "var(--success)",
              marginBottom: 16,
            }}
          >
            Password updated successfully!
          </div>
        )}

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter current password"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Min. 8 characters"
              className="input"
              minLength={8}
            />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Must be at least 8 characters with one uppercase and one number
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repeat new password"
              className="input"
            />
          </div>

          {state.error && (
            <div
              style={{
                background: "var(--danger-muted)",
                border: "1px solid var(--danger)",
                borderRadius: 7,
                padding: "10px 12px",
                fontSize: 13,
                color: "var(--danger)",
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
            style={{ width: "fit-content" }}
          >
            {pending ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                Updating…
              </span>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>

      {/* Two-Factor Auth Info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Two-Factor Authentication
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Add an extra layer of security to your account by enabling two-factor authentication.
          This feature is coming soon.
        </p>
        <button
          disabled
          className="btn"
          style={{
            marginTop: 16,
            opacity: 0.5,
            cursor: "not-allowed",
          }}
        >
          Coming Soon
        </button>
      </div>

      {/* Session Management */}
      <div className="card">
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Active Sessions
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          You can manage your active sessions from your account settings. Sign out of other
          devices if you suspect unauthorized access.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        label {
          display: block;
          font-size: 13;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 24px;
        }
      `}</style>
    </div>
  );
}