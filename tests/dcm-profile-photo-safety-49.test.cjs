'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('mt-team-exact/dcm-profile-photo-import-48.js','utf8'),ctx);
const api=ctx.window.MT_PROFILE_IMPORT;
assert.equal(typeof api.analyze,'function');assert.equal(typeof api.prepare,'function');
const photo='data:image/png;base64,AAAA';
const source={kind:'mt-tim-pusmantap-profiles',oneonone:[
 {id:'cfg-master',kind:'cfg',master:{pic:[
  {n:'Dessy Monica Wirsal',nip:'198512152010122001',jab:'Analis Keuangan',foto:photo,hp:'08123456',cuti:[{mulai:'2026-11-20',selesai:'2026-11-21',jenis:'Cuti Tahunan'}]},
  {n:'Dyna Fransisca',nip:'199212242018012004',jab:'Pranata Komputer',foto:photo},
  {n:'Ainurrisya Zafirah',nip:'199503292018012004',foto:photo},
  {n:'Raisa Baru',nip:'199904012021011001',foto:photo}
 ]}},
 {id:'cfg-kp',kind:'cfg',kp:{tims:['Tim CM','Tim SSB'],pt:{'Dessy Monica Wirsal':'Tim CM','Ainurrisya Zafirah':'Tim SSB'},asg:{DJPb:['Dessy Monica Wirsal']}}},
 {id:'cfg-kp-source-01',kind:'cfg',kp:{unit:'DJPb',nama:'Kontak Unit',nip:'198707012012011001',hp:'0812',foto:photo,peran:['cmo']}}
]};
const parsed=api.parse(source);assert.equal(parsed.profiles.length,4);
const roster=[
 {n:'Dessy Monica',nip:'198512152010122001',jab:'Analis Senior',foto:'',hp:''},
 {n:'Dina Fransisca',nip:'',jab:'Pranata Komputer',foto:''},
 {n:'Ainurrisya Zafirah',nip:'199503292018012004',foto:'lama.jpg'},
 {n:'Arifudin Miftakhul Huda',nip:'',foto:''}
];
const k=(name)=>parsed.profiles.find(x=>x.n===name);
const a=api.analyze;
assert.equal(a(k('Dessy Monica Wirsal'),roster).kind,'update','matching NIP plus abbreviated display name');
assert.equal(a(k('Dessy Monica Wirsal'),roster).index,0);
assert.equal(a(k('Dyna Fransisca'),roster).kind,'review','a similar name cannot auto-update');
assert.equal(a(k('Ainurrisya Zafirah'),roster).kind,'update','same NIP/name');
assert.equal(a(k('Raisa Baru'),roster).kind,'new','truly unseen person requires manual add');
assert.equal(a({n:'Ainurrisya Zafirah',nip:'111111111111111111'},roster).kind,'conflict','different NIP for same name must block');
assert.equal(a({n:'Dessy Monica Wirsal',nip:'198512152010122001'},[roster[0],roster[0]]).kind,'review','duplicate target NIP');
const docs=[
 {id:'cfg-master',kind:'cfg',master:{pic:roster}},
 {id:'cfg-kp',kind:'cfg',kp:{tims:['Tim CM'],pt:{'Dessy Monica':'Tim SSB'},asg:{DJPb:['Arifudin Miftakhul Huda']}}},
 {id:'cfg-kp-dcm-old',kind:'cfg',kp:{unit:'DJPb',nama:'Kontak Unit',nip:'198707012012011001',hp:'',peran:['pmo']}}
];
const choices={0:'existing:0',1:'skip',2:'existing:2',3:'skip'};
const base=JSON.stringify(docs);
const pr=api.prepare(parsed,choices,roster,docs,{},false);
assert.equal(JSON.stringify(docs),base,'preflight must not change live data');
assert.equal(pr.summary.updated,2);assert.equal(pr.summary.new,0);
assert.equal(pr.summary.skipped,2);assert.equal(pr.summary.photosAdded,1);
const out=pr.docs.find(x=>x.id==='cfg-master').master.pic;
assert.equal(out.length,4,'must not add duplicate employees');
assert.equal(out[0].n,'Dessy Monica','keep existing canonical name');
assert.equal(out[0].jab,'Analis Senior','keep prefilled job');
assert.equal(out[0].foto,photo,'fill missing photo');
assert.equal(out[0].hp,'08123456','fill missing phone');
assert.equal(out[0].cuti[0].mulai,'2026-11-20','copy leave plans');
assert.equal(out[2].foto,'lama.jpg','never overwrite an existing photo');
const withTeam=api.prepare(parsed,choices,roster,docs,{},true);
const kd=withTeam.docs.find(x=>x.id==='cfg-kp').kp;
assert.equal(kd.pt['Dessy Monica'],'Tim SSB','keep assigned team');
assert.equal(kd.asg.DJPb.includes('Dessy Monica'),true,'map source name to canonical existing target');
assert.equal(kd.asg.DJPb.includes('Arifudin Miftakhul Huda'),true,'preserve existing assignee');
assert.equal(withTeam.summary.contactsAdded,0,'do not duplicate contacts with identical NIP/unit');
assert.equal(withTeam.summary.contactsUpdated,1);
assert.equal(withTeam.docs.find(x=>x.id==='cfg-kp-dcm-old').kp.foto,photo);
assert.equal(withTeam.docs.find(x=>x.id==='cfg-kp-dcm-old').kp.peran.includes('pmo'),true);
assert.equal(withTeam.docs.find(x=>x.id==='cfg-kp-dcm-old').kp.peran.includes('cmo'),true);
assert.throws(()=>api.prepare(parsed,{1:'add'},roster,docs,{},false),/mungkin sudah ada|duplikat/,'review must not be allowed to add');
assert.throws(()=>api.prepare(parsed,{0:'existing:1'},roster,docs,{},false),/tidak lagi valid/,'cannot select unrelated employee');
const added=api.prepare(parsed,{3:'add'},roster,docs,{},false);
assert.equal(added.summary.new,1);
assert.equal(added.docs.find(x=>x.id==='cfg-master').master.pic.length,5);
assert.throws(()=>api.prepare(parsed,{3:'add'},roster.concat([{n:'Raisa Baru',nip:'199904012021011001'}]),docs,{},false),/belum siap|mungkin sudah ada|duplikat|sudah ada/);
const ui=fs.readFileSync('mt-team-exact/dcm-profile-photo-import-48.js','utf8');
assert(ui.includes('Perlu verifikasi')&&ui.includes('Belum terdaftar')&&ui.includes('Konflik NIP'));
assert(ui.includes("button.onclick=startReview"));
assert(ui.includes('await w.mtImportCommit(now.docs)'),'must wait for server confirmation');
const shell=fs.readFileSync('mt-team-exact/dcm-mt-team-compat-46.js','utf8');
assert(shell.includes('function mtImportCommit(docs)')&&shell.includes('__mtImportPending.has(ev.data.requestId)'));
console.log('PASS: safe NIP/name matching, review-only variants, no duplicate insert, preflight nonmutation, photos, contacts, team mapping, acknowledgement.');
