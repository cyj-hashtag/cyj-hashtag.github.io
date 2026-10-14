// Detection records contain the learner's answers, never an inferred mastery claim.
export function validAssessmentSnapshot(value){
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&/^[A-Za-z0-9_-]{16,80}$/.test(value.id)&&Number.isSafeInteger(value.startedAt)&&value.startedAt>=Date.parse('2026-01-01')&&Number.isInteger(value.index)&&value.index>=0&&value.index<=2&&typeof value.unseen==='boolean'&&typeof value.completed==='boolean'&&Array.isArray(value.lookups)&&value.lookups.length===2&&value.lookups.every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000)&&Array.isArray(value.answers)&&value.answers.length===2&&value.answers.every(row=>Array.isArray(row)&&row.length===5&&row.every(n=>n===null||Number.isInteger(n)&&n>=0&&n<10))&&Array.isArray(value.grammar)&&value.grammar.length===3&&value.grammar.every(g=>g&&typeof g.text==='string'&&g.text.length<=1500&&typeof g.good==='boolean'&&(g.updatedAt===undefined||Number.isSafeInteger(g.updatedAt)))&&(!value.completed||Number.isSafeInteger(value.finishedAt));
}
export function deriveAssessmentRun(definition,events,local){
 const relevant=events.filter(e=>e.itemId===definition.id&&e.kind==='assessment'&&e.details?.attemptId).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
 const starts=new Map();for(const e of relevant)if(e.details.action==='start'&&!starts.has(e.details.attemptId))starts.set(e.details.attemptId,e);
 const latest=[...starts.values()].at(-1);
 if(!latest&&!validAssessmentSnapshot(local))return null;
 const start=latest&&(!local||latest.at>=local.startedAt)?latest:starts.get(local.id);
 const id=start?.details.attemptId||local.id;
 let run=local?.id===id&&validAssessmentSnapshot(local)?structuredClone(local):{id,startedAt:start.at,index:0,unseen:!!start.details.unseen,scope:start.details.scope||'',lookups:definition.passages.map(()=>0),answers:definition.passages.map(p=>p.questions.map(()=>null)),grammar:definition.grammarChecks.map(()=>({text:'',good:false,updatedAt:0})),completed:false};
 const answers=definition.passages.map(p=>p.questions.map(()=>null)),lookups=definition.passages.map(()=>0);
 for(const e of relevant){const d=e.details;if(d.attemptId!==id)continue;
  if(d.action==='answer'&&Number.isInteger(d.passage)&&answers[d.passage]&&Number.isInteger(d.question)&&d.question>=0&&d.question<answers[d.passage].length&&Number.isInteger(d.choice)&&d.choice>=0&&d.choice<definition.passages[d.passage].questions[d.question].options.length&&answers[d.passage][d.question]===null)answers[d.passage][d.question]=d.choice;
  else if(d.action==='lookup'&&lookups[d.passage]!==undefined)lookups[d.passage]++;
  else if(d.action==='grammar'&&Number.isInteger(d.index)&&run.grammar[d.index]&&typeof d.text==='string'&&d.text.length<=1500&&typeof d.good==='boolean'&&(d.updatedAt||e.at)>=(run.grammar[d.index].updatedAt||0))run.grammar[d.index]={text:d.text,good:d.good,updatedAt:d.updatedAt||e.at};
  else if(d.action==='passage'&&answers[d.passage]&&Array.isArray(d.answers)){d.answers.forEach((choice,i)=>{if(answers[d.passage][i]===null&&Number.isInteger(choice)&&choice>=0&&choice<definition.passages[d.passage].questions[i]?.options.length)answers[d.passage][i]=choice;});run.index=Math.max(run.index,d.passage+1);}
  else if(d.action==='finish'){
   run.completed=true;run.finishedAt=e.at;
   if(Array.isArray(d.grammar))d.grammar.forEach((g,i)=>{if(run.grammar[i]&&typeof g?.text==='string'&&g.text.length<=1500&&typeof g.good==='boolean')run.grammar[i]={text:g.text,good:g.good,updatedAt:g.updatedAt||e.at};});
   if(Array.isArray(d.lookups))d.lookups.forEach((n,i)=>{if(run.lookups[i]!==undefined&&Number.isInteger(n)&&n>=0)run.lookups[i]=Math.max(run.lookups[i],n);});
  }
 }
 run.answers=answers.map((row,j)=>row.map((choice,i)=>choice??run.answers[j][i]));
 run.lookups=lookups.map((n,i)=>Math.max(n,run.lookups[i]));
 if([...starts.values()].some(e=>e.details.attemptId!==id&&e.at<=run.startedAt))run.unseen=false;
 return run;
}
export function createAssessment({main,definition,db,record,esc,ko,resolveWord,getEvents=()=>[],syncScope=()=>''}){
 let run;const key='assessment-active',historyKey='assessment-history';
 let pendingWrites=0,saveFailed=false,saveTail=Promise.resolve();const grammarTimers=new Map();
 const button=(label,id)=>`<button type="button" data-assessment-action="${id}">${label}</button>`;
 const sentenceText=s=>Array.isArray(s)?s[0]:s.text;
 const questionText=q=>q.q||q.question;
 function saveStatus(message){
  const status=main.querySelector('#assessment-save-status');
  if(status)status.textContent=message||(pendingWrites||grammarTimers.size?'正在保存答案，请稍等……':saveFailed?'答案尚未保存，请保留此页并重试。':'答案已保存。');
  main.querySelectorAll('[data-assessment-action="next"],[data-assessment-action="finish"]').forEach(b=>{b.disabled=pendingWrites>0||grammarTimers.size>0||saveFailed;});
 }
 async function save(eventDetails,result='hard'){
  const snapshot=structuredClone(run);pendingWrites++;saveStatus();
  const write=saveTail.catch(()=>{}).then(async()=>{await db.put(key,snapshot);if(eventDetails)await record(definition.id,result,'assessment','comprehension',{attemptId:snapshot.id,...eventDetails});});saveTail=write;
  try{await write;saveFailed=false;}catch(e){saveFailed=true;throw e;}
  finally{pendingWrites--;saveStatus();}
 }
 async function flush(){for(const [index,{timer,details}]of grammarTimers){clearTimeout(timer);grammarTimers.delete(index);void save(details).catch(()=>{});}await saveTail;}
 window.addEventListener('beforeunload',e=>{if(pendingWrites||grammarTimers.size||saveFailed){e.preventDefault();e.returnValue='';}});
 async function history(){
  const local=await db.get(historyKey)||[],known=new Map(local.map(a=>[a.id,a]));
  for(const e of getEvents())if(e.itemId===definition?.id&&e.kind==='assessment'&&e.details?.action==='start'&&e.details.attemptId&&!known.has(e.details.attemptId))known.set(e.details.attemptId,{id:e.details.attemptId,startedAt:e.at});
  return [...known.values()];
 }
 function limits(){return {maxLookupsPerPassage:5,minCorrect:8,grammarCount:3,...definition.criteria};}
 async function page(){
  if(!definition?.passages?.length){main.innerHTML='<h1>月底阅读检测</h1><p>检测材料尚未准备完整，当前没有真实综合检测结果。</p>';return;}
  await flush();run=deriveAssessmentRun(definition,getEvents(),await db.get(key));if(run){if(!run.scope)run.scope=syncScope();await db.put(key,run);}main.classList.add('reading');
  if(!run){const previous=await history();main.innerHTML=`<h1>月底阅读检测</h1><p>两篇未见过的300–500字短文。每篇查词不超过5次；10道理解题至少答对8道；写出并自评3个已学语法结构。</p><p>查词次数与每一次答案会保存。语法说明由你对照解析后自评，不由程序判定语言是否正确。</p>${syncScope()?`<p class="muted">${esc(syncScope())}</p>`:''}${previous.length?'<p class="warning">此学习档案曾开始过这套材料。再次检测会标记为重测，不满足“未见过”条件。</p>':'<label class="check"><input id="assessment-unseen" type="checkbox">我确认此前没有读过这两篇检测材料。</label>'}${button('开始检测','start')}<p><a href="#home">返回学习首页</a></p>`;return;}
  if(run.completed){renderResult();return;}
  if(run.index>=definition.passages.length){renderGrammar();return;}
  const p=definition.passages[run.index],answers=run.answers[run.index];
  main.innerHTML=`<p class="eyebrow">综合检测 · 第 ${run.index+1} / ${definition.passages.length} 篇 · ${p.characterCount} 字</p><h1>${esc(p.title)}</h1><p>本篇已查词 <span id="assessment-lookup-count">${run.lookups[run.index]}</span> 次 / ${limits().maxLookupsPerPassage} 次。超过次数仍可读完，结果会如实记录。</p><p class="muted">点词可查义；在外部词典查词后，请登记次数。检测提交前不展开翻译和拆句。每题的第一次选择会保存，请想好再选。刷新前请等“答案已保存”。</p>${p.sentences.map(s=>`<p class="sentence" lang="ko">${sentenceText(s).split(/\s+/).map(t=>`<button data-assessment-token="${esc(t)}">${esc(t)}</button>`).join(' ')}</p>`).join('')}<aside id="assessment-lookup" class="lookup" aria-live="polite" hidden></aside>${button('登记一次外部查词','manual-lookup')}<h2>理解题</h2>${p.questions.map((q,i)=>`<fieldset class="question"><legend>${i+1}. ${esc(questionText(q))}</legend>${q.options.map((o,j)=>`<label class="choice"><input type="radio" name="assessment-q${i}" data-assessment-question="${i}" value="${j}" ${answers[i]===j?'checked':''} ${answers[i]!==null?'disabled':''}>${esc(o)}</label>`).join('')}</fieldset>`).join('')}<p id="assessment-save-status" role="status" aria-live="polite">答案已保存。</p><div class="actions">${button(run.index+1===definition.passages.length?'保存答案，解释语法':'保存答案，读下一篇','next')}</div><p><a href="#home">保存并退出</a></p>`;
 }
 function renderGrammar(){
  main.innerHTML=`<h1>解释三个已学结构</h1><p>用中文说明它怎样连接成分、在句中起什么作用。先写出理解，再展开参考解析并自评。</p>${definition.grammarChecks.map((g,i)=>`<section><h2>${i+1}. ${esc(g.prompt)}</h2><label for="grammar-response-${i}">你的说明</label><textarea id="grammar-response-${i}" data-assessment-grammar="${i}" rows="3" maxlength="1500">${esc(run.grammar[i].text)}</textarea><details><summary>展开解析并对照</summary><p lang="ko">${esc(g.answer)}</p><p>${esc(g.why)}</p></details><label class="choice"><input type="checkbox" data-assessment-selfgrade="${i}" ${run.grammar[i].good?'checked':''}>对照后，我能准确解释这个结构</label></section>`).join('')}<p id="assessment-save-status" role="status" aria-live="polite">答案已保存。</p><div class="actions">${button('提交本次真实记录','finish')}</div><p class="muted">勾选是你的自评，程序不会将文字长度当作语法掌握。</p><a href="#home">保存并退出</a>`;
 }
 function outcome(){
  const correct=definition.passages.reduce((sum,p,j)=>sum+p.questions.filter((q,i)=>run.answers[j][i]===q.answer).length,0);
  const grammarGood=run.grammar.filter(g=>g.good&&g.text.trim()).length,l=limits();
  return {correct,lookups:[...run.lookups],grammarGood,unseen:run.unseen,meetsRecordedCriteria:run.unseen&&run.lookups.every(n=>n<=l.maxLookupsPerPassage)&&correct>=l.minCorrect&&grammarGood>=l.grammarCount};
 }
 function renderResult(){const result=outcome();
  main.innerHTML=`<h1>本次检测记录</h1>${run.scope?`<p class="muted">记录范围：${esc(run.scope)}</p>`:""}<p>理解题 ${result.correct} / 10；查词 ${result.lookups.map((n,i)=>`第${i+1}篇 ${n} 次`).join('，')}；语法自评 ${result.grammarGood} / 3。</p><p>${result.unseen?'用户确认首次读这两篇。':'重测：不满足未见过材料条件。'}${result.meetsRecordedCriteria?'达到本次已记录条件（语法为本人自评）。':'本次记录尚未达到全部目标。'}</p>${definition.passages.map((p,j)=>`<h2>${esc(p.title)}</h2>${p.questions.map((q,i)=>`<p>${i+1}. ${esc(questionText(q))}<br>你的答案：${esc(q.options[run.answers[j][i]])}；${run.answers[j][i]===q.answer?'正确':'错误'}。${esc(q.why)}</p>`).join('')}<details><summary>展开全文翻译与拆句</summary>${p.sentences.map(s=>`<p lang="ko">${esc(sentenceText(s))}</p><p>${esc(Array.isArray(s)?s[1]:s.translation)}</p><p>${esc(Array.isArray(s)?s[2]:s.analysis)}</p>`).join('')}</details>`).join('')}<div class="actions">${button('开始一次重测','restart')}</div><a href="#home">返回学习首页</a>`;
 }
 async function lookup(token,manual=false){
  if(!run||run.completed||run.index>=definition.passages.length)return;
  run.lookups[run.index]++;await save({action:'lookup',passage:run.index,token:manual?'external':token,count:run.lookups[run.index]});
  const count=document.getElementById('assessment-lookup-count');if(count)count.textContent=run.lookups[run.index];if(manual)return;
  const p=definition.passages[run.index],normalized=token.replace(/[\p{P}\p{S}]/gu,''),note=p.notes?.[normalized]||p.notes?.[token],lex=p.lexicon?.[normalized],matches=resolveWord(normalized);
  const box=document.getElementById('assessment-lookup');box.hidden=false;
  box.innerHTML=`${button('关闭查词','close-lookup')}<p lang="ko">${esc(token)}</p>${lex?`<p>${ko(lex.lemma)} · ${esc(lex.meaning)}</p>${note?`<p class="muted">${esc(note)}</p>`:''}`:note?`<p>${esc(note)}</p>`:matches.length?matches.map(w=>`<p>${ko(w.lemma)} · ${esc(w.meaning)}</p>`).join(''):'<p>尚无直接匹配，可能是活用形式。本次查询已计数；若另查外部词典，再登记一次外部查词。</p>'}`;
 }
 async function handleClick(b){
  if(b.dataset.assessmentToken){await lookup(b.dataset.assessmentToken);return true;}
  const a=b.dataset.assessmentAction;if(!a)return false;await flush();
  if(a==='start'||a==='restart'){
   const previous=await history();
   if(!previous.length&&!document.getElementById('assessment-unseen')?.checked)throw new Error('请确认是否未见过这两篇，再开始首次检测。');
   run={id:crypto.randomUUID(),startedAt:Date.now(),index:0,unseen:!previous.length&&a==='start',lookups:definition.passages.map(()=>0),answers:definition.passages.map(p=>p.questions.map(()=>null)),grammar:definition.grammarChecks.map(()=>({text:'',good:false,updatedAt:0})),completed:false};
   run.scope=syncScope();previous.push({id:run.id,startedAt:run.startedAt});await db.put(historyKey,previous);await save({action:'start',unseen:run.unseen,scope:run.scope});await page();
  }else if(a==='manual-lookup')await lookup('',true);
  else if(a==='close-lookup')document.getElementById('assessment-lookup').hidden=true;
  else if(a==='next'){
   if(run.answers[run.index].some(a=>a===null))throw new Error('请先回答本篇的5道题。');
   await record(definition.id,'hard','assessment','comprehension',{attemptId:run.id,action:'passage',passage:run.index,answers:run.answers[run.index],lookups:run.lookups[run.index]});run.index++;await save();await page();
  }else if(a==='finish'){
   if(run.grammar.some(g=>!g.text.trim()))throw new Error('请写出三个结构的说明，再提交。');
   run=deriveAssessmentRun(definition,getEvents(),run);run.completed=true;run.finishedAt=Date.now();const result=outcome();await save({action:'finish',...result,scope:run.scope,answers:run.answers,grammar:run.grammar},result.meetsRecordedCriteria?'good':'again');await page();
  }return true;
 }
 async function handleChange(e){
  if(!run||run.completed)return;const d=e.target.dataset;
  if(d.assessmentQuestion!==undefined){const i=Number(d.assessmentQuestion);if(run.answers[run.index][i]!==null)return;const choice=Number(e.target.value);run.answers[run.index][i]=choice;main.querySelectorAll(`[data-assessment-question="${i}"]`).forEach(el=>el.disabled=true);await save({action:'answer',passage:run.index,question:i,choice});}
  else if(d.assessmentGrammar!==undefined||d.assessmentSelfgrade!==undefined){
   const index=Number(d.assessmentGrammar??d.assessmentSelfgrade),g=run.grammar[index];if(d.assessmentGrammar!==undefined)g.text=e.target.value;else g.good=e.target.checked;g.updatedAt=Math.max(Date.now(),(g.updatedAt||0)+1);
   const previous=grammarTimers.get(index);if(previous)clearTimeout(previous.timer);grammarTimers.delete(index);
   const details={action:'grammar',index,...g};
   if(d.assessmentSelfgrade!==undefined)await save(details);
   else{const timer=setTimeout(()=>{grammarTimers.delete(index);void save(details).catch(()=>{});},350);grammarTimers.set(index,{timer,details});await save();saveStatus();}
  }
 }
 return {page,handleClick,handleChange,flush};
}
