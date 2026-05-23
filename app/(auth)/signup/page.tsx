"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthState } from "@/lib/actions/auth.actions";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              margin: "0 auto 16px",
            }}
          >
            E
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            Start journaling
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Create your MaxStrat account
          </p>
        </div>

        {/* Success state */}
        {state.success ? (
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              Check your email
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              We sent a confirmation link to your email address. Click it to
              activate your account.
            </p>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ display: "inline-flex", marginTop: 20 }}
            >
              Back to login
            </Link>
          </div>
        ) : (
          <div className="card">
            <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Min. 6 characters"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Repeat password"
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
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: 4 }}
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
                    Creating account…
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
