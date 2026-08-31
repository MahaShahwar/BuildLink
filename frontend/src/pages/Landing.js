import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const [costInput, setCostInput] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);

  const handleEstimate = async () => {
    if (!costInput.trim()) return;
    setEstimating(true);
    try {
      const res = await fetch('http://localhost:5000/api/projects/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: costInput, city: 'lahore' }),
      });
      const data = await res.json();
      if (data.success) setEstimate(data);
    } catch {
      // API not available — show demo estimate
      setEstimate({
        parsedRequirements: { structureType: 'residential', floors: 2, bedrooms: 3, style: 'modern' },
        estimate: { min: 8500000, max: 12500000, currency: 'PKR', confidence: 0.75, breakdown: { materials: 5500000, labor: 2500000, design: 800000, permits: 200000, contingency: 1000000 } },
      });
    }
    setEstimating(false);
  };

  const formatPKR = (n) => new Intl.NumberFormat('en-PK').format(n);

  return (
    <div className="landing">
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__grid"></div>
          <div className="hero__glow hero__glow--1"></div>
          <div className="hero__glow hero__glow--2"></div>
          <div className="hero__glow hero__glow--3"></div>
        </div>

        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot"></span>
            AI-Powered Construction Ecosystem
          </div>

          <h1 className="hero__title">
            Build Your Dream Home<br />
            with <span className="hero__title-gradient">Intelligent Precision</span>
          </h1>

          <p className="hero__subtitle">
            From NLP-powered instant cost estimates to ML-matched AutoCAD engineers
            and smart-vetted construction bids — BuildLink automates every step of
            residential house building.
          </p>

          <div className="hero__actions">
            <Link to="/signup/engineer" className="btn btn--primary btn--lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Join as Engineer
            </Link>
            <Link to="/signup/customer" className="btn btn--glass btn--lg">
              Start Your Project
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <span className="hero__stat-number">2,500+</span>
              <span className="hero__stat-label">Verified Engineers</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <span className="hero__stat-number">850+</span>
              <span className="hero__stat-label">Projects Completed</span>
            </div>
            <div className="hero__stat-divider"></div>
            <div className="hero__stat">
              <span className="hero__stat-number">98%</span>
              <span className="hero__stat-label">Client Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* NLP COST ESTIMATOR */}
      <section className="estimator" id="features">
        <div className="estimator__container">
          <div className="section-label">AI Cost Estimation</div>
          <h2 className="section-title">Describe Your Project,<br />Get Instant Estimates</h2>
          <p className="section-desc">Powered by Google Gemini AI — describe your project in plain language and get intelligent, localized cost breakdowns in seconds.</p>

          <div className="estimator__box">
            <div className="estimator__input-wrap">
              <textarea
                className="estimator__input"
                placeholder="e.g. I want to build a 2-story modern house with 4 bedrooms, 3 bathrooms on a 10 marla plot in Lahore with a basement and rooftop terrace..."
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                rows={3}
              />
              <button className="btn btn--primary estimator__btn" onClick={handleEstimate} disabled={estimating}>
                {estimating ? 'Analyzing...' : '✨ Get AI Estimate'}
              </button>
            </div>

            {estimate && (
              <div className="estimator__result">
                <div className="estimator__result-header">
                  <h3>
                    {estimate.aiPowered ? '🤖 Gemini AI Estimate' : '📊 Cost Estimate'}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {estimate.aiPowered && <span className="tag tag--accent">✨ AI Powered</span>}
                    <span className="estimator__confidence">
                      {Math.round((estimate.estimate.confidence || 0.75) * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="estimator__range">
                  <span className="estimator__range-label">Estimated Range</span>
                  <span className="estimator__range-value">
                    PKR {formatPKR(estimate.estimate.min)} — {formatPKR(estimate.estimate.max)}
                  </span>
                </div>
                <div className="estimator__breakdown">
                  {Object.entries(estimate.estimate.breakdown).map(([key, val]) => (
                    <div key={key} className="estimator__breakdown-item">
                      <span className="estimator__breakdown-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <span className="estimator__breakdown-value">PKR {formatPKR(val)}</span>
                      <div className="estimator__breakdown-bar">
                        <div
                          className="estimator__breakdown-fill"
                          style={{ width: `${(val / estimate.estimate.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Parsed Requirements */}
                <div className="estimator__parsed">
                  <span className="estimator__parsed-title">🧠 AI Parsed:</span>
                  {estimate.parsedRequirements.structureType && <span className="tag">🏠 {estimate.parsedRequirements.structureType}</span>}
                  {estimate.parsedRequirements.floors && <span className="tag">🏢 {estimate.parsedRequirements.floors} floors</span>}
                  {estimate.parsedRequirements.bedrooms && <span className="tag">🛏️ {estimate.parsedRequirements.bedrooms} beds</span>}
                  {estimate.parsedRequirements.bathrooms && <span className="tag">🚿 {estimate.parsedRequirements.bathrooms} baths</span>}
                  {estimate.parsedRequirements.style && <span className="tag">✨ {estimate.parsedRequirements.style}</span>}
                  {estimate.parsedRequirements.plotSize && <span className="tag">📏 {estimate.parsedRequirements.plotSize.value} {estimate.parsedRequirements.plotSize.unit}</span>}
                  {estimate.parsedRequirements.specialFeatures?.map(f => <span key={f} className="tag tag--accent">⭐ {f}</span>)}
                </div>

                {/* AI Timeline */}
                {estimate.estimatedTimeline && (
                  <div className="estimator__timeline">
                    <span className="estimator__parsed-title">⏱️ Estimated Timeline:</span>
                    <div className="estimator__timeline-items">
                      {estimate.estimatedTimeline.designWeeks && <span className="tag">📐 Design: {estimate.estimatedTimeline.designWeeks} weeks</span>}
                      {estimate.estimatedTimeline.constructionMonths && <span className="tag">🏗️ Construction: {estimate.estimatedTimeline.constructionMonths} months</span>}
                      {estimate.estimatedTimeline.totalMonths && <span className="tag tag--accent">📅 Total: {estimate.estimatedTimeline.totalMonths} months</span>}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {estimate.recommendations && estimate.recommendations.length > 0 && (
                  <div className="estimator__recommendations">
                    <span className="estimator__parsed-title">💡 AI Recommendations:</span>
                    <ul className="estimator__rec-list">
                      {estimate.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Assumptions */}
                {estimate.estimate.assumptions && (
                  <div className="estimator__assumptions">
                    <span className="estimator__parsed-title">📝 Assumptions:</span>
                    <p>{estimate.estimate.assumptions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works__container">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Three Steps to Your Dream Build</h2>

          <div className="steps">
            {[
              {
                num: '01',
                icon: '🧠',
                title: 'Describe & Estimate',
                desc: 'Tell us about your project in plain language. Our NLP engine instantly parses requirements and generates localized cost estimates.',
                color: '#3b82f6',
              },
              {
                num: '02',
                icon: '🎯',
                title: 'AI-Matched Engineers',
                desc: 'Our ML algorithm scores and ranks verified AutoCAD civil engineers based on specialization, location, rating, and project fit.',
                color: '#10b981',
              },
              {
                num: '03',
                icon: '🏗️',
                title: 'Smart Construction Bids',
                desc: 'Receive vetted construction bids with AI-scored pricing, timeline realism, and contractor performance — then build with confidence.',
                color: '#f97316',
              },
            ].map((step) => (
              <div key={step.num} className="step-card" style={{ '--step-color': step.color }}>
                <div className="step-card__number">{step.num}</div>
                <div className="step-card__icon">{step.icon}</div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="features">
        <div className="features__container">
          <div className="section-label">Platform Features</div>
          <h2 className="section-title">Everything You Need to Build</h2>

          <div className="features__grid">
            {[
              { icon: '📐', title: 'AutoCAD Integration', desc: 'Engineers upload CAD drawings, 3D renders, and revision-tracked design files.' },
              { icon: '💰', title: 'Escrow Payments', desc: 'Milestone-based escrow protects both parties. Funds release only on approval.' },
              { icon: '⚡', title: 'Real-Time Matching', desc: 'ML-powered matching connects you with the best-fit engineer in seconds.' },
              { icon: '📊', title: 'NLP Cost Engine', desc: 'Natural language descriptions parsed into accurate, localized cost breakdowns.' },
              { icon: '🔒', title: 'Verified Professionals', desc: 'License verification, KYC checks, and credential validation before activation.' },
              { icon: '💬', title: 'Project Workspace', desc: 'Built-in chat, file sharing, version history, and milestone tracking.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta__container">
          <div className="cta__card">
            <div className="cta__glow"></div>
            <h2 className="cta__title">Ready to Build Smarter?</h2>
            <p className="cta__desc">Join thousands of engineers and homeowners using AI to streamline construction.</p>
            <div className="cta__actions">
              <Link to="/signup/engineer" className="btn btn--primary btn--lg">Join as Engineer</Link>
              <Link to="/signup/customer" className="btn btn--white btn--lg">Start a Project</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__brand">
            <span className="navbar__logo-text">Build<span className="navbar__logo-highlight">Link</span></span>
            <p className="footer__tagline">AI-driven digital ecosystem for residential construction.</p>
          </div>
          <div className="footer__bottom">
            <span>© 2026 BuildLink. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
