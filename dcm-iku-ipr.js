/* Dashboard CM — Referensi IKU, IKU Terkait pada aktivitas, filter IKU, dan Ekspor IPR (2026-11-24).
   Selaras dengan Modul Transformasi (mt-iku-ipr.js):
   - Referensi IKU per tahun disimpan di Firestore dashboard/cm_iku_reference_v1 {ref:{'2026':[{kode,nama,ssNo,ssNama,strategi}]}}.
     Diubah oleh Superadmin, CMO Pusat, dan PMO Pusat (cmCanMutate).
   - Aktivitas menyimpan ikuRefs:[kode IKU] dan kendala (teks) — field yang sama dengan Modul Transformasi sehingga ikut sinkron.
   - Ekspor IPR: Excel 4 sheet "Capaian TW 1..4": No | IKU | Realisasi | Bukti Dukung | Kendala | Usulan Strategi | Tindakan yang dilaksanakan. */
(function(){
'use strict';
const KEY='cm_iku_reference_v1';
const SS26=[
 ['1','Transformasi dan Manajemen Perubahan Kementerian Keuangan yang Berkesinambungan dan Berdampak'],
 ['2','Perumusan Transformasi dan Perubahan yang Berdampak'],
 ['3','Pengelolaan Transformasi dan Perubahan yang Akseleratif dan Berkelanjutan'],
 ['4','Pengembangan Transformasi dan Perubahan yang Berkelanjutan'],
 ['5','Pemantauan Transformasi dan Perubahan yang Berkesinambungan'],
 ['6','Peningkatan Kompetensi SDM yang Unggul'],
 ['7','Penguatan Tata Kelola Organisasi dan Budaya Kerja Kolaboratif'],
 ['8','Pengelolaan Keuangan yang Akuntabel']];
const IKU26=[
 ['1a-CP','Tingkat Keberhasilan Transformasi Kemenkeu','Memantau capaian milestone program transformasi secara berkala bersama PMO dan CMO Unit Eselon I, serta memberikan pendampingan dan rekomendasi percepatan atas milestone yang berisiko tidak tercapai.'],
 ['1b-CP','Indeks Kepercayaan Stakeholders','Menjaga kualitas layanan manajemen transformasi dan perubahan sesuai Standar Layanan Pusmantap, serta menindaklanjuti umpan balik pemangku kepentingan secara berkala.'],
 ['2a-N','Persentase Keberhasilan Perumusan Program Transformasi dan Manajemen Perubahan Kemenkeu','Mengoordinasikan perumusan dan penyelarasan program transformasi bersama unit pemilik proses bisnis melalui forum koordinasi (T-Forum/T-Lab), serta memastikan dokumen perencanaan program tersusun tepat waktu.'],
 ['3a-CP','Tingkat Keberhasilan Pelaksanaan Project Management Office (PMO)','Menyelenggarakan forum koordinasi PMO (monthly meeting dan 1-on-1) untuk memantau WBS dan milestone, mengidentifikasi isu serta risiko, dan mengeskalasi kendala kepada pengambil keputusan.'],
 ['4a-CP','Tingkat Keberhasilan Pelaksanaan Change Management Office (CMO)','Memberikan pendampingan strategi manajemen perubahan kepada Unit Eselon I melalui narasumber, advisory, dan fasilitasi FGD, serta memantau pengisian dan pelaksanaan Kertas Kerja Manajemen Perubahan.'],
 ['4b-N','Tingkat Keberhasilan Pengembangan Program Transformasi dan Manajemen Perubahan Kemenkeu','Mengembangkan perangkat pendukung program transformasi dan manajemen perubahan (aplikasi, pedoman, dan template) sesuai kebutuhan pengguna, termasuk pengujian dan penyempurnaan berkelanjutan.'],
 ['4c-N','Tingkat Keberhasilan Manajemen Pengetahuan Program Transformasi dan Manajemen Perubahan Kemenkeu','Mengidentifikasi, mendokumentasikan, dan membagikan pengetahuan program transformasi (knowledge mapping, aset intelektual, T-Walk/T-Talk) agar dapat dimanfaatkan seluruh unit.'],
 ['5a-N','Tingkat Kualitas Monitoring dan Evaluasi Implementasi Program Transformasi dan Manajemen Perubahan Kemenkeu','Melaksanakan monitoring dan evaluasi implementasi program transformasi per triwulan, menyusun laporan monev, dan menyampaikan rekomendasi perbaikan kepada unit terkait.'],
 ['6a-N','Tingkat Kualitas Pengembangan Kompetensi SDM Pusmantap','Menyusun dan melaksanakan rencana pengembangan kompetensi pegawai Pusmantap (pelatihan, sertifikasi, dan berbagi pengetahuan) sesuai kebutuhan jabatan.'],
 ['7a-CP','Nilai Evaluasi Reformasi Birokrasi dari KemenPAN-RB','Mendukung pemenuhan komponen evaluasi Reformasi Birokrasi melalui penyediaan data dukung yang lengkap dan tepat waktu.'],
 ['7b-N','Persentase Penyelesaian Proses Bisnis Operasional dan Tindak Lanjut Rekomendasi Hasil Pengawasan','Memantau penyelesaian proses bisnis operasional dan tindak lanjut rekomendasi hasil pengawasan secara berkala hingga tuntas.'],
 ['7c-N','Tingkat Partisipasi Pegawai dalam EA Kemenkeu','Mendorong dan memantau partisipasi pegawai Pusmantap dalam kegiatan EA Kemenkeu secara berkala.'],
 ['8a-N','Tingkat Kualitas Pengelolaan Anggaran dan Pengadaan','Melaksanakan perencanaan, pemantauan penyerapan anggaran, dan pengadaan secara tertib sesuai rencana kegiatan.']];
const ssOf=k=>String(k||'').match(/^(\d+)/)?.[1]||'';
const SEED={'2026':IKU26.map(([kode,nama,strategi])=>{const n=ssOf(kode);return {kode,nama,ssNo:n,ssNama:(SS26.find(s=>s[0]===n)||[])[1]||'',strategi}})};
const E=v=>String(v==null?'':v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const nk=k=>String(k||'').replace(/\s+/g,'').trim();
const T=(m,t)=>{try{toast(m,t||'info')}catch(e){console.log(m)}};
const canEdit=()=>{try{return cmCanMutate()}catch(e){return false}};
const yNow=()=>String(new Date().getFullYear());
let DATA={ref:{}},loaded=false;
try{const c=JSON.parse(localStorage.getItem(KEY)||'null');if(c&&c.ref)DATA=c}catch(e){}
async function load(force){if(loaded&&!force)return DATA;try{if(typeof firestoreGet==='function'){const v=await firestoreGet(KEY);if(v){const d=JSON.parse(v);if(d&&d.ref){DATA=d;try{localStorage.setItem(KEY,v)}catch(e){}}}}}catch(e){console.warn('[IKU] referensi belum termuat',e)}loaded=true;return DATA}
async function persist(){const v=JSON.stringify(DATA);try{localStorage.setItem(KEY,v)}catch(e){}const ok=typeof firestoreSet==='function'?await firestoreSet(KEY,v):false;if(!ok)T(uiText('Saved in this browser only — not synced to Firebase.','Tersimpan di peramban ini saja — belum tersinkron ke Firebase.'),'error');return ok}
const acts=()=>(typeof state!=='undefined'&&Array.isArray(state.agendas))?state.agendas:[];
const yearOfItem=a=>String(a&&a.tglMulai||'').slice(0,4)||yNow();
function years(){const set=new Set(Object.keys(SEED));Object.keys(DATA.ref||{}).forEach(y=>set.add(y));acts().forEach(a=>{const y=yearOfItem(a);if(/^\d{4}$/.test(y))set.add(y)});set.add(yNow());return [...set].filter(y=>/^\d{4}$/.test(y)).sort()}
const sortRows=r=>r.slice().sort((a,b)=>(+a.ssNo||99)-(+b.ssNo||99)||String(a.kode).localeCompare(String(b.kode),'id',{numeric:true}));
function ref(y){y=String(y||yNow());const r=DATA.ref&&Array.isArray(DATA.ref[y])?DATA.ref[y]:(SEED[y]||[]);return sortRows(r.filter(x=>x&&x.kode))}
async function writeRef(y,rows){if(!canEdit()){T(uiText('Only Superadmin, CMO Pusat and PMO Pusat can change the IKU reference.','Hanya Superadmin, CMO Pusat, dan PMO Pusat yang dapat mengubah Referensi IKU.'));return false}
 DATA.ref=DATA.ref||{};DATA.ref[String(y)]=sortRows(rows).map(x=>({kode:nk(x.kode),nama:String(x.nama||'').trim(),ssNo:String(x.ssNo||ssOf(x.kode)),ssNama:String(x.ssNama||'').trim(),strategi:String(x.strategi||'').trim()}));
 DATA.updatedAt=new Date().toISOString();try{DATA.updatedBy=getCurrentUserEmail()||''}catch(e){}
 await persist();rerender();return true}
const label=(k,y)=>{const r=ref(y).find(x=>x.kode===k);return r?r.nama:''};
const refsOf=a=>{let r=a&&a.ikuRefs;if(typeof r==='string'){try{r=JSON.parse(r)}catch(e){r=[]}}return Array.isArray(r)?r.map(nk).filter(Boolean):[]};
const SKIP_ST=['Cancelled','Postponed','Not Attended'];
const stOf=a=>a.statusNorm||(typeof normalizeStatus==='function'?normalizeStatus(a.status):'');
const twOf=a=>{const m=+String(a.tglMulai||'').slice(5,7);return m?Math.ceil(m/3):1};
function rerender(){try{if(state.activeTab==='ikuref')renderTab();else if(typeof configureContextToolbar==='function'&&['table','calendar','kanban','matrix','analytics'].includes(state.activeTab)){configureContextToolbar(state.activeTab)}}catch(e){}}

/* ---------- modal ringan (di atas form aktivitas) ---------- */
function modal(title,body,okLabel,onOk,o){o=o||{};const ov=document.createElement('div');ov.className='modal-overlay dcm-iku-ov';
 ov.innerHTML=`<div class="modal-box ${o.cls||''}" role="dialog" aria-modal="true"><div class="modal-head"><h2>${title}</h2><button type="button" class="modal-close" data-x>&times;</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button type="button" class="btn btn-outline btn-sm" data-x>${uiText('Cancel','Batal')}</button>${okLabel?`<button type="button" class="btn btn-gold btn-sm" data-ok>${okLabel}</button>`:''}</div></div>`;
 document.body.appendChild(ov);const close=()=>ov.remove();
 ov.addEventListener('click',async e=>{if(e.target===ov||e.target.closest('[data-x]')){close();return}if(e.target.closest('[data-ok]')){const r=onOk?await onOk(ov):true;if(r!==false)close()}});
 ov.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
 setTimeout(()=>ov.querySelector('input:not([type=checkbox]),textarea,select')?.focus(),30);return ov}

/* ---------- isian IKU Terkait pada form aktivitas ---------- */
function formField(a){const refs=refsOf(a);
 const el=document.createElement('div');el.className='form-field full dcm-iku-fld';el.dataset.ikuFld='1';
 el.innerHTML=`<label>${uiText('Related IKU','IKU terkait')}${window.MT_INFO_ICON?window.MT_INFO_ICON(uiText('One or more IKUs. Used as supporting data for the Actions and Obstacles columns of the IPR export.','Boleh lebih dari satu IKU. Dipakai sebagai data dukung kolom Tindakan dan Kendala pada Ekspor IPR.')):''}</label><div class="dcm-iku-box"><div class="dcm-iku-chips" data-iku-chips></div><button type="button" class="btn btn-outline btn-sm" data-iku-pick>☑ ${uiText('Choose IKU','Pilih IKU')}</button></div><input type="hidden" name="ikuRefsJson" value="${E(JSON.stringify(refs))}">`;
 setTimeout(()=>{const f=el.closest('form');if(f)wireForm(f)},0);return el}
const hid=root=>root&&root.querySelector('input[name="ikuRefsJson"]');
function readForm(root){const h=hid(root);if(!h)return [];try{const a=JSON.parse(h.value||'[]');return Array.isArray(a)?[...new Set(a.map(nk).filter(Boolean))]:[]}catch(e){return []}}
function formYear(root){const t=root&&root.querySelector('[name="tglMulai"]');return t&&/^\d{4}/.test(t.value)?t.value.slice(0,4):yNow()}
function drawChips(root){const box=root&&root.querySelector('[data-iku-chips]');if(!box)return;const y=formYear(root),refs=readForm(root);
 box.innerHTML=refs.length?refs.map(k=>{const n=label(k,y);return `<span class="dcm-iku-chip${n?'':' miss'}" title="${E(n||'Kode tidak ada di Referensi IKU '+y)}"><b>${E(k)}</b><span>${E(n||'tidak ada di referensi '+y)}</span><button type="button" data-iku-rm="${E(k)}" aria-label="Lepas ${E(k)}">×</button></span>`}).join(''):`<span class="dcm-iku-none">${uiText('No IKU selected yet','Belum ada IKU dipilih')}</span>`}
function setFormRefs(root,refs){const h=hid(root);if(!h)return;h.value=JSON.stringify([...new Set((refs||[]).map(nk).filter(Boolean))]);drawChips(root);h.dispatchEvent(new Event('change',{bubbles:true}))}
function picker(root){const y=formYear(root),rows=ref(y),cur=new Set(readForm(root));
 if(!rows.length){T(uiText('No IKU reference for '+y+' yet. Fill it in Activities › IKU Reference.','Referensi IKU tahun '+y+' belum ada. Isi dulu di Aktivitas › Referensi IKU.'));return}
 const groups=[];rows.forEach(r=>{let g=groups.find(x=>x.no===r.ssNo);if(!g)groups.push(g={no:r.ssNo,nama:r.ssNama,rows:[]});g.rows.push(r)});
 const body=`<p class="dcm-iku-h">${uiText('Tick the IKUs supported by this activity. The list follows the IKU Reference of','Centang IKU yang didukung kegiatan ini. Daftar mengikuti Referensi IKU tahun')} <b>${E(y)}</b>.</p><input class="dcm-iku-q" placeholder="${uiText('Search IKU code or name…','Cari kode atau nama IKU…')}" data-iku-q><div class="dcm-iku-pk">${groups.map(g=>`<div class="dcm-iku-pk-g"><div class="dcm-iku-pk-ss"><i>${E(g.no)}</i>${E(g.nama||'Sasaran Strategis '+g.no)}</div>${g.rows.map(r=>`<label class="dcm-iku-pk-r" data-hay="${E((r.kode+' '+r.nama).toLowerCase())}"><input type="checkbox" value="${E(r.kode)}"${cur.has(r.kode)?' checked':''}><b>${E(r.kode)}</b><span>${E(r.nama)}</span></label>`).join('')}</div>`).join('')}</div>`;
 const ov=modal(uiText('Choose related IKU','Pilih IKU terkait'),body,uiText('Apply','Terapkan'),o=>{setFormRefs(root,[...o.querySelectorAll('.dcm-iku-pk input:checked')].map(i=>i.value))},{cls:'dcm-iku-md'});
 const q=ov.querySelector('[data-iku-q]');q.addEventListener('input',()=>{const v=q.value.toLowerCase().trim();ov.querySelectorAll('.dcm-iku-pk-r').forEach(r=>r.hidden=!!v&&!r.dataset.hay.includes(v));ov.querySelectorAll('.dcm-iku-pk-g').forEach(g=>g.hidden=![...g.querySelectorAll('.dcm-iku-pk-r')].some(r=>!r.hidden))})}
function wireForm(root){if(!root||root.dataset.ikuBound)return;root.dataset.ikuBound='1';drawChips(root);
 root.addEventListener('click',e=>{if(e.target.closest('[data-iku-pick]')){picker(root);return}const rm=e.target.closest('[data-iku-rm]');if(rm)setFormRefs(root,readForm(root).filter(k=>k!==rm.dataset.ikuRm))});
 root.addEventListener('change',e=>{if(e.target&&e.target.name==='tglMulai')drawChips(root)})}

/* ---------- filter IKU (bar filter Aktivitas) ---------- */
function filterOptions(){const f=(state&&state.filters)||{},y=f.tahun&&f.tahun!=='ALL'?String(f.tahun):'',seen=new Map();
 (y?[y]:[yNow()]).forEach(v=>ref(v).forEach(r=>seen.set(r.kode,r.kode+' · '+r.nama)));
 acts().forEach(a=>{if(y&&yearOfItem(a)!==y)return;refsOf(a).forEach(k=>{if(!seen.has(k)){const n=label(k,yearOfItem(a));seen.set(k,k+(n?' · '+n:''))}})});
 return [...seen.entries()].sort((a,b)=>a[0].localeCompare(b[0],'id',{numeric:true}))}
function filterSelect(){const f=(state&&state.filters)||{},cur=f.iku&&f.iku!=='ALL'?String(f.iku):'';
 return '<select class="filter-select" data-wbs-filter="iku" aria-label="Semua IKU"><option value="ALL">'+uiText('All IKU','Semua IKU')+'</option>'+filterOptions().map(([k,l])=>'<option value="'+E(k)+'"'+(k===cur?' selected':'')+'>'+E(l)+'</option>').join('')+'</select>'}
const matchFilter=(a,f)=>!f||!f.iku||f.iku==='ALL'||refsOf(a).includes(f.iku);

/* ---------- tab Aktivitas › Referensi IKU ---------- */

/* DCM-70: private, one-time import of externally reviewed IKU mappings.
   The mapping file stays on the administrator's device. No activity data is committed to GitHub.
   The control is visible only to Superadmin; no special URL is needed. */
const bulkEnabled=()=>typeof cmCanManageReferences==='function'&&cmCanManageReferences();
let bulkBusy=false;
const bulkAuth=()=>bulkEnabled()&&window.fbAuth?.currentUser&&!window.fbAuth.currentUser.isAnonymous&&window.fbDb&&typeof window.fbRunTransaction==='function';
function bulkDownload(name,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
const bulkList=v=>{if(typeof v==='string'){try{v=JSON.parse(v)}catch(e){throw Error('Format IKU existing tidak valid')}}if(v==null)return [];if(!Array.isArray(v))throw Error('Format IKU existing bukan array');return [...new Set(v.map(x=>String(x).replace(/\s+/g,'')))].sort()};
const bulkEq=(a,b)=>JSON.stringify(bulkList(a))===JSON.stringify(bulkList(b));
const bulkWbsKey=list=>JSON.stringify(list.map(w=>[w.wbsGroup,w.wbsLevel4,w.wbsLevel5]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
const bulkWbsEqual=(a,b)=>bulkWbsKey(a)===bulkWbsKey(b);
function bulkCheck(row,a,wbs=false){
 if(!a||String(a.id)!==row.id)return 'ID tidak ditemukan/sesuai';
 if(String(a.tglMulai||'')!==row.date||String(a.namaKegiatan||'')!==row.title)return 'Tanggal/judul berubah sejak ekspor';
 if(wbs){
  const current=window.ActivityWBS.items(a);
  if(bulkWbsEqual(current,row.wbsItems))return 'sudah sesuai';
  if(!bulkWbsEqual(current,row.expectedWbsItems))return 'WBS existing berubah sejak ekspor';
  if(current.length)return 'WBS existing dipertahankan';
  return '';
 }
 if(bulkEq(a.ikuRefs,row.ikuRefs))return 'sudah sesuai';
 if(!bulkEq(a.ikuRefs,row.expectedRefs))return 'IKU existing berubah sejak ekspor';
 if(row.expectedUpdatedAt&&a.updatedAt&&String(a.updatedAt)!==row.expectedUpdatedAt)return 'Record telah diperbarui sejak ekspor';
 return '';
}
function bulkAssign(a,row,wbs){if(wbs)Object.assign(a,window.ActivityWBS.flat(row.wbsItems));else a.ikuRefs=row.ikuRefs.slice();}
async function bulkApply(file,wbs=false){
 if(bulkBusy||!bulkAuth())throw Error('Sesi Superadmin dan Firebase yang aktif diperlukan.');
 bulkBusy=true;
 try{
  if(file.size>2000000)throw Error('File mapping terlalu besar.');
  const p=JSON.parse(await file.text());
  const label=wbs?'WBS':'IKU',kind=wbs?'wbs':'iku';
  if(p.kind!=='dcm-'+kind+'-mapping-v1'||p.year!=='2026'||p.sourceProject!=='dashboard-cm-bb716'||!Array.isArray(p.rows)||p.rows.length>400)throw Error('Format, proyek, atau tahun mapping tidak sesuai.');
  if(wbs&&!window.ActivityWBS)throw Error('Master WBS belum siap.');
  if(!wbs)await load(true);
  const allowed=new Set(ref('2026').map(x=>nk(x.kode))),seen=new Set();
  for(const row of p.rows){
   if(!row||typeof row.id!=='string'||!row.id||seen.has(row.id)||!/^2026-\d{2}-\d{2}$/.test(row.date)||typeof row.title!=='string'||!(wbs?['apply','keep','review','none']:['apply','keep','review']).includes(row.decision)||(wbs?(!Array.isArray(row.expectedWbsItems)||!Array.isArray(row.wbsItems)):(!Array.isArray(row.expectedRefs)||!Array.isArray(row.ikuRefs))))throw Error('Record mapping tidak valid atau ID ganda.');
   seen.add(row.id);
   if(wbs){
    const api=window.ActivityWBS;
    if([...row.expectedWbsItems,...row.wbsItems].some(w=>!w||typeof w!=='object'||!['wbsGroup','wbsLevel4','wbsLevel5'].every(k=>typeof w[k]==='string')))throw Error('Format tahapan WBS tidak valid.');
    if(row.decision==='apply'&&(!row.wbsItems.length||row.expectedWbsItems.length||row.wbsItems.some(w=>!api.valid(w.wbsGroup,w.wbsLevel4,w.wbsLevel5))||new Set(row.wbsItems.map(w=>JSON.stringify([w.wbsGroup,w.wbsLevel4,w.wbsLevel5]))).size!==row.wbsItems.length))throw Error('Tahapan WBS tidak valid, ganda, atau berisiko menimpa WBS existing.');
   }else if(row.decision==='apply'&&(!row.ikuRefs.length||row.ikuRefs.some(k=>typeof k!=='string'||!allowed.has(k))))throw Error('Kode IKU usulan tidak ada di Referensi IKU 2026: '+row.ikuRefs.join(', '));
  }
  const selected=p.rows.filter(r=>r.decision==='apply');
  if(!selected.length)throw Error('Tidak ada record siap diterapkan.');
  if(!['docs','legacy'].includes(cmActMode)||cmActMigrating)throw Error('Penyimpanan aktivitas belum siap.');
  const db=window.fbDb,mode=cmActMode,stamp=new Date().toISOString(),legacy=mode==='legacy';
  const actualMig=await cmActReadMig();
  if(Boolean(actualMig)!==!legacy)throw Error('Mode penyimpanan belum sinkron. Refresh aplikasi terlebih dahulu.');
  const backup={kind:'dcm-'+kind+'-migration-backup-v1',at:stamp,mode,year:p.year,documents:[]},plan=[],skips=[];
  let legacyRaw='';
  if(legacy){
   const doc=window.fbDoc(db,'dashboard',STORAGE_KEY),snap=await window.fbGetDoc(doc);
   if(!snap.exists())throw Error('Dokumen aktivitas Firebase tidak ditemukan.');
   const data=snap.data();legacyRaw=data.value;
   const rows=JSON.parse(legacyRaw);if(!Array.isArray(rows))throw Error('Format aktivitas Firebase tidak valid.');
   const byId=new Map();rows.forEach(a=>{const key=String(a.id);if(byId.has(key))throw Error('ID aktivitas ganda di Firebase.');byId.set(key,a)});
   for(const r of selected){const a=byId.get(r.id),why=bulkCheck(r,a,wbs);if(why)skips.push({id:r.id,reason:why});else plan.push({row:r});}
   backup.documents.push({path:'dashboard/'+STORAGE_KEY,data});
  }else{
   for(let i=0;i<selected.length;i+=20){
    await Promise.all(selected.slice(i,i+20).map(async r=>{
     const id=cmActDocId(r.id),doc=window.fbDoc(db,CM_ACT_COLL,id),snap=await window.fbGetDoc(doc);
     const data=snap.exists()?snap.data():null,a=data?.v?JSON.parse(data.v):null,why=bulkCheck(r,a,wbs);
     if(why)skips.push({id:r.id,reason:why});else{plan.push({row:r,doc,raw:data.v});backup.documents.push({path:CM_ACT_COLL+'/'+id,data});}
    }));
   }
  }
  if(!plan.length){bulkDownload('DCM_Hasil_Migrasi_'+label+'_2026.json',{updated:0,skips});T('Tidak ada perubahan yang diperlukan; cek laporan hasil.','info');return;}
  // Save exact before-images privately before any writes.
  bulkDownload('DCM_Backup_Data_'+label+'_2026_'+stamp.replace(/[:.]/g,'-')+'.json',backup);
  if(!confirm('Backup data telah disiapkan untuk diunduh. Terapkan '+plan.length+' pemetaan '+label+'? '+skips.length+' record dilewati; '+p.rows.filter(r=>r.decision==='review').length+' perlu validasi. '+(wbs?'Hanya field WBS yang diubah. IKU tidak berubah.':'Hanya ikuRefs yang diubah.')+' Pastikan backup tersimpan.'))return;
  if(!bulkAuth()||cmActMode!==mode||cmActMigrating)throw Error('Sesi atau mode penyimpanan berubah. Ulangi setelah refresh.');
  const updated=await window.fbRunTransaction(db,async tx=>{
   if(!bulkAuth()||cmActMode!==mode)throw Error('Sesi berubah.');
   // Verify migration marker and all before-images atomically, then write.
   const mig=await tx.get(window.fbDoc(db,'dashboard',CM_ACT_MIG_KEY));
   const rawMig=mig.exists()?mig.data().value:null;
   const migrated=rawMig?!!JSON.parse(rawMig).done:false;
   if(migrated!==!legacy)throw Error('Mode database berubah selama migrasi.');
   if(legacy){
    const doc=window.fbDoc(db,'dashboard',STORAGE_KEY),snap=await tx.get(doc);
    if(!snap.exists()||snap.data().value!==legacyRaw)throw Error('Data berubah sejak backup. Tidak ada pemetaan yang disimpan; ulangi impor.');
    const rows=JSON.parse(legacyRaw),map=new Map(plan.map(x=>[x.row.id,x.row]));
    rows.forEach(a=>{const r=map.get(String(a.id));if(r){const why=bulkCheck(r,a,wbs);if(why)throw Error('Konflik data: '+r.id);bulkAssign(a,r,wbs)}});
    tx.update(doc,{value:JSON.stringify(rows)});
   }else{
    const snaps=await Promise.all(plan.map(x=>tx.get(x.doc)));
    for(let i=0;i<plan.length;i++){if(!snaps[i].exists()||snaps[i].data().v!==plan[i].raw)throw Error('Data berubah sejak backup. Tidak ada pemetaan yang disimpan; ulangi impor.');}
    plan.forEach(x=>{const a=JSON.parse(x.raw);bulkAssign(a,x.row,wbs);tx.update(x.doc,{v:JSON.stringify(a)})});
   }
   return plan.length;
  });
  const report={kind:'dcm-'+kind+'-migration-report-v1',at:stamp,updated,updatedIds:plan.map(x=>x.row.id),skips,review:p.rows.filter(r=>r.decision==='review').map(r=>({id:r.id,reason:r.reason})),kept:p.rows.filter(r=>r.decision==='keep').length};
  bulkDownload('DCM_Hasil_Migrasi_'+label+'_2026.json',report);
  T(updated+' aktivitas berhasil disimpan ke Firebase; '+skips.length+' dilewati. Refresh untuk melihat hasil.','success');
  try{renderTab()}catch(e){}
 }finally{bulkBusy=false}
}
function bulkPick(wbs=false){
 if(!bulkAuth()){T('Akses Superadmin dengan Firebase diperlukan.','error');return}
 const i=document.createElement('input');i.type='file';i.accept='.json,application/json';
 i.onchange=()=>{const f=i.files?.[0];if(f)bulkApply(f,wbs).catch(e=>T('Migrasi '+(wbs?'WBS':'IKU')+' gagal: '+e.message,'error'));i.remove()};
 i.click();
}

const UI={year:'',q:'',sub:'iku',wbsQ:''};
function referenceTabs(){
 return '<div class="dcm-reference-tabs" role="tablist" aria-label="'+E(uiText('References','Referensi'))+'">'+
  [['iku',uiText('IKU Reference','Referensi IKU')],['wbs',uiText('WBS Stages','Tahapan WBS')]].map(([key,label])=>'<button type="button" role="tab" data-ref-sub="'+key+'" aria-selected="'+(UI.sub===key)+'" class="'+(UI.sub===key?'active':'')+'">'+E(label)+'</button>').join('')+'</div>';
}
function renderWbsTab(host){
 const api=window.ActivityWBS,y=curYear(),ys=years();
 if(!api){host.innerHTML=referenceTabs()+'<div class="dcm-iku-note">Master WBS belum termuat. Refresh aplikasi.</div>';return;}
 const cnt=new Map();
 acts().filter(a=>yearOfItem(a)===y&&!SKIP_ST.includes(stOf(a))).forEach(a=>api.items(a).forEach(w=>{const k=JSON.stringify([w.wbsGroup,w.wbsLevel4,w.wbsLevel5]);const c=cnt.get(k)||[0,0,0,0,0];c[twOf(a)]++;c[0]++;cnt.set(k,c)}));
 const q=UI.wbsQ.toLowerCase().trim();
 let rows='',n=0,visible=0;
 for(const group of ['PM','CM']){
  for(const component of api.GROUPS[group]){
   const name=api.LABELS[component]||component;
   const stages=api.l5(group,component);
   n+=stages.length;
   const filtered=stages.filter(s=>!q||[group,name,component,s].join(' ').toLowerCase().includes(q));
   if(!filtered.length)continue;
   visible+=filtered.length;
   rows+='<tr class="dcm-iku-ss"><td colspan="4">'+E(group==='PM'?'Project Management':'Change Management')+' · '+E(name)+'</td></tr>';
   for(const s of filtered){
    const c=cnt.get(JSON.stringify([group,component,s]))||[0,0,0,0,0];
    rows+='<tr><td class="k">'+E(group)+'</td><td>'+E(name)+'</td><td>'+E(s)+'</td><td class="c">'+[1,2,3,4].map(t=>'<span class="'+(c[t]?'on':'')+'" title="TW '+t+': '+c[t]+' aktivitas">'+c[t]+'</span>').join('')+'<b>'+c[0]+'</b></td></tr>';
   }
  }
 }
 host.innerHTML=referenceTabs()+'<div class="dcm-iku-page"><div class="cm-tbl-head dcm-iku-head"><h3>'+E(uiText('WBS Stages','Tahapan WBS'))+' <span>('+n+' '+E(uiText('stages','tahapan'))+')</span></h3><label class="dcm-iku-yr">'+E(uiText('Year','Tahun'))+' <select class="filter-select" data-iku-year>'+ys.map(v=>'<option'+(v===y?' selected':'')+'>'+E(v)+'</option>').join('')+'</select></label><input class="dcm-iku-search" data-wbs-search placeholder="'+E(uiText('Search stages…','Cari tahapan…'))+'" value="'+E(UI.wbsQ)+'"><span class="sp"></span>'+(bulkEnabled()&&y==='2026'?'<button type="button" class="btn btn-outline btn-sm" data-wbs-bulk>⇪ Terapkan Mapping WBS 2026</button>':'')+'</div><div class="table-wrap"><table class="dcm-iku-tbl"><colgroup><col style="width:70px"><col style="width:29%"><col><col style="width:178px"></colgroup><thead><tr><th>PM / CM</th><th>'+E(uiText('Level 4 component','Komponen Level 4'))+'</th><th>'+E(uiText('Level 5 stage','Tahapan Level 5'))+'</th><th>'+E(uiText('Activities Q1–Q4 · total','Aktivitas TW I–IV · total'))+'</th></tr></thead><tbody>'+(visible?rows:'<tr><td colspan="4" class="dcm-iku-empty">'+E(uiText('No matching stage.','Tidak ada tahapan yang cocok.'))+'</td></tr>')+'</tbody></table></div></div>';
 const input=host.querySelector('[data-wbs-search]');
 input?.addEventListener('input',()=>{UI.wbsQ=input.value;clearTimeout(input._t);input._t=setTimeout(()=>{if(UI.sub!=='wbs')return;const p=input.selectionStart;renderTab();const next=host.querySelector('[data-wbs-search]');if(next){next.focus();try{next.setSelectionRange(p,p)}catch(e){}}},200)});
}
function counts(y){const out={};acts().filter(a=>yearOfItem(a)===String(y)&&!SKIP_ST.includes(stOf(a))).forEach(a=>{const tw=twOf(a);refsOf(a).forEach(k=>{out[k]=out[k]||[0,0,0,0,0];out[k][tw]++;out[k][0]++})});return out}
function curYear(){const ys=years();let y=String(UI.year||yNow());return ys.includes(y)?y:ys[ys.length-1]}
function renderTab(){const host=document.getElementById('tab-ikuref');if(!host)return;
 tabLabel();
 if(UI.sub==='wbs'){renderWbsTab(host);return;}
 const ys=years(),y=curYear(),rows=ref(y),cnt=counts(y),ed=canEdit(),seeded=!(DATA.ref&&DATA.ref[y])&&!!SEED[y];
 const q=UI.q.toLowerCase().trim(),vis=rows.filter(r=>!q||(r.kode+' '+r.nama+' '+r.ssNama+' '+r.strategi).toLowerCase().includes(q));
 let last=null;const tb=vis.map(r=>{const c=cnt[r.kode]||[0,0,0,0,0];const ss=r.ssNo!==last?`<tr class="dcm-iku-ss"><td>${E(r.ssNo)}.</td><td colspan="${ed?5:4}">${E(r.ssNama||'Sasaran Strategis '+r.ssNo)}</td></tr>`:'';last=r.ssNo;
  return ss+`<tr><td class="k">${E(r.kode)}</td><td class="n">${E(r.nama)}</td><td class="s">${E(r.strategi||'—')}</td><td class="c">${[1,2,3,4].map(t=>`<span class="${c[t]?'on':''}" title="TW ${t}: ${c[t]} aktivitas">${c[t]}</span>`).join('')}<b>${c[0]}</b></td>${ed?`<td class="a"><button type="button" class="btn btn-outline btn-sm" data-iku-edit="${E(r.kode)}" title="${uiText('Edit','Ubah')}">✎</button><button type="button" class="btn btn-outline btn-sm" data-iku-del="${E(r.kode)}" title="${uiText('Delete','Hapus')}">🗑</button></td>`:''}</tr>`}).join('');
 host.innerHTML=referenceTabs()+`<div class="dcm-iku-page"><div class="cm-tbl-head dcm-iku-head"><h3>${uiText('IKU Reference','Referensi IKU')} <span>(${rows.length} IKU · ${E(y)})</span></h3>
  <label class="dcm-iku-yr">${uiText('Year','Tahun')} <select class="filter-select" data-iku-year>${ys.map(v=>`<option${v===y?' selected':''}>${v}</option>`).join('')}</select></label>
  <input class="dcm-iku-search" placeholder="${uiText('Search IKU…','Cari IKU…')}" value="${E(UI.q)}" data-iku-search><span class="sp"></span>
  ${ed?`${bulkEnabled()&&y==='2026'?`<button type="button" class="btn btn-outline btn-sm" data-iku-bulk>⇪ Terapkan Mapping IKU 2026</button>`:''}<button type="button" class="btn btn-outline btn-sm" data-iku-import>⇪ ${uiText('Import IKU','Import IKU')}</button><button type="button" class="btn btn-outline btn-sm" data-iku-add>＋ IKU</button><button type="button" class="cm-iku-export" data-ipr-export>⇩ IPR</button>`:''}</div>
  ${seeded?`<div class="dcm-iku-note">ⓘ ${uiText('This year still uses the initial list from the Pusmantap IKU achievement file. The first change (edit/add/import) saves it as the official reference.','Daftar '+E(y)+' masih memakai data awal dari file Capaian IKU Pusmantap '+E(y)+'. Perubahan pertama (ubah/tambah/import) akan menyimpannya sebagai referensi resmi.')}</div>`:''}
  ${rows.length?`<div class="table-wrap"><table class="dcm-iku-tbl"><colgroup><col style="width:84px"><col style="width:30%"><col><col style="width:178px">${ed?'<col style="width:92px">':''}</colgroup><thead><tr><th>${uiText('Code','Kode')}</th><th>${uiText('IKU name','Nama IKU')}</th><th>${uiText('Proposed strategy (standard, same every quarter)','Usulan strategi (normatif, sama tiap TW)')}</th><th>${uiText('Activities Q1–Q4 · total','Aktivitas TW I–IV · total')}</th>${ed?'<th></th>':''}</tr></thead><tbody>${tb||`<tr><td colspan="5" class="dcm-iku-empty">${uiText('No matching IKU.','Tidak ada IKU yang cocok.')}</td></tr>`}</tbody></table></div>`:`<div class="dcm-iku-empty">${uiText('No IKU reference for this year yet.','Belum ada Referensi IKU tahun ini.')} ${ed?uiText('Use Import IKU or + IKU.','Gunakan Import IKU atau ＋ IKU.'):''}</div>`}</div>`;
 const s=host.querySelector('[data-iku-search]');if(s){s.addEventListener('input',()=>{UI.q=s.value;clearTimeout(s._t);s._t=setTimeout(()=>{const p=s.selectionStart;renderTab();const n=document.querySelector('#tab-ikuref [data-iku-search]');if(n){n.focus();try{n.setSelectionRange(p,p)}catch(x){}}},250)})}}
document.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('#tab-ikuref [data-iku-year]');if(s){UI.year=s.value;renderTab()}});
document.addEventListener('click',e=>{const t=e.target.closest&&e.target;if(!t)return;
 if(t.closest('[data-ipr-export]')){openIprExport();return}
 if(!t.closest('#tab-ikuref'))return;
 const ed=t.closest('[data-iku-edit]');if(ed){editIku(ed.dataset.ikuEdit);return}
 const dl=t.closest('[data-iku-del]');if(dl){delIku(dl.dataset.ikuDel);return}
 const sub=t.closest('[data-ref-sub]');if(sub){UI.sub=sub.dataset.refSub==='wbs'?'wbs':'iku';renderTab();document.querySelector('#tab-ikuref [data-ref-sub="'+UI.sub+'"]')?.focus();return}
 if(t.closest('[data-wbs-bulk]')){bulkPick(true);return}
 if(t.closest('[data-iku-bulk]')){bulkPick();return}
 if(t.closest('[data-iku-add]')){editIku('');return}
 if(t.closest('[data-iku-import]')){importIku();return}});
function editIku(k){const y=curYear(),rows=ref(y),r=rows.find(x=>x.kode===k)||{kode:'',nama:'',ssNo:'',ssNama:'',strategi:''},isNew=!k;
 const ssList=[...new Map(rows.map(x=>[x.ssNo,x.ssNama])).entries()];
 const body=`<div class="form-grid dcm-iku-form"><div class="form-field"><label>${uiText('IKU code','Kode IKU')} *</label><input data-f="kode" value="${E(r.kode)}" placeholder="mis. 4a-CP"></div><div class="form-field"><label>${uiText('Strategic objective no.','No. Sasaran Strategis')}</label><input data-f="ssNo" value="${E(r.ssNo)}" placeholder="${uiText('from code','otomatis dari kode')}"></div>
  <div class="form-field full"><label>${uiText('IKU name','Nama IKU')} *</label><input data-f="nama" value="${E(r.nama)}"></div>
  <div class="form-field full"><label>${uiText('Strategic objective name','Nama Sasaran Strategis')}</label><input data-f="ssNama" list="dcm-iku-ss" value="${E(r.ssNama)}"><datalist id="dcm-iku-ss">${ssList.map(([n,s])=>`<option value="${E(s)}">${E(n)}</option>`).join('')}</datalist></div>
  <div class="form-field full"><label>${uiText('Proposed strategy (standard — same in every IPR quarter)','Usulan strategi (normatif — dipakai sama di setiap triwulan IPR)')}</label><textarea rows="4" data-f="strategi">${E(r.strategi)}</textarea></div></div>`;
 modal((isNew?uiText('Add IKU','Tambah IKU'):uiText('Edit IKU','Ubah IKU'))+' · '+y,body,uiText('Save','Simpan'),async o=>{const v=f=>o.querySelector('[data-f="'+f+'"]').value.trim();const kode=nk(v('kode')),nama=v('nama');
  if(!kode||!nama){T(uiText('Code and name are required.','Kode dan nama IKU wajib diisi.'));return false}
  if(rows.some(x=>x.kode===kode&&x.kode!==r.kode)){T(uiText('Code already exists.','Kode '+kode+' sudah ada di tahun '+y+'.'));return false}
  const ssNo=v('ssNo')||ssOf(kode),ssNama=v('ssNama')||(rows.find(x=>x.ssNo===ssNo)||{}).ssNama||'';
  const next=rows.filter(x=>isNew||x.kode!==r.kode).concat([{kode,nama,ssNo,ssNama,strategi:v('strategi')}]);
  if(await writeRef(y,next)){if(!isNew&&kode!==r.kode)await renameRefs(y,r.kode,kode);T(uiText('IKU reference saved.','Referensi IKU tersimpan.'),'success')}else return false},{cls:'dcm-iku-wide'})}
async function renameRefs(y,from,to){let n=0;acts().forEach(a=>{if(yearOfItem(a)!==String(y))return;const r=refsOf(a),i=r.indexOf(from);if(i>-1){r[i]=to;a.ikuRefs=[...new Set(r)];n++}});if(n&&typeof persist==='function'){try{await window.persist?.()}catch(e){}T(n+uiText(' activities updated to code ',' aktivitas ikut diperbarui ke kode ')+to+'.','info')}}
function delIku(k){const y=curYear(),c=(counts(y)[k]||[0])[0];
 modal(uiText('Delete IKU?','Hapus IKU?'),`<p style="margin:0">${uiText('IKU','IKU')} <b>${E(k)}</b> ${uiText('will be removed from the IKU Reference','dihapus dari Referensi IKU')} ${E(y)}.${c?` <b>${c}</b> ${uiText('activities are linked to it.','aktivitas sudah terkait IKU ini.')}`:''}</p>`,uiText('Delete','Hapus'),async()=>{await writeRef(y,ref(y).filter(x=>x.kode!==k));T(uiText('IKU deleted.','IKU dihapus.'),'success')},{cls:'small'})}

/* ---------- import (tempel tabel / Excel) ---------- */
const CODE_RE=/(^|[\s\t|])(\d{1,2}[a-z]{1,2}-[A-Za-z]{1,4})(?=$|[\s\t|])/;
function parsePaste(txt){const out=[];let ss=null;
 String(txt||'').split(/\r?\n/).forEach(line=>{const l=line.replace(/ /g,' ').replace(/[​]/g,'').trim();if(!l)return;
  const m=l.match(CODE_RE);
  if(m){const kode=nk(m[2]);const rest=l.slice(l.indexOf(m[2])+m[2].length).split('\t').map(s=>s.trim()).filter(Boolean);
   const nama=(rest.find(s=>/[A-Za-z]{3,}/.test(s))||'').replace(/\s+/g,' ');if(!nama)return;
   const n=ssOf(kode);out.push({kode,nama,ssNo:n,ssNama:(ss&&ss.no===n?ss.nama:'')});return}
  const h=l.match(/^(\d{1,2})\.?\s+([A-Z].{8,})$/);if(h)ss={no:h[1],nama:h[2].replace(/\t.*$/,'').trim()}});
 return out}
function parseSheet(aoa){if(!aoa.length)return [];const head=aoa[0].map(h=>String(h||'').toLowerCase());
 const col=(...ks)=>head.findIndex(h=>ks.some(k=>h.includes(k)));
 let ck=col('kode','nomor iku','nomor iki','no iku'),cn=col('nama iku','nama iki','uraian iku','indikator'),cs=col('no ss','no. ss','nomor ss'),csn=col('nama ss','sasaran'),cst=col('strategi');
 let data=aoa.slice(1);if(ck<0||cn<0){data=aoa;ck=-1;cn=-1}
 return data.map(r=>{let kode='',nama='';if(ck>-1){kode=nk(r[ck]);nama=String(r[cn]||'').trim()}else{const i=r.findIndex(c=>CODE_RE.test(' '+String(c||'')+' '));if(i<0)return null;kode=nk(String(r[i]).match(CODE_RE)[2]);nama=String(r.slice(i+1).find(c=>/[A-Za-z]{3,}/.test(String(c||'')))||'').trim()}
  if(!kode||!nama||!/^\d/.test(kode))return null;return {kode,nama:nama.replace(/\s+/g,' '),ssNo:cs>-1&&r[cs]!==''?String(r[cs]).replace(/\D/g,''):ssOf(kode),ssNama:csn>-1?String(r[csn]||'').trim():'',strategi:cst>-1?String(r[cst]||'').trim():''}}).filter(Boolean)}
function importIku(){const y=curYear();let parsed=[];
 const body=`<p class="dcm-iku-h">${uiText('Paste the IKU table (e.g. copy the rows from the IKU app <b>Kinerja Utama</b> page) <b>or</b> choose an Excel/CSV file with columns <i>Kode, Nama IKU, No SS, Nama SS, Usulan Strategi</i>. Existing codes get their name updated; existing strategies are kept when the column is empty.','Tempel tabel IKU (mis. salin baris tabel dari halaman <b>Kinerja Utama</b> aplikasi IKU) <b>atau</b> pilih file Excel/CSV berkolom <i>Kode, Nama IKU, No SS, Nama SS, Usulan Strategi</i>. Kode yang sudah ada diperbarui namanya; usulan strategi lama dipertahankan bila kolomnya kosong.')}</p>
  <div class="form-grid"><div class="form-field"><label>${uiText('Reference year','Tahun referensi')}</label><input type="number" min="2020" max="2100" data-iy value="${E(y)}"></div><div class="form-field"><label>${uiText('Or Excel/CSV file','Atau file Excel/CSV')}</label><input type="file" accept=".xlsx,.xls,.csv" data-if></div>
  <div class="form-field full"><label>${uiText('Paste here','Tempel di sini')}</label><textarea rows="7" data-ip placeholder="1a-CP	Tingkat Keberhasilan Transformasi Kemenkeu"></textarea></div></div>
  <label class="dcm-iku-repl"><input type="checkbox" data-ir> ${uiText('Replace the whole list for this year (IKUs not in the import are removed)','Ganti seluruh daftar tahun ini dengan hasil import (IKU yang tidak ada di hasil import dihapus)')}</label><div class="dcm-iku-prev" data-iv></div>`;
 const ov=modal(uiText('Import IKU Reference','Import Referensi IKU'),body,uiText('Save import','Simpan hasil import'),async o=>{if(!parsed.length){T(uiText('No IKU rows read yet.','Belum ada baris IKU yang terbaca.'));return false}
  const yy=String(o.querySelector('[data-iy]').value||y).trim(),repl=o.querySelector('[data-ir]').checked,base=repl?[]:ref(yy).slice(),old=ref(yy);
  const prior=years().filter(v=>v<yy).reverse().map(v=>ref(v)).flat();
  parsed.forEach(p=>{const i=base.findIndex(x=>x.kode===p.kode),prev=old.find(x=>x.kode===p.kode)||prior.find(x=>x.kode===p.kode)||{};const ssNama=p.ssNama||prev.ssNama||(base.concat(old,prior).find(x=>x.ssNo===p.ssNo&&x.ssNama)||{}).ssNama||'';
   const row={kode:p.kode,nama:p.nama,ssNo:p.ssNo||prev.ssNo,ssNama,strategi:p.strategi||prev.strategi||''};if(i>-1)base[i]=row;else base.push(row)});
  if(await writeRef(yy,base)){UI.year=yy;renderTab();T(parsed.length+uiText(' IKUs saved.',' IKU tersimpan ke Referensi IKU ')+yy+'.','success')}else return false},{cls:'dcm-iku-wide'});
 const prev=()=>{const yy=String(ov.querySelector('[data-iy]').value||y),old=ref(yy);ov.querySelector('[data-iv]').innerHTML=parsed.length?`<b>${parsed.length} ${uiText('IKUs read','IKU terbaca')}</b><table class="dcm-iku-tbl"><thead><tr><th>Kode</th><th>Nama IKU</th><th>Status</th></tr></thead><tbody>${parsed.map(p=>{const o=old.find(x=>x.kode===p.kode);return `<tr><td>${E(p.kode)}</td><td>${E(p.nama)}</td><td>${!o?'Baru':o.nama===p.nama?'Sama':'Diperbarui'}</td></tr>`}).join('')}</tbody></table>`:`<small>${uiText('No IKU rows read yet. Each row must contain an IKU code such as 1a-CP followed by the IKU name.','Belum ada baris IKU yang terbaca. Pastikan tiap baris memuat kode IKU seperti 1a-CP diikuti nama IKU.')}</small>`};
 ov.querySelector('[data-ip]').addEventListener('input',e=>{parsed=parsePaste(e.target.value);prev()});ov.querySelector('[data-iy]').addEventListener('input',prev);
 ov.querySelector('[data-if]').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!window.XLSX){T('Pustaka Excel belum termuat.');return}const rd=new FileReader();rd.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array'});parsed=parseSheet(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false}));prev()}catch(x){T('File tidak dapat dibaca: '+x.message)}};rd.readAsArrayBuffer(f)});
 prev()}

/* ---------- Ekspor IPR ---------- */
function tglId(s){const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return '';return +m[3]+' '+['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][+m[2]-1]+' '+m[1]}
function iprData(y){const today=new Date().toISOString().slice(0,10);
 const list=acts().filter(a=>yearOfItem(a)===String(y)&&refsOf(a).length&&!SKIP_ST.includes(stOf(a))&&String(a.tglMulai||'')<=today);
 const rows=ref(y),known=new Set(rows.map(r=>r.kode));
 const tw=[1,2,3,4].map(t=>{const inTw=list.filter(a=>twOf(a)===t).sort((a,b)=>String(a.tglMulai).localeCompare(String(b.tglMulai)));const per={};
  rows.forEach(r=>{const L=inTw.filter(a=>refsOf(a).includes(r.kode));per[r.kode]={tindakan:L.map((a,i)=>(i+1)+'. '+tglId(a.tglMulai)+' — '+String(a.namaKegiatan||'Kegiatan').trim()+(a.unitPemohon&&a.unitPemohon!=='-'?' ('+a.unitPemohon+')':'')).join('\n'),kendala:L.filter(a=>String(a.kendala||'').trim()).map(a=>'• '+String(a.namaKegiatan||'Kegiatan').trim()+': '+String(a.kendala).trim()).join('\n'),n:L.length}});return per});
 return {rows,tw,acts:list,orphan:list.filter(a=>refsOf(a).some(k=>!known.has(k))).length}}
let excelJsP=null;
function loadExcelJS(){if(window.ExcelJS)return Promise.resolve(window.ExcelJS);if(excelJsP)return excelJsP;excelJsP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=()=>window.ExcelJS?res(window.ExcelJS):rej(new Error('ExcelJS tidak tersedia'));s.onerror=()=>{excelJsP=null;rej(new Error('Gagal memuat ExcelJS'))};document.head.appendChild(s)});return excelJsP}
const HEAD=['No','IKU','Realisasi','Bukti Dukung','Kendala','Usulan Strategi','Tindakan yang dilaksanakan'],WID=[12.7,64.3,34.4,65,17.4,35.3,93.6];
function sheetRows(D,t){const out=[];let last=null;D.rows.forEach(r=>{if(r.ssNo!==last){out.push({ss:true,v:[r.ssNo+'.',r.ssNama||'Sasaran Strategis '+r.ssNo,'','','','','']});last=r.ssNo}const p=D.tw[t-1][r.kode]||{};out.push({ss:false,v:[r.kode,r.nama,'','',p.kendala||'',r.strategi||'',p.tindakan||'']})});return out}
async function buildXlsx(y){const D=iprData(y);
 try{const X=await loadExcelJS();const wb=new X.Workbook();wb.creator='Dashboard CM';wb.created=new Date();
  const thin={style:'thin',color:{argb:'FF000000'}},border={top:thin,left:thin,bottom:thin,right:thin},font={name:'Barlow',size:14};
  [1,2,3,4].forEach(t=>{const ws=wb.addWorksheet('Capaian TW '+t,{views:[{state:'frozen',ySplit:1,zoomScale:50}]});ws.columns=WID.map(w=>({width:w}));
   const h=ws.addRow(HEAD);h.height=37.5;h.eachCell(c=>{c.font=Object.assign({},font,{bold:true,color:{argb:'FFFFFFFF'}});c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1F497D'}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border=border});
   sheetRows(D,t).forEach(r=>{const row=ws.addRow(r.v);row.eachCell({includeEmpty:true},(c,i)=>{c.font=Object.assign({},font,{bold:r.ss});c.border=border;c.alignment={vertical:'top',horizontal:i===1?'center':'left',wrapText:true};if(r.ss)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFDE9D9'}}})})});
  return {buf:await wb.xlsx.writeBuffer(),D}}
 catch(e){console.warn('[IPR] ExcelJS tidak tersedia, memakai format sederhana',e);if(!window.XLSX)throw e;
  const wb=XLSX.utils.book_new();[1,2,3,4].forEach(t=>{const ws=XLSX.utils.aoa_to_sheet([HEAD].concat(sheetRows(D,t).map(r=>r.v)));ws['!cols']=WID.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,'Capaian TW '+t)});
  return {buf:XLSX.write(wb,{type:'array',bookType:'xlsx'}),D}}}
/* IPR 261126: pratinjau isi sheet sebelum unduh */
function iprPvTw(y){const d=new Date();return String(y)===String(d.getFullYear())?Math.ceil((d.getMonth()+1)/3):1}
function iprPreviewHTML(D,t){const W=[6,20,9,9,16,17,23],tot=100,rows=sheetRows(D,t),n=[1,2,3,4].map(k=>D.acts.filter(x=>twOf(x)===k).length);
 const cell=(r,c,i)=>{const em=!r.ss&&!c&&(i===2||i===3);return '<td'+(em?' class="em"':'')+'>'+(em?'—':E(c))+'</td>'};
 return '<div class="ipr-pv-tabs" role="tablist">'+[1,2,3,4].map(k=>'<button type="button" role="tab" data-pvt="'+k+'" class="'+(k===t?'on':'')+'" aria-selected="'+(k===t)+'">Capaian TW '+k+'<i>'+n[k-1]+'</i></button>').join('')+'</div>'
  +'<div class="ipr-pv-sc"><table><colgroup>'+W.map(w=>'<col style="width:'+(w/tot*100).toFixed(2)+'%">').join('')+'</colgroup><thead><tr>'+HEAD.map(h=>'<th>'+E(h)+'</th>').join('')+'</tr></thead><tbody>'
  +(rows.length?rows.map(r=>'<tr'+(r.ss?' class="ss"':'')+'>'+r.v.map((c,i)=>cell(r,c,i)).join('')+'</tr>').join(''):'<tr><td colspan="7" class="em" style="text-align:center">'+uiText('IKU Reference is empty.','Referensi IKU masih kosong.')+'</td></tr>')
  +'</tbody></table></div><div class="ipr-pv-ft"><span>Sheet “Capaian TW '+t+'” · '+rows.filter(r=>!r.ss).length+' IKU</span><span>'+uiText('Realisation & Evidence left empty (managed in the IKU app)','Realisasi &amp; Bukti Dukung dikosongkan (dikelola di aplikasi IKU)')+'</span></div>'}
function iprPvWire(ov,getY,btn){const pv=ov.querySelector('[data-xp]');let t=iprPvTw(getY());
 const draw=()=>{if(pv.hidden)return;pv.innerHTML=iprPreviewHTML(iprData(getY()),t)};
 pv.addEventListener('click',e=>{const b=e.target.closest('[data-pvt]');if(b){t=+b.dataset.pvt;draw()}});
 const toggle=()=>{pv.hidden=!pv.hidden;if(btn)btn.textContent=pv.hidden?'👁 '+uiText('Preview','Pratinjau')+'':'✕ '+uiText('Close preview','Tutup pratinjau')+'';draw();if(!pv.hidden)pv.scrollIntoView({block:'nearest',behavior:'smooth'})};
 return {draw,toggle,year:()=>{t=iprPvTw(getY());draw()}}}
async function openIprExport(){if(!canEdit()){T(uiText('IPR export is for CMO Pusat and PMO Pusat.','Ekspor IPR hanya untuk CMO Pusat dan PMO Pusat.'));return}await load();
 const ys=years(),f=state.filters||{},y0=String(UI.year||(f.tahun&&f.tahun!=='ALL'?f.tahun:yNow()));
 const body=`<div class="form-grid"><div class="form-field"><label>${uiText('IPR year','Tahun IPR')}</label><select data-xy>${ys.map(v=>`<option${v===y0?' selected':''}>${v}</option>`).join('')}</select></div></div><div data-xs></div><div class="ipr-pv" data-xp hidden></div>
  <p class="dcm-iku-h">${uiText('Each sheet: <b>Obstacles</b> from the activities’ Obstacles field, <b>Proposed Strategy</b> from the IKU Reference (same every quarter), <b>Actions taken</b> from activities in that quarter linked to the IKU. Realisation and Evidence stay empty (managed in the IKU app). Cancelled, postponed, not-attended and future activities are excluded.','Isi tiap sheet: <b>Kendala</b> dari isian Kendala aktivitas, <b>Usulan Strategi</b> dari Referensi IKU (sama setiap TW), <b>Tindakan yang dilaksanakan</b> dari aktivitas pada TW tersebut yang dikaitkan ke IKU itu. Kolom Realisasi dan Bukti Dukung dibiarkan kosong (dikelola di aplikasi IKU). Kegiatan dibatalkan, ditunda, tidak dihadiri, atau yang tanggalnya belum lewat tidak ikut.')}</p>`;
 const ov=modal(uiText('IPR export (Excel)','Ekspor IPR (Excel)'),body,'⇩ '+uiText('Download Excel','Unduh Excel'),async o=>{const y=o.querySelector('[data-xy]').value,btn=o.querySelector('[data-ok]');btn.disabled=true;btn.textContent=uiText('Building…','Menyusun…');
  try{const {buf}=await buildXlsx(y);const url=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download='IPR_Pusmantap_'+y+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);T(uiText('IPR Excel downloaded.','Excel IPR '+y+' diunduh.'),'success');return true}
  catch(e){btn.disabled=false;btn.textContent='⇩ '+uiText('Download Excel','Unduh Excel');T(uiText('Failed to build the IPR Excel: ','Gagal menyusun Excel IPR: ')+e.message,'error');return false}},{cls:'dcm-iku-wide'});
 const pvb=document.createElement('button');pvb.type='button';pvb.className='btn btn-outline btn-sm';pvb.dataset.pv='1';pvb.textContent='👁 '+uiText('Preview','Pratinjau');ov.querySelector('[data-ok]').before(pvb);
 const PV=iprPvWire(ov,()=>ov.querySelector('[data-xy]').value,pvb);pvb.addEventListener('click',()=>PV.toggle());
 const sum=()=>{const y=ov.querySelector('[data-xy]').value,D=iprData(y),per=[1,2,3,4].map(t=>Object.values(D.tw[t-1]).filter(p=>p.n).length);
  ov.querySelector('[data-xs]').innerHTML=D.rows.length?`<div class="dcm-iku-sumg">${[1,2,3,4].map(t=>`<div><small>TW ${['I','II','III','IV'][t-1]}</small><b>${D.acts.filter(a=>twOf(a)===t).length}</b><span>${uiText('activities','aktivitas')} · ${per[t-1]}/${D.rows.length} IKU ${uiText('filled','terisi')}</span></div>`).join('')}</div>${D.orphan?`<p class="dcm-iku-warn">⚠ ${D.orphan} ${uiText('activities use an IKU code that is not in the reference and are not exported.','aktivitas memakai kode IKU yang tidak ada di Referensi IKU '+E(y)+' dan tidak ikut terekspor.')}</p>`:''}`:`<p class="dcm-iku-warn">${uiText('IKU Reference is empty for this year.','Referensi IKU '+E(y)+' masih kosong.')}</p>`};
 ov.querySelector('[data-xy]').addEventListener('change',()=>{sum();PV.year()});sum()}

window.DCMIKU={KEY,SEED,load,ref,years,writeRef,formField,readForm,setFormRefs,wireForm,filterOptions,filterSelect,matchFilter,renderTab,openIprExport,parsePaste,parseSheet,iprData,buildXlsx,refsOf};
/* label tab mengikuti bahasa */
let refLabelObserver=null;
function tabLabel(){const l=document.querySelector('[data-iku-tablabel]');if(!l)return;const label=uiText('References','Referensi');if(l.textContent!==label)l.textContent=label;const b=l.closest('button');if(b)b.title=uiText('IKU Reference and WBS Stages','Referensi IKU dan Tahapan WBS');if(!refLabelObserver){refLabelObserver=new MutationObserver(()=>tabLabel());refLabelObserver.observe(l,{childList:true,characterData:true,subtree:true});}}
setTimeout(tabLabel,0);
/* muat referensi dari Firebase setelah login */
(function boot(n){if(typeof isLoggedIn==='function'&&isLoggedIn()&&window.fbDb){load(true).then(rerender);return}if(n<120)setTimeout(()=>boot(n+1),1000)})(0);
})();
