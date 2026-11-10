/* Dashboard CM — ekspor portabel aktivitas & berkas Firestore.
   Hanya tersedia melalui Settings Superadmin, tanpa mengubah berkas sumber. */
async function cmExportMtBundle(){
  if(typeof cmCanManageReferences!=='function'||!cmCanManageReferences())throw Error('Hanya Superadmin yang boleh mengekspor paket migrasi.');
  if(!window.fbDb||!window.fbDoc||!window.fbGetDoc||!window.JSZip)throw Error('Firebase atau JSZip belum siap.');
  const el=document.getElementById('cmMtExportProgress');
  const status=t=>{if(el)el.textContent=t;};
  const agendas=(state.agendas||[]).map(a=>JSON.parse(JSON.stringify(a)));
  if(!agendas.length)throw Error('Data aktivitas kosong. Pastikan aktivitas telah dimuat.');
  const fields=['dokumentasi','notula','undanganFiles','suratTugasFiles','materiFiles'];
  const refs=new Map();
  const asList=v=>{if(Array.isArray(v))return v;if(typeof v==='string'){try{const a=JSON.parse(v);return Array.isArray(a)?a:[]}catch(e){return []}}return []};
  agendas.forEach(a=>fields.forEach(k=>asList(a[k]).forEach(m=>{
    if(m&&typeof m==='object'&&m.refId&&!refs.has(m.refId))refs.set(m.refId,{name:m.name||m.fileName||'Berkas',field:k});
  })));
  if(!confirm('Ekspor '+agendas.length+' aktivitas dan '+refs.size+' berkas dari Firestore ke ZIP privat? File dapat memuat informasi internal Kemenkeu.'))return;
  const zip=new JSZip(),result=[],items=[...refs.entries()];
  let done=0,ok=0,failed=0;
  const worker=async()=>{
    while(items.length){
      const [refId,meta]=items.shift();
      const record={refId,name:meta.name,field:meta.field};
      try{
        const snap=await window.fbGetDoc(window.fbDoc(window.fbDb,'dashboardImages',refId));
        if(!snap.exists())throw Error('Berkas tidak ditemukan');
        const d=snap.data()||{},url=String(d.dataUrl||'');
        const m=url.match(/^data:([^;,]+)(?:;[^,]*)?;base64,([\s\S]+)$/i);
        if(!m)throw Error('Isi berkas bukan Base64 yang valid');
        const encoded=m[2].replace(/\s/g,'');
        if(!/^[a-zA-Z0-9+/]*={0,2}$/.test(encoded))throw Error('Format Base64 tidak valid');
        record.path='files/'+encodeURIComponent(refId)+'.bin';
        record.mime=d.mime||m[1]||'application/octet-stream';
        record.name=d.name||record.name;
        zip.file(record.path,encoded,{base64:true,binary:true});
        ok++;
      }catch(e){record.error=e?.message||String(e);failed++;}
      result.push(record);done++;
      status('Mengambil berkas: '+done+'/'+refs.size+' · berhasil '+ok+' · gagal '+failed);
    }
  };
  status('Memulai ekspor '+refs.size+' referensi berkas...');
  await Promise.all(Array.from({length:Math.min(4,items.length||1)},()=>worker()));
  const manifest={kind:'cm-mt-activity-bundle',version:1,sourceProject:'dashboard-cm-bb716',
    createdAt:new Date().toISOString(),agendas,files:result,summary:{activities:agendas.length,references:refs.size,success:ok,failed}};
  zip.file('manifest.json',JSON.stringify(manifest));
  status('Menyusun ZIP: '+ok+' berkas berhasil...');
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download='CM_Activity_Migration_'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'.zip';
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  status('Selesai: '+agendas.length+' aktivitas, '+ok+' berkas berhasil, '+failed+' gagal. Simpan ZIP secara aman; periksa manifest.json untuk berkas gagal.');
}
function cmRenderApMigration(body){
  if(!cmCanManageReferences()){body.textContent='Akses Superadmin diperlukan.';return;}
  body.innerHTML='<div class="cm-ap-empty" style="text-align:left;align-items:stretch;gap:12px"><b>Migrasi Aktivitas ke Modul Transformasi</b>'+
    '<span>Ekspor seluruh aktivitas beserta foto, notula, surat tugas, undangan, dan materi yang tersimpan di koleksi Firestore dashboardImages. Tautan eksternal tetap dibawa sebagai tautan.</span>'+
    '<span>ZIP dibuat di browser setelah berkas dibaca menggunakan akun Firebase yang sedang login. Data sumber tidak diubah. Simpan ZIP di tempat aman karena berisi data internal.</span>'+
    '<div><button type="button" class="btn btn-sm cm-sr-btn-navy" id="cmMtExportBtn">⇩ Ekspor Paket Aktivitas + Lampiran (ZIP)</button></div>'+
    '<div id="cmMtExportProgress" role="status" style="font-size:12px;color:#334155">Belum dijalankan.</div></div>';
  const btn=body.querySelector('#cmMtExportBtn');
  btn.onclick=async()=>{btn.disabled=true;try{await cmExportMtBundle()}catch(e){body.querySelector('#cmMtExportProgress').textContent='Gagal: '+(e?.message||String(e))}finally{btn.disabled=false}};
}
