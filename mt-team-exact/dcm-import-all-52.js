/* Full MT source-data import for Dashboard CM Tim Pusmantap only. */
(function(w){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const teamId=id=>id==='cfg-master'||id==='cfg-kp'||id==='cfg-tim'||/^cfg-kp-[A-Za-z0-9_-]+$/.test(id);
function validate(parsed){
 const docs=parsed&&parsed.sourceDocs;
 if(!Array.isArray(docs))throw Error('Gunakan file Ekspor Profil & Foto (JSON) asli dari Modul Transformasi.');
 const source=docs.filter(d=>d&&typeof d.id==='string'&&teamId(d.id));
 const master=source.find(d=>d.id==='cfg-master'&&Array.isArray(d.master?.pic));
 const mapping=source.find(d=>d.id==='cfg-kp'&&d.kp);
 if(!master||!master.master.pic.length||!mapping)
  throw Error('File tidak berisi master profil dan pemetaan PMO/CMO/Pemilik Probis lengkap.');
 const ids=new Set(),names=new Set(),nips=new Set();
 for(const d of source){if(ids.has(d.id))throw Error('Dokumen ganda: '+d.id);ids.add(d.id)}
 for(const p of master.master.pic){
  const name=String(p?.n||'').trim().toLowerCase();
  if(!name||names.has(name))throw Error('Nama kosong atau ganda dalam profil Modul Transformasi.');
  names.add(name);
  const nip=String(p.nip||'').replace(/\D/g,'');
  if(nip&&nip.length===18){if(nips.has(nip))throw Error('NIP ganda dalam sumber: '+nip);nips.add(nip)}
 }
 return {source,master,mapping};
}
function resizePhoto(value,size=150,quality=.72){
 return new Promise(resolve=>{
  const v=String(value||'');
  if(!/^data:image\//i.test(v)||v.length<14000)return resolve(v);
  const img=new Image();
  img.onerror=()=>resolve(v);
  img.onload=()=>{
   try{
    const scale=Math.min(1,size/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.naturalWidth*scale));
    c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    const out=c.toDataURL('image/jpeg',quality);
    resolve(out.length<v.length?out:v);
   }catch(e){resolve(v)}
  };
  img.src=v;
 });
}
async function prepare(parsed,currentDocs,currentUI){
 const {source}=validate(parsed);
 const old=Array.isArray(currentDocs)?currentDocs:[];
 const base=old.filter(d=>!teamId(d.id)).map(clone);
 const fresh=clone(source);
 for(const d of fresh){
  if(d.id==='cfg-master'){for(const p of d.master.pic)if(p.foto)p.foto=await resizePhoto(p.foto)}
  else if(/^cfg-kp-/.test(d.id)&&d.kp?.foto){d.kp.foto=await resizePhoto(d.kp.foto)}
 }
 const docs=[...base,...fresh],ui={...(currentUI||{}),mtProfilesAuthoritative:true};
 const amount=()=>JSON.stringify({docs,ui}).length;
 if(amount()>795000){
  for(const d of fresh){
   if(d.id==='cfg-master'){for(const p of d.master.pic)if(p.foto)p.foto=await resizePhoto(p.foto,96,.56)}
   else if(/^cfg-kp-/.test(d.id)&&d.kp?.foto){d.kp.foto=await resizePhoto(d.kp.foto,96,.56)}
  }
 }
 if(amount()>795000)throw Error('File foto terlalu besar untuk penyimpanan Dashboard CM ('+Math.ceil(amount()/1024)+' KB). Data belum disimpan.');
 const master=fresh.find(d=>d.id==='cfg-master'),kp=fresh.find(d=>d.id==='cfg-kp').kp;
 return {docs,ui,summary:{
  profiles:master.master.pic.length,
  photos:master.master.pic.filter(x=>!!x.foto).length,
  contacts:fresh.filter(d=>/^cfg-kp-/.test(d.id)).length,
  contactPhotos:fresh.filter(d=>/^cfg-kp-/.test(d.id)&&!!d.kp?.foto).length,
  teams:Array.isArray(kp.tims)?kp.tims.length:0,
  unitAssignments:Object.keys(kp.asg||{}).length,
  previousProfiles:old.find(d=>d.id==='cfg-master')?.master?.pic?.length||0
 }};
}
w.MT_IMPORT_ALL={validate,prepare};
})(window);
