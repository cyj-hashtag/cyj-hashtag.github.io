export const VERSION='2026.10.14.62505599eec2';
export const INTERVALS=[1,3,7,14,30];
const seoulDateFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
export function seoulDay(at=Date.now()){return seoulDateFormatter.format(new Date(at));}
export function addDays(day,n){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function reduceEvents(events){
 const states={}; const seen=new Set();
 for(const e of [...events].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))){
  if(seen.has(e.id)||!['learn','review'].includes(e.kind))continue; seen.add(e.id);
  const day=seoulDay(e.at); const s=states[e.itemId]??={stage:0,seen:false,firstDay:day,due:day,lastAdvance:null,recallDays:[],listening:{attempts:0,correct:0},errors:0};
  if(e.kind==='learn'){if(!s.seen)s.learnedDay=day;s.seen=true;}
  if(e.modality==='listen'){s.listening.attempts++;if(e.result==='good')s.listening.correct++;}
  if(e.result==='again'){s.stage=0;s.due=day;s.errors++;}
  else if(e.result==='hard'){s.due=addDays(day,1);}
  else if(e.result==='good'){
   if(day>s.firstDay&&!s.recallDays.includes(day))s.recallDays.push(day);
   if(!s.lastAdvance||day>s.lastAdvance){s.stage=Math.min(s.stage+1,5);s.lastAdvance=day;s.due=addDays(day,INTERVALS[s.stage-1]);}
   else if(s.stage===0)s.due=addDays(day,1);
  }
 }
 return states;
}
export function planSession(queue,events,previous=[],limit=50,day=null){
 // Allocation needs first learning dates, not every review's scheduling history.
 const first=new Map(),allowed=new Set(queue);
 for(const e of events)if(e.kind==='learn'&&allowed.has(e.itemId)&&(!first.has(e.itemId)||e.at<first.get(e.itemId)))first.set(e.itemId,e.at);
 const today=day?queue.filter(id=>first.has(id)&&seoulDay(first.get(id))===day):[],carry=previous.filter(id=>allowed.has(id)&&!first.has(id));
 return [...new Set([...today,...carry,...queue.filter(id=>!first.has(id))])].slice(0,limit);
}
export function schedule(start){return {finish:addDays(start,17),assessment:addDays(start,18),onTime:addDays(start,17)<='2026-10-30'};}
export function completionForecast(states,queue,today=seoulDay()){
 const learned=queue.map(id=>states[id]).filter(s=>s?.seen),covered=learned.length,todayLearned=learned.filter(s=>(s.learnedDay||s.firstDay)===today).length;
 const remaining=Math.max(0,queue.length-covered),todayPlaces=Math.max(0,50-todayLearned),remainingAfterToday=Math.max(0,remaining-todayPlaces),finish=addDays(today,Math.ceil(remainingAfterToday/50));
 return {covered,todayLearned,remaining,todayPlaces,finish,assessment:addDays(finish,1),onTime:finish<='2026-10-30'};
}
export function sessionCourseDay(words,sessionIds,states){
 const map=new Map(words.map(w=>[w.id,w])),days=(sessionIds||[]).map(id=>map.get(id)?.studyDay).filter(n=>Number.isInteger(n)&&n>=1&&n<=18);
 return days.length?Math.min(...days):Math.min(18,Math.floor(words.filter(w=>states[w.id]?.seen).length/50)+1);
}
export function validateEvent(e,allowed,now=Date.now()){
 if(!e||typeof e!=='object'||Array.isArray(e)||!(/^[a-zA-Z0-9_-]{16,80}$/).test(e.id)||!allowed.has(e.itemId)||!['learn','review','exercise','reading','assessment'].includes(e.kind)||!['again','hard','good'].includes(e.result)||!['text','listen','grammar','comprehension'].includes(e.modality)||typeof e.device!=='string'||!e.device.length||e.device.length>100||!Number.isSafeInteger(e.at)||e.at<Date.parse('2026-01-01')||e.at>now+300000)return false;
 if(e.details!==undefined){if(!e.details||typeof e.details!=='object'||Array.isArray(e.details))return false;try{if(JSON.stringify(e.details).length>12000)return false;}catch{return false;}}
 return true;
}
