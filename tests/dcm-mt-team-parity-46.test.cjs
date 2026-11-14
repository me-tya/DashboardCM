const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=process.cwd();
const html=fs.readFileSync('tim-pusmantap-mt.html','utf8');
class LocalLoader extends ResourceLoader{
 fetch(url){
  const u=new URL(url);
  if(!u.pathname.startsWith('/DashboardCM/'))return null;
  const name=decodeURIComponent(u.pathname.slice('/DashboardCM/'.length));
  const target=path.join(root,name);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target))return null;
  return Promise.resolve(fs.readFileSync(target));
 }
}
async function main(){
 const errors=[];
 const v=new VirtualConsole();
 v.on('jsdomError',e=>errors.push(e.message));
 v.on('error',e=>errors.push(String(e)));
 const dom=new JSDOM(html,{url:'https://me-tya.github.io/DashboardCM/tim-pusmantap-mt.html',
   resources:new LocalLoader(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:v,
   beforeParse(w){
    w.confirm=()=>true;w.alert=()=>{};
    w.HTMLElement.prototype.scrollIntoView=function(){};
    w.ResizeObserver=undefined;
   }});
 const w=dom.window;
 await new Promise((ok,err)=>{w.addEventListener('load',ok,{once:true});setTimeout(()=>err(Error('scripts did not load')),20000)});
 assert(w.MT_TIM,'Exact original MT_TIM module loaded');
 assert(w.MT_T2,'Exact original MT_T2 module loaded');
 assert.equal(typeof w.mtTeamReady,'function','Compatibility loaded');
 const src=fs.readFileSync('mt-team-exact/source/mt-tim2.js','utf8');
 assert(src.includes('window.MT_T2={page,pubBuild'),'Upstream MT module not modified');
 const snapshot={
  source:'dcm-tim-pusmantap',type:'snapshot',today:'2026-11-14',canEdit:true,
  activities:[{id:'ACT-2026-1114-01',date:'2026-11-14',end:'2026-11-14',time:'09.00–10.30',title:'UAT Proyek Uji Asli',unit:'DJPK',pic:'Contoh Pegawai',people:'Contoh Pegawai',location:'Ruang Uji',category:'Koordinasi',status:'Selesai'}],
  resources:[{id:'r1',name:'Contoh Pegawai',nip:'198501010000000001',job:'Analis',role:'Ketua Tim CM',jenis:'Pegawai',unit:'Pusmantap',wfhDays:[5],leavePlans:[],status:'WFO'}],
  manual:{members:[],teams:{'Contoh Pegawai':'CM'},structural:{},attendance:{},leaves:[],mtState:{docs:[],ui:{}}},
  role:'superadmin',user:'Admin Uji',email:'uji@kemenkeu.go.id'
 };
 w.dispatchEvent(new w.MessageEvent('message',{source:w.parent,origin:w.location.origin,data:snapshot}));
 await new Promise(ok=>setTimeout(ok,100));
 const app=w.document.getElementById('mt-app');
 assert(app&&app.innerHTML.length>100,'Original Tim Pusmantap renders real data');
 assert(app.innerHTML.includes('UAT Proyek Uji Asli'),'Dashboard CM activity appears in MT renderer');
 assert(app.innerHTML.includes('Contoh Pegawai'),'Dashboard CM employee appears in original MT renderer');
 assert(app.querySelector('#t2'),'Original #t2 renderer present');
 const tabs=[...app.querySelectorAll('[data-tv]')].map(x=>x.dataset.tv);
 assert(tabs.includes('highlight'),'Original Highlight visible');
 for(const key of ['agenda','hadir','cuti','tempat','profil']){
  let link=app.querySelector('[data-tv="'+key+'"]');
  assert(link,'Missing original MT section '+key+'; tabs='+tabs);
  link.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
  await new Promise(ok=>setTimeout(ok,15));
  assert(app.querySelector('[data-tv="'+key+'"].t-on'),'Original tab did not activate: '+key);
  assert(!w.document.getElementById('mt-error').textContent,'Render error in '+key);
 }
 assert(!errors.filter(e=>/Uncaught|ReferenceError|SyntaxError|TypeError/.test(e)).length,'Runtime errors: '+errors.join(' | '));
 dom.window.close();
 console.log('PASS: Verbatim MT modules boot with live DCM Activity/Resource, all key section tabs clickable, no JS runtime errors.');
}
main().catch(e=>{console.error(e.stack||e);process.exit(1)});
