'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=process.cwd(),base='https://me-tya.github.io/DashboardCM/';
class Loader extends ResourceLoader{
 fetch(url){const u=new URL(url);if(!u.href.startsWith(base))return null;
  const f=path.join(root,decodeURIComponent(u.pathname.slice('/DashboardCM/'.length)));
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f))return null;
  return Promise.resolve(fs.readFileSync(f))}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('error',(...parts)=>errors.push(parts.join(' ')));
 vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync('tim-pusmantap-mt.html','utf8'),{
  url:base+'tim-pusmantap-mt.html',resources:new Loader(),runScripts:'dangerously',
  pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){w.confirm=()=>true;w.ResizeObserver=undefined;w.HTMLElement.prototype.scrollIntoView=function(){}}
 });
 const w=dom.window;
 await new Promise((res,rej)=>{w.addEventListener('load',res,{once:true});setTimeout(()=>rej(Error('scripts not loaded')),20000)});
 assert(w.MT_T2&&w.MT_TIM&&w.MT_PROFILE_UNIT_TOOLBAR,'original apps plus filter must load');
 const names=Array.from({length:25},(_,i)=>'Pegawai '+String(i+1).padStart(2,'0'));
 const teams=['Tim CM','Tim SPP','Tim DCS','Tim DOA','Tim SSB'];
 const pic=names.map((n,i)=>({n,nip:'19860101201601'+String(i).padStart(4,'0'),jab:'Analis '+i,jenis:'Definitif',status:'WFO',wfhDays:[5],peran:'Anggota'}));
 const units=['DJP','DJA','DJPb','DJPK','DJBC'];
 const pt={};names.forEach((n,i)=>pt[n]=teams[i%5]);
 const asg={DJP:[names[0],names[1]],DJA:[names[2]],DJPb:[names[3]],DJPK:[names[4]],DJBC:[names[5]]};
 const contacts=Array.from({length:50},(_,i)=>({id:'cfg-kp-contact-'+i,kind:'cfg',kp:{nama:'Kontak '+i,unit:units[i%5],nip:'19850101201201'+String(i).padStart(4,'0'),peran:[i%3===0?'pmo':i%3===1?'cmo':'probis'],status:'Aktif'}}));
 const kp={tims:teams,pt,ptx:{},asg,rl:{},str:{},stp:{},tem:{},prog:{}};
 const snapshot={source:'dcm-tim-pusmantap',type:'snapshot',today:'2026-11-15',canEdit:true,
  resources:[],activities:[],manual:{members:[],teams:{},structural:{},mtState:{docs:[
    {id:'cfg-master',kind:'cfg',master:{pic}},{id:'cfg-kp',kind:'cfg',kp},...contacts
  ],ui:{t2v:'profil',t2pv:'unit',t2pum:'pic',mtProfilesAuthoritative:true}}},
  role:'superadmin',email:'qa@example.test',user:'QA'};
 w.dispatchEvent(new w.MessageEvent('message',{source:w.parent,origin:w.location.origin,data:snapshot}));
 await sleep(130);
 const doc=w.document,app=doc.querySelector('#mt-app'),rootPv=()=>doc.querySelector('#t2 .t-pvb.t-pv-unit');
 assert(rootPv(),'profile unit view should render');
 assert.equal(doc.querySelectorAll('#t2 .dcm-pu-toolbar').length,1,'exactly one toolbar');
 assert(doc.querySelector('.dcm-pu-toolbar .t-pum'),'mode choices moved into top toolbar');
 assert(doc.querySelector('.dcm-pu-toolbar [data-tpuq]'),'search moved into top toolbar');
 assert(!doc.querySelector('.t-pul > .t-pul-s'),'no duplicate search in sidebar');
 const team=doc.querySelector('[data-dcm-pu-team]');
 assert.equal(team.options.length,6,'dropdown contains all five teams');
 assert.equal(doc.querySelector('.dcm-pu-toolbar [data-tpum="pic"].t-on')!==null,true);
 const beforeCount=doc.querySelectorAll('.t-pul-l .t-pir').length;
 assert(beforeCount>2,'PMO/CMO source contains many employees');
 team.value='Tim CM';team.dispatchEvent(new w.Event('change',{bubbles:true}));
 await sleep(15);
 const visiblePic=[...doc.querySelectorAll('.t-pul-l .t-pir')].filter(el=>!el.hidden);
 assert(visiblePic.length>0&&visiblePic.length<beforeCount,'team filter must narrow staff list');
 assert(visiblePic.every(el=>pt[el.dataset.tpip]==='Tim CM'),'only selected team');
 assert.equal(doc.querySelector('[data-dcm-pu-team]').value,'Tim CM','selection retained');
 const search=doc.querySelector('.dcm-pu-toolbar [data-tpuq]');
 search.value='Pegawai 01';search.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(15);
 const found=[...doc.querySelectorAll('.t-pul-l .t-pir')].filter(el=>!el.hidden);
 assert.equal(found.length,1,'search combines with team filter');
 assert.equal(found[0].dataset.tpip,'Pegawai 01');
 assert.equal(doc.querySelector('.dcm-pu-toolbar [data-tpuq]').value,'Pegawai 01');
 const switcher=doc.querySelector('[data-tpum="unit"]');switcher.click();await sleep(20);
 assert(rootPv(),'unit mode remains visible');
 assert(doc.querySelector('.dcm-pu-toolbar [data-tpum="unit"].t-on'),'unit mode selected');
 assert.equal(doc.querySelector('[data-dcm-pu-team]').value,'Tim CM','team preserved when changing mode');
 assert.equal(doc.querySelector('[data-tpuq]').value,'','query reset for unit-specific search');
 const unitsVisible=[...doc.querySelectorAll('.t-pul-l .t-pur')].filter(el=>!el.hidden);
 assert(unitsVisible.length>0,'at least one unit assigned to Tim CM');
 assert(unitsVisible.every(el=>(asg[el.dataset.tpu]||[]).some(n=>pt[n]==='Tim CM')),'units filtered by team assignments');
 const unitInput=doc.querySelector('.dcm-pu-toolbar [data-tpuq]');
 unitInput.value='no-such-unit';unitInput.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(10);
 assert.equal([...doc.querySelectorAll('.t-pul-l .t-pur')].filter(x=>!x.hidden).length,0);
 assert.equal(doc.querySelector('.dcm-pu-empty').hidden,false,'empty-state visible');
 assert.equal(doc.querySelector('.t-pur-d').hidden,true,'old unit detail hidden for no result');
 const css=fs.readFileSync('mt-team-exact/dcm-profile-unit-toolbar-55.css','utf8');
 assert(css.includes('input:focus-visible{outline:none!important'),'gold focus outline removed on search only');
 assert(!errors.some(e=>/TypeError|ReferenceError|SyntaxError|Uncaught/.test(e)),'runtime errors: '+errors.join(' | '));
 assert.equal(w.S.oneonone.find(d=>d.id==='cfg-master').master.pic.length,25,'profiles intact');
 console.log('PASS: mode switching, team + search combined filters, unit assignment filters, no duplicate controls, no gold search ring, data retained');
 dom.window.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
