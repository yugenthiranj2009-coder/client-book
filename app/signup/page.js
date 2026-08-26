'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="wrap">
        <h1>Check your email</h1>
        <p className="sub">We sent a confirmation link to {email}. Click it, then log in.</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1>Create an account</h1>
      <p className="sub">Start on the free tier — upgrade any time.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        {error && <p className="err">{error}</p>}
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
    }
