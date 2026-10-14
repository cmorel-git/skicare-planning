/* Skicare Club — planning éditorial (Supabase) */
const SB_URL='https://gtmpztajutsddohujrti.supabase.co';
const SB_KEY='sb_publishable_-ke6_-lAKnmE0Lx6aeP-lg_utoQmFwc';
const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,detectSessionInUrl:true,flowType:'pkce'}});

const RUBS=[
 {k:'temps-fort',l:'Temps fort',c:'--r1'},
 {k:'push',l:'Push produits',c:'--r2'},
 {k:'mono',l:'Mono produit',c:'--r3'},
 {k:'routine',l:'Routine',c:'--r4'},
 {k:'skicare',l:'SkiCare',c:'--r5'},
 {k:'lifestyle',l:'Lifestyle Megève',c:'--r6'},
 {k:'crea',l:'Post créa',c:'--r7'}];
const CANAUX=['Instagram','Site / e-shop','Newsletter','Boutique','Autre'];
const STATUTS=['Idée','À construire','À shooter','À produire','Prêt / à finaliser','Validé','Publié'];
const SCLASS={'Idée':'s-idee','À construire':'s-wip','À shooter':'s-wip','À produire':'s-wip','Prêt / à finaliser':'s-ready','Validé':'s-ok','Publié':'s-pub'};
const TSTAT=['À faire','En cours','Fait'];
const TKEY={'À faire':'k-faire','En cours':'k-cours','Fait':'k-fait'};
const TCLS={'À faire':'s-idee','En cours':'s-wip','Fait':'s-ok'};
const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DOW=['lun','mar','mer','jeu','ven','sam','dim'];

const S={posts:new Map(),tasks:new Map(),todos:new Map(),members:new Map(),me:null,view:'themes',month:null,metaMonth:null,ready:false,
  todoFilter:'open',who:'all',calY:null,calM:null,showSubs:true,canal:'all',drawerPost:null};
try{const v=localStorage.getItem('sc_view');if(v)S.view=(v==='weeks'?'themes':v);const w=localStorage.getItem('sc_who');if(w)S.who=w;if(localStorage.getItem('sc_subs')==='0')S.showSubs=false;const c=localStorage.getItem('sc_canal');if(c)S.canal=c;}catch(e){}

const $=s=>document.querySelector(s);
const el=(tag,attrs={},...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='style')e.style.cssText=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)));}return e;};
const rub=k=>RUBS.find(r=>r.k===k)||{k,l:k||'—',c:'--muted'};
const pd=s=>{if(!s)return null;const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monday=d=>{const x=new Date(d);const wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);return x;};
const today=()=>{const t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate());};
const fmtShort=d=>`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
const mName=id=>(id&&S.members.get(id)?.name)||'';
const activeMembers=()=>[...S.members.values()].filter(m=>m.active).sort((a,b)=>a.name.localeCompare(b.name));
const tStat=t=>TSTAT.includes(t.statut)?t.statut:(t.statut==='Bloqué'?'En cours':'À faire');
const isDone=t=>tStat(t)==='Fait';
const eur=n=>(Number(n)||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const dayCount=(a,b)=>Math.round((pd(b)-pd(a))/864e5)+1;
const subsFor=pid=>[...S.todos.values()].filter(t=>t.post_id===pid).sort((a,b)=>(isDone(a)-isDone(b))||(a.due||'9999').localeCompare(b.due||'9999')||(a.created_at||'').localeCompare(b.created_at||''));
function toast(msg){const t=el('div',{class:'toast',role:'status'},msg);$('#toastHost').replaceChildren(t);setTimeout(()=>t.remove(),2400);}
function memberSelect(id,value,label,extra={}){
  return el('select',{id,'aria-label':label,...extra},el('option',{value:''},'— personne —'),
    ...activeMembers().map(m=>el('option',{value:m.id,selected:m.id===value?true:null},m.name)),
    (value&&!S.members.get(value)?.active&&S.members.get(value))?el('option',{value,selected:true},mName(value)+' (inactif)'):null);
}

/* ---------- connexion ---------- */
function showLogin(msg){
  $('#app').hidden=true;
  const box=$('#login');box.hidden=false;
  box.replaceChildren(el('form',{class:'login-card',onsubmit:async e=>{e.preventDefault();
      const email=$('#loginEmail').value.trim().toLowerCase();if(!email)return;
      const btn=e.currentTarget.querySelector('button');btn.disabled=true;
      const {data:ok,error:er}=await sb.rpc('is_allowed_email',{e:email});
      if(er||!ok){$('#loginMsg').textContent=er?'Connexion impossible pour le moment, réessaie.':'Cette adresse ne fait pas partie de l’équipe du planning. Demande à Chloé de t’ajouter.';btn.disabled=false;return;}
      const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
      btn.disabled=false;
      $('#loginMsg').textContent=error?('Envoi du lien impossible : '+error.message):'C’est envoyé. Ouvre le lien reçu par e-mail sur cet appareil.';}},
    el('img',{class:'crest',src:document.querySelector('.crest')?.src||'',alt:'Skicare Club by Pure Altitude',style:'width:120px;height:120px;align-self:center'}),
    el('h1',{style:'text-align:center'},'Planning ',el('em',{},'éditorial')),
    el('p',{class:'owner',style:'text-align:center'},'Connecte-toi avec ton adresse e-mail : tu reçois un lien de connexion, sans mot de passe.'),
    el('div',{class:'field'},el('label',{for:'loginEmail'},'Adresse e-mail'),el('input',{type:'email',id:'loginEmail',required:true,autocomplete:'email',placeholder:'prenom@mhsibuet.com'})),
    el('button',{class:'btn primary',type:'submit'},'Recevoir mon lien de connexion'),
    el('p',{id:'loginMsg',class:'owner',role:'status',style:'text-align:center;min-height:1.5em'},msg||'')));
}

/* ---------- données ---------- */
async function loadAll(){
  const [p,t,m,k]=await Promise.all([sb.from('posts').select('*'),sb.from('todos').select('*'),sb.from('team_members').select('*'),sb.from('tasks').select('*')]);
  if(p.error||t.error||m.error||k.error){showNotice('Impossible de charger le planning. Recharge la page.');return;}
  S.posts=new Map(p.data.map(r=>[r.id,r]));S.todos=new Map(t.data.map(r=>[r.id,r]));S.members=new Map(m.data.map(r=>[r.id,r]));S.tasks=new Map(k.data.map(r=>[r.id,r]));
  S.ready=true;render();refreshDrawerSubs();
}
function applyChange(map,payload){
  if(payload.eventType==='DELETE')map.delete(payload.old.id);else map.set(payload.new.id,payload.new);
}
function subscribe(){
  sb.channel('planning')
    .on('postgres_changes',{event:'*',schema:'public',table:'posts'},p=>{applyChange(S.posts,p);render();})
    .on('postgres_changes',{event:'*',schema:'public',table:'todos'},p=>{applyChange(S.todos,p);render();refreshDrawerSubs();})
    .on('postgres_changes',{event:'*',schema:'public',table:'tasks'},p=>{applyChange(S.tasks,p);render();refreshDrawerSubs();})
    .on('postgres_changes',{event:'*',schema:'public',table:'team_members'},p=>{applyChange(S.members,p);render();})
    .subscribe();
  // filet de sécurité si la connexion temps réel décroche
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadAll();});
}

/* ---------- rendu ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{S.view=b.dataset.view;try{localStorage.setItem('sc_view',S.view)}catch(e){}render();}));
$('#newPost').addEventListener('click',()=>openPost(null));
function legend(){$('#legend').replaceChildren();}

function render(){
  document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===S.view)));
  const open=[...S.todos.values()].filter(t=>!isDone(t)).length;
  $('#todoBadge').textContent=open?`(${open})`:'';
  const v=$('#view');
  if(!S.ready){v.replaceChildren(el('div',{class:'empty'},'Chargement du planning…'));return;}
  const keep=[...v.querySelectorAll('input[id],select[id],textarea[id]')].filter(n=>n.dataset.dirty||n.id.startsWith('t')||n.id==='mName'||n.id==='mEmail').map(n=>[n.id,n.value]);
  const ae=document.activeElement;const focused=ae&&v.contains(ae)?ae.id:null;
  const sel=focused&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  const sy=window.scrollY;
  if(S.view==='themes')v.replaceChildren(renderThemes());
  else if(S.view==='meta')v.replaceChildren(renderResults());
  else if(S.view==='month')v.replaceChildren(renderMonth());
  else if(S.view==='team')v.replaceChildren(renderTeam());
  else v.replaceChildren(renderTodos());
  keep.forEach(([i,val])=>{const n=document.getElementById(i);if(n&&val&&n.value!==val){n.value=val;n.dataset.dirty='1';}});
  if(focused){const n=document.getElementById(focused);if(n){n.focus({preventScroll:true});if(sel&&n.setSelectionRange)try{n.setSelectionRange(sel[0],sel[1])}catch(e){}}}
  window.scrollTo(0,sy);
}

/* ---------- thématiques ---------- */
const canalOk=p=>true;
function monthKeys(){const set=new Set();for(const p of S.posts.values()){if(p.date)set.add(p.date.slice(0,7));}return [...set].sort();}
const monthLabel=k=>{const[y,m]=k.split('-');return `${MONTHS[+m-1]} ${y}`;};
function renderThemes(){
  const frag=el('div',{class:'weeks'});
  const keys=monthKeys();const nowKey=iso(today()).slice(0,7);
  if(S.month==null){S.month=keys.find(k=>k>=nowKey)||keys[keys.length-1]||'all';}
  const hasIdeas=[...S.posts.values()].some(p=>!p.date);
  frag.append(el('div',{class:'months'},
    el('button',{class:'chip','aria-pressed':String(S.month==='all'),onclick:()=>{S.month='all';render();}},'Tout'),
    ...keys.map(k=>{const[y,m]=k.split('-');return el('button',{class:'chip','aria-pressed':String(S.month===k),onclick:()=>{S.month=k;render();}},`${MONTHS[+m-1]} ${y.slice(2)}`);}),
    hasIdeas?el('button',{class:'chip','aria-pressed':String(S.month==='ideas'),onclick:()=>{S.month='ideas';render();}},'Sans date'):null,
    el('button',{class:'chip subs-toggle','aria-pressed':String(S.showSubs),onclick:()=>{S.showSubs=!S.showSubs;try{localStorage.setItem('sc_subs',S.showSubs?'1':'0')}catch(e){}render();}},S.showSubs?'Tâches affichées':'Tâches masquées')));
  if(S.posts.size===0){frag.append(el('div',{class:'empty'},'Aucune thématique pour l’instant. Ajoute la première avec « + Nouvelle thématique ».'));return frag;}
  if(S.month==='ideas'){
    const ideas=[...S.posts.values()].filter(p=>!p.date&&canalOk(p)).sort((a,b)=>(a.title||'').localeCompare(b.title||''));
    frag.append(el('section',{class:'week'},el('div',{class:'week-h'},el('h3',{},'Thématiques sans date'),el('span',{class:'quota ok'},`${ideas.length}`)),el('div',{class:'rows'},ideas.map(rowFor))));
    return frag;
  }
  const dated=[...S.posts.values()].filter(p=>p.date&&canalOk(p)&&(S.month==='all'||p.date.startsWith(S.month))).sort((a,b)=>a.date.localeCompare(b.date)||(a.title||'').localeCompare(b.title||''));
  if(!dated.length){frag.append(el('div',{class:'empty'},'Aucune thématique datée sur cette période.'));return frag;}
  const groups=new Map();
  for(const p of dated){const k=p.date.slice(0,7);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
  for(const[k,list]of groups){
    frag.append(el('section',{class:'week'+(k===nowKey?' current':'')},
      el('div',{class:'week-h'},el('h3',{},monthLabel(k)),el('span',{class:'quota ok'},`${list.length} thématique${list.length>1?'s':''}`)),
      el('div',{class:'rows'},list.map(rowFor))));
  }
  return frag;
}
const TYPES=['Post Insta','Newsletter','Pub Meta','Autre'];
const TYPECLS={'Post Insta':'ty-insta','Newsletter':'ty-nl','Pub Meta':'ty-meta','Autre':'ty-autre'};
const tasksFor=pid=>[...S.tasks.values()].filter(k=>k.post_id===pid).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||''));
const subsOfTask=tid=>[...S.todos.values()].filter(t=>t.task_id===tid).sort((a,b)=>(isDone(a)-isDone(b))||(a.due||'9999').localeCompare(b.due||'9999')||(a.created_at||'').localeCompare(b.created_at||''));
const enterBlur=e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur();}};
function rowFor(p){
  const d=pd(p.date);
  const ks=tasksFor(p.id);const tds=subsFor(p.id);const openT=tds.filter(t=>!isDone(t)).length;
  const metas=ks.filter(k=>k.type==='Pub Meta');const metaBudget=metas.reduce((s,k)=>s+(Number(k.meta_budget)||0),0);
  const row=el('button',{class:'row',onclick:()=>openPost(p.id)},
    el('div',{class:'d'},d?[el('b',{},fmtShort(d)),DOW[(d.getDay()+6)%7]]:el('b',{},'—')),
    el('div',{class:'t'},p.title||'Sans titre',p.notes?el('div',{class:'notes'},p.notes):null),
    el('div',{class:'meta'},
      ks.length?el('span',{class:'tcount'},`${ks.length} tâche${ks.length>1?'s':''}`):null,
      tds.length?el('span',{class:'tcount'},`${tds.length-openT}/${tds.length} sous-tâches faites`):null,
      metas.length?el('span',{class:'metapill'},`Meta · ${eur(metaBudget)}`):null));
  if(!S.showSubs)return el('div',{class:'post'},row);
  const orphans=tds.filter(t=>!t.task_id);
  return el('div',{class:'post'},row,el('div',{class:'subs'},ks.map(taskBlock),orphans.length?orphanBlock(orphans):null,addTaskForm(p.id)));
}
function orphanBlock(list){return el('div',{class:'task ty-autre'},el('div',{class:'task-h'},el('span',{class:'ttype-ro'},'Sans tâche'),el('span',{class:'owner'},'Sous-tâches créées avant la nouvelle organisation')),el('div',{class:'subs2'},list.map(t=>subRow(t))));}
function taskBlock(k,ctx){
  const subs=subsOfTask(k.id);const done=subs.filter(isDone).length;const isMeta=k.type==='Pub Meta';
  const pre=(ctx||'')+k.id;
  return el('div',{class:'task '+(TYPECLS[k.type]||'ty-autre')},
    el('div',{class:'task-h'},
      el('select',{class:'ttype',id:'kt-'+pre,'aria-label':'Type de tâche',onchange:e=>updateTask(k.id,{type:e.target.value})},TYPES.map(t=>el('option',{value:t,selected:t===k.type?true:null},t))),
      el('input',{type:'text',class:'ktxt',id:'kx-'+pre,value:k.text||'',placeholder:'Intitulé de la tâche','aria-label':'Tâche',onkeydown:enterBlur,oninput:e=>{e.target.dataset.dirty='1';},
        onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(v!==(k.text||''))updateTask(k.id,{text:v});}}),
      el('span',{class:'tcount'},subs.length?`${done}/${subs.length}`:''),
      el('button',{class:'x',type:'button','aria-label':'Supprimer la tâche et ses sous-tâches',title:'Supprimer la tâche et ses sous-tâches',onclick:e=>delInline(e.currentTarget,()=>removeTask(k.id))},'×')),
    isMeta?el('div',{class:'st-meta on'},
      el('span',{class:'metachk'},'Diffusion'),
      el('label',{class:'mf'},'Du',el('input',{type:'date',id:'ms-'+pre,value:k.meta_start||'','aria-label':'Début de diffusion',onkeydown:enterBlur,
        onchange:e=>{const v=e.target.value||null;if(v===k.meta_start)return;const patch={meta_start:v};if(v&&k.meta_end&&k.meta_end<v)patch.meta_end=v;updateTask(k.id,patch);}})),
      el('label',{class:'mf'},'au',el('input',{type:'date',id:'me2-'+pre,value:k.meta_end||'',min:k.meta_start||null,'aria-label':'Fin de diffusion',onkeydown:enterBlur,
        onchange:e=>{const v=e.target.value||null;if(v&&k.meta_start&&v<k.meta_start){toast('La fin doit être après le début');e.target.value=k.meta_end||'';return;}if(v!==k.meta_end)updateTask(k.id,{meta_end:v});}})),
      el('label',{class:'mf'},'Budget',el('input',{type:'number',id:'mb-'+pre,min:'0',step:'1',inputmode:'decimal',value:k.meta_budget??'',placeholder:'0','aria-label':'Budget Meta en euros',onkeydown:enterBlur,oninput:e=>{e.target.dataset.dirty='1';},
        onchange:e=>{delete e.target.dataset.dirty;const raw=e.target.value.replace(',','.');const v=raw===''?null:Math.max(0,Number(raw));if(raw!==''&&isNaN(v)){e.target.value=k.meta_budget??'';return;}if(v!==(k.meta_budget==null?null:Number(k.meta_budget)))updateTask(k.id,{meta_budget:v});}}),'€'),
      (k.meta_start&&k.meta_end)?el('span',{class:'owner'},`${dayCount(k.meta_start,k.meta_end)} j`+(k.meta_budget?` · ${eur(k.meta_budget/dayCount(k.meta_start,k.meta_end))}/j`:'')):null):null,
    el('div',{class:'subs2'},subs.map(t=>subRow(t)),addSubForm(k,ctx)));
}
function addTaskForm(pid,ctx){
  const id=(ctx||'')+'nk-'+pid;
  return el('form',{class:'addtask',onsubmit:async e=>{e.preventDefault();e.stopPropagation();const f=e.currentTarget;const n=f.querySelector('input');const ty=f.querySelector('select').value;const v=n.value.trim();
      n.value='';delete n.dataset.dirty;await addTask({post_id:pid,type:ty,text:v||ty});}},
    el('select',{id:id+'-t','aria-label':'Type de la nouvelle tâche'},TYPES.map(t=>el('option',{value:t},t))),
    el('input',{type:'text',id,placeholder:'+ Nouvelle tâche (ex. Newsletter lancement)','aria-label':'Nouvelle tâche',oninput:e=>{e.target.dataset.dirty='1';}}),
    el('button',{class:'btn',type:'submit'},'Ajouter la tâche'));
}
function addSubForm(k,ctx){
  const id=(ctx||'')+'ns-'+k.id;
  return el('form',{class:'addsub',onsubmit:async e=>{e.preventDefault();e.stopPropagation();const n=e.currentTarget.querySelector('input');const v=n.value.trim();if(!v)return;n.value='';delete n.dataset.dirty;await addTodo({text:v,task_id:k.id,post_id:k.post_id});}},
    el('input',{type:'text',id,placeholder:'+ Ajouter une sous-tâche','aria-label':'Nouvelle sous-tâche',oninput:e=>{e.target.dataset.dirty='1';}}),
    el('button',{class:'btn',type:'submit'},'Ajouter'));
}
function subRow(t,showCtx){
  const st=tStat(t);const t0=iso(today());
  const late=!isDone(t)&&t.due&&t.due<t0;
  const k=showCtx&&t.task_id?S.tasks.get(t.task_id):null;const p=showCtx&&t.post_id?S.posts.get(t.post_id):null;
  return el('div',{class:'st '+TKEY[st]},
    el('select',{class:'status '+TCLS[st],id:'ss-'+t.id,'aria-label':'Statut',onchange:e=>updateTodo(t.id,{statut:e.target.value})},TSTAT.map(s=>el('option',{value:s,selected:s===st?true:null},s))),
    el('input',{type:'text',class:'txt',id:'sx-'+t.id,value:t.text||'','aria-label':'Sous-tâche',onkeydown:enterBlur,oninput:e=>{e.target.dataset.dirty='1';},
      onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(!v){e.target.value=t.text;return;}if(v!==t.text)updateTodo(t.id,{text:v});}}),
    memberSelect('sa-'+t.id,t.assignee_id,'Personne',{class:'who-in',onchange:e=>updateTodo(t.id,{assignee_id:e.target.value||null})}),
    el('input',{type:'date',class:'due-in'+(late?' late':''),id:'sd-'+t.id,value:t.due||'','aria-label':'Date',title:late?'En retard':'Date',onkeydown:enterBlur,
      onchange:e=>{const v=e.target.value||null;if(v!==t.due)updateTodo(t.id,{due:v});}}),
    el('button',{class:'x',type:'button','aria-label':'Supprimer la sous-tâche',title:'Supprimer',onclick:e=>delInline(e.currentTarget,()=>removeTodo(t.id))},'×'),
    el('div',{class:'st-more'},
      el('input',{type:'text',class:'fmt',id:'sf-'+t.id,value:t.format||'',placeholder:'Format (Reel, carrousel, story…)','aria-label':'Format',onkeydown:enterBlur,oninput:e=>{e.target.dataset.dirty='1';},
        onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(v!==(t.format||''))updateTodo(t.id,{format:v});}}),
      autoGrow(el('textarea',{class:'cnt',id:'sc-'+t.id,rows:'1',placeholder:'Brief','aria-label':'Brief',oninput:e=>{e.target.dataset.dirty='1';fit(e.target);},
        onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(v!==(t.contenu||''))updateTodo(t.id,{contenu:v});}}),t.contenu||'')),
    (k||p)?el('button',{class:'postlink',type:'button',onclick:()=>p?openPost(p.id):null},'↳ '+(p?(p.date?fmtShort(pd(p.date))+' · ':'')+(p.title||'thématique'):'')+(k?' › '+(k.text||k.type):'')):null);
}
function fit(ta){ta.style.height='auto';ta.style.height=(ta.scrollHeight+2)+'px';}
function autoGrow(ta,val){ta.value=val;requestAnimationFrame(()=>fit(ta));return ta;}
function delInline(btn,fn){
  if(btn.dataset.armed){fn();return;}
  btn.dataset.armed='1';btn.textContent='Supprimer ?';btn.style.fontSize='12px';btn.style.color='var(--badge)';
  setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent='×';btn.style.fontSize='';btn.style.color='';}},3000);
}

/* ---------- mois ---------- */
function renderMonth(){
  if(S.calY==null){const keys=monthKeys();const nowKey=iso(today()).slice(0,7);const k=keys.find(x=>x>=nowKey)||nowKey;S.calY=+k.slice(0,4);S.calM=+k.slice(5,7)-1;}
  const start=monday(new Date(S.calY,S.calM,1));
  const box=el('div',{style:'display:flex;flex-direction:column;gap:12px'});
  box.append(el('div',{class:'cal-nav'},
    el('button',{class:'btn',onclick:()=>{S.calM--;if(S.calM<0){S.calM=11;S.calY--;}render();},'aria-label':'Mois précédent'},'‹'),
    el('h2',{},`${MONTHS[S.calM]} ${S.calY}`),
    el('button',{class:'btn',onclick:()=>{S.calM++;if(S.calM>11){S.calM=0;S.calY++;}render();},'aria-label':'Mois suivant'},'›')));
  const grid=el('div',{class:'cal'},DOW.map(d=>el('div',{class:'dow'},d)));
  const byDate=new Map();for(const p of S.posts.values()){if(!p.date||!canalOk(p))continue;if(!byDate.has(p.date))byDate.set(p.date,[]);byDate.get(p.date).push(p);}
  const tIso=iso(today());
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);
    if(i>=35&&d.getMonth()!==S.calM)break;
    const k=iso(d);const out=d.getMonth()!==S.calM;
    const cell=el('div',{class:'cell'+(out?' out':'')+(k===tIso?' today':''),title:'Ajouter une thématique ce jour',style:'cursor:copy',onclick:()=>openPost(null,k)},el('span',{class:'n'},d.getDate()));
    for(const p of (byDate.get(k)||[])){cell.append(el('button',{class:'ev',style:'--rc:var(--accent)',title:p.title,onclick:e=>{e.stopPropagation();openPost(p.id);}},p.title||'Sans titre'));}
    grid.append(cell);
  }
  box.append(el('div',{class:'cal-wrap'},grid));
  return box;
}

/* ---------- plannings & résultats ---------- */
function metaMonths(c){const out=[];if(!c.meta_start)return out;const e=c.meta_end||c.meta_start;let d=new Date(pd(c.meta_start).getFullYear(),pd(c.meta_start).getMonth(),1);const end=pd(e);while(d<=end){out.push(iso(d).slice(0,7));d=new Date(d.getFullYear(),d.getMonth()+1,1);}return out;}
// part du budget qui tombe dans [from,to] (au prorata des jours de diffusion)
function budgetIn(c,from,to){if(!c.meta_budget||!c.meta_start)return 0;const s0=c.meta_start,e0=c.meta_end||c.meta_start;const s1=s0>from?s0:from,e1=e0<to?e0:to;if(e1<s1)return 0;return Number(c.meta_budget)*dayCount(s1,e1)/dayCount(s0,e0);}
const monthBounds=k=>{const[y,m]=k.split('-').map(Number);return [iso(new Date(y,m-1,1)),iso(new Date(y,m,0))];};
const num=v=>(v===null||v===undefined||v==='')?null:Number(v);
const fmtN=n=>n==null||isNaN(n)?'—':Number(n).toLocaleString('fr-FR',{maximumFractionDigits:0});
const fmtPct=n=>n==null||!isFinite(n)?'—':n.toLocaleString('fr-FR',{maximumFractionDigits:1})+' %';
const fmtX=n=>n==null||!isFinite(n)?'—':n.toLocaleString('fr-FR',{maximumFractionDigits:2});
const RES={
  'Pub Meta':[['spend','Dépensé (€)'],['impressions','Impressions'],['reach','Couverture'],['clicks','Clics'],['purchases','Achats'],['revenue','CA (€)']],
  'Newsletter':[['sent','Envois'],['open_rate','Ouverture (%)'],['click_rate','Clics (%)'],['unsubs','Désinscrits'],['revenue','CA (€)']],
  'Post Insta':[['reach','Portée'],['impressions','Impressions'],['likes','J’aime'],['comments','Comment.'],['shares','Partages'],['saves','Enreg.']]};
function resInput(k,key,label){
  const v=k.results?.[key];
  return el('input',{type:'number',class:'rin',id:'r-'+k.id+'-'+key,min:'0',step:'any',inputmode:'decimal',value:v??'','aria-label':label+' · '+(k.text||k.type),onkeydown:enterBlur,oninput:e=>{e.target.dataset.dirty='1';},
    onchange:e=>{delete e.target.dataset.dirty;const raw=e.target.value.replace(',','.');const val=raw===''?null:Number(raw);if(raw!==''&&(isNaN(val)||val<0)){e.target.value=v??'';return;}
      const cur=S.tasks.get(k.id)?.results||{};const next={...cur};if(val==null)delete next[key];else next[key]=val;updateTask(k.id,{results:next},true);}});
}
const themeOf=k=>k.post_id?S.posts.get(k.post_id):null;
const kDate=k=>themeOf(k)?.date||null;
function renderResults(){
  const box=el('div',{class:'todo-layout'});
  const all=[...S.tasks.values()];
  const metas=all.filter(k=>k.type==='Pub Meta'),nls=all.filter(k=>k.type==='Newsletter'),instas=all.filter(k=>k.type==='Post Insta');
  const keys=[...new Set([...metas.flatMap(metaMonths),...[...nls,...instas].map(kDate).filter(Boolean).map(d=>d.slice(0,7))])].sort();
  const nowKey=iso(today()).slice(0,7);
  if(S.metaMonth==null||(S.metaMonth!=='all'&&!keys.includes(S.metaMonth)))S.metaMonth=keys.includes(nowKey)?nowKey:(keys.find(k=>k>nowKey)||'all');
  box.append(el('div',{class:'months'},
    el('button',{class:'chip','aria-pressed':String(S.metaMonth==='all'),onclick:()=>{S.metaMonth='all';render();}},'Toute la campagne'),
    ...keys.map(k=>el('button',{class:'chip','aria-pressed':String(S.metaMonth===k),onclick:()=>{S.metaMonth=k;render();}},monthLabel(k)))));
  box.append(metaSection(metas,keys),nlSection(nls),instaSection(instas));
  return box;
}
function inMonth(k){if(S.metaMonth==='all')return true;const d=kDate(k);return !!d&&d.startsWith(S.metaMonth);}
function sectionHead(title,sub){return el('div',{class:'sec-h'},el('h2',{},title),sub?el('span',{class:'owner'},sub):null);}
function openTheme(k){const p=themeOf(k);if(p)openPost(p.id);}
function themeCell(k){const p=themeOf(k);return el('td',{},el('button',{class:'linkbtn',type:'button',onclick:()=>openTheme(k)},p?p.title:'—'));}

function metaSection(all,keys){
  const sec=el('section',{class:'rsec'});
  sec.append(sectionHead('Pubs Meta','Planning, budget et résultats'));
  if(!all.length){sec.append(el('div',{class:'empty'},'Aucune pub Meta. Ajoute une tâche de type « Pub Meta » dans une thématique, avec ses dates et son budget.'));return sec;}
  const dated=all.filter(k=>k.meta_start);const incomplete=all.filter(k=>!k.meta_start||!k.meta_end||!k.meta_budget);
  let from,to;
  if(S.metaMonth==='all'){from=dated.reduce((m,k)=>k.meta_start<m?k.meta_start:m,'9999-12-31');to=dated.reduce((m,k)=>{const e=k.meta_end||k.meta_start;return e>m?e:m;},'0000-01-01');}
  else [from,to]=monthBounds(S.metaMonth);
  const inPeriod=dated.filter(k=>(k.meta_end||k.meta_start)>=from&&k.meta_start<=to).sort((a,b)=>a.meta_start.localeCompare(b.meta_start)||(a.meta_end||'').localeCompare(b.meta_end||''));
  const total=inPeriod.reduce((s,k)=>s+budgetIn(k,from,to),0);
  const t0=iso(today());const live=dated.filter(k=>k.meta_start<=t0&&(k.meta_end||k.meta_start)>=t0);
  const rows=[...new Set([...inPeriod,...(S.metaMonth==='all'?all.filter(k=>!k.meta_start):[])])];
  const sum=key=>rows.reduce((s,k)=>s+(num(k.results?.[key])||0),0);
  const spend=sum('spend'),rev=sum('revenue');
  sec.append(el('div',{class:'kpis'},
    el('div',{class:'kpi'},el('span',{},S.metaMonth==='all'?'Budget total':'Budget '+monthLabel(S.metaMonth)),el('b',{},eur(total)),el('small',{},S.metaMonth==='all'?'toutes les pubs datées':'au prorata des jours diffusés ce mois')),
    el('div',{class:'kpi'},el('span',{},'Dépensé (saisi)'),el('b',{},eur(spend)),el('small',{},`${inPeriod.length} pub${inPeriod.length>1?'s':''} sur la période`)),
    el('div',{class:'kpi'},el('span',{},'ROAS'),el('b',{},spend?fmtX(rev/spend):'—'),el('small',{},`CA ${eur(rev)} · en diffusion aujourd’hui : ${live.length}`)),
    el('div',{class:'kpi'+(incomplete.length?' warn':'')},el('span',{},'À compléter'),el('b',{},String(incomplete.length)),el('small',{},'pubs sans dates complètes ou sans budget'))));
  if(inPeriod.length){
    const span=dayCount(from,to);const pct=d=>(dayCount(from,d)-1)/span*100;const ticks=[];
    if(S.metaMonth==='all'){for(const k of keys){const[a]=monthBounds(k);if(a>=from&&a<=to)ticks.push([pct(a),MONTHS[+k.slice(5)-1].slice(0,4)+'.']);}}
    else{const n=dayCount(from,to);for(let i=1;i<=n;i+=(i===1?4:5)){const d=new Date(pd(from));d.setDate(i);ticks.push([pct(iso(d)),String(i)]);}}
    const today_=(t0>=from&&t0<=to)?()=>el('span',{class:'g-today',style:`left:${pct(t0)}%`}):()=>null;
    const g=el('div',{class:'gantt'},el('div',{class:'g-row g-head'},el('div',{class:'g-lab'}),el('div',{class:'g-track'},ticks.map(([x,l])=>el('span',{class:'g-tick',style:`left:${x}%`},l)),today_()),el('div',{class:'g-val'})));
    for(const k of inPeriod){
      const p=themeOf(k);const e0=k.meta_end||k.meta_start;const s1=k.meta_start>from?k.meta_start:from;const e1=e0<to?e0:to;
      g.append(el('button',{class:'g-row',type:'button',onclick:()=>openTheme(k),title:`${k.text} · ${fmtShort(pd(k.meta_start))} → ${fmtShort(pd(e0))}`},
        el('div',{class:'g-lab'},el('b',{},k.text||'Pub Meta'),el('small',{},p?p.title:'Sans thématique')),
        el('div',{class:'g-track'},el('span',{class:'g-bar'+(k.meta_end?'':' open'),style:`left:${pct(s1)}%;width:${Math.max(dayCount(s1,e1)/span*100,1.2)}%`},`${fmtShort(pd(k.meta_start))} → ${k.meta_end?fmtShort(pd(k.meta_end)):'?'}`),today_()),
        el('div',{class:'g-val'},k.meta_budget?eur(budgetIn(k,from,to)):el('span',{class:'owner'},'—'))));
    }
    sec.append(el('div',{class:'gantt-wrap'},g));
  }
  if(rows.length){
    const head=['Thématique','Pub','Du','Au','Budget',...RES['Pub Meta'].map(r=>r[1]),'CTR','CPC','ROAS'];
    sec.append(el('div',{class:'mtable-wrap'},el('table',{class:'mtable rtable'},
      el('thead',{},el('tr',{},head.map((h,i)=>el('th',{class:i>=4?'num':''},h)))),
      el('tbody',{},rows.map(k=>{const r=k.results||{};const ctr=num(r.impressions)?num(r.clicks)/num(r.impressions)*100:null;const cpc=num(r.clicks)?num(r.spend)/num(r.clicks):null;const roas=num(r.spend)?num(r.revenue)/num(r.spend):null;
        return el('tr',{},themeCell(k),el('td',{class:'strong'},k.text||'Pub Meta'),
          el('td',{},k.meta_start?fmtShort(pd(k.meta_start)):el('span',{class:'late'},'à définir')),el('td',{},k.meta_end?fmtShort(pd(k.meta_end)):el('span',{class:'late'},'à définir')),
          el('td',{class:'num'},k.meta_budget?eur(k.meta_budget):el('span',{class:'late'},'—')),
          ...RES['Pub Meta'].map(([key,l])=>el('td',{class:'num'},resInput(k,key,l))),
          el('td',{class:'num'},fmtPct(ctr)),el('td',{class:'num'},cpc==null||!isFinite(cpc)?'—':eur2(cpc)),el('td',{class:'num'},fmtX(roas)));})),
      el('tfoot',{},el('tr',{},el('td',{colspan:'4'},'Total'),el('td',{class:'num'},eur(rows.reduce((s,k)=>s+(Number(k.meta_budget)||0),0))),
        ...RES['Pub Meta'].map(([key])=>el('td',{class:'num'},key==='spend'||key==='revenue'?eur(sum(key)):fmtN(sum(key)))),
        el('td',{class:'num'},sum('impressions')?fmtPct(sum('clicks')/sum('impressions')*100):'—'),el('td',{class:'num'},sum('clicks')?eur2(spend/sum('clicks')):'—'),el('td',{class:'num'},spend?fmtX(rev/spend):'—'))))));
  }
  if(S.metaMonth==='all'&&keys.length&&dated.length){
    sec.append(el('div',{class:'mtable-wrap'},el('table',{class:'mtable'},
      el('thead',{},el('tr',{},el('th',{},'Mois'),el('th',{class:'num'},'Budget Meta (au prorata des jours)'))),
      el('tbody',{},keys.map(k=>{const[a,b]=monthBounds(k);const v=dated.reduce((s,c)=>s+budgetIn(c,a,b),0);return v?el('tr',{onclick:()=>{S.metaMonth=k;render();},style:'cursor:pointer'},el('td',{},monthLabel(k)),el('td',{class:'num'},eur(v))):null;})))));
  }
  return sec;
}
const eur2=n=>(Number(n)||0).toLocaleString('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
function simpleSection(type,title,sub,list,extra){
  const sec=el('section',{class:'rsec'});
  sec.append(sectionHead(title,sub));
  const rows=list.filter(inMonth).sort((a,b)=>(kDate(a)||'9999').localeCompare(kDate(b)||'9999'));
  if(!rows.length){sec.append(el('div',{class:'empty'},list.length?'Rien sur cette période.':`Aucune tâche de type « ${type} » pour l’instant.`));return sec;}
  const cols=RES[type];
  const sum=key=>rows.reduce((s,k)=>s+(num(k.results?.[key])||0),0);
  sec.append(el('div',{class:'mtable-wrap'},el('table',{class:'mtable rtable'},
    el('thead',{},el('tr',{},el('th',{},'Thématique'),el('th',{},type),el('th',{},'Date'),...cols.map(c=>el('th',{class:'num'},c[1])),...extra.map(x=>el('th',{class:'num'},x.label)))),
    el('tbody',{},rows.map(k=>{const d=kDate(k);return el('tr',{},themeCell(k),el('td',{class:'strong'},k.text||type),el('td',{},d?fmtShort(pd(d)):'—'),
      ...cols.map(([key,l])=>el('td',{class:'num'},resInput(k,key,l))),...extra.map(x=>el('td',{class:'num'},x.row(k.results||{}))));})),
    el('tfoot',{},el('tr',{},el('td',{colspan:'3'},`Total · ${rows.length}`),...cols.map(([key])=>el('td',{class:'num'},x_total(type,key,rows,sum))),...extra.map(x=>el('td',{class:'num'},x.total(rows,sum))))))));
  return sec;
}
function x_total(type,key,rows,sum){
  if(key.endsWith('_rate')){const w=rows.filter(k=>num(k.results?.[key])!=null);if(!w.length)return '—';const sw=w.reduce((s,k)=>s+(num(k.results?.sent)||0),0);
    return sw?fmtPct(w.reduce((s,k)=>s+num(k.results[key])*(num(k.results?.sent)||0),0)/sw)+' moy.':fmtPct(w.reduce((s,k)=>s+num(k.results[key]),0)/w.length)+' moy.';}
  return key==='revenue'?eur(sum(key)):fmtN(sum(key));
}
function nlSection(list){return simpleSection('Newsletter','Newsletters','Date = date de la thématique · taux en %',list,[]);}
function instaSection(list){
  const eng=r=>{const reach=num(r.reach);if(!reach)return null;return ((num(r.likes)||0)+(num(r.comments)||0)+(num(r.shares)||0)+(num(r.saves)||0))/reach*100;};
  return simpleSection('Post Insta','Publications Instagram','Engagement = (j’aime + commentaires + partages + enregistrements) / portée',list,
    [{label:'Engagement',row:r=>fmtPct(eng(r)),total:(rows,sum)=>sum('reach')?fmtPct((sum('likes')+sum('comments')+sum('shares')+sum('saves'))/sum('reach')*100):'—'}]);
}

/* ---------- to-do ---------- */
function renderTodos(){
  const box=el('div',{class:'todo-layout'});
  const postSel=el('select',{id:'tPost','aria-label':'Tâche parente'},el('option',{value:''},'Sans tâche parente'),...taskOptions());
  box.append(el('form',{class:'addbar',onsubmit:async e=>{e.preventDefault();
      const text=$('#tText').value.trim();if(!text)return;
      const k=postSel.value?S.tasks.get(postSel.value):null;await addTodo({text,assignee_id:$('#tAss').value||null,due:$('#tDue').value||null,task_id:k?k.id:null,post_id:k?k.post_id:null});
      $('#tText').value='';$('#tText').focus();}},
    el('input',{type:'text',id:'tText',placeholder:'Nouvelle tâche…','aria-label':'Tâche'}),
    memberSelect('tAss','', 'Responsable'),
    el('input',{type:'date',id:'tDue','aria-label':'Échéance'}),
    postSel,
    el('button',{class:'btn primary',type:'submit'},'Ajouter')));
  box.append(el('div',{class:'filters'},
    ...[['open','Ouvertes'],['En cours','En cours'],['Fait','Faites'],['all','Toutes']].map(([k,l])=>el('button',{class:'chip','aria-pressed':String(S.todoFilter===k),onclick:()=>{S.todoFilter=k;render();}},l)),
    el('span',{style:'width:12px'}),
    el('button',{class:'chip','aria-pressed':String(S.who==='all'),onclick:()=>setWho('all')},'Tout le monde'),
    S.me?el('button',{class:'chip','aria-pressed':String(S.who===S.me.id),onclick:()=>setWho(S.me.id)},'Mes tâches'):null,
    ...activeMembers().filter(m=>m.id!==S.me?.id).map(m=>el('button',{class:'chip','aria-pressed':String(S.who===m.id),onclick:()=>setWho(m.id)},m.name))));
  let list=[...S.todos.values()];
  if(S.todoFilter==='open')list=list.filter(t=>!isDone(t));else if(S.todoFilter!=='all')list=list.filter(t=>tStat(t)===S.todoFilter);
  if(S.who!=='all')list=list.filter(t=>t.assignee_id===S.who);
  list.sort((a,b)=>(isDone(a)-isDone(b))||(a.due||'9999').localeCompare(b.due||'9999')||(a.created_at||'').localeCompare(b.created_at||''));
  if(!list.length){box.append(el('div',{class:'empty'},S.todos.size?'Rien dans ce filtre.':'Aucune tâche. Ajoute la première ci-dessus.'));return box;}
  const ul=el('div',{class:'todos',style:'display:flex;flex-direction:column;gap:6px;padding:10px'});
  const t0=iso(today());const open=list.filter(t=>!isDone(t));
  const groups=[['En retard',open.filter(t=>t.due&&t.due<t0)],['À venir',open.filter(t=>t.due&&t.due>=t0)],['Sans échéance',open.filter(t=>!t.due)],['Faites',list.filter(isDone)]];
  for(const[h,items]of groups){if(!items.length)continue;ul.append(el('div',{class:'group-h',style:'border-radius:6px'},`${h} · ${items.length}`));items.forEach(t=>ul.append(subRow(t,true)));}
  box.append(ul);return box;
}
function setWho(p){S.who=p;try{localStorage.setItem('sc_who',p)}catch(e){}render();}
function taskOptions(){
  const groups=new Map();for(const k of S.tasks.values()){const p=k.post_id?S.posts.get(k.post_id):null;const g=p?((p.date?fmtShort(pd(p.date))+' · ':'')+p.title):'Sans thématique';if(!groups.has(g))groups.set(g,{d:p?.date||'9999',items:[]});groups.get(g).items.push(k);}
  return [...groups.entries()].sort((a,b)=>a[1].d.localeCompare(b[1].d)).map(([g,v])=>el('optgroup',{label:g},v.items.map(k=>el('option',{value:k.id},`${k.type} — ${k.text||''}`))));
}
function postOptions(sel){
  return [...S.posts.values()].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).map(p=>el('option',{value:p.id,selected:p.id===sel?true:null},`${p.date?fmtShort(pd(p.date))+' · ':''}${p.title||'Sans titre'}`));
}

/* ---------- équipe ---------- */
function renderTeam(){
  const box=el('div',{class:'todo-layout'});
  box.append(el('p',{class:'owner',style:'margin:0'},'Seules les adresses actives ici peuvent se connecter et reçoivent les mails. Une personne sans e-mail peut être responsable de tâches, mais ne reçoit rien.'));
  box.append(el('form',{class:'addbar',style:'grid-template-columns:minmax(0,1fr) minmax(0,2fr) auto',onsubmit:async e=>{e.preventDefault();
      const name=$('#mName').value.trim(),email=$('#mEmail').value.trim().toLowerCase();if(!name)return;
      const {error}=await sb.from('team_members').insert({name,email:email||null});
      if(error){toast(error.code==='23505'?'Cette adresse est déjà dans l’équipe.':'Ajout impossible : '+error.message);return;}
      $('#mName').value='';$('#mEmail').value='';toast(name+' ajouté·e à l’équipe');}},
    el('input',{type:'text',id:'mName',placeholder:'Prénom','aria-label':'Prénom'}),
    el('input',{type:'email',id:'mEmail',placeholder:'adresse@mhsibuet.com','aria-label':'E-mail'}),
    el('button',{class:'btn primary',type:'submit'},'Ajouter')));
  const list=el('div',{class:'todos'});
  for(const m of [...S.members.values()].sort((a,b)=>(b.active-a.active)||a.name.localeCompare(b.name))){
    const upd=patch=>sb.from('team_members').update(patch).eq('id',m.id).then(({error})=>{if(error)toast('Modification impossible : '+error.message);});
    list.append(el('div',{class:'todo',style:'grid-template-columns:minmax(0,1fr) auto auto;align-items:center'+(m.active?'':';opacity:.55')},
      el('div',{class:'tx'},el('div',{class:'l'},m.name+(m.id===S.me?.id?' (toi)':'')),
        el('input',{type:'email',id:'me-'+m.id,value:m.email||'',placeholder:'pas d’e-mail','aria-label':'E-mail de '+m.name,style:'margin-top:4px;max-width:340px',
          onchange:e=>{const v=e.target.value.trim().toLowerCase()||null;if(v!==m.email)upd({email:v});}})),
      el('label',{class:'owner',style:'display:flex;gap:6px;align-items:center'},el('input',{type:'checkbox',id:'mn-'+m.id,checked:m.notify_done?true:null,onchange:e=>upd({notify_done:e.target.checked})}),'Mails « tâche faite »'),
      el('label',{class:'owner',style:'display:flex;gap:6px;align-items:center'},el('input',{type:'checkbox',id:'ma-'+m.id,checked:m.active?true:null,disabled:m.id===S.me?.id?true:null,onchange:e=>upd({active:e.target.checked})}),'Actif')));
  }
  box.append(list);
  return box;
}

/* ---------- éditeur de post ---------- */
function openPost(id,presetDate){
  const p=id?S.posts.get(id):{date:presetDate||'',title:'',statut:'Idée',notes:''};
  if(!p)return;
  S.drawerPost=id;
  const f=(lab,node)=>el('div',{class:'field'},el('label',{for:node.id},lab),node);
  const inp=(idn,val,ph)=>el('input',{type:'text',id:idn,value:val||'',placeholder:ph||''});
  const date=el('input',{type:'date',id:'pDate',value:p.date||''});
    const notes=el('textarea',{id:'pNotes',placeholder:'Notes visibles directement dans la liste : brief, intentions, liens…'});notes.value=p.notes||'';
  const ks=id?tasksFor(id):[];
  const sub=el('div',{id:'drawerSubs',class:'subs',style:'padding:0'},ks.map(k=>taskBlock(k,'d')));
  const delBtn=id?el('button',{class:'btn danger',type:'button',onclick:async e=>{const b=e.currentTarget;if(!b.dataset.armed){b.dataset.armed='1';b.textContent='Confirmer (supprime aussi ses tâches)';return;}await removePost(id);closeDrawer();}},'Supprimer'):el('span');
  const form=el('form',{class:'drawer',role:'dialog','aria-modal':'true','aria-label':'Thématique',onsubmit:async e=>{e.preventDefault();
      const data={date:date.value||null,title:$('#pTitle').value.trim(),notes:notes.value.trim()};
      if(!data.title){$('#pTitle').focus();return;}
      if(await savePost(id,data))closeDrawer();}},
    el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},el('h2',{},id?'Modifier la thématique':'Nouvelle thématique'),el('button',{class:'x',type:'button','aria-label':'Fermer',onclick:closeDrawer},'×')),
    f('Thématique',inp('pTitle',p.title,'Ex. Boutique de Noël ouverte')),
    f('Date',date),
    f('Notes',notes),
    id?el('div',{class:'field'},el('label',{},`Tâches (${ks.length})`),sub,addTaskForm(id,'d')):el('p',{class:'owner'},'Enregistre la thématique pour lui ajouter des tâches.'),
    el('div',{class:'actions'},delBtn,el('div',{style:'display:flex;gap:8px'},el('button',{class:'btn ghost',type:'button',onclick:closeDrawer},'Annuler'),el('button',{class:'btn primary',type:'submit'},'Enregistrer'))));
  const ov=el('div',{class:'overlay',onclick:e=>{if(e.target===ov)closeDrawer();}},form);
  $('#drawerHost').replaceChildren(ov);
  setTimeout(()=>$('#pTitle').focus(),30);
}
function closeDrawer(){S.drawerPost=null;$('#drawerHost').replaceChildren();}
function refreshDrawerSubs(){
  const box=document.getElementById('drawerSubs');if(!box||!S.drawerPost)return;
  if(box.contains(document.activeElement))return;
  box.replaceChildren(...tasksFor(S.drawerPost).map(k=>taskBlock(k,'d')));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

/* ---------- écritures ---------- */
function fail(error){toast(error?.message?.includes('JWT')?'Session expirée : recharge la page.':'Enregistrement impossible, réessaie.');console.error(error);}
async function savePost(id,data){
  const q=id?sb.from('posts').update(data).eq('id',id).select().single():sb.from('posts').insert(data).select().single();
  const {data:row,error}=await q;if(error){fail(error);return false;}
  S.posts.set(row.id,row);render();toast('Thématique enregistrée');return true;}
async function removePost(id){const {error}=await sb.from('posts').delete().eq('id',id);if(error)return fail(error);S.posts.delete(id);for(const k of [...S.tasks.values()])if(k.post_id===id)S.tasks.delete(k.id);for(const t of [...S.todos.values()])if(t.post_id===id)S.todos.delete(t.id);render();toast('Thématique supprimée');}
async function addTodo(t){const {data:row,error}=await sb.from('todos').insert(t).select().single();if(error)return fail(error);S.todos.set(row.id,row);render();refreshDrawerSubs();toast('Sous-tâche ajoutée');}
async function updateTodo(id,patch){
  const before=S.todos.get(id);
  const {data:row,error}=await sb.from('todos').update(patch).eq('id',id).select().single();if(error)return fail(error);
  S.todos.set(row.id,row);render();refreshDrawerSubs();
  if(patch.statut==='Fait'&&before?.statut!=='Fait')toast('Fait !');
}
async function removeTodo(id){const {error}=await sb.from('todos').delete().eq('id',id);if(error)return fail(error);S.todos.delete(id);render();refreshDrawerSubs();toast('Sous-tâche supprimée');}
async function addTask(k){const {data:row,error}=await sb.from('tasks').insert(k).select().single();if(error)return fail(error);S.tasks.set(row.id,row);render();refreshDrawerSubs();toast('Tâche ajoutée');}
async function updateTask(id,patch,quiet){const {data:row,error}=await sb.from('tasks').update(patch).eq('id',id).select().single();if(error)return fail(error);S.tasks.set(row.id,row);render();refreshDrawerSubs();if(quiet)toast('Résultat enregistré');}
async function removeTask(id){const {error}=await sb.from('tasks').delete().eq('id',id);if(error)return fail(error);S.tasks.delete(id);for(const t of [...S.todos.values()])if(t.task_id===id)S.todos.delete(t.id);render();refreshDrawerSubs();toast('Tâche supprimée');}
function showNotice(m){const n=$('#notice');n.textContent=m;n.hidden=false;}

/* ---------- démarrage ---------- */
legend();
$('#logout').addEventListener('click',async()=>{await sb.auth.signOut();location.reload();});
let started=false;
async function start(session){
  if(!session){showLogin();return;}
  const email=(session.user.email||'').toLowerCase();
  const {data:ms}=await sb.from('team_members').select('*');
  const me=(ms||[]).find(m=>(m.email||'').toLowerCase()===email&&m.active);
  if(!me){await sb.auth.signOut();showLogin('L’adresse '+email+' n’a pas accès au planning. Demande à Chloé de t’ajouter.');return;}
  S.me=me;$('#login').hidden=true;$('#app').hidden=false;
  $('#whoName').textContent=me.name;
  if(started)return;started=true;
  render();await loadAll();subscribe();
}
sb.auth.onAuthStateChange((ev,session)=>{if(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')setTimeout(()=>start(session),0);});
