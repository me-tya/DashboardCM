const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-login-photo-31.css','utf8');
const start=src.indexOf('function cmUpdateUserPill(){');
const stop=src.indexOf("document.addEventListener('click',e=>{",start);
assert(start>=0 && stop>start,'Original login avatar function must remain in the main application');
const source=src.slice(start,stop);
class Element{
  constructor(id=''){this.id=id;this.children=[];this.parentNode=null;this.dataset={};this._text='';this.attrs={};this.hidden=false;this.classList={hidden:false,toggle:(name,val)=>{if(name==='hidden')this.classList.hidden=!!val}};}
  set textContent(t){this._text=String(t);this.children.forEach(x=>x.parentNode=null);this.children=[]}
  get textContent(){return this._text}
  replaceChildren(...items){this.children.forEach(x=>x.parentNode=null);this.children=[...items];for(const x of items)x.parentNode=this;this._text=''}
  querySelector(s){return s==='img.dcm-login-avatar-photo'?this.children.find(x=>x.className==='dcm-login-avatar-photo')||null:null}
}
const nodes={userPill:new Element('userPill'),btnGoogleLogin:new Element('btnGoogleLogin'),userAvatar:new Element('userAvatar'),userName:new Element('userName'),btnLogout:new Element('btnLogout')};
const photoElements=[];
let currentPerson=null,currentAuth=null;
const document={
 getElementById:k=>nodes[k]||null,
 createElement:tag=>{
   assert.equal(tag,'img');
   const image={tagName:'IMG',parentNode:null,className:'',alt:'',src:'',onerror:null,remove(){if(this.parentNode){const par=this.parentNode;par.children=par.children.filter(x=>x!==this);this.parentNode=null}}};
   photoElements.push(image);return image;
 }
};
const context={document,window:{fbAuth:{currentUser:null}},cmGuestOffline:null,cmCurrentPerson:()=>currentPerson,cmInitials:n=>n.trim().split(/\s+/).map(x=>x[0]).join('').toUpperCase().slice(0,2),cmUnitByCode:()=>null,uiText:(_,id)=>id};
vm.createContext(context);vm.runInContext(source,context,{filename:'cmUpdateUserPill'});
function render(person,user){
 currentPerson=person;currentAuth=user;context.window.fbAuth.currentUser=user;
 context.cmUpdateUserPill();
 return nodes.userAvatar;
}
const p={name:'Pegawai Contoh',email:'contoh@kemenkeu.go.id',kind:'google'};
const google={isAnonymous:false,photoURL:'https://lh3.googleusercontent.com/photo123',providerData:[]};
const a=render(p,google);
assert.equal(a.children.length,1,'Google profile image is rendered');
assert.equal(a.children[0].src,google.photoURL);
assert.equal(a.children[0].className,'dcm-login-avatar-photo');
assert.equal(a.children[0].referrerPolicy,'no-referrer');
assert.equal(nodes.userName.textContent,p.name);
const first=a.children[0];
render(p,google);
assert.equal(a.children[0],first,'Repeated role refresh does not refetch or flash the same photo');
first.onerror();
assert.equal(a.textContent,'PC','Unavailable photo returns to initials');
render(p,google);
assert.equal(a.textContent,'PC','Failed URL should not reload endlessly');
assert.equal(a.children.length,0);
const second={...google,photoURL:'',providerData:[{providerId:'google.com',photoURL:'https://lh3.googleusercontent.com/provider_photo'}]};
render(p,second);
assert.equal(a.children[0].src,second.providerData[0].photoURL,'Uses Google provider profile as fallback');
render(p,{...google,photoURL:'javascript:alert(1)',providerData:[]});
assert.equal(a.textContent,'PC','Never render non-HTTPS avatar URLs');
render(p,{...google,photoURL:''});
assert.equal(a.textContent,'PC','Google accounts without photos show initials');
render({name:'Tamu Contoh',email:'tamu@example.com',kind:'guest',unit:''},{isAnonymous:true,photoURL:'https://example.com/anonymous.png'});
assert.equal(a.textContent,'TC','Guest login keeps initials, not provider photo');
render(null,null);
assert(nodes.userPill.classList.hidden,'Logout hides avatar');
assert(!nodes.btnGoogleLogin.classList.hidden,'Login control is restored after logout');
assert(/#dcmRefAvatarTrigger #userAvatar \.dcm-login-avatar-photo/.test(css));
assert(css.includes('object-fit:cover!important'));
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
console.log('PASS: Google profile, provider fallback, broken/missing image, safe URL, guest initials, logout and existing avatar menu');
