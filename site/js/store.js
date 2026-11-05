/* GCSE Mastery – progress store.
 *
 * All progress lives in one plain object, saved through a StorageAdapter. Today the adapter is
 * localStorage (with an in-memory fallback). To add accounts / cloud sync later, write another adapter
 * with the same two methods (load, save) and pass it to GM.store.useAdapter(); nothing else changes.
 *
 * State shape (schemaVersion 1):
 *   profile:  { name }
 *   settings: { subject, pathMode: 'guided'|'open', theme: 'auto'|'light'|'dark' }
 *   progress: { [learningObjectiveId]: { s: 1|2, t: epochMs } }   // absent = not started
 *   unlocked: { 'subject:topicId': true }                         // topics skipped ahead to
 *   touched:  { 'subject:topicId': epochMs }                      // last activity per topic
 *   recent:   { 'subject:subtopicRef': epochMs }                  // last activity per subtopic
 *   resDone:  { resourceId: { t: epochMs, k: 'subject:subtopicRef' } }  // resources the student marked watched / read / attempted
 * Learning-objective status: 1 in progress, 2 mastered, 3 needs revision. Resource completion never changes mastery.
 */
(function () {
  const { storageKey, schemaVersion } = GM.config;

  const defaults = () => ({
    v: schemaVersion,
    profile: { name: '' },
    settings: { subject: 'biology', pathMode: 'open', theme: 'auto' },
    progress: {},
    unlocked: {},
    touched: {},
    recent: {},
    resDone: {},
    bookmarks: {},   // { id: { type, title, href, subject, t } }
    last: null,      // { subject, topic, ref, mode, t }  where the student was last working
    live: null,      // an unfinished flashcard or quiz session so it can be resumed
    sessions: [],    // finished quiz / flashcard sessions, newest first (capped)
    qstats: {},      // { questionId: { r: timesRight, w: timesWrong, t: lastTime } }
    cardSt: {},      // { cardId: { s: 'known'|'revise', t } }
  });

  /* ---- adapters ---- */
  const memory = {};
  const LocalAdapter = {
    name: 'This browser (localStorage)',
    load() {
      try {
        const raw = window.localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return memory[storageKey] ? JSON.parse(memory[storageKey]) : null;
      }
    },
    save(state) {
      const raw = JSON.stringify(state);
      memory[storageKey] = raw;
      try { window.localStorage.setItem(storageKey, raw); return true; } catch (e) { return false; }
    },
  };

  function normalise(s) {
    const d = defaults();
    if (!s || typeof s !== 'object') return d;
    return {
      v: schemaVersion,
      profile: Object.assign(d.profile, s.profile || {}),
      settings: Object.assign(d.settings, s.settings || {}),
      progress: s.progress && typeof s.progress === 'object' ? s.progress : {},
      unlocked: s.unlocked && typeof s.unlocked === 'object' ? s.unlocked : {},
      touched: s.touched && typeof s.touched === 'object' ? s.touched : {},
      recent: s.recent && typeof s.recent === 'object' ? s.recent : {},
      resDone: s.resDone && typeof s.resDone === 'object' ? s.resDone : {},
      bookmarks: s.bookmarks && typeof s.bookmarks === 'object' ? s.bookmarks : {},
      last: s.last && typeof s.last === 'object' ? s.last : null,
      live: s.live && typeof s.live === 'object' ? s.live : null,
      sessions: Array.isArray(s.sessions) ? s.sessions.slice(0, 60) : [],
      qstats: s.qstats && typeof s.qstats === 'object' ? s.qstats : {},
      cardSt: s.cardSt && typeof s.cardSt === 'object' ? s.cardSt : {},
    };
  }

  let adapter = LocalAdapter;
  let state = normalise(adapter.load());
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());

  const store = {
    getState: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    useAdapter(a) { adapter = a; state = normalise(a.load()); emit(); },
    adapterName: () => adapter.name,
    set(next) { state = next; adapter.save(state); emit(); },
    update(fn) { store.set(fn(state)); },

    setStatus(subjectId, topicId, loId, status) {
      store.update((s) => {
        const progress = Object.assign({}, s.progress);
        if (status === GM.config.STATUS.NOT_STARTED) delete progress[loId];
        else progress[loId] = { s: status, t: Date.now() };
        const now = Date.now();
        const touched = Object.assign({}, s.touched, { [subjectId + ':' + topicId]: now });
        const subj = GM.data && GM.data.subject(subjectId); const hit = subj && subj.loIndex[loId];
        const recent = hit ? Object.assign({}, s.recent, { [subjectId + ':' + hit.sub.ref]: now }) : s.recent;
        return Object.assign({}, s, { progress, touched, recent });
      });
    },
    /* Mark a resource (video watched, notes read, question set attempted). This is activity only; it never changes mastery. */
    setResourceDone(subjectId, topicId, subRef, resourceId, done) {
      store.update((s) => {
        const resDone = Object.assign({}, s.resDone); const now = Date.now();
        if (done) resDone[resourceId] = { t: now, k: subjectId + ':' + subRef }; else delete resDone[resourceId];
        const touched = Object.assign({}, s.touched, { [subjectId + ':' + topicId]: now });
        const recent = Object.assign({}, s.recent, { [subjectId + ':' + subRef]: now });
        return Object.assign({}, s, { resDone, touched, recent });
      });
    },
    /* ---- study features: bookmarks, resume, sessions, answers ---- */
    toggleBookmark(id, meta) { store.update((s) => { const b = Object.assign({}, s.bookmarks); if (b[id]) delete b[id]; else b[id] = Object.assign({}, meta, { t: Date.now() }); return Object.assign({}, s, { bookmarks: b }); }); },
    isBookmarked: (id) => !!state.bookmarks[id],
    setLast(o) { const l = state.last; if (l && l.subject === o.subject && l.ref === o.ref && l.mode === o.mode && Date.now() - l.t < 5000) return; store.update((s) => Object.assign({}, s, { last: Object.assign({}, o, { t: Date.now() }) })); },
    setLive(live) { store.update((s) => Object.assign({}, s, { live })); },
    logSession(sess) { store.update((s) => Object.assign({}, s, { live: null, sessions: [Object.assign({}, sess, { t: Date.now() })].concat(s.sessions).slice(0, 60) })); },
    recordAnswer(qid, ok) { store.update((s) => { const q = Object.assign({ r: 0, w: 0 }, s.qstats[qid]); if (ok) q.r++; else q.w++; q.t = Date.now(); return Object.assign({}, s, { qstats: Object.assign({}, s.qstats, { [qid]: q }) }); }); },
    setCard(id, v) { store.update((s) => { const c = Object.assign({}, s.cardSt); if (v) c[id] = { s: v, t: Date.now() }; else delete c[id]; return Object.assign({}, s, { cardSt: c }); }); },
    isResourceDone: (id) => !!state.resDone[id],
    getStatus: (loId) => (state.progress[loId] ? state.progress[loId].s : 0),
    setSetting(k, v) { store.update((s) => Object.assign({}, s, { settings: Object.assign({}, s.settings, { [k]: v }) })); },
    setName(name) { store.update((s) => Object.assign({}, s, { profile: Object.assign({}, s.profile, { name }) })); },
    unlockTopic(subjectId, topicId) {
      store.update((s) => Object.assign({}, s, { unlocked: Object.assign({}, s.unlocked, { [subjectId + ':' + topicId]: true }) }));
    },
    reset() { store.set(Object.assign(defaults(), { settings: state.settings, profile: state.profile })); },
    exportJSON() { return JSON.stringify(Object.assign({ app: 'GCSE Mastery' }, state), null, 2); },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.progress !== 'object') throw new Error('This file does not look like a GCSE Mastery backup.');
      store.set(normalise(parsed));
    },
  };
  GM.store = store;
})();
