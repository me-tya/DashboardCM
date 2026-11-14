#!/usr/bin/env python3
"""Targeted Dashboard CM DCM-37 change: use existing Priority filters/details."""
from pathlib import Path

p = Path("index.html")
src = p.read_text(encoding="utf-8")
start = src.index("function renderPriority(){")
end = src.index("/* ---------- Form proyek ---------- */", start)
render = src[start:end]
a = render.index('<div class="prio-kpis">')
# Match the closing tag for the KPI grid structurally. Dynamic template strings
# may contain other occurrences of rows.length before the grid ends.
import re
b = None
depth = 0
for match in re.finditer(r'</?div\b[^>]*>', render[a:]):
    tag = match.group(0)
    depth += -1 if tag.startswith('</') else 1
    if depth == 0:
        b = a + match.end()
        break
assert b is not None and b > a, 'Priority KPI grid closing tag not found'
old_cards = render[a:b]
print("DCM37 CARD BOUNDARIES", old_cards.count('class="prio-kpi'), len(old_cards), repr(old_cards[:220]), repr(old_cards[-500:]))
assert old_cards.count('class="prio-kpi') == 5, "The five original KPI cards must be present"
assert "const top=rows[0]" in render and "const cnt={high:0,mid:0,low:0}" in render

new_cards = '''<div class="prio-kpis" aria-label="${uiText('Project priority summary','Ringkasan prioritas proyek')}">
  <button type="button" class="prio-kpi" data-prio-kpi="all" aria-pressed="${prioUi.filter==='all'}" title="${uiText('View all ranked projects','Lihat seluruh proyek yang diranking')}"><b>${rows.length}</b><small>${prioUi.scope.type==='km'?uiText('Ministry-level projects','Proyek tingkat Kementerian'):uiText('Projects ranked','Proyek diranking')}</small></button>
  <button type="button" class="prio-kpi k-high" data-prio-kpi="high" aria-pressed="${prioUi.filter==='high'}" title="${uiText('View high-priority projects','Lihat proyek prioritas tinggi')}"><b>${cnt.high}</b><small>${uiText('High priority','Prioritas Tinggi')} <em>≥70</em></small></button>
  <button type="button" class="prio-kpi k-mid" data-prio-kpi="mid" aria-pressed="${prioUi.filter==='mid'}" title="${uiText('View medium-priority projects','Lihat proyek prioritas sedang')}"><b>${cnt.mid}</b><small>${uiText('Medium','Prioritas Sedang')} <em>40–69</em></small></button>
  <button type="button" class="prio-kpi k-low" data-prio-kpi="low" aria-pressed="${prioUi.filter==='low'}" title="${uiText('View low-priority projects','Lihat proyek prioritas rendah')}"><b>${cnt.low}</b><small>${uiText('Low','Prioritas Rendah')} <em>&lt;40</em></small></button>
  <button type="button" class="prio-kpi k-top" data-prio-kpi="top" aria-pressed="false" title="${uiText('Open highest-ranked project details','Buka rincian proyek prioritas teratas')}" ${top?'':'disabled'}><small>${uiText('Top priority','Prioritas teratas')}</small><b class="prio-top-name">${top?escapeHtml(top.p.singkatan||top.p.nama):'—'}</b>${top?'<small>'+uiText('score','skor')+' '+prioFmt(top.score,1)+'</small>':''}</button>
</div>'''
render = render[:a] + new_cards + render[b:]

anchor = "  el.querySelectorAll('[data-prio-filter]').forEach(b=>b.onclick=()=>{prioUi.filter=b.dataset.prioFilter;renderPriority();});"
assert render.count(anchor) == 1, "Must keep the original filter handler"

drilldown = """  // KPI cards re-use the same filters and read-only per-project details.
  el.querySelectorAll('[data-prio-kpi]').forEach(card=>card.addEventListener('click',()=>{
    const kind=card.dataset.prioKpi;
    if(!['all','high','mid','low','top'].includes(kind))return;
    const topId=kind==='top'&&top?top.p.id:'';
    prioUi.q='';
    prioUi.filter=['high','mid','low'].includes(kind)?kind:'all';
    prioUi.view='list';
    prioLsSet('cmPrioView','list');
    if(topId)prioUi.open.add(topId);
    renderPriority();
    requestAnimationFrame(()=>{
      const current=document.getElementById('tab-priority');
      if(!current)return;
      const topRow=topId?[...current.querySelectorAll('[data-prio-id]')].find(row=>row.dataset.prioId===topId):null;
      const target=topRow||current.querySelector('#prioListBody')||current.querySelector('.prio-list');
      if(target&&typeof target.scrollIntoView==='function'){
        const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
      }
    });
  }));
"""
render = render.replace(anchor, anchor + "\n" + drilldown, 1)
assert render.count('data-prio-kpi=') == 5
assert render.count("el.querySelectorAll('[data-prio-kpi]')") == 1
assert "el.querySelectorAll('[data-prio-filter]')" in render

new = src[:start] + render + src[end:]
css = '<link rel="stylesheet" href="dcm-knowledge-priority-compact-37.css?v=261114-37">'
assert css not in new
head = new.lower().find("</head>")
assert 0 < head < new.lower().find("<body")
new = new[:head] + css + "\n" + new[head:]
assert new.count(css) == 1
p.write_text(new, encoding="utf-8")
print("PASS: five KPI drilldowns, original priority filters/permissions unchanged, compact layout linked")
