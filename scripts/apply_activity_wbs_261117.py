#!/usr/bin/env python3
"""Apply PM/CM WBS integration to DashboardCM index.html; fail closed on changed source."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'activity-wbs-dcm.js' in s:
    print('Already integrated; no changes')
    raise SystemExit(0)
def change(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f'{label}: expected one anchor, found {n}')
    s=s.replace(old,new,1)
s=s.replace('</head>',
       '<link rel="stylesheet" href="activity-wbs.css">\n<script defer src="activity-wbs.js"></script>\n<script defer src="activity-wbs-dcm.js"></script>\n</head>',
       1)
old="  sec(P.info,2,U('Classification','Klasifikasi'),U('Used for statistics & reports.','Untuk statistik & laporan.'),[row('af-g3',[F('layanan'),F('unitPemohon'),F('kategori')]),F('programTerkait')]);"
new="  const wbsBody=sec(P.info,2,U('Classification','Klasifikasi'),U('Used for statistics & reports.','Untuk statistik & laporan.'),[row('af-g3',[F('layanan'),F('unitPemohon'),F('kategori')]),F('programTerkait')]);\n  wbsBody.appendChild(cmAfEl('<div class=\"wbs-inline-field\">'+window.ActivityWBS.formHTML(a||{})+'</div>'));\n  window.ActivityWBS.wire(wbsBody);"
change(old,new,'place classification in existing form')
old="  fd.forEach((val, key) => obj[key] = val);"
new="""  fd.forEach((val, key) => obj[key] = val);
  if(obj.wbsGroup==='CM')obj.wbsLevel4='Manajemen Perubahan';
  if(!window.ActivityWBS.valid(obj.wbsGroup,obj.wbsLevel4,obj.wbsLevel5))
    error=uiText('Select PM/CM, WBS Level 4 and WBS Level 5 before saving the activity.','Pilih PM/CM, WBS Level 4, dan WBS Level 5 sebelum menyimpan aktivitas.');
"""
change(old,new,'persist validated group and levels')
change("  const q = normalizeActivitySearchText(f.search);\n  let out = state.agendas.filter(a => {",
       "  const q = normalizeActivitySearchText(f.search);\n  let out = state.agendas.filter(a => {\n    if(!window.ActivityWBS.matches(a,f,'tglMulai'))return false;",
       'filter saved activity records')
change("['kategori','program','status','pic','unit','layanan','tahun','unitType'].forEach(k=>{",
       "['kategori','program','status','pic','unit','layanan','tahun','unitType','wbsGroup','wbsLevel4','wbsLevel5','wbsQuarter'].forEach(k=>{",
       'count active filter badge')
change("    body.innerHTML=html;populateFilterDropdowns();",
       """    body.innerHTML=html;populateFilterDropdowns();
    window.ActivityWBS.attachDcmFilters(body,state.filters,
      ()=>{configureContextToolbar(tab);state.page=1;renderActiveTab();updateFilterActiveBadge();},
      ()=>{
        const items=getFiltered();
        const rows=[['Tanggal','Nama Aktivitas','PM/CM','WBS Level 4','WBS Level 5','Kategori','Program','Unit Pemohon','PIC','Status']];
        items.forEach(a=>rows.push([a.tglMulai||'',a.namaKegiatan||'',a.wbsGroup||'',a.wbsLevel4||'',a.wbsLevel5||'',a.kategori||'',a.programTerkait||'',a.unitPemohon||'',a.picTimCM||'',a.statusNorm||'']));
        window.ActivityWBS.csv('IKU-PM-CM-'+(state.filters.tahun||'Semua')+'-TW'+(state.filters.wbsQuarter||'Semua')+'.csv',rows);
      });
""",
       'attach WBS filters to existing toolbar')
change("cmEoMiniBadge(a)}</div>",
       "cmEoMiniBadge(a)}"+chr(36)+"{window.ActivityWBS.badge(a)}</div>",
       'tag each classified activity in list')
p.write_text(s,encoding='utf-8')
print('PM/CM WBS integrated in DashboardCM:',len(s),'bytes')
