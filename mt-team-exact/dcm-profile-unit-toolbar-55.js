/* DCM 55 — Tim Pusmantap / Profil / Per unit compact toolbar.
 * Moves the original PMO/CMO-vs-Unit control and search into a single top bar,
 * adds a real team filter, and leaves the original MT renderers unchanged.
 * Filtering is UI-only: never edits the imported personnel or Firebase data.
 */
(function(w){
'use strict';
if(w.MT_PROFILE_UNIT_TOOLBAR)return;
const state={team:'',query:'',mode:''};
const doc=w.document;
function source(){
 const cfg=typeof w.kpCfg==='function'?w.kpCfg():{};
 const roster=typeof w.actMaster==='function'?w.actMaster().pic||[]:[];
 const teams=Array.isArray(cfg.tims)?cfg.tims.filter(x=>typeof x==='string'&&x.trim()):[];
 return {cfg,roster,teams};
}
function memberTeam(name,team,cfg){
 if(!team)return true;
 return cfg.pt?.[name]===team||(Array.isArray(cfg.ptx?.[name])&&cfg.ptx[name].includes(team));
}
function unitTeam(unit,team,cfg){
 if(!team)return true;
 const people=Array.isArray(cfg.asg?.[unit])?cfg.asg[unit]:[];
 return people.some(name=>memberTeam(name,team,cfg));
}
function enhance(app){
 const pv=app?.querySelector('.t-pvb.t-pv-unit');
 const grid=pv?.querySelector('.t-pu');
 const aside=grid?.querySelector(':scope > .t-pul');
 if(!pv||!grid||!aside)return;
 if(pv.querySelector(':scope > .dcm-pu-toolbar'))return;
 const toggle=aside.querySelector(':scope > .t-pum');
 const search=aside.querySelector(':scope > .t-pul-s');
 if(!toggle||!search)return;
 // Display label only; keep the original data-tpum="unit" behavior intact.
 const unitButton=toggle.querySelector('[data-tpum="unit"]');
 if(unitButton){
  unitButton.textContent='PMO & CMO Unit';
  unitButton.setAttribute('aria-label','Lihat PMO dan CMO Unit');
 }
 const selected=w.MT_T2?._ST?.pum||w.S?.ui?.t2pum||'pic';
 const change=selected!==state.mode;
 state.mode=selected;
 // The search means different things between modes: reset when switching.
 if(change)state.query='';
 const data=source();
 if(state.team&&!data.teams.includes(state.team))state.team='';
 const bar=doc.createElement('div');
 bar.className='dcm-pu-toolbar';
 bar.setAttribute('role','group');
 bar.setAttribute('aria-label','Filter profil per unit');
 const modes=doc.createElement('div');modes.className='dcm-pu-modes';modes.appendChild(toggle);
 // "Lihat dari" (radio-style, gold frame) — same buttons and data-tpum behavior.
 toggle.classList.add('dcm-lihat');toggle.setAttribute('role','radiogroup');toggle.setAttribute('aria-label','Lihat dari');
 if(!toggle.querySelector(':scope > .dcm-lihat-l')){const l=doc.createElement('span');l.className='dcm-lihat-l';l.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Lihat dari';toggle.insertBefore(l,toggle.firstChild)}
 toggle.querySelectorAll('[data-tpum]').forEach(b=>{b.setAttribute('role','radio');b.setAttribute('aria-checked',String(b.classList.contains('t-on')));if(!b.querySelector('i.dcm-rd')){const i=doc.createElement('i');i.className='dcm-rd';i.setAttribute('aria-hidden','true');b.insertBefore(i,b.firstChild)}});
 const group=doc.createElement('label');group.className='dcm-pu-team';
 const caption=doc.createElement('span');caption.textContent='Tim';
 const select=doc.createElement('select');select.setAttribute('data-dcm-pu-team','');
 select.setAttribute('aria-label','Filter tim PMO/CMO Kemenkeu');
 const opts=[['','Semua tim'],...data.teams.map(team=>[team,team])];
 for(const [value,label] of opts){
  const option=doc.createElement('option');option.value=value;option.textContent=label;
  select.appendChild(option);
 }
 select.value=state.team;
 group.append(caption,select);
 const searchWrap=doc.createElement('div');searchWrap.className='dcm-pu-search';
 const sv=search.querySelector(':scope > svg');if(sv&&!sv.parentElement.classList.contains('dcm-fa')){const fa=doc.createElement('span');fa.className='dcm-fa';search.insertBefore(fa,sv);fa.appendChild(sv)}
 const input=search.querySelector('[data-tpuq]');
 input.placeholder=selected==='pic'?'Cari nama, NIP, atau unit…':'Cari unit atau nama kontak…';
 input.setAttribute('aria-label',input.placeholder);
 input.value=state.query;
 searchWrap.appendChild(search);
 const count=doc.createElement('span');count.className='dcm-pu-count';count.setAttribute('aria-live','polite');
 bar.append(modes,group,searchWrap);
 pv.insertBefore(bar,grid);
 const countSlot=aside.querySelector('.t-pul-cap');
 if(countSlot)countSlot.setAttribute('data-dcm-pu-count-label','');
 else{const c=doc.createElement('div');c.className='dcm-pu-caption';aside.insertBefore(c,aside.firstChild)}
 if(!aside.querySelector('.dcm-pu-empty')){
  const empty=doc.createElement('div');empty.className='dcm-pu-empty';
  empty.textContent='Tidak ada hasil yang sesuai dengan filter.';
  empty.hidden=true;aside.querySelector('.t-pul-l')?.appendChild(empty);
 }
 applyFilters(false);
}
function applyFilters(autoSelect,restoreSearch){
 const pv=doc.querySelector('#t2 .t-pvb.t-pv-unit');
 if(!pv)return;
 const mode=state.mode,items=[...pv.querySelectorAll(mode==='unit'?'.t-pul-l .t-pur[data-tpu]':'.t-pul-l .t-pir[data-tpip]')];
 const {cfg,roster}=source(),term=state.query.toLocaleLowerCase('id-ID').trim();
 const byName=new Map(roster.map(p=>[p.n,p]));
 let shown=0,first=null,selectedVisible=false;
 const st=w.MT_T2?._ST;
 const active=mode==='unit'?st?.pu:st?.pip;
 for(const el of items){
  let filteredByTeam=false,fullSearch=el.dataset.s||'';
  if(mode==='unit'){
   const unit=el.dataset.tpu;
   filteredByTeam=unitTeam(unit,state.team,cfg);
   const names=Array.isArray(cfg.asg?.[unit])?cfg.asg[unit]:[];
   fullSearch+=' '+names.map(n=>n+' '+(byName.get(n)?.nip||'')).join(' ').toLocaleLowerCase('id-ID');
  }else{
   const name=el.dataset.tpip;
   filteredByTeam=memberTeam(name,state.team,cfg);
   fullSearch+=' '+(byName.get(name)?.jab||'')+' '+(byName.get(name)?.nip||'');
   fullSearch=fullSearch.toLocaleLowerCase('id-ID');
  }
  const visible=filteredByTeam&&(!term||fullSearch.includes(term));
  el.hidden=!visible;
  el.style.display=visible?'':'none';
  if(visible){shown++;first=first||el;if((mode==='unit'?el.dataset.tpu:el.dataset.tpip)===active)selectedVisible=true}
 }
 const title=pv.querySelector('[data-dcm-pu-count-label]');
 if(title){
  const total=items.length;
  title.innerHTML=mode==='unit'?'PMO &amp; CMO UNIT <em>'+shown+' / '+total+'</em>':'PMO &amp; CMO KEMENKEU <em>'+shown+' / '+total+'</em>';
 }else{
  const caption=pv.querySelector('.dcm-pu-caption');
  if(caption)caption.textContent=(mode==='unit'?'PMO & CMO Unit: ':'PMO & CMO Kemenkeu: ')+shown+' dari '+items.length;
 }
 const empty=pv.querySelector('.dcm-pu-empty');
 if(empty)empty.hidden=shown>0;
 const panel=pv.querySelector('.t-pur-d');
 if(panel)panel.hidden=shown===0;
 // Selecting a team should select the first valid entry on the right, too.
 // Preserve input caret when a search edit changes the active result.
 if(autoSelect&&first&&!selectedVisible&&st){
  if(mode==='unit')st.pu=first.dataset.tpu;else st.pip=first.dataset.tpip;
  if(typeof w.render==='function'){
   w.render();
   if(restoreSearch){
    const input=doc.querySelector('#t2 .dcm-pu-toolbar [data-tpuq]');
    if(input){const n=input.value.length;input.focus({preventScroll:true});try{input.setSelectionRange(n,n)}catch(e){}}
   }
  }
 }
}
function onTeamChange(e){
 const sel=e.target;
 if(!sel.matches?.('#t2 .dcm-pu-toolbar [data-dcm-pu-team]'))return;
 state.team=sel.value;
 applyFilters(true,false);
}
function onSearch(e){
 const target=e.target;
 if(!target.matches?.('#t2 .dcm-pu-toolbar [data-tpuq]'))return;
 // Prevent original MT text-search event from overwriting the combined filter.
 e.stopImmediatePropagation();
 state.query=target.value;
 applyFilters(true,true);
}
function onMode(e){
 if(!e.target.closest?.('#t2 .dcm-pu-toolbar [data-tpum]'))return;
 // Preserve team; search is reset in enhance() after the original tab handler.
 state.query='';
}
doc.addEventListener('change',onTeamChange,true);
doc.addEventListener('input',onSearch,true);
doc.addEventListener('click',onMode,true);
w.MT_PROFILE_UNIT_TOOLBAR={enhance,applyFilters,_state:state};
})(window);
