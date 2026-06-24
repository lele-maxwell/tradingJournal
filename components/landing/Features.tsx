"use client";

import { useTranslations } from "next-intl";

type FeatureKey = {
  titleKey: "strategyValidationTitle" | "mentalPerformanceTitle" | "advancedAnalyticsTitle" | "visualArchiveTitle";
  descKey: "strategyValidationDesc" | "mentalPerformanceDesc" | "advancedAnalyticsDesc" | "visualArchiveDesc";
  icon: string;
};

export function Features() {
  const t = useTranslations("landing.features");

  const features: FeatureKey[] = [
    { titleKey: "strategyValidationTitle", descKey: "strategyValidationDesc", icon: "📊" },
    { titleKey: "mentalPerformanceTitle", descKey: "mentalPerformanceDesc", icon: "🧠" },
    { titleKey: "advancedAnalyticsTitle", descKey: "advancedAnalyticsDesc", icon: "📈" },
    { titleKey: "visualArchiveTitle", descKey: "visualArchiveDesc", icon: "📁" },
  ];

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t("badge")}</span>
          <h2 className="section-title">{t("title")}</h2>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div key={f.titleKey} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{t(f.titleKey)}</h3>
              <p className="feature-desc">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .features-section {
          padding: 100px 0;
          background: var(--bg-base);
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-header { text-align: center; margin-bottom: 60px; }
        .section-badge { color: var(--accent); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
        .section-title { font-size: 40px; font-weight: 800; color: white; margin-top: 8px; }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }
        .feature-card {
          padding: 32px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .feature-card:hover {
          border-color: var(--accent);
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .feature-icon { font-size: 32px; margin-bottom: 20px; }
        .feature-title { font-size: 20px; font-weight: 700; color: white; margin-bottom: 12px; }
        .feature-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.6; }
      `}</style>
    </section>
  );
}
