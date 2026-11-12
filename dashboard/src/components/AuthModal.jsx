import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const data = await api.register({
          fullName,
          username,
          email,
          password,
          role,
        });
        onAuthSuccess(data);
      } else {
        const data = await api.login(username, password);
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickRole(user, pass) {
    setUsername(user);
    setPassword(pass);
  }

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Modal Header */}
        <div className="login-header-group">
          <div className="login-logo-glow">
            <span className="logo-spark">{mode === 'signup' ? '✨' : '⚡'}</span>
          </div>
          <h2 className="login-modal-title">
            {mode === 'signup' ? 'Create Your Account' : 'Sign In to NetMonitor'}
          </h2>
          <p className="login-modal-subtitle">
            {mode === 'signup'
              ? 'Register as an operator to manage multi-segment polling and receive live telemetry.'
              : 'Enter authorized credentials to access live network telemetry and operations controls.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-switch-btn ${mode === 'login' ? 'switch-active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-switch-btn ${mode === 'signup' ? 'switch-active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Register / Sign Up
          </button>
        </div>

        {/* Quick Fill Pills (for Login Mode) */}
        {mode === 'login' && (
          <div className="quick-creds-bar">
            <span className="quick-label">Demo Roles:</span>
            <button
              type="button"
              className="cred-chip-btn"
              onClick={() => handleQuickRole('admin', 'admin123')}
            >
              Admin (admin / admin123)
            </button>
            <button
              type="button"
              className="cred-chip-btn"
              onClick={() => handleQuickRole('viewer', 'viewer123')}
            >
              Viewer (viewer / viewer123)
            </button>
          </div>
        )}

        {error && <div className="login-error-alert">⚠️ {error}</div>}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="login-form-body">
          {mode === 'signup' && (
            <>
              <div className="form-input-block">
                <label className="input-label-text">Full Name</label>
                <input
                  type="text"
                  className="login-input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Achintha Wijerathna"
                  required
                />
              </div>

              <div className="form-input-block">
                <label className="input-label-text">Work Email</label>
                <input
                  type="email"
                  className="login-input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  required
                />
              </div>
            </>
          )}

          <div className="form-input-block">
            <label className="input-label-text">Operator Username</label>
            <input
              type="text"
              className="login-input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. achintha_net"
              required
            />
          </div>

          <div className="form-input-block">
            <label className="input-label-text">Security Password</label>
            <input
              type="password"
              className="login-input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-input-block">
              <label className="input-label-text">Operational Role (RBAC)</label>
              <select
                className="login-input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="ADMIN">Administrator (Full Polling & Device Control)</option>
                <option value="VIEWER">Viewer (Read-Only Telemetry & Dashboards)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-glowing-primary btn-login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-flex">
                <span className="sonexo-spinner"></span> Processing...
              </span>
            ) : mode === 'signup' ? (
              'Create Account & Enter Console ➔'
            ) : (
              'Authenticate & Launch Console ➔'
            )}
          </button>
        </form>

        <div className="login-footer-meta">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <a
                href="#login"
                className="auth-link-orange"
                onClick={(e) => { e.preventDefault(); setMode('login'); setError(''); }}
              >
                Sign In here
              </a>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <a
                href="#signup"
                className="auth-link-orange"
                onClick={(e) => { e.preventDefault(); setMode('signup'); setError(''); }}
              >
                Register as a User
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

