/* DashboardCM WBS filters in the existing contextual toolbar. */
(function(){
'use strict';
const W=window.ActivityWBS;if(!W)return;
W.attachDcmFilters=function(body,f,refresh,exportRows){
  if(!body)return;
  const before=body.querySelector('.cm-fper')||body.querySelector('.cm-fact');
  const g=f.wbsGroup||'ALL',k=f.wbsLevel4||'ALL',s=f.wbsLevel5||'ALL';
  const four=g==='PM'||g==='CM'?W.l4(g):Object.keys(W.stages);
  const five=k!=='ALL'?(W.stages[k]||[]):four.flatMap(x=>W.stages[x]||[]);
  function make(id,key,title,values,current){
    const el=document.createElement('select');el.id=id;el.className='filter-select';el.setAttribute('aria-label',title);
    el.append(new Option(title,'ALL'));
    values.forEach(v=>el.append(new Option(Array.isArray(v)?v[1]:v,Array.isArray(v)?v[0]:v)));
    el.value=values.some(v=>(Array.isArray(v)?v[0]:v)===current)?current:'ALL';
    el.addEventListener('change',()=>{
      f[key]=el.value;
      if(key==='wbsGroup'){f.wbsLevel4='ALL';f.wbsLevel5='ALL';}
      if(key==='wbsLevel4')f.wbsLevel5='ALL';
      refresh();
    });
    body.insertBefore(el,before);return el;
  }
  make('filterWbsGroup','wbsGroup','Semua PM / CM',[['PM','PM · Project Management'],['CM','CM · Change Management']],g);
  make('filterWbsL4','wbsLevel4','Semua WBS Level 4',four,k);
  make('filterWbsL5','wbsLevel5','Semua WBS Level 5',five,s);
  make('filterWbsQuarter','wbsQuarter','Semua Triwulan',[['1','Triwulan I'],['2','Triwulan II'],['3','Triwulan III'],['4','Triwulan IV']],String(f.wbsQuarter||'ALL'));
  /* Tombol ekspor CSV IKU dihapus (2026-11-24) — diganti Export IPR (dcm-iku-ipr.js). */
};
})();
