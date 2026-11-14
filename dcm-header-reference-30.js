/* Dashboard CM 261114-DCM-30: compact reference header controls.
 * Reuses original live status, notification, language, permissions and account
 * controls; creates only two help shortcuts and a profile dropdown.
 */
(function(){
  'use strict';
  if(window.DCM_REFERENCE_HEADER_30)return;
  window.DCM_REFERENCE_HEADER_30=true;
  function id(v){return document.getElementById(v)}
  function el(tag,cls,attrs){
    var node=document.createElement(tag);
    if(cls)node.className=cls;
    Object.keys(attrs||{}).forEach(function(k){node.setAttribute(k,attrs[k])});
    return node;
  }
  var svgs={
    help:'<circle cx="12" cy="12" r="9"></circle><path d="M9.4 9a2.7 2.7 0 1 1 4.5 2c-1 .8-1.9 1.2-1.9 2.7"></path><circle cx="12" cy="17.2" r=".65" fill="currentColor" stroke="none"></circle>',
    book:'<path d="M12 5.5C9.2 3.8 6.1 3.5 2.5 4.4v14.2c3.7-1 6.8-.5 9.5 1.3 2.7-1.8 5.8-2.3 9.5-1.3V4.4C18 3.5 14.8 3.8 12 5.5Z"></path><path d="M12 5.5v14.4"></path>'
  };
  function iconButton(name,svg,handler){
    var b=el('button','dcm-ref-icon',{id:name,type:'button',title:name==='dcmRefHelp'?'Bantuan sesuai menu aktif':'Buku Panduan Pengguna','aria-label':name==='dcmRefHelp'?'Bantuan sesuai menu aktif':'Buku Panduan Pengguna'});
    b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+svg+'</svg>';
    b.addEventListener('click',handler);
    return b;
  }
  function divider(){return el('span','dcm-ref-divider',{'aria-hidden':'true'})}
  function install(){
    var header=id('appHeader'),actions=header&&header.querySelector('.topbar-actions');
    var auth=id('authPill'),pill=id('userPill'),avatar=id('userAvatar'),bell=id('btnReminderCenter');
    var guide=id('cmGuideToggle'),storage=id('storagePill'),lang=id('btnLangToggle');
    if(!actions||!auth||!pill||!avatar||!bell||!guide||!storage||!lang||id('dcmRefStatus'))return;
    var roleBadge=id('cmRoleBadge'),name=id('userName'),settings=id('btnAccessAdmin'),logout=id('btnLogout');
    var status=el('div','dcm-ref-status',{id:'dcmRefStatus'});
    var roleLabel=el('span','dcm-ref-role',{id:'dcmRefRole'});
    var orgLabel=el('span','dcm-ref-org',{id:'dcmRefOrg'});
    var mid=el('span','dcm-ref-middle',{'aria-hidden':'true'});
    mid.textContent=' · ';
    status.append(storage,roleLabel,mid,orgLabel);
    var orgText=(header.querySelector('.brand-text p')?.textContent||'').trim();
    var unit=orgText.split('—').pop().trim();
    var short=(orgText.match(/\(([^)]+)\)/)||[])[1]||'';
    orgLabel.textContent=(unit||'BaTii')+(short?' ('+short+')':'');
    function refreshStatus(){
      var raw=(roleBadge?.textContent||'Tamu').trim().replace(/\s+/g,' ');
      roleLabel.textContent=raw.toUpperCase()==='SUPERADMIN'?'Superadmin':raw;
      status.title=(roleLabel.textContent||'')+' · '+orgLabel.textContent;
      status.setAttribute('aria-label',status.title);
    }
    refreshStatus();
    if(window.MutationObserver&&roleBadge){
      new MutationObserver(refreshStatus).observe(roleBadge,{subtree:true,characterData:true,childList:true});
    }

    var trigger=el('button','dcm-ref-avatar-trigger',{id:'dcmRefAvatarTrigger',type:'button','aria-label':'Buka menu akun','aria-haspopup':'menu','aria-expanded':'false','aria-controls':'dcmRefUserMenu'});
    avatar.parentNode.insertBefore(trigger,avatar);
    trigger.appendChild(avatar);
    var menu=el('div','dcm-ref-user-menu',{id:'dcmRefUserMenu',role:'menu','aria-label':'Menu akun'});
    menu.hidden=true;
    var info=el('div','dcm-ref-user-info');
    if(name)info.appendChild(name);
    if(roleBadge)info.appendChild(roleBadge);
    menu.appendChild(info);
    var languageRow=el('div','dcm-ref-language');
    var langTitle=el('span','dcm-ref-menu-caption');
    langTitle.textContent='Bahasa';
    languageRow.append(langTitle,lang);
    menu.appendChild(languageRow);
    if(settings){
      settings.classList.add('dcm-ref-menu-action');
      settings.appendChild(document.createTextNode(' Pengaturan'));
      settings.setAttribute('role','menuitem');
      menu.appendChild(settings);
    }
    if(logout){
      logout.classList.add('dcm-ref-menu-action');
      logout.appendChild(document.createTextNode(' Keluar'));
      logout.setAttribute('role','menuitem');
      menu.appendChild(logout);
    }
    pill.appendChild(menu);
    function closeMenu(){menu.hidden=true;trigger.setAttribute('aria-expanded','false')}
    trigger.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopPropagation();
      var show=menu.hidden;
      menu.hidden=!show;trigger.setAttribute('aria-expanded',String(show));
      if(show)menu.querySelector('button:not(.hidden)')?.focus({preventScroll:true});
    });
    document.addEventListener('pointerdown',function(ev){
      if(!pill.contains(ev.target))closeMenu();
    },true);
    document.addEventListener('keydown',function(ev){if(ev.key==='Escape')closeMenu()});
    menu.addEventListener('click',function(ev){
      if(ev.target.closest('#btnLogout,#btnAccessAdmin'))closeMenu();
    });
    if(window.MutationObserver){
      new MutationObserver(function(){if(pill.classList.contains('hidden'))closeMenu()}).observe(pill,{attributes:true,attributeFilter:['class']});
    }
    var help=iconButton('dcmRefHelp',svgs.help,function(){
      if(typeof cmOpenContextHelp==='function')cmOpenContextHelp();
      else if(typeof cmOpenUserManual==='function')cmOpenUserManual('getting-started');
    });
    var book=iconButton('dcmRefBook',svgs.book,function(){
      if(typeof cmOpenUserManual==='function')cmOpenUserManual('getting-started');
    });
    var d1=divider(),d2=divider(),d3=divider();
    // Preserve original nodes and their event listeners, only reorder display.
    actions.append(status,d1,help,book,bell,d2,guide,d3,auth);
    actions.classList.add('dcm-reference-toolbar-30');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
