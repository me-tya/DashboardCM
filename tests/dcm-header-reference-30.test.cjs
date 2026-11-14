const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('dcm-header-reference-30.js','utf8');
const css=fs.readFileSync('dcm-header-reference-30.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const listeners={},registry={};
class Element{
 constructor(tag,id='',cls=''){this.tagName=tag;this.id=id;this.className=cls;this.children=[];this.parentNode=null;this.attrs={};this.handlers={};this.hidden=false;this.textContent='';this._innerHTML='';this.classList={items:new Set(cls.split(/\s+/).filter(Boolean)),add:x=>this.classList.items.add(x),remove:x=>this.classList.items.delete(x),contains:x=>this.classList.items.has(x)};if(id)registry[id]=this;}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id'){this.id=v;registry[v]=this}}
 getAttribute(k){return this.attrs[k]}
 addEventListener(k,cb){this.handlers[k]=cb}
 append(...nodes){for(const n of nodes)this.appendChild(n)}
 appendChild(n){if(n.parentNode){const a=n.parentNode.children;const i=a.indexOf(n);if(i>=0)a.splice(i,1);}n.parentNode=this;this.children.push(n);return n}
 insertBefore(n,sibling){if(n.parentNode){const a=n.parentNode.children;const i=a.indexOf(n);if(i>=0)a.splice(i,1);}const i=this.children.indexOf(sibling);this.children.splice(i>=0?i:0,0,n);n.parentNode=this;}
 querySelector(sel){
  if(sel==='.topbar-actions')return registry.actions;
  if(sel==='.brand-text p')return {textContent:'Pusat Manajemen Transformasi dan Perubahan (Pusmantap) — BaTii'};
  if(sel==='button:not(.hidden)')return {focus(){}};
  return null;
 }
 contains(n){if(this===n)return true;return this.children.some(c=>c.contains?.(n))}
 closest(sel){return null}
}
const doc={readyState:'complete',getElementById:k=>registry[k]||null,createElement:t=>new Element(t),createTextNode:t=>{const e=new Element('text');e.textContent=t;return e;},addEventListener:(n,fn)=>{listeners[n]=fn}};
const header=new Element('header','appHeader');
const actions=new Element('div','actions','topbar-actions');
header.appendChild(actions);
const auth=new Element('div','authPill');
const login=new Element('button','btnGoogleLogin');
const pill=new Element('div','userPill','user-pill');
const av=new Element('span','userAvatar');
const name=new Element('span','userName');name.textContent='Atitya Pritasari';
const role=new Element('span','cmRoleBadge');role.textContent='SUPERADMIN';
const setting=new Element('button','btnAccessAdmin');
const logout=new Element('button','btnLogout');
pill.append(av,name,role,setting,logout);auth.append(login,pill);
const storage=new Element('div','storagePill');
const bell=new Element('button','btnReminderCenter');
const guide=new Element('button','cmGuideToggle');
const lang=new Element('button','btnLangToggle');
actions.append(auth,storage,bell,lang,guide);
let help=0,manual=0;
const ctx={window:{},document:doc,cmOpenContextHelp:()=>help++,cmOpenUserManual:(id)=>{assert.equal(id,'getting-started');manual++},console};
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'dcm-header-reference-30.js'});
const status=registry.dcmRefStatus;
const menu=registry.dcmRefUserMenu,trigger=registry.dcmRefAvatarTrigger;
assert(status&&menu&&trigger,'Must build status and account flyout');
const expected=['dcmRefStatus','dcmRefHelp','dcmRefBook','btnReminderCenter','cmGuideToggle','authPill'];
const actual=actions.children.filter(x=>expected.includes(x.id)).map(x=>x.id);
assert.deepEqual(actual,expected,'Header should match exactly status-help-book-bell-guide-account');
assert.equal(storage.parentNode,status,'Existing sync indicator is reused');
assert.equal(bell.parentNode,actions,'Existing notification button is reused');
assert.equal(lang.parentNode.className,'dcm-ref-language','Existing language control is preserved and relocated to dropdown');
assert.equal(setting.parentNode,menu,'Original authorized Settings button is reused');
assert.equal(logout.parentNode,menu,'Original Logout button is reused');
assert.equal(role.parentNode.className,'dcm-ref-user-info','Original role badge stays data-authoritative');
assert.equal(av.parentNode,trigger,'Original live initials remain within avatar');
assert.equal(registry.dcmRefRole.textContent,'Superadmin');
assert.equal(registry.dcmRefOrg.textContent,'BaTii (Pusmantap)');
assert.equal(menu.hidden,true);
registry.dcmRefHelp.handlers.click();registry.dcmRefBook.handlers.click();
assert.equal(help,1);assert.equal(manual,1);
trigger.handlers.click({preventDefault(){},stopPropagation(){}});
assert.equal(menu.hidden,false);
assert.equal(trigger.attrs['aria-expanded'],'true');
listeners.keydown({key:'Escape'});
assert.equal(menu.hidden,true);
assert.equal(trigger.attrs['aria-expanded'],'false');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
for(const selector of ['#dcmRefStatus','#dcmRefOrg','#dcmRefAvatarTrigger','#dcmRefUserMenu[hidden]',
'#cmGuideToggle','#btnReminderCenter','#btnAccessAdmin.hidden']){
 assert(css.includes(selector),'Style missing '+selector);
}
for(const id of ['btnReminderCenter','cmRoleBadge','btnAccessAdmin','btnLangToggle','btnLogout','userPill','authPill','userAvatar']){
 assert(index.includes('id="'+id+'"'),'Original app control missing '+id);
}
console.log('PASS original app handlers preserved; exact toolbar order, context help/manual, menu access, sync, role and avatar');
