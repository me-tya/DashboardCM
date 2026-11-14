'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const server=fs.readFileSync('mt-team-exact/dcm-profile-photo-import-48.js','utf8');
const dialog=fs.readFileSync('mt-team-exact/dcm-profile-compare-50.js','utf8');
(async()=>{
 const parent=new JSDOM('<!doctype html><html><head></head><body><div id="main"></div><iframe id="team" src="about:blank"></iframe></body></html>',{url:'https://me-tya.github.io/DashboardCM/',runScripts:'outside-only',pretendToBeVisual:true});
 const win=parent.window.document.getElementById('team').contentWindow;
 assert.equal(win.parent,parent.window,'real same-origin iframe');
 const photo='data:image/png;base64,AAAA';
 const legacyNik='3578092603890003',realNip='198512152010122001';
 const roster=[{n:'Dessy Monica',nip:legacyNik,jab:'Analis DCM',foto:'',status:'WFO'}];
 const docs=[{id:'cfg-master',master:{pic:roster}},{id:'cfg-kp',kp:{tims:['Tim CM'],pt:{},ptx:{},asg:{}}}];
 win.S={oneonone:docs,ui:{}};win.actMaster=()=>docs[0].master;win.kpCfg=()=>docs[1].kp;win.actCanEdit=()=>true;
 win.esc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 win.toast=s=>win._toast=s;
 let write=null;win.mtImportCommit=async x=>{write=x;return {updated:1}};
 win.eval(server);win.eval(fs.readFileSync('mt-team-exact/dcm-import-all-52.js','utf8'));win.eval(dialog);
 const api=win.MT_PROFILE_IMPORT;
 const input={oneonone:[
  {id:'cfg-master',master:{pic:[
   {n:'Dessy Monica Wirsal',nip:realNip,jab:'Analis MT',foto:photo,status:'WFH'},
   {n:'Pegawai Baru',nip:'199901012023012001',jab:'Analis',foto:photo}
  ]}},
  {id:'cfg-kp',kp:{tims:['Tim CM'],pt:{'Dessy Monica Wirsal':'Tim CM'}}}
 ]};
 const parsed=api.parse(input);
 assert.equal(parsed.profiles.length,2);
 assert.equal(api.analyze(parsed.profiles[0],roster).kind,'update','16-digit NIK must not be treated as an existing NIP conflict');
 api.open();
 const overlay=parent.window.document.querySelector('body > .cmp50.ov');
 assert(overlay,'dialog must be a top-level overlay, NOT inside tall iframe');
 assert(!win.document.querySelector('.cmp50'),'iframe must not trap modal below fold');
 assert(parent.window.document.getElementById('dcm-profile-compare-style-51'),'CSS must be loaded in parent');
 assert(parent.window.document.querySelector('#cmp-file'),'file input must be visible in parent dialog');
 const file=parent.window.document.querySelector('#cmp-file');
 const json=JSON.stringify(input);
 Object.defineProperty(file,'files',{configurable:true,value:[{size:json.length,text:async()=>json}]});
 file.dispatchEvent(new parent.window.Event('change',{bubbles:true}));
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(parent.window.document.querySelector('#cmp-target').value,'existing:0','same employee recognized despite DCM NIK');
 const nipRow=[...parent.window.document.querySelectorAll('.cmp-row')].find(x=>x.querySelector('label')?.textContent.includes('NIP (18'));
 const nikRow=[...parent.window.document.querySelectorAll('.cmp-row')].find(x=>x.querySelector('label')?.textContent.includes('NIK (16'));
 assert(nipRow&&nikRow);
 assert(!nipRow.textContent.includes(legacyNik),'NIK must not be displayed as NIP');
 assert(nikRow.textContent.includes(legacyNik),'legacy NIK remains visible in separate row');
 const mt=parent.window.document.querySelector('[data-cmp-key="nip"][data-cmp-side="mt"]');
 assert(mt.classList.contains('selected'),'MT NIP must be selected by default');
 const all=parent.window.document.querySelector('#cmp-replace-all');
 assert(all&&!all.disabled);all.checked=true;all.dispatchEvent(new parent.window.Event('change',{bubbles:true}));
 const next=parent.window.document.querySelector('#cmp-save');
 assert(!next.disabled);
 next.click();await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(next.textContent,'Konfirmasi & Simpan','confirmation step visible');
 next.click();await new Promise(resolve=>setTimeout(resolve,35));
 assert(write,'Firebase commit called after final confirmation');
 const people=write.find(x=>x.id==='cfg-master').master.pic;
 assert.equal(people.length,2);
 assert.equal(people[0].nip,realNip,'correct MT NIP saved');
 assert.equal(people[0].nik,undefined,'obsolete DCM NIK is replaced by authoritative MT profile');
 assert.equal(people[0].jab,'Analis MT','MT is authoritative');
 assert.equal(people[0].foto,photo,'photo copied from MT');
 assert(!parent.window.document.querySelector('.cmp50'),'overlay closes only after confirmed save');
 console.log('PASS: true parent-viewport dialog, NIK not NIP, MT authoritative data, new employee, photo, confirm and save');
 parent.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
