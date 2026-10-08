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
const TSTAT=['À faire','En cours','Bloqué','Fait'];
const TKEY={'À faire':'k-faire','En cours':'k-cours','Bloqué':'k-bloque','Fait':'k-fait'};
const TCLS={'À faire':'s-idee','En cours':'s-wip','Bloqué':'s-late','Fait':'s-ok'};
const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DOW=['lun','mar','mer','jeu','ven','sam','dim'];

const S={posts:new Map(),todos:new Map(),members:new Map(),me:null,view:'weeks',month:null,ready:false,
  todoFilter:'open',who:'all',calY:null,calM:null,showSubs:true,canal:'all',drawerPost:null};
try{const v=localStorage.getItem('sc_view');if(v)S.view=v;const w=localStorage.getItem('sc_who');if(w)S.who=w;if(localStorage.getItem('sc_subs')==='0')S.showSubs=false;const c=localStorage.getItem('sc_canal');if(c)S.canal=c;}catch(e){}

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
const tStat=t=>TSTAT.includes(t.statut)?t.statut:'À faire';
const isDone=t=>tStat(t)==='Fait';
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
  const [p,t,m]=await Promise.all([sb.from('posts').select('*'),sb.from('todos').select('*'),sb.from('team_members').select('*')]);
  if(p.error||t.error||m.error){showNotice('Impossible de charger le planning. Recharge la page.');return;}
  S.posts=new Map(p.data.map(r=>[r.id,r]));S.todos=new Map(t.data.map(r=>[r.id,r]));S.members=new Map(m.data.map(r=>[r.id,r]));
  S.ready=true;render();refreshDrawerSubs();
}
function applyChange(map,payload){
  if(payload.eventType==='DELETE')map.delete(payload.old.id);else map.set(payload.new.id,payload.new);
}
function subscribe(){
  sb.channel('planning')
    .on('postgres_changes',{event:'*',schema:'public',table:'posts'},p=>{applyChange(S.posts,p);render();})
    .on('postgres_changes',{event:'*',schema:'public',table:'todos'},p=>{applyChange(S.todos,p);render();refreshDrawerSubs();})
    .on('postgres_changes',{event:'*',schema:'public',table:'team_members'},p=>{applyChange(S.members,p);render();})
    .subscribe();
  // filet de sécurité si la connexion temps réel décroche
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadAll();});
}

/* ---------- rendu ---------- */
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{S.view=b.dataset.view;try{localStorage.setItem('sc_view',S.view)}catch(e){}render();}));
$('#newPost').addEventListener('click',()=>openPost(null));
function legend(){$('#legend').replaceChildren(...RUBS.map(r=>el('span',{},el('i',{class:'dot',style:`--rc:var(${r.c})`}),r.l)));}

function render(){
  document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===S.view)));
  const open=[...S.todos.values()].filter(t=>!isDone(t)).length;
  $('#todoBadge').textContent=open?`(${open})`:'';
  const v=$('#view');
  if(!S.ready){v.replaceChildren(el('div',{class:'empty'},'Chargement du planning…'));return;}
  const keep=[...v.querySelectorAll('input[id],select[id],textarea[id]')].filter(n=>n.dataset.dirty||n.id.startsWith('t')||n.id.startsWith('m')).map(n=>[n.id,n.value]);
  const ae=document.activeElement;const focused=ae&&v.contains(ae)?ae.id:null;
  const sel=focused&&ae.selectionStart!=null?[ae.selectionStart,ae.selectionEnd]:null;
  const sy=window.scrollY;
  if(S.view==='weeks')v.replaceChildren(renderWeeks());
  else if(S.view==='month')v.replaceChildren(renderMonth());
  else if(S.view==='team')v.replaceChildren(renderTeam());
  else v.replaceChildren(renderTodos());
  keep.forEach(([i,val])=>{const n=document.getElementById(i);if(n&&val&&n.value!==val){n.value=val;n.dataset.dirty='1';}});
  if(focused){const n=document.getElementById(focused);if(n){n.focus({preventScroll:true});if(sel&&n.setSelectionRange)try{n.setSelectionRange(sel[0],sel[1])}catch(e){}}}
  window.scrollTo(0,sy);
}

/* ---------- semaines ---------- */
const canalOk=p=>S.canal==='all'||(p.canal||'Instagram')===S.canal;
function monthKeys(){const set=new Set();for(const p of S.posts.values()){if(p.date)set.add(p.date.slice(0,7));}return [...set].sort();}
function renderWeeks(){
  const frag=el('div',{class:'weeks'});
  const keys=monthKeys();const nowKey=iso(today()).slice(0,7);
  if(S.month==null){S.month=keys.find(k=>k>=nowKey)||keys[keys.length-1]||'all';}
  const hasIdeas=[...S.posts.values()].some(p=>!p.date);
  frag.append(el('div',{class:'months'},
    el('button',{class:'chip','aria-pressed':String(S.month==='all'),onclick:()=>{S.month='all';render();}},'Tout'),
    ...keys.map(k=>{const[y,m]=k.split('-');return el('button',{class:'chip','aria-pressed':String(S.month===k),onclick:()=>{S.month=k;render();}},`${MONTHS[+m-1]} ${y.slice(2)}`);}),
    hasIdeas?el('button',{class:'chip','aria-pressed':String(S.month==='ideas'),onclick:()=>{S.month='ideas';render();}},'Idées sans date'):null,
    el('select',{id:'canalFilter',class:'chip subs-toggle','aria-label':'Canal',onchange:e=>{S.canal=e.target.value;try{localStorage.setItem('sc_canal',S.canal)}catch(_){}render();}},
      el('option',{value:'all'},'Tous les canaux'),...CANAUX.map(c=>el('option',{value:c,selected:S.canal===c?true:null},c))),
    el('button',{class:'chip','aria-pressed':String(S.showSubs),onclick:()=>{S.showSubs=!S.showSubs;try{localStorage.setItem('sc_subs',S.showSubs?'1':'0')}catch(e){}render();}},S.showSubs?'Sous-tâches affichées':'Sous-tâches masquées')));
  if(S.posts.size===0){frag.append(el('div',{class:'empty'},'Aucun post pour l’instant. Ajoute le premier avec « + Nouveau post ».'));return frag;}
  if(S.month==='ideas'){
    const ideas=[...S.posts.values()].filter(p=>!p.date&&canalOk(p)).sort((a,b)=>(a.title||'').localeCompare(b.title||''));
    frag.append(el('section',{class:'week'},el('div',{class:'week-h'},el('h3',{},'Idées à caler'),el('span',{class:'quota ok'},`${ideas.length} idée${ideas.length>1?'s':''}`)),el('div',{class:'rows'},ideas.map(rowFor))));
    return frag;
  }
  const dated=[...S.posts.values()].filter(p=>p.date&&canalOk(p)&&(S.month==='all'||p.date.startsWith(S.month))).sort((a,b)=>a.date.localeCompare(b.date)||(a.title||'').localeCompare(b.title||''));
  if(!dated.length){frag.append(el('div',{class:'empty'},'Aucun post daté sur cette période.'));return frag;}
  const groups=new Map();
  for(const p of dated){const k=iso(monday(pd(p.date)));if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
  const insta=[...S.posts.values()].filter(p=>p.date&&(p.canal||'Instagram')==='Instagram');
  const curMon=iso(monday(today()));
  for(const[k,list]of groups){
    const mon=pd(k);const sun=new Date(mon);sun.setDate(mon.getDate()+6);
    const n=insta.filter(p=>iso(monday(pd(p.date)))===k).length;
    frag.append(el('section',{class:'week'+(k===curMon?' current':'')},
      el('div',{class:'week-h'},
        el('h3',{},`Semaine du ${fmtShort(mon)} au ${fmtShort(sun)}`+(k===curMon?' · cette semaine':'')),
        el('span',{class:'quota '+(n>=4?'ok':'low'),title:'Objectif : 4 publications Instagram minimum par semaine'},`${n} / 4 posts Insta`)),
      el('div',{class:'rows'},list.map(rowFor))));
  }
  return frag;
}
function rowFor(p){
  const r=rub(p.rubrique);const d=pd(p.date);
  const tds=subsFor(p.id);const openT=tds.filter(t=>!isDone(t)).length;
  const row=el('button',{class:'row'+(p.rubrique==='temps-fort'?' tf':''),onclick:()=>openPost(p.id)},
    el('div',{class:'d'},d?[el('b',{},fmtShort(d)),DOW[(d.getDay()+6)%7]]:el('b',{},'—')),
    el('div',{class:'t'},p.title||'Sans titre',p.objectif?el('small',{},p.objectif):null),
    el('div',{class:'rubcell'},el('span',{class:'rub'},el('i',{class:'dot',style:`--rc:var(${r.c})`}),r.l),(p.canal&&p.canal!=='Instagram')?el('div',{class:'owner'},p.canal):null),
    el('div',{class:'f'},p.format||''),
    el('div',{class:'meta'},
      el('span',{class:'status '+(SCLASS[p.statut]||'s-idee')},p.statut||'Idée'),
      p.owner_id?el('span',{class:'owner'},mName(p.owner_id)):null,
      tds.length?el('span',{class:'tcount'},`${tds.length-openT}/${tds.length} sous-tâches`):null));
  if(!S.showSubs)return el('div',{class:'post'},row);
  const subs=el('div',{class:'subs'},tds.map(t=>subRow(t)));
  subs.append(addSubForm(p.id));
  return el('div',{class:'post'},row,subs);
}
function addSubForm(pid,inDrawer){
  const id=(inDrawer?'nd-':'ns-')+pid;
  return el('form',{class:'addsub',onsubmit:async e=>{e.preventDefault();e.stopPropagation();const n=e.currentTarget.querySelector('input');const v=n.value.trim();if(!v)return;n.value='';delete n.dataset.dirty;await addTodo({text:v,post_id:pid});}},
    el('input',{type:'text',id,placeholder:'+ Ajouter une sous-tâche','aria-label':'Nouvelle sous-tâche',oninput:e=>{e.target.dataset.dirty='1';}}),
    el('button',{class:'btn',type:'submit'},'Ajouter'));
}
function subRow(t,showPost){
  const st=tStat(t);const t0=iso(today());
  const late=!isDone(t)&&t.due&&t.due<t0;
  const enter=e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur();}};
  const p=showPost&&t.post_id?S.posts.get(t.post_id):null;
  return el('div',{class:'st '+TKEY[st]},
    el('select',{class:'status '+TCLS[st],id:'ss-'+t.id,'aria-label':'Statut',onchange:e=>updateTodo(t.id,{statut:e.target.value})},TSTAT.map(s=>el('option',{value:s,selected:s===st?true:null},s))),
    el('input',{type:'text',class:'txt',id:'sx-'+t.id,value:t.text||'','aria-label':'Sous-tâche',onkeydown:enter,oninput:e=>{e.target.dataset.dirty='1';},
      onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(!v){e.target.value=t.text;return;}if(v!==t.text)updateTodo(t.id,{text:v});}}),
    memberSelect('sa-'+t.id,t.assignee_id,'Responsable',{class:'who-in',onchange:e=>updateTodo(t.id,{assignee_id:e.target.value||null})}),
    el('input',{type:'date',class:'due-in'+(late?' late':''),id:'sd-'+t.id,value:t.due||'','aria-label':'Échéance',title:late?'En retard':'Échéance',onkeydown:enter,
      onchange:e=>{const v=e.target.value||null;if(v!==t.due)updateTodo(t.id,{due:v});}}),
    el('button',{class:'x',type:'button','aria-label':'Supprimer la sous-tâche',title:'Supprimer',onclick:e=>delInline(e.currentTarget,()=>removeTodo(t.id))},'×'),
    el('div',{class:'st-more'},
      el('input',{type:'text',class:'fmt',id:'sf-'+t.id,value:t.format||'',placeholder:'Format (Reel, carrousel, story…)','aria-label':'Format',onkeydown:enter,oninput:e=>{e.target.dataset.dirty='1';},
        onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(v!==(t.format||''))updateTodo(t.id,{format:v});}}),
      autoGrow(el('textarea',{class:'cnt',id:'sc-'+t.id,rows:'1',placeholder:'Contenu (texte, légende, brief, liens…)','aria-label':'Contenu',oninput:e=>{e.target.dataset.dirty='1';fit(e.target);},
        onchange:e=>{const v=e.target.value.trim();delete e.target.dataset.dirty;if(v!==(t.contenu||''))updateTodo(t.id,{contenu:v});}}),t.contenu||'')),
    p?el('button',{class:'postlink',type:'button',onclick:()=>openPost(p.id)},'↳ '+(p.date?fmtShort(pd(p.date))+' · ':'')+(p.title||'post')):null);
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
    const cell=el('div',{class:'cell'+(out?' out':'')+(k===tIso?' today':''),title:'Ajouter un post ce jour',style:'cursor:copy',onclick:()=>openPost(null,k)},el('span',{class:'n'},d.getDate()));
    for(const p of (byDate.get(k)||[])){const r=rub(p.rubrique);cell.append(el('button',{class:'ev',style:`--rc:var(${r.c})`,title:`${p.title} · ${p.statut||''}`,onclick:e=>{e.stopPropagation();openPost(p.id);}},p.title||'Sans titre'));}
    grid.append(cell);
  }
  box.append(el('div',{class:'cal-wrap'},grid));
  return box;
}

/* ---------- to-do ---------- */
function renderTodos(){
  const box=el('div',{class:'todo-layout'});
  const postSel=el('select',{id:'tPost','aria-label':'Post lié'},el('option',{value:''},'Aucun post lié'),...postOptions());
  box.append(el('form',{class:'addbar',onsubmit:async e=>{e.preventDefault();
      const text=$('#tText').value.trim();if(!text)return;
      await addTodo({text,assignee_id:$('#tAss').value||null,due:$('#tDue').value||null,post_id:postSel.value||null});
      $('#tText').value='';$('#tText').focus();}},
    el('input',{type:'text',id:'tText',placeholder:'Nouvelle tâche…','aria-label':'Tâche'}),
    memberSelect('tAss','', 'Responsable'),
    el('input',{type:'date',id:'tDue','aria-label':'Échéance'}),
    postSel,
    el('button',{class:'btn primary',type:'submit'},'Ajouter')));
  box.append(el('div',{class:'filters'},
    ...[['open','Ouvertes'],['En cours','En cours'],['Bloqué','Bloquées'],['Fait','Faites'],['all','Toutes']].map(([k,l])=>el('button',{class:'chip','aria-pressed':String(S.todoFilter===k),onclick:()=>{S.todoFilter=k;render();}},l)),
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
  const p=id?S.posts.get(id):{date:presetDate||'',title:'',rubrique:'push',canal:'Instagram',format:'',objectif:'',statut:'Idée',owner_id:null,notes:''};
  if(!p)return;
  S.drawerPost=id;
  const f=(lab,node)=>el('div',{class:'field'},el('label',{for:node.id},lab),node);
  const inp=(idn,val,ph)=>el('input',{type:'text',id:idn,value:val||'',placeholder:ph||''});
  const date=el('input',{type:'date',id:'pDate',value:p.date||''});
  const rubSel=el('select',{id:'pRub'},RUBS.map(r=>el('option',{value:r.k,selected:r.k===p.rubrique?true:null},r.l)));
  const canSel=el('select',{id:'pCanal'},CANAUX.map(c=>el('option',{value:c,selected:c===(p.canal||'Instagram')?true:null},c)));
  const stSel=el('select',{id:'pStat'},STATUTS.map(s=>el('option',{value:s,selected:s===p.statut?true:null},s)));
  const own=memberSelect('pOwner',p.owner_id,'Responsable');
  const notes=el('textarea',{id:'pNotes',placeholder:'Brief visuel, légende, liens, retours…'});notes.value=p.notes||'';
  const linked=id?subsFor(id):[];
  const sub=el('div',{id:'drawerSubs',style:'display:flex;flex-direction:column;gap:6px'},linked.map(t=>subRow(t)));
  const delBtn=id?el('button',{class:'btn danger',type:'button',onclick:async e=>{const b=e.currentTarget;if(!b.dataset.armed){b.dataset.armed='1';b.textContent='Confirmer (supprime aussi ses sous-tâches)';return;}await removePost(id);closeDrawer();}},'Supprimer'):el('span');
  const form=el('form',{class:'drawer',role:'dialog','aria-modal':'true','aria-label':'Post',onsubmit:async e=>{e.preventDefault();
      const data={date:date.value||null,title:$('#pTitle').value.trim(),rubrique:rubSel.value,canal:canSel.value,format:$('#pFormat').value.trim(),objectif:$('#pObj').value.trim(),statut:stSel.value,owner_id:own.value||null,notes:notes.value.trim()};
      if(!data.title){$('#pTitle').focus();return;}
      if(await savePost(id,data))closeDrawer();}},
    el('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},el('h2',{},id?'Modifier le post':'Nouveau post'),el('button',{class:'x',type:'button','aria-label':'Fermer',onclick:closeDrawer},'×')),
    f('Sujet',inp('pTitle',p.title,'Ex. Gift Guide Édition Limitée #1')),
    el('div',{class:'two'},f('Date de publication',date),f('Statut',stSel)),
    el('div',{class:'two'},f('Rubrique',rubSel),f('Canal',canSel)),
    el('div',{class:'two'},f('Responsable',own),f('Format',inp('pFormat',p.format,'Carrousel, Reel, GIF…'))),
    f('Objectif',inp('pObj',p.objectif,'')),
    f('Notes',notes),
    id?el('div',{class:'field'},el('label',{},`Sous-tâches (${linked.length})`),sub,addSubForm(id,true)):el('p',{class:'owner'},'Enregistre le post pour lui ajouter des sous-tâches.'),
    el('div',{class:'actions'},delBtn,el('div',{style:'display:flex;gap:8px'},el('button',{class:'btn ghost',type:'button',onclick:closeDrawer},'Annuler'),el('button',{class:'btn primary',type:'submit'},'Enregistrer'))));
  const ov=el('div',{class:'overlay',onclick:e=>{if(e.target===ov)closeDrawer();}},form);
  $('#drawerHost').replaceChildren(ov);
  setTimeout(()=>$('#pTitle').focus(),30);
}
function closeDrawer(){S.drawerPost=null;$('#drawerHost').replaceChildren();}
function refreshDrawerSubs(){
  const box=document.getElementById('drawerSubs');if(!box||!S.drawerPost)return;
  if(box.contains(document.activeElement))return;
  box.replaceChildren(...subsFor(S.drawerPost).map(t=>subRow(t)));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});

/* ---------- écritures ---------- */
function fail(error){toast(error?.message?.includes('JWT')?'Session expirée : recharge la page.':'Enregistrement impossible, réessaie.');console.error(error);}
async function savePost(id,data){
  const q=id?sb.from('posts').update(data).eq('id',id).select().single():sb.from('posts').insert(data).select().single();
  const {data:row,error}=await q;if(error){fail(error);return false;}
  S.posts.set(row.id,row);render();toast('Post enregistré');return true;}
async function removePost(id){const {error}=await sb.from('posts').delete().eq('id',id);if(error)return fail(error);S.posts.delete(id);for(const t of [...S.todos.values()])if(t.post_id===id)S.todos.delete(t.id);render();toast('Post supprimé');}
async function addTodo(t){const {data:row,error}=await sb.from('todos').insert(t).select().single();if(error)return fail(error);S.todos.set(row.id,row);render();refreshDrawerSubs();toast(row.assignee_id&&row.assignee_id!==S.me?.id?'Tâche ajoutée, '+mName(row.assignee_id)+' est prévenu·e par mail':'Tâche ajoutée');}
async function updateTodo(id,patch){
  const before=S.todos.get(id);
  const {data:row,error}=await sb.from('todos').update(patch).eq('id',id).select().single();if(error)return fail(error);
  S.todos.set(row.id,row);render();refreshDrawerSubs();
  if(patch.assignee_id&&patch.assignee_id!==before?.assignee_id&&patch.assignee_id!==S.me?.id)toast(mName(patch.assignee_id)+' est prévenu·e par mail');
  else if(patch.statut==='Fait'&&before?.statut!=='Fait')toast('Fait ! L’équipe est prévenue par mail');
}
async function removeTodo(id){const {error}=await sb.from('todos').delete().eq('id',id);if(error)return fail(error);S.todos.delete(id);render();refreshDrawerSubs();toast('Tâche supprimée');}
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
