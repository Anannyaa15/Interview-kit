import { useEffect,useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import axios from 'axios';
type Kit={_id:string;source?:{company?:string;role?:string};createdAt?:string;status?:string};
export function Dashboard(){
 const nav=useNavigate(); const[kits,setKits]=useState<Kit[]>([]); const[error,setError]=useState('');
 useEffect(()=>{axios.get('/api/kits',{withCredentials:true}).then(r=>setKits(r.data.kits)).catch(()=>setError('Your session may have expired. Please sign in again.'))},[]);
 async function logout(){await axios.post('/api/auth/logout',{}, {withCredentials:true});nav('/login')}
 return <main className="min-h-screen bg-slate-50">
  <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
   <Link to="/dashboard" className="flex items-center gap-2 font-bold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm text-cyan-300">✦</span>PrepKit</Link>
   <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Link to="/kits/new" className="rounded-lg bg-slate-950 px-2.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:px-3 sm:text-sm">+ New kit</Link><button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">Log out</button></div>
  </div></header>
  <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
   <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl shadow-slate-900/10 sm:p-9">
    <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl"></div>
    <div className="relative flex min-w-0 flex-col justify-between gap-6 md:flex-row md:items-end">
     <div><p className="text-sm font-semibold text-cyan-300">Your workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your interview kits</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Keep every role, question bank and study plan in one place.</p></div>
     <Link to="/kits/new" className="inline-flex w-full justify-center rounded-xl bg-cyan-300 sm:w-fit px-5 py-3 font-bold text-slate-950 hover:-translate-y-0.5 hover:bg-cyan-200">Create a kit →</Link>
    </div>
   </div>
   {error&&<div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
   {!error&&!kits.length&&<div className="soft-shadow mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-2xl text-cyan-600">✦</div><h2 className="mt-5 text-lg font-bold">Your first kit is waiting</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Paste a job description and company website, and PrepKit will build your personalised preparation workspace.</p><Link to="/kits/new" className="mt-6 inline-block rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Create your first kit</Link></div>}
   <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{kits.map(k=><Link to={k.status==='ready'?`/kits/${k._id}`:`/kits/${k._id}/generating`} key={k._id} className="card-hover group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 font-bold text-cyan-700">{(k.source?.company||'C').slice(0,1).toUpperCase()}</div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${k.status==='ready'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{k.status||'draft'}</span></div>
    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">{k.source?.company||'Company pending'}</p><h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-cyan-700">{k.source?.role||'Interview preparation kit'}</h2><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400"><span>{k.createdAt?new Date(k.createdAt).toLocaleDateString():'Recently created'}</span><span className="font-semibold text-slate-600">Open kit →</span></div>
   </Link>)}</div>
  </section>
 </main>
}
