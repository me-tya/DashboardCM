(function(){
'use strict';
if(window.DCM_MT_TOOLS)return;
const now=()=>new Date().toISOString(),uid=()=>`dcm-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const editor=()=>document.querySelector('#agendaForm');
const D=()=>window.DCM_MT_DOC_ENGINE;
const mutable=()=>typeof cmCanMutate==='function'&&cmCanMutate();
const privileged=()=>typeof cmCanManageReferences==='function'&&cmCanManageReferences();
// The data-management toolbar is for authenticated Superadmin accounts only.
const loggedInSuperadmin=()=>privileged()&&document.documentElement.getAttribute('data-role')==='superadmin'&&!!window.fbAuth?.currentUser;
const say=(message,bad=false)=>{if(typeof toast==='function')toast(message,bad?'error':'info');else alert(message);};
const term=(a,b)=>typeof uiText==='function'?uiText(a,b):b;
const read=(f,k)=>f?.querySelector(`[name="${k}"]`)?.value?.trim()||'';
const stamp=()=>new Date().toISOString().slice(0,10);
const idFromForm=()=>typeof state!=='undefined'&&state?.editingId||'';
const fmt=(date)=>{if(!date)return '';const d=new Date(date+'T00:00:00');return isNaN(+d)?date:d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});};
const cmState=()=>typeof state!=='undefined'&&state&&Array.isArray(state.agendas)?state:null;
const notify=(t,error=false)=>{let n=document.getElementById('dcmDbkNotice');if(!n){n=document.createElement('div');n.id='dcmDbkNotice';n.innerHTML='<span></span><button type="button" title="Tutup">×</button>';n.querySelector('button').onclick=()=>n.remove();document.body.appendChild(n);}n.querySelector('span').textContent=t;n.style.background=error?'#8b2b36':'#102c52';};

function renderMenu(button){
 if(!loggedInSuperadmin()){document.getElementById('dcmMtDbkMenu')?.remove();button?.remove();return;}
 const old=document.getElementById('dcmMtDbkMenu');
 if(old){old.remove();button.setAttribute('aria-expanded','false');return}
 const menu=document.createElement('div');menu.id='dcmMtDbkMenu';menu.className='dcm-dbk-menu';menu.setAttribute('role','menu');
 const item=(key,title,desc,ico)=>`<button type="button" role="menuitem" data-dcm-db="${key}"><svg viewBox="0 0 24 24"><path d="${ico}"/></svg><span><b>${title}</b><small>${desc}</small></span></button>`;
 menu.innerHTML='<header>Ekspor</header>'+
  item('excel','Ekspor Excel','Daftar aktivitas berdasarkan filter aktif','M14 2H6v20h12V8z M14 2v6h6 M9 13h6 M9 17h6')+
  item('backup','Backup All (JSON)','Cadangan data Dashboard CM','M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3')+
  (privileged()?item('zipExport','Ekspor paket ZIP + lampiran','Migrasi lengkap ke Modul Transformasi','M14 2H6v20h12V8z M14 2v6h6 M10 11v6m-2-4h4'):'')+
  '<hr><header>Impor dan pemulihan</header>'+
  (mutable()?item('json','Impor JSON aktivitas','Gabungkan berdasarkan ID, tanpa menghapus data lain','M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3')+
  item('zip','Impor paket ZIP + lampiran','Pulihkan metadata dan berkas dari paket migrasi','M14 2H6v20h12V8z M14 2v6h6 M10 8v10')+
  item('restore','Restore All','Pemulihan penuh melalui konfirmasi Dashboard CM','M12 20V8m-5 5 5-5 5 5M4 6V3h16v3'):'')+
  '<div class="dcm-dbk-warning">Impor aktivitas tidak menghapus data lain. Restore All menggunakan alur konfirmasi bawaan dan dapat mengganti data.</div>';
 document.body.appendChild(menu);button.setAttribute('aria-expanded','true');
 const r=button.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;
 menu.style.left=Math.max(8,Math.min(r.right-w,window.innerWidth-w-8))+'px';
 menu.style.top=(r.bottom+8+h>window.innerHeight?Math.max(8,r.top-h-8):r.bottom+8)+'px';
 const close=()=>{menu.remove();button.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',key);window.removeEventListener('resize',close);window.removeEventListener('scroll',close,true);};
 const outside=e=>{if(!menu.contains(e.target)&&e.target!==button&&!button.contains(e.target))close();};
 const key=e=>{if(e.key==='Escape'){close();button.focus();}};
 document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',key);
 window.addEventListener('resize',close);window.addEventListener('scroll',close,true);
 menu.addEventListener('click',e=>{const b=e.target.closest('[data-dcm-db]');if(!b)return;const op=b.dataset.dcmDb;close();
  if(op==='excel')document.getElementById('btnExport')?.click();
  if(op==='backup')document.getElementById('btnBackupAll')?.click();
  if(op==='restore')document.getElementById('btnRestoreAll')?.click();
  if(op==='zipExport'){try{if(typeof cmExportMtBundle!=='function')throw Error('Fitur ekspor ZIP belum termuat.');Promise.resolve(cmExportMtBundle()).catch(err=>notify('Ekspor ZIP gagal: '+err.message,true));}catch(err){notify(err.message,true);}}
  if(op==='json')document.getElementById('dcmDbkJsonInput')?.click();
  if(op==='zip')document.getElementById('dcmDbkZipInput')?.click();
 });
}
/* DCM 261116-07: same working Data & Backup button, across menu toolbars. */
function placeBackupButton(button,filter){
 const tab=typeof state==='undefined'?'table':state.activeTab;
 const before=anchor=>{
  if(anchor&&anchor.parentNode&&(button.parentNode!==anchor.parentNode||button.nextSibling!==anchor))anchor.parentNode.insertBefore(button,anchor);
 };
 const append=host=>{if(host&&(button.parentNode!==host||button!==host.lastElementChild))host.appendChild(button);};
 if(tab==='priority'){
  const host=document.getElementById('tab-priority');
  const filterAction=host?.querySelector('#prioFilterToggle');
  if(filterAction){before(filterAction);return;}
  const toolbar=host?.querySelector('.prio-toolbar-actions');
  if(toolbar){if(toolbar.firstElementChild)before(toolbar.firstElementChild);else append(toolbar);return;}
 }
 if(tab==='tasks'){
  const host=document.querySelector('#tab-tasks .task-tools');
  if(host){const reset=host.querySelector('#taskReset');if(reset)before(reset);else append(host);return;}
 }
 if(tab==='resource'){
  const host=document.querySelector('#tab-resource .res-toolbar');
  if(host){append(host);return;}
 }
 if(tab==='pusmantap'){
  const panel=document.getElementById('tab-pusmantap');
  if(panel){
   let row=panel.querySelector(':scope > .dcm-dbk-special');
   if(!row){row=document.createElement('div');row.className='dcm-dbk-special';panel.insertBefore(row,panel.firstChild);}
   append(row);return;
  }
 }
 before(filter);
}
/* Keep Reset next to Kompilasi Laporan, after the right-alignment spacer. */
function alignFilterResetWithReports(){
 const actions=document.querySelector('#filterBarBody .cm-fact');
 const reset=actions?.querySelector('#btnResetFilter'),spacer=actions?.querySelector('.sp');
 if(reset&&spacer&&spacer.nextElementSibling!==reset)spacer.after(reset);
}
function setToolbar(){
 const bar=document.getElementById('contextFilterBar'),filter=document.getElementById('btnFilterToggle');
 if(!bar||!filter)return;
 if(!loggedInSuperadmin()){
  document.getElementById('dcmMtDbkMenu')?.remove();
  document.getElementById('dcmActDbk')?.remove();
  alignFilterResetWithReports();
  return;
 }
 let button=document.getElementById('dcmActDbk');
 if(!button){
  button=document.createElement('button');button.id='dcmActDbk';button.type='button';
  button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg><span>Data &amp; Backup</span>';
  button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
  button.addEventListener('click',()=>renderMenu(button));filter.parentNode.insertBefore(button,filter);
 }
 button.classList.remove('hidden');
 placeBackupButton(button,filter);
 alignFilterResetWithReports();
 if(!document.getElementById('dcmDbkJsonInput')){
  const fi=document.createElement('input');fi.id='dcmDbkJsonInput';fi.type='file';fi.accept='.json,application/json';fi.hidden=true;document.body.appendChild(fi);
  fi.addEventListener('change',async()=>{const f=fi.files?.[0];fi.value='';if(!f)return;try{if(f.size>24*1024*1024)throw Error('File JSON maksimal 24 MB.');const o=JSON.parse(await f.text());const records=Array.isArray(o)?o:Array.isArray(o.agendas)?o.agendas:null;if(!records)throw Error('File tidak memuat daftar agendas.');await mergeAgendas(records,f.name);}catch(err){notify('Impor JSON gagal: '+err.message,true);}});
  const zi=document.createElement('input');zi.id='dcmDbkZipInput';zi.type='file';zi.accept='.zip,application/zip';zi.hidden=true;document.body.appendChild(zi);
  zi.addEventListener('change',async()=>{const f=zi.files?.[0];zi.value='';if(!f)return;try{await importZip(f);}catch(err){notify('Impor ZIP gagal: '+err.message,true);}});
 }
}
async function mergeAgendas(records,name,options={}){
 if(!mutable())throw Error('Akses edit diperlukan untuk mengimpor.');
 const st=cmState();if(!st)throw Error('Data aktivitas belum dimuat.');if(records.length>30000)throw Error('Jumlah data terlalu besar.');
 if(records.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw Error('Format baris aktivitas tidak sesuai.');
 const seen=new Set(),recordsUnique=records.filter(x=>{const k=String(x.id||'').trim();if(k&&seen.has(k))return false;if(k)seen.add(k);return true;});
 const ids=new Set(st.agendas.map(x=>String(x.id||'')));const update=recordsUnique.filter(x=>x.id&&ids.has(String(x.id))).length,added=recordsUnique.length-update;
 if(!options.confirmed&&!confirm(`Impor ${recordsUnique.length} aktivitas dari ${name}?\n${added} baru, ${update} ID sama akan diperbarui.\nData aktivitas yang tidak ada dalam berkas tetap dipertahankan.`))return false;
 const prev=st.agendas.slice();
 const map=new Map(st.agendas.map((a,i)=>[String(a.id||''),i]));
 try{
  for(const src of recordsUnique){const item={...src};if(!item.id)item.id=typeof uid==='function'?uid('AGD'):'AGD-'+Date.now()+'-'+Math.random().toString(36).slice(2);const key=String(item.id),index=map.get(key);if(index!=null){st.agendas[index]={...st.agendas[index],...item};}else{map.set(key,st.agendas.length);st.agendas.push(item);}}
  const ok=await persist();if(!ok)throw Error('Firebase belum mengonfirmasi penyimpanan.');
  if(typeof refreshAll==='function')refreshAll();
  notify(`Impor selesai: ${added} aktivitas baru, ${update} diperbarui. Data lain tidak dihapus.`);
  return true;
 }catch(err){st.agendas=prev;if(typeof refreshAll==='function')refreshAll();throw err;}
}
async function importZip(file){
 if(!mutable())throw Error('Akses edit diperlukan.');if(!window.JSZip)throw Error('JSZip belum siap.');
 if(file.size>120*1024*1024)throw Error('File ZIP melebihi batas 120 MB.');
 const zip=await window.JSZip.loadAsync(file);const textEntry=zip.file('manifest.json')||zip.file('agendas.json')||zip.file('backup.json');
 if(!textEntry)throw Error('Tidak ditemukan manifest.json / agendas.json / backup.json.');
 const parsed=JSON.parse(await textEntry.async('text'));
 const records=Array.isArray(parsed)?parsed:parsed.agendas;
 if(!Array.isArray(records))throw Error('Manifest tidak memuat agendas.');
 const items=Array.isArray(parsed.files)?parsed.files.filter(x=>x?.refId&&x?.path&&!x.error):[];
 if(!confirm(`Impor ${records.length} aktivitas dan maksimal ${items.length} lampiran dari ZIP ${file.name}?\nRekaman dengan ID sama digabung. Data lain tidak dihapus.`))return;
 let filesOk=0,missing=0,failed=0;
 if(items.length){
  if(!window.fbDb||!window.fbGetDoc||!window.fbSetDoc||!window.fbDoc)throw Error('Firebase belum siap untuk lampiran.');
  for(const item of items){
   try{
    if(!zip.file(item.path)){missing++;continue;}
    const ref=window.fbDoc(window.fbDb,'dashboardImages',String(item.refId));
    const already=await window.fbGetDoc(ref);if(already.exists()){filesOk++;continue;}
    const entry=zip.file(item.path);const base64=await entry.async('base64'),mime=String(item.mime||'application/octet-stream');
    if(base64.length>850000){failed++;continue;}
    await window.fbSetDoc(ref,{dataUrl:'data:'+mime+';base64,'+base64,name:String(item.name||'Berkas'),mime,createdAt:now(),activityId:''});
    filesOk++;
   }catch(err){failed++;console.warn('[DCM ZIP] Skip attachment',item.refId,err);}
  }
 }
 const ok=await mergeAgendas(records,file.name,{confirmed:true});
 if(ok)notify(`ZIP selesai: ${records.length} aktivitas · ${filesOk} berkas tersedia${missing||failed?` · ${missing+failed} belum dapat dipulihkan`:''}.`);
}
function getSession(form){
 const date=read(form,'tglMulai')||stamp(),start=read(form,'jamMulai'),end=read(form,'jamSelesai');
 const location=form.querySelector('[name="meetingLocation"]')?.value?.trim()||read(form,'lokasiChannel')||'';
 const link=form.querySelector('[name="meetingLink"]')?.value?.trim()||'';
 const program=read(form,'programTerkait'),unit=read(form,'unitPemohon')||form.querySelector('#unitPemohonSelect option:checked')?.textContent?.trim()||'';
 const mode=form.querySelector('input[name="meetingMode"]:checked')?.value||form.querySelector('select[name="meetingMode"]')?.value||'Hybrid';
 return {id:uid(),tahun:Number(date.slice(0,4)),tw:Math.ceil(Number(date.slice(5,7))/3)||1,no:1,tgl:date,j1:start,j2:end,program,tema:read(form,'namaKegiatan'),uic:unit,lokasi:location,link,mode,cek:true,sasaran:''};
}
function getBase(form){
 const date=read(form,'tglMulai')||stamp(),j1=read(form,'jamMulai'),j2=read(form,'jamSelesai'),unit=read(form,'unitPemohon');
 const location=form.querySelector('[name="meetingLocation"]')?.value||read(form,'lokasiChannel')||'';
 const link=form.querySelector('[name="meetingLink"]')?.value||'';
 const raw=read(form,'picTimCM')||'',persons=raw.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
 const resources=typeof state!=='undefined'&&Array.isArray(state.resources)?state.resources:[];
 return {nama:read(form,'namaKegiatan'),tujuan:read(form,'tujuanOutput'),peserta:read(form,'pesertaTarget'),tgl:date,jam:[j1,j2].filter(Boolean).join(' - ')+(j1&&j2?' WIB':''),lokasi:[location,link].filter(Boolean).join(' / '),hal:read(form,'namaKegiatan'),pen:'Wawan Juswanto',sifat:'Segera',dasar:read(form,'undangan')||'',dipa:'',pic:persons.map(n=>{const p=resources.find(x=>x.nama===n)||{};return {nama:n,nip:p.nip||'',pangkat:[p.pangkat,p.golongan].filter(Boolean).join(' / '),jabatan:p.jabatan||''};}),unit};
}
function starter(form,kind){
 const base=getBase(form),s=getSession(form),year=s.tahun,tw=s.tw;
 const cfg={jenis:'program',sifat:'Segera',pen:'Wawan Juswanto',tempat:'Ruang Rapat Gedung JB. Sumarlin Lantai 4 dan Microsoft Teams',link:'',rapat:null,tujuan:D().ONE_TUJUAN.slice(),p:{},conf:{tw:false,rapat:false,tempat:false,link:false,tujuan:false}};
 let saved=null;const aid=idFromForm();if(aid){
  const a=cmState()?.agendas.find(x=>String(x.id)===String(aid));if(a?.cmMtOneOnOneDraft)saved=a.cmMtOneOnOneDraft;
 }
 if(!saved)try{
  const keys=[aid&&'dcm-mt-one-'+aid,'dcm-mt-one-'+base.nama+'-'+base.tgl].filter(Boolean);
  for(const key of keys){const item=JSON.parse(localStorage.getItem(key)||'null');if(item?.cfg&&Array.isArray(item.rows)){saved=item;break;}}
 }catch(e){console.warn('Draft lokal belum bisa dibaca',e);}
 const B=saved&&saved.cfg&&Array.isArray(saved.rows)?saved:{cfg,rows:[s]};
 // Dokumen biasa dan Surat Tugas juga harus memulihkan draft, tidak hanya 1-on-1.
 if(kind==='und'||kind==='st'){
  const a=aid?cmState()?.agendas.find(x=>String(x.id)===String(aid)):null;
  let draft=a?.cmMtDocumentDrafts?.[kind];
  if(!draft)try{
   const keys=[aid&&'dcm-mt-letter-'+aid+'-'+kind,'dcm-mt-letter-'+base.nama+'-'+base.tgl+'-'+kind].filter(Boolean);
   for(const key of keys){const d=JSON.parse(localStorage.getItem(key)||'null');if(d?.base){draft=d;break;}}
  }catch(e){console.warn('Draft surat lokal belum bisa dibaca',e);}
  if(draft?.base&&typeof draft.base==='object'&&!Array.isArray(draft.base)){
   for(const k of ['nama','tujuan','peserta','tgl','jam','lokasi','hal','pen','sifat','dasar','dipa','pic','unit']){
    const val=draft.base[k];if(k==='pic'?Array.isArray(val):typeof val==='string')base[k]=val;
   }
  }
 }
 return {kind,base,B,year:saved?.year||year,tw:saved?.tw||tw,form,aid,status:''};
}
const previewKop=()=>`<header><img src="${E(D().ONE_LOGO)}" alt="Logo Kementerian Keuangan"><div class="kop"><b>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</b><b>BADAN TEKNOLOGI, INFORMASI, DAN INTELIJEN KEUANGAN</b><b>PUSAT MANAJEMEN TRANSFORMASI DAN PERUBAHAN</b><small>GEDUNG JB. SUMARLIN LANTAI 1-6, JALAN DR. WAHIDIN RAYA NO. 1, JAKARTA 10710</small></div></header>`;
const mark=(val,flag,placeholder='[perlu diisi]')=>flag?`<mark>${E(val||placeholder)}</mark>`:E(val||placeholder);
const rowsInfo=()=>[...new Set((cmState()?.agendas||[]).flatMap(x=>[x.programTerkait||'',x.unitPemohon||'']).map(s=>String(s).trim()).filter(Boolean))].slice(0,250);
function ordinaryPreview(d){
 const x=d.base,st=d.kind==='st';
 const title=st?'SURAT TUGAS':'UNDANGAN';
 const signature=`<div class="doc-sign">Kepala Pusat Manajemen<br>Transformasi dan Perubahan<div class="space"></div><small>Ditandatangani secara elektronik</small><br>${mark(x.pen,!x.pen,'[penandatangan]')}</div>`;
 const tr=(k,v)=>`<tr><td>${k}</td><td>: ${v}</td></tr>`;
 return `<div class="dcm-doc-paper">${previewKop()}<table class="doc-facts">${tr('Nomor',mark('',true,st?'[@NomorST]':'[@NomorND]'))}${tr('Tanggal',mark('',true,st?'[@TanggalST]':'[@TanggalND]'))}${tr('Sifat',E(x.sifat))}${tr('Hal',mark(x.hal,!x.hal))}</table>${st?`<h3>SURAT TUGAS</h3><p>Sehubungan dengan ${mark(x.dasar,!x.dasar,'[nomor undangan]')}, bersama ini kami menugasi pejabat/pegawai berikut:</p><table class="doc-schedule"><tr><th>No</th><th>Nama / NIP</th><th>Pangkat / Gol.</th><th>Jabatan</th></tr>${(x.pic.length?x.pic:[{nama:''}]).map((p,i)=>`<tr><td>${i+1}</td><td>${mark(p.nama,!p.nama)}<br>${E(p.nip)}</td><td>${E(p.pangkat)}</td><td>${E(p.jabatan)}</td></tr>`).join('')}</table><p>Untuk melaksanakan kegiatan ${mark(x.nama,!x.nama)} pada tanggal ${mark(x.tgl,!x.tgl)} pukul ${mark(x.jam,!x.jam)} bertempat di ${mark(x.lokasi,!x.lokasi)}.</p><p>Biaya dibebankan pada DIPA ${mark(x.dipa,!x.dipa)}.</p>`:`<p>Yth. ${mark(x.peserta,!x.peserta,'[penerima undangan]')}</p><p>${mark(x.tujuan,!x.tujuan,'Sehubungan dengan kegiatan koordinasi, kami mengundang Saudara pada:')}</p><table class="doc-facts">${tr('Hari/tanggal',mark(fmt(x.tgl),!x.tgl))}${tr('Pukul',mark(x.jam,!x.jam))}${tr('Tempat',mark(x.lokasi,!x.lokasi))}${tr('Agenda',mark(x.nama,!x.nama))}</table><p>Mengingat pentingnya acara dimaksud, kami mohon kehadiran tepat waktu.</p><p>Demikian kami sampaikan, atas perhatian dan kerja sama diucapkan terima kasih.</p>`}${signature}</div>`;
}
function onePreview(d){
 const B=d.B,C=B.cfg,rm=D().ONE_RM[d.tw]||'I',Y=d.year,conf=C.conf||{},p=C.p||{};
 const p1=p.p1||D().ONE_DEF.p1(rm,Y),p2a=p.p2a||D().ONE_DEF.p2a,p2b=p.p2b||D().ONE_DEF.p2b,p3=p.p3||D().ONE_DEF.p3;
 const tr=(k,v)=>`<tr><td>${k}</td><td>: ${v}</td></tr>`;
 const sign=`<div class="doc-sign">Kepala Pusat Manajemen<br>Transformasi dan Perubahan<div class="space"></div><small>Ditandatangani secara elektronik</small><br>${mark(C.pen,!C.pen,'[penandatangan]')}</div>`;
 return `<div class="dcm-doc-paper">${previewKop()}<table class="doc-facts">${tr('Nomor',mark('',true,'[@NomorND]'))}${tr('Tanggal',mark('',true,'[@TanggalND]'))}${tr('Sifat',E(C.sifat||'Segera'))}${tr('Lampiran','Dua berkas')}${tr('Hal',`Undangan Rapat 1-on-1 Pembahasan Progres Program Transformasi Kementerian Keuangan Triwulan ${mark(rm,!conf.tw)} Tahun ${Y}`)}</table>
 <p>Yth. Daftar Undangan Terlampir</p><p style="text-align:justify;text-indent:25px">${E(p1)}</p><table class="doc-facts">${tr('Hari, tanggal',mark(C.rapat||D().oneRange(B.rows),!conf.rapat))}${tr('Pukul','Sesuai jadwal pada Lampiran II')}${tr('Tempat',mark(C.tempat,!conf.tempat))}</table>
 <p style="text-align:justify;text-indent:25px">${E(p2a)} ${mark(C.link,!conf.link,'[tautan materi]')}${E(p2b)}</p><p>${E(p3)}</p>${sign}
 <div class="doc-page"><p>Lampiran I Undangan</p><h3>DAFTAR TUJUAN UNDANGAN</h3>${(C.tujuan||[]).map((t,i)=>`<p style="margin:3px 0">${i+1}. ${mark(t,!conf.tujuan)}</p>`).join('')}${sign}</div>
 <div class="doc-page"><p>Lampiran II Undangan</p><h3>JADWAL RAPAT 1-ON-1 ${C.jenis==='unit'?'PER UNIT':''}<br>PEMBAHASAN PROGRES T-PROGRAM TRIWULAN ${rm} TAHUN ${Y}</h3>
 <table class="doc-schedule"><tr><th>No</th><th>Tanggal</th><th>Waktu</th><th>Agenda</th><th>Unit</th><th>Mode</th><th>Lokasi / Tautan</th></tr>${B.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${mark(fmt(r.tgl),r.cek||!r.tgl)}</td><td>${mark([r.j1,r.j2].filter(Boolean).join(' - '),r.cek||!r.j1||!r.j2)}</td><td>${E(r.program)}${r.tema?`<br><i>${E(r.tema)}</i>`:''}</td><td>${E(r.uic)}</td><td>${E(r.mode)}</td><td>${mark([r.lokasi,r.link].filter(Boolean).join(' / '),r.cek||(!(r.lokasi||r.link)))}</td></tr>`).join('')}</table>${sign}</div></div>`;
}
function fieldsBasic(d){
 const x=d.base,arr=[['nama','Nama kegiatan'],['hal','Hal surat'],['tujuan','Latar belakang / tujuan'],['peserta',d.kind==='st'?'Penerima informasi':'Penerima undangan'],['tgl','Tanggal kegiatan','date'],['jam','Waktu'],['lokasi','Tempat / tautan rapat'],['sifat','Sifat surat'],['pen','Penandatangan']];
 if(d.kind==='st')arr.push(['dasar','Dasar surat / undangan'],['dipa','DIPA'],['picNames','Petugas (pisahkan dengan koma)']);
 return `<div class="dcm-doc-title">Konsep ${d.kind==='st'?'Surat Tugas':'Undangan Biasa'}</div><div class="dcm-doc-fields">${arr.map(([key,label,type])=>{
 const val=key==='picNames'?d.base.pic.map(p=>p.nama).join(', '):x[key]||'',wide=['tujuan','picNames','peserta','lokasi'].includes(key);
 return `<label class="${wide?'wide':''}">${E(label)}${['tujuan','peserta'].includes(key)?`<textarea data-simple="${key}" rows="2">${E(val)}</textarea>`:`<input data-simple="${key}" type="${type||'text'}" value="${E(val)}">`}</label>`;}).join('')}</div>`;
}

/* Impor jadwal 1-on-1: baca tabel Lampiran II Word dari Modul Transformasi,
   juga mendukung Excel dengan kolom tanggal/waktu/agenda/unit. */
async function importOneSchedule(file,d){
 if(!file||!d||d.kind!=='one')return;
 if(file.size>12*1024*1024)throw Error('Berkas maksimal 12 MB.');
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 let tables=[],full='';
 if(ext==='docx'){
  if(!window.JSZip)throw Error('Pembaca DOCX belum dimuat.');
  const z=await window.JSZip.loadAsync(file),entry=z.file('word/document.xml');
  if(!entry)throw Error('Berkas Word tidak memuat document.xml.');
  const xml=new DOMParser().parseFromString(await entry.async('string'),'application/xml');
  if(xml.getElementsByTagName('parsererror').length)throw Error('Struktur dokumen Word tidak valid.');
  const t=n=>[...n.getElementsByTagNameNS('*','t')].map(v=>v.textContent||'').join(' ').replace(/\s+/g,' ').trim();
  full=t(xml);
  tables=[...xml.getElementsByTagNameNS('*','tbl')].map(tbl=>
   [...tbl.getElementsByTagNameNS('*','tr')].map(tr=>
    [...tr.childNodes].filter(n=>n.localName==='tc').map(tc=>t(tc))));
 }else if(['xlsx','xls'].includes(ext)){
  if(!window.XLSX)throw Error('Pembaca Excel belum siap.');
  const book=window.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
  tables=book.SheetNames.map(k=>window.XLSX.utils.sheet_to_json(book.Sheets[k],{header:1,defval:'',raw:false}).map(r=>r.map(v=>String(v||''))));
  full=book.SheetNames.join(' ');
 }else throw Error('Pilih Word (.docx) atau Excel (.xlsx/.xls) yang berisi jadwal 1-on-1.');
 const normal=v=>String(v||'').replace(/\s+/g,' ').trim();
 const low=v=>normal(v).toLowerCase();
 const cols=rows=>{
  const idx=rows.findIndex(r=>r.some(x=>/^(tanggal|hari\s*\/\s*tanggal)/i.test(normal(x)))&&r.some(x=>/^(waktu|pukul)/i.test(normal(x)))&&r.some(x=>/agenda|program/i.test(normal(x))));
  if(idx<0)return null;
  const names=rows[idx].map(low);
  const find=(p,f)=>{const n=names.findIndex(x=>p.test(x));return n<0?f:n;};
  const ix={date:find(/tanggal/,1),time:find(/waktu|pukul/,2),agenda:find(/agenda|program/,3),unit:find(/unit|uic/,4),mode:find(/mode|metode/,5),place:find(/lokasi|tempat|tautan/,6)};
  return rows.slice(idx+1).map(r=>({r,ix}));
 };
 const months={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
 const dateOf=s=>{
  const str=normal(s);
  let m=str.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);if(m)return [m[1],m[2],m[3]].map((x,i)=>i?String(x).padStart(2,'0'):x).join('-');
  m=str.match(/\b(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})\b/i);
  return m?m[3]+'-'+String(months[m[2].toLowerCase()]).padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';
 };
 const times=s=>{
  const m=normal(s).match(/(\d{1,2})[.:](\d{2})[^\d]+(\d{1,2})[.:](\d{2})/);
  return m?[m[1].padStart(2,'0')+':'+m[2],m[3].padStart(2,'0')+':'+m[4]]:['',''];
 };
 const parsed=[];
 for(const table of tables){
  const rows=cols(table);if(!rows)continue;
  for(const {r,ix}of rows){
   const program=normal(r[ix.agenda]),uic=normal(r[ix.unit]),tgl=dateOf(r[ix.date]),[j1,j2]=times(r[ix.time]);
   if(!tgl||!j1||!j2||!program||/^jumlah|total$/i.test(program))continue;
   const both=normal(r[ix.place]),url=(both.match(/https?:\/\/[^\s,;]+/i)||[])[0]||'';
   const place=normal(both.replace(url,'')).replace(/[;,\s]+$/,'');
   const rawMode=normal(r[ix.mode]),mode=/hybrid|campuran/i.test(rawMode)?'Hybrid':/online|daring/i.test(rawMode)?'Online':/offline|luring/i.test(rawMode)?'Offline':url&&place?'Hybrid':url?'Online':'Offline';
   const key=program.toLowerCase()+'|'+uic.toLowerCase()+'|'+tgl+'|'+j1;
   if(parsed.some(x=>x.key===key))continue;
   parsed.push({key,record:{id:uid(),tahun:Number(tgl.slice(0,4)),tw:Math.ceil(Number(tgl.slice(5,7))/3),no:0,tgl,j1,j2,program,uic,mode,lokasi:place,link:url,tema:'',cek:true,sasaran:''}});
  }
 }
 if(!parsed.length)throw Error('Tidak ditemukan tabel jadwal dengan kolom Tanggal, Waktu, Agenda, dan Unit. Periksa Lampiran II.');
 const existing=new Set(d.B.rows.map(r=>r.program.toLowerCase()+'|'+String(r.uic||'').toLowerCase()+'|'+r.tgl+'|'+r.j1));
 const fresh=parsed.filter(x=>!existing.has(x.key)).map(x=>x.record);
 if(!fresh.length){say('Semua sesi dari berkas sudah ada dalam draft.');return;}
 if(!confirm('Tambahkan '+fresh.length+' sesi dari '+file.name+'? '+(parsed.length-fresh.length)+' sesi duplikat akan dilewati.'))return;
 d.B.rows.push(...fresh);
 if(/JADWAL RAPAT 1-ON-1 PER UNIT/i.test(full))d.B.cfg.jenis='unit';
 d.status='Impor selesai: '+fresh.length+' sesi ditambahkan. Periksa tanda kuning sebelum mengunduh Word.';
 repaint();
}
function fieldsOne(d){
 const C=d.B.cfg;const formFields=[
 ['sifat','Sifat surat'],['pen','Penandatangan'],['tempat','Tempat bersama'],['link','Tautan materi'],['rapat','Hari/tanggal bersama'],['tujuan','Daftar tujuan Lampiran I (1 per baris)'],['p1','Paragraf pembuka'],['p2a','Paragraf pengantar materi'],['p2b','Paragraf penutup materi'],['p3','Paragraf penutup surat']
 ];
 const props={...C,p1:C.p?.p1||D().ONE_DEF.p1(D().ONE_RM[d.tw],d.year),p2a:C.p?.p2a||D().ONE_DEF.p2a,p2b:C.p?.p2b||D().ONE_DEF.p2b,p3:C.p?.p3||D().ONE_DEF.p3,tujuan:(C.tujuan||[]).join('\n')};
 return `<div class="dcm-doc-title">Pengaturan draft undangan — Triwulan ${D().ONE_RM[d.tw]} ${d.year}</div>
 <div class="dcm-doc-fields" style="margin-bottom:12px"><label class="wide">Jenis undangan (sama seperti Modul Transformasi)<select id="dcmDocJenis"><option value="program" ${C.jenis==='program'?'selected':''}>Per Program</option><option value="unit" ${C.jenis==='unit'?'selected':''}>Per Unit</option></select></label></div>
 <div class="dcm-doc-fields">${formFields.map(([key,label])=>`<label class="${['tujuan','p1','p2a','p2b','p3'].includes(key)?'wide':''}">${label}${['tujuan','p1','p2a','p2b','p3'].includes(key)?`<textarea data-cfg="${key}" rows="${key==='tujuan'?5:2}">${E(props[key]||'')}</textarea>`:`<input data-cfg="${key}" value="${E(props[key]||'')}">`}</label>`).join('')}</div>
 <div class="dcm-doc-review">${['tw','rapat','tempat','link','tujuan'].map(x=>`<label><input type="checkbox" data-confirm="${x}" ${C.conf?.[x]?'checked':''}> ${ {tw:'Triwulan',rapat:'Tanggal',tempat:'Tempat',link:'Tautan',tujuan:'Tujuan'}[x]} sudah dicek</label>`).join('')}</div>
 <div class="dcm-doc-title" style="margin-top:18px">Jadwal sesi 1-on-1</div>
 <div class="dcm-doc-sessions">${d.B.rows.map((r,i)=>`<section class="dcm-doc-session" data-session="${i}"><header>Sesi ${i+1}<button type="button" data-del-session="${i}">Hapus sesi</button></header><div class="dcm-doc-fields">
 ${[['program','Program / agenda','text'],['uic','Unit Eselon I','text'],['tgl','Tanggal','date'],['j1','Jam mulai','time'],['j2','Jam selesai','time'],['mode','Mode','mode'],['lokasi','Lokasi','text'],['link','Tautan Teams','text'],['tema','Tema / bahasan','text']].map(([key,label,typ])=>`<label class="${['program','tema'].includes(key)?'wide':''}">${label}${typ==='mode'?`<select data-row-field="${key}">${['Offline','Hybrid','Online'].map(m=>`<option ${r.mode===m?'selected':''}>${m}</option>`).join('')}</select>`:`<input data-row-field="${key}" type="${typ}" value="${E(r[key]||'')}" ${key==='program'?'list="dcmMtProgramList"':''}>`}</label>`).join('')}
 </div><div class="dcm-doc-review"><label><input type="checkbox" data-row-field="cek" ${r.cek?'':'checked'}> Tanggal, waktu dan lokasi sudah dicek</label></div></section>`).join('')}</div>
 <datalist id="dcmMtProgramList">${rowsInfo().map(s=>`<option value="${E(s)}"></option>`).join('')}</datalist>
 <div style="display:flex;gap:7px;margin-top:10px;flex-wrap:wrap"><button type="button" class="dcm-doc-btn" data-add-session>＋ Tambah sesi</button><button type="button" class="dcm-doc-btn" data-copy-tw>⧉ Salin ke TW berikutnya</button><button type="button" class="dcm-doc-btn" data-import-one>⇪ Impor jadwal Word/Excel</button><input id="dcmDocImportOne" type="file" accept=".docx,.xlsx,.xls" hidden></div>`;
}
let active=null;
function repaint(){
 const d=active;if(!d)return;
 const mount=document.getElementById('dcmMtDocEditor');if(!mount)return;
 mount.querySelector('#dcmDocEdit').innerHTML=d.kind==='one'?fieldsOne(d):fieldsBasic(d);
 mount.querySelector('#dcmDocPreview').innerHTML=d.kind==='one'?onePreview(d):ordinaryPreview(d);
 mount.querySelector('#dcmDocYear').value=String(d.year);
 mount.querySelector('#dcmDocQuarter').value=String(d.tw);
 mount.querySelectorAll('[data-doc-choice]').forEach(b=>b.classList.toggle('on',b.dataset.docChoice===d.kind));
 mount.querySelector('#dcmDocStatus').textContent=d.status||(d.kind==='one'?'Bagian bertanda kuning perlu diperiksa sebelum Word digunakan.':'Nomor dan tanggal surat diisi di Nadine.');
}
function previewOnly(){
 const d=active;if(!d)return;
 const wrap=document.getElementById('dcmDocPreview');if(wrap)wrap.innerHTML=d.kind==='one'?onePreview(d):ordinaryPreview(d);
}
function closeEditor(){document.getElementById('dcmMtDocEditor')?.remove();active=null;}
function newModal(kind){
 if(!mutable()){say('Akses edit diperlukan untuk membuat konsep surat.');return;}
 if(!D()){say('Mesin Word Modul Transformasi belum siap. Muat ulang halaman.',true);return;}
 closeEditor();
 active=starter(editor(),kind);
 const host=document.createElement('div');host.id='dcmMtDocEditor';host.className='dcm-doc-overlay';
 host.innerHTML=`<div class="dcm-doc-dialog" role="dialog" aria-modal="true" aria-label="Konsep surat" tabindex="-1">
 <div class="dcm-doc-head"><div><b>Konsep Surat · Aktivitas</b><small>Template dan format Word mengacu pada Modul Transformasi</small></div><button type="button" data-doc-close title="Tutup">×</button></div>
 <div class="dcm-doc-top"><div class="dcm-doc-segment">${kind==='st'?'<button type="button" class="on" data-doc-choice="st">Surat Tugas</button>':'<button type="button" data-doc-choice="und">Undangan Biasa</button><button type="button" data-doc-choice="one">Undangan 1-on-1 Meeting</button>'}</div>
 <label style="margin-left:auto">Tahun <input id="dcmDocYear" type="number" min="2020" max="2100" style="width:88px"></label><label>Triwulan <select id="dcmDocQuarter">${[1,2,3,4].map(n=>`<option value="${n}">${['','I','II','III','IV'][n]}</option>`).join('')}</select></label></div>
 <div class="dcm-doc-body"><div class="dcm-doc-edit" id="dcmDocEdit"></div><div class="dcm-doc-preview"><div class="dcm-doc-title">Pratinjau A4 (susunan mengikuti Word)</div><div class="dcm-doc-note">Bagian <mark>kuning</mark> perlu diperiksa. Nomor dan tanggal surat ditetapkan di Nadine.</div><div id="dcmDocPreview"></div></div></div>
 <div class="dcm-doc-foot"><span class="status" id="dcmDocStatus"></span><div class="actions"><button type="button" class="dcm-doc-btn" data-doc-save>Simpan Draft</button><button type="button" class="dcm-doc-btn" data-doc-attach>Lampirkan ke Aktivitas</button><button type="button" class="dcm-doc-btn primary" data-doc-word>⬇ Unduh Word</button></div></div>
 </div>`;
 document.body.appendChild(host);
 host.querySelector('[data-doc-close]').onclick=closeEditor;
 host.addEventListener('click',e=>{if(e.target===host)closeEditor();});
 repaint();
 host.addEventListener('input',e=>{
  const d=active,t=e.target;if(!d)return;
  if(t.dataset.simple){if(t.dataset.simple==='picNames'){const names=t.value.split(/[,;\n]+/).map(v=>v.trim()).filter(Boolean);const resources=typeof state!=='undefined'?state.resources||[]:[];d.base.pic=names.map(n=>{const a=resources.find(x=>x.nama===n)||{};return {nama:n,nip:a.nip||'',pangkat:[a.pangkat,a.golongan].filter(Boolean).join(' / '),jabatan:a.jabatan||''};});}else d.base[t.dataset.simple]=t.value;}
  if(t.dataset.cfg){const k=t.dataset.cfg;if(k==='tujuan')d.B.cfg.tujuan=t.value.split('\n').map(s=>s.trim()).filter(Boolean);else if(['p1','p2a','p2b','p3'].includes(k))d.B.cfg.p[k]=t.value;else d.B.cfg[k]=t.value;}
  if(t.dataset.rowField){const row=t.closest('[data-session]'),obj=d.B.rows[Number(row?.dataset.session)];if(obj){const k=t.dataset.rowField;obj[k]=k==='cek'?!t.checked:t.value;}}
  previewOnly();
 });
 host.addEventListener('change',e=>{
  const t=e.target,d=active;if(!d)return;
  if(t.dataset.confirm){d.B.cfg.conf[t.dataset.confirm]=t.checked;previewOnly();}
  if(t.id==='dcmDocImportOne'){const file=t.files?.[0];t.value='';if(file)importOneSchedule(file,d).catch(err=>say('Impor 1-on-1 gagal: '+err.message,true));return;}
  if(t.id==='dcmDocJenis'){d.B.cfg.jenis=t.value;d.B.rows.forEach(r=>r.sasaran=t.value==='unit'?'unit':'');previewOnly();}
  if(t.id==='dcmDocQuarter'){d.tw=Number(t.value);d.B.rows.forEach(r=>{r.tw=d.tw;});repaint();}
  if(t.id==='dcmDocYear'){d.year=Number(t.value);d.B.rows.forEach(r=>{r.tahun=d.year;});repaint();}
 });
 host.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||!active)return;const d=active;
  if(b.dataset.docChoice){if(d.kind==='st')return;d.kind=b.dataset.docChoice;repaint();return;}
  if(b.hasAttribute('data-add-session')){d.B.rows.push({...getSession(d.form),id:uid(),program:'',tema:'',uic:'',tgl:'',j1:'',j2:'',cek:true});repaint();return;}
  if(b.dataset.delSession!=null){if(d.B.rows.length===1){say('Minimal satu sesi harus ada.');return;}d.B.rows.splice(Number(b.dataset.delSession),1);repaint();return;}
  if(b.hasAttribute('data-import-one')){host.querySelector('#dcmDocImportOne')?.click();return;}
  if(b.hasAttribute('data-copy-tw')){const old=d.tw;d.tw=old===4?1:old+1;if(old===4)d.year++;d.B.rows=d.B.rows.map(r=>({...r,id:uid(),tw:d.tw,tahun:d.year,tgl:'',j1:'',j2:'',cek:true}));d.B.cfg.conf={tw:false,rapat:false,tempat:false,link:false,tujuan:false};d.B.cfg.rapat=null;repaint();return;}
  if(b.hasAttribute('data-doc-save'))await saveDraft(d);
  if(b.hasAttribute('data-doc-word'))await downloadDoc(d);
  if(b.hasAttribute('data-doc-attach'))await attachDoc(d);
 });
 host.querySelector('.dcm-doc-dialog')?.focus();
}
function draftKey(d){return 'dcm-mt-one-'+(d.aid||d.base.nama+'-'+d.base.tgl);}
async function saveDraft(d){
 if(d.kind!=='one'){
  const snapshot={kind:d.kind,base:JSON.parse(JSON.stringify(d.base)),updatedAt:now()};
  const key='dcm-mt-letter-'+(d.aid||d.base.nama+'-'+d.base.tgl)+'-'+d.kind;
  let localSaved=false;
  try{localStorage.setItem(key,JSON.stringify(snapshot));localSaved=true;}catch(err){console.warn('Penyimpanan draft lokal:',err);}
  if(d.aid&&cmState()){
   const a=cmState().agendas.find(x=>String(x.id)===String(d.aid));
   if(a){
    const previous=a.cmMtDocumentDrafts;
    a.cmMtDocumentDrafts={...(previous||{}),[d.kind]:snapshot};
    try{if(await persist()){d.status='Draft '+(d.kind==='st'?'Surat Tugas':'Undangan Biasa')+' tersimpan pada Aktivitas dan Firebase.';repaint();return;}}
    catch(e){console.warn('Gagal menyimpan draft surat ke Firebase:',e);}
    if(previous===undefined)delete a.cmMtDocumentDrafts;else a.cmMtDocumentDrafts=previous;
   }
  }
  d.status=localSaved?'Draft tersimpan di browser ini. Setelah Aktivitas tersimpan, buka kembali konsep dan klik Simpan Draft untuk sinkronisasi Firebase.':'Draft belum tersimpan. Unduh Word untuk menyimpan hasilnya.';
  repaint();return;
 }
 const snapshot={year:d.year,tw:d.tw,cfg:d.B.cfg,rows:d.B.rows,updatedAt:now()};
 try{localStorage.setItem(draftKey(d),JSON.stringify(snapshot));}catch(err){console.warn(err);}
 if(d.aid&&cmState()){
  const a=cmState().agendas.find(x=>String(x.id)===String(d.aid));
  if(a){const old=a.cmMtOneOnOneDraft;a.cmMtOneOnOneDraft=snapshot;try{if(await persist()){d.status='Draft tersimpan pada Aktivitas dan Firebase.';repaint();return;}}catch(e){console.warn(e);}a.cmMtOneOnOneDraft=old;}
 }
 d.status='Draft tersimpan di browser ini. Setelah Aktivitas tersimpan, buka kembali konsep dan klik Simpan Draft untuk sinkronisasi Firebase.';repaint();
}
function filename(d){return d.kind==='one'?`Draft_Undangan_1on1_TW${D().ONE_RM[d.tw]}_${d.year}.docx`:d.kind==='st'?`Konsep_Surat_Tugas_${stamp().replace(/-/g,'')}.docx`:`Konsep_Undangan_${stamp().replace(/-/g,'')}.docx`;}
async function makeWord(d){if(d.kind==='one'){if(!d.B.rows.length)throw Error('Isi minimal satu sesi.');const B={...d.B,cfg:{...d.B.cfg,conf:{...d.B.cfg.conf}},rows:d.B.rows.map((r,i)=>({...r,no:i+1,sasaran:d.B.cfg.jenis==='unit'?'unit':''}))};return D().oneDocx(B,d.tw,d.year);}
 return D().ordinaryDocx(d.kind,d.base);}
function fileDownload(blob,name){
 const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),20000);
}
async function downloadDoc(d){
 try{const blob=await makeWord(d);fileDownload(blob,filename(d));d.status='Word berhasil dibuat. Periksa penanda kuning dan isi nomor/tanggal melalui Nadine.';repaint();}catch(err){say('Gagal membuat Word: '+err.message,true);}
}
async function attachDoc(d){
 if(!mutable())return say('Akses edit diperlukan.');
 const form=editor(),key=d.kind==='st'?'suratTugas':'undangan',slot=form?.querySelector(`[data-af-letter="${key}"]`);
 const input=slot?.querySelector('[data-file-input]');
 if(!input){say('Editor lampiran belum tersedia. Unduh Word dan unggah melalui tombol ⤒ pada Dasar Surat.',true);return;}
 try{
  const blob=await makeWord(d);if(blob.size>600000)throw Error('Word lebih besar dari 600 KB; gunakan tombol unduh dan tautan SharePoint.');
  const file=new File([blob],filename(d),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  d.status='Word dikirim ke editor lampiran. Setelah unggah selesai, simpan Aktivitas untuk menyimpan di Firebase.';repaint();
 }catch(err){say('Lampiran gagal diproses: '+err.message,true);}
}
function injectIcons(){
 const f=editor();if(!f)return;
 f.querySelectorAll('[data-af-letter]').forEach(slot=>{
  const h=slot.querySelector('.af-slot-head'),ic=h?.querySelector(':scope > .af-slot-ic');
  if(!h||!ic||h.querySelector('.dcm-doc-launch'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='dcm-doc-launch';btn.title=slot.dataset.afLetter==='undangan'?'Buat, edit, pratinjau dan unduh template undangan (Biasa / 1-on-1 Meeting)':'Buat, edit, pratinjau dan unduh template Surat Tugas';
  btn.setAttribute('aria-label',btn.title);
  ic.replaceWith(btn);btn.appendChild(ic);
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();newModal(slot.dataset.afLetter==='suratTugas'?'st':'und');});
 });
}
let queued=false;
function mount(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;try{setToolbar();injectIcons();}catch(e){console.warn('DCM MT document tools mount:',e);}});}
const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))mount();});
// Role is stored on <html>, outside the existing body observer.
const roleObserver=new MutationObserver(()=>mount());
roleObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-role']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();observer.observe(document.body,{subtree:true,childList:true});},{once:true});else {mount();observer.observe(document.body,{subtree:true,childList:true});}
window.DCM_MT_TOOLS=Object.freeze({mount,open:newModal,mergeAgendas,importZip,importOneSchedule});
})();
