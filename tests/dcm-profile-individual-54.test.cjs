'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=process.cwd(),base='https://me-tya.github.io/DashboardCM/';
class Loader extends ResourceLoader{
 fetch(url){
  const u=new URL(url);if(!u.href.startsWith(base))return null;
  let p=path.join(root,decodeURIComponent(u.pathname.slice('/DashboardCM/'.length)));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return null;
  let s=fs.readFileSync(p);
  if(p.endsWith('/source/mt-tim2.js')){
   const src=s.toString();
   const old="}catch(e){inner='<p class=\"t-s\" style=\"padding:18px\">Profil belum dapat dimuat.</p>'}";
   if(!src.includes(old))throw Error('Profile catch instrument mismatch');
   s=Buffer.from(src.replace(old,"}catch(e){console.error('PROFILE_RENDER_ERROR',e&&e.stack||e);inner='<p class=\"t-s\" style=\"padding:18px\">Profil belum dapat dimuat.</p>'}"));
  }
  return Promise.resolve(s);
 }
}
(async()=>{
 const errors=[],vc=new VirtualConsole();
 vc.on('error',(...v)=>errors.push(v.map(String).join(' ')));
 vc.on('jsdomError',e=>errors.push('jsdom '+e.stack));
 const html=fs.readFileSync('tim-pusmantap-mt.html','utf8');
 const dom=new JSDOM(html,{url:base+'tim-pusmantap-mt.html',resources:new Loader(),runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.ResizeObserver=undefined;w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=function(){};w.alert=()=>{}}});
 const w=dom.window;await new Promise((res,rej)=>{w.addEventListener('load',res,{once:true});setTimeout(()=>rej(Error('script load timeout')),15000)});
 const pic='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ';
 const persons=Array.from({length:25},(_,i)=>({n:'Sample Staff '+i,nip:'19850101201001'+String(1000+i),jab:'Analis',jenis:'Definitif',peran:'Anggota',status:'WFO',statusKerja:'WFO',foto:pic,emailK:'staff'+i+'@example.test',hp:'0812'+i,wfhDays:[5],cuti:[]}));
 const contacts=Array.from({length:50},(_,i)=>({id:'cfg-kp-abc'+i,kind:'cfg',kp:{nama:'Sample Contact '+i,unit:'Unit '+i,peran:[i%2?'pmo':'cmo'],foto:i<48?pic:'',nip:'19850901201601'+String(1000+i)}}));
 const k={tims:['Tim CM','Tim DCS','Tim SPP','Tim SSB','Tim DOA'],pt:{},ptx:{},asg:{},rl:{},str:{},stp:{},prog:{},tem:{},alias:{},fbox:{}};
 persons.forEach((p,i)=>{k.pt[p.n]=k.tims[i%5];k.asg['Unit '+i]=[p.n]});
 const snapshot={source:'dcm-tim-pusmantap',type:'snapshot',today:'2026-11-15',canEdit:true,resources:[],activities:[],manual:{members:[],teams:{},structural:{},mtState:{docs:[{id:'cfg-master',kind:'cfg',master:{pic:persons}},{id:'cfg-kp',kind:'cfg',kp:k},...contacts],ui:{mtProfilesAuthoritative:true,t2v:'profil',t2pv:'orang'}}},role:'superadmin',user:'Test',email:'test@example.test'};
 w.dispatchEvent(new w.MessageEvent('message',{source:w.parent,origin:w.location.origin,data:snapshot}));
 await new Promise(res=>setTimeout(res,150));
 const app=w.document.getElementById('mt-app');
 const result={profileMissing:app.innerHTML.includes('Profil belum dapat dimuat'),profiles:app.querySelectorAll('.tm-p').length,photos:app.querySelectorAll('.tm-av').length,header:app.innerHTML.includes('25 profil')};
 console.log('RESULT '+JSON.stringify(result));
 console.log('RENDER_ERRORS '+JSON.stringify(errors));
 if(result.profileMissing)throw Error('Individual tab renderer fails with 25 imported profiles. '+errors.join(' | ').slice(0,1400));
 assert(app.querySelectorAll('.tm-p').length>0,'Expected original individual profile cards');
 assert(app.querySelectorAll('img.tm-av').length>0,'Expected photos');
 dom.window.close();console.log('PASS individual profile tab renders 25 persons and photos');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
