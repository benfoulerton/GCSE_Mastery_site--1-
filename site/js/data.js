/* GCSE Mastery – curriculum and resource loading, indexing, progress calculation and next-step logic.
 *
 * Progress rules (also described in README.md and the Settings page):
 *  - An objective is mastered only when the student says so. Opening or finishing a resource never masters anything.
 *  - Subtopic, topic and subject percentages = mastered objectives / all objectives beneath them.
 *  - Objective status 3 = "needs revision" (set by the student). A mastered objective untouched for config.reviewDays is "review due".
 *    Neither lowers the percentage; both put the subtopic into the "Needs revision" state.
 *  - Resource completion (watched / read / attempted) is tracked separately as learning activity.
 */
(function () {
  const { STATUS, unlockThreshold, reviewDays } = GM.config;
  const REVIEW_MS = reviewDays * 86400000;
  const cache = {}; const subIndex = {};
  let coverage = { meta: {}, subjects: {} };
  const resCache = {}; // subject id -> { state, data, promise }
  const listeners = new Set();

  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('Could not load ' + url + ' (' + r.status + ')');
    return r.json();
  }

  /* Build id lists once per subject so progress maths never walks the full tree again. */
  function index(subject) {
    const loIndex = {};
    subject.topics.forEach((t) => {
      t.loIds = [];
      t.subtopics.forEach((st) => {
        st.loIds = [];
        st.groups.forEach((g) => {
          g.loIds = g.los.map((l) => l.id);
          g.los.forEach((l) => { loIndex[l.id] = { topic: t, sub: st, group: g, lo: l }; });
          st.loIds.push(...g.loIds);
        });
        t.loIds.push(...st.loIds);
        subIndex[subject.id + ':' + st.ref] = { subject, topic: t, sub: st };
      });
    });
    subject.loIndex = loIndex;
    subject.loIds = subject.topics.flatMap((t) => t.loIds);
    return subject;
  }

  /* Index a resource file for fast lookup: by subtopic, by id, by learning objective. */
  function indexResources(file, subjectId) {
    const bySub = {}; const byId = {}; const byLo = {}; const subj = cache[subjectId]; const records = [];
    (file.records || []).forEach((r0) => {
      if (!r0 || !r0.id || byId[r0.id] || !r0.sub) return; // skip duplicate or incomplete records instead of showing them twice
      const r = Object.assign({}, r0, { t: r0.t || 'Untitled resource', p: r0.p || 'Unknown provider', los: (r0.los || []).filter((id) => !subj || subj.loIndex[id]) });
      byId[r.id] = r; records.push(r);
      (bySub[r.sub] = bySub[r.sub] || []).push(r);
      if (r.ty === 'video' || r.ty === 'notes') r.los.forEach((id) => { (byLo[id] = byLo[id] || []).push(r); });
    });
    const unvSub = {}; const unvTopic = {};
    (file.unverified || []).forEach((u) => { if (u.sub) (unvSub[u.sub] = unvSub[u.sub] || []).push(u); else if (u.topic) (unvTopic[u.topic] = unvTopic[u.topic] || []).push(u); });
    return { records, bySub, byId, byLo, unvSub, unvTopic };
  }

  let study = null;
  GM.data = {
    async load() {
      const manifest = await loadJSON('data/manifest.json');
      const subjects = await Promise.all(manifest.subjects.map((s) => loadJSON(s.file)));
      subjects.forEach((s) => { cache[s.id] = index(s); });
      try { coverage = await loadJSON('data/coverage.json'); } catch (e) { coverage = { meta: {}, subjects: {} }; } // coverage is optional: the curriculum still works without it
      GM.data.manifest = manifest;
      return manifest;
    },
    /* Flashcards, multiple-choice questions and past papers: optional files, loaded once when first needed. */
    async loadStudy() {
      if (study) return study;
      const get = async (u, k) => { try { const r = await loadJSON(u); return r[k] || []; } catch (e) { return []; } };
      const [cards, questions, papers] = await Promise.all([get('data/flashcards.json', 'cards'), get('data/questions.json', 'questions'), get('data/papers.json', 'papers')]);
      const by = (list, key) => list.reduce((o, x) => { const k = typeof key === 'function' ? key(x) : x[key]; (o[k] = o[k] || []).push(x); return o; }, {});
      const subj = (id) => (id.split('-')[1] === 'BIO' ? 'biology' : id.split('-')[1] === 'CHE' ? 'chemistry' : 'physics');
      study = { cards, questions, papers, cardsBySub: by(cards, (c) => subj(c.id) + ':' + c.sub), qsBySub: by(questions, (q) => subj(q.id) + ':' + q.sub), qById: Object.fromEntries(questions.map((q) => [q.id, q])), cById: Object.fromEntries(cards.map((c) => [c.id, c])), papersBySubject: by(papers, 'subject') };
      return study;
    },
    study: () => study,
    subject: (id) => cache[id],
    subjects: () => GM.config.subjects.map((s) => cache[s.id]).filter(Boolean),
    topic(subjectId, topicId) { const s = cache[subjectId]; return s && s.topics.find((t) => t.id === topicId); },
    subtopic(subjectId, ref) { const x = subIndex[subjectId + ':' + ref]; return x ? { topic: x.topic, sub: x.sub } : null; },
    subtopicByKey: (key) => subIndex[key] || null,
    coverageMeta: () => coverage.meta || {},
    coverage: (subjectId, ref) => (coverage.subjects && coverage.subjects[subjectId] && coverage.subjects[subjectId][ref]) || null,

    /* Resources are loaded one subject at a time, when first needed. A failed load never breaks the curriculum. */
    resourceState: (id) => (resCache[id] ? resCache[id].state : 'idle'),
    resources: (id) => (resCache[id] && resCache[id].data) || null,
    loadResources(id) {
      const c = resCache[id] || (resCache[id] = { state: 'idle', data: null, promise: null });
      if (c.state === 'ready') return Promise.resolve(c.data);
      if (c.promise) return c.promise;
      const entry = GM.data.manifest && GM.data.manifest.subjects.find((s) => s.id === id);
      c.state = 'loading'; listeners.forEach((l) => l());
      c.promise = loadJSON(entry ? entry.resourceFile : 'data/res-' + id + '.json').then((f) => { c.data = indexResources(f, id); c.state = 'ready'; c.promise = null; listeners.forEach((l) => l()); return c.data; })
        .catch((e) => { c.state = 'error'; c.error = e; c.promise = null; listeners.forEach((l) => l()); throw e; });
      c.promise.catch(() => {});
      return c.promise;
    },
    retryResources(id) { if (resCache[id] && resCache[id].state === 'error') { resCache[id] = null; } return GM.data.loadResources(id); },
    onResources(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };

  /* React hook: { state: 'loading'|'ready'|'error', data } for one subject's resources. */
  GM.useStudy = () => {
    const { useState, useEffect } = GM.react; const [, bump] = useState(0);
    useEffect(() => { let on = true; GM.data.loadStudy().then(() => on && bump((n) => n + 1)); return () => { on = false; }; }, []);
    return GM.data.study();
  };
  GM.useResources = (subjectId) => {
    const { useState, useEffect } = GM.react;
    const [, bump] = useState(0);
    useEffect(() => {
      const off = GM.data.onResources(() => bump((n) => n + 1));
      GM.data.loadResources(subjectId).catch(() => {});
      return off;
    }, [subjectId]);
    const s = GM.data.resourceState(subjectId);
    return { state: s === 'idle' ? 'loading' : s, data: GM.data.resources(subjectId), retry: () => GM.data.retryResources(subjectId) };
  };

  /* ---- progress maths ---- */
  function tally(ids, progress, now) {
    const t0 = now || Date.now();
    let done = 0, prog = 0, rev = 0, due = 0;
    for (const id of ids) {
      const p = progress[id]; if (!p) continue;
      if (p.s === STATUS.COMPLETED) { done++; if (t0 - p.t > REVIEW_MS) due++; } else if (p.s === STATUS.IN_PROGRESS) prog++; else if (p.s === STATUS.NEEDS_REVISION) rev++;
    }
    const total = ids.length;
    return { done, prog, rev, due, total, todo: total - done - prog - rev, frac: total ? done / total : 0, progFrac: total ? prog / total : 0 };
  }
  const memo = new WeakMap();
  function summary(subject, progress) {
    let m = memo.get(progress); if (!m) { m = {}; memo.set(progress, m); }
    if (m[subject.id]) return m[subject.id];
    const now = Date.now();
    const topics = subject.topics.map((t) => Object.assign(tally(t.loIds, progress, now), {
      id: t.id,
      subtopics: t.subtopics.map((st) => Object.assign(tally(st.loIds, progress, now), { ref: st.ref })),
    }));
    const all = tally(subject.loIds, progress, now);
    all.topics = topics;
    all.topicsDone = topics.filter((t) => t.total && t.done === t.total).length;
    m[subject.id] = all;
    return all;
  }

  /* Display percent: whole numbers, never 100 unless everything is mastered, never 0 once something is. */
  function pct(t) {
    if (!t.total) return 0;
    if (t.done === t.total) return 100;
    return Math.min(99, Math.floor((t.done / t.total) * 100));
  }
  function pctLabel(t) {
    if (t.done > 0 && pct(t) === 0) return '<1%';
    return pct(t) + '%';
  }

  /* Resource activity per subtopic: how many resources the student has marked done. */
  const actMemo = new WeakMap();
  function activity(resDone) {
    let m = actMemo.get(resDone); if (m) return m;
    m = {}; Object.keys(resDone).forEach((id) => { const k = resDone[id] && resDone[id].k; if (k) m[k] = (m[k] || 0) + 1; });
    actMemo.set(resDone, m); return m;
  }

  /* Subtopic state from real activity: completed / revision / progress / notstarted. */
  function subState(t, acts) {
    if (t.rev > 0 || t.due > 0) return 'revision';
    if (t.total && t.done === t.total) return 'completed';
    if (t.done + t.prog > 0 || acts > 0) return 'progress';
    return 'notstarted';
  }
  const STATE_LABEL = { notstarted: 'Not started', progress: 'In progress', completed: 'Completed', revision: 'Needs revision' };

  /* ---- pathway state (topic level, unchanged rules) ---- */
  function pathway(subject, state) {
    const sum = summary(subject, state.progress);
    const open = state.settings.pathMode === 'open';
    const nodes = subject.topics.map((t, i) => {
      const s = sum.topics[i];
      const key = subject.id + ':' + t.id;
      const complete = s.total > 0 && s.done === s.total;
      const started = s.done + s.prog + s.rev > 0;
      const prev = i > 0 ? sum.topics[i - 1] : null;
      const unlocked = open || i === 0 || started || !!state.unlocked[key] || (prev && prev.total && prev.done / prev.total >= unlockThreshold);
      return { topic: t, sum: s, key, complete, started, unlocked, state: complete ? 'completed' : unlocked ? 'available' : 'locked', index: i };
    });
    // recommended topic: most recently touched unfinished topic, else first unfinished unlocked topic
    let rec = null;
    nodes.forEach((n) => {
      if (n.complete || !n.unlocked) return;
      const ts = state.touched[n.key] || 0;
      if (ts && (!rec || ts > (state.touched[rec.key] || 0))) rec = n;
    });
    if (!rec) rec = nodes.find((n) => !n.complete && n.unlocked) || null;
    if (rec) rec.state = 'current';
    return { nodes, current: rec, summary: sum };
  }

  /* The next objective to work on inside a set of subtopics: first needs-revision / in-progress one, otherwise first not mastered. */
  function nextObjective(topicOrSub, progress) {
    const subs = topicOrSub.subtopics || [topicOrSub];
    let first = null;
    for (const st of subs) for (const g of st.groups) for (const lo of g.los) {
      const p = progress[lo.id];
      if (p && p.s === STATUS.COMPLETED) continue;
      if (p && (p.s === STATUS.IN_PROGRESS || p.s === STATUS.NEEDS_REVISION)) return { lo, sub: st, group: g, resumed: true };
      if (!first) first = { lo, sub: st, group: g, resumed: false };
    }
    return first;
  }

  /* All subtopics of the given subjects with their tally, state and last activity time (for Home and Progress lists). */
  function allSubtopics(subjects, state) {
    const acts = activity(state.resDone); const out = [];
    subjects.forEach((s) => {
      const sum = summary(s, state.progress);
      s.topics.forEach((t, i) => t.subtopics.forEach((st, k) => {
        const tl = sum.topics[i].subtopics[k]; const key = s.id + ':' + st.ref; const a = acts[key] || 0;
        out.push({ subject: s, topic: t, sub: st, t: tl, key, acts: a, state: subState(tl, a), last: state.recent[key] || 0 });
      }));
    });
    return out;
  }
  const recentSubtopics = (subjects, state, n = 4) => allSubtopics(subjects, state).filter((x) => x.last).sort((a, b) => b.last - a.last).slice(0, n);
  const revisionSubtopics = (subjects, state) => allSubtopics(subjects, state).filter((x) => x.state === 'revision').sort((a, b) => (b.t.rev - a.t.rev) || (b.last - a.last));

  /* Resources worth suggesting inside a subtopic (only when that subject's resources are loaded). */
  function bestResources(subjectId, ref) {
    const R = GM.data.resources(subjectId); if (!R) return { videos: [], sets: [] };
    const rs = R.bySub[ref] || [];
    const subj = GM.data.subject(subjectId); const sub = subj && subj.topics.flatMap((t) => t.subtopics).find((x) => x.ref === ref);
    const allIds = sub ? sub.groups.flatMap((g) => g.loIds) : [];
    const gOf = (id) => (sub ? sub.groups.findIndex((g) => g.loIds.includes(id)) : -1);
    const first = (r) => { const ix = (r.los || []).map(gOf).filter((i) => i >= 0); return ix.length ? Math.min(...ix) : 999; };
    const rank = (r) => (r.p === 'Cognito' ? 0 : /FreeScience/i.test(r.p) ? 1 : 2);
    const lesson = (r) => { const m = /\/(\d+)\.(\d+)-/.exec(r.u || ''); return m ? +m[1] * 100 + +m[2] : 0; };
    // Teaching order: the video that starts at the earliest objective first; ties go to Cognito, then FreeScienceLessons, then lesson number.
    const vids = rs.filter((r) => r.cat === 'video').sort((a, b) => first(a) - first(b) || rank(a) - rank(b) || lesson(a) - lesson(b) || a.t.localeCompare(b.t));
    const sets = rs.filter((r) => r.cat === 'past_paper' && !r.weak);
    return { videos: vids, sets };
  }

  /* The single next action for a subject. Order of priority (documented in README):
   *  1 an objective the student flagged "needs revision"
   *  2 the most recently studied subtopic that is not finished (resume it)
   *  3 the first unfinished subtopic of the recommended pathway topic
   *  4 a mastered objective that is due for review
   * Inside a subtopic the step follows Learn → Practise → Check: its best video until one has been watched, then a question set until one has been attempted, then the next objective. */
  function nextAction(subject, state) {
    const subs = allSubtopics([subject], state);
    const pw = pathway(subject, state);
    let pick = null; let kind = null;
    const flagged = subs.filter((x) => x.t.rev > 0).sort((a, b) => b.last - a.last);
    if (flagged.length) { pick = flagged[0]; kind = 'review'; }
    if (!pick) { const cur = subs.filter((x) => x.last && x.state !== 'completed' && x.state !== 'notstarted').sort((a, b) => b.last - a.last)[0]; if (cur) { pick = cur; kind = 'resume'; } }
    if (!pick && pw.current) { const x = subs.find((s) => s.topic === pw.current.topic && s.state !== 'completed'); if (x) { pick = x; kind = x.state === 'notstarted' ? 'start' : 'resume'; } }
    if (!pick) { const due = subs.filter((x) => x.t.due > 0).sort((a, b) => a.last - b.last)[0]; if (due) { pick = due; kind = 'due'; } }
    if (!pick) return null;
    const out = { kind, pick, topic: pick.topic, sub: pick.sub, state: pick.state };
    const obj = kind === 'review' || kind === 'due' ? findLo(pick.sub, state.progress, kind) : nextObjective(pick.sub, state.progress);
    out.objective = obj;
    const best = bestResources(subject.id, pick.sub.ref);
    const doneIds = state.resDone;
    // Guided order inside a subtopic: Learn (a video), then Practise (a question set), then Check your knowledge (objectives).
    // Flagged or due objectives always go straight to Check.
    if (kind !== 'review' && kind !== 'due') {
      const watched = best.videos.some((r) => doneIds[r.id]); const tried = best.sets.some((r) => doneIds[r.id]);
      const v = best.videos.find((r) => !doneIds[r.id]); const q = best.sets.find((r) => !doneIds[r.id]);
      if (!watched && v) { out.resource = v; out.verb = 'Watch'; out.section = 'learn'; }
      else if (!tried && q && pick.t.frac < 1) { out.resource = q; out.verb = 'Try a question set'; out.section = 'practise'; }
    }
    if (!out.resource) { out.verb = kind === 'review' ? 'Review' : kind === 'due' ? 'Refresh' : 'Work on'; out.section = 'check'; }
    return out;
  }
  /* Which subject the student was last working in: the latest activity recorded for any of its topics, subtopics or resources. */
  function lastSubject(state) {
    let best = null; let bt = 0;
    const bump = (key, ts) => { const id = String(key).split(':')[0]; if (ts > bt && GM.data.subject(id)) { bt = ts; best = id; } };
    Object.keys(state.touched || {}).forEach((k) => bump(k, state.touched[k]));
    Object.keys(state.recent || {}).forEach((k) => bump(k, state.recent[k]));
    return best;
  }
  /* The one thing to do next across all three sciences. Resumes the subject studied most recently; a brand-new student
   * starts at the first subtopic of the subject chosen in settings (Biology by default). */
  function globalAction(state) {
    const subjects = GM.data.subjects();
    const last = lastSubject(state);
    const first = last || state.settings.subject;
    const order = [first, ...subjects.map((s) => s.id).filter((id) => id !== first)].map((id) => GM.data.subject(id)).filter(Boolean);
    for (const s of order) { const act = nextAction(s, state); if (act) return Object.assign({ subject: s, fresh: !last }, act); }
    return null;
  }
  /* The next few unfinished subtopics in pathway order after the current one. */
  function upcoming(subject, state, exceptRef, n = 3) {
    const pw = pathway(subject, state); const all = allSubtopics([subject], state);
    const out = [];
    for (const node of pw.nodes) {
      if (!node.unlocked) continue;
      for (const x of all.filter((q) => q.topic === node.topic)) {
        if (x.state === 'completed' || x.sub.ref === exceptRef) continue;
        out.push(x); if (out.length >= n) return out;
      }
    }
    return out;
  }
  function findLo(sub, progress, kind) {
    const want = kind === 'review' ? STATUS.NEEDS_REVISION : STATUS.COMPLETED; const now = Date.now();
    for (const g of sub.groups) for (const lo of g.los) { const p = progress[lo.id]; if (p && p.s === want && (kind === 'review' || now - p.t > REVIEW_MS)) return { lo, sub, group: g, resumed: true }; }
    return nextObjective(sub, progress);
  }

  GM.calc = { tally, summary, pct, pctLabel, pathway, nextObjective, subState, activity, allSubtopics, recentSubtopics, revisionSubtopics, nextAction, globalAction, lastSubject, upcoming, bestResources, STATE_LABEL, REVIEW_MS };

  /* Split trailing "(HT only)" style qualifiers off a title so they can be shown as badges. */
  GM.splitTitle = function (title) {
    const badges = [];
    let t = title;
    const re = /\s*\(([^()]*\bonly\b[^()]*)\)\s*$/i;
    let m;
    while ((m = re.exec(t))) { badges.unshift(m[1].trim()); t = t.slice(0, m.index); }
    return { title: t.trim(), badges };
  };
  GM.badgesFrom = function (flag) { return flag ? flag.split(',').map((x) => x.trim()).filter(Boolean) : []; };
})();
