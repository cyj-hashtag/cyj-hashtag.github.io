import {validAssessmentSnapshot} from './assessment.js';
const testMode=['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('test')==='1';
const testProfile=new URLSearchParams(location.search).get('testProfile')||'';
const NAME=testMode?'korean-study-test-v1'+(/^[a-z0-9-]{1,32}$/.test(testProfile)?'-'+testProfile:''):'korean-study-v1';
let db;
export async function openStore(){
 db=await new Promise((resolve,reject)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>{r.result.createObjectStore('kv');r.result.createObjectStore('events',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return db;
}
function request(store,mode,fn){return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const r=fn(tx.objectStore(store));let value;r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export const get=key=>request('kv','readonly',s=>s.get(key));
export const put=(key,value)=>request('kv','readwrite',s=>s.put(value,key));
export const events=()=>request('events','readonly',s=>s.getAll());
export async function mergeEvents(list,serverCanonical=false){return new Promise((resolve,reject)=>{const tx=db.transaction('events','readwrite'),s=tx.objectStore('events'),unique=new Map();for(const e of list)if(!unique.has(e.id))unique.set(e.id,e);for(const e of unique.values()){const r=s.get(e.id);r.onsuccess=()=>{if(serverCanonical)s.put(e);else if(!r.result)s.add(e);};}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export async function restoreBackup(backup,valid){
 if(backup?.format!=='korean-study-backup-v1'||!Array.isArray(backup.events)||backup.events.length>50000||!backup.events.every(valid))throw new Error('备份格式或学习事件无效。');
 if(backup.start!==undefined&&(!/^\d{4}-\d{2}-\d{2}$/.test(backup.start)||!Number.isFinite(Date.parse(backup.start+'T12:00:00Z'))||new Date(backup.start+'T12:00:00Z').toISOString().slice(0,10)!==backup.start))throw new Error('备份的开始日期无效。');
 if(backup.assessment!==undefined&&!validAssessmentSnapshot(backup.assessment))throw new Error('备份的检测记录无效。');
 if(backup.assessmentHistory!==undefined&&(!Array.isArray(backup.assessmentHistory)||backup.assessmentHistory.length>10000||!backup.assessmentHistory.every(a=>a&&/^[A-Za-z0-9_-]{16,80}$/.test(a.id)&&Number.isSafeInteger(a.startedAt))))throw new Error('备份的检测历史无效。');
 await mergeEvents(backup.events);const start=await get('start');if(backup.start&&(!start||backup.start<start))await put('start',backup.start);
 if(backup.assessment){const incoming=backup.assessment,existing=await get('assessment-active');if(!existing||incoming.startedAt>existing.startedAt)await put('assessment-active',incoming);else if(incoming.id===existing.id){const merged={...existing,index:Math.max(existing.index,incoming.index),lookups:existing.lookups.map((n,i)=>Math.max(n,incoming.lookups[i])),answers:existing.answers.map((row,j)=>row.map((choice,i)=>choice??incoming.answers[j][i])),grammar:existing.grammar.map((g,i)=>(incoming.grammar[i].updatedAt||0)>(g.updatedAt||0)?incoming.grammar[i]:g)};if(incoming.completed&&!existing.completed){merged.completed=true;merged.finishedAt=incoming.finishedAt;}await put('assessment-active',merged);}}
 if(backup.assessmentHistory){const history=new Map((await get('assessment-history')||[]).map(a=>[a.id,a]));for(const a of backup.assessmentHistory)if(!history.has(a.id))history.set(a.id,a);await put('assessment-history',[...history.values()]);}
}
