'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
(async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://me-tya.github.io/DashboardCM/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,photo='https://images.example.org/pegawai.jpg';
 const existing=[{n:'Dessy Monica',nip:'198512152010122001',jab:'Analis Senior',foto:'oldphoto.jpg',hp:''},{n:'Dina Fransisca',nip:'',foto:''}];
 const docs=[{id:'cfg-master',master:{pic:existing}},{id:'cfg-kp',kp:{pt:{'Dessy Monica':'Tim CM'},tims:['Tim CM'],asg:{}}}];
 w.S={oneonone:docs,ui:{}};w.actMaster=()=>docs[0].master;w.kpCfg=()=>docs[1].kp;w.actCanEdit=()=>true;
 w.esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 let committed=null;w.mtImportCommit=async incoming=>{committed=incoming;return {ok:true}};
 w.toast=msg=>{w._toast=msg};
 w.eval(fs.readFileSync('mt-team-exact/dcm-profile-photo-import-48.js','utf8'));
 w.eval(fs.readFileSync('mt-team-exact/dcm-profile-compare-50.js','utf8'));
 w.MT_PROFILE_IMPORT.open();
 const source={oneonone:[{id:'cfg-master',master:{pic:[
  {n:'Dessy Monica Wirsal',nip:'198512152010122001',foto:photo,jab:'Analis Keuangan',hp:'08123456'},
  {n:'Dyna Fransisca',nip:'199212242018012004',foto:photo}
 ]}},{id:'cfg-kp',kp:{tims:['Tim CM'],pt:{'Dessy Monica Wirsal':'Tim CM'}}}]};
 const json=JSON.stringify(source),input=w.document.querySelector('#cmp-file');
 Object.defineProperty(input,'files',{configurable:true,value:[{name:'profile.json',size:json.length,text:async()=>json}]});
 input.dispatchEvent(new w.Event('change',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,40));
 assert.equal(w.document.querySelectorAll('[data-cmp-person]').length,2,'sidebar includes two profiles');
 assert(w.document.querySelector('.cmp-row.cmp-sticky').textContent.includes('Dashboard CM'));
 assert(w.document.querySelector('.cmp-row.cmp-sticky').textContent.includes('Modul Transformasi'));
 assert(w.document.querySelector('#cmp-target').value==='existing:0','NIP matches first person');
 const mtPhoto=w.document.querySelector('[data-cmp-key="foto"][data-cmp-side="mt"]');
 assert(mtPhoto,'MT photo must be selectable');
 mtPhoto.click();
 assert(w.document.querySelector('[data-cmp-key="foto"][data-cmp-side="mt"]').classList.contains('selected'));
 assert(w.document.querySelector('[data-cmp-key="jab"][data-cmp-side="dcm"]').classList.contains('selected'),'keep existing job by default');
 const next=w.document.querySelector('#cmp-save');
 assert.equal(next.disabled,false);
 next.click();await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(next.textContent,'Konfirmasi & Simpan');
 assert(w.document.querySelector('#cmp-panel').textContent.includes('Profil diperbarui'));
 next.click();await new Promise(resolve=>setTimeout(resolve,30));
 assert(committed,'saving should pass data to confirmed commit');
 const staff=committed.find(x=>x.id==='cfg-master').master.pic;
 assert.equal(staff.length,2,'no duplicates');
 assert.equal(staff[0].foto,photo,'MT photo selected');
 assert.equal(staff[0].jab,'Analis Senior','DCM job selected');
 assert.equal(staff[0].hp,'08123456','fill missing phone');
 assert(!w.document.querySelector('.cmp50'),'dialog closes after commit');
 console.log('PASS: DOM side-by-side preview, choose photo, keep DCM job, confirm, no-duplicate save.');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
