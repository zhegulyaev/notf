const C = window.APP_CONFIG || {};
const sb = (C.SUPABASE_URL && C.SUPABASE_ANON_KEY)
  ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY)
  : null;

const fields = [
  ["no_sweets","🍬 Без сладостей","Не ел сладкое"],
  ["no_coffee","☕ Без кофе","Не пил кофе"],
  ["no_adult","🔞 Без порно/мастурбации","Ничего не было"],
  ["exercise","🏃 Зарядка","Сделал зарядку"],
  ["morning_walk","🌅 Утренняя прогулка","Вышел из дома утром"],
  ["evening_walk","🌆 Прогулка днём/вечером","Вышел ещё раз днём или вечером"]
];

let selectedDay = 1;
let entries = {};
const key = d => `2026-10-${String(d).padStart(2,"0")}`;

const $ = id => document.getElementById(id);
const localKey = "habit_tracker_october_2026";

function loadLocal(){
  try { entries = JSON.parse(localStorage.getItem(localKey) || "{}"); } catch { entries = {}; }
}
function saveLocal(){ localStorage.setItem(localKey, JSON.stringify(entries)); }

function showAuth(){ $("authView").classList.remove("hidden"); $("trackerView").classList.add("hidden"); }
function showTracker(){ $("authView").classList.add("hidden"); $("trackerView").classList.remove("hidden"); }

async function init(){
  loadLocal();
  renderCalendar();
  renderDay();
  if(!sb){ showAuth(); $("authMsg").textContent="Сначала укажи Supabase URL и anon key в config.js"; return; }
  const {data:{session}} = await sb.auth.getSession();
  if(session){ await loadCloud(); showTracker(); } else showAuth();
  sb.auth.onAuthStateChange(async (_event, session) => {
    if(session){ await loadCloud(); showTracker(); renderCalendar(); renderDay(); }
    else showAuth();
  });
}

async function loadCloud(){
  const {data,error}=await sb.from("habit_entries").select("*").order("date");
  if(error){ console.error(error); return; }
  entries={};
  for(const row of data) entries[row.date]=row;
  saveLocal();
}

async function saveEntry(){
  const date=key(selectedDay), e=entries[date] || {date};
  e.user_id=undefined;
  const row={date,
    no_sweets:!!e.no_sweets,no_coffee:!!e.no_coffee,
    threads_minutes:e.threads_minutes===""||e.threads_minutes==null?null:Number(e.threads_minutes),
    no_adult:!!e.no_adult,exercise:!!e.exercise,
    morning_walk:!!e.morning_walk,evening_walk:!!e.evening_walk};
  entries[date]=row; saveLocal();
  if(!sb) return;
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return;
  const {error}=await sb.from("habit_entries").upsert({...row,user_id:user.id},{onConflict:"user_id,date"});
  if(error) console.error(error);
}

function completedCount(e){
  if(!e) return 0;
  let n=fields.filter(([f])=>e[f]).length;
  if(Number.isFinite(Number(e.threads_minutes)) && Number(e.threads_minutes)<=30) n++;
  return n;
}
function renderCalendar(){
  const cal=$("calendar"); cal.innerHTML="";
  const first=new Date(2026,9,1).getDay();
  const offset=(first+6)%7;
  for(let i=0;i<offset;i++){ const x=document.createElement("button"); x.className="day empty"; cal.appendChild(x); }
  for(let d=1;d<=31;d++){
    const b=document.createElement("button"); b.className="day";
    const e=entries[key(d)], count=completedCount(e);
    if(d===selectedDay)b.classList.add("selected");
    if(count===7)b.classList.add("complete"); else if(count>0)b.classList.add("partial");
    b.innerHTML=`${d}${count?`<span class="mark">${count}/7</span>`:""}`;
    b.onclick=()=>{selectedDay=d;renderCalendar();renderDay();};
    cal.appendChild(b);
  }
}
function renderDay(){
  $("dayTitle").textContent=`${selectedDay} октября`;
  const date=key(selectedDay), e=entries[date] || {};
  $("habits").innerHTML="";
  for(const [f,name,desc] of fields){
    const card=document.createElement("div"); card.className="habit-card";
    card.innerHTML=`<div class="habit-copy"><div class="habit-name">${name}</div><div class="habit-desc">${desc}</div></div><button class="toggle ${e[f]?"on":""}" aria-label="${name}"></button>`;
    card.querySelector(".toggle").onclick=async()=>{ entries[date]=entries[date]||{date}; entries[date][f]=!entries[date][f]; await saveEntry(); renderCalendar(); renderDay(); };
    $("habits").appendChild(card);
  }
  $("threadsMinutes").value=e.threads_minutes ?? "";
  $("threadsStatus").textContent=e.threads_minutes==null||e.threads_minutes===""?"○ Не отмечено":(Number(e.threads_minutes)<=30?"✓ Лимит соблюдён":"✕ Лимит превышен");
  $("summaryText").textContent=`${completedCount(e)} из 7 целей выполнено.`;
}
$("threadsMinutes").addEventListener("change",async()=>{ const date=key(selectedDay); entries[date]=entries[date]||{date}; entries[date].threads_minutes=$("threadsMinutes").value===""?null:Number($("threadsMinutes").value); await saveEntry(); renderCalendar(); renderDay(); });
$("loginBtn").onclick=async()=>{ $("authMsg").textContent=""; const {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value}); if(error)$("authMsg").textContent=error.message; };
$("signupBtn").onclick=async()=>{ $("authMsg").textContent=""; const {error}=await sb.auth.signUp({email:$("email").value,password:$("password").value}); $("authMsg").textContent=error?error.message:"Аккаунт создан. Проверь почту, если включено подтверждение email."; };
$("logoutBtn").onclick=()=>sb?.auth.signOut();
init();