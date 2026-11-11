import { useState } from 'react';

const empty = { name: '', host: '', tcpPorts: '', agentId: '' };

export default function DeviceForm({ agents, onAdd }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onAdd(form);
      setForm({ ...empty, agentId: form.agentId });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="device-form" onSubmit={submit}>
      <label>
        Name
        <input value={form.name} onChange={set('name')} placeholder="Core switch" required />
      </label>
      <label>
        Host or IP
        <input value={form.host} onChange={set('host')} placeholder="192.168.1.1" required />
      </label>
      <label>
        TCP ports
        <input value={form.tcpPorts} onChange={set('tcpPorts')} placeholder="22,80 (optional)" />
      </label>
      <label>
        Agent
        <input value={form.agentId} onChange={set('agentId')} list="agent-ids" placeholder="agent-a" required />
        <datalist id="agent-ids">
          {agents.map((a) => (
            <option key={a.id} value={a.id} />
          ))}
        </datalist>
      </label>
      <button type="submit" disabled={saving}>Add device</button>
      {error && <span className="error">{error}</span>}
    </form>
  );
}
