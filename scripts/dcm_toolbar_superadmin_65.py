#!/usr/bin/env python3
"""DCM-65: compact Data & Backup, database icon, signed-in Superadmin only."""
from pathlib import Path
import re

root = Path(".")
js_path = root / "dcm-mt-doc-tools.js"
css_path = root / "dcm-mt-doc-tools.css"
index_path = root / "index.html"

def replace_exact(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise AssertionError(f"{label}: expected once, got {count}")
    return text.replace(old, new, 1)

js = js_path.read_text(encoding="utf-8")
js = replace_exact(
    js,
    "const privileged=()=>typeof cmCanManageReferences==='function'&&cmCanManageReferences();",
    "const privileged=()=>typeof cmCanManageReferences==='function'&&cmCanManageReferences();\n"
    "// The data-management toolbar is for authenticated Superadmin accounts only.\n"
    "const loggedInSuperadmin=()=>privileged()&&document.documentElement.getAttribute('data-role')==='superadmin'&&!!window.fbAuth?.currentUser;",
    "verified signed-in role helper"
)
js = replace_exact(
    js,
    "function renderMenu(button){\n const old=document.getElementById('dcmMtDbkMenu');",
    "function renderMenu(button){\n"
    " if(!loggedInSuperadmin()){document.getElementById('dcmMtDbkMenu')?.remove();button?.remove();return;}\n"
    " const old=document.getElementById('dcmMtDbkMenu');",
    "guard menu operations"
)
js = replace_exact(
    js,
    " if(!bar||!filter)return;\n let button=document.getElementById('dcmActDbk');",
    " if(!bar||!filter)return;\n"
    " if(!loggedInSuperadmin()){\n"
    "  document.getElementById('dcmMtDbkMenu')?.remove();\n"
    "  document.getElementById('dcmActDbk')?.remove();\n"
    "  alignFilterResetWithReports();\n"
    "  return;\n"
    " }\n"
    " let button=document.getElementById('dcmActDbk');",
    "superadmin visibility gate"
)
js = replace_exact(
    js,
    "<svg viewBox=\"0 0 24 24\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M4 6h16M4 12h16M4 18h16\"/></svg><span>Data &amp; Backup</span>",
    "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3\"/></svg><span>Data &amp; Backup</span>",
    "replace list icon with database icon"
)
js = replace_exact(
    js,
    "const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))mount();});",
    "const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))mount();});\n"
    "// Role is stored on <html>, outside the existing body observer.\n"
    "const roleObserver=new MutationObserver(()=>mount());\n"
    "roleObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-role']});",
    "re-evaluate when signed-in role changes"
)
js_path.write_text(js, encoding="utf-8")

css = css_path.read_text(encoding="utf-8")
css += """
/* DCM-65: search / Filter / Data & Backup have matching compact heights.
   Pale navy distinguishes the administrator data action from the gray filter. */
html:not([data-role="superadmin"]) #dcmActDbk{display:none!important}
#dcmActDbk{
  box-sizing:border-box!important;
  height:42px!important;min-height:42px!important;
  padding:0 13px!important;
  background:#e8f0fb!important;border:1px solid #a8bfdc!important;
  color:#143d72!important;border-radius:9px!important;
}
#dcmActDbk:hover,#dcmActDbk[aria-expanded="true"]{
  background:#d9e7f9!important;border-color:#668ebd!important;color:#0b2e5a!important;
}
#dcmActDbk svg{width:17px;height:17px;flex:0 0 17px}
#contextFilterBar .filter-bar-row1 #searchInput,
#contextFilterBar .filter-bar-row1 #btnFilterToggle,
#contextFilterBar .filter-bar-row1 #dcmActDbk{
  box-sizing:border-box!important;
  height:42px!important;min-height:42px!important;max-height:42px!important;
}
#contextFilterBar .filter-bar-row1 #searchInput{padding-top:0!important;padding-bottom:0!important}
#contextFilterBar .filter-bar-row1 #btnFilterToggle,
#contextFilterBar .filter-bar-row1 #dcmActDbk{padding-top:0!important;padding-bottom:0!important}
"""
css_path.write_text(css,encoding="utf-8")

html=index_path.read_text(encoding="utf-8")
for typ in ("css","js"):
    html,n=re.subn(
        r"(dcm-mt-doc-tools\."+typ+r"\?v=)[^\"'\s<>]+",
        lambda m:m.group(1)+"261116-65",
        html
    )
    if n!=1: raise AssertionError(f"Cache bust for {typ}: {n} matches")
index_path.write_text(html,encoding="utf-8")

# Static acceptance checks for all four signed-in role categories.
assert "loggedInSuperadmin()" in js
assert "document.documentElement.getAttribute('data-role')==='superadmin'" in js
assert "!!window.fbAuth?.currentUser" in js
assert "if(!loggedInSuperadmin())" in js
assert "const roleObserver=new MutationObserver" in js
assert "ellipse cx=" in js
assert "M4 6h16M4 12h16M4 18h16" not in js
assert "height:42px!important;min-height:42px!important;max-height:42px!important;" in css
assert "html:not([data-role=\"superadmin\"]) #dcmActDbk" in css
assert "dcm-mt-doc-tools.js?v=261116-65" in html
assert "dcm-mt-doc-tools.css?v=261116-65" in html
print("DCM-65 PASS: 42px toolbar height, navy database icon, login+Superadmin gate, role changes, refreshed assets.")
