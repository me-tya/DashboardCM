#!/usr/bin/env python3
"""DCM-40: reproduce the user's original Prioritas Proyek mockup.
Only relocate data-derived KPI cards, restore the page heading, group filters,
and retain all original buttons/handlers/data bindings. Aborts on any drift.
"""
from pathlib import Path
import re
p=Path("index.html")
src=p.read_text(encoding="utf8")
a=src.index('function renderPriority(){')
b=src.index('/* ---------- Form proyek ---------- */',a)
render=src[a:b]

# The KPI stage is currently INSIDE the project filter body and BELOW subtabs.
# Extract the original live data-backed cards (do not hardcode counts).
c=render.index('<div class="prio-kpis" aria-label=')
d=render.index('\n</div>',c)+len('\n</div>')
cards=render[c:d]
assert cards.count('data-prio-kpi=')==5, 'Expected original 5 KPI click targets'
assert all('data-prio-kpi="'+k+'"' in cards for k in ('all','high','mid','low','top'))
render=render[:c]+render[d:]

icons={
'all':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="m12 2-9 5 9 5 9-5-9-5Z"/><path d="m3 11 9 5 9-5M3 15l9 5 9-5"/></svg>',
'high':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 10 6-3 6 3-2-10M12 5.5v5"/></svg>',
'mid':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M3 21h18M4 13h4v8H4zm6-6h4v14h-4zm6-5h4v19h-4z"/></svg>',
'low':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M3 12 12 3h9v9l-9 9L3 12Z"/><circle cx="17" cy="7" r="1"/></svg>',
'top':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10v7c0 4-2.3 6-5 6s-5-2-5-6V3ZM7 5H3v4c0 3 2 4 5 4M17 5h4v4c0 3-2 4-5 4M12 16v4M8 22h8"/></svg>'
}
for kind,svg in icons.items():
    pat=re.compile(r'(<button\b[^>]*\bdata-prio-kpi="'+re.escape(kind)+r'"[^>]*>)')
    found=pat.findall(cards)
    assert len(found)==1, ('Missing exact KPI icon target',kind,len(found))
    cards=pat.sub(lambda m:m.group(1)+'<span class="prio-kpi-symbol" aria-hidden="true">'+svg+'</span>',cards,count=1)
assert cards.count('class="prio-kpi-symbol"')==5

# Existing project body: scope, KPI, filters, warning, list. Build distinct
# Filter Peringkat panel, leaving ranking list and every data handler untouched.
old_prefix="""if(tab==='projects')body=`${prioScopeBarHtml()}<p class="prio-scope-note">${escapeHtml(prioScopeNote(rows))}</p>"""
new_prefix="""if(tab==='projects')body=`<section class="prio-filter-panel"><div class="prio-filter-head"><span class="prio-filter-head-icon" aria-hidden="true">≡</span><strong>${uiText('Ranking Filters','Filter Peringkat')}</strong><span class="prio-filter-hint" title="${escapeHtml(prioScopeNote(rows))}">${uiText('Choose a scope to view and rank projects.','Tentukan lingkup untuk melihat dan meranking proyek.')}</span></div>${prioScopeBarHtml()}"""
assert render.count(old_prefix)==1, ('Project filter/KPI prefix differs from expected',render.count(old_prefix))
render=render.replace(old_prefix,new_prefix,1)
listing='\n  <section class="prio-list">'
assert render.count(listing)==1, 'Original priority list anchor changed'
render=render.replace(listing,'\n  </section>\n  <section class="prio-list">',1)

# Move the exact same five live KPI buttons ABOVE the submenus. Only project
# tab shows them, as in the supplied approved mockup.
assert render.count("let body='';")==1
render=render.replace("let body='';","const prioKpisHtml=`"+cards+"`;\n let body='';",1)

hero_start=render.index('<div class="prio-hero"><div><h2>')
tabs_start=render.index('\n  <div class="cm-survey-subtabs prio-subtabs"',hero_start)
hero=render[hero_start:tabs_start]
assert hero.count('id="prioAdd"')==1 and hero.count('id="prioExport"')==1 and hero.count('id="prioReport"')==1
hero=hero.replace('<div class="prio-hero"><div><h2>','<div class="prio-hero"><div class="prio-title-group"><h2>',1)
hero,n1=re.subn(r'<h2>.*?</h2>',"""<h2>${uiText('Project Prioritization','Prioritas Proyek')}</h2>""",hero,count=1,flags=re.S)
hero,n2=re.subn(r'<p>.*?</p>',"""<p>${uiText('Ranking of transformation projects based on criteria, weights, and benefit indicators.','Pemeringkatan proyek transformasi berdasarkan kriteria, bobot, dan indikator manfaat.')}</p>""",hero,count=1,flags=re.S)
assert n1==1 and n2==1
stage="""\n  ${tab==='projects'?`<section class="prio-kpi-stage" aria-label="${uiText('Project priority at a glance','Ringkasan prioritas proyek')}">${prioKpisHtml}</section>`:''}"""
render=render[:hero_start]+hero+stage+render[tabs_start:]
assert render.count('class="prio-kpi-stage"')==1
assert render.count('class="prio-filter-panel"')==1
assert render.count('class="prio-title-group"')==1
assert render.count('data-prio-kpi=')==5
assert render.index('class="prio-kpi-stage"')<render.index('class="cm-survey-subtabs prio-subtabs"')
assert render.index('class="cm-survey-subtabs prio-subtabs"')<render.index('${body}</div>'), 'Rendered body follows tabs'
assert "el.querySelectorAll('[data-prio-kpi]').forEach" in render
assert "el.querySelectorAll('[data-prio-tab]').forEach" in render
assert 'prioSnapBarHtml(can)' in render and 'prioCapacityHtml(rows)' in render

out=src[:a]+render+src[b:]
tag='<link rel="stylesheet" href="dcm-priority-original-mockup-40.css?v=261114-40">'
assert tag not in out and 'dcm-priority-justify-subtabs-38.css?v=261114-39' in out
head=out.lower().find('</head>')
assert 0<head<out.lower().find('<body')
out=out[:head]+tag+'\n'+out[head:]
assert out.count(tag)==1
p.write_text(out,encoding="utf8")
print("PASS: faithful Prioritas mockup section order, navy KPI stage, separated filter panel, live card data, unchanged actions")
