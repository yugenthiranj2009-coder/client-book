'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardClient({ initialClients, isPro, limit, userEmail }) {
  const [clients, setClients] = useState(initialClients);
  const [form, setForm] = useState({ name: '', problem: '', appt_date: '', email: '' });
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);
  const router = useRouter();

  const atLimit = !isPro && clients.length >= limit;
  const today = todayStr();
  const todaysClients = clients.filter((c) => c.appt_date === today);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.problem || !form.appt_date || !form.email) {
      setError('Fill in every field.');
      return;
    }
    if (atLimit) {
      setError('You have reached the free tier limit. Upgrade to add more clients.');
      return;
    }
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not add client.');
      return;
    }
    setClients([...clients, data.client].sort((a, b) => a.appt_date.localeCompare(b.appt_date)));
    setForm({ name: '', problem: '', appt_date: '', email: '' });
  }

  async function handleRemove(id) {
    setClients(clients.filter((c) => c.id !== id));
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
  }

  async function handleSend(id) {
    setSendingId(id);
    const res = await fetch('/api/reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id }),
    });
    setSendingId(null);
    if (res.ok) setSentIds([...sentIds, id]);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function handleUpgrade() {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <span className={`badge ${isPro ? 'pro' : ''}`}>{isPro ? 'Pro' : 'Free'}</span>
        <a href="#" onClick={handleLogout}>Log out ({userEmail})</a>
      </div>

      <h1>Your massage clients</h1>
      <p className="sub">Add a client, note what's bothering them, and save their next appointment date.</p>

      {todaysClients.length > 0 && (
        <div className="limit-banner">
          <strong>Appointments today</strong>
          {todaysClients.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span>{c.name}</span>
              <button
                onClick={() => handleSend(c.id)}
                disabled={sendingId === c.id}
                style={{ background: 'var(--clay-500)', padding: '5px 10px', fontSize: 12 }}
              >
                {sentIds.includes(c.id) ? 'Sent' : sendingId === c.id ? 'Sending…' : 'Send reminder'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!isPro && (
        <div className="limit-banner">
          {clients.length}/{limit} clients used on the free plan.{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); handleUpgrade(); }}>Upgrade for unlimited clients →</a>
        </div>
      )}

      <form onSubmit={handleAdd} className="card">
        <label>Client name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maria Alvarez" />
        <label>Problem statement</label>
        <textarea value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="e.g. Lower back tightness from desk work" rows={2} />
        <label>Appointment date</label>
        <input type="date" value={form.appt_date} onChange={(e) => setForm({ ...form, appt_date: e.target.value })} />
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
        {error && <p className="err">{error}</p>}
        <button type="submit" style={{ width: '100%' }}>
          {atLimit ? 'Upgrade to add more clients' : 'Add client'}
        </button>
      </form>

      {clients.length === 0 && <p className="sub">No clients yet. Add your first one above.</p>}

      {clients.map((c) => (
        <div key={c.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{c.name}</strong>
            <span className="badge">{fmtDate(c.appt_date)}</span>
          </div>
          <p className="sub" style={{ margin: '6px 0' }}>{c.problem}</p>
          <p className="sub" style={{ margin: '0 0 10px' }}>{c.email}</p>
          <button className="danger" onClick={() => handleRemove(c.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
    }
