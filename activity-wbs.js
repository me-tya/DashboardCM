/* Shared WBS classification for Dashboard CM and Modul Transformasi. 2026-11-17. */
(function(global){
  'use strict';
  if (global.ActivityWBS) return;
  const stages=Object.freeze({
    'Arsitektur Proses Bisnis': Object.freeze([
      'Arsitektur Proses Bisnis Level 3 As Is',
      'Arsitektur Proses Bisnis Level 3 To Be',
      'Arsitektur Proses Bisnis Level Detail As Is',
      'Arsitektur Proses Bisnis Level Detail To Be'
    ]),
    'Pengembangan Sistem Informasi': Object.freeze([
      'Penyusunan User Requirement',
      'Penelaahan User Requirement',
      'Analisis dan Perancangan Sistem Informasi',
      'Pengembangan Sistem Informasi',
      'User Acceptance Test (UAT)',
      'Vulnerability Test',
      'Hosting'
    ]),
    'Manajemen Perubahan': Object.freeze([
      'Analisis Dampak Perubahan',
      'Analisis Pemangku Kepentingan',
      'Analisis Kebutuhan Jaringan Perubahan',
      'Asesmen Kesiapan Perubahan',
      'Analisis Kebutuhan Komunikasi',
      'Analisis Kebutuhan Pelatihan',
      'Implementasi Strategi Komunikasi',
      'Implementasi Strategi Pelatihan',
      'Monitoring dan Evaluasi'
    ])
  });
  const GROUPS=Object.freeze({PM:['Arsitektur Proses Bisnis','Pengembangan Sistem Informasi'],CM:['Manajemen Perubahan']});
  const E=value=>String(value==null?'':value).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const l4=group=>(GROUPS[group]||[]);
  const l5=(group,level4)=>(l4(group).includes(level4)?stages[level4]:[]);
  const valid=(group,level4,level5)=>!!(GROUPS[group]&&l5(group,level4).includes(level5));
  const options=(items,selected,placeholder)=>'<option value="">'+E(placeholder||'Pilih tahapan')+'</option>'+items.map(x=>'<option value="'+E(x)+'"'+(x===selected?' selected':'')+'>'+E(x)+'</option>').join('');
  function formHTML(row){
    const r=row||{},g=GROUPS[r.wbsGroup]?r.wbsGroup:'',k=l4(g).includes(r.wbsLevel4)?r.wbsLevel4:'',s=l5(g,k).includes(r.wbsLevel5)?r.wbsLevel5:'';
    return '<div class="wbs-classify" data-wbs-form>'+
      '<div class="wbs-radios" role="radiogroup" aria-label="Klasifikasi aktivitas PM atau CM">'+
      ['PM','CM'].map(x=>'<label class="wbs-radio"><input type="radio" name="wbsGroup" value="'+x+'"'+(g===x?' checked':'')+'><span><b>'+x+'</b><small>'+(x==='PM'?'Project Management':'Change Management')+'</small></span></label>').join('')+
      '</div><div class="wbs-fields">'+
      '<label>WBS Level 4<select name="wbsLevel4" aria-label="WBS Level 4"'+(!g?' disabled':'')+'>'+options(l4(g),k,g==='CM'?'Manajemen Perubahan':'Pilih WBS Level 4')+'</select></label>'+
      '<label>WBS Level 5<select name="wbsLevel5" aria-label="WBS Level 5"'+(!k?' disabled':'')+'>'+options(l5(g,k),s,'Pilih tahapan WBS Level 5')+'</select></label></div>'+
      '<div class="wbs-form-hint" aria-live="polite">'+(g?E(g+' · '+(k||'Pilih Level 4')+(s?' · '+s:'')):'Pilih PM atau CM untuk mengaitkan aktivitas dengan tahapan WBS.')+'</div></div>';
  }
  function wire(root){
    if(!root)return;
    const block=root.matches?.('[data-wbs-form]')?root:root.querySelector('[data-wbs-form]');
    if(!block||block.dataset.wbsBound)return;
    block.dataset.wbsBound='1';
    const group=()=>block.querySelector('input[name="wbsGroup"]:checked')?.value||'';
    const a=block.querySelector('select[name="wbsLevel4"]'),b=block.querySelector('select[name="wbsLevel5"]'),hint=block.querySelector('.wbs-form-hint');
    const update=(reset4=false,reset5=false)=>{
      const g=group(),prev=reset4?'':a.value;
      a.innerHTML=options(l4(g),l4(g).includes(prev)?prev:'',g==='CM'?'Manajemen Perubahan':'Pilih WBS Level 4');
      a.disabled=!g;a.classList.toggle('wbs-locked',g==='CM');a.setAttribute('aria-readonly',g==='CM'?'true':'false');
      if(g==='CM')a.value='Manajemen Perubahan';
      const k=a.value,prev5=(reset4||reset5)?'':b.value;
      b.innerHTML=options(l5(g,k),l5(g,k).includes(prev5)?prev5:'','Pilih tahapan WBS Level 5');
      b.disabled=!k;
      hint.textContent=g?[g,k||'Pilih Level 4',b.value].filter(Boolean).join(' · '):'Pilih PM atau CM untuk mengaitkan aktivitas dengan tahapan WBS.';
      block.querySelectorAll('.wbs-radio').forEach(el=>el.classList.toggle('chosen',!!el.querySelector('input:checked')));
    };
    block.querySelectorAll('input[name="wbsGroup"]').forEach(r=>r.addEventListener('change',()=>update(true)));
    a.addEventListener('change',()=>update(false,true));
    b.addEventListener('change',()=>{hint.textContent=[group(),a.value,b.value].filter(Boolean).join(' · ')});
    update();
  }
  const badge=r=>r&&r.wbsGroup&&r.wbsLevel5?'<span class="wbs-chip '+(r.wbsGroup==='CM'?'wbs-cm':'wbs-pm')+'" title="'+E([r.wbsLevel4,r.wbsLevel5].filter(Boolean).join(' · '))+'">'+E(r.wbsGroup)+' · '+E(r.wbsLevel5)+'</span>':'';
  const quarter=value=>{const m=Number(String(value||'').slice(5,7));return m>=1&&m<=12?Math.ceil(m/3):0;};
  const matches=(r,f,field)=>{
    const t=f||{},g=r?.wbsGroup||'',k=r?.wbsLevel4||'',s=r?.wbsLevel5||'';
    return (!t.wbsGroup||t.wbsGroup==='ALL'||t.wbsGroup===g)&&
       (!t.wbsLevel4||t.wbsLevel4==='ALL'||t.wbsLevel4===k)&&
       (!t.wbsLevel5||t.wbsLevel5==='ALL'||t.wbsLevel5===s)&&
       (!t.wbsQuarter||t.wbsQuarter==='ALL'||+t.wbsQuarter===quarter(r?.[field||'tglMulai']));
  };
  const csv=(filename,rows)=>{
    const quote=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
    const body='\ufeff'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  global.ActivityWBS={stages,GROUPS,l4,l5,valid,options,formHTML,wire,badge,quarter,matches,csv,E};
})(window);
