#!/usr/bin/env python3
"""Implementation audit: compares the website data with the source documents and the resource catalogues. Prints a report and writes audit.json."""
import json, os, re, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = {}; problems = []
check = json.load(open('/home/claude/res/checklist.json'))
for slug, name in (('biology', 'Biology'), ('chemistry', 'Chemistry'), ('physics', 'Physics')):
    site = json.load(open(f'{ROOT}/data/{slug}.json')); src = json.load(open(f'{ROOT}/tools/source/GCSE_{name}_Curriculum.json'))
    # curriculum: LO ids, section refs
    s_lo = {l['id']: l for t in site['topics'] for st in t['subtopics'] for g in st['groups'] for l in g['los']}
    src_lo = {l['id'] for sec in src['sections'] for l in sec['los']}
    chk = {l['id'] for r in check if r['subject'] == slug for l in r['los']}
    chk_sec = {r['section_ref'] for r in check if r['subject'] == slug}
    site_sec = {g['ref'] for t in site['topics'] for st in t['subtopics'] for g in st['groups']}
    chk_sub = {r['subtopic_id'] for r in check if r['subject'] == slug}
    site_sub = {st['ref'] for t in site['topics'] for st in t['subtopics']}
    chk_top = {r['topic_id'] for r in check if r['subject'] == slug}
    ht = sum(1 for l in s_lo.values() if re.search(r'HT only|higher', l['t'] + ' ' + (l.get('f') or ''), re.I))
    specs = sum(len(g['spec']) for t in site['topics'] for st in t['subtopics'] for g in st['groups'])
    kn = collections.Counter(k[0] for l in s_lo.values() for k in l['k'])
    d = dict(topics=len(site['topics']), subtopics=len(site_sub), sections=len(site_sec), los=len(s_lo), spec_statements_in_groups=specs, knowledge_items=dict(kn),
             practicals=len(site['practicals']), practicals_with_LO=sum(1 for p in site['practicals'] if p.get('where') and p['where']['lo'] in s_lo),
             maths_items=sum(len(s['items']) for s in site['maths']['secs']), ws=len(site.get('ws', [])) if isinstance(site.get('ws'), list) else None, at=len(site.get('at', [])) if isinstance(site.get('at'), list) else None,
             ht_tagged_los=ht,
             missing_vs_source=sorted(src_lo - set(s_lo)), extra_vs_source=sorted(set(s_lo) - src_lo),
             missing_vs_checklist=sorted(chk - set(s_lo)), extra_vs_checklist=sorted(set(s_lo) - chk),
             sections_missing=sorted(chk_sec - site_sec), subtopics_missing=sorted(chk_sub - site_sub), topics_missing=sorted(chk_top - {t['id'] for t in site['topics']}))
    # text identity of every LO against source
    sl = {l['id']: l for sec in src['sections'] for l in sec['los']}
    d['lo_text_mismatch'] = [i for i in s_lo if i in sl and sl[i]['t'] != s_lo[i]['t']]
    src_paras = [p['text'] for sec in src['sections'] for p in sec['paras']]
    site_paras = [p['t'] for t in site['topics'] for p in []] + [x for t in site['topics'] for x in (t.get('overview') or [])] + [x for t in site['topics'] for st in t['subtopics'] for x in (st.get('intro') or [])] + [p['t'] for t in site['topics'] for st in t['subtopics'] for g in st['groups'] for p in g['spec']]
    d['spec_statements_total_site'] = len(site_paras); d['spec_statements_in_source'] = len(src_paras)
    d['spec_text_missing'] = [x[:60] for x in set(src_paras) - set(site_paras)]
    if d['spec_text_missing'] or len(site_paras) != len(src_paras): problems.append((slug, 'spec paragraphs', len(site_paras), len(src_paras), d['spec_text_missing'][:3]))
    # resources
    cat = json.load(open(f'{ROOT}/tools/source/{name}_Resources.json')); res = json.load(open(f'{ROOT}/data/res-{slug}.json'))
    cmap = {r['resource_id']: r for r in cat['resources']}; rmap = {r['id']: r for r in res['records']}
    bad = []
    for i, c in cmap.items():
        r = rmap.get(i)
        if not r: bad.append((i, 'missing')); continue
        if (r['u'], r['t'], r['p'], r['ver'], r['sub'], r.get('los', [])) != (c['url'], c['title'], c['provider'], c['verification_status'], c['subtopic_id'], c['learning_objective_ids']): bad.append((i, 'field mismatch'))
        if c.get('mark_scheme_resource_id') and c['mark_scheme_resource_id'] not in rmap: bad.append((i, 'dangling mark scheme'))
    d['resources'] = dict(catalogue=len(cmap), site=len(rmap), problems=bad, unverified_candidates=len(res['unverified']), duplicate_ids=len(res['records']) - len(rmap),
                          duplicate_url_sub_type=sum(1 for k, v in collections.Counter((r['u'], r['sub'], r['ty']) for r in res['records']).items() if v > 1),
                          empty_urls=sum(1 for r in res['records'] if not re.match(r'https?://', r['u'])), by_verification=dict(collections.Counter(r['ver'] for r in res['records'])),
                          by_category=dict(collections.Counter(r['cat'] for r in res['records'])))
    out[slug] = d
    for k in ('missing_vs_source', 'extra_vs_source', 'missing_vs_checklist', 'extra_vs_checklist', 'sections_missing', 'subtopics_missing', 'topics_missing', 'lo_text_mismatch'):
        if d[k]: problems.append((slug, k, d[k][:5]))
    if bad: problems.append((slug, 'resource problems', bad[:5]))
json.dump(out, open(f'{ROOT}/tools/audit.json', 'w'), indent=1)
for s, d in out.items(): print(s, {k: v for k, v in d.items() if k not in ('resources',) and not isinstance(v, list)}, '\n   ', {k: v for k, v in d['resources'].items()})
print('PROBLEMS:', problems or 'none')
