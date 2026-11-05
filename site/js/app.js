/* GCSE Mastery – hash router, data loading and mounting. */
(function () {
  const { html } = GM; const { useState, useEffect } = GM.react;

  /* Hash names only use letters, digits and hyphens, so dots in references become hyphens. Map them back. */
  let loMap = null;
  function lookups() {
    if (loMap) return loMap;
    loMap = {};
    GM.data.subjects().forEach((s) => s.loIds.forEach((id) => { loMap[id.replace(/\./g, '-')] = { id, subject: s.id }; }));
    return loMap;
  }
  const subjectIds = () => GM.config.subjects.map((s) => s.id);

  function parse(hash) {
    const h = (hash || '').replace(/^#/, '') || 'home';
    const dash = (n) => n.replace(/-/g, '.');
    let m;
    if (['home', 'subjects', 'progress', 'preferences', 'papers', 'revise'].includes(h)) return { name: h, section: h };
    if ((m = /^subject-([a-z]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'subject', section: 'subjects', subject: m[1], tab: 'curriculum' };
    if ((m = /^pathway-([a-z]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'subject', section: 'subjects', subject: m[1], tab: 'pathway' };
    if ((m = /^practicals-([a-z]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'subject', section: 'subjects', subject: m[1], tab: 'practicals' };
    if ((m = /^skills-([a-z]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'subject', section: 'subjects', subject: m[1], tab: 'skills' };
    if ((m = /^maths-([a-z]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'subject', section: 'subjects', subject: m[1], tab: 'maths' };
    if ((m = /^practical-([a-z]+)-(\d+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'practical', section: 'subjects', subject: m[1], n: parseInt(m[2], 10) };
    if ((m = /^(cards|quiz)-([a-z]+)-([\d-]+)$/.exec(h)) && subjectIds().includes(m[2])) {
      const ref = dash(m[3]); const hit = GM.data.subtopic(m[2], ref);
      if (hit) return { name: m[1], section: 'subjects', subject: m[2], topic: hit.topic.id, ref };
    }
    if ((m = /^topicquiz-([a-z]+)-([\d-]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'topicquiz', section: 'subjects', subject: m[1], topic: dash(m[2]) };
    if ((m = /^topic-([a-z]+)-([\d-]+)$/.exec(h)) && subjectIds().includes(m[1])) return { name: 'topic', section: 'subjects', subject: m[1], topic: dash(m[2]) };
    if ((m = /^sub-([a-z]+)-([\d-]+?)(?:--([a-z]+))?$/.exec(h)) && subjectIds().includes(m[1])) {
      const ref = dash(m[2]); const hit = GM.data.subtopic(m[1], ref);
      if (hit) return { name: 'subtopic', section: 'subjects', subject: m[1], topic: hit.topic.id, ref, sectionId: m[3] };
    }
    if ((m = /^lo-(.+)$/.exec(h))) {
      const hit = lookups()[m[1]];
      if (hit) { const idx = GM.data.subject(hit.subject).loIndex[hit.id]; return { name: 'subtopic', section: 'subjects', subject: hit.subject, topic: idx.topic.id, ref: idx.sub.ref, focusLo: hit.id }; }
    }
    return { name: 'missing', section: 'home' };
  }

  function applyTheme(theme) {
    const r = document.documentElement;
    if (theme === 'light' || theme === 'dark') r.setAttribute('data-theme', theme); else r.removeAttribute('data-theme');
  }

  const Missing = () => html`<div class="page"><h1 class="page-title">Page not found</h1><p class="lede">That link does not match anything in GCSE Mastery.</p><${GM.Link} to="home" class="btn btn-primary">Back to Home<//></div>`;

  function App() {
    const st = GM.useStore();
    const [hash, setHash] = useState(location.hash);
    useEffect(() => { const f = () => setHash(location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
    useEffect(() => { applyTheme(st.settings.theme); }, [st.settings.theme]);
    const [search, setSearch] = useState(false);
    useEffect(() => {
      const f = (e) => { const typing = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName); if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (!typing && !e.ctrlKey && !e.metaKey && e.key === '/')) { e.preventDefault(); setSearch(true); } };
      document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f);
    }, []);
    useEffect(() => { setSearch(false); }, [hash]);
    const route = parse(hash);
    useEffect(() => { if (route.subject && st.settings.subject !== route.subject) GM.store.setSetting('subject', route.subject); }, [route.subject]);
    useEffect(() => { if (route.name !== 'subtopic') window.scrollTo(0, 0); }, [hash]);
    useEffect(() => {
      const t = { home: 'Home', subjects: 'Subjects', progress: 'Progress', preferences: 'Settings' }[route.name];
      document.title = (t ? t + ' · ' : route.name === 'subtopic' ? route.ref + ' · ' : '') + 'GCSE Mastery';
    }, [hash]);
    let page;
    switch (route.name) {
      case 'home': page = html`<${GM.HomePage} />`; break;
      case 'subjects': page = html`<${GM.SubjectsPage} />`; break;
      case 'progress': page = html`<${GM.ProgressPage} />`; break;
      case 'papers': page = html`<${GM.PapersPage} />`; break;
      case 'revise': page = html`<${GM.RevisePage} />`; break;
      case 'cards': page = html`<${GM.FlashcardsPage} key=${route.subject + route.ref} subjectId=${route.subject} topicId=${route.topic} subRef=${route.ref} />`; break;
      case 'quiz': page = html`<${GM.QuizPage} key=${route.subject + route.ref} subjectId=${route.subject} topicId=${route.topic} subRef=${route.ref} />`; break;
      case 'topicquiz': page = html`<${GM.QuizPage} key=${route.subject + route.topic} subjectId=${route.subject} topicId=${route.topic} />`; break;
      case 'preferences': page = html`<${GM.SettingsPage} />`; break;
      case 'subject': page = html`<${GM.SubjectPage} id=${route.subject} tab=${route.tab} />`; break;
      case 'practical': page = html`<${GM.PracticalPage} subjectId=${route.subject} n=${route.n} />`; break;
      case 'topic': page = html`<${GM.TopicPage} key=${route.subject + route.topic} subjectId=${route.subject} topicId=${route.topic} />`; break;
      case 'subtopic': page = html`<${GM.SubtopicPage} key=${route.subject + route.ref + (route.focusLo || '') + (route.sectionId || '')} subjectId=${route.subject} topicId=${route.topic} subRef=${route.ref} focusLo=${route.focusLo} section=${route.sectionId} />`; break;
      default: page = html`<${Missing} />`;
    }
    return html`<${GM.react.Fragment}><a class="skip" href="#main-content" onClick=${(e) => { e.preventDefault(); const m = document.getElementById('main-content'); if (m) m.focus(); }}>Skip to content</a>
      <${GM.Header} route=${route} onSearch=${() => setSearch(true)} />${search ? html`<${GM.SearchOverlay} onClose=${() => setSearch(false)} />` : null}<main id="main-content" tabindex="-1">${page}</main>
      <footer class="foot"><p>Built from the AQA GCSE Biology (8461), Chemistry (8462) and Physics (8463) specifications, Higher Tier. Not affiliated with AQA.</p></footer><//>`;
  }

  async function boot() {
    const root = document.getElementById('gm-root');
    const reactRoot = ReactDOM.createRoot(root);
    applyTheme(GM.store.getState().settings.theme);
    try {
      await GM.data.load();
    } catch (e) {
      root.innerHTML = '<div class="page"><h1 class="page-title">Could not load the curriculum</h1><p class="lede">' + String(e.message).replace(/</g, '&lt;') + '</p><button class="btn btn-primary" onclick="location.reload()">Try again</button></div>';
      return;
    }
    const st = GM.store.getState(); const route = parse(location.hash);
    reactRoot.render(html`<${App} />`);
  }
  window.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
