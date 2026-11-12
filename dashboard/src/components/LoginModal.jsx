import { useState } from 'react';
import { api } from '../api.js';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username, password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
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
        {/* Modal Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Modal Header */}
        <div className="login-header-group">
          <div className="login-logo-glow">
            <span className="logo-spark">⚡</span>
          </div>
          <h2 className="login-modal-title">Sign In to NetMonitor</h2>
          <p className="login-modal-subtitle">
            Enter authorized credentials to access live network telemetry and operations controls.
          </p>
        </div>

        {/* Quick Fill Credentials Pills */}
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

        {error && <div className="login-error-alert">⚠️ {error}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form-body">
          <div className="form-input-block">
            <label className="input-label-text">Operator Username</label>
            <input
              type="text"
              className="login-input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
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

          <button
            type="submit"
            className="btn-glowing-primary btn-login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-flex">
                <span className="sonexo-spinner"></span> Authenticating...
              </span>
            ) : (
              'Authenticate & Launch Console ➔'
            )}
          </button>
        </form>

        <div className="login-footer-meta">
          <span>Protected by Token Sessions (FR10) · NetMonitor Security Protocol</span>
        </div>
      </div>
    </div>
  );
}
