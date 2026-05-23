export function Methodology() {
  const steps = [
    { id: "01", label: "LOG_ENTRY", detail: "Capture setup, conviction, and mental state in real-time." },
    { id: "02", label: "VALIDATE_EDGE", detail: "Automated checklist ensures confluence with the MaxStrat edge." },
    { id: "03", label: "TRACK_EXECUTION", detail: "Screenshots and R/R tracking for precise post-trade review." },
    { id: "04", label: "MASTER_PSYCH", detail: "Identify emotional leaks and refine your discipline over time." }
  ];

  return (
    <section id="methodology" className="method-section">
      <div className="container">
        <div className="method-card">
          <div className="method-header">
            <div className="flex items-center gap-2">
              <div className="dot red" />
              <div className="dot yellow" />
              <div className="dot green" />
            </div>
            <span className="window-title">SYSTEM_METHODOLOGY.MD</span>
          </div>
          
          <div className="method-body">
            <div className="tree-explorer">
              <div className="folder">
                <span className="folder-icon">📂</span>
                <span className="folder-name">MAXSTRAT_CORE</span>
              </div>
              <div className="tree-lines">
                {steps.map((s, i) => (
                  <div key={i} className="tree-item">
                    <span className="step-id">{s.id}</span>
                    <span className="step-label">{s.label}</span>
                    <span className="step-dash">—</span>
                    <span className="step-detail">{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .method-section { padding: 80px 0; background: #050505; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        
        .method-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
        }
        .method-header {
          background: var(--bg-surface-2);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid var(--border);
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .window-title { font-size: 11px; font-family: var(--font-geist-mono); color: var(--text-muted); letter-spacing: 0.05em; }
        
        .method-body { padding: 40px; }
        .tree-explorer { font-family: var(--font-geist-mono); }
        .folder { display: flex; items-center; gap: 10px; margin-bottom: 20px; color: var(--accent); font-weight: 600; font-size: 14px; }
        .tree-lines { padding-left: 24px; border-left: 1px solid var(--border); margin-left: 10px; display: flex; flex-direction: column; gap: 24px; }
        
        .tree-item { position: relative; display: flex; align-items: baseline; gap: 12px; font-size: 14px; color: var(--text-secondary); }
        .tree-item::before { content: ""; position: absolute; left: -25px; top: 10px; width: 20px; height: 1px; background: var(--border); }
        
        .step-id { color: var(--accent); font-weight: 800; font-size: 12px; opacity: 0.6; }
        .step-label { color: white; font-weight: 700; min-width: 140px; }
        .step-dash { color: var(--text-disabled); }
        .step-detail { font-size: 13px; color: var(--text-muted); }

        @media (max-width: 768px) {
          .tree-item { flex-direction: column; gap: 4px; }
          .tree-item::before { display: none; }
          .tree-lines { border-left: none; padding-left: 0; }
        }
      `}</style>
    </section>
  );
}
