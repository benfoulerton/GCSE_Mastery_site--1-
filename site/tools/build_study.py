"""Builds data/flashcards.json and data/questions.json from tools/content/*.py, checking every mapping and that each question has one correct answer."""
import json, os, sys, importlib
ROOT = os.path.join(os.path.dirname(__file__), '..'); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'content'))
mods = {'biology': ['pilot_bio_4_1_1'], 'chemistry': ['pilot_che_4_1_1'], 'physics': ['pilot_phy_4_2_1']}
cards, qs, errs = [], [], []
for subj, names in mods.items():
    cur = json.load(open(os.path.join(ROOT, 'data/%s.json' % subj))); los = {l['id'] for t in cur['topics'] for s in t['subtopics'] for g in s['groups'] for l in g['los']}
    for n in names:
        m = importlib.import_module(n); sub = '.'.join(n.split('_')[2:])
        for i, (ty, refs, ids, q, a) in enumerate(m.CARDS, 1):
            for x in ids: 
                if x not in los: errs.append('bad LO ' + x)
            cards.append({'id': 'FC-%s-%s-%03d' % (subj[:3].upper(), sub, i), 'sub': sub, 'refs': ['%s.%d' % (sub, r) for r in refs], 'los': ids, 'ty': ty, 'q': q, 'a': a})
        for i, x in enumerate(m.QS, 1):
            if len(x['opts']) != 4 or len(x['ex']) != 4 or not 0 <= x['a'] < 4 or len(set(x['opts'])) != 4: errs.append('bad question %d' % i)
            for y in x['los']:
                if y not in los: errs.append('bad LO ' + y)
            qs.append(dict(x, id='Q-%s-%s-%03d' % (subj[:3].upper(), sub, i), sub=sub))
if errs: sys.exit('\n'.join(errs))
json.dump({'schema': 1, 'cards': cards}, open(os.path.join(ROOT, 'data/flashcards.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump({'schema': 1, 'questions': qs}, open(os.path.join(ROOT, 'data/questions.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(cards), 'cards,', len(qs), 'questions')
