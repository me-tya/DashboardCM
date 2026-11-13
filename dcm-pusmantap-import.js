/* Dashboard CM • Tim Pusmantap: import JSON, Excel/CSV or OCR screenshot.
 * No file is uploaded. Parsing, OCR and editable review happen in the browser;
 * only confirmed employee fields are sent to authenticated Dashboard CM Firebase.
 */
(function(){
'use strict';
const MAX_ROWS=500,MAX_BYTES=15*1024*1024;
const TEAMS=['','DCS','DOA','SPP','SSB','CM'];
const STRUCT=['','Kepala Pusat','Kepala Bidang Program dan Manajemen Pengetahuan','Kepala Subbidang Program dan Sistem Kerja','Kepala Subbagian Tata Usaha','Kepala Subbidang Manajemen Pengetahuan'];
const TYPES=['Pegawai','Secondment','Re-entry','Magang Kemnaker','Pegawai Sementara'];
const safe=s=>String(s==null?'':s).trim().slice(0,500);
const esc=s=>safe(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fold=s=>safe(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const label=s=>safe(s).normalize('NFKD').toLowerCase().replace(/[_\-.]+/g,' ').replace(/[^\p{L}\p{N} ]/gu,'').replace(/\s+/g,' ').trim();
const aliases={
 name:['name','nama','nama lengkap','nama pegawai','nama karyawan','nama personil','pegawai','nama anggota','employee name','employee','full name','nama staff','nama staf','n'],
 nip:['nip','nip18','nip9','nomor induk pegawai','no induk pegawai','nomor pegawai','nip baru','employee id','id pegawai','nip nrp','nrp','nik'],
 job:['jabatan','jabatan pegawai','posisi','position','job','role','fungsi'],
 unit:['unit','unit kerja','unit organisasi','unit eselon','organisasi','satker','work unit','direktorat','bidang','bagian'],
 team:['tim','tim utama','team','penempatan tim','squad','squad team','kelompok tim','t'],
 jenis:['jenis kepegawaian','jenis pegawai','status pegawai','tipe pegawai','jenis','status kepegawaian','employee type','penugasan','jen'],
 structuralRole:['jabatan struktural','posisi struktural','structural role','structuralrole','struktur','struktural','kaki struktural']
};
const normalizedAliases=Object.fromEntries(Object.entries(aliases).map(([key,words])=>[key,new Set(words.map(label))]));
function keyFor(k){
 const x=label(k);if(!x)return'';
 for(const [key,words] of Object.entries(normalizedAliases)){if(words.has(x))return key}
 if(/^(nama|name)\s/.test(x))return'name';
 if(/^nip\b/.test(x))return'nip';
 if(/^(unit kerja|unit organisasi)\b/.test(x))return'unit';
 if(/^tim\b/.test(x))return'team';
 return'';
}
function normTeam(value){
 const x=safe(value).toUpperCase().replace(/^(TIM|TEAM|SQUAD)\s+/,'');
 return TEAMS.includes(x)?x:'';
}
function normType(value){
 const x=safe(value),hit=TYPES.find(t=>fold(t)===fold(x));
 return hit||x||'Pegawai';
}
function detectStructuralRole(j){
 if(!j||String(j.jenisJabatan||'').toLowerCase()!=='struktural')return '';
 const role=safe(j.namaJabatan).toLowerCase(),esl3=safe(j.esl3).toLowerCase(),esl4=safe(j.esl4).toLowerCase();
 if(role==='kepala pusat')return STRUCT[1];
 if(role==='kepala bidang'&&esl3.includes('program dan manajemen pengetahuan'))return STRUCT[2];
 if(role==='kepala subbidang'&&esl4.includes('program dan sistem kerja'))return STRUCT[3];
 if(role==='kepala subbagian'&&esl4.includes('tata usaha'))return STRUCT[4];
 if(role==='kepala subbidang'&&esl4.includes('manajemen pengetahuan'))return STRUCT[5];
 return '';
}
function mapRow(v){
 if(typeof v==='string')return {name:safe(v),nip:'',job:'',unit:'',team:'',jenis:'Pegawai',structuralRole:''};
 if(!v||typeof v!=='object'||Array.isArray(v))return null;
 const out={name:'',nip:'',job:'',unit:'',team:'',jenis:'Pegawai',structuralRole:''};
 if(Array.isArray(v.jabatan)){
  const structural=v.jabatan.find(j=>j?.jenisJabatan==='Struktural'),jab=structural||v.jabatan[0]||{};
  out.structuralRole=detectStructuralRole(structural);
  out.job=out.structuralRole||safe(jab.namaJabatan);
  out.unit=safe(jab.esl2)||safe(jab.organisasi);
 }

 for(const [k,val] of Object.entries(v)){
  const key=keyFor(k);
  if(!key||!safe(val))continue;
  if(key==='team')out.team=normTeam(val);
  else if(key==='jenis')out.jenis=normType(val);
  else if(key==='structuralRole'){const role=STRUCT.find(x=>fold(x)===fold(val));if(role)out.structuralRole=role;}
  else if(typeof val!=='object')out[key]=safe(val);
 }
 if(!out.name)return null;
 out.name=out.name.replace(/^\s*\d{1,4}[.\)-]?\s+/,'').trim();
 if(out.job==='[object Object]')out.job='';
 return out.name?out:null;
}
function selectJsonRows(obj){
 if(Array.isArray(obj))return obj;
 if(!obj||typeof obj!=='object')throw Error('JSON harus berupa daftar pegawai atau objek berisi resources/members/pegawai.');
 for(const k of ['resources','members','pegawai','employees','staff','rows','people','data','records','items']){
  if(Array.isArray(obj[k]))return obj[k];
  if(obj[k]&&typeof obj[k]==='object'){try{return selectJsonRows(obj[k])}catch(e){}}
 }
 if(obj.state&&typeof obj.state==='object')return selectJsonRows(obj.state);
 throw Error('Daftar pegawai tidak ditemukan dalam JSON. Gunakan array atau properti resources/members/pegawai.');
}
function normalizeRows(rows){
 if(!Array.isArray(rows))throw Error('Berkas tidak berisi daftar pegawai.');
 if(rows.length>MAX_ROWS)throw Error('Maksimal '+MAX_ROWS+' baris per impor. Pisahkan file menjadi beberapa bagian.');
 return rows.map(mapRow).filter(Boolean);
}
function parseJson(s){return normalizeRows(selectJsonRows(JSON.parse(s)))}
function parseMatrix(rows){
 if(!Array.isArray(rows))throw Error('Sheet Excel tidak dapat dibaca.');
 const grid=rows.filter(r=>Array.isArray(r)&&r.some(v=>safe(v))).slice(0,MAX_ROWS+20);
 if(!grid.length)return[];
 let h=-1,keys=[];
 for(let i=0;i<Math.min(20,grid.length);i++){
  const found=grid[i].map(keyFor);
  if(found.includes('name')){h=i;keys=found;break}
 }
 const begin=h>=0?h+1:0,out=[];
 for(const cells of grid.slice(begin)){
  const vals=cells.map(safe);
  if(!vals.some(Boolean))continue;
  let object={};
  if(h>=0){
   keys.forEach((k,i)=>{if(k&&vals[i]&&!object[k])object[k]=vals[i]});
  }else{
   let start=0;
   if(/^\d+$/.test(vals[0])&&vals.length>1)start=1;
   ['name','nip','job','unit','team','jenis','structuralRole'].forEach((k,i)=>{object[k]=vals[start+i]||''});
   if(object.nip&&!/^\d{6,20}$/.test(object.nip)){
    object={name:vals[start]||'',job:vals[start+1]||'',unit:vals[start+2]||'',team:vals[start+3]||'',jenis:vals[start+4]||'',structuralRole:vals[start+5]||''};
   }
  }
  const r=mapRow(object);if(r)out.push(r);
 }
 return normalizeRows(out);
}
function parseCsv(text){
 let rows=[],row=[],cell='',quoted=false;
 const s=String(text||'').replace(/^\uFEFF/,'');
 const first=s.split(/\r?\n/).find(x=>x.trim())||'';
 const separator=first.includes('\t')?'\t':first.includes(';')&&!first.includes(',')?';':',';
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
  else if(!quoted&&c===separator){row.push(cell);cell=''}
  else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);rows.push(row);cell='';row=[]}
  else cell+=c;
 }
 row.push(cell);rows.push(row);
 return parseMatrix(rows);
}
function parseOcr(text){
 const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const rows=[],seenHeader=/\b(?:nama|nip|jabatan|unit)\b/i;
 for(let l of lines){
  if(/^(halaman|page|total|jumlah|daftar pegawai|daftar karyawan|no[\s.]+nama)\b/i.test(l))continue;
  if(seenHeader.test(l)&&/\b(?:jabatan|unit|no\.?|nip)\b/i.test(l)&&/\bnama\b/i.test(l))continue;
  if(!/[\p{L}]/u.test(l))continue;
  let cols=l.split(/\t+|\s{3,}|\s*\|\s*|\s*;\s*/).map(safe).filter(Boolean);
  if(cols.length>1){
   if(/^\d{1,4}[.)]?$/.test(cols[0]))cols.shift();
   const h=cols.find(x=>/^\d{15,20}$/.test(x));
   const team=cols.find(x=>/^(?:TIM\s+)?(?:DCS|DOA|SPP|SSB|CM)$/i.test(x));
   const r=mapRow({name:cols[0],nip:h||'',job:cols.slice(1).filter(x=>x!==h&&x!==team).slice(0,1).join(''),unit:cols.slice(2).filter(x=>x!==h&&x!==team).join(' '),team:team||''});
   if(r)rows.push(r);
   continue;
  }
  l=l.replace(/^\s*\d{1,4}[.\)-]?\s+/,'').trim();
  const nip=l.match(/\b\d{15,20}\b/);if(nip)l=l.replace(nip[0],' ').replace(/\s+/g,' ').trim();
  const team=l.match(/(?:^|\s)(?:TIM\s+)?(DCS|DOA|SPP|SSB|CM)\s*$/i);
  if(team)l=l.slice(0,team.index).trim();
  if(!l||l.length<3)continue;
  const r=mapRow({name:l,nip:nip?.[0]||'',team:team?.[1]||''});if(r)rows.push(r);
 }
 return normalizeRows(rows);
}
function script(url,globalName){
 if(window[globalName])return Promise.resolve(window[globalName]);
 return new Promise((resolve,reject)=>{
  const tag=document.createElement('script');tag.src=url;tag.async=true;
  tag.onload=()=>window[globalName]?resolve(window[globalName]):reject(Error('Pustaka '+globalName+' tidak tersedia.'));
  tag.onerror=()=>reject(Error('Tidak dapat memuat pustaka '+globalName+'. Periksa koneksi internet.'));
  document.head.appendChild(tag);
 });
}
const SHEETJS_URL='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
const OCR_URL='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
let api=null,root=null,rows=[],source='',ocrText='',reading=false,importing=false,selectedMode='skip',info='',ocrFile=null,ocrQuality='';
function existing(){
 try{return api?.getExisting?.()||[]}catch(e){return[]}
}
function compare(row){
 const people=existing(),name=fold(row.name),nip=safe(row.nip);
 return people.find(p=>name&&fold(p.name)===name || nip&&safe(p.nip)===nip) || null;
}
function stateOf(row,index){
 if(!safe(row.name))return {kind:'invalid',label:'Nama wajib diisi'};
 const first=rows.findIndex((r,i)=>i<index&&(fold(r.name)===fold(row.name)||(row.nip&&safe(r.nip)===safe(row.nip))));
 if(first>=0)return {kind:'duplicate-file',label:'Duplikat dalam file'};
 const p=compare(row);
 if(!p)return {kind:'new',label:'Pegawai baru'};
 return p.source==='cm-team'?{kind:'cm',label:'Sudah ada di CM Team'}:{kind:'manual',label:'Sudah ada (manual)'};
}
function chosen(){return rows.filter((r,i)=>r._include&&stateOf(r,i).kind!=='invalid'&&stateOf(r,i).kind!=='duplicate-file'&&(selectedMode==='merge'||stateOf(r,i).kind==='new'))}
function limitLabel(){
 const count=chosen().length;return count+' pegawai siap diimpor dari '+rows.length+' baris';
}
function updateInfo(){
 const x=root?.querySelector('#tpImportInfo');if(x)x.textContent=info;
 const note=root?.querySelector('#tpImportSummary');if(note)note.textContent=limitLabel();
 const save=root?.querySelector('#tpImportSave');if(save)save.disabled=reading||importing||!chosen().length;
}
function preview(){
 if(!root)return;
 const box=root.querySelector('#tpImportPreview');if(!box)return;
 const all=rows.map((r,i)=>{
  const status=stateOf(r,i),blocked=status.kind==='invalid'||status.kind==='duplicate-file'||(selectedMode==='skip'&&status.kind!=='new');
  return '<tr data-import-row="'+i+'"><td class="tp-imp-check"><input type="checkbox" data-row-check="'+i+'" '+(r._include&&!blocked?'checked':'')+' '+(blocked?'disabled':'')+' aria-label="Pilih pegawai '+esc(r.name)+'"></td>'+
   '<td><input aria-label="Nama" data-import-field="name" data-row="'+i+'" value="'+esc(r.name)+'" placeholder="Nama lengkap" required></td>'+
   '<td><input aria-label="NIP" data-import-field="nip" data-row="'+i+'" value="'+esc(r.nip)+'" placeholder="Opsional"></td>'+
   '<td><input aria-label="Jabatan" data-import-field="job" data-row="'+i+'" value="'+esc(r.job)+'"></td>'+
   '<td><input aria-label="Unit" data-import-field="unit" data-row="'+i+'" value="'+esc(r.unit)+'"></td>'+
   '<td><select aria-label="Tim" data-import-field="team" data-row="'+i+'">'+TEAMS.map(t=>'<option value="'+t+'" '+(r.team===t?'selected':'')+'>'+esc(t||'Belum ada tim')+'</option>').join('')+'</select></td>'+
   '<td><input aria-label="Jenis pegawai" data-import-field="jenis" data-row="'+i+'" value="'+esc(r.jenis)+'" placeholder="Jenis"></td>'+ 
   '<td><select aria-label="Jabatan struktural" data-import-field="structuralRole" data-row="'+i+'">'+STRUCT.map(x=>'<option value="'+esc(x)+'" '+(r.structuralRole===x?'selected':'')+'>'+esc(x||'—')+'</option>').join('')+'</select></td>'+
   '<td><span class="tp-imp-state '+esc(status.kind)+'">'+esc(status.label)+'</span></td>'+
   '<td><button type="button" class="tp-imp-icon" title="Hapus baris" data-remove="'+i+'" aria-label="Hapus baris">×</button></td></tr>';
 }).join('');
 box.innerHTML=rows.length?'<div class="tp-imp-tablewrap"><table class="tp-imp-table"><thead><tr><th>Pilih</th><th>Nama pegawai</th><th>NIP</th><th>Jabatan</th><th>Unit</th><th>Tim</th><th>Jenis</th><th>Jabatan struktural</th><th>Status</th><th></th></tr></thead><tbody>'+all+'</tbody></table></div>':'<div class="tp-imp-emptystate">Pilih file JSON / Excel / screenshot untuk melihat pratinjau pegawai. Tidak ada data yang disimpan sebelum konfirmasi.</div>';
 box.querySelectorAll('[data-import-field]').forEach(el=>{
  const update=()=>{const r=rows[Number(el.dataset.row)];if(r)r[el.dataset.importField]=el.dataset.importField==='team'?normTeam(el.value):safe(el.value)};
  el.addEventListener('input',update);el.addEventListener('change',()=>{update();preview()});
 });
 box.querySelectorAll('[data-row-check]').forEach(el=>el.addEventListener('change',()=>{rows[Number(el.dataset.row)]._include=el.checked;updateInfo()}));
 box.querySelectorAll('[data-remove]').forEach(el=>el.addEventListener('click',()=>{rows.splice(Number(el.dataset.remove),1);preview()}));
 updateInfo();
}
function setRows(list,description){
 rows=normalizeRows(list).map(r=>({...r,_include:true}));
 if(!rows.length)throw Error('Tidak ada baris pegawai yang dapat dikenali. Periksa nama kolom atau hasil OCR.');
 source=description;info='Terbaca '+rows.length+' baris dari '+description+'. Tinjau dan koreksi sebelum menyimpan.';
 preview();
}
function setStatus(s){info=s;updateInfo()}
async function parseFile(file){
 if(!file)return;if(reading||importing)return;
 if(file.size>MAX_BYTES){setStatus('File terlalu besar. Maksimal 15 MB.');return}
 reading=true;setStatus('Membaca '+file.name+'…');
 const name=file.name.toLowerCase();
 try{
  if(/\.json$/i.test(name))setRows(parseJson(await file.text()),file.name);
  else if(/\.(xlsx|xls|xlsm|xlsb|ods)$/i.test(name)){
   const XLSX=window.XLSX||window.parent?.XLSX||await script(SHEETJS_URL,'XLSX');
   const w=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
   const sheets=w.SheetNames.map(n=>({name:n,rows:XLSX.utils.sheet_to_json(w.Sheets[n],{header:1,defval:'',raw:false})})).filter(x=>x.rows.length);
   const best=sheets.find(x=>x.rows.slice(0,20).some(r=>r.some(v=>keyFor(v)==='name')))||sheets[0];
   if(!best)throw Error('Sheet Excel kosong');
   setRows(parseMatrix(best.rows),file.name+' · '+best.name);
  }else if(/\.(csv|tsv|txt)$/i.test(name))setRows(parseCsv(await file.text()),file.name);
  else if(file.type.startsWith('image/')||/\.(png|jpe?g|webp|bmp)$/i.test(name)){
   ocrFile=file;await recognize(file);
  }else throw Error('Format belum didukung. Pilih JSON, Excel, CSV, PNG, JPG, atau WEBP.');
 }catch(e){setStatus('Gagal: '+(e.message||e))}
 finally{reading=false;updateInfo()}
}
async function recognize(file){
 const section=root.querySelector('#tpImportOcr');section.hidden=false;
 const image=root.querySelector('#tpImportImage');
 if(image){image.src=URL.createObjectURL(file);image.onload=()=>URL.revokeObjectURL(image.src)}
 const txt=root.querySelector('#tpImportOcrText');txt.value='';
 setStatus('Memuat mesin OCR di browser (pemrosesan gambar lokal)…');
 const T=window.Tesseract||await script(OCR_URL,'Tesseract');
 let worker=null,result;
 const logger=p=>{
  if(typeof p?.progress==='number'){
   const percent=Math.round(p.progress*100);
   setStatus('OCR '+safe(p.status||'memproses')+' '+percent+'% · hasil perlu diperiksa manual.');
  }
 };
 try{
  try{worker=await T.createWorker('ind+eng',1,{logger})}
  catch(e){setStatus('Bahasa Indonesia tidak tersedia, mencoba OCR bahasa Inggris…');worker=await T.createWorker('eng',1,{logger})}
  result=await worker.recognize(file);
 }finally{if(worker)await worker.terminate().catch(()=>{})}
 ocrText=String(result?.data?.text||'').slice(0,25000);
 txt.value=ocrText;
 ocrQuality=Number.isFinite(result?.data?.confidence)?Math.round(result.data.confidence):'';
 root.querySelector('#tpImportOcrQuality').textContent=ocrQuality!==''?'Perkiraan kepercayaan OCR: '+ocrQuality+'% — selalu periksa hasilnya.':'Periksa nama dan kolom sebelum menyimpan.';
 setRows(parseOcr(ocrText),file.name+' · OCR');
 if(!rows.length)setStatus('OCR belum mengenali nama. Edit teks OCR dan klik Susun Tabel.');
 else setStatus('OCR selesai: '+rows.length+' baris. Periksa tiap kolom, terutama nama, NIP, dan tim.');
}
function renderOcrText(){
 try{setRows(parseOcr(root.querySelector('#tpImportOcrText').value),'teks OCR yang telah disunting')}
 catch(e){setStatus(e.message||String(e))}
}
function downloadTemplate(){
 const csv='\ufeffNama,NIP,Jabatan,Unit,Tim,Jenis Kepegawaian,Jabatan Struktural\r\n';
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='template-impor-pegawai-pusmantap.csv';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function addBlank(){
 if(rows.length>=MAX_ROWS)return setStatus('Maksimal '+MAX_ROWS+' baris.');
 rows.push({name:'',nip:'',job:'',unit:'',team:'',jenis:'Pegawai',structuralRole:'',_include:true});
 preview();
}
async function commit(){
 if(!api?.mutate)return;
 const chosenRows=chosen();if(!chosenRows.length)return setStatus('Pilih pegawai yang valid terlebih dahulu.');
 const manualCount=chosenRows.filter(r=>stateOf(r,rows.indexOf(r)).kind==='manual').length;
 const cmCount=chosenRows.filter(r=>stateOf(r,rows.indexOf(r)).kind==='cm').length;
 let question='Simpan '+chosenRows.length+' baris pegawai ke Firebase Dashboard CM?';
 if(selectedMode==='merge'&&(manualCount||cmCount))question+=' Data manual yang sama diperbarui ('+manualCount+'); pegawai CM Team hanya diperbarui penempatan tim dan jabatan struktural ('+cmCount+').';
 if(!confirm(question))return;
 importing=true;setStatus('Menyimpan ke Firebase…');
 try{
  const stats=await api.mutate('members-import',{
   mode:selectedMode,
   entries:chosenRows.map(r=>({name:safe(r.name),nip:safe(r.nip),job:safe(r.job),unit:safe(r.unit),team:normTeam(r.team),jenis:normType(r.jenis),structuralRole:STRUCT.includes(r.structuralRole)?r.structuralRole:''}))
  });
  const s=stats||{};
  const message='Impor berhasil. Baru: '+(s.added??0)+', data manual diperbarui: '+(s.updated??0)+', tim: '+(s.assigned??0)+', struktural: '+(s.structuralAssigned??0)+', dilewati: '+(s.skipped??0)+'.';
  api.toast?.(message);close(); 
 }catch(e){setStatus('Gagal menyimpan: '+(e.message||e));importing=false;updateInfo()}
}
function close(){
 root?.remove();root=null;rows=[];ocrText='';reading=false;importing=false;source='';info='';ocrFile=null;ocrQuality='';api=null;
}
function open(options){
 if(!options?.mutate)return;
 if(root)close();
 api=options;rows=[];selectedMode='skip';source='';info='Pilih berkas untuk memulai. Format tabel dibaca otomatis.';reading=false;importing=false;
 root=document.createElement('div');
 root.className='tp-imp-backdrop';root.id='tpImportOverlay';
 root.innerHTML='<section class="tp-imp-dialog" role="dialog" aria-modal="true" aria-labelledby="tpImportTitle">'+
  '<header class="tp-imp-head"><div class="tp-imp-headtitle"><span class="tp-imp-headicon">⇧</span><div><h2 id="tpImportTitle">Impor Pegawai</h2><p>JSON · Excel · Screenshot (OCR)</p></div></div><button type="button" data-imp-close aria-label="Tutup">×</button></header>'+
  '<div class="tp-imp-content"><div class="tp-imp-top"><label class="tp-imp-file">↥ Pilih file <input id="tpImportFile" type="file" accept=".json,.xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.tsv,.txt,.png,.jpg,.jpeg,.webp,.bmp,image/*" hidden></label>'+
  '<button type="button" class="tp-imp-btn" id="tpImportTemplate">Unduh template CSV</button>'+
  '<span class="tp-imp-muted">Bisa seret file atau tempel screenshot (Ctrl+V)</span></div>'+
  '<div class="tp-imp-drop" id="tpImportDrop"><b>Tarik JSON, Excel, atau screenshot ke sini</b><small>File diproses di browser • maksimal 15 MB • hasil OCR wajib ditinjau</small></div>'+
  '<section class="tp-imp-ocr" id="tpImportOcr" hidden><div class="tp-imp-ocr-left"><img id="tpImportImage" alt="Pratinjau gambar yang diimpor"></div><div><b>Hasil pembacaan OCR — dapat diperbaiki</b><textarea id="tpImportOcrText" rows="5" spellcheck="false" placeholder="Teks hasil OCR akan tampil di sini"></textarea><div class="tp-imp-ocr-foot"><small id="tpImportOcrQuality">Akurasi bergantung kualitas screenshot.</small><button type="button" class="tp-imp-btn" id="tpImportOcrParse">Susun tabel dari teks</button></div></div></section>'+
  '<div class="tp-imp-tools"><strong>Pratinjau dan pemeriksaan duplikat</strong><label>Jika nama/NIP sudah ada: <select id="tpImportMode"><option value="skip">Lewati duplikat (aman)</option><option value="merge">Perbarui manual / penempatan tim</option></select></label><button type="button" class="tp-imp-btn" id="tpImportAdd">+ Tambah baris</button></div>'+
  '<p class="tp-imp-help">Nama yang cocok dengan CM Team tetap menggunakan profil master; impor tidak menimpa profil CM Team. Mode perbarui hanya mengubah penempatan tim dan peran struktural. File pusmantap.json dengan jabatan[] / esl3 / esl4 dikenali otomatis. Semua kolom dapat dikoreksi sebelum menyimpan.</p>'+
  '<div id="tpImportPreview"></div><div id="tpImportInfo" class="tp-imp-info" role="status"></div></div>'+
  '<footer class="tp-imp-footer"><span id="tpImportSummary">0 pegawai siap diimpor</span><div><button type="button" class="tp-imp-btn" data-imp-close>Batal</button><button type="button" class="tp-imp-btn primary" id="tpImportSave" disabled>✓ Simpan hasil impor</button></div></footer></section>';
 document.body.appendChild(root);
 root.querySelectorAll('[data-imp-close]').forEach(b=>b.addEventListener('click',close));
 root.addEventListener('click',e=>{if(e.target===root)close()});
 const fileInput=root.querySelector('#tpImportFile');
 fileInput.addEventListener('change',e=>{parseFile(e.target.files?.[0]);e.target.value=''});
 root.querySelector('#tpImportTemplate').addEventListener('click',downloadTemplate);
 root.querySelector('#tpImportAdd').addEventListener('click',addBlank);
 root.querySelector('#tpImportOcrParse').addEventListener('click',renderOcrText);
 root.querySelector('#tpImportMode').addEventListener('change',e=>{selectedMode=e.target.value;preview()});
 root.querySelector('#tpImportSave').addEventListener('click',commit);
 const drop=root.querySelector('#tpImportDrop');
 drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover')});
 drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));
 drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');parseFile(e.dataTransfer.files?.[0])});
 root.addEventListener('paste',e=>{const file=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));if(file){e.preventDefault();parseFile(file)}});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 preview();updateInfo();fileInput.focus();
}
window.cmTpImport={open,parseJson,parseCsv,parseMatrix,parseOcr,mapRow,normTeam,normalizeRows};
})();