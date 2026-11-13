/* Dashboard CM — Guide global seluruh menu dan header ikon.
   Event delegation: tetap bekerja pada panel/tab yang dibuat ulang tanpa observer berat. */
(function(){
  'use strict';
  if(window.DCM_GUIDE_UI_READY)return;
  window.DCM_GUIDE_UI_READY=true;

  var KEY='dcm_guide_tooltips_v1';
  var enabled=true,tooltip=null,active=null,timer=null,oldTitle=null,oldDesc=null;
  var mutedTitles=new Map();
  try{enabled=localStorage.getItem(KEY)!=='off'}catch(e){enabled=true}

  var TABS={
    analytics:['Menyajikan ringkasan, indikator, grafik dan analisis seluruh agenda CM.','Angka mengikuti data dan filter yang tersedia pada dashboard.'],
    table:['Mengelola daftar agenda dan aktivitas CM beserta rincian, dokumen dan tindak lanjut.','Perubahan atau penghapusan aktivitas mengikuti hak akses pengguna.'],
    tasks:['Memantau penugasan, pembagian pekerjaan, progres dan tenggat kegiatan.','Pastikan penanggung jawab serta tenggat telah diverifikasi.'],
    calendar:['Melihat jadwal agenda menurut tanggal agar benturan waktu mudah diketahui.','Jadwal mengikuti tanggal yang diisi pada masing-masing aktivitas.'],
    kanban:['Memantau aktivitas menurut kelompok status pada papan kerja.','Perubahan status harus sesuai realisasi pekerjaan.'],
    matrix:['Membandingkan agenda dan progres melalui tampilan matriks.','Hasil mengikuti data yang tersimpan dan parameter yang dipilih.'],
    knowledge:['Menyimpan dan menemukan materi, referensi dan pengetahuan kerja tim CM.','Perhatikan klasifikasi informasi serta izin akses sebelum membagikan materi.'],
    survey:['Menyusun dan memantau Change Readiness Assessment (CRA).','Interpretasi hasil asesmen perlu mempertimbangkan cakupan responden dan bukti pendukung.'],
    priority:['Menilai dan memetakan prioritas pendampingan manajemen perubahan.','Hasil penilaian mengikuti kriteria, data dan justifikasi yang diisi.'],
    contact:['Mengelola informasi Squad Team dan jejaring kerja yang mendukung aktivitas.','Periksa ketepatan data kontak sebelum digunakan atau dibagikan.'],
    resource:['Melihat personel Tim CM, peran dan kapasitas penugasan.','Informasi personel tidak otomatis mengubah surat keputusan atau penugasan resmi.']
  };
  var ACTIONS={
    btnImport:['Mengimpor aktivitas dari berkas Excel sesuai format yang didukung.','Periksa isi dan kemungkinan data duplikat sebelum mengonfirmasi impor.'],
    btnExport:['Mengunduh data aktivitas menjadi berkas Excel.','Data yang terunduh mengikuti hak akses dan kondisi saat ekspor.'],
    btnBackupAll:['Mengunduh cadangan data aplikasi, termasuk aktivitas dan data pendukung.','Simpan berkas cadangan di lokasi aman dan jangan dibagikan sembarangan.'],
    btnRestoreAll:['Memulihkan data aplikasi dari berkas backup.','Verifikasi berkas sebelum pemulihan karena data saat ini dapat terdampak.'],
    btnReminderCenter:['Membuka pusat notifikasi dan pengingat.','Pengingat mengikuti pengaturan dan data yang tersedia.'],
    btnLangToggle:['Mengganti bahasa tampilan Indonesia atau Inggris.','Perubahan bahasa tidak mengubah data yang telah tersimpan.'],
    btnGoogleLogin:['Masuk menggunakan akun Google yang diizinkan.','Akses fitur ditentukan oleh peran pengguna.'],
    btnLogout:['Keluar dari akun dashboard yang aktif.','Pastikan perubahan data telah tersimpan sebelum keluar.'],
    btnAccessAdmin:['Membuka pengaturan dan pengelolaan akses pengguna.','Hanya pengguna berwenang yang dapat mengubah konfigurasi dan hak akses.'],
    cmContextHelp:['Membuka panduan penggunaan dashboard.','Panduan menjelaskan alur fitur tetapi tidak mengubah data.'],
    btnAdd:['Menambahkan aktivitas CM baru pada daftar agenda.','Lengkapi informasi wajib dan bukti dukung sesuai kebutuhan.'],
    btnFilterToggle:['Menampilkan atau menyembunyikan filter lanjutan.','Filter hanya mengubah tampilan, bukan menghapus data.'],
    btnClearSearch:['Menghapus kata pencarian saat ini.','Data dan filter lainnya tetap tersimpan.']
  };
  var SELECTOR=[
    '#tabNav button','#appHeader .topbar-actions button',
    '#contextFilterBar button','#appMain .tab-panel button',
    '#appMain .tab-panel a[href]','#appMain .tab-panel [role="tab"]',
    '#appMain nav button','.modal-overlay:not(.hidden) button',
    '.cm-reminder-panel:not(.hidden) button'
  ].join(',');

  function labelOf(el){
    if(el.hasAttribute('data-tab')){var tab=el.querySelector('[data-i18n]');if(tab)return (tab.textContent||'').trim()}
    var raw=el.getAttribute('aria-label')||el.getAttribute('data-dcm-label')||
      el.getAttribute('title')||(el.querySelector('[data-i18n]')||{}).textContent||
      el.textContent||'';
    raw=String(raw).replace(/\s+/g,' ').trim();
    return raw.length>90?raw.slice(0,87)+'...':(raw||'Fitur');
  }
  function targetFor(node){
    if(!node||typeof node.closest!=='function')return null;
    var el=node.closest(SELECTOR);
    if(!el||el.closest('.hidden,[hidden]')||el.disabled||el.id==='cmGuideToggle')return null;
    return el;
  }
  function guideOf(el,label){
    if(el.hasAttribute('data-tab')&&TABS[el.dataset.tab])return TABS[el.dataset.tab];
    if(el.id&&ACTIONS[el.id])return ACTIONS[el.id];
    var title=el.getAttribute('title')||mutedTitles.get(el)||'';
    if(title&&title!==label)return [title,'Gunakan fitur sesuai peran dan periksa data sebelum menyimpan perubahan.'];
    var isNav=!!el.closest('nav,[role="tablist"]')||el.hasAttribute('role')&&el.getAttribute('role')==='tab';
    if(isNav)return ['Membuka bagian '+label+' pada halaman aktif.','Berpindah menu tidak mengubah data yang telah disimpan.'];
    if(/hapus|delete|remove/i.test(label))return ['Menghapus item yang dipilih.','Periksa kembali item sebelum menyetujui penghapusan.'];
    if(/simpan|save|submit|kirim/i.test(label))return ['Menyimpan informasi yang telah diisi.','Periksa kelengkapan dan ketepatan isian sebelum menyimpan.'];
    if(/unduh|download|ekspor|export/i.test(label))return ['Mengunduh informasi yang tersedia dari fitur ini.','Perhatikan kerahasiaan berkas hasil unduhan.'];
    if(/ubah|edit|kelola/i.test(label))return ['Membuka pengubahan atau pengelolaan '+label+'.','Perubahan hanya berlaku sesuai hak akses.'];
    return ['Membuka atau menjalankan fitur '+label+'.','Ikuti petunjuk pada formulir dan pastikan data yang digunakan benar.'];
  }
  function ensureTooltip(){
    if(tooltip)return tooltip;
    tooltip=document.createElement('div');
    tooltip.id='dcm-global-guide-tip';tooltip.hidden=true;
    tooltip.setAttribute('role','tooltip');
    tooltip.innerHTML='<b class="dcm-tip-label"></b><span class="dcm-tip-sub">Fungsi</span>'+
      '<div class="dcm-tip-text" data-dcm-function></div><span class="dcm-tip-sub">Batasan</span>'+
      '<div class="dcm-tip-text" data-dcm-bound></div>';
    document.body.appendChild(tooltip);return tooltip;
  }
  function hide(){
    if(timer!==null){clearTimeout(timer);timer=null}
    if(active&&active.isConnected){
      if(oldTitle!==null&&!active.hasAttribute('title'))active.setAttribute('title',oldTitle);
      if(oldDesc===null)active.removeAttribute('aria-describedby');
      else active.setAttribute('aria-describedby',oldDesc);
    }
    active=null;oldTitle=null;oldDesc=null;
    if(tooltip)tooltip.hidden=true;
  }
  function position(el){
    if(!tooltip||tooltip.hidden||!el.isConnected)return;
    var rect=el.getBoundingClientRect(),w=tooltip.offsetWidth,h=tooltip.offsetHeight;
    var left=Math.round(rect.left+(rect.width-w)/2);
    var top=Math.round(rect.bottom+9);
    if(left+w>window.innerWidth-9)left=window.innerWidth-w-9;
    if(left<9)left=9;
    if(top+h>window.innerHeight-9)top=Math.round(rect.top-h-9);
    tooltip.style.left=Math.max(9,left)+'px';
    tooltip.style.top=Math.max(9,top)+'px';
  }
  function show(el){
    if(!enabled||!el||!el.isConnected)return;
    hide();
    var spec=guideOf(el,labelOf(el));
    var tip=ensureTooltip();
    active=el;
    oldTitle=el.hasAttribute('title')?el.getAttribute('title'):null;
    oldDesc=el.getAttribute('aria-describedby');
    if(oldTitle!==null)el.removeAttribute('title');
    el.setAttribute('aria-describedby',(oldDesc?oldDesc+' ':'')+tip.id);
    tip.querySelector('.dcm-tip-label').textContent=labelOf(el);
    tip.querySelector('[data-dcm-function]').textContent=spec[0];
    tip.querySelector('[data-dcm-bound]').textContent=spec[1];
    tip.hidden=false;position(el);
  }
  function arm(el,ms){
    if(!enabled||!el||el===active)return;
    hide();
    timer=setTimeout(function(){timer=null;show(el)},ms);
  }
  function muteNavTitles(){
    document.querySelectorAll('#tabNav button').forEach(function(el){
      if(el.hasAttribute('title')&&!mutedTitles.has(el)){
        mutedTitles.set(el,el.getAttribute('title'));el.removeAttribute('title');
      }
    });
  }
  function restoreNavTitles(){
    mutedTitles.forEach(function(value,el){
      if(el.isConnected&&!el.hasAttribute('title'))el.setAttribute('title',value);
    });
    mutedTitles.clear();
  }
  function refreshGuide(){
    var el=document.getElementById('cmGuideToggle');if(!el)return;
    el.setAttribute('aria-checked',String(enabled));
    el.setAttribute('aria-label','Guide '+(enabled?'aktif':'nonaktif')+'. Klik untuk mengubah.');
    el.title=enabled?'Guide aktif: arahkan kursor untuk melihat fungsi dan batasan fitur.':'Guide nonaktif: klik untuk mengaktifkan panduan fitur.';
    if(enabled)restoreNavTitles();else muteNavTitles();
  }
  function setGuide(next){
    enabled=!!next;hide();
    try{localStorage.setItem(KEY,enabled?'on':'off')}catch(e){}
    refreshGuide();
  }
  function updateIconLabels(){
    ['btnImport','btnExport','btnBackupAll','btnRestoreAll'].forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      el.classList.add('dcm-header-icon');
      var labelEl=el.querySelector('span[data-i18n]');
      var label=labelEl?(labelEl.textContent||'').trim():'';
      if(label)el.setAttribute('data-dcm-label',label);
      if(label)el.setAttribute('aria-label',label);
      if(label)el.setAttribute('title',label);
    });
  }

  /* Kelompok kontrol kanan: ikon Import/Export tetap seperti sebelumnya. */
  function alignHeaderTools(){
    var actions=document.querySelector('#appHeader .topbar-actions');
    var start=document.getElementById('btnImport');
    if(!actions||!start||!actions.contains(start))return;
    while(start.parentElement&&start.parentElement!==actions)start=start.parentElement;
    if(start.previousElementSibling&&start.previousElementSibling.classList.contains('topbar-divider')){
      start=start.previousElementSibling;
    }
    start.classList.add('dcm-utility-start');
  }
  /* Ganti gambar SVG saja, bukan tombol, sehingga event Backup/Restore tidak berubah. */
  function updateBackupRestoreSymbols(){
    var icons={
      btnBackupAll:'<rect x="3" y="4" width="18" height="4" rx="1"></rect>'+
        '<path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"></path>'+
        '<path d="M9 13h6"></path>',
      btnRestoreAll:'<path d="M3 11a9 9 0 1 1 2.7 6.5"></path>'+
        '<path d="M3 4v7h7"></path>'+
        '<path d="M12 7v5l3.5 2.2"></path>'
    };
    Object.keys(icons).forEach(function(id){
      var btn=document.getElementById(id);
      if(!btn)return;
      var svg=btn.querySelector('svg');
      if(!svg){
        svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        btn.insertBefore(svg,btn.firstChild);
      }
      svg.classList.add('icon','dcm-header-custom-svg');
      svg.setAttribute('viewBox','0 0 24 24');
      svg.setAttribute('width','19');
      svg.setAttribute('height','19');
      svg.setAttribute('stroke','currentColor');
      svg.setAttribute('stroke-width','2');
      svg.setAttribute('stroke-linecap','round');
      svg.setAttribute('stroke-linejoin','round');
      svg.setAttribute('fill','none');
      svg.setAttribute('aria-hidden','true');
      if(svg.getAttribute('data-dcm-symbol')!==id){
        svg.innerHTML=icons[id];
        svg.setAttribute('data-dcm-symbol',id);
      }
      btn.classList.add('dcm-custom-action-icon');
    });
  }

  function install(){
    var actions=document.querySelector('#appHeader .topbar-actions');
    if(!actions)return;
    updateIconLabels();
    alignHeaderTools();
    updateBackupRestoreSymbols();
    var el=document.getElementById('cmGuideToggle');
    if(!el){
      el=document.createElement('button');
      el.type='button';el.id='cmGuideToggle';el.className='dcm-guide-toggle';
      el.setAttribute('role','switch');
      el.innerHTML='<span>Guide</span><span class="dcm-guide-track" aria-hidden="true"><i></i></span>';
      el.addEventListener('click',function(){setGuide(!enabled)});
      var bell=document.getElementById('btnReminderCenter');
      if(bell&&bell.parentElement===actions)bell.insertAdjacentElement('afterend',el);
      else actions.appendChild(el);
    }
    refreshGuide();
    if(!document.getElementById('dcm-activity-labels-loader')){
      var script=document.createElement('script');
      script.id='dcm-activity-labels-loader';
      script.src='dcm-activity-labels.js';
      script.defer=true;
      document.body.appendChild(script);
    }

  }
  document.addEventListener('pointerover',function(ev){
    if(ev.pointerType==='touch')return;
    var el=targetFor(ev.target);if(!el)return;
    if(!enabled){if(el.closest('#tabNav'))muteNavTitles();return}
    if(el!==active)arm(el,230);
  });
  document.addEventListener('pointerout',function(ev){
    var el=targetFor(ev.target);if(!el)return;
    if(ev.relatedTarget&&el.contains(ev.relatedTarget))return;
    if(el===active||timer!==null)hide();
  });
  document.addEventListener('focusin',function(ev){
    var el=targetFor(ev.target);if(!el||!enabled)return;
    arm(el,60);
  });
  document.addEventListener('focusout',function(ev){if(active===ev.target)hide()});
  document.addEventListener('scroll',hide,true);
  document.addEventListener('pointerdown',hide,true);
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape')hide()});
  window.addEventListener('resize',hide);
  document.addEventListener('click',function(ev){
    if(ev.target&&ev.target.closest&&ev.target.closest('#btnLangToggle')){
      setTimeout(updateIconLabels,0);
    }
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();


/* DCM COMPACT HEADER — 261113-DCM-12 */
(function () {
  'use strict';
  if (window.DCM_COMPACT_HEADER_261113) return;
  window.DCM_COMPACT_HEADER_261113 = true;

  function $id(id) { return document.getElementById(id); }
  function configureSyncTooltip() {
    var pill = $id('storagePill'), label = $id('storageText');
    if (!pill || !label) return;
    function refresh() {
      var status = (label.textContent || 'Status sinkronisasi data').trim();
      pill.title = status;
      pill.setAttribute('aria-label', 'Sinkronisasi data: ' + status);
      pill.setAttribute('role', 'status');
    }
    refresh();
    if (window.MutationObserver) new MutationObserver(refresh).observe(label, {
      characterData:true, childList:true, subtree:true
    });
  }

  function positionControls() {
    var actions = document.querySelector('#appHeader .topbar-actions');
    if (!actions) return;
    // Gunakan DOM node asli agar semua event listener, login, dan notifikasi tetap bekerja.
    ['storagePill', 'btnReminderCenter', 'cmGuideToggle', 'btnLangToggle', 'authPill']
      .forEach(function (id) {
        var item = $id(id);
        if (item && actions.contains(item) && item.parentElement === actions) {
          actions.appendChild(item);
        }
      });
  }

  function getSettingsModal() {
    // Hanya cari modal Settings yang benar-benar terbuka.
    var tabs = Array.from(document.querySelectorAll('button,a,[role="tab"],span'))
      .filter(function (el) {
        var t = (el.textContent || '').trim();
        return t.includes('Statistik Kunjungan Tamu') && t.length < 100 &&
          el.getClientRects().length > 0;
      });
    for (var i = 0; i < tabs.length; i++) {
      var node = tabs[i];
      var modal = node.closest('.modal-box,.modal-content,.settings-modal,.settings-box,[role="dialog"]');
      if (modal && modal.getBoundingClientRect().height > 240) return modal;
      var parent = node.parentElement;
      while (parent && parent !== document.body) {
        var rect = parent.getBoundingClientRect();
        if (rect.width > 500 && rect.height > 300 &&
          /Pengguna/.test(parent.textContent || '') &&
          /Standar Penomoran/.test(parent.textContent || '')) {
          return parent;
        }
        parent = parent.parentElement;
      }
    }
    return null;
  }

  function svgFor(id) {
    var source = $id(id), svg = source && source.querySelector('svg');
    return svg ? svg.cloneNode(true) : null;
  }

  /* Settings is a separate high-layer overlay. Existing legacy import/backup
     modals use z-index:100, so they otherwise open behind Settings and appear inert.
     Keep the original handlers and data format; only fix visibility + feedback. */
  function dcmSettingsDataLayer(id) {
    var targetId = id === 'btnImport' ? 'importModal'
      : (id === 'btnBackupAll' || id === 'btnRestoreAll' ? 'backupModal' : '');
    if (!targetId) return null;
    var layer = $id(targetId);
    if (layer) {
      // A body-level modal must be above the Settings dialog and its scrim.
      layer.style.setProperty('z-index', '2147483000', 'important');
    }
    return layer;
  }
  function dcmSettingsDataMessage(button, message, error) {
    var box = button.closest('.dcm-settings-utility-drop');
    var meta = box && box.querySelector('.dcm-settings-utility-meta');
    if (!meta) return;
    var status = meta.querySelector('[data-dcm-data-action-status]');
    if (!status) {
      status = document.createElement('div');
      status.setAttribute('data-dcm-data-action-status', 'true');
      status.setAttribute('role', 'status');
      meta.prepend(status);
    }
    status.textContent = message;
    status.style.color = error ? '#A43A3A' : '#1F527D';
    status.style.fontWeight = '600';
  }
  function utilityButton(id, text) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'dcm-header-icon';
    button.setAttribute('aria-label', text);
    button.title = text;
    var icon = svgFor(id);
    if (icon) button.appendChild(icon);
    var label = document.createElement('span');
    label.textContent = text;
    button.appendChild(label);
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var original = $id(id);
      if (!original) {
        dcmSettingsDataMessage(button, 'Tombol utama '+text+' tidak ditemukan. Muat ulang halaman.', true);
        return;
      }
      var isExport = id === 'btnExport';
      var allowed = isExport ? window.cmCanReport : window.cmCanMutate;
      if (typeof allowed === 'function' && !allowed()) {
        dcmSettingsDataMessage(button, 'Akun ini tidak memiliki hak akses '+text+'.', true);
        return;
      }
      var layer = dcmSettingsDataLayer(id);
      if (original.disabled) {
        dcmSettingsDataMessage(button, 'Fungsi '+text+' sedang dinonaktifkan.', true);
        return;
      }
      // Legacy click handlers perform the real operation. Never invent another
      // download, restore or import path which could desynchronise Firestore.
      original.click();
      if (layer) {
        if (layer.classList.contains('hidden')) {
          dcmSettingsDataMessage(button, 'Dialog '+text+' tidak terbuka. Periksa izin akun dan muat ulang halaman.', true);
        } else {
          var drop = button.closest('.dcm-settings-utility-drop');
          if (drop) drop.hidden = true;
          var trigger = button.closest('.dcm-settings-utility-anchor')?.querySelector('.dcm-settings-utility-trigger');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      } else {
        dcmSettingsDataMessage(button, 'Ekspor dimulai. Periksa unduhan di browser.', false);
      }
    });
    return button;
  }

  function metadataValue(id, empty) {
    var node = $id(id);
    if (!node) return empty;
    var text = (node.textContent || '').replace(/\s+/g, ' ').trim();
    return text && text.indexOf(':') < text.length - 1 ? text : empty;
  }

  function mountUtilities() {
    var modal = getSettingsModal();
    if (!modal) return false;
    if (modal.querySelector('.dcm-settings-utility-anchor')) return true;
    var computed = window.getComputedStyle(modal);
    if (computed.position === 'static') modal.style.position = 'relative';

    var anchor = document.createElement('div');
    anchor.className = 'dcm-settings-utility-anchor';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'dcm-settings-utility-trigger';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Pengelolaan data dan backup');
    toggle.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M4 7h16M4 12h16M4 17h16"></path></svg><span>Data &amp; Backup</span>';

    var dropdown = document.createElement('div');
    dropdown.className = 'dcm-settings-utility-drop';
    dropdown.hidden = true;
    dropdown.innerHTML = '<h4>Pengelolaan Data</h4>';
    var buttons = document.createElement('div');
    buttons.className = 'dcm-settings-utility-actions';
    [['btnImport','Impor'],['btnExport','Ekspor'],
     ['btnBackupAll','Backup'],['btnRestoreAll','Restore']].forEach(function (a) {
      buttons.appendChild(utilityButton(a[0],a[1]));
    });
    dropdown.appendChild(buttons);
    var meta = document.createElement('div');
    meta.className = 'dcm-settings-utility-meta';
    dropdown.appendChild(meta);

    function refreshMeta() {
      meta.textContent = '';
      var last = document.createElement('div');
      last.textContent = metadataValue('lastUpdatePill','Terakhir diperbarui: belum tersedia');
      meta.appendChild(last);
      var importText = metadataValue('lastSyncPill','');
      if (importText) {
        var imported = document.createElement('div');
        imported.textContent = importText;
        meta.appendChild(imported);
      }
    }
    toggle.addEventListener('click', function () {
      var willOpen = dropdown.hidden;
      dropdown.hidden = !willOpen;
      toggle.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) refreshMeta();
    });
    anchor.appendChild(toggle);
    anchor.appendChild(dropdown);
    modal.appendChild(anchor);
    document.addEventListener('pointerdown', function (event) {
      if (!anchor.isConnected) return;
      if (!anchor.contains(event.target)) {
        dropdown.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    return true;
  }

  function afterSettingsOpen() {
    [0,80,240,600,1200].forEach(function (delay) {
      window.setTimeout(mountUtilities, delay);
    });
  }

  function install() {
    positionControls();
    configureSyncTooltip();
    // Tidak mengganti handler Settings yang sudah ada.
    document.addEventListener('click', function (event) {
      if (event.target && event.target.closest &&
          event.target.closest('#btnAccessAdmin')) afterSettingsOpen();
      if (event.target && event.target.closest &&
          event.target.closest('#btnLangToggle')) {
        window.setTimeout(positionControls, 0);
      }
    }, false);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();


/* DCM 261113-DCM-15 — Kalender / Workboard / Matriks menjadi tab Aktivitas.
   Memindahkan tombol asli (tanpa kloning) agar handler, filter, izin, dan data tetap bekerja. */
(function(){
  'use strict';
  if(window.DCM_ACTIVITY_VIEWS_26111315)return;
  window.DCM_ACTIVITY_VIEWS_26111315=true;
  function installActivityViews(){
    var nav=document.getElementById('tabNav');
    var filter=document.getElementById('contextFilterBar');
    if(!nav||!filter||document.getElementById('dcm-activity-view-tabs'))return;
    var agenda=nav.querySelector('button[data-tab="table"]');
    if(!agenda)return;
    var views=['calendar','kanban','matrix'];
    var originals=views.map(function(k){return nav.querySelector('button[data-tab="'+k+'"]')});
    if(originals.some(function(el){return !el}))return;
    var tabs=document.createElement('nav');
    tabs.id='dcm-activity-view-tabs';
    tabs.setAttribute('aria-label','Pilihan tampilan Aktivitas');
    tabs.hidden=true;
    var list=document.createElement('button');
    list.type='button';
    list.className='dcm-activity-view-btn';
    list.setAttribute('data-view','table');
    list.title='Lihat Daftar Aktivitas';
    list.innerHTML='<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 6h14M7 12h14M7 18h14"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg><span>Daftar Aktivitas</span>';
    list.addEventListener('click',function(){agenda.click()});
    tabs.appendChild(list);
    originals.forEach(function(el){
      el.classList.add('dcm-activity-view-btn');
      tabs.appendChild(el);
    });
    filter.parentNode.insertBefore(tabs,filter);
    agenda.classList.add('dcm-activity-parent');
    var syncing=false;
    function sync(){
      if(syncing)return;
      syncing=true;
      var activeView=null;
      originals.forEach(function(el,i){if(el.classList.contains('active'))activeView=views[i]});
      if(!activeView&&agenda.classList.contains('active'))activeView='table';
      var visible=!!activeView;
      if(tabs.hidden===visible)tabs.hidden=!visible;
      if(visible&&!agenda.classList.contains('active'))agenda.classList.add('active');
      var isList=activeView==='table';
      if(list.classList.contains('active')!==isList)list.classList.toggle('active',isList);
      list.setAttribute('aria-current',isList?'page':'false');
      originals.forEach(function(el){el.setAttribute('aria-current',el.classList.contains('active')?'page':'false')});
      syncing=false;
    }
    var observer=new MutationObserver(sync);
    [agenda].concat(originals).forEach(function(el){
      observer.observe(el,{attributes:true,attributeFilter:['class']});
    });
    sync();
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',installActivityViews,{once:true});
  else installActivityViews();
})();


/* DCM 261113-DCM-17 — kelas heatmap biru berdasarkan jumlah aktivitas. */
(function(){
  'use strict';
  if(window.DCM_MATRIX_BLUE_26111317)return;
  window.DCM_MATRIX_BLUE_26111317=true;

  function heatTier(value){
    if(!Number.isFinite(value)||value<=0)return '0';
    if(value<=2)return '1';
    if(value<=5)return '2';
    if(value<=10)return '3';
    if(value<=20)return '4';
    return '5';
  }

  function enhanceMatrix(){
    var panel=document.getElementById('tab-matrix');
    if(!panel)return;
    // Nilai dibaca dari sel hasil perhitungan asli renderMatrix. Tidak mengubah data/filter.
    panel.querySelectorAll('table.matrix-table td.matrix-cell,table.matrix-table td.matrix-total')
      .forEach(function(cell){
        var n=Number(String(cell.textContent||'').trim());
        cell.setAttribute('data-dcm-heat',heatTier(n));
      });

    var toolbar=panel.firstElementChild;
    if(!toolbar||toolbar.querySelector('.dcm-matrix-legend'))return;
    toolbar.classList.add('dcm-matrix-toolbar');
    var legend=document.createElement('div');
    legend.className='dcm-matrix-legend';
    legend.setAttribute('role','note');
    legend.setAttribute('aria-label','Legenda jumlah aktivitas berdasarkan intensitas biru');
    var items=[['1','1–2'],['2','3–5'],['3','6–10'],['4','11–20'],['5','>20']];
    var title=document.createElement('span');
    title.className='dcm-matrix-legend-title';
    title.textContent='Jumlah aktivitas:';
    legend.appendChild(title);
    items.forEach(function(item){
      var el=document.createElement('span');
      el.className='dcm-matrix-legend-item';
      var chip=document.createElement('span');
      chip.className='dcm-matrix-legend-chip';
      chip.setAttribute('data-dcm-heat',item[0]);
      chip.setAttribute('aria-hidden','true');
      var label=document.createElement('span');
      label.textContent=item[1];
      el.appendChild(chip);
      el.appendChild(label);
      legend.appendChild(el);
    });
    toolbar.appendChild(legend);
  }

  function install(){
    var panel=document.getElementById('tab-matrix');
    if(!panel)return;
    // renderMatrix mengganti innerHTML setiap perubahan filter/dimensi:
    // amati hanya penggantian anak langsung agar tidak terjadi loop.
    var observer=new MutationObserver(function(mutations){
      if(mutations.some(function(m){return m.type==='childList'&&m.target===panel;}))
        enhanceMatrix();
    });
    observer.observe(panel,{childList:true});
    enhanceMatrix();
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
