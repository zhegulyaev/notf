const C=window.APP_CONFIG||{};
const sb=(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY)?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
const $=id=>document.getElementById(id);
const months=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const praise=["Красиво!","Так держать!","Есть!","Отличный ход!","Продолжаем!","Ещё одна галочка в копилку!","Дисциплина работает!","Вот это темп!","Хороший шаг!","Чётко!","Плюс один!","Ты в деле!","Стабильность решает!","Молодец, сделано!","День становится сильнее!","Не сбавляем!","Хороший выбор!","Так и строится привычка!","Едем дальше!","Вот это настрой!"];
let viewYear=2026,viewMonth=9,selectedDay=1,goals=[],entries={},editing=null;

function dateKey(y,m,d){return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function show(id){["authView","trackerView","settingsView"].forEach(x=>$(x).classList.toggle("hidden",x!==id))}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function toast(){const t=$("toast");t.textContent=praise[Math.floor(Math.random()*praise.length)];t.classList.remove("show");void t.offsetWidth;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),1800)}
async function loadAll(){
 const u=(await sb.auth.getUser()).data.user;
 let g=await sb.from("user_goals").select("*").eq("user_id",u.id).order("position");
 goals=g.data||[];
 if(!goals.length){
  const defaults=[["🍬","Без сладостей","Не ел сладкое"],["☕","Без кофе","Не пил кофе"],["🏃","Зарядка","Сделал зарядку"],["🌅","Утренняя прогулка","Вышел из дома утром"],["🌆","Прогулка днём/вечером","Вышел ещё раз днём или вечером"]];
  for(let i=0;i<defaults.length;i++) await sb.from("user_goals").insert({user_id:u.id,emoji:defaults[i][0],name:defaults[i][1],description:defaults[i][2],position:i});
  g=await sb.from("user_goals").select("*").eq("user_id",u.id).order("position");goals=g.data||[];
 }
 const e=await sb.from("habit_entries").select("*").eq("user_id",u.id);entries={};(e.data||[]).forEach(x=>entries[x.date]=x);
}
function count(e){return goals.filter(g=>e?.goal_values?.[g.id]).length+(e?.threads_minutes!=null&&Number(e.threads_minutes)<=30?1:0)}
function renderCalendar(){
 const c=$("calendar");c.innerHTML="";
 const off=(new Date(viewYear,viewMonth,1).getDay()+6)%7,total=daysInMonth(viewYear,viewMonth);
 for(let i=0;i<off;i++){const b=document.createElement("button");b.className="day empty";c.append(b)}
 for(let d=1;d<=total;d++){
  const b=document.createElement("button"),n=count(entries[dateKey(viewYear,viewMonth,d)]);
  b.className="day"+(d===selectedDay?" selected":"")+(n===goals.length+1?" complete":n?" partial":"");
  b.innerHTML=`${d}${n?`<span class="mark">${n}/${goals.length+1}</span>`:""}`;
  b.onclick=()=>{selectedDay=d;render()};
  c.append(b);
 }
 const select=$("monthSelect");
 if(!select.options.length){
  for(let y=2026;y<=2035;y++)for(let m=0;m<12;m++){const o=document.createElement("option");o.value=`${y}-${m}`;o.textContent=`${months[m]} ${y}`;select.append(o)}
 }
 select.value=`${viewYear}-${viewMonth}`;
 let done=0,perfect=0;for(let d=1;d<=total;d++){const n=count(entries[dateKey(viewYear,viewMonth,d)]);done+=n;if(n===goals.length+1)perfect++}
 $("monthDone").textContent=done;$("monthPerfect").textContent=perfect;
 $("monthPercent").textContent=(total?(Math.round(done/(total*(goals.length+1))*100):0)+"%");
}
function renderDay(){
 const e=entries[dateKey(viewYear,viewMonth,selectedDay)]||{};
 $("dayTitle").textContent=`${selectedDay} ${months[viewMonth].toLowerCase()} ${viewYear}`;
 $("habits").innerHTML="";
 for(const g of goals){
  const card=document.createElement("div");card.className="habit-card";
  card.innerHTML=`<div><div class="habit-name">${g.emoji} ${esc(g.name)}</div><div class="habit-desc">${esc(g.description||"")}</div></div><button class="toggle ${e.goal_values?.[g.id]?"on":""}" aria-label="${esc(g.name)}"></button>`;
  card.querySelector("button").onclick=async()=>{
   const dk=dateKey(viewYear,viewMonth,selectedDay),x=entries[dk]||{date:dk,goal_values:{}};
   const next=!x.goal_values?.[g.id];x.goal_values={...(x.goal_values||{}),[g.id]:next};await save(x);if(next)toast();render();
  };$("habits").append(card);
 }
 $("threadsMinutes").value=e.threads_minutes??"";
 $("threadsStatus").textContent=e.threads_minutes==null||e.threads_minutes===""?"○ Не отмечено":Number(e.threads_minutes)<=30?"✓ Лимит соблюдён":"✕ Лимит превышен";
 $("summaryText").textContent=`${count(e)} из ${goals.length+1} целей выполнено.`;
}
function render(){renderCalendar();renderDay()}
async function save(x){
 const u=(await sb.auth.getUser()).data.user,row={user_id:u.id,date:x.date,goal_values:x.goal_values||{},threads_minutes:x.threads_minutes===""||x.threads_minutes==null?null:Number(x.threads_minutes)};
 const r=await sb.from("habit_entries").upsert(row,{onConflict:"user_id,date"});if(r.error)console.error(r.error);entries[x.date]=row;
}
function renderGoals(){
 $("goalList").innerHTML="";
 goals.forEach(g=>{
  const r=document.createElement("div");r.className="goal-row";
  r.innerHTML=`<div class="goal-main"><span class="goal-emoji">${g.emoji}</span><div class="goal-text"><strong>${esc(g.name)}</strong><small>${esc(g.description||"")}</small></div></div><div class="goal-actions"><button data-e aria-label="Изменить" title="Изменить"><svg viewBox="0 0 24 24"><path d="m4 16.8-.7 3.9 3.9-.7L18.8 8.4a2.4 2.4 0 0 0-3.4-3.4L4 16.8Z"/><path d="m14 6 4 4"/></svg></button><button data-d aria-label="Удалить" title="Удалить"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6M14 11v6"/></svg></button></div>`;
  r.querySelector("[data-e]").onclick=()=>openEditor(g);r.querySelector("[data-d]").onclick=()=>deleteGoal(g);$("goalList").append(r);
 });
}
function openEditor(g=null){editing=g;$("editorTitle").textContent=g?"Изменить цель":"Новая цель";$("goalEmoji").value=g?.emoji||"⭐";$("goalName").value=g?.name||"";$("goalDesc").value=g?.description||"";$("goalEditor").classList.remove("hidden")}
async function deleteGoal(g){if(!confirm(`Удалить цель «${g.name}»?`))return;const u=(await sb.auth.getUser()).data.user;await sb.from("user_goals").delete().eq("id",g.id).eq("user_id",u.id);await loadAll();renderGoals();render()}
$("saveGoal").onclick=async()=>{const name=$("goalName").value.trim();if(!name)return alert("Введите название");const u=(await sb.auth.getUser()).data.user,row={user_id:u.id,emoji:$("goalEmoji").value.trim()||"⭐",name,description:$("goalDesc").value.trim(),position:editing?editing.position:goals.length};if(editing)await sb.from("user_goals").update(row).eq("id",editing.id).eq("user_id",u.id);else await sb.from("user_goals").insert(row);$("goalEditor").classList.add("hidden");await loadAll();renderGoals();render()};
$("addGoalBtn").onclick=()=>openEditor();$("cancelGoal").onclick=()=>{$("goalEditor").classList.add("hidden")};
$("settingsBtn").onclick=()=>{show("settingsView");renderGoals()};$("backBtn").onclick=()=>{show("trackerView");render()};
$("threadsMinutes").onchange=async()=>{const dk=dateKey(viewYear,viewMonth,selectedDay),x=entries[dk]||{date:dk,goal_values:{}};x.threads_minutes=$("threadsMinutes").value;await save(x);if(x.threads_minutes!==""&&Number(x.threads_minutes)<=30)toast();render()};
$("prevMonth").onclick=()=>{if(viewMonth===0){viewMonth=11;viewYear--}else viewMonth--;selectedDay=1;render()};
$("nextMonth").onclick=()=>{if(viewMonth===11){viewMonth=0;viewYear++}else viewMonth++;selectedDay=1;render()};
$("monthSelect").onchange=e=>{const [y,m]=e.target.value.split("-").map(Number);viewYear=y;viewMonth=m;selectedDay=1;render()};
$("loginBtn").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});$("authMsg").textContent=error?.message||""};
$("signupBtn").onclick=async()=>{const {error}=await sb.auth.signUp({email:$("email").value,password:$("password").value});$("authMsg").textContent=error?.message||"Аккаунт создан. Если подтверждение email выключено, можно сразу войти."};
$("logoutBtn").onclick=()=>sb.auth.signOut();
async function init(){if(!sb){show("authView");$("authMsg").textContent="Проверь config.js";return}const {data:{session}}=await sb.auth.getSession();if(session){await loadAll();show("trackerView");render()}else show("authView");sb.auth.onAuthStateChange(async(_,s)=>{if(s){await loadAll();show("trackerView");render()}else show("authView")})}
init();
