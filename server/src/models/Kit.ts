import mongoose from 'mongoose';

const reqSchema=new mongoose.Schema({id:String,text:String,kind:{type:String,enum:['technical','behavioural','domain']},priority:{type:String,enum:['must','nice']}},{_id:false});
const qSchema=new mongoose.Schema({id:String,requirement_ids:[String],category:{type:String,enum:['technical','behavioural','system-design','company-fit']},prompt:String,answer_outline:String,difficulty:{type:Number,min:1,max:3},state:{type:String,enum:['generated','edited','pinned'],default:'generated'}},{_id:false});
const fSchema=new mongoose.Schema({id:String,front:String,back:String,requirement_ids:[String],state:{type:String,enum:['generated','edited','pinned'],default:'generated'}},{_id:false});
const dSchema=new mongoose.Schema({day:Number,focus:String,question_ids:[String],minutes:Number},{_id:false});
const practiceSchema=new mongoose.Schema({flashcard_id:String,confidence:{type:Number,min:1,max:5},last_reviewed_at:Date},{_id:false});

const schema=new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  input_jd:{type:String,required:true},
  input_hash:{type:String,index:true},
  source:{company:String,company_url:String,role:String,location:String,jd_chars:Number,researched_at:String,pages_used:[String]},
  company_brief:{summary:String,what_they_do:String,sources:[String]},
  role:{title:String,seniority:String,responsibilities:[String],requirements:[reqSchema]},
  questions:[qSchema], flashcards:[fSchema],
  schedule:{days_available:Number,days:[dSchema]},
  coverage:{uncovered_requirement_ids:[String],passes:Number},
  practice:{type:[practiceSchema],default:[]},
  status:{type:String,enum:['draft','generating','ready','failed'],default:'draft'},
  generation:{step:String,label:String,done:Boolean,error:String,researchErrors:[String],startedAt:Date}
},{timestamps:true,minimize:false});

export const Kit=mongoose.model('Kit',schema);
