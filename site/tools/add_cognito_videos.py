"""Adds Cognito video lessons found on 5 Nov 2026 that were missing from the catalogue (the first lesson of most units).
Each page was opened and its 'Show timestamps' list (the video chapters) was read. Playback itself was not tested."""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..')
BASE = 'https://cognito.org/courses/gcse/%s-triple/aqa/higher/notes/'
# (subject, lesson, path, title, subtopic, group refs, minutes, chapters)
NEW = [
('biology','2.1','aFpQaEVadGQ/2.1-levels-of-organisation','Levels of Organisation','4.2.1',['4.2.1'],6,['0:05 Organelles and cells','1:09 Tissues and organs','2:38 Organ systems and organisms']),
('biology','3.1','TXpEeGtBU3Y/3.1-communicable-disease-pathogens','Communicable Disease & Pathogens','4.3.1',['4.3.1.1'],8,['0:08 Pathogens','0:49 How pathogens spread','1:46 Stopping the spread']),
('biology','4.1','RXB1Z3hmYWc/4.1-photosynthesis','Photosynthesis','4.4.1',['4.4.1.1','4.4.1.3'],7,['0:07 The photosynthesis reaction','1:30 Glucose for respiration','2:06 Glucose for building and storage']),
('biology','5.1','d3J5dG5rcW4/5.1-homeostasis','Homeostasis','4.5.1',['4.5.1'],9,['0:07 What homeostasis is','1:35 The three parts of a control system','2:31 How the parts communicate','3:32 Negative feedback']),
('biology','6.1','ZGduV0lqa3U/6.1-dna-chromosomes-the-genome','DNA, Chromosomes & the Genome','4.6.1',['4.6.1.4'],7,['0:07 DNA and chromosomes','2:28 Genes and proteins','3:30 The genome','4:03 Uses of the genome']),
('biology','7.1','Z2JzVWRGdW4/7.1-ecosystems-competition','Ecosystems & Competition','4.7.1',['4.7.1.1'],9,['0:07 How organisms relate','1:04 Ecology terms','2:49 Competition','3:48 Interdependence']),
('chemistry','2.1','UFJRRHluWEk/2.1-states-of-matter-changing-state','States of Matter & Changing State','4.2.2',['4.2.2.1'],10,['0:04 Particle model & solids','1:14 Liquids & boiling','2:01 Gases & cooling','3:32 Limits of the model']),
('chemistry','4.1','dkpXUGV1Wmo/4.1-the-reactivity-series','The Reactivity Series','4.4.1',['4.4.1.2'],12,['0:07 What the series is','1:39 Metals with acid','2:52 Metals with water','3:21 Displacement reactions']),
('chemistry','5.1','c2RuQ05kUFc/5.1-exothermic-endothermic-reactions','Exothermic & Endothermic Reactions','4.5.1',['4.5.1.1','4.5.1.2'],9,['0:07 Exothermic reactions','2:35 Endothermic reactions','3:34 Activation energy','4:57 Labelling the profile']),
('chemistry','6.1','dUdmUHJuZk4/6.1-rate-of-reaction-measuring-it','Rate of Reaction & Measuring It','4.6.1',['4.6.1.1'],8,['0:07 What reaction rate is','1:13 Rate calculations','2:35 Mean rate and graphs','3:52 Other units']),
('chemistry','7.1','ZGRkVHVramU/7.1-hydrocarbons-homologous-series','Hydrocarbons & Homologous Series','4.7.1',['4.7.1.1'],11,['0:07 Hydrocarbons','1:16 The first four alkanes','2:05 Homologous series & formula','3:44 Saturated compounds']),
('chemistry','8.1','a3JTUUhQVWs/8.1-purity-formulations','Purity & Formulations','4.8.1',['4.8.1.1','4.8.1.2'],7,['0:07 Intro & pure substances','1:42 Melting & boiling points','3:31 Formulations']),
('chemistry','9.1','VHZwRll1S3k/9.1-the-earth-s-atmosphere',"The Earth's Atmosphere",'4.9.1',['4.9.1.1','4.9.1.2','4.9.1.3','4.9.1.4'],8,["0:07 Intro & today's atmosphere",'1:03 Volcanoes and the oceans','1:50 Algae and plants','2:37 Sedimentary rocks and fuels','3:44 Recap']),
('chemistry','10.1','a1lHTGFGeWU/10.1-finite-resources-sustainability','Finite Resources & Sustainability','4.10.1',['4.10.1.1'],8,['0:07 Sustainable development','1:00 Resources and energy use','2:08 Reusing and recycling','2:36 Recycling glass and metals']),
('physics','2.1','RUNQQkFtYUQ/2.1-circuits-introduction','Circuits Introduction','4.2.1',['4.2.1.1','4.2.1.2','4.2.1.3'],6,['0:07 Circuits and symbols','1:47 What current is','2:15 P.d. and resistance','2:54 Direction of current']),
('physics','3.1','TlFMeVVFYUU/3.1-density','Density','4.3.1',['4.3.1.1'],6,['0:07 Density and its units','1:36 Calculating a volume','2:14 Measuring a solid\'s density','3:58 Measuring a liquid\'s density']),
('physics','4.1','a0VtYlRvaG8/4.1-atomic-structure-isotopes','Atomic Structure & Isotopes','4.4.1',['4.4.1.1','4.4.1.2'],8,['0:07 Protons, neutrons and electrons','1:03 Nuclear symbols and isotopes','3:36 Energy levels','4:38 Ions and ionisation']),
('physics','5.1','TlVXVUt1RVA/5.1-scalar-vector-quantities','Scalar & Vector Quantities','4.5.1',['4.5.1.1'],6,['0:07 Scalar quantities','0:56 Vectors and displacement','2:06 Drawing vectors as arrows']),
('physics','6.1','RFFFd2FRU1g/6.1-longitudinal-transverse-waves','Longitudinal & Transverse Waves','4.6.1',['4.6.1.1','4.6.1.2'],9,['0:07 Energy and wave features','2:03 Period and frequency','3:42 The wave speed equation','4:42 Transverse and longitudinal waves']),
('physics','7.1','eEVMZWZQc2I/7.1-magnets-magnetic-fields','Magnets & Magnetic Fields','4.7.1',['4.7.1.1','4.7.1.2'],9,['0:03 What magnets are','0:46 Drawing field lines','2:22 Plotting with a compass','3:37 Two magnets together']),
('physics','8.1','cG1ZaExoT3Y/8.1-the-solar-system-the-universe','The Solar System & the Universe','4.8.1',['4.8.1.1'],7,['0:08 Satellites and planets','1:48 Asteroids and comets (Cognito marks this outside the course)','2:18 Galaxies and the Universe','3:52 Light-years (Cognito marks this outside the course)']),
]
LIMIT = 'Cognito limits free access (a page showed "2 of 5 free notes and lessons this week" on 5 Nov 2026); an account or upgrade may be needed once the limit is reached.'
for subj in ('biology', 'chemistry', 'physics'):
    pth = os.path.join(ROOT, 'data/res-%s.json' % subj); d = json.load(open(pth))
    cur = json.load(open(os.path.join(ROOT, 'data/%s.json' % subj)))
    los = {}
    for t in cur['topics']:
        for st in t['subtopics']:
            for g in st['groups']: los[g['ref']] = [x['id'] for x in g['los']]
    have = {r['u'] for r in d['records']}
    pre = {'biology': 'BIO', 'chemistry': 'CHE', 'physics': 'PHY'}[subj]
    for (s, lesson, path, title, sub, refs, mins, ch) in NEW:
        if s != subj: continue
        u = BASE % subj + path
        if u in have: continue
        ids = [i for r in refs for i in los[r]]
        d['records'].append({'id': '%s-VID-COG-c%s-%s' % (pre, lesson, sub), 't': 'Cognito: ' + title, 'p': 'Cognito', 'ty': 'video', 'cat': 'video', 'u': u,
            'sub': sub, 'refs': refs, 'los': ids, 'cov': {'lvl': 'part of subtopic', 'det': 'Heading-level mapping: %d of the subtopic\'s learning objectives.' % len(ids)},
            'free': 'free', 'acct': 'limited', 'ans': False, 'ver': 'PARTIALLY_VERIFIED', 'verOrig': 'verified_opened', 'basis': 'heading',
            'why': 'Cognito video lesson (%d min stated on the page). Video chapters: %s.' % (mins, '; '.join(ch)),
            'vn': 'Lesson page opened on 5 Nov 2026 and its timestamp list read. Video playback itself was not tested. ' + LIMIT,
            'weak': False, 'new': True, 'on': '2026-11-05', 'lesson': lesson, 'mins': mins})
    for r in d['records']:
        if r['p'] == 'Cognito':
            r['acct'] = 'limited'
            if r['cat'] == 'video': r['vn'] = (r.get('vn', '').split(' Cognito states')[0] + ' ' + LIMIT).strip() if 'limits free' not in r.get('vn', '') else r['vn']
    json.dump(d, open(pth, 'w'), ensure_ascii=False, separators=(',', ':'))
    # coverage: recompute video counts for subtopics that gained videos
    cp = os.path.join(ROOT, 'data/coverage.json'); c = json.load(open(cp)); cs = c['subjects'][subj]
    for ref, e in cs.items():
        vids = [r for r in d['records'] if r['sub'] == ref and r['cat'] == 'video']
        e['v'] = len(vids); e['vlo'] = len({i for r in vids for i in r.get('los', [])})
    json.dump(c, open(cp, 'w'), ensure_ascii=False, separators=(',', ':'))
print('done')
