/* Tim Pusmantap: safe profile/photo import from an exported Modul Transformasi JSON. */
(function(w){
'use strict';
const T=x=>String(x==null?'':x).trim();
const F=x=>T(x).toLocaleLowerCase('id-ID').replace(/\s+/g,' ');
const N=x=>T(x).replace(/\D/g,'');
const goodPhoto=x=>{const v=T(x);return v.length<=450000&&(/^data:image\/(?:jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(v)||/^https:\/\//i.test(v)&&v.length<2000)?v:''};
const fields=['nk','nl','nip','jab','org','pang','unitAsal','emailK','emailP','hp','peran','rangkap','penugasan','penMulai','penSelesai','jenis','jenisSementara','keahlian','status','statusKerja','statusMulai','statusSelesai','jenisCuti','catatanStatus','alasanOff','foto','wfhDays','cuti'];
const str=x=>T(x).slice(0,500);
const person=p=>{
 const n=str(p.n||p.nama||p.name);if(!n)return null;
 const q={n};
 const map={nk:['nk','namaPanggilan'],nl:['nl','namaLengkap'],nip:['nip','nip18'],jab:['jab','jabatan','job'],org:['org','organisasi'],pang:['pang','pangkat'],unitAsal:['unitAsal','unit'],emailK:['emailK','emailKemenkeu','email'],emailP:['emailP','emailPribadi'],hp:['hp','noHp'],peran:['peran','role'],rangkap:['rangkap'],penugasan:['penugasan'],penMulai:['penMulai','penugasanMulai'],penSelesai:['penSelesai','penugasanSelesai'],jenis:['jenis'],jenisSementara:['jenisSementara'],keahlian:['keahlian'],status:['status'],statusKerja:['statusKerja'],statusMulai:['statusMulai'],statusSelesai:['statusSelesai'],jenisCuti:['jenisCuti'],catatanStatus:['catatanStatus'],alasanOff:['alasanOff']};
 for(const [key,aliases] of Object.entries(map)){
  const v=aliases.map(k=>p[k]).find(x=>x!==null&&x!==undefined&&x!=='');
  if(v!==undefined)q[key]=key==='keahlian'&&Array.isArray(v)?v.join(', '):str(v);
 }
 q.nip=N(q.nip);q.foto=goodPhoto(p.foto||p.photo||p.avatar);
 if(Array.isArray(p.wfhDays))q.wfhDays=p.wfhDays.filter(x=>Number.isInteger(+x)&&+x>=0&&+x<=6).map(Number);
 if(Array.isArray(p.cuti||p.rencanaCuti))q.cuti=(p.cuti||p.rencanaCuti).filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(T(x.mulai))).map(x=>({mulai:T(x.mulai),selesai:T(x.selesai||x.mulai),jenis:str(x.jenis),catatan:str(x.catatan)}));
 return q;
};
function parse(j){
 if(!j||typeof j!=='object')throw Error('File bukan JSON backup yang valid.');
 const containers=[j,j.state,j.data,j.payload,j.backup,j.dashboard,j.mtState].filter(x=>x&&typeof x==='object');
 let arr=[],docs=[];
 for(const c of containers){
  if(!arr.length)for(const k of ['oneonone','records','resources','pegawai','people','profiles','members'])if(Array.isArray(c[k])&&c[k].length){arr=c[k];break}
  if(!docs.length)for(const k of ['docs','oneonone'])if(Array.isArray(c[k])&&c[k].some(x=>x&&x.id==='cfg-master')){docs=c[k];break}
 }
 if(Array.isArray(j))arr=j;
 if(docs.length){const master=docs.find(x=>x.id==='cfg-master');if(Array.isArray(master?.master?.pic))arr=master.master.pic;}
 if(arr.length&&arr.some(x=>x?.id==='cfg-master')){docs=arr;arr=arr.find(x=>x.id==='cfg-master')?.master?.pic||[]}
 if(!Array.isArray(arr)||!arr.length)throw Error('Profil tidak ditemukan. Ekspor JSON yang memuat cfg-master → master.pic atau daftar pegawai.');
 if(arr.length>600)throw Error('Maksimal 600 profil per impor.');
 const seen=new Set(),profiles=[];for(const raw of arr){
  if(!raw||typeof raw!=='object')continue;
  const p=person(raw);if(!p)continue;
  const key=p.nip?'nip:'+p.nip:'nama:'+F(p.n);if(seen.has(key))continue;seen.add(key);profiles.push(p);
 }
 if(!profiles.length)throw Error('Tidak ada profil pegawai yang dapat dibaca.');
 const kp=docs.find(x=>x.id==='cfg-kp')?.kp||null;
 const contacts=docs.filter(x=>/^cfg-kp-/.test(x.id||'')&&x.kp).map(x=>({...x.kp,_id:x.id}));
 return {profiles,kp,contacts};
}
/* Safe identity check: NIP wins; exact full names without conflicting NIPs
 * can be merged; partial/fuzzy matches always require a human choice. */
const normName=x=>T(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/\b(?:bapak|ibu|pak|bu|mbak|mba|mas|sdr|sdri)\b/g,' ')
 .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const names=o=>[o.n,o.nl,o.nk&&T(o.nk).includes(' ')?o.nk:''].map(normName).filter(Boolean);
const personKey=o=>N(o.nip)?'nip:'+N(o.nip):'nama:'+normName(o.n);
const personUnique=people=>{
 const map=new Map();for(let i=0;i<people.length;i++){const key=personKey(people[i]);map.set(key,(map.get(key)||[]).concat(i))}
 return map;
};
const distance=(a,b)=>{
 if(a===b)return 0;
 if(Math.abs(a.length-b.length)>5)return 100;
 const line=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){let prev=line[0];line[0]=i;
  for(let j=1;j<=b.length;j++){const old=line[j];line[j]=Math.min(line[j]+1,line[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old}
 }
 return line[b.length];
};
function similar(a,b){
 const x=normName(a),y=normName(b);if(!x||!y)return false;
 if(x===y)return true;
 const ta=x.split(' ').filter(z=>z.length>=3),tb=y.split(' ').filter(z=>z.length>=3);
 const same=ta.filter(t=>tb.includes(t)).length;
 if(ta.length>=2&&tb.length>=2&&same>=2)return true;
 if(ta.length>=2&&tb.length>=2&&ta[0]===tb[0]&&same>=1)return true;
 if(ta.length>=2&&tb.length>=2&&ta.at(-1)===tb.at(-1)&&distance(ta[0],tb[0])<=2)return true;
 if(x.length>=9&&y.length>=9&&distance(x,y)<=Math.max(2,Math.floor(Math.min(x.length,y.length)*.13)))return true;
 if(Math.min(x.length,y.length)>=8&&(x.startsWith(y+' ')||y.startsWith(x+' ')))return true;
 return false;
}
function analyze(p,roster){
 const n=N(p.nip),canonical=normName(p.n),all=names(p);
 const exactNip=n?roster.map((x,i)=>N(x.nip)===n?i:-1).filter(i=>i>=0):[];
 if(exactNip.length===1){
  const idx=exactNip[0],target=roster[idx];
  const plausible=names(target).some(name=>all.some(v=>similar(v,name)));
  return plausible?{kind:'update',index:idx,reason:'NIP sama',candidates:[idx]}:
   {kind:'review',reason:'NIP sama, tetapi nama berbeda. Verifikasi pegawai.',candidates:[idx]};
 }
 if(exactNip.length>1)return {kind:'review',reason:'NIP ditemukan pada lebih dari satu profil',candidates:exactNip};
 const sameName=roster.map((x,i)=>names(x).some(z=>all.includes(z))?i:-1).filter(i=>i>=0);
 const conflict=sameName.filter(i=>n&&N(roster[i].nip)&&N(roster[i].nip)!==n);
 if(conflict.length)return {kind:'conflict',reason:'Nama sama tetapi NIP berbeda: jangan timpa sebelum data diperbaiki',candidates:sameName};
 if(sameName.length===1)return {kind:'update',index:sameName[0],reason:'Nama lengkap sama',candidates:sameName};
 if(sameName.length>1)return {kind:'review',reason:'Nama cocok pada beberapa pegawai',candidates:sameName};
 const close=roster.map((x,i)=>names(x).some(z=>all.some(v=>similar(v,z)))?i:-1).filter(i=>i>=0);
 if(close.length)return {kind:'review',reason:'Nama mirip / kemungkinan orang yang sama',candidates:close};
 return {kind:'new',reason:'Belum ditemukan pada daftar pegawai',candidates:[]};
}
function match(p,roster){const a=analyze(p,roster);return a.kind==='update'?roster[a.index]:null}
const isEmpty=x=>x==null||x===''||Array.isArray(x)&&!x.length;
const copied=x=>JSON.parse(JSON.stringify(x));
function merged(dst,src,allowed){
 for(const key of allowed){
  const value=src[key];
  if(!isEmpty(value)&&isEmpty(dst[key]))dst[key]=copied(value);
 }
 return dst;
}
function keepUniqueValues(a,b){return [...new Set([...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])])]}
function prepare(parsed,choices,live,docs,ui,includeStructure,options={}){
 const draft=copied(docs),master=draft.find(x=>x.id==='cfg-master');
 if(!master||!master.master||!Array.isArray(master.master.pic))throw Error('Master pegawai belum siap. Muat ulang halaman terlebih dahulu.');
 const roster=master.master.pic,used=new Set(),mapped=new Map();
 const rosterIdentity=list=>JSON.stringify(list.map(x=>[normName(x.n),N(x.nip),normName(x.nl)]));
 if(options.allowSnapshotRoster){
  if(options.baselineRoster && JSON.stringify(live)!==options.baselineRoster)throw Error('Data pegawai berubah setelah pratinjau. Pilih ulang sebelum simpan.');
  master.master.pic=copied(live);
 }else if(rosterIdentity(roster)!==rosterIdentity(live))throw Error('Daftar pegawai telah berubah sejak pratinjau. Buka kembali impor dan tinjau pencocokan.');
 const targetRoster=master.master.pic;

 const summary={updated:0,new:0,skipped:0,photosAdded:0,contactsAdded:0,contactsUpdated:0,contactsSkipped:0,conflicts:0};
 const selected=[];
 for(let i=0;i<parsed.profiles.length;i++){
  const source=parsed.profiles[i],choice=choices[i]||'skip',state=analyze(source,targetRoster);
  if(choice==='skip'){summary.skipped++;continue}
  let target=null;
  if(choice==='add'){
   if(state.kind!=='new')throw Error('Profil '+source.n+' mungkin sudah ada. Tidak boleh membuat duplikat; tinjau pencocokannya.');
   if(targetRoster.some(x=>personKey(x)===personKey(source)||normName(x.n)===normName(source.n)))
    throw Error('Pegawai '+source.n+' sudah ada dalam daftar tujuan.');
   target={n:source.n};targetRoster.push(target);summary.new++;
  }else if(/^existing:\d+$/.test(choice)){
   const idx=+choice.slice('existing:'.length),existing=targetRoster[idx];
   if(!existing||idx>=live.length)throw Error('Tujuan '+source.n+' berubah; ulangi pratinjau.');
   if(state.kind==='conflict')throw Error('NIP berbeda untuk '+source.n+'. Perbaiki identitas sebelum impor.');
   const allowed=new Set(state.candidates);
   const manual=options.manualTargets?.[i]===idx;
   if(!allowed.has(idx)&&!manual)throw Error('Pemetaan '+source.n+' tidak lagi valid.');
   if(state.kind==='conflict')throw Error('NIP berbeda untuk '+source.n+'. Perbaiki identitas.');
   if(N(source.nip)&&N(existing.nip)&&N(source.nip)!==N(existing.nip))
    throw Error('NIP sumber berbeda dengan tujuan untuk '+source.n+'.');
   target=existing;summary.updated++;
  }else throw Error('Pilihan impor tidak dikenal.');
  const targetKey=targetRoster.indexOf(target);
  if(used.has(targetKey))throw Error('Lebih dari satu baris mengarah ke '+target.n+'. Pilih satu saja agar tidak terjadi duplikasi.');
  used.add(targetKey);
  const before=!!target.foto,beforeFoto=target.foto;
  const fieldDecision=options.fieldChoices?.[i];
  if(fieldDecision){
   for(const key of fields){
    if(fieldDecision[key]!=='mt')continue;
    const value=source[key];
    if(isEmpty(value))continue;
    if(key==='nip'&&N(target.nip)&&N(target.nip)!==N(value))throw Error('NIP berbeda untuk '+source.n+'. Tidak dapat ditimpa.');
    target[key]=copied(value);
   }
  }else merged(target,source,fields);
  if(!before&&target.foto)summary.photosAdded++;
  if(before&&fieldDecision?.foto==='mt'&&source.foto&&target.foto!==beforeFoto)summary.photosReplaced=(summary.photosReplaced||0)+1;
  if(fieldDecision)summary.fieldsFromMT=(summary.fieldsFromMT||0)+Object.entries(fieldDecision).filter(([key,v])=>v==='mt'&&fields.includes(key)&&!isEmpty(source[key])).length;
  mapped.set(normName(source.n),target.n);
  selected.push({source,target});
 }
 if(!selected.length&&!includeStructure)throw Error('Tidak ada profil dipilih untuk diperbarui atau ditambahkan.');
 if(includeStructure){
  let config=draft.find(x=>x.id==='cfg-kp');
  if(!config){config={id:'cfg-kp',kind:'cfg',tahun:0,tw:0,kp:{}};draft.push(config)}
  const dest=config.kp||{},src=parsed.kp||{};
  dest.tims=keepUniqueValues(dest.tims,src.tims);
  const lookup=name=>mapped.get(normName(name))||'';
  if(!options.structureChoices){
  for(const key of ['pt','ptx','rl']){
   dest[key]=dest[key]||{};
   for(const [sourceName,value] of Object.entries(src[key]||{})){
    const name=lookup(sourceName);if(!name)continue;
    if(key==='pt'&&!dest[key][name])dest[key][name]=value;
    if(key==='ptx')dest[key][name]=keepUniqueValues(dest[key][name],value);
    if(key==='rl'&&!dest[key][name])dest[key][name]=copied(value);
   }
  }
  dest.str=dest.str||{};
  for(const [slot,sourceName] of Object.entries(src.str||{})){const n=lookup(sourceName);if(n&&!dest.str[slot])dest.str[slot]=n}
  for(const key of ['stp','asg']){
   dest[key]=dest[key]||{};
   for(const [slot,list] of Object.entries(src[key]||{})){
    const members=(Array.isArray(list)?list:[]).map(lookup).filter(Boolean);
    if(members.length)dest[key][slot]=keepUniqueValues(dest[key][slot],members);
   }
  }
  for(const key of ['prog','tem'])dest[key]={...(src[key]||{}),...(dest[key]||{})};
  }else{
   for(const [idx,row] of selected.entries()){
    const realIndex=parsed.profiles.indexOf(row.source);
    const dec=options.structureChoices[realIndex]||{};
    if(dec.pt==='mt'){
     const value=src.pt?.[row.source.n];if(value)dest.pt[row.target.n]=value;
    }
    if(dec.ptx==='mt'){
     const value=src.ptx?.[row.source.n];if(Array.isArray(value)){dest.ptx=dest.ptx||{};dest.ptx[row.target.n]=copied(value)}
    }
    if(dec.asg==='mt'){
     const units=Object.entries(src.asg||{}).filter(([u,people])=>Array.isArray(people)&&people.includes(row.source.n)).map(([u])=>u);
     dest.asg=dest.asg||{};
     for(const list of Object.values(dest.asg))if(Array.isArray(list)){const k=list.indexOf(row.target.n);if(k>=0)list.splice(k,1)}
     for(const u of units)dest.asg[u]=keepUniqueValues(dest.asg[u],[row.target.n]);
    }
   }
  }
  config.kp=dest;
  const contacts=draft.filter(x=>/^cfg-kp-/.test(x.id||'')&&x.kp);
  for(const raw of (options.structureChoices&&!options.importContacts?[]:parsed.contacts)){
   const c=copied(raw);delete c._id;
   const name=T(c.nama),unit=normName(c.unit),id=N(c.nip);
   if(!name||!unit){summary.contactsSkipped++;continue}
   const same=contacts.filter(x=>normName(x.kp.unit)===unit&&
     (id&&N(x.kp.nip)===id||normName(x.kp.nama)===normName(name)));
   if(same.length>1||same.some(x=>id&&N(x.kp.nip)&&N(x.kp.nip)!==id)){summary.contactsSkipped++;continue}
   const near=contacts.filter(x=>normName(x.kp.unit)===unit&&similar(x.kp.nama,name));
   if(!same.length&&near.length){summary.contactsSkipped++;continue}
   if(same.length){
    merged(same[0].kp,c,['nip','jabatan','pangkat','email','hp','foto','ket','sheet']);
    same[0].kp.peran=keepUniqueValues(same[0].kp.peran,c.peran);
    summary.contactsUpdated++;continue;
   }
   const docId='cfg-kp-DCM49-'+String(contacts.length).padStart(3,'0')+'-'+Math.random().toString(36).slice(2,8);
   const doc={id:docId,kind:'cfg',tahun:0,tw:0,kp:c};
   draft.push(doc);contacts.push(doc);summary.contactsAdded++;
  }
 }
 const exportDocs=draft.filter(d=>d&&d.id&&/^(cfg-master|cfg-kp|cfg-tim|cfg-agpim|cfg-kp-[\w-]+|pub-tim)$/.test(d.id));
 const raw=JSON.stringify({docs:exportDocs,ui:ui||{}});
 if(raw.length>800000)throw Error('Data melewati batas simpan ('+Math.round(raw.length/1024)+' KB). Kurangi jumlah foto atau impor sebagian.');
 return {docs:exportDocs,summary,selected};
}
function compactPhoto(url){
 return new Promise(resolve=>{
  if(!url||!url.startsWith('data:image/'))return resolve(url);
  const img=new Image();img.onerror=()=>resolve(url);
  img.onload=()=>{
   try{const scale=Math.min(1,160/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const out=c.toDataURL('image/jpeg',0.76);resolve(out.length<url.length?out:url)
   }catch(e){resolve(url)}
  };img.src=url;
 });
}
function open(){
 if(!w.actCanEdit())return w.toast('Hak akses impor tidak tersedia.');
 const wrap=document.createElement('div');wrap.className='ov';wrap.style.zIndex='10000';
 wrap.innerHTML='<div class="md" style="width:min(960px,96vw);max-height:92vh;display:flex;flex-direction:column">'+
  '<h3>Impor Profil & Foto · Modul Transformasi</h3>'+
  '<div class="bd" style="overflow:auto;flex:1"><p class="t-xs" style="margin:0 0 8px">NIP diperiksa lebih dulu, kemudian nama lengkap. Nama mirip tidak digabung otomatis; pegawai baru juga tidak ditambahkan otomatis. Data profil lama tetap dipertahankan.</p>'+
  '<input id="mt-profile-file" type="file" accept=".json,application/json">'+
  '<div id="mt-profile-result" style="margin-top:10px">Belum ada file dipilih.</div></div>'+
  '<div class="ft"><button class="btn" id="mt-profile-close">Batal</button><button class="btn pri" id="mt-profile-save" disabled>Tinjau sebelum simpan</button></div></div>';
 document.body.appendChild(wrap);
 const $=s=>wrap.querySelector(s),area=$('#mt-profile-result'),button=$('#mt-profile-save');
 const close=()=>wrap.remove();
 $('#mt-profile-close').onclick=close;wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
 const getChoices=()=>Object.fromEntries([...wrap.querySelectorAll('[data-choice]')].map(x=>[+x.dataset.choice,x.value]));
 function refreshCounts(){
  const inputs=[...wrap.querySelectorAll('[data-choice]')],c={update:0,add:0,skip:0};
  for(const x of inputs){if(x.value==='add')c.add++;else if(x.value.startsWith('existing:'))c.update++;else c.skip++}
  const label=$('#mt-profile-counts');if(label)label.textContent=c.update+' lengkapi · '+c.add+' baru · '+c.skip+' dilewati';
  button.disabled=!(c.update+c.add);
 }
 function preview(data){
  const roster=w.actMaster().pic,counts={update:0,review:0,new:0,conflict:0},rows=[];
  data.profiles.forEach((p,i)=>{
   const a=analyze(p,roster);counts[a.kind]++;
   const options=['<option value="skip">Lewati / jangan ubah</option>'];
   if(a.kind==='update'||a.kind==='review'){
    for(const idx of a.candidates){const x=roster[idx];if(!x)continue;
     options.push('<option value="existing:'+idx+'" '+(a.kind==='update'&&idx===a.index?'selected':'')+'>Lengkapi: '+w.esc(x.n)+(x.nip?' · '+w.esc(x.nip):'')+'</option>');
    }
   }
   if(a.kind==='new')options.push('<option value="add">Tambah sebagai pegawai baru (manual)</option>');
   const status={update:'Cocok',review:'Perlu verifikasi',conflict:'Konflik NIP',new:'Belum terdaftar'}[a.kind];
   const style=a.kind==='update'?'color:#116b4b':a.kind==='new'?'color:#52657d':'color:#a16000';
   rows.push('<tr><td style="white-space:nowrap"><strong>'+w.esc(p.n)+'</strong><div class="t-xs">'+w.esc(p.nip||'NIP kosong')+'</div></td>'+
    '<td class="t-xs">'+w.esc(p.jab||'—')+'</td>'+
    '<td>'+(p.foto?'<img src="'+w.esc(p.foto)+'" alt="" style="width:34px;height:34px;object-fit:cover;border-radius:50%">':'—')+'</td>'+
    '<td style="'+style+'"><b>'+status+'</b><div class="t-xs">'+w.esc(a.reason)+'</div></td>'+
    '<td><select class="inp" data-choice="'+i+'" style="width:100%;max-width:100%;font-size:12px;padding:6px 8px" '+(a.kind==='conflict'?'disabled':'')+'>'+options.join('')+'</select></td></tr>');
  });
  const hasStructure=!!(data.kp||data.contacts.length);
  area.innerHTML='<div class="t-strip" style="margin-bottom:7px;display:flex;gap:8px;flex-wrap:wrap">'+
   data.profiles.length+' profil · '+counts.update+' cocok · '+counts.review+' perlu verifikasi · '+counts.new+' belum terdaftar · '+counts.conflict+' konflik NIP</div>'+
   '<div id="mt-profile-counts" class="t-xs" style="padding:7px 9px;background:#f4f7fb;margin-bottom:8px"></div>'+
   '<div style="overflow:auto;max-height:44vh"><table class="t-table" style="width:100%;table-layout:fixed"><colgroup><col style="width:24%"><col style="width:20%"><col style="width:7%"><col style="width:19%"><col style="width:30%"></colgroup>'+
   '<thead><tr><th>Nama / NIP</th><th>Jabatan</th><th>Foto</th><th>Pencocokan</th><th>Tindakan impor</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'+
   '<label class="t-xs" style="display:flex;gap:7px;align-items:center;margin-top:9px"><input type="checkbox" id="mt-profile-structure" '+(hasStructure?'':'disabled')+'> Sertakan susunan tim, penugasan unit dan kontak '+(hasStructure?'(opsional)':'(tidak ada di file)')+'</label>'+
   '<p class="t-xs" style="margin:8px 0 0">Baris <b>Perlu verifikasi</b> dan <b>Belum terdaftar</b> dilewati sampai Anda memilih tindakannya. Konflik NIP tidak dapat disimpan sebelum datanya diperbaiki.</p>';
  wrap.querySelectorAll('[data-choice]').forEach(x=>x.onchange=refreshCounts);refreshCounts();
 }
 $('#mt-profile-file').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  wrap._parsed=null;button.disabled=true;area.textContent='Membaca file…';
  try{
   if(f.size>15*1024*1024)throw Error('File terlalu besar (maks. 15 MB).');
   const parsed=parse(JSON.parse(await f.text()));
   wrap._parsed=parsed;preview(parsed);
  }catch(err){area.textContent='Tidak dapat membaca file: '+(err.message||err)}
 };
 const startReview=async()=>{
  if(!wrap._parsed)return;
  const back=$('#mt-profile-back'),review=$('#mt-profile-review');
  if(review){review.remove();if(back)back.remove();button.textContent='Tinjau sebelum simpan';refreshCounts();return}
  try{
   const choices=getChoices(),includeStructure=!!$('#mt-profile-structure')?.checked;
   let working=copied(wrap._parsed);
   const toCompact=Object.entries(choices).filter(([i,v])=>v!=='skip').map(([i])=>+i);
   button.disabled=true;button.textContent='Memeriksa foto…';
   for(const i of toCompact){const p=working.profiles[i];if(p.foto)p.foto=await compactPhoto(p.foto)}
   const prepared=prepare(working,choices,w.actMaster().pic,w.S.oneonone,w.S.ui,includeStructure);
   const c=prepared.summary;
   const summary=document.createElement('div');summary.id='mt-profile-review';
   summary.style.cssText='border:1px solid #dce5f2;background:#f7f9fd;padding:11px 13px;border-radius:10px;margin-top:10px;font-size:12px;line-height:1.6';
   summary.innerHTML='<b>Konfirmasi perubahan</b><div>'+c.updated+' profil dilengkapi · '+c.new+' pegawai baru · '+c.skipped+' dilewati · '+c.photosAdded+' foto baru</div>'+
    '<div>'+c.contactsUpdated+' kontak dilengkapi · '+c.contactsAdded+' kontak baru · '+c.contactsSkipped+' kontak ditahan</div>'+
    '<div class="t-xs">Data lama yang terisi tetap. File diproses di perangkat ini. Penyimpanan ke Firebase dilakukan setelah konfirmasi.</div>';
   area.appendChild(summary);
   const b=document.createElement('button');b.id='mt-profile-back';b.className='btn';b.textContent='Kembali';b.onclick=()=>{summary.remove();b.remove();button.textContent='Tinjau sebelum simpan';button.disabled=false;button.onclick=startReview};
   button.parentElement.insertBefore(b,button);
   button.textContent='Konfirmasi dan simpan';
   button.disabled=false;
   button.onclick=async()=>{
    button.disabled=true;button.textContent='Menyimpan…';
    try{
     if(!w.actCanEdit())throw Error('Sesi izin edit sudah berubah.');
     const now=prepare(working,choices,w.actMaster().pic,w.S.oneonone,w.S.ui,includeStructure);
     if(JSON.stringify(now.summary)!==JSON.stringify(prepared.summary))throw Error('Data tujuan berubah. Ulangi pratinjau.');
     if(typeof w.mtImportCommit!=='function')throw Error('Sinkronisasi Firebase belum siap. Muat ulang halaman.');
     await w.mtImportCommit(now.docs);
     w.toast('Impor berhasil tersimpan: '+c.updated+' profil dilengkapi, '+c.new+' pegawai baru, '+c.photosAdded+' foto ditambahkan.');
     close();
    }catch(err){button.disabled=false;button.textContent='Coba simpan lagi';w.toast('Impor belum tersimpan: '+(err.message||err))}
   };
  }catch(err){button.disabled=false;button.textContent='Tinjau sebelum simpan';w.toast('Impor dibatalkan: '+(err.message||err))}
 };
 button.onclick=startReview;
}
w.MT_PROFILE_IMPORT={open,parse,match,analyze,prepare};
})(window);
