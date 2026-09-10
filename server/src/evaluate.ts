import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Kit } from './models/Kit.js';
import { generateKit, toKitOutput } from './services/generation.pipeline.js';

type InputCase={id:string;jd:string;company_url:string;days:number};
function parseArgs() {
  const args = process.argv.slice(2);

  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');

  if (
    inputIndex === -1 ||
    outputIndex === -1 ||
    !args[inputIndex + 1] ||
    !args[outputIndex + 1]
  ) {
    throw new Error(
      'Usage: npm run evaluate -- --input <cases.json> --output <kits.json>',
    );
  }

  /*
   * The evaluator is executed from the server directory because
   * the root package.json uses:
   *
   * npm --prefix server run evaluate --
   *
   * Input/output paths supplied to the required root command,
   * however, are relative to the project root.
   */
  const projectRoot = path.resolve(process.cwd(), '..');

  const resolveProjectPath = (filePath: string) =>
    path.isAbsolute(filePath)
      ? filePath
      : path.resolve(projectRoot, filePath);

  return {
    input: resolveProjectPath(args[inputIndex + 1]),
    output: resolveProjectPath(args[outputIndex + 1]),
  };
}
export function validateInput(c: any): boolean {
  try { const u=new URL(c.company_url); return typeof c.id==='string'&&!!c.id&&typeof c.jd==='string'&&c.jd.trim().length>0&&Number.isInteger(c.days)&&c.days>=1&&c.days<=365&&['http:','https:'].includes(u.protocol); } catch { return false; }
}
async function main(){
  const {input,output}=parseArgs();
  const parsed=JSON.parse(await fs.readFile(input,'utf8'));
  if(!Array.isArray(parsed)) throw new Error('Input must be a JSON array.');
  const cases=parsed as InputCase[];
  await mongoose.connect(env.mongoUri);
  const kits:any[]=[];
  for(const c of cases){
    if(!validateInput(c)){ kits.push({id:c?.id??'unknown',status:'failed',kit:null,error:{code:'INVALID_INPUT',message:'Case must contain id, non-empty jd, valid http(s) company_url, and integer days >= 1.'}}); continue; }
    let doc:any;
    try{
      const input_hash=crypto.createHash('sha256').update(`${c.jd}\n${c.company_url}`).digest('hex');
      doc=await Kit.create({userId:new mongoose.Types.ObjectId(),input_jd:c.jd,input_hash,status:'draft',source:{company_url:c.company_url,jd_chars:c.jd.length},schedule:{days_available:c.days,days:[]},questions:[],flashcards:[],coverage:{uncovered_requirement_ids:[],passes:0},company_brief:{summary:'',what_they_do:'',sources:[]},role:{title:'',seniority:'',responsibilities:[],requirements:[]},generation:{step:'queued',label:'Queued',done:false}});
      await generateKit(String(doc._id));
      const done=await Kit.findById(doc._id).lean();
      if(!done) throw new Error('Generated kit could not be read back.');
      kits.push({id:c.id,status:'ok',kit:toKitOutput(done),error:null});
    }catch(error:any){
      kits.push({id:c.id,status:'failed',kit:null,error:{code:error?.code??'GENERATION_FAILED',message:error instanceof Error?error.message:String(error)}});
    } finally {
      if(doc?._id) await Kit.deleteOne({_id:doc._id}).catch(()=>undefined);
    }
  }
  await mongoose.disconnect();
  await fs.writeFile(output,JSON.stringify({version:'1.0',generated_at:new Date().toISOString(),kits},null,2));
}
const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch(async e => {
    console.error(e);
    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  });
}
