#!/usr/bin/env python3
"""Vaultwake Merge art provenance (release 2026-11-08).

The owner states the art was made October-November 2026 with two tools, ChatGPT Astra (OpenAI) and
Claude Code (Anthropic), for this project only. This script records, for every shipped image, what the
repositories themselves show about each step, and never more:
  origin_class       AI image generation / programmatic render / either, processed in the project
  source_record      master in repo / generation note in repo / master in git history / source code in repo / none
  master_or_record   the master file, note or code it traces to
  generation_method  AI image generation, or programmatic render (code)
  generation_tool    which tool made the picture, and on what evidence
  processing_tool    which tool cut, cropped, composited or exported it (commit in siruss4199-wq/wispwood-game)
  tool_attribution   evidenced / partly evidenced / unverified (owner statement only)
  commercial_terms   what the provider terms say, and what is still missing
owner_approved is never changed (it stays NO until the owner sets it).
Evidence used: git history of siruss4199-wq/wispwood-game (author "Claude" = Claude Code commits),
docs/art-source/*, v5/assets/premium/*.md notes, tools/*-art.py.
  python3 tools/rights-classify.py
"""
import csv, io, os, re
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = 'v5/assets/premium/'
OWNER = ('Owner statement 2026-11-08: made Oct-Nov 2026 for this project with ChatGPT Astra (OpenAI) and Claude Code '
         '(Anthropic); no stock art or outside artist')
WG = 'siruss4199-wq/wispwood-game'
GEN_AI, GEN_CODE = 'AI image generation', 'programmatic render (code)'
CHATGPT_OWNER = ('ChatGPT Astra (OpenAI), by owner statement. Records: the image was supplied to the Claude Code session '
                 'from outside it (handoff/brief: "built-in image tool"; Claude Code had no image generator); tool not named per file')
EITHER_OWNER = 'ChatGPT Astra or Claude Code (owner statement); individual tool not recorded'
TERMS_OPENAI = ('OpenAI Terms of Use / Business Terms (eff. 2026-01-01): Output assigned to the user, may not be unique, '
                'must not be presented as human-made. Not yet tied to an account: owner to name the ChatGPT plan and holder.')
TERMS_ANTHROPIC = ('Anthropic Consumer Terms (eff. 2025-10-08) / Commercial Terms (eff. 2025-06-17): Outputs assigned to the user '
                   '(Consumer Terms: evaluation use is personal and non-commercial only). Not yet tied to an account: owner to name the Claude plan.')
TERMS_BOTH = TERMS_OPENAI + ' | ' + TERMS_ANTHROPIC

sheet41l = {f'gen-{g}' for g in ('chart', 'rope', 'shell', 'lamp')} | {f'rig-{t}' for t in range(4, 8)} | \
    {f'chart-{t}' for t in range(8)} | {f'rope-{t}' for t in range(6)} | {f'shell-{t}' for t in range(6)} | \
    {f'lamp-{t}' for t in range(5)} | {'cargo-basket', 'driftwood-crate', 'sea-chest', 'captains-trunk', 'tide-token', 'brass-cog'}
icon_masters = {
    'grip-tool-v2': ('docs/art-source/coastal-tools-2026-10-27/grip-pliers-v2.png', 'cf13035'),
    'split-spanner-v2': ('docs/art-source/coastal-tools-2026-10-27/adjustable-wrench.png', 'cf13035'),
    'cargo-crate-v2': ('docs/art-source/coastal-crate-2026-10-28/cargo-crate-master.webp', '1620bcc'),
    'cargo-barrel-v2': ('docs/art-source/coastal-crate-2026-10-28/cargo-barrel-master.webp', '1620bcc'),
    'cargo-bundle-pilot': ('docs/art-source/coastal-pilot-2026-10-27/supply-bag.png', '97513c9'),
    'gen-rig-pilot': ('docs/art-source/coastal-pilot-2026-10-27/drill-rover.png', '97513c9'),
    'mech-0': ('docs/art-source/rover-secondary-2026-10-29/bolt-master.webp', '3cc4f86'),
    'mech-1': ('docs/art-source/rover-secondary-2026-10-29/gear-master.webp', '3cc4f86'),
    'mech-2': ('docs/art-source/rover-secondary-2026-10-29/gear-assembly-master.webp', '3cc4f86'),
    'mech-3': ('docs/art-source/rover-secondary-2026-10-29/hand-crank-master.webp', '3cc4f86'),
    'notes-0': ('docs/art-source/kite-secondary-2026-10-29/note-fragment-master.webp', '3cc4f86, e6b9a32'),
    'notes-1': ('docs/art-source/kite-secondary-2026-10-29/expedition-note-master.webp', '3cc4f86, e6b9a32'),
    'notes-2': ('docs/art-source/kite-secondary-2026-10-29/travel-notebook-master.webp', '3cc4f86, e6b9a32'),
    'notes-3': ('docs/art-source/kite-secondary-2026-10-29/captains-logbook-master.webp', '3cc4f86, e6b9a32')}
ui_masters = {'cell': 'board-cell', 'coast-bg': 'coast-background', 'crew-nara': 'crew-nara-proposed', 'crew-sela': 'crew-sela-proposed',
              'deliver': 'deliver-button', 'ice-0': 'ice-intact', 'ice-1': 'ice-cracked', 'ice-2': 'ice-heavy'}
chapters = {'hidden-harbour': ('hidden-harbour-2026-11-01', '47cfa57', 'tools/harbour-art.py', 'CLAUDE_HANDOFF.md: "Generated with the built-in image tool"'),
            'answering-light': ('answering-light-2026-11-02', '53ff263', 'tools/headland-art.py', 'pack/manifest.json: "generated masters", SHA-256 per master'),
            'lowwater-passage': ('lowwater-passage-2026-11-02', '56cd4ad', 'tools/lowwater-art.py', 'pack/prompts.json: prompt per image'),
            'keepers-promise': ('keepers-promise-2026-11-02', 'c4b3b6e', 'tools/keeper-art.py', 'pack/prompts.json: prompt per image')}
direct_notes = {'copper-offcut-vibrant': ('VIBRANT-SLICE.md, README.md', '698fc78, 4bbb067'),
                'pocket-winch-vibrant': ('VIBRANT-SLICE.md, README.md', '698fc78, 4bbb067'),
                'landing-vibrant': ('VIBRANT-SLICE.md, README.md', '698fc78, 4bbb067'),
                'route-fold-vibrant': ('BOARD-COHESION.md', '4bbb067'),
                'worksite-vibrant': ('CHAPTER-ART.md', '4bbb067'),
                'workshop-operational': ('WORKSHOP-ART.md', '4bbb067')}

def claude(commits, extra=''):
    return f'Claude Code (Anthropic): commit {commits} by "Claude" in {WG}' + (f'; {extra}' if extra else '')

def row(origin, rec, mr, method, gen, proc, attr, terms):
    return dict(origin_class=origin, source_record=rec, master_or_record=mr, generation_method=method,
                generation_tool=gen, processing_tool=proc, tool_attribution=attr, commercial_terms=terms)

AI_PROC = 'AI-generated image (owner-confirmed), cut/cropped/exported in the project'
AI_DIRECT = 'AI-generated image (owner-confirmed), used as generated (resize/format only)'
RENDER = 'Programmatic render: picture drawn by code, no image generator'
PARTLY = 'partly evidenced: processing tool shown by commits; generation tool by owner statement (records rule out Claude Code)'
UNVERIFIED = 'UNVERIFIED: owner statement only; no master or generation record'

def classify(path):
    rel = path[len(P):] if path.startswith(P) else path
    stem = os.path.basename(rel).rsplit('.', 1)[0]
    if rel.startswith('coast/icons/'):
        if stem in icon_masters:
            m, c = icon_masters[stem]
            return row(AI_PROC, 'master in repo', m, GEN_AI, CHATGPT_OWNER, claude(c, 'framed and exported'), PARTLY, TERMS_BOTH)
        if stem.startswith(('optic-', 'gen-optic')):
            return row(AI_PROC, 'NO master or generation record in repo', 'cut from the owner\'s Observatory concept sheets (commit f96d1de: "Art cut from the user\'s three concept sheets"; re-ported 7a769a2); sheets not archived',
                       GEN_AI, EITHER_OWNER, claude('f96d1de, 7a769a2', 'cut from the sheet'), UNVERIFIED, TERMS_BOTH)
        if stem in sheet41l:
            return row(AI_PROC, 'NO master or generation record in repo', 'cut from the owner-supplied icon sheet (commit b4bf79f: "Cut the user\'s painted sheet into 47 ... icons"); sheet not archived',
                       GEN_AI, EITHER_OWNER, claude('b4bf79f', 'cut from the sheet'), UNVERIFIED, TERMS_BOTH)
    if rel.startswith('coast/ui/'):
        return row(AI_PROC, 'master in repo', f'docs/art-source/coastal-ui-2026-10-25/{ui_masters.get(stem, stem)}.webp', GEN_AI, CHATGPT_OWNER,
                   claude('5b4a64e, 758ec38', '"the supplied art", exported'), PARTLY, TERMS_BOTH)
    if re.match(r'coast/place-(path|tent|mast|workshop|pier|beacon|cliff)-\d', rel):
        return row(AI_PROC, 'NO master or generation record in repo', 'cut from the owner-supplied beach sheet (commit 6b47b4d: "The user\'s 21 beach stage pictures, cut by each object\'s own pixels"); sheet not archived',
                   GEN_AI, EITHER_OWNER, claude('6b47b4d', 'cut from the sheet; replaced code renders of build 39'), UNVERIFIED, TERMS_BOTH)
    if rel.startswith('coast/place-ws-'):
        return row(RENDER, 'source code in repo', 'v5/assets/premium/coast/render-places.html (WebGL ray-marched scene) + coast/README.md',
                   GEN_CODE, claude('11fdee6', 'render code written and run in Claude Code (coast/README.md: "no image-generation tool was available, so these are real 3D renders made here")'),
                   claude('11fdee6', 'cropped and exported'), 'evidenced: commit by Claude + render source code', TERMS_ANTHROPIC)
    if rel.startswith('coast/place-obs-') or stem in ('observatory-map', 'observatory-vibrant', 'harbour-view'):
        return row(AI_PROC, 'NO master or generation record in repo', 'cut from the owner\'s Observatory concept sheets (commit f96d1de; ported from PR #80 in a1eb517/7a769a2); sheets not archived',
                   GEN_AI, EITHER_OWNER, claude('f96d1de, a1eb517, 7a769a2', 'cut/cropped from the sheets'), UNVERIFIED, TERMS_BOTH)
    if stem in ('vault-door-thumb', 'vault-door-vibrant'):
        return row(AI_PROC, 'master in repo', 'crop of docs/art-source/coastal-home-2026-10-28/home-background-master.webp', GEN_AI, CHATGPT_OWNER,
                   claude('56601dd, 44952a9', 'cropped'), PARTLY, TERMS_BOTH)
    for key, (folder, c, tool, note) in chapters.items():
        if rel.startswith(f'coast/{key}/') or stem == f'{key}-vibrant':
            return row(AI_PROC, 'master in repo', f'docs/art-source/{folder}/ ({note})', GEN_AI, CHATGPT_OWNER,
                       claude(c, f'{tool} cut and exported the masters'), PARTLY, TERMS_BOTH)
    if stem in direct_notes:
        n, c = direct_notes[stem]
        return row(AI_DIRECT, 'generation note in repo', f'v5/assets/premium/{n} (prompts recorded; "built-in image tool"); no archival master',
                   GEN_AI, f'ChatGPT Astra (OpenAI), by owner statement. Records: made with a "built-in image tool" in sessions committed as siruss4199-wq (commits {c}), not Claude Code; tool not named',
                   'none beyond resize/format in the same session', 'partly evidenced: records rule out Claude Code; tool named by owner', TERMS_OPENAI)
    if stem == 'rivet-rover-vibrant':
        return row(RENDER, 'source code in repo', 'vector SVG geometry (VIBRANT-SLICE.md: "reuses its existing vector geometry")', GEN_CODE,
                   'session committed as siruss4199-wq (commits 698fc78, 4bbb067), not Claude Code; ChatGPT Astra by owner statement',
                   'none', 'partly evidenced: records rule out Claude Code; tool named by owner', TERMS_OPENAI)
    if stem == 'landing-map-vault':
        return row(AI_PROC, 'master in git history', 'owner-supplied painted map (commit 6b47b4d; landing-map.webp at b8c5246) + Vault entrance painted in by tools/paint-landing-vault.py',
                   GEN_AI, EITHER_OWNER + ' (base map)', claude('6b47b4d', 'cut; Vault entrance painted by code in siruss4199-wq/vaultwake#97 (000bb9b)'), 'partly evidenced: base map tool unverified; Vault edit by Claude Code', TERMS_BOTH)
    if rel.startswith('coast/story/'):
        return row(AI_PROC, 'master in repo', f'docs/art-source/coastal-story-2026-10-28/story-{stem}-master.png', GEN_AI, CHATGPT_OWNER,
                   claude('6864900', 'exported'), PARTLY, TERMS_BOTH)
    if rel.startswith('coast/home/'):
        m = {'home-bg': 'home-background-master.webp', 'button': 'button-skin-master.webp', 'logo': 'logo-master.webp'}[stem]
        extra = '; subtitle redrawn by tools/brand-logo-merge.py in this release (Liberation Serif Bold, OFL 1.1)' if stem == 'logo' else ''
        return row(AI_PROC, 'master in repo', f'docs/art-source/coastal-home-2026-10-28/{m}{extra}', GEN_AI, CHATGPT_OWNER,
                   claude('f9dc476', '"the supplied skin", exported' + (', logo subtitle redrawn by code' if stem == 'logo' else '')), PARTLY, TERMS_BOTH)
    return None

NEW = ['origin_class', 'source_record', 'master_or_record', 'generation_method', 'generation_tool', 'processing_tool', 'tool_attribution', 'commercial_terms']
DROP = set(NEW) | {'ai_tool_recorded'}

def update(path, shipped_only):
    rows = list(csv.DictReader(io.StringIO(open(os.path.join(ROOT, path), newline='').read())))
    base = [k for k in rows[0].keys() if k not in DROP]
    shipped = {r['path'] for r in csv.DictReader(open(os.path.join(ROOT, 'release/crazygames-basic/ASSET_INVENTORY.csv'), newline=''))}
    out = []
    for r in rows:
        r = {k: r[k] for k in base}
        c = classify(r['path']) if r['path'] in shipped else None
        if c:
            r.update(c)
            if r.get('clearance_status', '').startswith(('PENDING', 'HOLD', 'REVIEW')):
                r['clearance_status'] = ('PENDING OWNER EVIDENCE: origin owner-confirmed; tool accounts/plans not documented'
                                         if c['source_record'] != 'NO master or generation record in repo' else
                                         'PENDING OWNER EVIDENCE: origin by owner statement only; tool unverified; accounts/plans not documented')
            prov = re.sub(r'; Owner statement 2026-11-08:.*$', '', r['reported_provenance'])
            r['reported_provenance'] = prov + '; ' + OWNER
            if 'date_verified' in r: r['date_verified'] = '2026-11-08'
        elif shipped_only:
            raise SystemExit(f'unclassified shipped file {r["path"]}')
        else:
            r.update({k: '' for k in NEW}); r['origin_class'] = 'not shipped in the CrazyGames Basic ZIP'
        out.append(r)
    fields = base + NEW
    buf = io.StringIO()
    doc = path.startswith('docs/')
    w = csv.DictWriter(buf, fieldnames=fields, quoting=csv.QUOTE_ALL if doc else csv.QUOTE_MINIMAL, lineterminator='\n')
    w.writeheader(); w.writerows(out)
    s = buf.getvalue()
    if doc: s = s.replace('"' + '","'.join(fields) + '"', ','.join(fields), 1)
    open(os.path.join(ROOT, path), 'w', newline='').write(s)
    return out

if __name__ == '__main__':
    from collections import Counter
    inv = update('release/crazygames-basic/ASSET_INVENTORY.csv', True)
    update('docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv', False)
    print(len(inv)); print(Counter(r['generation_method'] for r in inv)); print(Counter(r['tool_attribution'][:40] for r in inv))
    print(Counter(r['source_record'] for r in inv)); print('owner_approved', Counter(r['owner_approved'] for r in inv))
