import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CreateKit } from './pages/CreateKit';
import { Generating } from './pages/Generating';
import { KitWorkspace } from './pages/KitWorkspace';
import { api } from './services';

function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20">
            ✦
          </span>
          PrepKit
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/login"
            className="rounded-xl px-2.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-white/10 hover:-translate-y-0.5 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="hero-orb pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="pointer-events-none absolute left-1/3 top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative grid min-w-0 items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              AI-powered interview preparation
            </div>

            <h1 className="mt-6 max-w-4xl break-words text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Prepare smarter for the interview that{' '}
              <span className="text-cyan-300">
                actually matters.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Turn a job description into a focused preparation kit with
              company research, targeted questions, flashcards, and a
              day-by-day plan.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                to="/register"
                className="w-full rounded-xl bg-cyan-300 px-5 py-3.5 text-center font-bold text-slate-950 shadow-xl shadow-cyan-300/15 hover:-translate-y-0.5 hover:bg-cyan-200 sm:w-auto"
              >
                Create your first kit →
              </Link>

              <Link
                to="/login"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-center font-semibold text-white hover:bg-white/10 sm:w-auto"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <span>✓ Requirement coverage</span>
              <span>✓ Editable question bank</span>
              <span>✓ Practice + weak spots</span>
            </div>
          </div>

          <div className="relative mx-auto w-full min-w-0 max-w-lg lg:ml-auto">
            <div className="absolute -inset-5 rounded-[2rem] bg-cyan-300/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.07] p-3 shadow-2xl shadow-black/30">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/90 p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold text-cyan-300">
                      INTERVIEW KIT
                    </p>
                    <p className="mt-1 font-semibold">
                      Full Stack Developer
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    Ready
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ['12', 'Requirements'],
                    ['24', 'Questions'],
                    ['7', 'Days'],
                  ].map(([n, l]) => (
                    <div
                      key={l}
                      className="rounded-xl border border-white/10 bg-white/[.04] p-3"
                    >
                      <p className="text-xl font-bold">{n}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {l}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    ['Technical', '8 questions', 'bg-cyan-400'],
                    ['Behavioural', '5 questions', 'bg-violet-400'],
                    ['System design', '4 questions', 'bg-amber-400'],
                  ].map(([label, count, dot]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl bg-white/[.04] px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span
                          className={`h-2 w-2 rounded-full ${dot}`}
                        />
                        {label}
                      </span>

                      <span className="text-xs text-slate-400">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-cyan-300 p-4 text-slate-950">
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Today
                  </p>

                  <p className="mt-1 font-bold">
                    Master React + REST APIs
                  </p>

                  <p className="mt-1 text-xs text-slate-700">
                    45 min · 6 questions
                  </p>
                </div>
              </div>
            </div>

            <div className="float-card absolute -bottom-7 -left-7 hidden rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 shadow-2xl md:block">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Coverage
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                All must-haves covered ✓
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3 lg:px-8">
          {[
            [
              '01',
              'Paste the job description',
              'Give PrepKit the role and company website.',
            ],
            [
              '02',
              'Let the pipeline research',
              'Requirements, company context, questions and coverage are built in stages.',
            ],
            [
              '03',
              'Practice with a plan',
              'Edit anything, practise flashcards, and focus on your weakest areas.',
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-4">
              <span className="text-sm font-bold text-cyan-300">
                {n}
              </span>

              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    api
      .get('/auth/me')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Checking session…
      </div>
    );
  }

  return authed ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname }}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />

      <Route
        path="/kits/new"
        element={
          <Protected>
            <CreateKit />
          </Protected>
        }
      />

      <Route
        path="/kits/:id/generating"
        element={
          <Protected>
            <Generating />
          </Protected>
        }
      />

      <Route
        path="/kits/:id"
        element={
          <Protected>
            <KitWorkspace />
          </Protected>
        }
      />
    </Routes>
  );
}