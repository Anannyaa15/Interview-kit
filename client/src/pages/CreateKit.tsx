import { FormEvent,useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { api } from '../services';

export function CreateKit(){
 const nav=useNavigate(); const[jd,setJd]=useState(''); const[url,setUrl]=useState(''); const[days,setDays]=useState(5); const[error,setError]=useState(''); const[loading,setLoading]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError('');try{const r=await api.post('/kits',{jd,company_url:url,days});nav(`/kits/${r.data.kitId}/generating`)}catch(err:any){setError(err.response?.data?.message??'Unable to create kit.')}finally{setLoading(false)}}
 return <main className="min-h-screen bg-slate-50">
  <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4"><Link to="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Dashboard</Link><span className="flex items-center gap-2 font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm text-cyan-300">✦</span>PrepKit</span></div></header>
  <section className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:py-14">
   <div className="mb-8"><span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700">New preparation kit</span><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Turn the posting into a plan.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">We'll research the company, extract real requirements, generate targeted questions, check coverage, and build your study schedule.</p></div>
   <form onSubmit={submit} className="soft-shadow overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
    <div className="grid min-w-0 lg:grid-cols-[1.25fr_.75fr]">
     <div className="min-w-0 p-4 sm:p-8">
      <div><label className="mb-2 block text-sm font-bold text-slate-900">Job description</label><textarea required minLength={2} rows={15} value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the complete job description…" className="input-polish w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none"/><p className="mt-2 text-xs text-slate-400">Tip: include responsibilities, required skills and nice-to-haves.</p></div>
     </div>
     <aside className="min-w-0 border-t border-slate-100 bg-slate-50/80 p-4 sm:p-8 lg:border-l lg:border-t-0">
      <div><label className="mb-2 block text-sm font-bold text-slate-900">Company website</label><input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" className="input-polish w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"/></div>
      <div className="mt-6"><label className="mb-2 block text-sm font-bold text-slate-900">Days before interview</label><input required type="number" min={1} max={60} value={days} onChange={e=>setDays(Number(e.target.value))} className="input-polish w-full max-w-32 rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"/><p className="mt-2 text-xs text-slate-400">Choose between 1 and 60 days.</p></div>
      <div className="mt-7 space-y-3 rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">What you'll get</p>{['Company research brief','Questions by interview category','Flashcards + practice mode','Day-by-day study schedule'].map(x=><div key={x} className="flex items-center gap-2 text-sm text-slate-600"><span className="text-cyan-600">✓</span>{x}</div>)}</div>
      {error&&<p className="mt-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50">{loading?'Starting generation…':'Generate interview kit →'}</button>
     </aside>
    </div>
   </form>
  </section>
 </main>
}
