import { useState } from 'react';

const empty = {
  name: '',
  host: '',
  tcpPorts: '',
  agentId: '',
  deviceGroup: 'Default',
  snmpEnabled: false,
  snmpCommunity: 'public',
};

export default function DeviceForm({ agents, onAdd }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const set = (field) => (event) => {
    const val = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm({ ...form, [field]: val });
  };

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onAdd(form);
      setForm({ ...empty, agentId: form.agentId || (agents[0]?.id || 'agent-a') });
      setExpanded(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sonexo-form-drawer">
      <div className="drawer-header-trigger" onClick={() => setExpanded(!expanded)}>
        <div className="drawer-left-title">
          <span className="drawer-glow-icon">➕</span>
          <span className="drawer-title-text">Register New Network Device</span>
        </div>
        <button type="button" className="btn-secondary-glow" style={{ padding: '8px 18px', fontSize: '14px' }}>
          {expanded ? 'Close Form −' : '+ Expand Form'}
        </button>
      </div>

      {expanded && (
        <form className="sonexo-animated-form" onSubmit={submit}>
          <div className="form-fields-grid">
            <div className="input-group">
              <label className="field-label">Device Identifier</label>
              <input
                className="sonexo-input-field"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Core-Switch-01"
                required
              />
            </div>

            <div className="input-group">
              <label className="field-label">IPv4 / FQDN Hostname</label>
              <input
                className="sonexo-input-field mono-font"
                value={form.host}
                onChange={set('host')}
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div className="input-group">
              <label className="field-label">TCP Service Ports (Optional)</label>
              <input
                className="sonexo-input-field mono-font"
                value={form.tcpPorts}
                onChange={set('tcpPorts')}
                placeholder="22, 80, 443, 8080"
              />
            </div>

            <div className="input-group">
              <label className="field-label">Logical Group / Segment</label>
              <input
                className="sonexo-input-field"
                value={form.deviceGroup}
                onChange={set('deviceGroup')}
                placeholder="Gateways, Servers, Storage..."
              />
            </div>

            <div className="input-group">
              <label className="field-label">Collector Agent</label>
              <select
                className="sonexo-select-field"
                value={form.agentId || (agents[0]?.id || 'agent-a')}
                onChange={set('agentId')}
                required
              >
                {agents.length === 0 && <option value="agent-a">agent-a</option>}
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} ({a.online ? 'Online' : 'Offline'})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group checkbox-align-group">
              <label className="checkbox-glow-label">
                <input
                  type="checkbox"
                  checked={form.snmpEnabled}
                  onChange={set('snmpEnabled')}
                />
                <span>Enable SNMP Telemetry</span>
              </label>
              {form.snmpEnabled && (
                <input
                  className="sonexo-input-field"
                  style={{ marginTop: '8px' }}
                  value={form.snmpCommunity}
                  onChange={set('snmpCommunity')}
                  placeholder="Community String (e.g. public)"
                />
              )}
            </div>
          </div>

          <div className="form-footer-actions">
            {error && <span className="sonexo-inline-error">{error}</span>}
            <button type="submit" className="btn-glowing-orange" disabled={saving}>
              {saving ? 'Registering Device...' : 'Add Device to Poller'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
