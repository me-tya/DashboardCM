'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=process.cwd(),base='https://me-tya.github.io/DashboardCM/';
class Loader extends ResourceLoader{
 fetch(url){
  const u=new URL(url);if(!u.href.startsWith(base))return null;
  const p=path.join(root,decodeURIComponent(u.pathname.slice('/DashboardCM/'.length)));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return null;
  return Promise.resolve(fs.readFileSync(p));
 }
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const errors=[],vc=new VirtualConsole();
 vc.on('error',(...a)=>errors.push(a.join(' ')));vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync('tim-pusmantap-mt.html','utf8'),{
  url:base+'tim-pusmantap-mt.html',resources:new Loader(),runScripts:'dangerously',
  pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){w.confirm=()=>true;w.ResizeObserver=undefined;w.HTMLElement.prototype.scrollIntoView=function(){}}
 });
 const w=dom.window;
 await new Promise((res,rej)=>{w.addEventListener('load',res,{once:true});setTimeout(()=>rej(new Error('App scripts did not load')),20000)});
 assert(w.MT_PROFILE_UNIT_TOOLBAR&&w.DCM_PROFILE_INDIVIDUAL_56,'both new and existing profile enhancers loaded');
 const people=Array.from({length:25},(_,i)=>({n:'Pegawai '+String(i+1).padStart(2,'0'),nip:'19850101201601'+String(i).padStart(4,'0'),jab:'Analis',jenis:'Definitif',status:'WFO',wfhDays:[5],foto:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ'}));
 const teamNames=['Tim CM','Tim DCS','Tim SPP','Tim SSB','Tim DOA'];
 const pt={};people.forEach((p,i)=>pt[p.n]=teamNames[i%5]);
 const kp={tims:teamNames,pt,ptx:{},asg:{DJP:[people[0].n,people[1].n],DJA:[people[2].n]},rl:{},str:{},stp:{},tem:{},prog:{}};
 const contacts=Array.from({length:50},(_,i)=>({id:'cfg-kp-unit-'+i,kind:'cfg',kp:{nama:'Kontak '+i,unit:i%2?'DJP':'DJA',nip:'19900101201801'+String(i).padStart(4,'0'),peran:['pmo']}}));
 const snapshot={source:'dcm-tim-pusmantap',type:'snapshot',today:'2026-11-15',canEdit:true,
  resources:[],activities:[],manual:{members:[],teams:{},structural:{},mtState:{docs:[
   {id:'cfg-master',kind:'cfg',master:{pic:people}},
   {id:'cfg-kp',kind:'cfg',kp},...contacts
  ],ui:{t2v:'profil',t2pv:'orang',mtProfilesAuthoritative:true}}},
  role:'superadmin',email:'qa@example.test',user:'QA'};
 w.dispatchEvent(new w.MessageEvent('message',{source:w.parent,origin:w.location.origin,data:snapshot}));
 await delay(130);
 const doc=w.document;
 const top=doc.querySelector('#t2 .t-pvw.dcm-pi-top-tabs');
 assert(top,'Profile tab header exists');
 const bar=top.querySelector('#mt-import-bar');
 assert(bar,'Import button moved inside same tab row');
 assert(top.querySelector('#mt-import-profiles'),'Import button at end of tab row');
 assert(top.querySelector('.t-pvs [data-tpv="tmp"]'),'Temporary staff tab remains');
 assert.equal(top.querySelectorAll('#mt-import-profiles').length,1,'no duplicate import button');
 assert(doc.querySelector('#mt-import-state').textContent.includes('25 profil'),'status preserved');
 const body=doc.querySelector('#t2 .t-pvb.t-pv-orang .t2-old');
 const kpi=body.querySelector('.tm-kpis');
 const toolbar=body.querySelector(':scope > .dcm-pi-filter-toolbar');
 assert(kpi&&toolbar&&kpi.nextElementSibling===toolbar,'one-row toolbar immediately below KPI cards');
 assert(toolbar.querySelector('[data-tmteam]'),'original team dropdown moved');
 assert(toolbar.querySelector('[data-tmq]'),'original search moved');
 assert(toolbar.querySelector('[data-act="tmAdd"]'),'original add employee action retained');
 assert(toolbar.querySelector('[data-act="kpTimAdd"]'),'original add team action retained');
 assert(!body.querySelector('.tm-left .tm-tsel')&&!body.querySelector('.tm-left .tm-search'),'no duplicate filter on left');
 assert(doc.querySelector('.t-pv-orang .tm-right>.tm-dh'),'selected employee header unchanged structurally');
 const details=doc.querySelector('.t-pv-orang .tm-right'),unitsBefore=details.querySelector('.tm-uh')?.outerHTML;
 assert(unitsBefore?.includes('Unit dampingan'),'original unit section intact');
 const search=toolbar.querySelector('[data-tmq]');
 search.value='Pegawai 01';search.dispatchEvent(new w.Event('input',{bubbles:true}));await delay(15);
 assert([...doc.querySelectorAll('.tm-list .tm-p')].some(p=>p.dataset.search?.includes('pegawai 01')&&p.dataset.sh!== '1'),'search works');
 assert([...doc.querySelectorAll('.tm-list .tm-p')].filter(p=>p.dataset.sh==='1').length>0,'other employees filtered out');
 assert.equal(doc.querySelector('.tm-right .tm-uh')?.outerHTML,unitsBefore,'unit section not changed by search');
 // Team dropdown still triggers original data-driven filter and rerender.
 const sel=doc.querySelector('.dcm-pi-filter-toolbar [data-tmteam]');
 sel.value='Tim CM';sel.dispatchEvent(new w.Event('change',{bubbles:true}));await delay(30);
 assert(doc.querySelector('.dcm-pi-filter-toolbar'),'toolbar recreated after team selection');
 assert.equal(doc.querySelector('[data-tmteam]').value,'Tim CM');
 assert.equal(doc.querySelector('.dcm-pi-filter-toolbar [data-tmq]').value,'Pegawai 01','search text survives rerender');
 assert(doc.querySelector('.t-pvw.dcm-pi-top-tabs #mt-import-profiles'),'import button survives rerender');
 // Both other profile tabs still render; import button stays aligned.
 doc.querySelector('[data-tpv="unit"]').click();await delay(35);
 assert(doc.querySelector('.dcm-pu-toolbar'),'existing unit toolbar untouched');
 assert(doc.querySelector('.t-pvw.dcm-pi-top-tabs #mt-import-profiles'),'button remains aligned with tabs in unit view');
 doc.querySelector('[data-tpv="orang"]').click();await delay(30);
 assert(doc.querySelector('.dcm-pi-filter-toolbar'),'return to individual profile');
 assert.equal(doc.querySelectorAll('.dcm-pi-filter-toolbar').length,1,'single toolbar after navigation');
 assert(doc.querySelector('.t-pvw.dcm-pi-top-tabs #mt-import-profiles'),'import button still present');
 const css=fs.readFileSync('mt-team-exact/dcm-profile-individual-56.css','utf8');
 assert(css.includes('.tm-right>.tm-dh{background:linear-gradient'),'selected profile has navy frame style');
 assert(css.includes('grid-template-columns:minmax(190px'),'horizontal filter sizing provided');
 assert(!css.includes('.tm-uh{')&&!css.includes('.tm-ub{'),'no styles for Unit dampingan');
 assert(!errors.some(e=>/ReferenceError|TypeError|SyntaxError|Uncaught/.test(e)),'runtime error '+errors.join(' | '));
 assert.equal(w.S.oneonone.find(d=>d.id==='cfg-master').master.pic.length,25,'no data modified');
 console.log('PASS: filter below four KPI cards; original team+search functional; import beside profile tabs; selected profile framed; unit unchanged');
 dom.window.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
