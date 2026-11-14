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
function match(p,roster){
 const a=p.nip?roster.filter(x=>N(x.nip)===p.nip):[];
 if(a.length===1)return a[0];
 if(a.length>1)return null;
 const b=roster.filter(x=>F(x.n)===F(p.n)||x.nl&&F(x.nl)===F(p.n));
 return b.length===1?b[0]:null;
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
 if(!w.actCanEdit())return w.toast('Anda tidak memiliki hak akses impor.');
 const wrap=document.createElement('div');wrap.className='ov';wrap.style.zIndex='10000';
 wrap.innerHTML='<div class="md" style="width:min(930px,96vw);max-height:92vh;display:flex;flex-direction:column"><h3>Impor Profil & Foto · Modul Transformasi</h3><div class="bd" style="overflow:auto;flex:1"><p class="t-xs">Pilih hasil ekspor JSON dari Modul Transformasi. Profil dicocokkan berdasarkan NIP, lalu nama. Kolom kosong tidak menimpa data lama. File hanya diproses di browser, bukan diunggah ke server lain.</p><input id="mt-profile-file" type="file" accept=".json,application/json"><div id="mt-profile-result" style="margin-top:12px">Belum ada file dipilih.</div></div><div class="ft"><button class="btn" id="mt-profile-close">Batal</button><button class="btn pri" id="mt-profile-save" disabled>Impor terpilih</button></div></div>';
 document.body.appendChild(wrap);
 const $=s=>wrap.querySelector(s),close=()=>wrap.remove(),area=$('#mt-profile-result');
 $('#mt-profile-close').onclick=close;
 wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
 $('#mt-profile-file').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  wrap._parsed=null;$('#mt-profile-save').disabled=true;area.textContent='Membaca file…';
  try{
   if(f.size>15*1024*1024)throw Error('File melebihi 15 MB.');
   const data=parse(JSON.parse(await f.text()));wrap._parsed=data;
   const M=w.actMaster();let update=0,add=0,photos=0;
   const rows=data.profiles.map((p,i)=>{
    const old=match(p,M.pic),nm=w.esc(p.n),nip=w.esc(p.nip||'-');
    if(old)update++;else add++;if(p.foto)photos++;
    return '<tr><td><input type="checkbox" data-row="'+i+'" checked></td><td><b>'+nm+'</b><div class="t-xs">'+nip+'</div></td><td>'+w.esc(p.jab||'-')+'</td><td>'+(p.foto?'<img src="'+w.esc(p.foto)+'" alt="" style="width:34px;height:34px;object-fit:cover;border-radius:50%">':'—')+'</td><td>'+(old?'Lengkapi '+w.esc(old.n):'Pegawai baru')+'</td></tr>';
   }).join('');
   area.innerHTML='<div class="t-strip" style="margin-bottom:8px">'+data.profiles.length+' profil ditemukan · '+update+' cocok · '+add+' baru · '+photos+' foto</div><label class="t-xs"><input type="checkbox" id="mt-profile-all" checked> Pilih semua</label><div style="overflow:auto;max-height:45vh;margin-top:8px"><table class="t-table" style="width:100%"><thead><tr><th>Pilih</th><th>Nama / NIP</th><th>Jabatan</th><th>Foto</th><th>Tujuan</th></tr></thead><tbody>'+rows+'</tbody></table></div><label class="t-xs" style="display:block;margin-top:9px"><input type="checkbox" id="mt-profile-structure"> Sertakan susunan tim, penugasan unit dan kontak (jika tersedia di backup)</label><p class="t-xs">Impor mengisi data yang belum ada. Data yang sudah terisi tidak dihapus atau diganti.</p>';
   $('#mt-profile-save').disabled=false;
   $('#mt-profile-all').onchange=ev=>wrap.querySelectorAll('[data-row]').forEach(x=>x.checked=ev.target.checked);
  }catch(err){area.textContent='Tidak dapat membaca file: '+(err.message||err)}
 };
 $('#mt-profile-save').onclick=async()=>{
  const parsed=wrap._parsed;if(!parsed)return;
  const selected=[...wrap.querySelectorAll('[data-row]:checked')].map(c=>parsed.profiles[+c.dataset.row]);
  if(!selected.length)return w.toast('Pilih minimal satu profil.');
  if(!confirm('Impor '+selected.length+' profil ke Dashboard CM? Data yang sudah terisi tetap dipertahankan.'))return;
  try{
   $('#mt-profile-save').disabled=true;
   for(const p of selected)if(p.foto)p.foto=await compactPhoto(p.foto);
   const M=w.actMaster();let add=0,update=0,photos=0;
   for(const p of selected){
    let target=match(p,M.pic);
    if(!target){target={n:p.n,jenis:'Definitif',status:'WFO',statusKerja:'WFO',wfhDays:[],cuti:[]};M.pic.push(target);add++}else update++;
    for(const key of fields){const v=p[key];if(v==null||v===''||Array.isArray(v)&&!v.length)continue;
     if(key==='foto')photos++;
     if(target[key]==null||target[key]===''||Array.isArray(target[key])&&!target[key].length)target[key]=v;
    }
   }
   if($('#mt-profile-structure')?.checked){
    const k=w.kpCfg(),src=parsed.kp;
    if(src){for(const key of ['pt','ptx','str','stp','asg','rl','prog','tem'])if(src[key]&&typeof src[key]==='object')k[key]={...src[key],...(k[key]||{})};if(Array.isArray(src.tims))k.tims=[...new Set([...k.tims,...src.tims])];}
    for(const p of parsed.contacts){if(!p.nama)continue;const same=w.kpPeople().find(x=>N(x.nip)&&N(x.nip)===N(p.nip)&&F(x.unit)===F(p.unit)||F(x.nama)===F(p.nama)&&F(x.unit)===F(p.unit));if(!same)w.kpPersonSave(p)}
   }
   const predictedDocs=w.S.oneonone.filter(d=>d&&d.id&&/^(cfg-master|cfg-kp|cfg-tim|cfg-agpim|cfg-kp-[\\w-]+|pub-tim)$/.test(d.id));
   const predicted=JSON.stringify({docs:predictedDocs,ui:w.S.ui});
   if(predicted.length>800000)throw Error('Foto terlalu besar untuk penyimpanan bersama ('+Math.round(predicted.length/1024)+' KB). Pilih lebih sedikit pegawai per impor atau perkecil foto.');
   w.actMasterSave(M);w.render();w.toast('Impor diproses: '+add+' baru, '+update+' dilengkapi, '+photos+' foto tersedia. Periksa data setelah sinkronisasi.');
   close();
  }catch(err){$('#mt-profile-save').disabled=false;w.toast('Gagal impor: '+(err.message||err))}
 };
}
w.MT_PROFILE_IMPORT={open,parse,match};
})(window);
