#!/usr/bin/env python3
"""Vaultwake Merge art provenance (release 2026-11-08, after the owner's AI-origin statement).

Adds four columns to docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv and
release/crazygames-basic/ASSET_INVENTORY.csv from the records in this repository:
  origin_class          how the shipped file was made
  master_or_record      the master image and/or generation note it traces to ("none in repo" if neither)
  ai_tool_recorded      what the repository's own notes say about the tool (never inferred beyond them)
  commercial_terms      what is and is not evidenced about commercial-use permission
owner_approved is left as it is (NO); this script never sets it.
  python3 tools/rights-classify.py
"""
import csv, io, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = 'v5/assets/premium/'
OWNER = 'Owner statement 2026-11-08: all artwork AI-generated for this project; none from external artists or stock'
AI_DIRECT = 'AI-generated artwork (owner-confirmed); used as generated, resized/converted only'
AI_DERIVED = 'AI-generated artwork (owner-confirmed); cut, cropped or processed in the project from a master'
RENDER = 'In-project render made by code in this repository (no image generator)'
TOOL_NOTE = 'repo notes: "built-in image tool / imagegen" in an AI assistant session; provider, account and plan not named'
TOOL_CHATGPT = 'repo notes: art brief asks for "ChatGPT image generation" (docs/V5_COAST_ART_BRIEF_2026-10-23.md); account and plan not named'
TOOL_NONE = 'no generation record in the repository'
TERMS_AI = ('NOT VERIFIED: tool/account/plan undocumented. If made with OpenAI ChatGPT (as the repo notes suggest), '
            'OpenAI Terms of Use eff. 2026-01-01 assign Output to the user ("you ... own the Output"); output may not be unique; '
            'Output must not be represented as human-generated. Owner to confirm tool, account and dates.')
TERMS_RENDER = 'No third-party generator; produced by project code (render-places.html / SVG). Owner to confirm code authorship.'

sheet41l = {f'gen-{g}' for g in ('chart', 'rope', 'shell', 'lamp')} | {f'rig-{t}' for t in range(4, 8)} | \
    {f'chart-{t}' for t in range(8)} | {f'rope-{t}' for t in range(6)} | {f'shell-{t}' for t in range(6)} | \
    {f'lamp-{t}' for t in range(5)} | {'cargo-basket', 'driftwood-crate', 'sea-chest', 'captains-trunk', 'tide-token', 'brass-cog'}
icon_masters = {
    'grip-tool-v2': 'docs/art-source/coastal-tools-2026-10-27/grip-pliers-v2.png',
    'split-spanner-v2': 'docs/art-source/coastal-tools-2026-10-27/adjustable-wrench.png',
    'cargo-crate-v2': 'docs/art-source/coastal-crate-2026-10-28/cargo-crate-master.webp',
    'cargo-barrel-v2': 'docs/art-source/coastal-crate-2026-10-28/cargo-barrel-master.webp',
    'cargo-bundle-pilot': 'docs/art-source/coastal-pilot-2026-10-27/supply-bag.png',
    'gen-rig-pilot': 'docs/art-source/coastal-pilot-2026-10-27/drill-rover.png',
    'mech-0': 'docs/art-source/rover-secondary-2026-10-29/bolt-master.webp',
    'mech-1': 'docs/art-source/rover-secondary-2026-10-29/gear-master.webp',
    'mech-2': 'docs/art-source/rover-secondary-2026-10-29/gear-assembly-master.webp',
    'mech-3': 'docs/art-source/rover-secondary-2026-10-29/hand-crank-master.webp',
    'notes-0': 'docs/art-source/kite-secondary-2026-10-29/note-fragment-master.webp',
    'notes-1': 'docs/art-source/kite-secondary-2026-10-29/expedition-note-master.webp',
    'notes-2': 'docs/art-source/kite-secondary-2026-10-29/travel-notebook-master.webp',
    'notes-3': 'docs/art-source/kite-secondary-2026-10-29/captains-logbook-master.webp'}
ui_masters = {'cell': 'board-cell', 'coast-bg': 'coast-background', 'crew-nara': 'crew-nara-proposed', 'crew-sela': 'crew-sela-proposed',
              'deliver': 'deliver-button', 'ice-0': 'ice-intact', 'ice-1': 'ice-cracked', 'ice-2': 'ice-heavy'}
chapters = {'hidden-harbour': ('hidden-harbour-2026-11-01', 'CLAUDE_HANDOFF.md: "Generated with the built-in image tool"; 4 master sheets'),
            'answering-light': ('answering-light-2026-11-02', 'pack/manifest.json (per-master SHA-256, "generated masters")'),
            'lowwater-passage': ('lowwater-passage-2026-11-02', 'pack/prompts.json (per-image prompts), pack/ART_REVIEW.md ("generated")'),
            'keepers-promise': ('keepers-promise-2026-11-02', 'pack/prompts.json (per-image prompts), pack/ART_REVIEW.md ("generated")')}
direct_notes = {'copper-offcut-vibrant': 'v5/assets/premium/VIBRANT-SLICE.md, README.md (prompts recorded)',
                'pocket-winch-vibrant': 'v5/assets/premium/VIBRANT-SLICE.md, README.md (prompts recorded)',
                'landing-vibrant': 'v5/assets/premium/VIBRANT-SLICE.md, README.md (prompts recorded)',
                'route-fold-vibrant': 'v5/assets/premium/BOARD-COHESION.md (prompts recorded)',
                'worksite-vibrant': 'v5/assets/premium/CHAPTER-ART.md (prompts recorded)',
                'workshop-operational': 'v5/assets/premium/WORKSHOP-ART.md (prompts recorded)'}
pr80 = 'arrived with PR #80 (Observatory); no master or generation note in this repository'

def classify(path):
    """-> (origin_class, master_or_record, ai_tool_recorded, commercial_terms)"""
    rel = path[len(P):] if path.startswith(P) else path
    stem = os.path.basename(rel).rsplit('.', 1)[0]
    if rel.startswith('coast/icons/'):
        if stem in icon_masters: return AI_DERIVED, icon_masters[stem] + ' (master in repo)', TOOL_CHATGPT, TERMS_AI
        if stem.startswith(('optic-', 'gen-optic')): return AI_DIRECT, pr80, TOOL_NONE, TERMS_AI
        if stem in sheet41l: return AI_DERIVED, 'cut from the owner-supplied painted icon sheet (v5/assets/premium/coast/README.md, build 41l); sheet not in repo', TOOL_NONE, TERMS_AI
    if rel.startswith('coast/ui/'):
        m = ui_masters.get(stem, stem)
        return AI_DERIVED, f'docs/art-source/coastal-ui-2026-10-25/{m}.webp (master in repo)', TOOL_NONE, TERMS_AI
    if re.match(r'coast/place-(path|tent|mast|workshop|pier|beacon|cliff)-\d', rel):
        return AI_DERIVED, 'cut from the owner-supplied painted beach sheet (coast/README.md, build 41n); sheet not in repo', TOOL_NONE, TERMS_AI
    if rel.startswith('coast/place-ws-'):
        return RENDER, 'v5/assets/premium/coast/render-places.html + coast/README.md (WebGL ray-marched render)', 'none (procedural render)', TERMS_RENDER
    if rel.startswith('coast/place-obs-') or stem in ('observatory-map', 'observatory-vibrant'):
        return AI_DIRECT, pr80, TOOL_NONE, TERMS_AI
    if stem == 'harbour-view': return AI_DERIVED, 'upscaled crop of PR #80 art (docs/V5_CHAPTER2_INTEGRATION_2026-10-28.md); no master in repo', TOOL_NONE, TERMS_AI
    if stem in ('vault-door-thumb', 'vault-door-vibrant'):
        return AI_DERIVED, 'crop of the Home picture; master docs/art-source/coastal-home-2026-10-28/home-background-master.webp', TOOL_NONE, TERMS_AI
    for key, (folder, note) in chapters.items():
        if rel.startswith(f'coast/{key}/') or stem == f'{key}-vibrant':
            return AI_DERIVED, f'docs/art-source/{folder}/ (masters in repo); {note}; cut/exported by tools/*-art.py', TOOL_NOTE, TERMS_AI
    if stem in direct_notes: return AI_DIRECT, direct_notes[stem] + '; no archival master in repo', TOOL_NOTE, TERMS_AI
    if stem == 'rivet-rover-vibrant': return RENDER, 'vector SVG geometry written in the project (VIBRANT-SLICE.md)', 'none (vector code)', TERMS_RENDER
    if stem == 'landing-map-vault':
        return AI_DERIVED, 'owner-supplied painted map (landing-map.webp, git b8c5246) + Vault painted in by tools/paint-landing-vault.py', TOOL_NONE, TERMS_AI
    if rel.startswith('coast/story/'):
        return AI_DERIVED, f'docs/art-source/coastal-story-2026-10-28/story-{stem}-master.png (master in repo)', TOOL_NONE, TERMS_AI
    if rel.startswith('coast/home/'):
        m = {'home-bg': 'home-background-master.webp', 'button': 'button-skin-master.webp', 'logo': 'logo-master.webp'}[stem]
        extra = '; subtitle redrawn by tools/brand-logo-merge.py (Liberation Serif Bold, OFL 1.1)' if stem == 'logo' else ''
        return AI_DERIVED, f'docs/art-source/coastal-home-2026-10-28/{m} (master in repo){extra}', TOOL_NONE, TERMS_AI
    return None

def source_status(mr):
    if 'prompts recorded' in mr: return 'generation note in repo'
    if '(master in repo)' in mr or '(masters in repo)' in mr or 'master docs/art-source/' in mr: return 'master in repo'
    if 'git b8c5246' in mr: return 'master in git history'
    if 'render' in mr.lower() or 'vector' in mr: return 'source code in repo'
    return 'NO master or generation record in repo'

def update(path, shipped_only):
    text = open(os.path.join(ROOT, path), newline='').read()
    rows = list(csv.DictReader(io.StringIO(text)))
    base = [k for k in rows[0].keys() if k not in ('origin_class', 'source_record', 'master_or_record', 'ai_tool_recorded', 'commercial_terms')]
    shipped = {r['path'] for r in csv.DictReader(open(os.path.join(ROOT, 'release/crazygames-basic/ASSET_INVENTORY.csv'), newline=''))}
    out = []
    for r in rows:
        c = classify(r['path']) if r['path'] in shipped else None
        if c:
            r['origin_class'], r['master_or_record'], r['ai_tool_recorded'], r['commercial_terms'] = c
            r['source_record'] = source_status(c[1])
            if 'HOLD' in r.get('clearance_status', '') or 'REVIEW' in r.get('clearance_status', ''):
                r['clearance_status'] = ('PENDING OWNER EVIDENCE: origin owner-confirmed as AI-generated for this project; '
                                         'tool, account/plan, dates and terms not yet documented') if c[0] != RENDER else \
                                        'PENDING OWNER CONFIRMATION: in-project code render'
            if 'User-provided painted' in r.get('reported_provenance', '') or 'Derived: the user-provided' in r.get('reported_provenance', ''):
                r['reported_provenance'] = r['reported_provenance'].replace('User-provided painted', 'Owner-supplied AI-generated painted').replace('Derived: the user-provided', 'Derived: the owner-supplied AI-generated')
            r['reported_provenance'] = (r['reported_provenance'] + '; ' + OWNER) if OWNER not in r['reported_provenance'] else r['reported_provenance']
            if 'date_verified' in r: r['date_verified'] = '2026-11-08'
        elif not shipped_only:
            r['origin_class'] = 'not shipped in the CrazyGames Basic ZIP'
            r['source_record'] = r['master_or_record'] = r['ai_tool_recorded'] = r['commercial_terms'] = ''
        else:
            raise SystemExit(f'unclassified shipped file {r["path"]}')
        out.append(r)
    fields = base + ['origin_class', 'source_record', 'master_or_record', 'ai_tool_recorded', 'commercial_terms']
    buf = io.StringIO()
    q = csv.QUOTE_ALL if path.startswith('docs/') else csv.QUOTE_MINIMAL
    w = csv.DictWriter(buf, fieldnames=fields, quoting=q, lineterminator='\n'); w.writeheader(); w.writerows(out)
    s = buf.getvalue()
    if path.startswith('docs/'): s = s.replace('"' + '","'.join(fields) + '"', ','.join(fields), 1)
    open(os.path.join(ROOT, path), 'w', newline='').write(s)
    return out

inv = update('release/crazygames-basic/ASSET_INVENTORY.csv', True)
update('docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv', False)
from collections import Counter
print(len(inv), Counter(r['origin_class'] for r in inv))
print(Counter(r['source_record'] for r in inv))
print('owner_approved', Counter(r['owner_approved'] for r in inv))
