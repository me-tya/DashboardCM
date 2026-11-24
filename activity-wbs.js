/* Shared WBS classification for Dashboard CM and Modul Transformasi. 2026-11-24.
   Form: ☐ Terkait WBS → baris [Komponen ▾][Tahapan ▾] (bisa lebih dari satu, PM & CM paralel).
   Data: wbsItems=[{wbsGroup,wbsLevel4,wbsLevel5}] + field lama wbsGroup/wbsLevel4/wbsLevel5 = item pertama
   (tetap diisi agar filter, chip, ekspor, dan data lama tetap kompatibel). */
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
  const COMPONENTS=Object.freeze(['Arsitektur Proses Bisnis','Pengembangan Sistem Informasi','Manajemen Perubahan']);
  const LABELS=Object.freeze({'Arsitektur Proses Bisnis':'Arsitektur Proses Bisnis','Pengembangan Sistem Informasi':'Pengembangan Sistem Informasi','Manajemen Perubahan':'Change Management'});
  const E=value=>String(value==null?'':value).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const l4=group=>(GROUPS[group]||[]);
  const l5=(group,level4)=>(l4(group).includes(level4)?stages[level4]:[]);
  const groupOf=level4=>GROUPS.CM.includes(level4)?'CM':GROUPS.PM.includes(level4)?'PM':'';
  const valid=(group,level4,level5)=>!!(GROUPS[group]&&l5(group,level4).includes(level5));
  const options=(items,selected,placeholder,labels)=>'<option value="">'+E(placeholder||'Pilih tahapan')+'</option>'+items.map(x=>'<option value="'+E(x)+'"'+(x===selected?' selected':'')+'>'+E(labels&&labels[x]||x)+'</option>').join('');
  /* Daftar tahapan WBS sebuah aktivitas (format baru + fallback field lama). */
  function items(row){
    const r=row||{};let list=r.wbsItems;
    if(typeof list==='string'){try{list=JSON.parse(list)}catch(e){list=[]}}
    const out=[],seen=new Set();
    const add=(g,k,s)=>{k=String(k||'');s=String(s||'');g=groupOf(k)||String(g||'');if(g==='CM'&&!k)k='Manajemen Perubahan';if(!k&&!s)return;const key=k+'|'+s;if(seen.has(key))return;seen.add(key);out.push({wbsGroup:g,wbsLevel4:k,wbsLevel5:s});};
    if(Array.isArray(list))list.forEach(x=>x&&add(x.wbsGroup,x.wbsLevel4,x.wbsLevel5));
    if(!out.length&&(r.wbsGroup||r.wbsLevel4||r.wbsLevel5))add(r.wbsGroup,r.wbsLevel4,r.wbsLevel5);
    return out;
  }
  /* Field datar untuk disimpan: item pertama ke field lama + wbsItems lengkap. */
  function flat(list){
    const l=(list||[]).filter(x=>x&&x.wbsLevel4&&x.wbsLevel5).map(x=>({wbsGroup:groupOf(x.wbsLevel4),wbsLevel4:x.wbsLevel4,wbsLevel5:x.wbsLevel5}));
    const f=l[0]||{wbsGroup:'',wbsLevel4:'',wbsLevel5:''};
    return {wbsGroup:f.wbsGroup,wbsLevel4:f.wbsLevel4,wbsLevel5:f.wbsLevel5,wbsItems:l};
  }
  const rowHTML=(x)=>{
    const k=COMPONENTS.includes(x&&x.wbsLevel4)?x.wbsLevel4:'',s=k&&stages[k].includes(x&&x.wbsLevel5)?x.wbsLevel5:'';
    return '<div class="wbs-row" data-wbs-row>'+
      '<label><span>Komponen</span><select data-wbs-k aria-label="Komponen WBS">'+options(COMPONENTS,k,'Pilih komponen',LABELS)+'</select></label>'+
      '<label><span>Tahapan</span><select data-wbs-s aria-label="Tahapan WBS"'+(k?'':' disabled')+'>'+options(k?stages[k]:[],s,'Pilih tahapan')+'</select></label>'+
      '<button type="button" class="wbs-row-del" data-wbs-del title="Hapus baris" aria-label="Hapus baris tahapan">×</button></div>';
  };
  function formHTML(row){
    const list=items(row),on=list.length>0,f=flat(list);
    return '<div class="wbs-classify'+(on?' on':'')+'" data-wbs-form>'+
      '<label class="wbs-toggle"><input type="checkbox" data-wbs-on'+(on?' checked':'')+'><span><b>Terkait WBS</b><small>Centang bila kegiatan ini mendukung tahapan WBS (Arsitektur, Pengembangan Sistem, Change Management)</small></span></label>'+
      '<div class="wbs-body"'+(on?'':' hidden')+'><div class="wbs-rows" data-wbs-rows>'+(on?list:[{}]).map(rowHTML).join('')+'</div>'+
      '<button type="button" class="wbs-add" data-wbs-add>＋ Tambah tahapan</button>'+
      '<div class="wbs-form-hint" aria-live="polite"></div></div>'+
      '<input type="hidden" name="wbsGroup" value="'+E(f.wbsGroup)+'"><input type="hidden" name="wbsLevel4" value="'+E(f.wbsLevel4)+'"><input type="hidden" name="wbsLevel5" value="'+E(f.wbsLevel5)+'">'+
      '<input type="hidden" name="wbsItemsJson" value="'+E(JSON.stringify(f.wbsItems))+'"></div>';
  }
  /* Membaca form: {on, rows:[{wbsLevel4,wbsLevel5}], incomplete, ...flat} */
  function read(root){
    const block=root&&(root.matches?.('[data-wbs-form]')?root:root.querySelector?.('[data-wbs-form]'));
    if(!block)return Object.assign({on:false,incomplete:0},flat([]));
    const on=!!block.querySelector('[data-wbs-on]')?.checked;
    const rows=on?[...block.querySelectorAll('[data-wbs-row]')].map(r=>({wbsLevel4:r.querySelector('[data-wbs-k]').value,wbsLevel5:r.querySelector('[data-wbs-s]').value})):[];
    const incomplete=rows.filter(r=>(r.wbsLevel4||r.wbsLevel5)&&!(r.wbsLevel4&&r.wbsLevel5)).length;
    const filled=rows.filter(r=>r.wbsLevel4&&r.wbsLevel5);
    return Object.assign({on,incomplete,empty:on&&!filled.length},flat(filled));
  }
  function wire(root){
    if(!root)return;
    const block=root.matches?.('[data-wbs-form]')?root:root.querySelector('[data-wbs-form]');
    if(!block||block.dataset.wbsBound)return;
    block.dataset.wbsBound='1';
    const box=block.querySelector('[data-wbs-rows]'),body=block.querySelector('.wbs-body'),on=block.querySelector('[data-wbs-on]'),hint=block.querySelector('.wbs-form-hint');
    const H=n=>block.querySelector('input[name="'+n+'"]');
    const sync=(silent)=>{
      const v=read(block);
      H('wbsGroup').value=v.wbsGroup;H('wbsLevel4').value=v.wbsLevel4;H('wbsLevel5').value=v.wbsLevel5;H('wbsItemsJson').value=JSON.stringify(v.wbsItems);
      block.classList.toggle('on',v.on);body.hidden=!v.on;
      const rows=box.querySelectorAll('[data-wbs-row]');rows.forEach(r=>{r.querySelector('[data-wbs-del]').style.visibility=rows.length>1?'visible':'hidden';});
      const pm=v.wbsItems.some(x=>x.wbsGroup==='PM'),cm=v.wbsItems.some(x=>x.wbsGroup==='CM');
      hint.textContent=!v.on?'':v.wbsItems.length?(v.wbsItems.length+' tahapan dipilih'+(pm||cm?' · '+[pm?'PM':'',cm?'CM':''].filter(Boolean).join(' & '):'')+(v.incomplete?' · '+v.incomplete+' baris belum lengkap':'')):'Pilih komponen lalu tahapannya.';
      if(!silent){H('wbsItemsJson').dispatchEvent(new Event('change',{bubbles:true}));}
    };
    box.addEventListener('change',e=>{
      const k=e.target.closest('[data-wbs-k]');
      if(k){const s=k.closest('[data-wbs-row]').querySelector('[data-wbs-s]');s.innerHTML=options(k.value?stages[k.value]:[],'','Pilih tahapan');s.disabled=!k.value;}
      sync(true);
    });
    box.addEventListener('click',e=>{const d=e.target.closest('[data-wbs-del]');if(!d)return;const rows=box.querySelectorAll('[data-wbs-row]');if(rows.length<2)return;d.closest('[data-wbs-row]').remove();sync();});
    block.querySelector('[data-wbs-add]').addEventListener('click',()=>{box.insertAdjacentHTML('beforeend',rowHTML({}));sync();box.lastElementChild.querySelector('[data-wbs-k]').focus();});
    on.addEventListener('change',()=>{if(on.checked&&!box.children.length)box.insertAdjacentHTML('beforeend',rowHTML({}));sync(true);});
    sync(true);
  }
  /* Ganti isi blok WBS di form (mis. saat memulihkan draf / duplikat). */
  function set(root,list){
    const block=root&&(root.matches?.('[data-wbs-form]')?root:root.querySelector?.('[data-wbs-form]'));if(!block)return;
    const t=document.createElement('template');t.innerHTML=formHTML({wbsItems:list||[]}).trim();const nb=t.content.firstElementChild;
    block.replaceWith(nb);wire(nb);nb.querySelector('input[name="wbsItemsJson"]').dispatchEvent(new Event('change',{bubbles:true}));
  }
  const badge=r=>items(r).filter(x=>x.wbsLevel5).map(x=>'<span class="wbs-chip '+(x.wbsGroup==='CM'?'wbs-cm':'wbs-pm')+'" title="'+E([LABELS[x.wbsLevel4]||x.wbsLevel4,x.wbsLevel5].join(' · '))+'">'+E(x.wbsGroup)+' · '+E(x.wbsLevel5)+'</span>').join('');
  const quarter=value=>{const m=Number(String(value||'').slice(5,7));return m>=1&&m<=12?Math.ceil(m/3):0;};
  const matches=(r,f,field)=>{
    const t=f||{},list=items(r);
    const one=x=>(!t.wbsGroup||t.wbsGroup==='ALL'||t.wbsGroup===x.wbsGroup)&&(!t.wbsLevel4||t.wbsLevel4==='ALL'||t.wbsLevel4===x.wbsLevel4)&&(!t.wbsLevel5||t.wbsLevel5==='ALL'||t.wbsLevel5===x.wbsLevel5);
    const anyFilter=['wbsGroup','wbsLevel4','wbsLevel5'].some(k=>t[k]&&t[k]!=='ALL');
    return (!anyFilter||list.some(one))&&
       (!t.wbsQuarter||t.wbsQuarter==='ALL'||+t.wbsQuarter===quarter(r?.[field||'tglMulai']));
  };
  const text=r=>items(r).map(x=>x.wbsGroup+' · '+(LABELS[x.wbsLevel4]||x.wbsLevel4)+' · '+x.wbsLevel5).join('; ');
  const csv=(filename,rows)=>{
    const quote=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
    const body='﻿'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  global.ActivityWBS={stages,GROUPS,COMPONENTS,LABELS,l4,l5,groupOf,valid,options,items,flat,formHTML,read,wire,set,badge,quarter,matches,text,csv,E};
})(window);
