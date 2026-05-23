"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-text">
            <div className="badge-wrapper">
              <span className="badge-premium">The Trader's Edge</span>
            </div>
            <h1 className="hero-title">
              Professional Discipline <br />
              <span className="text-gold-gradient">Systematized.</span>
            </h1>
            <p className="hero-desc">
              Log, analyze, and master your trading psychology with the premium 
              journaling system designed for the top 1%. Transform raw data into 
              consistent execution.
            </p>
            <div className="hero-ctas">
              <Link href="/signup" className="btn btn-primary btn-large">
                Open Your Journal
              </Link>
              <Link href="#features" className="btn btn-secondary btn-large">
                Explore Features
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="folder-container">
              <div className="folder-tab">
                <span className="tab-label">MAXSTRAT_V1.EXE</span>
              </div>
              <div className="folder-body">
                <div className="folder-content">
                  <div className="mock-ui">
                    <div className="mock-sidebar">
                      <div className="mock-item active" />
                      <div className="mock-item" />
                      <div className="mock-item" />
                    </div>
                    <div className="mock-main">
                      <div className="mock-header">
                        <div className="mock-title" />
                        <div className="mock-button" />
                      </div>
                      <div className="mock-chart">
                        <div className="mock-line" />
                      </div>
                      <div className="mock-grid">
                        <div className="mock-box" />
                        <div className="mock-box" />
                        <div className="mock-box" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Stacked background folders */}
              <div className="folder-stack stack-1" />
              <div className="folder-stack stack-2" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-section {
          padding-top: 160px;
          padding-bottom: 100px;
          overflow: hidden;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }
        .hero-title {
          font-size: 64px;
          font-weight: 850;
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
          color: white;
        }
        .text-gold-gradient {
          background: linear-gradient(135deg, #d4af37 0%, #f1c40f 50%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-desc {
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 540px;
          margin-bottom: 40px;
        }
        .badge-premium {
          display: inline-block;
          padding: 6px 12px;
          background: var(--accent-muted);
          border: 1px solid var(--accent);
          color: var(--accent);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }
        .hero-ctas {
          display: flex;
          gap: 16px;
        }
        .btn-large {
          padding: 14px 28px;
          font-size: 16px;
        }
        
        /* Folder Look UI */
        .folder-container {
          position: relative;
          width: 100%;
          min-height: 450px;
          perspective: 1000px;
        }
        .folder-tab {
          width: 160px;
          height: 36px;
          background: var(--bg-surface-2);
          border: 1px solid var(--border);
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          display: flex;
          align-items: center;
          padding: 0 16px;
          position: relative;
          z-index: 5;
        }
        .tab-label {
          font-size: 10px;
          font-family: var(--font-geist-mono);
          color: var(--accent);
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .folder-body {
          width: 100%;
          height: 400px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 0 16px 16px 16px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          position: relative;
          z-index: 4;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .folder-container:hover .folder-body {
          transform: translateY(-10px) rotateX(2deg);
        }
        .folder-stack {
          position: absolute;
          width: 96%;
          height: 380px;
          border: 1px solid var(--border);
          border-radius: 16px;
          z-index: 1;
          left: 2%;
        }
        .stack-1 { top: 20px; background: #0f0f0f; transform: translateY(20px); scale: 0.95; }
        .stack-2 { top: 40px; background: #0a0a0a; transform: translateY(40px); scale: 0.9; }

        .mock-ui {
          display: flex;
          height: 100%;
        }
        .mock-sidebar {
          width: 60px;
          background: var(--bg-surface-2);
          border-right: 1px solid var(--border);
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mock-item { width: 32px; height: 32px; background: var(--bg-hover); border-radius: 6px; }
        .mock-item.active { background: var(--accent); }
        
        .mock-main { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .mock-header { display: flex; justify-content: space-between; align-items: center; }
        .mock-title { width: 140px; height: 16px; background: var(--bg-hover); border-radius: 4px; }
        .mock-button { width: 80px; height: 32px; background: var(--accent); border-radius: 6px; opacity: 0.5; }
        .mock-chart { width: 100%; height: 160px; background: var(--bg-surface-2); border-radius: 12px; border: 1px dashed var(--border); position: relative; overflow: hidden; }
        .mock-line { position: absolute; top: 50%; left: 0; width: 200%; height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); animation: sweep 3s infinite linear; }
        .mock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .mock-box { height: 60px; background: var(--bg-surface-2); border-radius: 8px; }

        @keyframes sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .hero-desc { margin-left: auto; margin-right: auto; }
          .hero-ctas { justify-content: center; }
          .hero-title { font-size: 48px; }
        }
      `}</style>
    </section>
  );
}
