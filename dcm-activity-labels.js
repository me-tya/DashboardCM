/* Dashboard CM — label kelengkapan dokumen pada daftar Agenda.
   Merapikan label ke bawah Kategori seperti menu Aktivitas Modul Transformasi.
   Baca saja dari state dan DOM; tidak mengubah data maupun listener baris. */
(function(){
  'use strict';
  if(window.DCM_ACTIVITY_LABELS_READY)return;
  window.DCM_ACTIVITY_LABELS_READY=true;

  const DOC_KIND=[
    {key:'st',label:'ST',fields:['suratTugasFiles','suratTugasUrl','suratTugas']},
    {key:'nd',label:'ND Notula',fields:['ndNotulaFiles','notaDinasNotulaFiles','ndnot']},
    {key:'materi',label:'Materi',fields:['materiFiles','materi']},
    {key:'konsep',label:'Konsep Notula',fields:['notulaFiles','notulaTeks','notula']},
    {key:'dok',label:'Dok.',fields:['dokumentasi','dokumentasiFiles']},
    {key:'hadir',label:'Hadir',fields:['daftarHadirFiles','hadirFiles']},
    {key:'tte',label:'Notula TTE',fields:['notulaTteFiles','notulaTTE','notulaTte']}
  ];

  function documentKind(text){
    const t=String(text||'').replace(/\s+/g,' ').trim().replace(/\s+\d+$/,'').toLowerCase();
    if(t==='st'||t==='surat tugas')return 'st';
    if(t==='nd notula'||t==='nota dinas notula')return 'nd';
    if(t==='materi')return 'materi';
    if(t==='notula tte')return 'tte';
    if(t==='konsep notula'||t==='notula')return 'konsep';
    if(t==='dok.'||t==='dok'||t==='dokumentasi')return 'dok';
    if(t==='hadir'||t==='daftar hadir')return 'hadir';
    return '';
  }
  function countValue(value,key){
    if(value==null||value===false)return 0;
    if(Array.isArray(value))return value.filter(Boolean).length;
    if(typeof value==='object'){
      if(Array.isArray(value.items))return value.items.filter(Boolean).length;
      return value.url||value.refId||value.name||value.nomor?1:0;
    }
    const str=String(value).trim();
    if(!str||/^(?:tidak ada|none|n\/a|null|undefined|[-–—])$/i.test(str))return 0;
    if(str[0]==='['||str[0]==='{'){
      try{return countValue(JSON.parse(str),key)}catch(e){return 0}
    }
    // Catatan/notulen mentah tidak selalu berarti berkas notula.
    if(key==='notula'&&!/^https?:\/\//i.test(str))return 0;
    if(key==='notulaTeks')return str.replace(/<[^>]*>|&nbsp;/g,'').trim()?1:0;
    return 1;
  }
  function countDocs(a,fields){
    if(!a)return 0;
    // Field alternatif tidak dijumlah karena bisa menunjuk berkas yang sama.
    return Math.max(0,...fields.map(k=>countValue(a[k],k)));
  }
  function getAgendas(){
    try{if(typeof state!=='undefined'&&Array.isArray(state.agendas))return state.agendas;}
    catch(e){}
    return window.state&&Array.isArray(window.state.agendas)?window.state.agendas:[];
  }
  function chipSpec(spec,count){
    const chip=document.createElement('span');
    chip.className='dcm-doc-label';
    chip.dataset.dcmDocKind=spec.key;
    chip.textContent=spec.label+(count>1?' '+count:'');
    chip.title=spec.label+(count?' · '+count+' berkas':'');
    return chip;
  }
  function enhanceRows(){
    const root=document.getElementById('tab-table');
    if(!root)return;
    const items=getAgendas();
    const records=new Map(items.map(a=>[String(a.id),a]));
    root.querySelectorAll('table.data-table tbody tr[data-id]').forEach(tr=>{
      if(tr.dataset.dcmDocsReady==='1')return;
      const td=tr.querySelectorAll(':scope > td');
      if(td.length<7)return;
      const activity=td[2],category=td[5];
      const a=records.get(String(tr.dataset.id));
      const pills=Array.from(activity.querySelectorAll('span')).filter(el=>
        documentKind(el.textContent)&&!el.querySelector('span,a,button,input')
      );
      const byKind=new Map();
      for(const pill of pills){
        const kind=documentKind(pill.textContent);
        if(kind&&!byKind.has(kind))byKind.set(kind,pill);
      }
      for(const spec of DOC_KIND){
        if(!byKind.has(spec.key)){
          const n=countDocs(a,spec.fields);
          if(n)byKind.set(spec.key,chipSpec(spec,n));
        }
      }
      // Seperti Modul Transformasi, Notula TTE menggantikan Konsep Notula.
      if(byKind.has('tte'))byKind.delete('konsep');
      if(!byKind.size){tr.dataset.dcmDocsReady='1';return;}
      let group=category.querySelector('.dcm-activity-doc-labels');
      if(!group){
        group=document.createElement('div');
        group.className='dcm-activity-doc-labels';
        group.setAttribute('aria-label','Kelengkapan dokumen');
        category.appendChild(group);
      }
      for(const spec of DOC_KIND){
        const pill=byKind.get(spec.key);
        if(!pill)continue;
        const previousParent=pill.parentElement;
        pill.classList.add('dcm-doc-label');
        pill.dataset.dcmDocKind=spec.key;
        if(!pill.title)pill.title=spec.label;
        group.appendChild(pill);
        if(previousParent&&previousParent!==activity&&previousParent!==category&&
           previousParent.childElementCount===0&&!previousParent.textContent.trim()){
          previousParent.remove();
        }
      }
      // Hapus konsep lama yang disupersesi TTE agar tidak tersisa di kolom Aktivitas.
      if(byKind.has('tte')){
        pills.filter(el=>documentKind(el.textContent)==='konsep'&&el.parentElement!==group)
          .forEach(el=>el.remove());
      }
      tr.dataset.dcmDocsReady='1';
    });
  }
  function init(){
    const root=document.getElementById('tab-table');
    if(!root)return;
    let queued=false;
    const update=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;enhanceRows();});
    };
    // Hanya amati perubahan anak langsung pada panel. Pemindahan badge dalam
    // baris TIDAK men-trigger observer ini (menghindari loop/freeze).
    const observer=new MutationObserver(update);
    observer.observe(root,{childList:true});
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();