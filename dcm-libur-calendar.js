(function dcmLiburCalendar(){
  'use strict';
  if(window.DCM_LIBUR_UI_READY)return;
  window.DCM_LIBUR_UI_READY=true;
  var E=window.DCM_LIBUR;
  if(!E){console.warn('DCM holiday engine unavailable');return;}
  var LOCAL_KEY='dcm_libur_calendar_v1',CLOUD_KEY='dcm_libur_calendar_v1',YEAR_MIN=2025,YEAR_MAX=2046;
  var data={},status='Lokal',panel=null,watch=null,syncUnsub=null,dialog=null;
  function html(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
  function readLocal(){try{var a=JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}');return a&&typeof a==='object'&&!Array.isArray(a)?a:{};}catch(e){return {};}}
  data=readLocal();
  function writeLocal(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(data));}catch(e){console.warn('DCM holiday local storage unavailable',e);}}
  function canManage(){try{if(typeof cmCanMutate==='function')return !!cmCanMutate();}catch(e){}return !!(window.fbAuth&&window.fbAuth.currentUser);}
  function yearInfo(year){
    year=Number(year);
    var imported=data[year];
    if(imported&&imported.items&&Object.keys(imported.items).length)return {items:imported.items,kind:'import',label:imported.label||'Dokumen resmi '+year};
    if(E.OFFICIAL[year])return {items:E.OFFICIAL[year],kind:'official',label:E.OFFICIAL.label[year]||'SKB 3 Menteri '+year};
    return {items:E.estimate(year),kind:'projection',label:'Proyeksi otomatis; belum merupakan ketetapan pemerintah'};
  }
  function currentMonth(){
    try{if(typeof state!=='undefined'&&/^\d{4}-\d{2}$/.test(state.calMonth))return state.calMonth;}catch(e){}
    if(window.state&&/^\d{4}-\d{2}$/.test(window.state.calMonth))return window.state.calMonth;
    var t=(panel&&panel.querySelector('.cal-title')||{}).textContent||'',yy=(t.match(/20\d{2}/)||[])[0],months=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
    var m=months.findIndex(function(x){return t.toLowerCase().includes(x);});
    return yy&&m>=0?yy+'-'+String(m+1).padStart(2,'0'):new Date().toISOString().slice(0,7);
  }
  function monthSummary(year){var x=yearInfo(year),vals=Object.values(x.items);return {source:x,na:vals.filter(function(v){return v.type!=='collective';}).length,co:vals.filter(function(v){return v.type==='collective';}).length};}
  function injectCss(){
    if(document.getElementById('dcm-libur-style'))return;
    var css=document.createElement('style');css.id='dcm-libur-style';css.textContent=`
#tab-calendar .dcm-lb-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:7px 10px;background:#F9FAFD;border:1px solid #DDE5F0;border-radius:9px;margin:7px 0 9px;color:#142D55;font:500 11px Inter,sans-serif}
#tab-calendar .dcm-lb-bar strong{font-weight:800}
#tab-calendar .dcm-lb-bar .dcm-lb-left{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0}
.dcm-lb-pill{border-radius:999px;font:800 10px Inter,sans-serif;padding:4px 7px;white-space:nowrap;background:#FFF3D9;color:#876210}
.dcm-lb-pill.official,.dcm-lb-pill.import{background:#E3F5E9;color:#176943}
#tab-calendar .dcm-lb-bar button,.dcm-lb-dialog button{font:700 11.5px Inter,sans-serif;cursor:pointer}
#tab-calendar .dcm-lb-bar button{background:#142E60;border:1px solid #142E60;color:#fff;border-radius:7px;padding:7px 10px;white-space:nowrap}
#tab-calendar .dcm-lb-bar button:hover{background:#224B86}
#tab-calendar .dcm-lb-chip{display:block;max-width:100%;font:700 10px/1.25 Inter,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:3px 5px;margin:2px 0;border-radius:5px;background:#FDF0C8;color:#73520D;cursor:help}
#tab-calendar .dcm-lb-chip.national{background:#EAF0FC;color:#20467D}
#tab-calendar .dcm-lb-chip.projection{border:1px dashed #C9A659}
#tab-calendar .dcm-lb-chip.import{border-left:3px solid #169A6D}
.dcm-lb-overlay{position:fixed;inset:0;z-index:10070;background:rgba(9,23,48,.65);display:flex;justify-content:center;align-items:center;padding:14px;font-family:Inter,sans-serif}
.dcm-lb-dialog{width:min(960px,calc(100vw - 28px));max-height:min(88dvh,820px);display:flex;flex-direction:column;background:#fff;color:#142D55;border-radius:15px;box-shadow:0 22px 70px rgba(3,19,48,.36);overflow:hidden}
.dcm-lb-dialog header{flex:none;background:#102852;color:white;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 17px;border-bottom:3px solid #E5C567}
.dcm-lb-dialog header h3{font:800 16px Sora,Inter,sans-serif;margin:0}
.dcm-lb-dialog header small{display:block;font:400 11px Inter,sans-serif;color:#D5DFEE;margin-top:3px}
.dcm-lb-dialog .dcm-lb-x{font-size:21px;background:rgba(255,255,255,.12);border:0;color:white;border-radius:8px;width:32px;height:32px}
.dcm-lb-dialog .dcm-lb-content{padding:12px 15px;overflow:auto;min-height:0;flex:1}
.dcm-lb-dialog footer{display:flex;gap:8px;justify-content:flex-end;align-items:center;border-top:1px solid #E2E7EF;padding:9px 15px;flex:none;background:#FAFBFD}
.dcm-lb-dialog .dcm-lb-note{margin:0 0 10px;padding:9px 11px;background:#F2F5FC;border-left:3px solid #DDBB5B;border-radius:6px;font-size:11.5px;line-height:1.45}
.dcm-lb-dialog .dcm-lb-warning{background:#FFF4DC;border-left-color:#DDA630}
.dcm-lb-dialog .dcm-lb-error{background:#FDEAE8;color:#A22320;border-left-color:#DA473B}
.dcm-lb-dialog .dcm-lb-tablewrap{border:1px solid #DDE5EF;border-radius:9px;overflow:auto;max-height:56dvh}
.dcm-lb-dialog table{border-collapse:collapse;width:100%;font:500 11.5px Inter,sans-serif}
.dcm-lb-dialog th{position:sticky;top:0;z-index:1;background:#F1F4FA;color:#536783;text-align:left;font-size:10.5px;letter-spacing:.01em;padding:8px}
.dcm-lb-dialog td{padding:6px 8px;border-top:1px solid #EAF0F6;vertical-align:middle}
.dcm-lb-dialog tr:hover td{background:#FBFCFE}
.dcm-lb-dialog td small{display:block;margin-top:2px;font-size:10px;color:#70819B}
.dcm-lb-dialog td .dcm-lb-acts{display:flex;gap:5px;justify-content:flex-end}
.dcm-lb-dialog button{border:1px solid #CFD9E8;background:white;color:#173668;border-radius:7px;padding:7px 10px;white-space:nowrap}
.dcm-lb-dialog button:hover{background:#EDF3FA}
.dcm-lb-dialog button.primary{border-color:#132E62;background:#132E62;color:white}
.dcm-lb-dialog button.primary:hover{background:#254C87}
.dcm-lb-dialog button.danger{color:#B22A26}
.dcm-lb-dialog button:disabled{opacity:.45;cursor:not-allowed}
.dcm-lb-dialog .dcm-lb-formrow{display:grid;grid-template-columns:115px minmax(0,1fr);gap:9px;margin:0 0 10px}
.dcm-lb-dialog label{font:700 11px Inter,sans-serif;color:#476080}
.dcm-lb-dialog input:not([type=checkbox]),.dcm-lb-dialog select{box-sizing:border-box;width:100%;min-width:0;min-height:32px;padding:5px 7px;background:#fff;border:1px solid #CAD6E6;border-radius:6px;font:500 11.5px Inter,sans-serif;color:#18345E}
.dcm-lb-dialog input[type=checkbox]{cursor:pointer}
.dcm-lb-dialog .dcm-lb-upload{display:flex;align-items:center;gap:10px;border:1.5px dashed #B1C2DD;border-radius:10px;padding:13px;background:#F8FAFF;cursor:pointer;margin-bottom:10px}
.dcm-lb-dialog .dcm-lb-upload b{display:block;font-size:12.5px}
.dcm-lb-dialog .dcm-lb-upload small{font-size:11px;font-weight:400;color:#667993}
.dcm-lb-dialog .dcm-lb-upload:hover{background:#EFF4FF;border-color:#244E89}
.dcm-lb-dialog .dcm-lb-formactions{display:flex;justify-content:space-between;gap:7px;align-items:center;margin:8px 0}
.dcm-lb-dialog .dcm-lb-preview td input[type=text]{width:100%}
.dcm-lb-dialog .dcm-lb-preview td:nth-child(2){width:126px}
.dcm-lb-dialog .dcm-lb-preview td:nth-child(3){width:146px}
.dcm-lb-dialog .dcm-lb-preview td:last-child{width:44px;text-align:right}
.dcm-lb-dialog .dcm-lb-muted{color:#687D97;font-size:11px}
@media(max-width:700px){.dcm-lb-dialog .dcm-lb-formrow{grid-template-columns:1fr}.dcm-lb-overlay{padding:6px}.dcm-lb-dialog{max-height:96dvh;width:calc(100vw - 12px)}.dcm-lb-dialog .dcm-lb-content{padding:9px}.dcm-lb-dialog .dcm-lb-tablewrap{overflow:auto}}
`;
    document.head.appendChild(css);
  }
  function popup(title,subtitle){
    if(dialog)dialog.remove();
    var layer=document.createElement('div');layer.className='dcm-lb-overlay';layer.innerHTML='<div class="dcm-lb-dialog" role="dialog" aria-modal="true" aria-labelledby="dcm-lb-title"><header><div><h3 id="dcm-lb-title">'+html(title)+'</h3><small>'+html(subtitle||'')+'</small></div><button class="dcm-lb-x" type="button" data-lb-close aria-label="Tutup">×</button></header><div class="dcm-lb-content"></div><footer><button type="button" data-lb-close>Tutup</button></footer></div>';
    document.body.appendChild(layer);dialog=layer;
    layer.addEventListener('click',function(ev){if(ev.target===layer||ev.target.closest('[data-lb-close]'))closePopup();});
    layer.querySelector('.dcm-lb-x').focus();
    return layer.querySelector('.dcm-lb-content');
  }
  function closePopup(){if(dialog){dialog.remove();dialog=null;}}
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&dialog)closePopup();});
  function notice(s,bad){var el=dialog&&dialog.querySelector('[data-lb-notice]');if(el){el.textContent=s;el.classList.toggle('dcm-lb-error',!!bad);el.hidden=false;}}
  function decorate(){
    if(!panel||!panel.querySelector('.cal-header'))return;
    var ym=currentMonth(),y=+ym.slice(0,4),entry=yearInfo(y),out=document.createElement('div'),can=canManage();
    out.className='dcm-lb-bar';out.innerHTML='<div class="dcm-lb-left"><strong>Libur nasional & cuti bersama</strong><span class="dcm-lb-pill '+entry.kind+'">'+(entry.kind==='projection'?'Proyeksi · belum resmi':'Data resmi')+'</span><span title="'+html(entry.label)+'" class="dcm-lb-muted">'+html(entry.label)+'</span></div><button type="button" id="dcmHolidayManage">'+(can?'⚙ Kelola / Impor SKB':'☷ Lihat daftar libur')+'</button>';
    var old=panel.querySelector('.dcm-lb-bar');if(old)old.remove();
    panel.querySelector('.cal-header').insertAdjacentElement('afterend',out);
    var cells=panel.querySelectorAll('.cal-grid .cal-cell:not(.muted)');
    cells.forEach(function(cell){
      cell.querySelectorAll('.dcm-lb-chip').forEach(function(x){x.remove();});
      var n=(cell.querySelector('.cal-daynum')||{}).textContent||'',day=Number(n.trim());
      if(!day||day>31)return;
      var date=ym+'-'+String(day).padStart(2,'0'),event=entry.items[date];if(!event)return;
      var type=event.type==='collective'?'collective':'national',suffix=entry.kind==='projection'?' (proyeksi)':'';
      var chip=document.createElement('span');chip.className='dcm-lb-chip '+type+' '+entry.kind;
      chip.title=(type==='collective'?'Cuti bersama: ':'Libur nasional: ')+event.id+suffix+' — '+entry.label;
      chip.textContent=(type==='collective'?'CB · ':'LN · ')+String(event.id||'Hari libur').replace(/\s*\(proyeksi\)/gi,'').replace(/^Cuti Bersama\s+/i,'');
      var events=cell.querySelector('.cal-events-scroll');if(events)events.insertAdjacentElement('beforebegin',chip);else cell.appendChild(chip);
    });
  }
  function renderManager(){
    var body=popup('Kelola libur nasional & cuti bersama','Dashboard CM · Tahun 2025–2046');
    var intro='<div class="dcm-lb-note">Sumber berurutan: <b>dokumen SKB/SE hasil impor</b>, data resmi bawaan 2026–2027, kemudian <b>proyeksi</b>. Proyeksi cuti bersama mengikuti pola 2026–2027 dan <b>belum menjadi ketetapan pemerintah</b>. Impor baru mengganti data satu tahun setelah diperiksa dan disimpan.</div>';
    var rows='';
    for(var y=YEAR_MIN;y<=YEAR_MAX;y++){
      var z=monthSummary(y),e=z.source,kind=e.kind;
      rows+='<tr><td><b>'+y+'</b></td><td><span class="dcm-lb-pill '+kind+'">'+(kind==='import'?'Resmi · impor':kind==='official'?'Resmi · SKB':'Proyeksi')+'</span><small>'+html(e.label)+'</small></td><td>'+z.na+'</td><td>'+z.co+'</td><td><div class="dcm-lb-acts"><button type="button" data-lb-view="'+y+'">Lihat</button>'+(canManage()?'<button type="button" data-lb-import="'+y+'">Impor</button>':'')+(kind==='import'&&canManage()?'<button type="button" class="danger" data-lb-reset="'+y+'">Hapus impor</button>':'')+'</div></td></tr>';
    }
    body.innerHTML=intro+'<div class="dcm-lb-note dcm-lb-warning" style="margin-bottom:8px">Status sinkronisasi: <b>'+html(status)+'</b>. Data hanya disebut resmi jika berasal dari SKB/SE yang telah diverifikasi.</div><div class="dcm-lb-tablewrap"><table><thead><tr><th>Tahun</th><th>Sumber</th><th>Libur nasional</th><th>Cuti bersama</th><th style="text-align:right">Aksi</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    body.addEventListener('click',function(ev){
      var b=ev.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-lb-import')){openImport(+b.dataset.lbImport);return;}
      if(b.hasAttribute('data-lb-view')){openYear(+b.dataset.lbView);return;}
      if(b.hasAttribute('data-lb-reset')){var y=+b.dataset.lbReset;if(!canManage()||!data[y])return;if(!window.confirm('Hapus impor '+y+' dan kembali ke sumber bawaan/proyeksi?'))return;delete data[y];persist().then(function(){renderManager();decorate();});}
    });
    ensureSync();
  }
  function openYear(year){
    var x=yearInfo(year),body=popup('Daftar libur '+year,x.label),dates=Object.keys(x.items).sort(),rows=dates.map(function(d){
      var v=x.items[d];return '<tr><td>'+d+'</td><td>'+html(E.dowName(d))+'</td><td>'+(v.type==='collective'?'Cuti bersama':'Libur nasional')+'</td><td>'+html(v.id)+'</td></tr>';
    }).join('');
    body.innerHTML='<p class="dcm-lb-note">Sumber: <span class="dcm-lb-pill '+x.kind+'">'+(x.kind==='projection'?'Proyeksi (belum resmi)':'Resmi')+'</span> '+html(x.label)+'</p><div class="dcm-lb-tablewrap"><table><thead><tr><th>Tanggal</th><th>Hari</th><th>Jenis</th><th>Keterangan</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    var ft=dialog.querySelector('footer'),back=document.createElement('button');back.textContent='← Semua tahun';ft.prepend(back);back.addEventListener('click',renderManager);
  }
  function toIso(v){
    if(v instanceof Date&&!isNaN(v))return [v.getFullYear(),String(v.getMonth()+1).padStart(2,'0'),String(v.getDate()).padStart(2,'0')].join('-');
    if(typeof v==='number'&&window.XLSX&&XLSX.SSF){var p=XLSX.SSF.parse_date_code(v);if(p)return p.y+'-'+String(p.m).padStart(2,'0')+'-'+String(p.d).padStart(2,'0');}
    var s=String(v==null?'':v).trim(),m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
    m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})$/);
    return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';
  }
  function spreadsheetRows(book,year){
    var text=[],raw=[],mode='national';
    book.SheetNames.forEach(function(sn){
      if(/cuti/i.test(sn))mode='collective';
      else if(/libur/i.test(sn))mode='national';
      var a=XLSX.utils.sheet_to_json(book.Sheets[sn],{header:1,raw:false,defval:''});
      a.slice(0,700).forEach(function(row){
        var cells=row.map(function(v){return String(v==null?'':v).trim();}).filter(Boolean);if(!cells.length)return;
        var line=cells.join(' ');text.push(line);
        if(/cuti\s+bersama/i.test(line)&&cells.length<4){mode='collective';return;}
        if(/libur\s+nasional/i.test(line)&&cells.length<4){mode='national';return;}
        var date='',di=-1;cells.some(function(v,i){var iso=toIso(v);if(iso){date=iso;di=i;return true;}return false;});
        if(date){
          var label=cells.filter(function(v,i){return i!==di&&!/^\d{1,3}$/.test(v)&&!/^(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)$/i.test(v);}).join(' ').replace(/^(cuti bersama|libur nasional)\s*[:\-]?\s*/i,'').trim();
          raw.push({date:date,type:/cuti\s+bersama/i.test(line)?'collective':mode,name:(mode==='collective'?'Cuti Bersama ':'')+(label||'Hari libur'),on:true});
        }
      });
    });
    var inferred=E.guessYear(text)||year,parsed=E.parse(text,inferred);
    var all=new Map();
    parsed.concat(raw).forEach(function(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v.date))return;var key=v.date+'|'+v.type,prior=all.get(key);if(!prior||v.name.length>prior.name.length)all.set(key,Object.assign({on:true},v));});
    return {lines:text,rows:Array.from(all.values()).sort(function(a,b){return a.date.localeCompare(b.date);})};
  }
  function loadScript(src,globalName){
    return new Promise(function(resolve,reject){
      if(window[globalName]){resolve(window[globalName]);return;}
      var sc=document.createElement('script');sc.src=src;sc.async=true;
      sc.onload=function(){window[globalName]?resolve(window[globalName]):reject(Error('Pustaka '+globalName+' tidak dapat dibuka'));};
      sc.onerror=function(){reject(Error('Gagal mengunduh pustaka '+globalName));};
      document.head.appendChild(sc);
    });
  }
  async function extract(file){
    if(file.size>12*1024*1024)throw Error('Ukuran berkas maksimal 12 MB untuk menjaga respons aplikasi.');
    var name=String(file.name||'').toLowerCase();
    if(/\.(xlsx?|xlsm)$/.test(name)){
      if(!window.XLSX)await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','XLSX');
      var book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
      return spreadsheetRows(book,new Date().getFullYear());
    }
    if(/\.docx$/.test(name)){
      if(!window.mammoth)await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.10.0/mammoth.browser.min.js','mammoth');
      var r=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()}),lines=r.value.split(/\r?\n/).filter(Boolean);
      return {lines:lines,rows:E.parse(lines,E.guessYear(lines)).map(function(x){return Object.assign({on:true},x);})};
    }
    if(/\.(csv|txt)$/.test(name)){
      var lines=(await file.text()).split(/\r?\n/).filter(Boolean),result=E.parse(lines,E.guessYear(lines));
      return {lines:lines,rows:result.map(function(x){return Object.assign({on:true},x);})};
    }
    if(/\.pdf$/.test(name)){
      if(!window.pdfjsLib)await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js','pdfjsLib');
      if(!pdfjsLib.GlobalWorkerOptions.workerSrc)pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      var pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,lines=[];
      for(var i=1;i<=Math.min(pdf.numPages,8);i++){
        var page=await pdf.getPage(i),items=(await page.getTextContent()).items;
        var chunks=[],prevY=null;
        items.forEach(function(item){var yy=item.transform&&item.transform[5];if(prevY!==null&&yy!==prevY){chunks.push('\n');}chunks.push(item.str||'');prevY=yy;});
        lines.push.apply(lines,chunks.join(' ').split(/\r?\n/).filter(Boolean));
      }
      return {lines:lines,rows:E.parse(lines,E.guessYear(lines)).map(function(x){return Object.assign({on:true},x);})};
    }
    throw Error('Format belum didukung. Gunakan .docx, .xlsx, .xls, .xlsm, .pdf, .csv, atau .txt.');
  }
  function openImport(initialYear){
    if(!canManage()){renderManager();return;}
    var yr=initialYear,rows=[],source='',note='',isError=false;
    var body=popup('Impor SKB / Surat Edaran','Pratinjau & koreksi sebelum menyimpan · Word / Excel / PDF / CSV / TXT'),ft=dialog.querySelector('footer');
    var cancel=document.createElement('button');cancel.textContent='← Daftar tahun';ft.prepend(cancel);cancel.addEventListener('click',renderManager);
    var save=document.createElement('button');save.type='button';save.className='primary';save.textContent='Simpan sebagai data resmi';ft.appendChild(save);
    body.innerHTML='<div class="dcm-lb-note">Unggah dokumen resmi berisi daftar tanggal. Periksa <b>tanggal, jenis, dan uraian</b> terlebih dahulu; hasil impor hanya mengganti tahun yang dipilih. <b>.docx</b> dan <b>.xlsx/.xls</b> didukung. PDF hasil pindai tanpa teks perlu dikonversi menjadi teks terlebih dahulu.</div><label class="dcm-lb-upload">📄 <span><b>Impor Word / Excel / PDF / CSV / TXT</b><small>Klik untuk memilih berkas, atau tarik berkas ke area ini.</small></span><input type="file" hidden accept=".docx,.xlsx,.xls,.xlsm,.pdf,.csv,.txt" data-lb-file></label><div data-lb-notice class="dcm-lb-note" hidden></div><div class="dcm-lb-formrow"><label>Tahun <input type="number" data-lb-year min="2025" max="2046" value="'+yr+'"></label><label>Sumber / nomor SKB atau SE <input type="text" data-lb-source placeholder="Contoh: SKB 3 Menteri Tahun 2028"></label></div><div class="dcm-lb-formactions"><span data-lb-count class="dcm-lb-muted">Belum ada baris; pilih dokumen.</span><button type="button" data-lb-add>+ Tambah manual</button></div><div class="dcm-lb-tablewrap"><table class="dcm-lb-preview"><thead><tr><th>Pakai</th><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th></th></tr></thead><tbody data-lb-rows></tbody></table></div>';
    var file=body.querySelector('[data-lb-file]'),sourceInput=body.querySelector('[data-lb-source]'),yearInput=body.querySelector('[data-lb-year]'),tbody=body.querySelector('[data-lb-rows]');
    function draw(){
      var n=rows.filter(function(x){return x.on&&String(x.date||'').slice(0,4)===String(yr);}).length;
      body.querySelector('[data-lb-count]').textContent=rows.length+' baris terbaca · '+n+' terpilih untuk tahun '+yr;
      tbody.innerHTML=rows.map(function(r,i){return '<tr><td><input type="checkbox" data-i="'+i+'" data-f="on" '+(r.on?'checked':'')+'></td><td><input type="date" data-i="'+i+'" data-f="date" value="'+html(r.date)+'"></td><td><select data-i="'+i+'" data-f="type"><option value="national"'+(r.type!=='collective'?' selected':'')+'>Libur nasional</option><option value="collective"'+(r.type==='collective'?' selected':'')+'>Cuti bersama</option></select></td><td><input type="text" data-i="'+i+'" data-f="name" value="'+html(r.name)+'"></td><td><button class="danger" type="button" data-lb-del="'+i+'" title="Hapus baris">×</button></td></tr>';}).join('');
      save.disabled=n===0;
    }
    async function handle(f){
      if(!f)return;
      notice('Membaca dokumen '+f.name+'…',false);
      try{
        var r=await extract(f),inferred=E.guessYear(r.lines),yFromRows=(r.rows.find(function(a){return a.date&&/20\d\d/.test(a.date);})||{}).date;
        if(/20\d{2}/.test(yFromRows||''))yr=Number(yFromRows.slice(0,4));else if(inferred>=YEAR_MIN&&inferred<=YEAR_MAX)yr=inferred;
        rows=r.rows.filter(function(x){return x.date&&x.date.slice(0,4)>=String(YEAR_MIN)&&x.date.slice(0,4)<=String(YEAR_MAX);}).slice(0,400).map(function(x){return {date:x.date,name:x.name||'',type:x.type||'national',on:x.on!==false};});
        source='SKB/SE '+yr+' · '+f.name;sourceInput.value=source;yearInput.value=yr;
        notice(rows.length?'Terbaca '+rows.length+' baris. Periksa dan perbaiki isian sebelum disimpan.':'Tidak ada tanggal yang terbaca. Coba dokumen berteks jelas atau tambahkan baris manual.',!rows.length);
      }catch(ex){notice('Gagal membaca berkas: '+(ex.message||ex),true);}
      draw();
    }
    file.addEventListener('change',function(){var f=file.files[0];file.value='';handle(f);});
    var drop=body.querySelector('.dcm-lb-upload');
    drop.addEventListener('dragover',function(e){e.preventDefault();});
    drop.addEventListener('drop',function(e){e.preventDefault();handle(e.dataTransfer&&e.dataTransfer.files[0]);});
    body.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;if(b.hasAttribute('data-lb-add')){rows.push({on:true,date:yr+'-01-01',type:'national',name:''});draw();}if(b.hasAttribute('data-lb-del')){rows.splice(Number(b.dataset.lbDel),1);draw();}});
    body.addEventListener('change',function(ev){var el=ev.target;if(el===yearInput){yr=Number(el.value)||yr;draw();return;}if(el.dataset.i==null)return;var r=rows[Number(el.dataset.i)];if(!r)return;r[el.dataset.f]=el.dataset.f==='on'?el.checked:el.value;draw();});
    body.addEventListener('input',function(ev){var el=ev.target;if(el.dataset.f==='name'&&rows[Number(el.dataset.i)])rows[Number(el.dataset.i)].name=el.value;if(el===sourceInput)source=el.value;});
    save.addEventListener('click',async function(){
      if(!canManage()){notice('Akses Anda tidak mengizinkan impor data.',true);return;}
      if(yr<YEAR_MIN||yr>YEAR_MAX){notice('Tahun harus berada di antara 2025–2046.',true);return;}
      var selected=rows.filter(function(x){return x.on&&x.date.slice(0,4)===String(yr)&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&String(x.name||'').trim();});
      if(!selected.length){notice('Pilih minimal satu baris valid dengan keterangan.',true);return;}
      if(!selected.some(function(x){return x.type==='collective';})&&!confirm('Dokumen ini tidak mencantumkan cuti bersama. Data cuti bersama proyeksi/bawaan tahun '+yr+' tidak akan dipakai. Tetap simpan?'))return;
      if(data[yr]&&!confirm('Timpa data resmi hasil impor sebelumnya untuk tahun '+yr+'?'))return;
      var items={};selected.forEach(function(r){items[r.date]={type:r.type==='collective'?'collective':'national',id:r.name.trim()};});
      data[yr]={label:(source||'SKB/SE '+yr).trim().slice(0,250),items:items,at:new Date().toISOString(),by:(window.fbAuth&&window.fbAuth.currentUser&&window.fbAuth.currentUser.email)||''};
      save.disabled=true;
      var remote=await persist();
      decorate();renderManager();
      var text=Object.keys(items).length+' tanggal '+yr+' disimpan. '+(remote?'Tersinkron ke Firestore.':'Tersimpan di browser ini; periksa izin sinkronisasi untuk penggunaan bersama.');
      var c=dialog.querySelector('.dcm-lb-content'),n=document.createElement('div');n.className='dcm-lb-note '+(remote?'':'dcm-lb-warning');n.textContent=text;c.prepend(n);
    });
    draw();
  }
  async function persist(){
    writeLocal();
    if(!canManage()||!window.fbDb||!window.fbAuth||!window.fbAuth.currentUser||!window.fbDoc||!window.fbSetDoc){status='Lokal (belum tersinkron)';return false;}
    try{
      await window.fbSetDoc(window.fbDoc(window.fbDb,'dashboard',CLOUD_KEY),{value:JSON.stringify(data),updatedAt:new Date().toISOString()});
      status='Sinkron Firestore';return true;
    }catch(e){console.warn('DCM holiday sync failed',e);status='Lokal (izin Firestore belum tersedia)';return false;}
  }
  function ensureSync(){
    if(syncUnsub||!window.fbDb||!window.fbDoc||!window.fbOnSnapshot||!window.fbAuth||!window.fbAuth.currentUser)return;
    try{
      syncUnsub=window.fbOnSnapshot(window.fbDoc(window.fbDb,'dashboard',CLOUD_KEY),function(snap){
        if(!snap.exists()){status='Firestore siap · belum ada impor';return;}
        try{
          var raw=JSON.parse(snap.data().value||'{}');
          if(raw&&typeof raw==='object'&&!Array.isArray(raw)){data=raw;writeLocal();status='Sinkron Firestore';decorate();}
        }catch(e){console.warn('Invalid holiday config in Firestore',e);}
      },function(e){console.warn('Holiday subscription unavailable',e);status='Lokal (Firestore tidak mengizinkan)';syncUnsub=null;});
    }catch(e){status='Lokal (Firestore tidak tersedia)';}
  }
  function start(){
    injectCss();
    panel=document.getElementById('tab-calendar');
    if(!panel)return;
    decorate();
    watch=new MutationObserver(function(changes){
      if(changes.some(function(r){return Array.from(r.addedNodes).some(function(n){return n.nodeType===1&&(n.matches('.cal-header,.cal-grid')||n.querySelector&&n.querySelector('.cal-grid'));});}))decorate();
    });
    watch.observe(panel,{childList:true});
    document.addEventListener('click',function(ev){
      if(ev.target.closest('#dcmHolidayManage')){renderManager();return;}
      if(ev.target.closest('#tabNav [data-tab="calendar"]')){setTimeout(decorate,0);ensureSync();}
    });
    document.addEventListener('focusin',function(ev){if(ev.target.closest('#dcmHolidayManage'))ensureSync();});
    setTimeout(ensureSync,1400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
