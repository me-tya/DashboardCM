/* DCM 56 — compact individual-profile controls.
 * DOM-only layout adaptation: keep original Modul Transformasi events and
 * personnel/unit information unchanged. No Firebase writes.
 */
(function(w){
'use strict';
if(w.DCM_PROFILE_INDIVIDUAL_56)return;
const D=w.document;
const state={query:''};
function enhance(app,importBar){
 if(!app)return;
 const tabs=app.querySelector('.t-pvw');
 // The import bar is persistent; its original parent is restored by the host
 // before every re-render so it cannot be destroyed with app.innerHTML.
 if(tabs&&importBar){
  tabs.classList.add('dcm-pi-top-tabs');
  tabs.appendChild(importBar);
 }
 const body=app.querySelector('.t-pvb.t-pv-orang .t2-old');
 if(!body)return;
 const kpis=body.querySelector('.tm-kpis');
 const page=body.querySelector('.tm-page');
 const sidebar=page?.querySelector(':scope > .tm-left');
 const header=sidebar?.querySelector(':scope > .tm-lh');
 const teams=sidebar?.querySelector(':scope > .tm-tsel');
 const search=sidebar?.querySelector(':scope > .tm-search');
 if(!kpis||!page||!sidebar||!header||!teams||!search)return;
 if(body.querySelector(':scope > .dcm-pi-filter-toolbar'))return;
 const toolbar=D.createElement('div');
 toolbar.className='dcm-pi-filter-toolbar';
 toolbar.setAttribute('role','group');
 toolbar.setAttribute('aria-label','Filter profil pegawai Pusmantap');
 const caption=D.createElement('div');caption.className='dcm-pi-filter-title';
 const name=header.querySelector('b');
 if(name)caption.appendChild(name);
 const add=header.querySelector('[data-act="tmAdd"]');
 const addWrap=D.createElement('div');addWrap.className='dcm-pi-add';
 if(add)addWrap.appendChild(add);
 // Transfer existing controls, not clones: their original event handlers stay active.
 header.remove();
 const inp=search.querySelector('[data-tmq]');
 if(inp){
  inp.placeholder='Cari nama, unit, jabatan, keahlian…';
  inp.setAttribute('aria-label','Cari pegawai menurut nama, NIP, unit, jabatan atau keahlian');
 }
 toolbar.append(caption,teams,search,addWrap);
 kpis.insertAdjacentElement('afterend',toolbar);
 if(inp&&state.query){
  inp.value=state.query;
  inp.dispatchEvent(new w.Event('input',{bubbles:true}));
 }
 // Unit dampingan and original profile-detail markup are never modified.
}
function onInput(e){
 if(!e.target.matches?.('#t2 .t-pv-orang .dcm-pi-filter-toolbar [data-tmq]'))return;
 state.query=e.target.value;
}
D.addEventListener('input',onInput,true);
w.DCM_PROFILE_INDIVIDUAL_56={enhance,_state:state};
})(window);
