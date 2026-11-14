/* Modul Transformasi — curated Dashboard CM Backup All employee & Squad Team import.
 * Import never automatically copies every Squad Team member into Tim CM.
 * Team CM -> Pusmantap employee master; PMO/CMO unit & verified process owners -> unit contacts.
 * No sensitive unrelated fields from input backups are persisted. */
(function(root){
'use strict';
if(root.MT_DCM_SQUAD_IMPORT)return;
const LIMIT=2500;
const txt=x=>String(x==null?'':x).trim();
const fold=x=>txt(x).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=x=>txt(x).replace(/\s+/g,' ').slice(0,450);
const nip=x=>txt(x).replace(/\D/g,'').slice(0,20);
const workEmail=x=>/@kemenkeu\.go\.id$/i.test(txt(x))?txt(x).toLowerCase().slice(0,150):'';
const CANONICAL_UNITS=['Setjen','Itjen','BPPK','DJA','DJPb','DJPK','DJKN','DJPPR','DJP','DJBC','DJSEF','DJSPSK','BaTii','LNSW'];
function unitCode(value){
 const full=clean(value);
 for(const code of CANONICAL_UNITS.slice().sort((a,b)=>b.length-a.length)){
  const rx=new RegExp('(^|[^A-Za-z])'+code+'(?![A-Za-z])','i');
  if(rx.test(full))return code;
 }
 return full;
}
const ROLES={res:'Tim CM (Resource)',cm:'Tim CM (Squad)',pmo:'PIC PMO Unit',cmo:'PIC CMO Unit',probis:'Pemilik Proses Bisnis',candidate:'Kandidat Pemilik Probis'};
function classify(c){
 const squad=clean(c.squadTeam||c.squad||''),sheet=clean(c.sheet||'');
 const text=squad.toLowerCase(),rawRole=clean(c.peran||''),roleText=[squad,c.peran,c.jenisPeran].join(' ').toLowerCase();
 if(/koordinator pengelola perubahan tingkat eselon\s*i\b/.test(text))return {kind:'cmo',peran:'cmo',auto:true};
 if(/koordinator pengelola proyek tingkat eselon\s*i\b/.test(text))return {kind:'pmo',peran:'pmo',auto:true};
 if(/koordinator pengelola perubahan/.test(text)&&!/tingkat eselon/.test(text)&&(/^st cm$/i.test(sheet)||/change management|perubahan/.test(text)))return {kind:'cm',auto:true};
 if(/pemilik proses bisnis|pemilik probis|business process owner/.test(roleText))return {kind:'probis',peran:'probis',auto:true};
 if(/perbaikan proses bisnis|penyusun grand design/.test(text)&&/^(ketua|wakil ketua(?:\s*[ivx]+)?|k)$/i.test(rawRole))
   return {kind:'candidate',peran:'probis',auto:false};
 return null;
}
function identity(o){
 return nip(o.nip)?'nip:'+nip(o.nip):'nama:'+fold(o.n||o.nama);
}
function contactKey(o){
 return identity(o)+'|'+fold(o.unit);
}
function parseBackup(j){
 if(!j||typeof j!=='object')throw Error('File JSON tidak dikenali.');
 const resources=Array.isArray(j.resources)?j.resources:(Array.isArray(j)?j:[]);
 const contacts=Array.isArray(j.contacts)?j.contacts:[];
 const photos=j.contactPhotos&&typeof j.contactPhotos==='object'?j.contactPhotos:{};
 if(!resources.length&&!contacts.length)throw Error('Backup tidak memiliki resources Tim CM ataupun contacts Squad Team.');
 if(resources.length+contacts.length>LIMIT)throw Error('Daftar pegawai terlalu besar untuk sekali impor.');
 const entries=[],byMaster=new Map(),byContact=new Map(),excluded={other:0,invalid:0};
 function addMaster(row,kind,auto){
  const n=clean(row.nama||row.n);if(!n){excluded.invalid++;return}
  const v={n,nip:nip(row.nip),kind,auto,unit:'',peran:[],labels:[ROLES[kind]],
   squadRole:clean(row.peran),source:row,selected:auto};
  // Prefer NIP, but merge name duplicates where one source has no NIP.
  let existing=byMaster.get(identity(v))||byMaster.get('nama:'+fold(n));
  if(existing){
   existing.labels=[...new Set([...existing.labels,ROLES[kind]])];
   if(kind==='res'){existing.source=row;existing.kind='res';existing.auto=true;existing.selected=true;}
   if(!existing.nip&&v.nip)existing.nip=v.nip;
   return existing;
  }
  entries.push(v);
  byMaster.set(identity(v),v);byMaster.set('nama:'+fold(n),v);
  return v;
 }
 for(const r of resources)if(r&&typeof r==='object')addMaster(r,'res',true);
 for(const c of contacts){
  if(!c||typeof c!=='object'){excluded.invalid++;continue}
  const category=classify(c);
  if(!category){excluded.other++;continue}
  if(category.kind==='cm'){addMaster(c,'cm',true);continue}
  const n=clean(c.nama);const sourceUnit=clean(c.unitEselonI||c.unitKerja||c.unit),unit=unitCode(sourceUnit);
  if(!n||!unit||unit==='-'){excluded.invalid++;continue}
  const photo=typeof photos[c.fotoId]==='string'?photos[c.fotoId]:'';
  const v={n,nip:nip(c.nip),kind:category.kind,auto:category.auto,selected:category.auto,
    unit,sourceUnit,photo,peran:[category.peran],labels:[ROLES[category.kind]],
    squadRole:clean(c.peran),source:c};
  let prior=byContact.get(contactKey(v))||byContact.get('nama:'+fold(n)+'|'+fold(unit));
  if(prior){
   prior.peran=[...new Set([...prior.peran,...v.peran])];
   prior.labels=[...new Set([...prior.labels,ROLES[category.kind]])];
   prior.auto=prior.auto||v.auto;
   prior.selected=prior.selected||v.selected;
   if(prior.kind==='candidate'&&v.kind!=='candidate')prior.kind=v.kind;
   continue;
  }
  entries.push(v);
  byContact.set(contactKey(v),v);byContact.set('nama:'+fold(n)+'|'+fold(unit),v);
 }
 return {entries,excluded,resourcesCount:resources.length,contactsCount:contacts.length};
}
function matchingPerson(entry,people){
 const id=nip(entry.nip),name=fold(entry.n);
 const nipMatch=id?people.filter(p=>nip(p.nip)===id):[];
 if(nipMatch.length===1)return nipMatch[0];
 if(nipMatch.length>1)return null;
 const nameMatch=people.filter(p=>fold(p.n)===name);
 return nameMatch.length===1?nameMatch[0]:null;
}
function matchingContact(entry,people){
 const id=nip(entry.nip),name=fold(entry.n),unit=fold(unitCode(entry.unit));
 const cand=people.filter(p=>fold(unitCode(p.unit))===unit&&(id&&nip(p.nip)===id||fold(p.nama)===name));
 return cand.length===1?cand[0]:null;
}
function applySelection(selected,deps){
 const {actMaster,actMasterSave,kpCfg,kpPeople,kpPersonSave,mapRes}=deps;
 if(!selected.length)throw Error('Belum ada pegawai yang dipilih.');
 const M=actMaster(),k=kpCfg();const contacts=kpPeople(),cm=k.tims.find(t=>/(^|\s)CM(\s|$)/i.test(t))||'';
 const stats={profilesNew:0,profilesUpdated:0,contactsNew:0,contactsUpdated:0,skipped:0};
 // A single master record per person; external unit contacts do not become Tim CM staff.
 const chosenMaster=selected.filter(e=>e.kind==='res'||e.kind==='cm');
 chosenMaster.forEach(e=>{
   const original=e.kind==='res'?mapRes(e.source):{
    n:e.n,nip:e.nip,jab:clean(e.source.jabatan),unitAsal:clean(e.source.unitEselonI),
    peran:'',jenis:'Definitif',status:'WFO',statusKerja:'WFO',wfhDays:[],cuti:[],foto:e.photo||''
   };
   if(!clean(original.n)){stats.skipped++;return}
   const ex=matchingPerson(e,M.pic);
   if(ex){
     for(const [key,value] of Object.entries(original)){
       if(key==='n'||key==='nip'&&ex.nip||key==='peran'&&e.kind==='cm')continue;
       if(Array.isArray(value)?value.length:txt(value)) {
         // Resource is authoritative for active status and availability;
         // Squad Team only fills empty profile fields, preserving manual work.
         if(e.kind==='res'||!txt(ex[key]))ex[key]=value;
       }
     }
     stats.profilesUpdated++;
     if(cm&&!k.pt[ex.n])k.pt[ex.n]=cm;
   }else{
     M.pic.push(original);
     stats.profilesNew++;
     if(cm&&!k.pt[original.n])k.pt[original.n]=cm;
   }
 });
 const chosenContacts=selected.filter(e=>!['res','cm'].includes(e.kind));
 chosenContacts.forEach(e=>{
   const source=e.source,prior=matchingContact(e,contacts);
   const o={
    nama:e.n,nip:e.nip,unit:e.unit,peran:e.peran,
    jabatan:clean(source.jabatan),email:workEmail(source.email||source.emailKemenkeu),
    hp:clean(source.hp||source.noHp),pangkat:clean(source.pangkat),foto:e.photo||'',
    ket:'Sumber: Squad Team Dashboard CM · '+clean(source.squadTeam).slice(0,125)+' · Unit sumber: '+clean(e.sourceUnit||e.unit).slice(0,125)+
      (e.kind==='candidate'?' · Pemilik probis (dipilih setelah verifikasi)':'')
   };
   if(prior){
     // Per-role merge; one contact can be both PMO and CMO on the same unit.
     o._id=prior._id;
     o.peran=[...new Set([...(Array.isArray(prior.peran)?prior.peran:[]),...o.peran])];
     for(const key of ['jabatan','email','hp','pangkat','foto','ket'])if(!o[key]||prior[key])o[key]=prior[key]||o[key];
     o.nama=prior.nama;o.nip=prior.nip||o.nip;
     kpPersonSave(Object.assign({},prior,o));
     stats.contactsUpdated++;
   }else{
     const id=kpPersonSave(o);
     contacts.push({...o,_id:id});
     stats.contactsNew++;
   }
 });
 if(stats.profilesNew||stats.profilesUpdated)actMasterSave(M);
 if(stats.contactsNew||stats.contactsUpdated)deps.save();
 return stats;
}
function buildPreview(parsed,deps,ov){
 const entries=parsed.entries,summary=deps.H;
 const getExisting=()=>{try{return {profiles:deps.actMaster().pic,contacts:deps.kpPeople()}}catch(e){return {profiles:[],contacts:[]}}};
 const current=getExisting();
 const categories=['res','cm','pmo','cmo','probis','candidate'];
 const counter={};for(const k of categories)counter[k]=entries.filter(e=>e.kind===k).length;
 const chip=(key,label)=>'<span class="t-chip '+(key==='candidate'?'t-str':'t-pm')+'">'+summary(label)+': '+counter[key]+'</span>';
 const rows=entries.map((e,i)=>{
   const old=['res','cm'].includes(e.kind)?matchingPerson(e,current.profiles):matchingContact(e,current.contacts);
   const status=old?'Perbarui':'Baru';
   const warning=e.kind==='candidate'?'<small style="color:#91651d;display:block">Perlu verifikasi penanggung jawab probis</small>':'';
   return '<tr><td><input type="checkbox" data-dcm-eligible="'+i+'" '+(e.selected?'checked':'')+' aria-label="Impor '+summary(e.n)+'"></td>'+
    '<td><strong>'+summary(e.n)+'</strong>'+(e.nip?'<div class="t-xs t-muted">'+summary(e.nip)+'</div>':'')+'</td>'+
    '<td>'+summary(e.labels.join(', '))+warning+'</td>'+
    '<td class="t-xs">'+summary(e.unit||'Pusmantap')+(e.sourceUnit&&e.sourceUnit!==e.unit?'<small class="t-muted" style="display:block">'+summary(e.sourceUnit)+'</small>':'')+'</td>'+
    '<td class="t-xs">'+(['res','cm'].includes(e.kind)?'Profil Pusmantap · Tim CM':'Kontak unit · '+e.peran.map(x=>({pmo:'PMO',cmo:'CMO',probis:'Pemilik Probis'})[x]).join(' / '))+'</td>'+
    '<td><span class="t-chip '+(old?'t-pm':'t-gr')+'">'+status+'</span></td></tr>';
 }).join('');
 return '<div class="t2 t-dcm-import"><div class="t-strip" style="gap:6px;margin:4px 0 10px;flex-wrap:wrap">'+
 chip('res','Resource')+chip('cm','Squad Tim CM')+chip('pmo','PMO unit')+chip('cmo','CMO unit')+chip('probis','Pemilik Probis')+chip('candidate','Kandidat probis')+
 '</div><div class="t-xs t-muted" style="padding:8px 10px;background:#f5f7fc;border-left:3px solid #c9a443;border-radius:6px;margin-bottom:10px">'+
 'Hanya pegawai yang sesuai kriteria yang ditampilkan. <b>'+parsed.excluded.other+' anggota squad lainnya tidak diimpor</b>. '+
 'Kandidat pemilik probis dideteksi dari Ketua/Wakil squad proses bisnis; <b>tidak dipilih otomatis</b> karena bukan bukti penetapan pemilik probis.'+
 '</div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:8px">'+
 '<label style="font-size:12px"><input type="checkbox" id="t2-dcm-all"> Pilih semua termasuk kandidat yang sudah diverifikasi</label>'+
 '<span id="t2-dcm-selected" class="t-chip t-pm"></span></div>'+
 '<div class="t-impt" style="max-height:360px;overflow:auto"><table style="width:100%;min-width:860px"><thead><tr><th></th><th>Nama / NIP</th><th>Peran dari sumber</th><th>Unit sumber</th><th>Tujuan di modul</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
}
function open(deps){
 if(!deps||!deps.canEdit||!deps.canEdit())return;
 const ov=deps.modal('Impor Tim CM & PIC PMO/CMO/Pemilik Probis dari Dashboard CM',
 '<div class="t2 t-dcm-import"><p class="t-s" style="margin:0 0 8px">Di Dashboard CM pilih <b>Setting → Data & Backup → Backup</b> lalu unduh file <b>.json</b>. Impor akan membaca <b>Resource Tim CM</b> dan <b>Squad Team</b> sekaligus. Hanya Tim CM dan PIC PMO/CMO unit yang jelas dipilih otomatis; kandidat pemilik probis harus diverifikasi.</p>'+
 '<input type="file" id="t2-dcm-f" accept=".json,application/json" aria-label="Pilih backup JSON Dashboard CM">'+
 '<div id="t2-dcm-r" class="t-s" style="margin-top:9px" role="status">Belum ada file dipilih.</div></div>',
 'Impor terpilih',node=>{
   const parsed=node._parsed;
   if(!parsed){deps.toastT('Pilih backup JSON Dashboard CM terlebih dahulu.');return false}
   const picks=parsed.entries.filter(x=>x.selected);
   if(!picks.length){deps.toastT('Pilih minimal satu pegawai atau kontak.');return false}
   // Explicit confirmation prevents accidental import of incorrectly classified owners.
   if(!root.confirm('Impor '+picks.length+' baris pegawai/kontak dari Dashboard CM ke Modul Transformasi? Data yang sudah ada tidak dihapus.'))return false;
   try{
     const result=applySelection(picks,deps);
     deps.log?.('Impor Dashboard CM Tim CM & Squad Team',JSON.stringify(result));
     deps.toastT(result.profilesNew+' profil baru, '+result.profilesUpdated+' profil diperbarui; '+result.contactsNew+' kontak baru, '+result.contactsUpdated+' kontak dilengkapi.');
     deps.rr();
   }catch(e){deps.toastT('Gagal impor: '+(e.message||String(e)));return false}
 },{size:'lg'});
 const file=ov.querySelector('#t2-dcm-f'),status=ov.querySelector('#t2-dcm-r');
 function wire(){
  ov.querySelectorAll('[data-dcm-eligible]').forEach(c=>c.onchange=()=>{
    ov._parsed.entries[Number(c.dataset.dcmEligible)].selected=c.checked;
    refresh();
  });
  const all=ov.querySelector('#t2-dcm-all');if(all)all.onchange=()=>{
    ov._parsed.entries.forEach(x=>{x.selected=all.checked});
    ov.querySelectorAll('[data-dcm-eligible]').forEach(c=>{c.checked=all.checked});
    refresh();
  };
 }
 function refresh(){
  if(!ov._parsed)return;
  const s=ov.querySelector('#t2-dcm-selected');if(s)s.textContent=ov._parsed.entries.filter(x=>x.selected).length+' dipilih';
  const all=ov.querySelector('#t2-dcm-all');if(all)all.checked=ov._parsed.entries.every(x=>x.selected);
 }
 file.onchange=async ev=>{
  const f=ev.target.files?.[0];if(!f)return;
  status.textContent='Membaca dan memilah Resource Tim CM & Squad Team…';
  try{
   if(!/\.json$/i.test(f.name))throw Error('Gunakan file Backup All dengan ekstensi .json.');
   const raw=JSON.parse(await f.text());
   const parsed=parseBackup(raw);
   if(!parsed.entries.length)throw Error('Tidak ditemukan Resource Tim CM ataupun kontak Squad Team yang sesuai kriteria.');
   ov._parsed=parsed;
   status.innerHTML=buildPreview(parsed,deps,ov);
   wire();refresh();
  }catch(e){ov._parsed=null;status.textContent='Gagal membaca backup: '+(e.message||String(e))}
 };
 return ov;
}
root.MT_DCM_SQUAD_IMPORT={open,parseBackup,classify,unitCode,applySelection,matchingContact,matchingPerson};
})(window);
