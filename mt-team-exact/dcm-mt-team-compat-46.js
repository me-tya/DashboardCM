/* Dashboard CM <-> verbatim Modul Transformasi Tim Pusmantap compatibility shell.
 * The visual renderer, event handlers, rules and styling come exclusively
 * from the source MT modules. No copied HTML mockups, sample rosters, or
 * substitute logic. Dashboard CM supplies live Activity/CM resource data.
 */
var S={ui:{},oneonone:[],users:[],modMeta:{}};
var ME={role:'PMOK',nama:'',email:''};
var TODAY=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});
var UNITS=[];
var FB=null;
var ACT={};
var __mtData=null,__mtReady=false,__mtSaveTimer=null,__mtId=0,__mtLocalState={};
const MT_SOURCE='dcm-tim-pusmantap';
const MT_TEAMS=['Tim DCS','Tim DOA','Tim SPP','Tim SSB','Tim CM'];
const MT_STR={'Kepala Pusat':'kapus','Kepala Bidang Program dan Manajemen Pengetahuan':'kabid','Kepala Subbidang Program dan Sistem Kerja':'psk','Kepala Subbagian Tata Usaha':'tu','Kepala Subbidang Manajemen Pengetahuan':'mp'};
const mtCopy=x=>JSON.parse(JSON.stringify(x));
const mtTxt=x=>String(x??'').trim();
function esc(s){return mtTxt(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function uid(){return 'DCM-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function log(){/* Audit persistence is managed by the DCM parent, not MT Firestore. */}
function toast(s){const el=document.getElementById('mt-toast');if(!el)return;el.textContent=mtTxt(s);el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,4000)}
function actCanEdit(){return !!(__mtData&&__mtData.canEdit)}
function ACT_HDR(){return ''}
function AKT_HDR(){return ''}
function actStamp(d){d.updatedAt=new Date().toISOString()}
function actTglShort(ds){if(!ds)return '';const d=new Date(String(ds).slice(0,10)+'T12:00:00');return isNaN(+d)?String(ds):d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
function attNorm(o){if(!o)return {no:'',items:[]};if(typeof o==='string')return {no:o,items:[]};if(Array.isArray(o))return {no:'',items:o};return {no:mtTxt(o.no||o.nomor||o.number),items:Array.isArray(o.items)?o.items:[]}}
function actNm(o){return mtTxt(o.nama||o.namaKegiatan||o.judul||o.title||'Aktivitas')}
function actRows(){return (__mtData?.activities||[]).map(a=>({
 id:mtTxt(a.id),tgl:mtTxt(a.date),tglSelesai:mtTxt(a.end||a.date),
 jam:mtTxt(a.time),nama:mtTxt(a.title),unitP:mtTxt(a.unit),
 pic:mtTxt(a.people||a.pic),lokasi:mtTxt(a.location),
 mode:/online|teams|zoom|daring/i.test(mtTxt(a.location))?'Online':'Offline',
 status:mtTxt(a.status),kategori:mtTxt(a.category),
 st:a.assignment?{no:mtTxt(a.assignment),items:[]}:null,und:null
})).filter(a=>a.tgl&&a.nama)}
function oneDoc(id,key,def){
 let d=S.oneonone.find(x=>x.id===id);
 if(!d){d={id,kind:'cfg',tahun:0,tw:0};S.oneonone.push(d)}
 if(key&&!d[key])d[key]=def??{};
 return d
}
function actMaster(){
 const d=oneDoc('cfg-master','master',{pic:[]});
 if(!Array.isArray(d.master.pic))d.master.pic=[];
 if(!Array.isArray(d.master.kat))d.master.kat=[];
 if(!Array.isArray(d.master.unit))d.master.unit=[];
 return d.master
}
function actMasterSave(obj){oneDoc('cfg-master','master',{}).master=obj;save()}
function kpCfg(){
 const k=oneDoc('cfg-kp','kp',{}).kp;
 if(!Array.isArray(k.tims)||!k.tims.length)k.tims=MT_TEAMS.slice();
 k.pt=k.pt||{};k.ptx=k.ptx||{};k.str=k.str||{};k.stp=k.stp||{};
 k.asg=k.asg||{};k.rl=k.rl||{};k.prog=k.prog||{};
 return k
}
function kpPeople(){return S.oneonone.filter(x=>x.kind==='cfg'&&x.kp&&String(x.id).startsWith('cfg-kp-')).map(x=>({...x.kp,_id:x.id}))}
function kpPersonSave(p){const id=p._id||'cfg-kp-'+uid(),o={...p};delete o._id;oneDoc(id,'kp',{}).kp=o;save();return id}
function kpOn(p){return p&&p.status!=='Nonaktif'&&p.statusKerja!=='Nonaktif'}
function kpOffLbl(p){return '<span class="t-chip t-gr">Tidak aktif</span>'}
function kpHistSep(n){return '<div class="t-xs t-muted">'+n+' kontak tidak aktif</div>'}
function kpUnitList(){return [...new Set(UNITS.concat(kpPeople().map(p=>p.unit)).filter(Boolean))].sort()}
function kpTimAdd(){
 if(!actCanEdit())return toast('Tidak memiliki izin mengubah tim.');
 modal('Tambah Tim','<div class="fld"><label>Nama tim</label><input class="inp" id="mt-add-team" placeholder="Tim ..."></div>','Simpan',el=>{
  const raw=mtTxt(el.querySelector('#mt-add-team')?.value);if(!raw)return false;
  const n=/^Tim /i.test(raw)?raw:'Tim '+raw;
  const k=kpCfg();if(k.tims.some(x=>x.toLowerCase()===n.toLowerCase())){toast('Tim sudah ada');return false}
  k.tims.push(n);save();render();return true;
 },{size:'sm'})
}
function modal(title,body,submit,action,options){
 const veil=document.createElement('div');veil.className='ov mt-compat-modal';
 veil.innerHTML='<div class="md" role="dialog" aria-modal="true"><div class="mdh"><h3>'+esc(title)+'</h3><button type="button" class="mt-close" aria-label="Tutup">×</button></div><div class="mdb">'+body+'</div><div class="mdf"><button type="button" class="mt-cancel btn">Batal</button><button type="button" class="mt-submit btn pri">'+esc(submit||'Simpan')+'</button></div></div>';
 document.body.appendChild(veil);
 function close(){veil.remove()}
 veil.querySelector('.mt-close').onclick=close;veil.querySelector('.mt-cancel').onclick=close;
 veil.querySelector('.mt-submit').onclick=()=>{
  try{const r=action?.(veil);if(r!==false)close()}
  catch(e){toast(e.message||String(e))}
 };
 return veil
}
function kuResize(file){return Promise.resolve('')}
function render(){
 if(!__mtReady||!__mtData)return;
 try{
  const out=window.MT_T2.page();
  const app=document.getElementById('mt-app');
  if(app)app.innerHTML=out;
  document.getElementById('mt-error').hidden=true;
  mtResize();
 }catch(e){
  const err=document.getElementById('mt-error');
  if(err){err.textContent='Gagal memuat Tim Pusmantap: '+String(e.message||e);err.hidden=false}
  console.error('[MT compatibility render]',e);
 }
}
function mtResize(){if(window.self===window.top)return;window.parent.postMessage({source:MT_SOURCE,type:'resize',height:Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)},location.origin)}
function save(){
 if(!actCanEdit())return;
 clearTimeout(__mtSaveTimer);
 __mtSaveTimer=setTimeout(()=>{
  const docs=S.oneonone.filter(d=>d&&d.id&&/^(cfg-master|cfg-kp|cfg-tim|cfg-agpim|cfg-kp-[\w-]+|pub-tim)$/.test(d.id)).map(mtCopy);
  __mtSend('mutation',{action:'mt-state-sync',data:{docs,ui:S.ui}});
 },180)
}
function __mtSend(type,rest){if(window.self!==window.top)window.parent.postMessage({source:MT_SOURCE,type,...rest},location.origin)}
function mtMemberFromSnapshot(r){
 const job=mtTxt(r.job||r.jabatan),name=mtTxt(r.name||r.nama);
 return {n:name,nip:mtTxt(r.nip),jab:job,pang:mtTxt(r.pang),
  jenis:/sementara|magang|secondment|re-entry/i.test(mtTxt(r.jenis))?'Sementara':'Definitif',
  jenisSementara:mtTxt(r.jenis),peran:mtTxt(r.role),tim:/CM/i.test(mtTxt(r.team||r.role))?'CM':'Pusmantap',
  status:mtTxt(r.status)||'WFO',statusKerja:mtTxt(r.status)||'WFO',
  statusMulai:mtTxt(r.statusMulai),statusSelesai:mtTxt(r.statusSelesai),
  jenisCuti:mtTxt(r.jenisCuti),unitAsal:mtTxt(r.unit),
  wfhDays:Array.isArray(r.wfhDays)?r.wfhDays.map(Number):[],
  cuti:(r.leavePlans||[]).map(c=>({mulai:c.mulai,selesai:c.selesai||c.mulai,jenis:c.jenis,catatan:c.catatan||''})),
  foto:mtTxt(r.foto),hp:mtTxt(r.hp),emailK:mtTxt(r.emailK)
 };
}
function mtLoadSnapshot(m){
 if(!m||m.source!==MT_SOURCE||m.type!=='snapshot')return;
 __mtData=m; TODAY=/^\d{4}-\d{2}-\d{2}$/.test(m.today)?m.today:TODAY;
 ME={role:'PMOK',email:mtTxt(m.email)||'dcm',nama:mtTxt(m.user)||'Dashboard CM'};
 const oldUi=S.ui||{},stored=m.manual?.mtState||{};
 S.ui={...(stored.ui||{}),...oldUi};
 const docs=Array.isArray(stored.docs)?mtCopy(stored.docs).filter(x=>x&&typeof x.id==='string'):[];
 S.oneonone=docs;
 const master=actMaster(),existing=Array.isArray(master.pic)?master.pic:[];
 const raw=[...(m.resources||[]),...(m.manual?.members||[])].filter(x=>mtTxt(x.name));
 const seen=new Set();const roster=[];
 raw.forEach(src=>{
  const n=mtTxt(src.name),key=n.toLocaleLowerCase('id-ID');
  if(!n||seen.has(key))return;seen.add(key);
  const before=existing.find(p=>mtTxt(p.n).toLocaleLowerCase('id-ID')===key);
  const incoming=mtMemberFromSnapshot(src);
  roster.push(before?{...incoming,...before,n}:incoming);
 });
 existing.forEach(p=>{const k=mtTxt(p.n).toLocaleLowerCase('id-ID');if(k&&!seen.has(k)){seen.add(k);roster.push(p)}});
 master.pic=roster;
 const k=kpCfg(),teams=m.manual?.teams||{},str=m.manual?.structural||{};
 for(const p of roster){
  const t=mtTxt(teams[p.n]);if(t){const name=/^Tim /i.test(t)?t:'Tim '+t;k.pt[p.n]=name;if(!k.tims.includes(name))k.tims.push(name)}
  const rk=MT_STR[str[p.n]];if(rk)k.str[rk]=p.n;
 }
 UNITS=[...new Set((m.activities||[]).map(a=>mtTxt(a.unit)).filter(Boolean))].sort();
 S.users=[];
 render();
}
window.addEventListener('message',ev=>{
 if(ev.origin!==location.origin||ev.source!==window.parent)return;
 if(ev.data?.source!==MT_SOURCE)return;
 if(ev.data.type==='snapshot')mtLoadSnapshot(ev.data);
 if(ev.data.type==='mutation-result'&&!ev.data.ok){
  toast('Perubahan belum tersimpan: '+mtTxt(ev.data.error));
  __mtSend('ready',{});
 }
});
window.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector('.mt-compat-modal')?.remove()});
document.addEventListener('click',e=>{
 const el=e.target.closest('#mt-app [data-act]');if(!el)return;
 const act=el.dataset.act;
 if(act==='tmAdd')window.MT_TIM?.form();
 else if(act==='tmEdit')window.MT_TIM?.form(el.dataset.v);
 else if(act==='tmUnits')window.MT_TIM?.unitsForm(el.dataset.v);
 else if(act==='tmSel'){S.ui.tmSel=el.dataset.v;render()}
 else if(act==='tmTeam'){S.ui.tmTeam=el.dataset.v;render()}
 else if(act==='tmView'){S.ui.tmView=el.dataset.v;render()}
 else if(act==='kpTimAdd')kpTimAdd();
 else if(act==='oneAdd')__mtSend('goto-activity',{id:''});
 else if(act==='oneEdit'||act==='oneUndPv')__mtSend('goto-activity',{id:el.dataset.v||el.dataset.id||''});
 else if(act==='tmDel'||act==='kuDel'){toast('Periksa profil sebelum menghapus data.')}
});
window.mtTeamReady=function(){
 __mtReady=!!(window.MT_TIM&&window.MT_T2);
 if(!__mtReady){document.getElementById('mt-error').hidden=false;return}
 __mtSend('ready',{});
};
if(window.self!==window.top&&typeof ResizeObserver==='function'){
 new ResizeObserver(mtResize).observe(document.body);
}
