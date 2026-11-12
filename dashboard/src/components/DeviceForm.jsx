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
    <div className="form-card-wrapper">
      <div className="form-header-bar" onClick={() => setExpanded(!expanded)}>
        <div className="form-header-left">
          <span className="form-icon">➕</span>
          <span className="form-header-title">Add New Monitored Device</span>
        </div>
        <button type="button" className="btn-toggle-expand">
          {expanded ? 'Collapse −' : 'Expand Form +'}
        </button>
      </div>

      {expanded && (
        <form className="advanced-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Device Name</label>
              <input
                className="input-field"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Core-Switch-01"
                required
              />
            </div>

            <div className="form-group">
              <label>IP Address / Hostname</label>
              <input
                className="input-field mono-font"
                value={form.host}
                onChange={set('host')}
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div className="form-group">
              <label>TCP Ports (Optional)</label>
              <input
                className="input-field mono-font"
                value={form.tcpPorts}
                onChange={set('tcpPorts')}
                placeholder="22, 80, 443, 8080"
              />
            </div>

            <div className="form-group">
              <label>Group / Tag</label>
              <input
                className="input-field"
                value={form.deviceGroup}
                onChange={set('deviceGroup')}
                placeholder="Infrastructure, Web, DB..."
              />
            </div>

            <div className="form-group">
              <label>Assign to Agent</label>
              <select
                className="select-field"
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

            <div className="form-group form-checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.snmpEnabled}
                  onChange={set('snmpEnabled')}
                />
                <span>Enable SNMP Polling</span>
              </label>
              {form.snmpEnabled && (
                <input
                  className="input-field snmp-comm"
                  value={form.snmpCommunity}
                  onChange={set('snmpCommunity')}
                  placeholder="Community (e.g. public)"
                />
              )}
            </div>
          </div>

          <div className="form-action-bar">
            {error && <span className="form-error-msg">{error}</span>}
            <button type="submit" className="btn-modern-primary" disabled={saving}>
              {saving ? 'Registering Device...' : 'Add Device to Poller'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
