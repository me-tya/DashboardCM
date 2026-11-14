/* DCM 50: side-by-side field-by-field employee migration review. */
(function(w){
'use strict';
const api=w.MT_PROFILE_IMPORT;if(!api||api.openSideBySide)return;
const T=x=>String(x==null?'':x).trim(),esc=x=>w.esc(T(x)),empty=x=>x==null||x===''||Array.isArray(x)&&!x.length;
const copy=x=>JSON.parse(JSON.stringify(x));
const validNip=x=>/^\d{18}$/.test(T(x).replace(/\D/g,''))?T(x).replace(/\D/g,''):'';
const FIELDS=[['n','Nama lengkap'],['nip','NIP (18 digit)'],['nik','NIK (16 digit)'],['foto','Foto profil'],['nk','Nama panggilan'],['nl','Nama lengkap lainnya'],['jab','Jabatan'],['pang','Pangkat / golongan'],['org','Unit organisasi'],['unitAsal','Unit asal'],['peran','Peran'],['emailK','Email kantor'],['emailP','Email pribadi'],['hp','Nomor HP'],['keahlian','Keahlian'],['jenis','Jenis pegawai'],['jenisSementara','Jenis penugasan'],['penugasan','Penugasan'],['penMulai','Mulai penugasan'],['penSelesai','Selesai penugasan'],['status','Status kerja'],['statusKerja','Kehadiran'],['statusMulai','Status mulai'],['statusSelesai','Status selesai'],['catatanStatus','Catatan status'],['alasanOff','Alasan nonaktif'],['jenisCuti','Jenis cuti'],['wfhDays','Jadwal WFH'],['cuti','Rencana cuti'],['rangkap','Rangkap tugas']];
const STRUCT=[['pt','Tim utama'],['ptx','Tim tambahan'],['asg','Unit dampingan']];
const STATUS={update:'Cocok',review:'Perlu verifikasi',conflict:'Konflik NIP',new:'Belum terdaftar'};
const photo=x=>/^(?:data:image\/(?:png|jpe?g|webp);base64,|https:\/\/)/i.test(T(x))?T(x):'';
function present(key,x){
 if(empty(x))return '<em class="cmp-empty">Belum ada</em>';
 if(key==='foto')return photo(x)?'<img class="cmp-photo" alt="Foto profil" src="'+esc(photo(x))+'">':'<em class="cmp-empty">Tidak tersedia</em>';
 if(key==='cuti'){return (Array.isArray(x)?x:[]).map(c=>'<div>'+esc(c.mulai)+(c.selesai&&c.selesai!==c.mulai?'–'+esc(c.selesai):'')+' · '+esc(c.jenis)+'</div>').join('')||'<em class="cmp-empty">Belum ada</em>'}
 if(key==='wfhDays'){const d=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];return (Array.isArray(x)?x:[]).map(i=>d[+i]||T(i)).join(', ')}
 if(Array.isArray(x))return esc(x.join(', '));
 return esc(typeof x==='object'?JSON.stringify(x):x);
}
function teams(src,dst,oldK,newK){
 const units=(k,name)=>Object.keys(k?.asg||{}).filter(u=>(k.asg[u]||[]).includes(name));
 return {pt:[dst?oldK?.pt?.[dst.n]||'':'',newK?.pt?.[src.n]||''],
 ptx:[dst?oldK?.ptx?.[dst.n]||[]:[],newK?.ptx?.[src.n]||[]],
 asg:[dst?units(oldK,dst.n):[],units(newK,src.n)]};
}
function compact(url){return new Promise(resolve=>{
 if(!/^data:image\//i.test(url||''))return resolve(url);
 const im=new Image();im.onerror=()=>resolve(url);
 im.onload=()=>{try{
  const ratio=Math.min(1,160/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(im.naturalWidth*ratio));c.height=Math.max(1,Math.round(im.naturalHeight*ratio));
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  const v=c.toDataURL('image/jpeg',.76);resolve(v.length<url.length?v:url);
 }catch(e){resolve(url)}};im.src=url;
})}
function open(){
 if(!w.actCanEdit())return w.toast('Hak akses impor tidak tersedia.');
 // Attach the dialog to the *parent* viewport, not the very tall embedded iframe.
 // In the iframe, position:fixed centers below the visible scroll area and leaves
 // only a grey overlay on screen.
 let hostDocument=document;
 try{if(window.parent&&window.parent!==window&&window.parent.document)hostDocument=window.parent.document}catch(e){}
 if(hostDocument!==document&&!hostDocument.getElementById('dcm-profile-compare-style-51')){
  const stylesheet=hostDocument.createElement('link');
  stylesheet.id='dcm-profile-compare-style-51';stylesheet.rel='stylesheet';
  stylesheet.href='mt-team-exact/dcm-profile-compare-50.css?v=261114-51';
  hostDocument.head.appendChild(stylesheet);
 }
 const wrap=hostDocument.createElement('div');wrap.className='ov cmp50';
 wrap.innerHTML='<div class="md" role="dialog" aria-modal="true" aria-label="Bandingkan data Dashboard CM dan Modul Transformasi">'+
 '<header class="cmp-header"><div><h3>Bandingkan Profil & Foto</h3><small>NIP, foto &amp; profil Modul Transformasi menjadi acuan utama</small></div><div class="cmp-upload-actions"><input id="cmp-file" type="file" accept=".json,application/json" aria-label="Pilih JSON Modul Transformasi"></div></header>'+
 '<main class="cmp-main"><aside class="cmp-aside"><div id="cmp-stats">Pilih JSON Modul Transformasi.</div><input id="cmp-search" placeholder="Cari nama / NIP…" disabled><div id="cmp-people"></div></aside>'+
 '<section id="cmp-panel" class="cmp-panel"><p class="cmp-placeholder">Belum ada profil untuk dibandingkan.</p></section></main>'+
 '<footer class="cmp-footer"><div class="cmp-footer-options"><label class="cmp-all-label"><input type="checkbox" id="cmp-replace-all" disabled> <b>Impor semua &amp; timpa data Tim Pusmantap dari Modul Transformasi</b></label><span id="cmp-footer-text">Belum ada perubahan.</span></div><div><button id="cmp-cancel">Batal</button><button id="cmp-save" class="cmp-primary" disabled>Tinjau sebelum simpan</button></div></footer></div>';
 hostDocument.body.appendChild(wrap);
 const $=s=>wrap.querySelector(s);
 const state={active:0,choices:{},fields:{},structure:{},manualApproved:{},contacts:false,replaceAll:false,stage:1,baseline:''};
 const get=()=>wrap._data,roster=()=>w.actMaster().pic,close=()=>{wrap.remove();};
 $('#cmp-cancel').onclick=()=>state.stage===2?back():close();
 wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
 wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
 function existing(i){const v=state.choices[i];return /^existing:\d+$/.test(v||'')?roster()[+v.slice(9)]||null:null}
 function initChoices(i){
  const src=get().profiles[i],dst=existing(i),a=teams(src,dst,w.kpCfg(),get().kp);
  if(!state.fields[i])state.fields[i]=Object.fromEntries(FIELDS.slice(1).map(([k])=>[k,!empty(src[k])?'mt':'dcm']));
  if(!state.structure[i])state.structure[i]=Object.fromEntries(STRUCT.map(([k])=>[k,empty(a[k][0])&&!empty(a[k][1])?'mt':'dcm']));
 }
 function counts(){
  const c={update:0,new:0,skip:0};
  get().profiles.forEach((p,i)=>{const v=state.choices[i];if(v==='add')c.new++;else if(v?.startsWith('existing:'))c.update++;else c.skip++});
  return c;
 }
 function renderList(){
  if(!get())return;
  const q=T($('#cmp-search').value).toLowerCase(),c=counts();
  $('#cmp-stats').textContent=get().profiles.length+' profil · '+c.update+' diperbarui · '+c.new+' baru · '+c.skip+' dilewati';
  $('#cmp-footer-text').textContent=state.replaceAll?'Seluruh profil, foto, pemetaan dan kontak PMO/CMO/Pemilik Probis diganti dari JSON.':c.update+' profil diperbarui · '+c.new+' baru · '+c.skip+' tidak diproses';
  $('#cmp-save').disabled=!state.replaceAll&&!(c.update+c.new);
  $('#cmp-people').innerHTML=get().profiles.map((p,i)=>{
   if(q&&!p.n.toLowerCase().includes(q)&&!T(p.nip).includes(q))return '';
   const status=state.replaceAll?'Ikuti Modul Transformasi':state.choices[i]==='skip'?STATUS[api.analyze(p,roster()).kind]:state.choices[i]==='add'?'Baru (dipilih)':'Akan diperbarui';
   return '<button data-cmp-person="'+i+'" class="cmp-person'+(i===state.active?' active':'')+'"><b>'+esc(p.n)+'</b><small>'+esc(p.nip||'NIP kosong')+'</small><span class="cmp-pill">'+esc(status)+'</span></button>';
  }).join('');
 }
 function choiceOptions(i){
  const p=get().profiles[i],a=api.analyze(p,roster()),current=state.choices[i];
  let out='<option value="skip"'+(current==='skip'?' selected':'')+'>Lewati pegawai ini</option>';
  for(const idx of a.candidates){
   const target=roster()[idx];
   if(!target||a.kind==='conflict'||validNip(p.nip)&&validNip(target.nip)&&validNip(p.nip)!==validNip(target.nip))continue;
   out+='<option value="existing:'+idx+'"'+(current==='existing:'+idx?' selected':'')+'>Perbarui '+esc(target.n)+(target.nip?' ('+esc(target.nip)+')':'')+'</option>';
  }
  if(a.kind!=='conflict'){
   const c=new Set(a.candidates),excluded=c;
   for(let idx=0;idx<roster().length;idx++){
    if(excluded.has(idx))continue;
    const target=roster()[idx];
    if(!target||validNip(p.nip)&&validNip(target.nip)&&validNip(p.nip)!==validNip(target.nip))continue;
    out+='<option value="existing:'+idx+'"'+(current==='existing:'+idx?' selected':'')+'>Cocokkan manual: '+esc(target.n)+(target.nip?' ('+esc(target.nip)+')':'')+'</option>';
   }
  }
  if(a.kind==='new')out+='<option value="add"'+(current==='add'?' selected':'')+'>Tambah pegawai baru (manual)</option>';
  return out;
 }
 function valueBtn(k,side,val,chosen,disabled){
  return '<button data-cmp-key="'+k+'" data-cmp-side="'+side+'" class="cmp-choice'+(chosen===side?' selected':'')+(side==='mt'?' gold':'')+'"'+(disabled?' disabled':'')+'>'+
   '<input tabindex="-1" type="radio" '+(chosen===side?'checked':'')+' aria-hidden="true"><span>'+present(k,val)+'</span></button>';
 }
 function renderPerson(){
  const i=state.active,p=get().profiles[i],dst=existing(i),analysis=api.analyze(p,roster()),chosen=state.choices[i]!=='skip';
  initChoices(i);
  let html='<div class="cmp-person-header"><div><b>'+esc(p.n)+'</b><small>'+esc(STATUS[analysis.kind])+' · '+esc(analysis.reason)+'</small></div><select id="cmp-target" aria-label="Tujuan data">'+choiceOptions(i)+'</select></div>'+
   '<div class="cmp-toolbar"><span>Klik nilai yang ingin dipakai</span><button data-cmp-bulk="dcm">Semua Dashboard CM</button><button data-cmp-bulk="fill">Isi yang kosong</button><button data-cmp-bulk="mt">Semua Modul Transformasi</button></div>'+
   '<div class="cmp-rows"><div class="cmp-row cmp-sticky"><strong>Data profil</strong><b>Dashboard CM (saat ini)</b><b>Modul Transformasi (JSON)</b></div>';
  for(const [k,label] of FIELDS){
   const left=k==='n'?dst?.n:k==='nik'?(dst?.nik||(/^[0-9]{16}$/.test(T(dst?.nip))?dst.nip:'')):k==='nip'&&!validNip(dst?.nip)?'':dst?.[k],right=k==='n'?p.n:p[k],side=state.fields[i][k]||'dcm';
   const conflict=k==='nip'&&!!validNip(left)&&!!validNip(right)&&validNip(left)!==validNip(right);
   html+='<div class="cmp-row"><label>'+label+(conflict?' ⚠':'')+'</label>'+
     (k==='n'?'<div class="cmp-fixed">'+present(k,left)+'</div><div class="cmp-fixed">'+present(k,right)+'</div>':
     valueBtn(k,'dcm',left,side,!chosen)+valueBtn(k,'mt',right,side,!chosen||empty(right)||conflict))+'</div>';
  }
  const pair=teams(p,dst,w.kpCfg(),get().kp);
  html+='<div class="cmp-row cmp-sticky"><strong>Penempatan tim (opsional)</strong><b>Dashboard CM</b><b>Modul Transformasi</b></div>';
  for(const [k,label] of STRUCT){
   const [left,right]=pair[k],side=state.structure[i][k];
   html+='<div class="cmp-row"><label>'+label+'</label>'+valueBtn(k,'dcm',left,side,!chosen)+valueBtn(k,'mt',right,side,!chosen||empty(right))+'</div>';
  }
  const val=state.choices[i]||'skip';
  const idx=/^existing:\d+$/.test(val)?+val.slice(9):-1;
  const manualMatch=idx>=0&&!analysis.candidates.includes(idx);
  html+='</div><div class="cmp-hint"><div>'+
   '<label><input id="cmp-contacts" type="checkbox" '+(state.contacts?'checked':'')+'> Sertakan kontak PMO/CMO Unit (hanya lengkapi yang aman)</label>'+
   (manualMatch?'<label style="margin-left:12px;color:#8c5c14"><input id="cmp-manual-check" type="checkbox" '+(state.manualApproved[i]?'checked':'')+'> Saya pastikan kedua profil ini orang yang sama</label>':'')+
   '</div>'+
   '<span>'+(analysis.kind==='review'?'Nama mirip: periksa pegawai tujuan secara manual.':analysis.kind==='conflict'?'NIP resmi 18 digit berbeda: perlu verifikasi.':
    analysis.kind==='new'?'Belum ada pasangan yakin. Pilih Tambah Baru hanya jika memang belum terdaftar.':
    'Data tidak berubah sampai kamu mengonfirmasi penyimpanan.')+'</span></div>';
  $('#cmp-panel').innerHTML=html;
 }
 function rerender(){renderList();renderPerson()}
 function selectTarget(i,val){state.choices[i]=val;state.manualApproved[i]=false;delete state.fields[i];delete state.structure[i];rerender()}
 wrap.addEventListener('click',e=>{
  const item=e.target.closest('[data-cmp-person]');if(item){state.active=+item.dataset.cmpPerson;rerender();return}
  const field=e.target.closest('[data-cmp-key]');if(field&&!field.disabled){
   const k=field.dataset.cmpKey,v=field.dataset.cmpSide;
   if(STRUCT.some(x=>x[0]===k))state.structure[state.active][k]=v;else state.fields[state.active][k]=v;
   renderPerson();return;
  }
  const bulk=e.target.closest('[data-cmp-bulk]');if(bulk){
   const mode=bulk.dataset.cmpBulk,p=get().profiles[state.active],dst=existing(state.active),result=state.fields[state.active];
   for(const [k] of FIELDS.slice(1)){
    const conflict=k==='nip'&&validNip(dst?.nip)&&validNip(p.nip)&&validNip(dst.nip)!==validNip(p.nip);
    result[k]=mode==='dcm'?'dcm':mode==='fill'?empty(dst?.[k])&&!empty(p[k])?'mt':'dcm':!empty(p[k])&&!conflict?'mt':'dcm';
   }renderPerson();
  }
 });
 wrap.addEventListener('change',e=>{
  if(e.target.id==='cmp-target')selectTarget(state.active,e.target.value);
  if(e.target.id==='cmp-contacts')state.contacts=e.target.checked;
  if(e.target.id==='cmp-manual-check')state.manualApproved[state.active]=e.target.checked;
 });
 $('#cmp-replace-all').onchange=e=>{
  state.replaceAll=!!e.target.checked;
  $('#cmp-panel').classList.toggle('cmp-readonly',state.replaceAll);
  rerender();
 };
 $('#cmp-search').oninput=renderList;
 $('#cmp-file').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  $('#cmp-stats').textContent='Membaca JSON…';$('#cmp-save').disabled=true;
  try{
   if(f.size>15*1024*1024)throw Error('File melebihi 15 MB.');
   const data=api.parse(JSON.parse(await f.text()));wrap._data=data;
   state.active=0;state.stage=1;state.choices={};state.fields={};state.structure={};state.manualApproved={};state.contacts=false;state.replaceAll=false;$('#cmp-replace-all').checked=false;
   state.baseline=JSON.stringify(roster());
   $('#cmp-replace-all').disabled=!data.sourceDocs?.some(d=>d.id==='cfg-kp');
   data.profiles.forEach((p,i)=>{const a=api.analyze(p,roster());state.choices[i]=a.kind==='update'?'existing:'+a.index:'skip'});
   $('#cmp-search').disabled=false;rerender();
  }catch(err){$('#cmp-replace-all').disabled=true;$('#cmp-stats').textContent='JSON tidak terbaca';$('#cmp-panel').textContent='Gagal membaca data: '+(err.message||err)}
 };
 function argumentsFor(){
  const includeTeams=Object.entries(state.structure).some(([i,row])=>state.choices[i]!=='skip'&&Object.values(row).includes('mt'))||state.contacts;
  const manualTargets={};
  for(const [i,val] of Object.entries(state.choices)){
   if(!/^existing:\d+$/.test(val))continue;
   const idx=+val.slice(9),a=api.analyze(get().profiles[+i],roster());
   if(!a.candidates.includes(idx)){
    if(!state.manualApproved[i])throw Error('Konfirmasikan pencocokan manual: '+get().profiles[+i].n);
    manualTargets[i]=idx;
   }
  }
  return {includeTeams,opts:{allowSnapshotRoster:true,baselineRoster:state.baseline,fieldChoices:state.fields,structureChoices:state.structure,importContacts:state.contacts,manualTargets}};
 }
 function preflight(data){
  const cfg=argumentsFor();
  return api.prepare(data,copy(state.choices),roster(),w.S.oneonone,w.S.ui,cfg.includeTeams,cfg.opts);
 }
 async function review(){
  if(!get()||$('#cmp-save').disabled)return;
  $('#cmp-save').disabled=true;$('#cmp-save').textContent='Menyiapkan foto…';
  try{
   if(JSON.stringify(roster())!==state.baseline)throw Error('Data tujuan berubah; ulangi pemeriksaan.');
   const data=copy(get());
   if(!state.replaceAll)for(const [i,v] of Object.entries(state.choices))if(v!=='skip'&&state.fields[i]?.foto==='mt'&&data.profiles[i].foto)data.profiles[i].foto=await compact(data.profiles[i].foto);
   const result=state.replaceAll
    ? await w.MT_IMPORT_ALL.prepare(data,w.S.oneonone,w.S.ui)
    : preflight(data);
   wrap._pending={data,result,replaceAll:state.replaceAll};state.stage=2;
   const c=result.summary;
   if(state.replaceAll){
    $('#cmp-panel').innerHTML='<section class="cmp-review"><h3>Konfirmasi impor semua dari Modul Transformasi</h3>'+
     '<p>Data Tim Pusmantap di Dashboard CM akan diganti seluruhnya sesuai file JSON. Tidak perlu memilih pegawai satu per satu.</p>'+
     '<div class="cmp-metrics"><div><b>'+c.profiles+'</b><span>Profil sumber</span></div>'+
     '<div><b>'+c.photos+'</b><span>Foto pegawai</span></div><div><b>'+c.contacts+'</b><span>Kontak PMO/CMO/Pemilik Probis</span></div>'+
     '<div><b>'+c.teams+'</b><span>Tim dari MT</span></div></div>'+
     '<p>Profil lama Dashboard CM: '+c.previousProfiles+' → '+c.profiles+'. Pemetaan unit ('+c.unitAssignments+') dan seluruh data penugasan mengikuti Modul Transformasi.</p>'+
     '<p><b>Hanya Tim Pusmantap yang ditimpa.</b> Agenda dan menu Dashboard CM lainnya tetap.</p>'+
     '<div class="cmp-review-note">Data akan disimpan setelah klik Konfirmasi &amp; Simpan dan diverifikasi oleh Firebase.</div></section>';
    $('#cmp-save').textContent='Konfirmasi & Simpan';$('#cmp-cancel').textContent='Kembali';$('#cmp-save').disabled=false;
    return;
   }
   $('#cmp-panel').innerHTML='<section class="cmp-review"><h3>Konfirmasi hasil pilihan</h3><p>Belum ada perubahan yang disimpan. Periksa jumlah berikut:</p>'+
    '<div class="cmp-metrics"><div><b>'+c.updated+'</b><span>Profil diperbarui</span></div><div><b>'+c.new+'</b><span>Pegawai baru</span></div>'+
    '<div><b>'+c.skipped+'</b><span>Dilewati</span></div><div><b>'+c.photosAdded+'</b><span>Foto ditambahkan</span></div></div>'+
    '<p>'+Number(c.fieldsFromMT||0)+' kolom dipilih dari Modul Transformasi · '+Number(c.photosReplaced||0)+' foto lama diganti atas pilihanmu.</p>'+
    '<p>'+c.contactsAdded+' kontak baru, '+c.contactsUpdated+' kontak dilengkapi, '+c.contactsSkipped+' kontak ditahan.</p>'+
    '<p><b>Pilihan Dashboard CM dipertahankan; pilihan Modul Transformasi digunakan pada kolom yang kamu tentukan.</b></p>'+
    '<div class="cmp-review-note">Simpan hanya jika hasil perbandingan sudah benar. Impor ditolak apabila daftar pegawai berubah sebelum disimpan.</div></section>';
   $('#cmp-save').textContent='Konfirmasi & Simpan';$('#cmp-cancel').textContent='Kembali';$('#cmp-save').disabled=false;
  }catch(err){$('#cmp-save').textContent='Tinjau sebelum simpan';$('#cmp-save').disabled=false;w.toast('Tidak dapat meninjau: '+(err.message||err))}
 }
 function back(){state.stage=1;$('#cmp-cancel').textContent='Batal';$('#cmp-save').textContent='Tinjau sebelum simpan';rerender()}
 async function commit(){
  $('#cmp-save').disabled=true;$('#cmp-save').textContent='Menyimpan…';
  try{
   if(!w.actCanEdit())throw Error('Hak edit sudah berubah.');
   if(JSON.stringify(roster())!==state.baseline)throw Error('Data berubah setelah pratinjau.');
   const now=wrap._pending.replaceAll
    ? await w.MT_IMPORT_ALL.prepare(wrap._pending.data,w.S.oneonone,w.S.ui)
    : preflight(wrap._pending.data);
   if(JSON.stringify(now.docs)!==JSON.stringify(wrap._pending.result.docs))throw Error('Hasil berbeda. Periksa ulang.');
   if(typeof w.mtImportCommit!=='function')throw Error('Penghubung Firebase belum siap.');
   await w.mtImportCommit(now.docs,now.ui);w.toast('Data Tim Pusmantap dari Modul Transformasi berhasil disimpan.');close();
  }catch(err){w.toast('Tidak berhasil disimpan: '+(err.message||err));$('#cmp-save').disabled=false;$('#cmp-save').textContent='Coba simpan'}
 }
 $('#cmp-save').onclick=()=>state.stage===1?review():commit();
}
api.openSideBySide=open;api.open=open;
})(window);
