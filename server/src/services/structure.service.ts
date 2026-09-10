export function validateKitStructure(kit:any){
  const errors:string[]=[];
  for(const k of ['source','company_brief','role','questions','flashcards','schedule','coverage']) {
    if(!(k in (kit??{}))) errors.push(`Missing top-level field: ${k}`);
  }
  if(!Array.isArray(kit?.role?.requirements)) errors.push('role.requirements must be an array');
  if(!Array.isArray(kit?.questions)) errors.push('questions must be an array');
  if(!Array.isArray(kit?.flashcards)) errors.push('flashcards must be an array');
  if(!Array.isArray(kit?.schedule?.days)) errors.push('schedule.days must be an array');
  if(!Array.isArray(kit?.coverage?.uncovered_requirement_ids)) errors.push('coverage.uncovered_requirement_ids must be an array');

  const reqs=kit?.role?.requirements??[];
  const reqIds=new Set<string>();
  for(const r of reqs){
    if(!r.id || reqIds.has(r.id)) errors.push(`Duplicate requirement id: ${r.id||'<missing>'}`);
    reqIds.add(r.id);
    if(!['technical','behavioural','domain'].includes(r.kind)) errors.push(`Invalid requirement kind for ${r.id}`);
    if(!['must','nice'].includes(r.priority)) errors.push(`Invalid requirement priority for ${r.id}`);
    if(typeof r.text!=='string'||!r.text.trim()) errors.push(`Requirement ${r.id} must have text`);
  }

  const qIds=new Set<string>();
  for(const q of kit?.questions??[]){
    if(!q.id || qIds.has(q.id)) errors.push(`Duplicate question id: ${q.id||'<missing>'}`);
    qIds.add(q.id);
    if(!['technical','behavioural','system-design','company-fit'].includes(q.category)) errors.push(`Invalid category for ${q.id}`);
    if(![1,2,3].includes(q.difficulty)) errors.push(`Invalid difficulty for ${q.id}`);
    if(!Array.isArray(q.requirement_ids)||q.requirement_ids.length===0) errors.push(`Question ${q.id} must reference requirements`);
    for(const rid of q.requirement_ids??[]) if(!reqIds.has(rid)) errors.push(`Unknown requirement id ${rid} on ${q.id}`);
  }

  const fIds=new Set<string>();
  for(const f of kit?.flashcards??[]){
    if(!f.id || fIds.has(f.id)) errors.push(`Duplicate flashcard id: ${f.id||'<missing>'}`);
    fIds.add(f.id);
    if(!Array.isArray(f.requirement_ids)||f.requirement_ids.length===0) errors.push(`Flashcard ${f.id} must reference requirements`);
    for(const rid of f.requirement_ids??[]) if(!reqIds.has(rid)) errors.push(`Unknown requirement id ${rid} on flashcard ${f.id}`);
  }

  for(const d of kit?.schedule?.days??[]){
    if(!Number.isInteger(d.day)||d.day<1) errors.push(`Invalid day number: ${d.day}`);
    for(const id of d.question_ids??[]) if(!qIds.has(id)) errors.push(`Unknown question id in schedule: ${id}`);
    if(!Number.isInteger(d.minutes)||d.minutes<0) errors.push(`Minutes must be non-negative integer for day ${d.day}`);
  }

  if(Number.isInteger(kit?.schedule?.days_available)&&kit.schedule.days.length!==kit.schedule.days_available) errors.push('Schedule day count does not match days_available');
  if(Number.isInteger(kit?.schedule?.days_available)&&kit.schedule.days_available<1) errors.push('days_available must be positive');
  const scheduledIds=new Set((kit?.schedule?.days??[]).flatMap((d:any)=>d.question_ids??[]));
  for(const q of kit?.questions??[]) if(!scheduledIds.has(q.id)) errors.push(`Question ${q.id} is not scheduled`);
 const mustIds = reqs
  .filter((r: any) => r.priority === 'must')
  .map((r: any) => r.id);

const covered = new Set(
  (kit?.questions ?? []).flatMap((q: any) => q.requirement_ids ?? [])
);

// Check actual question coverage
for (const id of mustIds) {
  if (!covered.has(id)) {
    errors.push(`uncovered must-have requirement: ${id}`);
  }
}

// Check that the reported coverage is consistent with the questions
const reportedUncovered =
  kit?.coverage?.uncovered_requirement_ids ?? [];

for (const id of reportedUncovered) {
  if (mustIds.includes(id)) {
    errors.push(`uncovered must-have requirement: ${id}`);
  }
}
  return{valid:errors.length===0,errors};
}
