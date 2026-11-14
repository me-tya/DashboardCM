#!/usr/bin/env python3
"""DCM-43: Compact collapsible Prioritas filter; no changes to ranking logic.
Default collapsed (user request). Toggling uses localStorage and DOM only;
the current search, filter, snapshot, and sorting states remain intact.
"""
from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf8")
a=s.index("function renderPriority(){")
b=s.index("/* ---------- Form proyek ---------- */",a)
part=s[a:b]
assert part.count("let body='';")==1
part=part.replace("let body='';", """const prioFilterOpen=prioLsGet('cmPrioFilterOpen','0')==='1';
  const prioActiveFilterCount=[prioUi.scope.type!=='all',!!String(prioUi.q||'').trim(),prioUi.filter!=='all'].filter(Boolean).length;
  let body='';""",1)

old="""if(tab==='projects')body=`<section class="prio-filter-panel"><div class="prio-filter-head"><span class="prio-filter-head-icon" aria-hidden="true">≡</span><strong>${uiText('Ranking Filters','Filter Peringkat')}</strong><span class="prio-filter-hint" title="${escapeHtml(prioScopeNote(rows))}">${uiText('Choose a scope to view and rank projects.','Tentukan lingkup untuk melihat dan meranking proyek.')}</span></div>${prioScopeBarHtml()}"""
new="""if(tab==='projects')body=`<section class="prio-filter-panel${prioFilterOpen?'':' is-collapsed'}"><div class="prio-filter-head"><span class="prio-filter-head-icon" aria-hidden="true">≡</span><strong>${uiText('Ranking Filters','Filter Peringkat')}</strong><span class="prio-filter-hint" title="${escapeHtml(prioScopeNote(rows))}">${uiText('Scope, status, order, and snapshot comparison','Lingkup, status, urutan, dan perbandingan snapshot')}</span>${prioActiveFilterCount?`<span class="prio-filter-active-chip">${prioActiveFilterCount} ${uiText('active filters','filter aktif')}</span>`:''}${nInc?`<span class="prio-filter-warning-chip" title="${uiText('Projects with incomplete data; open filters to review details.','Proyek memiliki data belum lengkap; buka filter untuk melihat rinciannya.')}">⚠ ${nInc} ${uiText('incomplete','belum lengkap')}</span>`:''}<button type="button" id="prioFilterToggle" class="prio-filter-toggle" aria-expanded="${prioFilterOpen}" aria-label="${uiText(prioFilterOpen?'Hide ranking filters':'Show ranking filters',prioFilterOpen?'Sembunyikan Filter Peringkat':'Tampilkan Filter Peringkat')}"><span class="prio-filter-toggle-label">${uiText(prioFilterOpen?'Hide filters':'Show filters',prioFilterOpen?'Sembunyikan':'Tampilkan')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>${prioScopeBarHtml()}"""
assert part.count(old)==1,("Priority filter header unexpected",part.count(old))
part=part.replace(old,new,1)

anchor="""el.querySelector('#prioCmpSnap')?.addEventListener('change',e=>{prioUi.cmpSnap=e.target.value||'';renderPriority();});"""
assert part.count(anchor)==1
handler="""el.querySelector('#prioFilterToggle')?.addEventListener('click',()=>{
    const panel=el.querySelector('.prio-filter-panel');
    const toggle=el.querySelector('#prioFilterToggle');
    if(!panel||!toggle)return;
    const opening=panel.classList.contains('is-collapsed');
    panel.classList.toggle('is-collapsed',!opening);
    toggle.setAttribute('aria-expanded',String(opening));
    toggle.setAttribute('aria-label',uiText(opening?'Hide ranking filters':'Show ranking filters',opening?'Sembunyikan Filter Peringkat':'Tampilkan Filter Peringkat'));
    const label=toggle.querySelector('.prio-filter-toggle-label');
    if(label)label.textContent=uiText(opening?'Hide filters':'Show filters',opening?'Sembunyikan':'Tampilkan');
    prioLsSet('cmPrioFilterOpen',opening?'1':'0');
  });
  el.querySelector('.prio-filter-head')?.addEventListener('click',e=>{
    if(e.target.closest('button'))return;
    el.querySelector('#prioFilterToggle')?.click();
  });
  """
part=part.replace(anchor,handler+anchor,1)
assert part.count("class=\"prio-filter-panel${prioFilterOpen?'':' is-collapsed'}\"")==1
assert part.count('id="prioFilterToggle"')==1
assert part.count("el.querySelector('#prioFilterToggle')?.addEventListener('click'")==1
assert part.count("el.querySelector('.prio-filter-head')?.addEventListener('click'")==1
assert part.count('prioSnapBarHtml(can)')==1
assert part.count('data-prio-kpi=')==5
assert part.count('class="prio-filter-panel')==1
assert "el.querySelector('#prioSnapSave')?.addEventListener('click'" in part
assert "el.querySelectorAll('[data-prio-filter]').forEach" in part
assert "el.querySelectorAll('[data-prio-sort]').forEach" in part
assert "el.querySelectorAll('[data-prio-view]').forEach" in part
s=s[:a]+part+s[b:]
# Same CSS bundle approach as past versions; load after existing Opsi 1 stylesheet.
tag='<link rel="stylesheet" href="dcm-priority-collapsible-filter-43.css?v=261114-43">'
assert tag not in s and s.count('dcm-priority-filter-option1-42.css?v=261114-42')==1
idx=s.lower().find('</head>')
assert idx>0
s=s[:idx]+tag+'\n'+s[idx:]
assert s.count(tag)==1
p.write_text(s,encoding="utf8")
print("PASS: default-collapsed Prioritas filter, keyboard-operable toggle, persistent state, original controls and handlers retained")
