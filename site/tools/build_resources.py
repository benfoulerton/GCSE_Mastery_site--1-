#!/usr/bin/env python3
"""Convert the resource catalogues (Biology/Chemistry/Physics_Resources.json) into the files the website loads.

Reads   tools/source/{Biology,Chemistry,Physics}_Resources.json
Writes  data/res-{subject}.json   every catalogue record (one per resource and subtopic), plus the unchecked candidates
        data/coverage.json         per-subtopic coverage rating from the Resource Coverage Report logic
        data/manifest.json         (updates the resource counts; curriculum fields are left alone)
Nothing is dropped: the script stops if any record is lost or a learning-objective id is unknown.
"""
import json, os, re, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools/source')
SUBJ = [('biology', 'Biology'), ('chemistry', 'Chemistry'), ('physics', 'Physics')]
TYPE = {'video': 'video', 'practice_questions': 'practice', 'revision_notes': 'notes', 'mark_scheme': 'markscheme'}

def yt_id(url):
    m = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]{11})', url or '')
    return m.group(1) if m else None

def category(r):
    t = r['resource_type']
    if t == 'video': return 'practical' if re.search(r'practical', r['title'], re.I) else 'video'
    if t == 'practice_questions': return 'past_paper'
    if t == 'mark_scheme': return 'markscheme'
    if t == 'revision_notes': return 'practical' if re.search(r'practical', r['title'], re.I) else 'notes'
    return 'other'

manifest = json.load(open(os.path.join(ROOT, 'data/manifest.json')))
cov_all = {}; summary = {}
for slug, name in SUBJ:
    src = json.load(open(os.path.join(SRC, name + '_Resources.json')))
    cur = json.load(open(os.path.join(ROOT, 'data/%s.json' % slug)))
    lo_ids = {l['id'] for t in cur['topics'] for s in t['subtopics'] for g in s['groups'] for l in g['los']}
    sub_refs = {s['ref'] for t in cur['topics'] for s in t['subtopics']}
    recs = []; ids = set()
    for r in src['resources']:
        assert r['resource_id'] not in ids, 'duplicate id ' + r['resource_id']; ids.add(r['resource_id'])
        assert r['subtopic_id'] in sub_refs, 'unknown subtopic %s in %s' % (r['subtopic_id'], r['resource_id'])
        bad = [i for i in r['learning_objective_ids'] if i not in lo_ids]; assert not bad, (r['resource_id'], bad)
        cv = r.get('coverage') or {}
        o = {'id': r['resource_id'], 't': r['title'], 'p': r['provider'], 'ty': TYPE[r['resource_type']], 'cat': category(r), 'u': r['url'],
             'sub': r['subtopic_id'], 'refs': r['specification_references'], 'los': r['learning_objective_ids'],
             'cov': {k: v for k, v in {'lvl': cv.get('level'), 'marks': cv.get('relevant_marks'), 'qs': cv.get('relevant_questions'), 'det': cv.get('detail')}.items() if v},
             'free': r['free_or_paid'], 'acct': r.get('account_required'), 'ans': bool(r.get('answers_available')),
             'ver': r['verification_status'], 'verOrig': r.get('verification_status_original'), 'basis': r.get('mapping_basis'),
             'why': r.get('description'), 'vn': r.get('verification_notes'), 'tier': r.get('tier'), 'qt': r.get('question_type'),
             'ms': r.get('mark_scheme_resource_id'), 'lk': r.get('linked_resource_id'), 'weak': r.get('suitability') != 'suitable', 'new': bool(r.get('is_new')), 'on': r.get('last_verified')}
        y = yt_id(r['url']); 
        if y: o['yt'] = y
        recs.append({k: v for k, v in o.items() if v not in (None, '', [], {})})
    assert len(recs) == len(src['resources'])
    unv = []
    for c in src.get('unverified_candidates_pmt_set_b', []):
        o = {'t': c['title'], 'p': 'Physics & Maths Tutor', 'u': c['url'], 'kind': c['kind'], 'ver': 'UNVERIFIED'}
        if c['subtopic_id']:
            assert c['subtopic_id'] in sub_refs; o['sub'] = c['subtopic_id']
        else:  # whole-topic Physics papers: the topic comes from the folder number in the URL
            m = re.search(r'/AQA/(\d+)-', c['url']); assert m, c['url']; o['topic'] = '4.' + m.group(1)
            assert o['topic'] in {t['id'] for t in cur['topics']}
        unv.append(o)
    json.dump({'schema': 2, 'subject': slug, 'generated': src['meta']['generated'], 'records': recs, 'unverified': unv}, open(os.path.join(ROOT, 'data/res-%s.json' % slug), 'w'), ensure_ascii=False, separators=(',', ':'))
    cov = {}
    for x in src['subtopic_coverage']:
        cov[x['subtopic_id']] = {'v': x['videos'], 'vlo': x['learning_objectives_with_video'], 'lo': x['learning_objectives_total'], 'vr': x['video_rating'],
            'pq': x['practice_resources'], 'marks': x['practice_relevant_marks'], 'pr': x['practice_rating'], 'pro': x['practice_rating_original_rule'],
            'nt': x['revision_resources'], 'n': x['suitable_resources'], 'ov': x['overall_rating'], 'exc': x['justified_exception'], 'gaps': x['remaining_gaps'],
            'vv': x['video_verification'], 'cav': x.get('practice_caveat')}
        cov[x['subtopic_id']] = {k: v for k, v in cov[x['subtopic_id']].items() if v not in (None, [], '')}
    assert set(cov) == sub_refs, 'coverage missing subtopics'
    cov_all[slug] = cov
    cnt = collections.Counter(o['cat'] for o in recs)
    summary[slug] = {'records': len(recs), 'unverified': len(unv), 'byCategory': dict(cnt), 'byVerification': dict(collections.Counter(o['ver'] for o in recs)), 'weak': sum(1 for o in recs if o.get('weak'))}
    for s in manifest['subjects']:
        if s['id'] == slug: s['resources'] = len(recs); s['resourceFile'] = 'data/res-%s.json' % slug; s['unverifiedCandidates'] = len(unv)
meta = {'schema': 2, 'generated': '2026-11-05', 'source': 'Resource_Coverage_Report.xlsx and the three resource catalogues (gap-filling pass, 5 Nov 2026)',
        'ratings': {'COMPLETE': 'Video coverage and practice coverage both meet the standard.', 'LIMITED': 'Videos reach under 70% of the subtopic\'s learning objectives, or the counted practice sets add up to under 30 relevant marks.',
                    'MISSING': 'No suitable video or no suitable practice set.', 'REQUIRES VERIFICATION': 'Coverage meets the standard but every video was matched from its title only and has not been checked.'},
        'verification': {'VERIFIED': 'The page or PDF was opened and its content was checked.', 'PARTIALLY_VERIFIED': 'The resource exists and some of it was checked, but it was not fully checked. For most videos this means matched by title and playlist, not watched.',
                         'UNVERIFIED': 'Found but not opened or checked.', 'INACCESSIBLE': 'The link does not work or needs access that was not available.'},
        'summary': summary}
json.dump({'meta': meta, 'subjects': cov_all}, open(os.path.join(ROOT, 'data/coverage.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
manifest['resourceSchema'] = 2
json.dump(manifest, open(os.path.join(ROOT, 'data/manifest.json'), 'w'), indent=1)
print(json.dumps(summary, indent=1))
