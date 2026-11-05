#!/usr/bin/env python3
"""Convert the curriculum documents' JSON models into the compact files the website loads.

Usage:  python3 tools/build_data.py
Reads   tools/source/GCSE_{Biology,Chemistry,Physics}_Curriculum.json
Writes  data/{biology,chemistry,physics}.json  and  data/manifest.json

Hierarchy produced:  subject -> topic (4.x) -> subtopic (4.x.y) -> spec reference group (4.x.y.z...) -> learning objective -> knowledge items.
Every learning objective of the source is kept; the script stops with an error if any is lost or duplicated.
"""
import json, re, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUBJECTS = [
    ('biology', 'Biology', 'bio', '#7E9070'),
    ('chemistry', 'Chemistry', 'chem', '#A58E5B'),
    ('physics', 'Physics', 'phys', '#6F8795'),
]

def key(ref):
    return tuple(int(x) for x in ref.split('.'))

def under(ref, parent):
    return ref == parent or ref.startswith(parent + '.')

def conv_lo(lo, rp_titles):
    k = [[x['c'], x.get('ty', ''), x['t']] for x in lo['k']]
    out = {'id': lo['id'], 't': lo['t'], 'p': lo['p'], 'k': k}
    if lo.get('flag'):
        out['f'] = lo['flag']
    m = re.match(r'\s*Required practical\s+(\d+)', lo['t'], re.I)
    if m:
        out['rp'] = int(m.group(1))
    return out

def build(slug, name, code, accent):
    src = json.load(open(os.path.join(ROOT, 'tools/source/GCSE_%s_Curriculum.json' % name), encoding='utf8'))
    secs = sorted(src['sections'], key=lambda s: key(s['ref']))
    by = {s['ref']: s for s in secs}
    topics = []
    seen = set()
    total_los = sum(len(s['los']) for s in secs)
    total_paras = sum(len(s['paras']) for s in secs)
    spec_paras_kept = 0

    def group(s):
        nonlocal spec_paras_kept
        spec_paras_kept += len(s['paras'])
        g = {'ref': s['ref'], 'title': s['title'], 'page': s.get('page'),
             'spec': [{'n': p['n'], 't': p['text'], 'notes': p.get('notes', [])} for p in s['paras']],
             'los': [conv_lo(l, None) for l in s['los']]}
        if s.get('note'):
            g['note'] = s['note']
        for l in g['los']:
            if l['id'] in seen:
                sys.exit('duplicate LO id ' + l['id'])
            seen.add(l['id'])
        return g

    for t in [s for s in secs if len(s['ref'].split('.')) == 2]:
        topic = {'id': t['ref'], 'ref': t['ref'], 'title': t['title'], 'page': t.get('page'), 'subtopics': []}
        if t['los']:
            # topic with learning objectives directly (the "Key ideas" sections)
            sub = {'ref': t['ref'], 'title': t['title'], 'groups': [group(t)]}
            topic['subtopics'].append(sub)
        elif t['paras']:
            topic['overview'] = [p['text'] for p in t['paras']]
            spec_paras_kept += len(t['paras'])
        for st in [s for s in secs if len(s['ref'].split('.')) == 3 and under(s['ref'], t['ref']) and s['ref'] != t['ref']]:
            sub = {'ref': st['ref'], 'title': st['title'], 'groups': []}
            if st['paras'] and not st['los']:
                sub['intro'] = [p['text'] for p in st['paras']]
                spec_paras_kept += len(st['paras'])
            elif st['los'] or st['paras']:
                sub['groups'].append(group(st))
            for d in [s for s in secs if len(s['ref'].split('.')) >= 4 and under(s['ref'], st['ref'])]:
                if d['los'] or d['paras']:
                    sub['groups'].append(group(d))
            topic['subtopics'].append(sub)
        topics.append(topic)

    n_los = sum(len(g['los']) for t in topics for st in t['subtopics'] for g in st['groups'])
    if n_los != total_los:
        sys.exit('%s: LO count mismatch %d vs %d' % (slug, n_los, total_los))
    if spec_paras_kept != total_paras:
        sys.exit('%s: spec paragraph mismatch %d vs %d' % (slug, spec_paras_kept, total_paras))

    # practicals
    pracs = []
    for p in src['extras']['prac']:
        n = p['n']
        auth = src['prac_auth'].get('RP%d' % n, {})
        title = None
        for t in topics:
            for st in t['subtopics']:
                for g in st['groups']:
                    for l in g['los']:
                        if l.get('rp') == n and not title:
                            title = re.sub(r'^\s*Required practical\s+\d+\s*[–-]\s*', '', l['t'])
                            where = {'topic': t['id'], 'sub': st['ref'], 'ref': g['ref'], 'lo': l['id']}
        pracs.append({'n': n, 'head': p['head'], 'title': title or ('Required practical %d' % n),
                      'where': where if title else None,
                      'stmt': p['stmt'], 'at': p['at'], 'skills': p['skills'], 'fields': auth})
    # maths
    mx = src['extras']['maths']
    ma = src['maths_auth']
    maths = {'intro': mx['intro'], 'secs': [], 'calcs': ma.get('CALCS', {}).get('CALC', []), 'notes': ma.get('NOTES', {})}
    for s in mx['secs']:
        items = []
        for l, txt in s['items']:
            code_ = s['n'] + l
            items.append({'code': 'MS ' + code_, 'text': txt, 'apply': ma.get(code_, {}).get('APPLY', [])})
        maths['secs'].append({'n': s['n'], 'title': s['title'], 'items': items})
    data = {'id': slug, 'name': name, 'code': code, 'board': 'AQA', 'qualification': 'GCSE',
            'tier': 'Higher Tier', 'accent': accent, 'topics': topics, 'practicals': pracs, 'maths': maths,
            'ws': src['extras'].get('ws', []), 'at': src['extras'].get('at', [])}
    out = os.path.join(ROOT, 'data', slug + '.json')
    json.dump(data, open(out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    stats = {'topics': len(topics), 'subtopics': sum(len(t['subtopics']) for t in topics), 'los': n_los,
             'specStatements': total_paras, 'practicals': len(pracs), 'bytes': os.path.getsize(out)}
    print(slug, stats)
    return {'id': slug, 'name': name, 'code': code, 'accent': accent, 'file': 'data/%s.json' % slug, **stats}

if __name__ == '__main__':
    man = {'schema': 1, 'subjects': [build(*s) for s in SUBJECTS]}
    json.dump(man, open(os.path.join(ROOT, 'data/manifest.json'), 'w'), indent=1)
