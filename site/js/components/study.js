/* Flashcards and multiple-choice quizzes. All content comes from data/flashcards.json and data/questions.json (GM.useStudy);
 * nothing is written in this file. An unfinished session is kept in the store ("live") so it can be resumed. */
(function () {
  const { html, Icon } = GM; const { useState, useEffect, useRef } = GM.react;

  const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  /* Keyboard shortcuts for a page. Ignored while typing in a field or when a modifier key is held. */
  const useKeys = (fn) => {
    const ref = useRef(fn); ref.current = fn;
    useEffect(() => {
      const f = (e) => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.ctrlKey || e.metaKey || e.altKey) return; ref.current(e); };
      document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f);
    }, []);
  };
  const loTitle = (subjectId, id) => { const hit = GM.data.subject(subjectId).loIndex[id]; return hit ? GM.splitTitle(hit.lo.t).title : id; };
  const LoLinks = ({ subjectId, ids }) => html`<ul class="lo-links">${ids.map((id) => html`<li key=${id}><${GM.Link} to=${GM.route.lo(id)}>${loTitle(subjectId, id)}<//></li>`)}</ul>`;

  const Shell = ({ subjectId, topicId, subRef, title, kicker, children }) => {
    const subject = GM.data.subject(subjectId); const topic = GM.data.topic(subjectId, topicId);
    const crumbs = [['Subjects', GM.route.subjects()], [subject.name, GM.route.subject(subjectId)], ['Topic ' + topic.ref, GM.route.topic(subjectId, topicId)]];
    if (subRef) crumbs.push(['Subtopic ' + subRef, GM.route.sub(subjectId, subRef, 'practise')]);
    crumbs.push([kicker]);
    return html`<div class="page study-page"><${GM.Crumbs} items=${crumbs} /><p class="eyebrow"><span class="dot" data-subject=${subjectId}></span>${subject.name}${subRef ? ' · ' + subRef : ''}</p><h1 class="page-title">${title}</h1>${children}</div>`;
  };
  const NoContent = ({ what, subjectId, subRef }) => html`<div class="notebox"><${Icon.Info} size=${18} /><p>There are no ${what} for this subtopic yet. They are being added one subtopic at a time and checked before release. ${subRef ? html`<${GM.Link} to=${GM.route.sub(subjectId, subRef, 'practise')}>Back to Practise<//>` : null}</p></div>`;

  /* ---------------------------------------------------------------- Flashcards */
  const Deck = ({ subjectId, topicId, subRef, cards, byId }) => {
    const st = GM.useStore();
    const resume = st.live && st.live.kind === 'cards' && st.live.subject === subjectId && st.live.ref === subRef && st.live.order.every((id) => byId[id]) ? st.live : null;
    const [order, setOrder] = useState(resume ? resume.order : cards.map((c) => c.id));
    const [i, setI] = useState(resume ? resume.i : 0);
    const [marks, setMarks] = useState(resume ? resume.marks : {});
    const [flip, setFlip] = useState(false);
    const logged = useRef(false);
    const done = i >= order.length;
    useEffect(() => { GM.store.setLast({ subject: subjectId, topic: topicId, ref: subRef, mode: 'cards' }); }, []);
    useEffect(() => { if (!done) GM.store.setLive({ kind: 'cards', subject: subjectId, topic: topicId, ref: subRef, order, i, marks }); }, [order, i, marks]);
    useEffect(() => {
      if (done && !logged.current) { logged.current = true; const v = Object.values(marks); GM.store.logSession({ kind: 'cards', subject: subjectId, topic: topicId, ref: subRef, total: order.length, known: v.filter((x) => x === 'known').length, revise: v.filter((x) => x === 'revise').length }); }
    }, [done]);
    const mark = (v) => { if (done) return; const id = order[i]; GM.store.setCard(id, v); setMarks((m) => Object.assign({}, m, { [id]: v })); setFlip(false); setI(i + 1); };
    const go = (d) => { setFlip(false); setI(Math.max(0, Math.min(order.length, i + d))); };
    const restart = (ids) => { logged.current = false; setOrder(ids); setI(0); setMarks({}); setFlip(false); };
    const missed = order.filter((id) => marks[id] === 'revise');
    useKeys((e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (!done && (e.key === ' ' || e.key === 'Enter')) { if (e.target && e.target.tagName === 'BUTTON') return; e.preventDefault(); setFlip((f) => !f); }
      else if (!done && flip && e.key === '1') mark('known');
      else if (!done && flip && e.key === '2') mark('revise');
    });
    const known = Object.values(marks).filter((x) => x === 'known').length; const rev = missed.length;
    if (done) return html`<section class="results" aria-live="polite">
      <h2 class="section-title">Deck finished</h2>
      <p class="lede">You marked <strong>${known}</strong> as known and <strong>${rev}</strong> as needing revision, out of ${order.length} cards.</p>
      <div class="rc-actions">${rev ? html`<button type="button" class="btn btn-primary" onClick=${() => restart(shuffle(missed))}>Review the ${rev} you missed</button>` : null}
        <button type="button" class="btn btn-quiet" onClick=${() => restart(shuffle(cards.map((c) => c.id)))}>Restart, shuffled</button>
        <${GM.Link} to=${GM.route.sub(subjectId, subRef, 'practise')} class="btn btn-quiet">Back to Practise<//></div>
      ${rev ? html`<h3 class="subsec-h">Cards to revisit</h3><ul class="miss-list">${missed.map((id) => html`<li key=${id}><strong>${byId[id].q}</strong><br /><span class="muted">${byId[id].a}</span></li>`)}</ul>` : html`<p class="small muted">Nice. Come back to this deck in a few days: spaced repetition works better than one long session.</p>`}
    </section>`;
    const c = byId[order[i]];
    return html`<section aria-label="Flashcards">
      <div class="study-bar"><span class="small">Card <strong>${i + 1}</strong> of ${order.length}</span><span class="small muted">${known} known · ${rev} to revise <${GM.BookmarkButton} id=${'card:' + c.id} type="Flashcard" title=${c.q.length > 70 ? c.q.slice(0, 67) + '…' : c.q} href=${GM.route.cards(subjectId, subRef)} subject=${subjectId} label="this flashcard" /></span></div>
      <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax=${order.length} aria-valuenow=${i}><span style=${{ width: (i / order.length * 100) + '%' }}></span></div>
      <button type="button" class=${'fcard' + (flip ? ' flipped' : '')} onClick=${() => setFlip(!flip)} aria-label=${flip ? 'Answer. Press to see the question again.' : 'Question. Press to reveal the answer.'}>
        <span class="fcard-meta">${c.refs.join(' · ')} · ${c.ty}</span>
        <span class="fcard-text">${flip ? c.a : c.q}</span>
        <span class="fcard-hint">${flip ? 'Answer' : 'Tap or press Space to reveal'}</span>
      </button>
      ${flip ? html`<div class="rate-row"><button type="button" class="btn btn-quiet" onClick=${() => mark('revise')}>Needs revision <kbd>2</kbd></button><button type="button" class="btn btn-primary" onClick=${() => mark('known')}>I knew it <kbd>1</kbd></button></div>` : html`<div class="rate-row"><button type="button" class="btn btn-primary" onClick=${() => setFlip(true)}>Show answer <kbd>Space</kbd></button></div>`}
      <div class="study-tools">
        <button type="button" class="btn btn-quiet" onClick=${() => go(-1)} disabled=${i === 0}><${Icon.Back} size=${16} />Previous</button>
        <button type="button" class="btn btn-quiet" onClick=${() => go(1)}>Skip<${Icon.Arrow} size=${16} /></button>
        <button type="button" class="btn btn-quiet" onClick=${() => restart(shuffle(order))}>Shuffle</button>
        <button type="button" class="btn btn-quiet" onClick=${() => restart(cards.map((x) => x.id))}>Restart</button>
      </div>
      <p class="small muted">Keys: ← → move, Space flips, 1 = I knew it, 2 = needs revision.</p>
    </section>`;
  };

  GM.FlashcardsPage = ({ subjectId, topicId, subRef }) => {
    const S = GM.useStudy();
    const cards = S ? (S.cardsBySub[subjectId + ':' + subRef] || []) : null;
    const hit = GM.data.subtopic(subjectId, subRef);
    return html`<${Shell} subjectId=${subjectId} topicId=${topicId} subRef=${subRef} kicker="Flashcards" title=${'Flashcards: ' + GM.splitTitle(hit.sub.title).title}>
      ${cards === null ? html`<p class="muted" role="status">Loading flashcards…</p>` : !cards.length ? html`<${NoContent} what="flashcards" subjectId=${subjectId} subRef=${subRef} />` : html`<${Deck} key=${subjectId + subRef} subjectId=${subjectId} topicId=${topicId} subRef=${subRef} cards=${cards} byId=${S.cById} />`}
    <//>`;
  };

  /* ---------------------------------------------------------------- Multiple-choice quiz */
  const Quiz = ({ subjectId, topicId, subRef, pool, byId, scopeKey, label, retryIds }) => {
    const st = GM.useStore();
    const resume = st.live && st.live.kind === 'quiz' && st.live.key === scopeKey && st.live.order.every((id) => byId[id]) ? st.live : null;
    const fresh = () => { const ids = retryIds || shuffle(pool.map((q) => q.id)).slice(0, subRef ? 20 : 15); return { order: ids, perm: Object.fromEntries(ids.map((id) => [id, shuffle([0, 1, 2, 3])])), answers: {}, i: 0 }; };
    const [S0, setS0] = useState(resume || fresh());
    const [pick, setPick] = useState(null);
    const logged = useRef(false);
    const { order, perm, answers, i } = S0;
    const done = i >= order.length;
    const q = !done ? byId[order[i]] : null;
    const answered = q && answers[q.id] !== undefined;
    useEffect(() => { GM.store.setLast({ subject: subjectId, topic: topicId, ref: subRef || '', mode: 'quiz' }); }, []);
    useEffect(() => { if (!done) GM.store.setLive({ kind: 'quiz', key: scopeKey, label, subject: subjectId, topic: topicId, ref: subRef || '', order, perm, answers, i }); }, [S0]);
    const right = order.filter((id) => answers[id] !== undefined && answers[id] === byId[id].a);
    const wrong = order.filter((id) => answers[id] !== undefined && answers[id] !== byId[id].a);
    useEffect(() => {
      if (done && !logged.current) {
        logged.current = true;
        GM.store.logSession({ kind: 'quiz', key: scopeKey, label, subject: subjectId, topic: topicId, ref: subRef || '', total: order.length, score: right.length, wrong });
      }
    }, [done]);
    const submit = () => {
      if (pick === null || answered) return;
      const orig = perm[q.id][pick]; GM.store.recordAnswer(q.id, orig === q.a);
      setS0((s) => Object.assign({}, s, { answers: Object.assign({}, s.answers, { [q.id]: orig }) }));
    };
    const next = () => { setPick(null); setS0((s) => Object.assign({}, s, { i: s.i + 1 })); };
    useKeys((e) => {
      if (done) return;
      if (!answered && /^[1-4]$/.test(e.key)) { setPick(+e.key - 1); }
      else if (e.key === 'Enter') { if (e.target && e.target.tagName === 'BUTTON' && e.target.dataset.opt === undefined) return; e.preventDefault(); answered ? next() : submit(); }
      else if (e.key === 'Escape') { GM.go(subRef ? GM.route.sub(subjectId, subRef, 'practise') : GM.route.topic(subjectId, topicId)); }
    });
    const again = (ids) => { logged.current = false; setPick(null); GM.store.setLive(null); setS0({ order: ids, perm: Object.fromEntries(ids.map((id) => [id, shuffle([0, 1, 2, 3])])), answers: {}, i: 0 }); };

    if (done) {
      const pct = Math.round(right.length / order.length * 100);
      const los = [...new Set(wrong.flatMap((id) => byId[id].los))];
      const target = subRef ? GM.route.sub(subjectId, subRef, los.length ? 'learn' : 'check') : GM.route.topic(subjectId, topicId);
      return html`<section class="results" aria-live="polite">
        <h2 class="section-title">Your result</h2>
        <p class="big-score"><strong>${right.length}</strong> / ${order.length} <span class="muted">(${pct}%)</span></p>
        <p class="lede">${pct >= 85 ? 'Strong. Mark the objectives you are confident about as mastered in the Check step.' : pct >= 60 ? 'A solid start. Look at the questions you missed, then try again.' : 'These ideas need more work. Go back over the objectives below, then retry.'}</p>
        <div class="rc-actions">${wrong.length ? html`<button type="button" class="btn btn-primary" onClick=${() => again(shuffle(wrong))}>Retry the ${wrong.length} you got wrong</button>` : null}
          <button type="button" class="btn btn-quiet" onClick=${() => again(shuffle(pool.map((x) => x.id)).slice(0, subRef ? 20 : 15))}>New quiz</button>
          <${GM.Link} to=${target} class="btn btn-quiet">${los.length ? 'Review the objectives' : 'Back'}<//></div>
        ${los.length ? html`<h3 class="subsec-h">Objectives that need more work</h3><${LoLinks} subjectId=${subjectId} ids=${los} />
          <button type="button" class="btn btn-quiet" onClick=${() => { const subj = GM.data.subject(subjectId); los.forEach((id) => { const h = subj.loIndex[id]; if (h && GM.store.getStatus(id) !== 2) GM.store.setStatus(subjectId, h.topic.id, id, 3); }); }}>Flag these as Needs revision</button>
          <p class="small muted">Flagging only changes objectives that are not already mastered.</p>` : null}
        ${wrong.length ? html`<h3 class="subsec-h">Questions to revisit</h3><ol class="miss-list">${wrong.map((id) => { const x = byId[id]; return html`<li key=${id}><strong>${x.q}</strong><br />Your answer: ${x.opts[answers[id]]}<br />Correct: <strong>${x.opts[x.a]}</strong><br /><span class="muted">${x.ex[x.a]}</span></li>`; })}</ol>` : html`<p class="small muted">No mistakes. Try a topic quiz or the exam questions next.</p>`}
      </section>`;
    }
    const sel = answered ? perm[q.id].indexOf(answers[q.id]) : pick;
    const correctPos = perm[q.id].indexOf(q.a);
    return html`<section aria-label="Quiz question">
      <div class="study-bar"><span class="small">Question <strong>${i + 1}</strong> of ${order.length}</span><span class="small muted">${right.length} correct so far</span></div>
      <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax=${order.length} aria-valuenow=${i}><span style=${{ width: (i / order.length * 100) + '%' }}></span></div>
      <p class="q-meta small muted">${q.refs.join(' · ')} · ${['', 'Easier', 'Medium', 'Harder'][q.d]}</p>
      <h2 class="q-text" id="q-h">${q.q}</h2>
      <ul class="opts" role="radiogroup" aria-labelledby="q-h">${perm[q.id].map((orig, pos) => {
        const cls = 'opt' + (sel === pos ? ' sel' : '') + (answered && pos === correctPos ? ' right' : '') + (answered && sel === pos && pos !== correctPos ? ' wrong' : '');
        return html`<li key=${pos}><button type="button" data-opt=${pos} role="radio" aria-checked=${sel === pos} class=${cls} disabled=${answered} onClick=${() => setPick(pos)}>
          <span class="opt-n">${pos + 1}</span><span class="opt-t">${q.opts[orig]}</span>${answered && pos === correctPos ? html`<${Icon.Check} size=${18} />` : null}</button>
          ${answered && (pos === correctPos || sel === pos) ? html`<p class="opt-why small">${pos === correctPos ? 'Correct. ' : 'Not this one. '}${q.ex[orig].replace(/^Correct\.\s*/, '')}</p>` : null}</li>`; })}</ul>
      ${answered ? html`<div class=${'fb ' + (answers[q.id] === q.a ? 'ok' : 'bad')} role="status"><strong>${answers[q.id] === q.a ? 'Correct.' : 'Not quite.'}</strong> The answer is <strong>${q.opts[q.a]}</strong>.</div>
        <div class="rate-row"><button type="button" class="btn btn-primary btn-lg" onClick=${next}>${i + 1 === order.length ? 'See results' : 'Next question'}<${Icon.Arrow} size=${18} /></button></div>`
        : html`<div class="rate-row"><button type="button" class="btn btn-primary btn-lg" disabled=${pick === null} onClick=${submit}>Check answer</button></div>`}
      <p class="small muted">Keys: 1–4 choose an answer, Enter checks it and moves on, Esc leaves the quiz.</p>
    </section>`;
  };

  GM.QuizPage = ({ subjectId, topicId, subRef }) => {
    const S = GM.useStudy(); const topic = GM.data.topic(subjectId, topicId);
    if (!topic) return html`<div class="page"><${GM.Empty}>That quiz could not be found.<//></div>`;
    const subs = subRef ? [subRef] : topic.subtopics.map((s) => s.ref);
    const pool = S ? subs.flatMap((r) => S.qsBySub[subjectId + ':' + r] || []) : null;
    const hit = subRef ? GM.data.subtopic(subjectId, subRef) : null;
    const label = hit ? GM.splitTitle(hit.sub.title).title : 'Topic ' + topic.ref + ': ' + GM.splitTitle(topic.title).title;
    return html`<${Shell} subjectId=${subjectId} topicId=${topicId} subRef=${subRef} kicker=${subRef ? 'Quiz' : 'Topic quiz'} title=${(subRef ? 'Quiz: ' : 'Topic quiz: ') + label}>
      ${pool === null ? html`<p class="muted" role="status">Loading questions…</p>` : !pool.length ? html`<${NoContent} what="quiz questions" subjectId=${subjectId} subRef=${subRef} />`
        : html`<${Quiz} key=${subjectId + topicId + (subRef || '')} subjectId=${subjectId} topicId=${topicId} subRef=${subRef} pool=${pool} byId=${S.qById} scopeKey=${subjectId + ':' + (subRef || topic.id)} label=${label} />`}
    <//>`;
  };
})();
