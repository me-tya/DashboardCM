'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const base=fs.readFileSync('mt-team-exact/dcm-profile-photo-import-48.js','utf8');
const ui=fs.readFileSync('mt-team-exact/dcm-profile-compare-50.js','utf8');
const context={window:{}};vm.runInNewContext(base,context);vm.runInNewContext(ui,context);
const api=context.window.MT_PROFILE_IMPORT,photo='data:image/png;base64,AAAA';
assert.equal(typeof api.openSideBySide,'function');
assert.equal(api.open,api.openSideBySide);
const source={kind:'mt-tim-pusmantap-profiles',oneonone:[
 {id:'cfg-master',master:{pic:[
  {n:'Dessy Monica Wirsal',nip:'198512152010122001',foto:photo,jab:'Analis Keuangan',hp:'0812',wfhDays:[5]},
  {n:'Dyna Fransisca',nip:'199212242018012004',foto:photo},
  {n:'Pegawai Baru',nip:'199902022022011001',foto:photo}
 ]}},
 {id:'cfg-kp',kp:{tims:['Tim CM','Tim SSB'],pt:{'Dessy Monica Wirsal':'Tim CM'},ptx:{'Dessy Monica Wirsal':['Tim SSB']},asg:{DJPb:['Dessy Monica Wirsal']}}},
 {id:'cfg-kp-contacts',kp:{nama:'Kontak DJPb',unit:'DJPb',nip:'198901012011011001',peran:['cmo'],foto:photo}}
]};
const input=api.parse(source);
const live=[{n:'Dessy Monica',nip:'198512152010122001',jab:'Analis Senior',hp:'',foto:'oldphoto.jpg',wfhDays:[1]},
 {n:'Dina Fransisca',nip:'',jab:'Pranata Komputer',foto:''},
 {n:'Meyka',nip:'199101012016012001',foto:''}];
const docs=[
 {id:'cfg-master',master:{pic:JSON.parse(JSON.stringify(live))}},
 {id:'cfg-kp',kp:{tims:['Tim CM'],pt:{'Dessy Monica':'Tim SSB'},ptx:{},asg:{DJPb:['Meyka']}}},
 {id:'cfg-kp-old',kp:{nama:'Kontak DJPb',unit:'DJPb',nip:'198901012011011001',peran:['pmo'],foto:''}}
];
const baseline=JSON.stringify(live),before=JSON.stringify(docs),options={
 allowSnapshotRoster:true,baselineRoster:baseline,fieldChoices:{0:{jab:'dcm',hp:'mt',foto:'mt',wfhDays:'dcm'}},
 structureChoices:{0:{pt:'dcm',ptx:'mt',asg:'mt'}},importContacts:true
};
const choices={0:'existing:0',1:'skip',2:'skip'};
const result=api.prepare(input,choices,live,docs,{},true,options);
assert.equal(JSON.stringify(docs),before,'preflight must never mutate live data');
assert.equal(result.summary.updated,1);
assert.equal(result.summary.new,0);
assert.equal(result.summary.skipped,2);
const rec=result.docs.find(x=>x.id==='cfg-master').master.pic;
assert.equal(rec.length,3,'no new duplicate');
assert.equal(rec[0].foto,photo,'explicit source choice overwrites old photo');
assert.equal(rec[0].jab,'Analis Senior','explicit Dashboard CM choice keeps job');
assert.equal(rec[0].hp,'0812','source fills selected phone');
assert.equal(rec[0].wfhDays[0],1,'DCM WFH stays');
const kp=result.docs.find(x=>x.id==='cfg-kp').kp;
assert.equal(kp.pt['Dessy Monica'],'Tim SSB','keep DCM main team');
assert.equal(kp.ptx['Dessy Monica'][0],'Tim SSB','MT secondary team used');
assert.equal(kp.asg.DJPb.includes('Dessy Monica'),true);
assert.equal(kp.asg.DJPb.includes('Meyka'),true,'preserve other assignees');
assert.equal(result.summary.contactsAdded,0);
assert.equal(result.summary.contactsUpdated,1);
assert.equal(result.docs.find(x=>x.id==='cfg-kp-old').kp.foto,photo);
const again=api.prepare(input,choices,live,docs,{},true,options);
assert.equal(JSON.stringify(result.docs),JSON.stringify(again.docs),'review and commit must be deterministic');
const keep=api.prepare(input,choices,live,docs,{},false,{allowSnapshotRoster:true,baselineRoster:baseline,fieldChoices:{0:{foto:'dcm',hp:'dcm',jab:'dcm'}},structureChoices:{}});
assert.equal(keep.docs.find(x=>x.id==='cfg-master').master.pic[0].foto,'oldphoto.jpg');
assert.throws(()=>api.prepare(input,choices,[{n:'Changed',nip:'198512152010122001'},...live.slice(1)],docs,{},false,options),/berubah/);
assert.equal(api.analyze(input.profiles[1],live).kind,'review','name variants require review');
assert.throws(()=>api.prepare(input,{1:'existing:2'},live,docs,{},false,{allowSnapshotRoster:true,baselineRoster:baseline,fieldChoices:{},structureChoices:{}}),/tidak lagi valid/);
const manual={allowSnapshotRoster:true,baselineRoster:baseline,fieldChoices:{1:{foto:'mt'}},structureChoices:{},manualTargets:{1:1}};
const m=api.prepare(input,{1:'existing:1'},live,docs,{},false,manual);
assert.equal(m.docs.find(x=>x.id==='cfg-master').master.pic.length,3);
assert.equal(m.docs.find(x=>x.id==='cfg-master').master.pic[1].foto,photo);
const incompatible={...manual,manualTargets:{1:0}};
assert.throws(()=>api.prepare(input,{1:'existing:0'},live,docs,{},false,incompatible),/NIP .*berbeda/);
const css=fs.readFileSync('mt-team-exact/dcm-profile-compare-50.css','utf8');
assert(css.includes('.cmp-row')&&css.includes('.cmp-choice.selected'));
const iframe=fs.readFileSync('tim-pusmantap-mt.html','utf8');
assert(iframe.includes('dcm-profile-compare-50.js')&&iframe.includes('dcm-profile-compare-50.css'));
assert(ui.includes('Semua Dashboard CM')&&ui.includes('Semua Modul Transformasi'));
console.log('PASS: per-field choices, photo override, safe manual pairing, no dupes, two columns and deterministic review.');
