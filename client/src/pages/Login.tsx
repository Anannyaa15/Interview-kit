import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { api } from '../services';

export function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/login', {
        email,
        password,
      });

      nav('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? 'Unable to sign in.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue preparing."
    >
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-polish w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        />

        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="input-polish w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        />

        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{' '}
        <Link
          className="font-semibold text-slate-900"
          to="/register"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}