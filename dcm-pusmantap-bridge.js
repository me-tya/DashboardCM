/* Dashboard CM -> Tim Pusmantap. Single sources: state.agendas, state.resources.
   Only non-derived team assignments, additional employees, attendance exceptions and
   leave of people outside CM Team are stored in an independent Firebase document. */
(function(){
'use strict';
const SOURCE='dcm-tim-pusmantap', KEY='dcm_tim_pusmantap_manual_v1';
const empty=()=>({members:[],teams:{},attendance:{},leaves:[]});
let manual=empty(), subscribed=false, unload=null, lastSignature='';
const frame=()=>document.getElementById('cmTpFrame');
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const clean=x=>String(x==null?'':x).trim().slice(0,500);
const fold=x=>clean(x).toLocaleLowerCase('id-ID');
const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x);
const allowedLeave=['Cuti Tahunan','Cuti Sakit','Cuti Karena Alasan Penting','Cuti Alasan Penting','Cuti Besar','Cuti Melahirkan','Cuti di Luar Tanggungan Negara'];
const normal=m=>({members:Array.isArray(m?.members)?m.members:[],teams:m?.teams&&typeof m.teams==='object'&&!Array.isArray(m.teams)?m.teams:{},attendance:m?.attendance&&typeof m.attendance==='object'&&!Array.isArray(m.attendance)?m.attendance:{},leaves:Array.isArray(m?.leaves)?m.leaves:[]});
function own(){return typeof cmCanMutate==='function'&&cmCanMutate()&&typeof isLoggedIn==='function'&&isLoggedIn();}
function people(){
 return (Array.isArray(state.resources)?state.resources:[]).filter(r=>!((typeof resourceIsInactive==='function')&&resourceIsInactive(r))).map(r=>({
  id:clean(r.id),name:clean(r.nama),nip:clean(r.nip),job:clean(r.jabatan),unit:clean(r.unit),role:clean(r.peran),
  jenis:clean(r.jenisPegawai||r.jenisKepegawaian||r.jenis||r.penugasan||'Pegawai'),
  wfhDays:Array.isArray(r.wfhDays)?r.wfhDays:[],leavePlans:Array.isArray(r.rencanaCuti)?r.rencanaCuti:[],
  status:clean(r.status),statusMulai:clean(r.statusMulai),statusSelesai:clean(r.statusSelesai),
  jenisCuti:clean(r.jenisCuti),source:'cm-team'
 }));
}
function agenda(){
 return (Array.isArray(state.agendas)?state.agendas:[]).map(a=>({
  id:clean(a.id),date:clean(a.tglMulai).slice(0,10),end:clean(a.tglSelesai||a.tglMulai).slice(0,10),
  time:clean(a.waktu),title:clean(a.namaKegiatan),unit:clean(a.unitPemohon),
  pic:clean(a.pic||a.picKegiatan||a.penanggungJawab||''),
  people:clean(a.pic||a.picKegiatan||a.penanggungJawab||a.personil||''),
  location:clean(a.lokasi||a.tempat||a.media||''),status:clean(a.status||a.statusNorm),
  assignment:clean(a.suratTugas||''),category:clean(a.kategori||''),source:'activity'
 })).filter(a=>a.date&&a.title);
}
function snapshot(){
 return {source:SOURCE,type:'snapshot',today:day(),canEdit:own(),
  activities:agenda(),resources:people(),manual,role:typeof cmGetAccessRole==='function'?cmGetAccessRole():'guest'};
}
function send(force){
 const f=frame();if(!f||!f.contentWindow)return;
 let data;try{data=snapshot();}catch(e){console.warn('[Tim Pusmantap] Snapshot gagal',e);return;}
 const signature=JSON.stringify(data);if(!force&&lastSignature===signature)return;
 lastSignature=signature;
 f.contentWindow.postMessage(data,location.origin);
}
window.cmTpLiveSend=()=>send(false);
async function initRemote(){
 if(subscribed)return;subscribed=true;
 try{manual=normal(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){manual=empty();}
 send(true);
 if(typeof waitForFirebaseAuthReady==='function')await waitForFirebaseAuthReady();
 if(!isLoggedIn()||!window.fbDb||!window.fbOnSnapshot)return;
 if(unload){unload();unload=null;}
 try{
  unload=window.fbOnSnapshot(window.fbDoc(window.fbDb,'dashboard',KEY),snap=>{
    let value=empty();
    if(snap.exists()){try{value=normal(JSON.parse(snap.data().value||'{}'));}catch(e){}}
    manual=value;
    try{localStorage.setItem(KEY,JSON.stringify(value))}catch(e){}
    send(true);
  },e=>console.warn('[Tim Pusmantap] Firebase read unavailable',e));
 }catch(e){console.warn('[Tim Pusmantap] Firebase listener failed',e)}
}
function edit(m,action,d){
 if(action==='members-import'){
  if(!Array.isArray(d.entries)||!d.entries.length||d.entries.length>500)throw Error('Jumlah pegawai yang diimpor harus antara 1 sampai 500.');
  const mode=d.mode==='merge'?'merge':'skip',live=people(),seen=new Set();
  const stats={added:0,updated:0,assigned:0,skipped:0};
  for(const source of d.entries){
   const name=clean(source.name).replace(/\s+/g,' ');
   const nip=clean(source.nip).replace(/[^\d]/g,'');
   if(!name||name.length<3){stats.skipped++;continue;}
   if(nip&&(!/^\d{6,20}$/.test(nip)))throw Error('NIP '+name+' tidak valid.');
   const team=clean(source.team).toUpperCase();
   if(team&&!['DCS','DOA','SPP','SSB','CM'].includes(team))throw Error('Tim '+name+' tidak dikenal.');
   const ident=nip?'nip:'+nip:'name:'+fold(name);
   if(seen.has(ident)){stats.skipped++;continue;}
   seen.add(ident);
   const same=(x)=>fold(x.name)===fold(name)||(nip&&clean(x.nip)===nip);
   const fromCM=live.find(same),fromManual=m.members.find(same);
   if(fromCM){
    if(mode==='merge'&&team){m.teams[fromCM.name]=team;stats.assigned++;}
    else stats.skipped++;
    continue;
   }
   if(fromManual){
    if(mode!=='merge'){stats.skipped++;continue;}
    Object.assign(fromManual,{
      job:clean(source.job)||fromManual.job||'',
      unit:clean(source.unit)||fromManual.unit||'',
      jenis:clean(source.jenis)||fromManual.jenis||'Pegawai',
      nip:nip||fromManual.nip||''
    });
    if(team)m.teams[fromManual.name]=team;
    stats.updated++;continue;
   }
   const created={name,nip,job:clean(source.job),unit:clean(source.unit),jenis:clean(source.jenis)||'Pegawai',createdAt:new Date().toISOString()};
   m.members.push(created);
   if(team)m.teams[name]=team;
   stats.added++;
  }
  return stats;
 }else if(action==='member-save'){
  const old=clean(d.oldName),name=clean(d.name);if(!name)throw Error('Nama pegawai wajib diisi');
  if(people().some(p=>fold(p.name)===fold(name)))throw Error('Pegawai ini sudah ada di CM Team. Ubah lewat menu CM Team.');
  if(m.members.some(p=>fold(p.name)===fold(name)&&fold(p.name)!==fold(old)))throw Error('Nama pegawai sudah terdaftar');
  const item={name,nip:clean(d.nip),job:clean(d.job),unit:clean(d.unit),jenis:clean(d.jenis||'Pegawai'),createdAt:clean(d.createdAt||new Date().toISOString())};
  if(item.nip&&people().some(p=>clean(p.nip)===item.nip))throw Error('NIP sudah terdaftar di CM Team.');
  if(item.nip&&m.members.some(p=>clean(p.nip)===item.nip&&fold(p.name)!==fold(old)))throw Error('NIP sudah digunakan oleh pegawai lain.');
  if(old){const idx=m.members.findIndex(x=>fold(x.name)===fold(old));if(idx<0)throw Error('Pegawai tidak ditemukan');m.members[idx]={...m.members[idx],...item};
    if(old!==name){if(m.teams[old]){m.teams[name]=m.teams[old];delete m.teams[old]}m.leaves.forEach(x=>{if(fold(x.name)===fold(old))x.name=name});Object.keys(m.attendance).forEach(k=>{if(k.startsWith(old+'|')){m.attendance[name+k.slice(old.length)]=m.attendance[k];delete m.attendance[k]}});}
  }else m.members.push(item);
 }else if(action==='member-delete'){
  const name=clean(d.name);if(!m.members.some(x=>fold(x.name)===fold(name)))throw Error('Hapus pegawai dari CM Team melalui menu CM Team');
  m.members=m.members.filter(x=>fold(x.name)!==fold(name));delete m.teams[name];m.leaves=m.leaves.filter(x=>fold(x.name)!==fold(name));
  Object.keys(m.attendance).forEach(k=>{if(k.startsWith(name+'|'))delete m.attendance[k]});
 }else if(action==='team-save'){
  const name=clean(d.name);if(!name)throw Error('Pilih pegawai');
  const t=clean(d.team);if(!['','DCS','DOA','SPP','SSB','CM'].includes(t))throw Error('Tim tidak dikenal');
  if(t)m.teams[name]=t;else delete m.teams[name];
 }else if(action==='attendance-save'){
  const name=clean(d.name),date=clean(d.date),status=clean(d.status);
  if(!name||!validDate(date)||!['WFO','WFH','Dinas luar',''].includes(status))throw Error('Status kehadiran tidak valid');
  if(status)m.attendance[name+'|'+date]={status,note:clean(d.note),updatedAt:new Date().toISOString()};
  else delete m.attendance[name+'|'+date];
 }else if(action==='leave-save'){
  const name=clean(d.name),mulai=clean(d.mulai),selesai=clean(d.selesai),jenis=clean(d.jenis);
  if(!name||!validDate(mulai)||!validDate(selesai)||selesai<mulai||!allowedLeave.includes(jenis))throw Error('Rencana cuti tidak valid');
  if(['Cuti Sakit','Cuti Melahirkan'].includes(jenis)&&mulai>day())throw Error('Cuti Sakit/Melahirkan tidak dapat direncanakan di masa depan');
  const id=clean(d.id)||'LV-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  const row={id,name,mulai,selesai,jenis,catatan:clean(d.catatan)};
  const i=m.leaves.findIndex(l=>l.id===id);
  if(m.leaves.some((l,j)=>j!==i&&fold(l.name)===fold(name)&&mulai<=l.selesai&&selesai>=l.mulai))throw Error('Cuti untuk pegawai ini bertumpuk');
  if(i>=0)m.leaves[i]=row;else m.leaves.push(row);
 }else if(action==='leave-delete'){
  m.leaves=m.leaves.filter(l=>l.id!==clean(d.id));
 }else throw Error('Operasi tidak dikenal');
}
async function saveManual(action,data){
 if(!own())throw Error('Hak akses mengubah data tidak tersedia');
 if(!window.fbRunTransaction||!window.fbDb)throw Error('Firebase belum siap');
 const ref=window.fbDoc(window.fbDb,'dashboard',KEY);
 const updated=await window.fbRunTransaction(window.fbDb,async tx=>{
  const snap=await tx.get(ref);let base=empty();
  if(snap.exists()){try{base=normal(JSON.parse(snap.data().value||'{}'));}catch(e){}}
  const stats=edit(base,action,data)||{};
  tx.set(ref,{value:JSON.stringify(base),updatedAt:new Date().toISOString(),updatedBy:typeof getCurrentUserEmail==='function'?getCurrentUserEmail():''});
  return {base,stats};
 });
 manual=updated.base;try{localStorage.setItem(KEY,JSON.stringify(manual))}catch(e){}
 send(true);
 return updated.stats;
}
async function saveResourceLeave(action,d){
 if(!own())throw Error('Hak akses tidak tersedia');
 const p=state.resources.find(r=>fold(r.nama)===fold(d.name));if(!p)throw Error('Pegawai tidak ditemukan di CM Team');
 const orig=JSON.stringify(p.rencanaCuti||[]);
 let list=Array.isArray(p.rencanaCuti)?p.rencanaCuti.slice():[];
 if(action==='leave-delete'){
  list=list.filter(x=>x.id!==clean(d.id));
 }else{
  if(!validDate(clean(d.mulai))||!validDate(clean(d.selesai))||clean(d.selesai)<clean(d.mulai)||!allowedLeave.includes(clean(d.jenis)))throw Error('Data cuti tidak valid');
  if(['Cuti Sakit','Cuti Melahirkan'].includes(clean(d.jenis))&&clean(d.mulai)>day())throw Error('Cuti Sakit/Melahirkan tidak dapat direncanakan di masa depan');
  const id=clean(d.id)||'LV-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  const row={id,mulai:clean(d.mulai),selesai:clean(d.selesai),jenis:clean(d.jenis),catatan:clean(d.catatan)};
  const i=list.findIndex(x=>x.id===id);
  if(list.some((x,j)=>j!==i&&row.mulai<=x.selesai&&row.selesai>=x.mulai))throw Error('Jadwal cuti bertumpuk');
  if(i<0)list.push(row);else list[i]=row;
 }
 p.rencanaCuti=list;
 try{await resourcePersist();send(true);}
 catch(e){p.rencanaCuti=JSON.parse(orig);send(true);throw e;}
}
function switchMenu(tab){
 const b=document.querySelector('.tab-btn[data-tab="'+tab+'"]');
 if(b)b.click();
 else{state.activeTab=tab;if(typeof refreshAll==='function')refreshAll();}
}
function gotoActivity(id){
 switchMenu('table');
 if(id&&typeof openDetail==='function'){
  setTimeout(()=>{try{openDetail(id)}catch(e){console.warn(e)}},100);
 }else{
  setTimeout(()=>document.getElementById('btnAdd')?.click(),100);
 }
}
window.addEventListener('message',async ev=>{
 if(ev.origin!==location.origin||ev.source!==frame()?.contentWindow)return;
 const m=ev.data;
 if(!m||m.source!==SOURCE)return;
 if(m.type==='ready'){await initRemote();send(true);return;}
 if(m.type==='goto-activity'){gotoActivity(clean(m.id));return;}
 if(m.type==='goto-resource'){switchMenu('resource');return;}
 if(m.type!=='mutation')return;
 try{
  const act=clean(m.action),d=m.data||{};
  let stats={};
  if((act==='leave-save'||act==='leave-delete')&&state.resources.some(r=>fold(r.nama)===fold(d.name)))await saveResourceLeave(act,d);
  else stats=await saveManual(act,d);
  frame()?.contentWindow?.postMessage({source:SOURCE,type:'mutation-result',requestId:m.requestId,ok:true,stats},location.origin);
 }catch(e){
  frame()?.contentWindow?.postMessage({source:SOURCE,type:'mutation-result',requestId:m.requestId,ok:false,error:String(e.message||e)},location.origin);
 }
});
const init=()=>{
 const f=frame();
 f?.addEventListener('load',()=>{lastSignature='';send(true);});
 initRemote();
 setInterval(()=>{if(typeof state!=='undefined'&&state.activeTab==='pusmantap')send(false)},4000);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
