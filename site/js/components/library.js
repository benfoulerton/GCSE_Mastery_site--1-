/* Past-paper library, the Revise hub (weak areas, saved items, recent sessions), bookmarks and global search. */
(function () {
  const { html, Icon } = GM; const { useState, useEffect, useRef, useMemo } = GM.react;

  /* A star that saves or unsaves anything with a title and an address. */
  GM.BookmarkButton = ({ id, type, title, href, subject, label }) => {
    const st = GM.useStore(); const on = !!st.bookmarks[id];
    return html`<button type="button" class=${'starbtn' + (on ? ' on' : '')} aria-pressed=${on} aria-label=${(on ? 'Remove from saved: ' : 'Save: ') + (label || title)} title=${on ? 'Saved. Press to remove.' : 'Save for later'}
      onClick=${() => GM.store.toggleBookmark(id, { type, title, href, subject })}><${Icon.Star} size=${18} /></button>`;
  };

  /* ---------------------------------------------------------------- Past papers */
  const PaperCard = ({ p }) => html`<article class="paper" aria-label=${p.series + ' Paper ' + p.paper}>
    <div class="paper-head"><div><p class="paper-year">${p.series}</p><h3 class="paper-title">Paper ${p.paper}</h3></div><${GM.BookmarkButton} id=${p.id} type="Past paper" title=${GM.config.subjects.find((s) => s.id === p.subject).name + ' ' + p.series + ' Paper ' + p.paper + ' (Higher)'} href="papers" subject=${p.subject} /></div>
    <p class="paper-meta">${p.tier} tier · ${p.code} · ${p.marks} marks<br /><span class="muted">${p.date}</span></p>
    <div class="rc-actions"><${GM.ExtLink} href=${p.qp.u} primary=${true}>Question paper (PDF)<//><${GM.ExtLink} href=${p.ms.u}>Mark scheme (PDF)<//>${p.er ? html`<${GM.ExtLink} href=${p.er.u}>Examiner report<//>` : null}</div>
    ${p.er ? null : html`<p class="small muted">No examiner report is linked for this paper.</p>`}
  </article>`;

  GM.PapersPage = () => {
    const S = GM.useStudy(); const papers = S ? S.papers : null;
    return html`<div class="page"><h1 class="page-title">Past papers</h1>
      <p class="lede">Official AQA GCSE papers, Higher tier, with their mark schemes. Each file opens on the AQA website in a new tab.</p>
      <p class="small muted">Every link was opened on 5 Nov 2026 and the question paper and mark scheme were checked to be the same paper. Foundation papers are not included. AQA may move files; if one fails, search the code (for example 8461/1H) on aqa.org.uk.</p>
      ${papers === null ? html`<p class="muted" role="status">Loading…</p>` : GM.config.subjects.map((s) => {
        const list = (papers || []).filter((p) => p.subject === s.id).sort((a, b) => b.year - a.year || a.paper - b.paper);
        return html`<section key=${s.id} class="paper-sec" data-subject=${s.id}><h2 class="section-title"><span class="dot"></span> ${s.name} <span class="muted">AQA ${s.spec}</span></h2>
          ${list.length ? html`<div class="paper-grid">${list.map((p) => html`<${PaperCard} key=${p.id} p=${p} />`)}</div>` : html`<p class="empty">No papers are listed for ${s.name} yet.</p>`}</section>`; })}
    </div>`;
  };

  /* ---------------------------------------------------------------- Revise hub */
  const when = (t) => { const d = Math.round((Date.now() - t) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
  const hrefOf = (b) => b.href;

  GM.RevisePage = () => {
    const st = GM.useStore(); const S = GM.useStudy();
    const subjects = GM.data.subjects();
    const revSubs = GM.calc.revisionSubtopics(subjects, st).slice(0, 6);
    const flaggedLos = []; subjects.forEach((s) => s.loIds.forEach((id) => { const p = st.progress[id]; if (p && p.s === 3) flaggedLos.push({ s, id, t: p.t }); }));
    flaggedLos.sort((a, b) => b.t - a.t);
    // Objectives that quiz questions keep getting wrong.
    const loWrong = {}; const hardQs = [];
    if (S) Object.keys(st.qstats).forEach((qid) => { const q = S.qById[qid]; const x = st.qstats[qid]; if (!q || !x.w) return; q.los.forEach((id) => { loWrong[id] = (loWrong[id] || 0) + x.w; }); if (x.w >= 2 && x.w > x.r) hardQs.push({ q, x }); });
    const weakLos = Object.keys(loWrong).sort((a, b) => loWrong[b] - loWrong[a]).slice(0, 6);
    const reviseCards = S ? S.cards.filter((c) => st.cardSt[c.id] && st.cardSt[c.id].s === 'revise') : [];
    const saved = Object.keys(st.bookmarks).map((id) => Object.assign({ id }, st.bookmarks[id])).sort((a, b) => b.t - a.t);
    const types = [...new Set(saved.map((b) => b.type))];
    const recent = GM.calc.recentSubtopics(subjects, st, 5);
    const subjOf = (id) => (/^B-/.test(id) ? 'biology' : /^C-/.test(id) ? 'chemistry' : 'physics');
    const loLine = (sid, id) => { const h = GM.data.subject(sid).loIndex[id]; return h ? html`<${GM.Link} to=${GM.route.lo(id)}><span class="ref">${h.group.ref}</span> ${GM.splitTitle(h.lo.t).title}<//>` : id; };
    const nothing = !revSubs.length && !flaggedLos.length && !weakLos.length && !reviseCards.length;
    return html`<div class="page"><h1 class="page-title">Revise</h1>
      <p class="lede">What to work on, what you saved, and what you did recently.</p>

      <section aria-labelledby="rv-weak"><h2 id="rv-weak" class="section-title">Weak areas</h2>
        ${nothing ? html`<p class="empty">Nothing flagged yet. Mark objectives as “Needs revision”, or take a quiz, and your weak spots will show up here.</p>` : null}
        ${revSubs.length ? html`<h3 class="subsec-h">Subtopics needing revision</h3><ul class="subrows">${revSubs.map((x) => html`<li key=${x.key}><${GM.Link} to=${GM.route.sub(x.subject.id, x.sub.ref, 'check')} class="subrow" data-subject=${x.subject.id}><span class="subrow-main"><span class="subrow-line"><span class="ref">${x.subject.name.slice(0, 3)} ${x.sub.ref}</span><span class="subrow-title">${GM.splitTitle(x.sub.title).title}</span></span></span><span class="muted small">${x.t.rev} flagged</span><//></li>`)}</ul>` : null}
        ${weakLos.length ? html`<h3 class="subsec-h">Objectives you keep getting wrong in quizzes</h3><ul class="lo-links">${weakLos.map((id) => html`<li key=${id}>${loLine(subjOf(id), id)} <span class="muted small">· ${loWrong[id]} wrong answer${loWrong[id] === 1 ? '' : 's'}</span></li>`)}</ul>` : null}
        ${hardQs.length ? html`<h3 class="subsec-h">Questions you keep missing</h3><ul class="lo-links">${hardQs.slice(0, 5).map(({ q, x }) => html`<li key=${q.id}>${q.q} <span class="muted small">· wrong ${x.w}, right ${x.r}</span></li>`)}</ul>` : null}
        ${flaggedLos.length && !revSubs.length ? html`<ul class="lo-links">${flaggedLos.slice(0, 6).map((f) => html`<li key=${f.id}>${loLine(f.s.id, f.id)}</li>`)}</ul>` : null}
        ${reviseCards.length ? html`<p class="small">${reviseCards.length} flashcard${reviseCards.length === 1 ? ' is' : 's are'} marked “needs revision”.</p>` : null}
      </section>

      <section aria-labelledby="rv-saved"><h2 id="rv-saved" class="section-title">Saved</h2>
        ${saved.length ? types.map((ty) => html`<div key=${ty}><h3 class="subsec-h">${ty}s</h3><ul class="saved">${saved.filter((b) => b.type === ty).map((b) => html`<li key=${b.id}><${GM.Link} to=${hrefOf(b)}>${b.title}<//><${GM.BookmarkButton} id=${b.id} type=${b.type} title=${b.title} href=${b.href} subject=${b.subject} /></li>`)}</ul></div>`)
          : html`<p class="empty">Press the star on a subtopic, video, practice paper, flashcard deck or past paper to keep it here.</p>`}
      </section>

      <section aria-labelledby="rv-hist"><h2 id="rv-hist" class="section-title">Recent</h2>
        ${st.sessions.length ? html`<ul class="hist">${st.sessions.slice(0, 6).map((s, i) => html`<li key=${i}><span>${s.kind === 'quiz' ? 'Quiz' : 'Flashcards'} · ${s.label || (GM.data.subject(s.subject).name + ' ' + s.ref)}</span><span class="muted small">${s.kind === 'quiz' ? s.score + ' / ' + s.total : s.known + ' known, ' + s.revise + ' to revise'} · ${when(s.t)}</span></li>`)}</ul>` : html`<p class="empty">Finished quizzes and flashcard decks will be listed here.</p>`}
        ${recent.length ? html`<h3 class="subsec-h">Recently studied</h3><ul class="subrows">${recent.map((x) => html`<li key=${x.key}><${GM.Link} to=${GM.route.sub(x.subject.id, x.sub.ref)} class="subrow" data-subject=${x.subject.id}><span class="subrow-main"><span class="subrow-line"><span class="ref">${x.subject.name.slice(0, 3)} ${x.sub.ref}</span><span class="subrow-title">${GM.splitTitle(x.sub.title).title}</span></span></span><span class="muted small">${when(x.last)}</span><//></li>`)}</ul>` : null}
      </section>
    </div>`;
  };

  /* ---------------------------------------------------------------- Search */
  let index = null;
  async function buildIndex() {
    if (index) return index;
    const S = await GM.data.loadStudy();
    await Promise.all(GM.config.subjects.map((s) => GM.data.loadResources(s.id).catch(() => {})));
    const out = [];
    GM.data.subjects().forEach((s) => {
      out.push({ k: 'Subject', t: s.name, x: s.name + ' ' + s.code, to: GM.route.subject(s.id) });
      s.topics.forEach((t) => {
        out.push({ k: 'Topic', t: 'Topic ' + t.ref + ' ' + GM.splitTitle(t.title).title, x: s.name + ' ' + t.ref + ' ' + t.title, to: GM.route.topic(s.id, t.id), s: s.name });
        t.subtopics.forEach((st) => {
          out.push({ k: 'Subtopic', t: st.ref + ' ' + GM.splitTitle(st.title).title, x: s.name + ' ' + st.ref + ' ' + st.title, to: GM.route.sub(s.id, st.ref), s: s.name });
          st.groups.forEach((g) => {
            out.push({ k: 'Spec reference', t: g.ref + ' ' + GM.splitTitle(g.title).title, x: g.ref + ' ' + g.title + ' ' + s.name, to: GM.route.sub(s.id, st.ref, 'check'), s: s.name });
            g.los.forEach((lo) => out.push({ k: 'Objective', t: GM.splitTitle(lo.t).title, x: lo.t + ' ' + g.ref + ' ' + lo.k.map((k) => k[2]).join(' '), to: GM.route.lo(lo.id), s: s.name + ' ' + g.ref }));
          });
        });
      });
      const R = GM.data.resources(s.id);
      if (R) R.records.forEach((r) => {
        if (r.cat === 'video' || r.cat === 'practical') out.push({ k: 'Video', t: r.t.replace(/^Cognito: /, ''), x: r.t + ' ' + r.p + ' ' + s.name + ' ' + r.sub, to: GM.route.sub(s.id, r.sub, 'learn'), s: s.name + ' ' + r.sub });
        else if (r.cat === 'past_paper') out.push({ k: 'Practice', t: r.t, x: r.t + ' ' + s.name + ' ' + r.sub, to: GM.route.sub(s.id, r.sub, 'practise'), s: s.name + ' ' + r.sub });
      });
    });
    S.papers.forEach((p) => out.push({ k: 'Past paper', t: p.subject[0].toUpperCase() + p.subject.slice(1) + ' ' + p.series + ' Paper ' + p.paper, x: p.subject + ' ' + p.series + ' paper ' + p.paper + ' ' + p.code + ' ' + p.year + ' past paper mark scheme', to: 'papers', s: p.code }));
    out.forEach((e) => { e.l = (e.t + ' ' + e.x).toLowerCase(); e.tl = e.t.toLowerCase(); });
    index = out; return out;
  }
  const ORDER = { Subject: 0, Topic: 1, Subtopic: 2, 'Spec reference': 3, Video: 4, Practice: 5, 'Past paper': 6, Objective: 7 };
  function search(idx, q) {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean); if (!toks.length) return [];
    const res = [];
    for (const e of idx) {
      if (!toks.every((t) => e.l.includes(t))) continue;
      let sc = 0; toks.forEach((t) => { if (e.tl.startsWith(t)) sc += 4; else if (e.tl.includes(' ' + t)) sc += 2; else sc += 1; });
      res.push([sc * 10 - ORDER[e.k], e]);
    }
    return res.sort((a, b) => b[0] - a[0]).slice(0, 25).map((x) => x[1]);
  }

  GM.SearchOverlay = ({ onClose }) => {
    const [q, setQ] = useState(''); const [idx, setIdx] = useState(null); const [sel, setSel] = useState(0); const inp = useRef(null);
    useEffect(() => { buildIndex().then(setIdx); if (inp.current) inp.current.focus(); }, []);
    const results = useMemo(() => (idx ? search(idx, q) : []), [idx, q]);
    useEffect(() => { setSel(0); }, [q]);
    useEffect(() => { const el = document.querySelector('.sr.on'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }, [sel]);
    const open = (e) => { onClose(); GM.go(e.to); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
      else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); open(results[sel]); }
    };
    return html`<div class="overlay" role="presentation" onMouseDown=${(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="searchbox" role="dialog" aria-modal="true" aria-label="Search GCSE Mastery" onKeyDown=${onKey}>
        <input ref=${inp} class="search-in" type="search" placeholder="Search topics, spec references (4.1.1.2), videos, past papers…" value=${q} onInput=${(e) => setQ(e.target.value)} aria-label="Search" />
        <ul class="search-out" role="listbox">${!idx ? html`<li class="muted small pad">Loading…</li>` : !q.trim() ? html`<li class="muted small pad">Try “mitochondria”, “4.1.1”, “Biology 2023” or “titration”.</li>` : !results.length ? html`<li class="muted small pad">No matches.</li>`
          : results.map((r, i) => html`<li key=${i} role="option" aria-selected=${i === sel}><a href=${'#' + r.to} class=${'sr' + (i === sel ? ' on' : '')} onClick=${(e) => { e.preventDefault(); open(r); }} onMouseMove=${() => setSel(i)}><span class="sr-k">${r.k}</span><span class="sr-t">${r.t}</span>${r.s ? html`<span class="sr-s muted small">${r.s}</span>` : null}</a></li>`)}</ul>
        <p class="small muted pad">↑ ↓ to move, Enter to open, Esc to close.</p>
      </div></div>`;
  };
})();
