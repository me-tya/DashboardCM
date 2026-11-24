/* Dashboard CM — read-only Detail Aktivitas, Opsi A (navy/gold). */
function cmDetailV2(a,id){
  const U=uiText,E=x=>escapeHtml(String(x??'')),modal=document.getElementById('detailModal');
  const cs=getCategoryStyle(a.kategori),ss=STATUS_STYLES[a.statusNorm]||STATUS_STYLES.Scheduled;
  const eo=cmIsEoEnabled(a.eoEnabled),can=cmCanMutate(),f=cmRptDocFlags(a);
  const docCount=CM_RPT_DOC_KEYS.filter(k=>f[k]).length,docPercent=Math.round(100*docCount/5);
  const val=x=>String(x??'').trim()||'-';
  const publicCode=cmActivityPublicCode(a);
  const kv=(label,value,raw=false)=>`<div class="cd-kv"><span>${E(label)}</span><div>${raw?value:E(val(value))}</div></div>`;
  const sec=(num,title,content)=>`<section class="cd-section"><div class="cd-section-title"><span class="cd-section-idx">${num}</span><b>${E(title)}</b></div><div class="cd-section-content">${content}</div></section>`;
  const docs=(key,label)=>{
    const rows=parseActivityFiles(a[key+'Files']).slice().reverse();
    const legacy=String(a[key+'Url']||'').trim(),num=String(a[key]||'').trim();
    if(legacy&&!rows.some(x=>x.url===legacy))rows.push({url:legacy,nomor:num,name:legacy,ket:'Data lama'});
    if(!rows.length)return `<div class="cd-doc-empty"><b>${E(label)}</b><span>${/^[-–—]$/.test(num)?U('Not required','Tidak ada / tidak diperlukan'):num?E(num):U('No document yet','Belum ada dokumen atau tautan')}</span></div>`;
    const one=(x,i)=>{
      const name=String(x.name||'').toLowerCase(),mime=String(x.mime||'').toLowerCase();
      const type=/\.pdf$/.test(name)||mime.includes('pdf')?'PDF':x.url&&!x.refId?'LINK':/\.(docx?|odt)$/.test(name)||mime.includes('word')?'DOC':/\.(xlsx?|csv)$/.test(name)?'XLS':'FILE';
      const at=String(x.tanggalSurat||x.at||'').trim(),dt=at&&dayjs(at.slice(0,10)).isValid()?dayjs(at.slice(0,10)).locale(currentLang).format('D MMM YYYY'):'—';
      const descr=String(x.hal||x.perihal||x.ket||'').trim(),rawurl=String(x.url||'').trim(),url=/^www\./i.test(rawurl)?'https://'+rawurl:rawurl,allowed=/^https?:\/\//i.test(url),ref=String(x.refId||'').trim();
      const att=allowed?`href="${E(url)}" target="_blank" rel="noopener noreferrer"`:ref?`href="#" data-generic-ref="${E(ref)}" data-name="${E(x.name||'file')}" data-mime="${E(x.mime||'application/octet-stream')}"`:'';
      const number=E(x.nomor||x.name||num||U('Open file','Buka berkas'));
      const action=att?`<a class="cd-doc-act" ${att} title="${U('Open or download','Buka atau unduh')}" aria-label="${U('Open or download','Buka atau unduh')}">${allowed?'↗':'↓'}</a>`:'';
      return `<div class="cd-doc-row"><span class="cd-doc-dot ${i===0?'current':''}"></span><span class="cd-doc-type ${type.toLowerCase()}">${type}</span><div class="cd-doc-main">${att?`<a class="cd-doc-link" ${att}>${number}</a>`:`<b>${number}</b>`}<small>v${rows.length-i}${i===0?' · '+U('Latest','Terbaru'):''}</small></div><span class="cd-doc-desc">${E(descr||'—')}</span><span class="cd-doc-date">${dt}</span><div class="cd-doc-actions">${action}</div></div>`;
    };
    return `<div class="cd-doc-group"><div class="cd-doc-group-title"><b>${E(label)}</b><small>${rows.length} ${U('versions','versi')}</small></div>${one(rows[0],0)}${rows.length>1?`<details class="cd-doc-history"><summary>${U('Previous versions','Versi sebelumnya')} (${rows.length-1})</summary>${rows.slice(1).map((x,i)=>one(x,i+1)).join('')}</details>`:''}</div>`;
  };
  const statusPanels=(!a.statusNeedsUpdate&&a.statusNorm==='Ongoing'&&can)?`<div class="status-update-panel ongoing"><div><b>${U('This activity is in progress.','Kegiatan sedang berlangsung.')}</b><div>${U('You may mark it completed early.','Dapat ditandai selesai lebih awal.')}</div></div><div><button type="button" class="btn btn-gold btn-sm" id="detailQuickComplete">${U('Mark completed','Tandai Selesai')}</button><button type="button" class="btn btn-outline btn-sm" id="detailQuickStatus">${U('Update status','Ubah Status')}</button></div></div>`:a.statusNeedsUpdate&&can?`<div class="status-update-panel"><div><b>${U('Update required','Perlu Pembaruan Status')}</b><div>${U('Activity time has passed. Confirm its status.','Waktu kegiatan telah berlalu. Konfirmasikan statusnya.')}</div></div><div><button type="button" class="btn btn-gold btn-sm" id="detailQuickComplete">${U('Mark completed','Tandai Selesai')}</button><button type="button" class="btn btn-outline btn-sm" id="detailQuickStatus">${U('Update status','Ubah Status')}</button></div></div>`:'';
  const badge=`<div class="cd-badges"><span class="status-badge" style="background:${a.layanan==='Yes'?'var(--blue-bg)':'var(--gold-100)'};color:${a.layanan==='Yes'?'var(--navy-700)':'#8A6A1B'}">${a.layanan==='Yes'?t('serviceBadgeCheck'):t('nonServiceBadge')}</span><span class="cat-badge" style="background:${cs.bg};color:${cs.fg}">${E(a.kategori)}</span><span class="status-badge" style="background:${ss.bg};color:${ss.fg}">${E(activityStatusLabel(a.statusNorm))}</span>${a.statusNeedsUpdate?`<span class="status-update-badge">${U('Needs update','Perlu Update')}</span>`:''}${eo?`<span class="eo-mini-badge">EO ${cmEoProgress(a.eoChecklist).done}/${cmEoProgress(a.eoChecklist).total}</span>`:''}</div>`;
  const mode=getMeetingMode(a),loc=mode!=='online'?getMeetingLocation(a):'',meetingLink=mode!=='offline'?getMeetingLink(a):'';
  const meeting=`${kv(U('Method','Metode Pelaksanaan'),`<span class="meeting-detail-badge">${E(meetingModeLabel(mode))}</span>`,true)}${mode!=='online'?kv(U('Location','Lokasi Rapat'),loc):''}${mode!=='offline'?kv(U('Meeting link','Tautan Rapat'),renderLocationWithCopy(meetingLink,false,a.id),true):''}`;
  const date=fmtDate(a.tglMulai)+(a.tglSelesai&&a.tglSelesai!==a.tglMulai?' – '+fmtDate(a.tglSelesai):'');
  const mainInfo=`<div class="cd-kv-grid">${kv(U('Date','Tanggal'),date)}${kv(U('Time','Waktu'),a.waktu)}${kv(U('Requesting unit','Unit Pengusul'),a.unitPemohon)}${kv('PIC Tim CM',cmPicHtml(a.picTimCM),true)}${kv(U('Related program','Program Terkait'),a.programTerkait)}${kv(U('Speaker unit','Unit Asal Narasumber'),a.unitAsalNarsum)}${kv(U('Category','Kategori'),a.kategori)}${kv(U('Service','Layanan'),a.layanan)}${meeting}</div><div class="cd-kv-wide">${kv(U('Target participants','Target Peserta'),a.pesertaTarget)}</div>`;
  const summaryText=String(a.tujuanOutput||a.ringkasanHasil||a.catatan||'').trim();
  const summary=`<details class="cd-summary" open><summary><span class="cd-gold-icon">${CM_AF_ICONS.doc}</span>${U('Activity summary','Ringkasan Kegiatan')}<span class="cd-summary-chevron">⌄</span></summary><div class="cd-summary-text">${summaryText?E(summaryText):`<span class="cd-muted">${U('No summary has been entered.','Ringkasan kegiatan belum diisi.')}</span>`}</div></details>`;
  const info=`${statusPanels}${sec('1',U('Main information','Informasi Utama'),mainInfo)}${sec('2',U('IKU & WBS','IKU & Tahapan WBS'),`<div class="cd-kv-grid">${kv(U('Related IKU','IKU terkait'),(window.DCMIKU?DCMIKU.refsOf(a):[]).join(', '))}${kv(U('WBS stages','Tahapan WBS'),ActivityWBS.items(a).map(w=>(ActivityWBS.LABELS[w.wbsLevel4]||w.wbsLevel4)+' · '+w.wbsLevel5).join('; '))}</div>`)}${summary}${sec('3',U('Letter basis','Dasar Surat'),docs('undangan',U('Invitation letter','Surat Undangan'))+docs('suratTugas',U('Assignment letter','Surat Tugas')))}`;
  const plan=`${sec('1',U('Goal and notes','Tujuan & Catatan'),`<div class="cd-kv-grid">${kv(U('Goal / output','Tujuan / Output'),a.tujuanOutput)}${kv(U('Notes','Catatan'),a.catatan)}</div>`)}${sec('2',U('Status and PIC','Status & PIC'),`<div class="cd-kv-grid">${kv('Status',activityStatusLabel(a.statusNorm))}${kv('PIC Tim CM',cmPicHtml(a.picTimCM),true)}</div>`)}${sec('3',U('Speakers and participants','Narasumber & Peserta'),`<div class="cd-kv-grid">${kv(U('Speaker unit','Unit Asal Narasumber'),a.unitAsalNarsum)}${kv(U('Target participants','Target Peserta'),a.pesertaTarget)}</div>`)}${eo?sec('EO',U('Event Organizer','Event Organizer'),`${U('Event enabled','Event diaktifkan')} · ${cmEoProgress(a.eoChecklist).done}/${cmEoProgress(a.eoChecklist).total} ${U('tasks complete','tugas selesai')}`):''}`;
  const run=`${sec('1',U('Materials','Materi'),`<div class="cd-rendered">${renderMateriValue(a.materi)}${renderActivityFileList(a.materiFiles)}</div>`)}${sec('2',U('Meeting minutes','Notula Rapat'),`<div class="cd-rendered">${renderActivityNotulaDetail(a)}${a.notulaTeks?`<div class="afv-notula">${cmAfSanitizeHtml(a.notulaTeks)}</div>`:''}</div>`)}`;
  const res=`${sec('1',U('Documentation','Dokumentasi'),renderDocumentationGallery(a.dokumentasi))}${sec('2',U('Conclusion','Kesimpulan'),`<div class="cd-kv-grid">${kv(U('Summary','Ringkasan'),a.ringkasanHasil)}${kv(U('Obstacles','Kendala'),a.kendala)}${kv(U('Follow-up','Tindak Lanjut'),a.tindakLanjut)}</div>`)}${sec('3',U('Activity report','Laporan Aktivitas'),`<p class="cd-muted">${U('Generate a formal report from the saved activity, minutes and attached documents.','Buat laporan dari data aktivitas, notula, dan dokumen yang telah tersimpan.')}</p><button type="button" class="btn btn-gold btn-sm" data-cd-report>${U('Generate activity report','Buat Laporan Aktivitas')}</button>`)}`;
  const panels={info,plan,eo:eo?`<div class="cd-eo">${renderEoChecklistDetail(a)}</div>`:'',run,res};
  const tabs=CM_AF_TABS.filter(t=>t.k!=='eo'||eo);
  modal.innerHTML=`<div class="modal-box cm-af cm-detail"><aside class="af-nav">
    <span class="af-mode">◉ ${U('VIEW ACTIVITY','LIHAT AKTIVITAS')}</span>
    <div class="af-sum"><b>${E(a.namaKegiatan)}</b><div class="af-sum-meta"><span>${E(date)}</span><span>${E(a.unitPemohon||'')}</span></div><span class="af-st s-${E(a.statusNorm)}">${E(activityStatusLabel(a.statusNorm))}</span></div>
    <div class="af-prog"><svg viewBox="0 0 60 60" width="52" height="52" aria-hidden="true"><circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="7"/><circle cx="30" cy="30" r="24" fill="none" stroke="#E9C866" stroke-width="7" stroke-dasharray="${(150.8*docPercent/100).toFixed(1)} 151" stroke-linecap="round" transform="rotate(-90 30 30)"/></svg><div><b>${docPercent}%</b><small>${U('Document completeness','Kelengkapan dokumen')}<br>${docCount}/5 ${U('types','jenis')}</small></div></div>
    <div class="af-tabs" role="tablist" aria-label="${U('Activity detail sections','Bagian detail aktivitas')}">${tabs.map(t=>`<button type="button" role="tab" class="af-tab ${t.k==='info'?'on':''}" aria-selected="${t.k==='info'}" data-cd-tab="${t.k}"><span class="ic">${CM_AF_ICONS[t.k]}</span><span class="tx"><b>${cmAfL(t)[0]}</b><small>${cmAfL(t)[1]}</small></span></button>`).join('')}</div>
    <div class="af-navfoot">${U('Read-only mode. Use Edit Activity to change the saved data.','Mode lihat. Gunakan Ubah Aktivitas untuk mengubah data yang tersimpan.')}</div>
    </aside><div class="af-main">
      <div class="modal-head"><div class="cd-head-title"><span class="af-num">${CM_AF_ICONS.doc}</span><div class="af-ttl"><h2>${t('activityDetails')}</h2><p>${U('Activity information and documents','Informasi dan dokumen aktivitas')}</p></div></div>
        <button type="button" class="modal-close" id="closeDetail" aria-label="${U('Close','Tutup')}">&times;</button></div>
      <div class="modal-body cd-body">${badge}<div class="cd-title-banner"><span class="cd-gold-bar"></span><h3>${E(a.namaKegiatan)}</h3><button type="button" class="cd-id" data-cd-copy-code title="${U('Copy activity number','Salin nomor aktivitas')}" aria-label="${U('Copy activity number','Salin nomor aktivitas')}" style="border:0;cursor:pointer;font-family:inherit">${E(publicCode)}</button></div>
        ${tabs.map(t=>`<div class="cd-panel ${t.k==='info'?'on':''}" data-cd-panel="${t.k}">${panels[t.k]||''}</div>`).join('')}</div>
      <div class="modal-foot cd-footer">
        <span class="cd-foot-note">${U('Read-only mode · saved activity','Mode lihat · data tersimpan')}</span>
        <button type="button" id="detailCloseBottom" class="btn btn-outline btn-sm">${U('Close','Tutup')}</button>
        <details class="cd-menu"><summary title="${U('More actions','Aksi lainnya')}" aria-label="${U('More actions','Aksi lainnya')}">⋮</summary><div class="cd-menu-drop">${can?`<button type="button" id="detailDuplicate">${U('Duplicate','Duplikasi')}</button>`:''}<button type="button" id="detailHistory">${U('History','Riwayat')}</button>${eo?`<button type="button" id="detailManageEvent">${U('Manage Event','Kelola Event')}</button>`:''}${can?`<button type="button" id="detailDelete" class="cd-danger">${U('Delete','Hapus')}</button>`:''}</div></details>
        ${can?`<button type="button" id="detailEdit" class="btn btn-outline">${U('Edit Activity','Ubah Aktivitas')}</button>`:''}
        <button type="button" id="detailReport" class="btn btn-gold cd-report-btn">${CM_AF_ICONS.doc} ${U('Generate activity report','Buat Laporan Aktivitas')}</button>
      </div>
      </div></div>`;
  modal.classList.remove('hidden');
  hydrateDocThumbs(modal);hydrateGenericActivityFiles(modal);
  modal.querySelector('#closeDetail').onclick=()=>modal.classList.add('hidden');
  modal.querySelector('#detailCloseBottom').onclick=()=>modal.classList.add('hidden');
  modal.querySelector('[data-cd-copy-code]')?.addEventListener('click',async()=>{
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(publicCode);}
      else {const t=document.createElement('textarea');t.value=publicCode;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();if(!document.execCommand('copy'))throw Error('copy unavailable');t.remove();}
      toast(U('Activity number copied','Nomor aktivitas disalin'),'success');
    }catch(e){toast(U('Cannot copy automatically','Tidak dapat menyalin secara otomatis'),'error');}
  });
  modal.querySelectorAll('[data-cd-tab]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.cdTab;modal.querySelectorAll('[data-cd-tab]').forEach(t=>{t.classList.toggle('on',t.dataset.cdTab===k);t.setAttribute('aria-selected',String(t.dataset.cdTab===k));});
    modal.querySelectorAll('[data-cd-panel]').forEach(p=>p.classList.toggle('on',p.dataset.cdPanel===k));modal.querySelector('.cd-body').scrollTop=0;
  });
  modal.querySelectorAll('#detailReport,[data-cd-report]').forEach(b=>b.onclick=()=>cmGenerateSingleActivityDocx(a));
  modal.querySelector('#detailEdit')?.addEventListener('click',()=>{modal.classList.add('hidden');openForm(id);});
  modal.querySelector('#detailDuplicate')?.addEventListener('click',()=>{modal.classList.add('hidden');cmAfDuplicate(id);});
  modal.querySelector('#detailDelete')?.addEventListener('click',()=>{modal.classList.add('hidden');openConfirmDelete(id);});
  modal.querySelector('#detailHistory')?.addEventListener('click',()=>{modal.classList.add('hidden');openActivityLog(id,{returnToDetail:true,activity:a});});
  modal.querySelector('#detailManageEvent')?.addEventListener('click',()=>{modal.classList.add('hidden');openEoWorkspace(id,{returnToDetail:true});});
  modal.querySelector('#detailQuickComplete')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;await cmQuickCompleteActivity(id);});
  modal.querySelector('#detailQuickStatus')?.addEventListener('click',()=>{modal.classList.add('hidden');openForm(id);});
  modal.querySelectorAll('[data-inline-copy-link]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();copyActivityLocationLink(a);}));
  cmWireActivityNotulaDetail(a,modal);
}
window.cmDetailV2=cmDetailV2;


/* Invitation Preview First: keep existing invitation sources/downloads; show preview before download. */
(function(){
 'use strict';
 var KEY='cm-inv-preview-first',active=null,files=[],token=0;
 var tr=(en,id)=>typeof uiText==='function'?uiText(en,id):id;
 var nm=f=>String(f.name||(f.url&&typeof fileNameFromUrl==='function'?fileNameFromUrl(f.url):'')||'Undangan');
 var safe=u=>/^https?:\/\//i.test(String(u||''))?String(u):'';
 var html=s=>typeof escapeHtml==='function'?escapeHtml(String(s||'')):String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 var style=document.createElement('style');style.id='cm-inv-preview-first-css';style.textContent=
 '#cm-inv-preview-first{position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:16px;background:#041936a8;font-family:inherit}'+
 '#cm-inv-preview-first .cip-box{width:min(1060px,100%);height:min(820px,92vh);background:white;border-radius:15px;box-shadow:0 20px 65px #061b4355;display:flex;flex-direction:column;overflow:hidden}'+
 '#cm-inv-preview-first .cip-head{background:#102b58;color:white;padding:12px 16px;display:flex;align-items:center;gap:12px}'+
 '#cm-inv-preview-first .cip-head b{font-size:16px}#cm-inv-preview-first .cip-head small{display:block;color:#d5e0f1;font-size:11px;max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
 '#cm-inv-preview-first .cip-close{border:1px solid #ffffff70;background:transparent;color:white;border-radius:8px;padding:5px 10px;margin-left:auto;font-size:20px;cursor:pointer}'+
 '#cm-inv-preview-first .cip-main{display:flex;flex:1;min-height:0;background:#f5f7fb}'+
 '#cm-inv-preview-first .cip-files{width:215px;flex:none;background:white;border-right:1px solid #e1e7f0;padding:10px;overflow:auto;display:grid;align-content:start;gap:6px}'+
 '#cm-inv-preview-first .cip-files[hidden]{display:none}#cm-inv-preview-first .cip-files button{text-align:left;font-size:12px;color:#193762;background:white;border:1px solid #e0e6f0;border-radius:8px;padding:9px;overflow-wrap:anywhere;cursor:pointer}'+
 '#cm-inv-preview-first .cip-files button.on{background:#fff8e6;border-color:#d7a62e}#cm-inv-preview-first .cip-view{min-width:0;flex:1;display:flex;flex-direction:column;min-height:0}'+
 '#cm-inv-preview-first .cip-name{padding:10px;background:white;border-bottom:1px solid #e4e8f1;font-size:12px;font-weight:700;color:#162f59;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
 '#cm-inv-preview-first .cip-canvas{flex:1;min-height:0;display:grid;place-items:center;overflow:auto;padding:7px}'+
 '#cm-inv-preview-first .cip-canvas iframe{width:100%;height:100%;border:0;background:white}#cm-inv-preview-first .cip-canvas img{max-width:100%;max-height:100%;object-fit:contain}'+
 '#cm-inv-preview-first .cip-info{text-align:center;color:#52637b;font-size:13px;line-height:1.5;padding:22px;max-width:480px}'+
 '#cm-inv-preview-first .cip-foot{background:white;border-top:1px solid #e0e5ee;padding:10px 14px;display:flex;justify-content:flex-end;align-items:center;gap:8px}'+
 '#cm-inv-preview-first .cip-foot button{border:1px solid #cbd6e6;background:#fff;color:#163668;padding:8px 12px;font:700 12px inherit;border-radius:8px;cursor:pointer}'+
 '#cm-inv-preview-first .cip-foot .pri{background:#102b58;border-color:#102b58;color:#fff}'+
 '@media(max-width:650px){#cm-inv-preview-first .cip-main{flex-direction:column}#cm-inv-preview-first .cip-files{width:auto;max-height:112px;grid-auto-flow:column;grid-auto-columns:minmax(130px,180px);border-right:0;border-bottom:1px solid #e1e7f0}}';
 document.head.appendChild(style);
 function close(){document.getElementById(KEY)?.remove();token++;document.removeEventListener('keydown',esc,true)}
 function esc(e){if(e.key==='Escape'){e.preventDefault();close()}}
 function kind(f,u){var z=(nm(f)+' '+String(f.mime||'')+' '+String(u).slice(0,50)).toLowerCase();return /application\/pdf|\.pdf(?:\?|$)/.test(z)?'pdf':/image\/(?:png|jpe?g|webp|gif|bmp)|\.(?:png|jpe?g|webp|gif|bmp)(?:\?|$)/.test(z)?'image':'other'}
 async function choose(i){
  var f=files[i],box=document.getElementById(KEY);if(!box||!f)return;
  active=f;var serial=++token,canvas=box.querySelector('.cip-canvas'),source=box.querySelector('[data-cip-source]');
  box.querySelector('.cip-name').textContent=nm(f);
  box.querySelectorAll('[data-cip-select]').forEach(b=>b.classList.toggle('on',Number(b.dataset.cipSelect)===i));
  canvas.innerHTML='<div class="cip-info">'+tr('Preparing preview…','Menyiapkan pratinjau…')+'</div>';
  source.hidden=true;source.onclick=null;
  try{
   var url=f.refId?await fetchDocImageDataUrl(f.refId):safe(f.url);
   if(serial!==token||!document.getElementById(KEY))return;
   if(!url){canvas.innerHTML='<div class="cip-info">'+tr('Cannot load the file. Please check access.','Berkas tidak dapat dimuat. Periksa izin akses.')+'</div>';return}
   var k=kind(f,url);
   if(k==='image'){var im=document.createElement('img');im.src=url;im.alt=nm(f);canvas.replaceChildren(im)}
   else if(k==='pdf'){var frame=document.createElement('iframe');frame.title=nm(f);frame.src=url;canvas.replaceChildren(frame)}
   else canvas.innerHTML='<div class="cip-info">'+tr('This file format cannot be previewed directly. Open the source or download it below.','Format berkas ini belum mendukung pratinjau langsung. Buka sumber atau unduh melalui tombol di bawah.')+'</div>';
   if(safe(url)){source.hidden=false;source.onclick=()=>window.open(url,'_blank','noopener,noreferrer')}
  }catch(err){if(serial===token)canvas.innerHTML='<div class="cip-info">'+html(err.message||'Pratinjau tidak tersedia')+'</div>'}
 }
 function show(id){
  var a=state.agendas.find(x=>String(x.id)===String(id));if(!a)return;
  var list=cmInvitationSources(a);if(!list.length)return;
  close();files=list;active=null;
  var root=document.createElement('div');root.id=KEY;
  root.innerHTML='<div class="cip-box" role="dialog" aria-modal="true" aria-label="'+html(tr('Invitation preview','Pratinjau undangan'))+'">'+
   '<div class="cip-head"><div><b>'+tr('Invitation preview','Pratinjau Undangan')+'</b><small>'+html(a.namaKegiatan||'')+'</small></div><button type="button" class="cip-close" data-cip-close aria-label="'+tr('Close','Tutup')+'">×</button></div>'+
   '<div class="cip-main"><aside class="cip-files"'+(list.length===1?' hidden':'')+'>'+list.map((f,i)=>'<button type="button" data-cip-select="'+i+'">'+html(nm(f))+'</button>').join('')+'</aside><div class="cip-view"><div class="cip-name"></div><div class="cip-canvas"></div></div></div>'+
   '<div class="cip-foot"><button type="button" data-cip-source hidden>'+tr('Open original','Buka sumber')+'</button><button type="button" data-cip-close>'+tr('Close','Tutup')+'</button><button type="button" class="pri" data-cip-download>'+tr('Download','Unduh')+'</button></div></div>';
  root.addEventListener('click',e=>{
   if(e.target===root||e.target.closest('[data-cip-close]')){close();return}
   var b=e.target.closest('[data-cip-select]');if(b){choose(+b.dataset.cipSelect);return}
   if(e.target.closest('[data-cip-download]')&&active)cmInvitationFetch(active);
  });
  document.body.appendChild(root);document.addEventListener('keydown',esc,true);choose(0);
 }
 window.cmInvitationOpen=show;
 if(typeof window.cmInvitationBadge==='function'){
  var orig=window.cmInvitationBadge;window.cmInvitationBadge=function(a){
   return orig(a).replace(/Klik untuk mengunduh undangan(?: \(\d+ file\))?/g,'Klik untuk pratinjau undangan').replace(/Click to download the invitation(?: \(\d+ files\))?/g,'Click to preview the invitation')
    .replace(/<svg class="inv-dl"[\s\S]*?<\/svg>/,'<svg class="inv-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>');
  }
 }
})();
