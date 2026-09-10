import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({title,subtitle,children}:{title:string;subtitle:string;children:ReactNode}){
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
    <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>
    <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"></div>
    <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/[.06] shadow-2xl shadow-black/30 lg:grid-cols-[.85fr_1.15fr]">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-cyan-300 to-blue-500 p-9 text-slate-950 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-cyan-300">✦</span>PrepKit</Link>
        <div><p className="text-sm font-bold uppercase tracking-[.18em] opacity-70">Interview prep, simplified</p><h2 className="mt-3 text-4xl font-bold leading-tight">Walk in prepared, not overwhelmed.</h2><p className="mt-4 max-w-sm text-sm leading-6 opacity-75">Turn a job posting into a practical study plan built around the skills companies actually ask about.</p></div>
        <p className="text-xs font-medium opacity-60">Private kits · Targeted practice · Clear progress</p>
      </aside>
      <section className="min-w-0 bg-white p-5 sm:p-9">
        <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back to PrepKit</Link>
        <h1 className="mt-6 text-2xl font-bold sm:mt-8 sm:text-3xl tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </section>
    </div>
  </main>
}
