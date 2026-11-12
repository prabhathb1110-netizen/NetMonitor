import { useState } from 'react';

export default function LandingPage({ onOpenLogin, onQuickDemo }) {
  return (
    <div className="landing-page-wrap">
      {/* Top Navbar */}
      <header className="landing-navbar">
        <div className="landing-brand">
          <div className="brand-logo-ring"></div>
          <div className="brand-title-text">
            NetMonitor <span>Enterprise</span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#features" className="landing-nav-item">Core Capabilities</a>
          <a href="#architecture" className="landing-nav-item">Distributed Architecture</a>
          <a href="#specs" className="landing-nav-item">System Specs</a>
        </nav>

        <div className="landing-nav-actions">
          <button className="btn-secondary-outline" onClick={() => onQuickDemo('viewer')}>
            Viewer Demo
          </button>
          <button className="btn-glowing-primary" onClick={onOpenLogin}>
            Sign In ➔
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-top-badge">
          <span className="ticker-dot-beacon"></span>
          <span>Next-Generation Network Telemetry Platform · Java 21 & React</span>
        </div>

        <h1 className="landing-hero-heading">
          Unleash Real-Time <span>Distributed Telemetry</span> with Zero Latency
        </h1>

        <p className="landing-hero-subtitle">
          Small, lightweight Java agents deployed on each network segment continuously poll local devices
          using ICMP echo, multi-port TCP probes, and SNMP MIB-II, streaming instantaneous status,
          latency history, and automated alerts to a central live operations center.
        </p>

        <div className="landing-hero-cta">
          <button className="btn-glowing-primary btn-hero-lg" onClick={onOpenLogin}>
            Access Operations Console ⚡
          </button>
          <button className="btn-secondary-outline btn-hero-lg" onClick={() => onQuickDemo('admin')}>
            Instant Admin Demo (Bypass)
          </button>
        </div>

        {/* Floating KPI Teasers */}
        <div className="landing-kpi-banner">
          <div className="kpi-banner-item">
            <span className="kpi-banner-val val-orange">&lt; 5s</span>
            <span className="kpi-banner-lbl">Dashboard Event Push</span>
          </div>
          <div className="kpi-divider"></div>
          <div className="kpi-banner-item">
            <span className="kpi-banner-val val-green">100%</span>
            <span className="kpi-banner-lbl">Outbound TLS Poller Reach</span>
          </div>
          <div className="kpi-divider"></div>
          <div className="kpi-banner-item">
            <span className="kpi-banner-val val-orange">3600s</span>
            <span className="kpi-banner-lbl">Offline FIFO Buffer Guard</span>
          </div>
          <div className="kpi-divider"></div>
          <div className="kpi-banner-item">
            <span className="kpi-banner-val text-white">30 Days</span>
            <span className="kpi-banner-lbl">Telemetry History Retention</span>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid (FR1 - FR10) */}
      <section id="features" className="landing-features-section">
        <div className="section-title-wrapper">
          <span className="sonexo-chip">Comprehensive Capabilities</span>
          <h2 className="section-title-heading">Enterprise Feature Suite</h2>
          <p className="section-title-sub">
            Built from the ground up to solve visibility gaps across NAT boundaries, firewalls, and isolated subnets.
          </p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon-bubble">📡</div>
            <h3 className="feature-card-title">Distributed Multi-Segment Agents (FR6)</h3>
            <p className="feature-card-desc">
              Lightweight Java daemons open persistent outbound TLS connections to the central server,
              allowing full visibility into devices behind corporate NAT or firewalls without inbound hole-punching.
            </p>
            <div className="feature-tag">1-Hour Offline Buffer</div>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon-bubble">⚡</div>
            <h3 className="feature-card-title">Multi-Protocol Monitoring (FR3, FR4, FR5)</h3>
            <p className="feature-card-desc">
              Runs parallel ICMP ping for round-trip latency and packet loss, concurrent TCP port checks
              (HTTP, SSH, DNS, HTTPS), and standard SNMP MIB-II queries for live CPU and memory load.
            </p>
            <div className="feature-tag">ICMP · TCP · SNMP v2c</div>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon-bubble">🔍</div>
            <h3 className="feature-card-title">Automated Subnet Discovery (FR2)</h3>
            <p className="feature-card-desc">
              Executes high-speed parallel ping sweeps across CIDR subnet blocks (e.g. 192.168.1.0/24),
              identifying responsive hosts and enabling one-click registration into monitoring pollers.
            </p>
            <div className="feature-tag">CIDR Ping Sweep</div>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon-bubble">📊</div>
            <h3 className="feature-card-title">NOC Live Telemetry & Graphing (FR7)</h3>
            <p className="feature-card-desc">
              WebSocket-driven reactive dashboard streaming instantaneous state changes and Bezier-curved
              latency graphs with 1-hour, 6-hour, and 24-hour historical drill-down capabilities.
            </p>
            <div className="feature-tag">Sub-Second WebSocket Push</div>
          </div>

          {/* Card 5 */}
          <div className="feature-card">
            <div className="feature-icon-bubble">🚨</div>
            <h3 className="feature-card-title">Intelligent Incident Alerting (FR9)</h3>
            <p className="feature-card-desc">
              Configurable threshold evaluation triggers instant critical alarms on host failures, packet
              loss thresholds, or latency spikes, featuring an operator acknowledgement workflow.
            </p>
            <div className="feature-tag">Threshold Rules & Alarms</div>
          </div>

          {/* Card 6 */}
          <div className="feature-card">
            <div className="feature-icon-bubble">🛡️</div>
            <h3 className="feature-card-title">RBAC Security & SLA Reporting (FR8, FR10)</h3>
            <p className="feature-card-desc">
              Role-based access control distinguishing between Administrators and Viewers, paired with
              30-day historical data warehousing, SLA uptime percentages, and CSV dataset exports.
            </p>
            <div className="feature-tag">Admin/Viewer · CSV Export</div>
          </div>
        </div>
      </section>

      {/* Architecture Showcase */}
      <section id="architecture" className="landing-arch-section">
        <div className="arch-card-glass">
          <div className="arch-content-left">
            <span className="sonexo-chip">System Architecture</span>
            <h2 className="arch-heading">How Data Moves Across Your Infrastructure</h2>
            <ul className="arch-steps-list">
              <li>
                <strong>1. Outbound TLS Link:</strong> Java agents establish persistent outbound TLS sockets to port 9090 on the server.
              </li>
              <li>
                <strong>2. Thread-Pool Polling:</strong> Devices are polled concurrently so slow or offline endpoints never block healthy ones.
              </li>
              <li>
                <strong>3. Fault-Tolerant Buffering:</strong> If the central server is disconnected, agents store up to 3,600 seconds of telemetry locally in a FIFO queue.
              </li>
              <li>
                <strong>4. Live Broadcast:</strong> Spring Boot ingests metrics, evaluates alert triggers, and broadcasts delta updates over WebSockets.
              </li>
            </ul>
          </div>

          <div className="arch-visual-box">
            <div className="arch-node-badge">Central Spring Boot 3 Engine</div>
            <div className="arch-pipe-pulse"></div>
            <div className="arch-sub-nodes">
              <div className="arch-node-mini">Agent A (DMZ)</div>
              <div className="arch-node-mini">Agent B (LAN)</div>
              <div className="arch-node-mini">Agent C (Cloud)</div>
            </div>
            <div className="arch-pipe-pulse"></div>
            <div className="arch-node-badge badge-dash">Live React Telemetry Dashboard</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="landing-brand">
            <div className="brand-logo-ring"></div>
            <div className="brand-title-text">
              NetMonitor <span>Enterprise</span>
            </div>
          </div>
          <p className="footer-lead">Distributed Network Device Monitoring System</p>
          <button className="btn-glowing-primary" onClick={onOpenLogin}>
            Sign In to Console ➔
          </button>
        </div>
        <div className="footer-bottom-copy">
          Designed by Wijerathna K.A.A.M. (EG/2023/5971) · Project Proposal Implementation
        </div>
      </footer>
    </div>
  );
}
