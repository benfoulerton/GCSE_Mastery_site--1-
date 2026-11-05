/* Subtopic page: one guided journey in three steps. 1 Learn (videos, notes, the knowledge), 2 Practise (question sets,
 * practicals), 3 Check your knowledge (the learning objectives, where the student rates their own mastery). */
(function () {
  const { html, Icon, Bar, Badges, StatusDot, StatusSegment, TYPE_LABEL, STATUS_LABEL } = GM;
  const { useState, useEffect, useRef } = GM.react;

  const specRange = (ps) => (ps.length === 1 ? 'P' + ps[0] : ps.length > 1 ? 'P' + ps[0] + (ps.length === ps[ps.length - 1] - ps[0] + 1 ? '–P' + ps[ps.length - 1] : ', P' + ps.slice(1).join(', P')) : '');
  const kn = (list) => html`<ul class="kn">${list.map((k, i) => html`<li key=${i}>${k[1] && TYPE_LABEL[k[1]] ? html`<span class="kn-type">${TYPE_LABEL[k[1]]}</span>` : null}<span>${k[2]}</span></li>`)}</ul>`;

  /* One learning objective.
   *  mode "learn": read-only study view (explanation, specification, resources).
   *  mode "check": the self-assessment view, with the mastery control always visible. */
  GM.Objective = ({ subject, topic, group, lo, locked, open, onToggle, R, mode = 'check', onRelearn }) => {
    const st = GM.useStore();
    const p = st.progress[lo.id]; const status = p ? p.s : 0;
    const due = status === 2 && Date.now() - p.t > GM.calc.REVIEW_MS;
    const { title, badges } = GM.splitTitle(lo.t);
    const flags = GM.badgesFrom(lo.f).filter((b) => !badges.includes(b));
    const spec = lo.k.filter((k) => k[0] === 'S'); const expl = lo.k.filter((k) => k[0] === 'E');
    const warn = lo.k.filter((k) => k[0] === 'FLAG' || k[0] === 'NOTE');
    const paras = group.spec.filter((q) => lo.p.includes(q.n));
    const set = (v) => { if (locked) GM.store.unlockTopic(subject.id, topic.id); GM.store.setStatus(subject.id, topic.id, lo.id, v); };
    const did = 'lo-' + lo.id; const check = mode === 'check';
    const cover = R ? (R.byLo[lo.id] || []).filter((r) => r.cat === 'video' || r.cat === 'practical' || (r.cat === 'notes' && r.p !== 'Cognito')) : null;
    return html`<li class=${'lo s' + status + (open ? ' open' : '') + (check ? ' lo-check' : '')} id=${check ? did : did + '-learn'}>
      <div class="lo-row">
        <span class="lo-dot" aria-hidden="true"><${StatusDot} status=${status} /></span>
        <button type="button" class="lo-main" aria-expanded=${open} aria-controls=${did + '-d-' + mode} onClick=${onToggle}>
          <span class="lo-title">${title}</span>
          <span class="lo-chips"><span class="ref">${group.ref}${lo.p.length ? ' · ' + specRange(lo.p) : ''}</span><${Badges} list=${[...badges, ...flags]} />${lo.rp ? html`<${GM.Badge} kind="rp">Practical<//>` : null}${warn.some((k) => k[0] === 'FLAG') ? html`<${GM.Badge} kind="flag">Flagged<//>` : null}${due ? html`<${GM.Badge} kind="due">Review due<//>` : null}<span class="visually-hidden"> Status: ${STATUS_LABEL[status]}.</span></span>
        </button>
        ${check ? null : html`<span class="lo-state">${STATUS_LABEL[status]}</span>`}
        <button type="button" class="lo-chevbtn" tabindex="-1" aria-hidden="true" onClick=${onToggle}><${Icon.Chevron} size=${18} class=${'lo-chev' + (open ? ' flip' : '')} /></button>
        ${check ? html`<div class="lo-seg"><${StatusSegment} status=${status} onChange=${set} /></div>` : null}
      </div>
      ${open ? html`<div class="lo-detail" id=${did + '-d-' + mode}>
        ${!check && expl.length ? html`<section class="expl" aria-label="Explanatory notes"><h5 class="mini-h">Explanation and worked detail <span class="tag tag-expl">Study aid, not specification text</span></h5>${kn(expl)}</section>` : null}
        <section aria-label="Specification requirements"><h5 class="mini-h">What the specification requires <span class="tag tag-spec">Specification</span></h5>
          ${spec.length ? kn(spec) : html`<p class="muted small">No separate requirement text for this objective.</p>`}
        </section>
        ${warn.length ? html`<section class="flagbox" aria-label="Flagged ambiguity"><h5 class="mini-h"><${Icon.Flag} size=${15} /> Flagged for checking</h5>${warn.map((k, i) => html`<p key=${i}>${k[2]}</p>`)}</section>` : null}
        ${lo.rp ? html`<p class="rp-link"><${GM.Link} to=${GM.route.practical(subject.id, lo.rp)} class="btn btn-quiet"><${Icon.Flask} size=${16} />Open required practical ${lo.rp} in full<//></p>` : null}
        ${paras.length ? html`<details class="specquote"><summary>Full specification wording (verbatim) · ${group.ref} ${specRange(lo.p)}</summary>
          ${paras.map((q) => html`<blockquote key=${q.n}><span class="ref">${group.ref} P${q.n}</span><p>${q.t}</p>${q.notes.length ? html`<p class="skills"><strong>Skills notes:</strong> ${q.notes.join(' · ')}</p>` : null}</blockquote>`)}
        </details>` : null}
        ${check ? html`<div class="lo-relearn"><button type="button" class="btn btn-quiet" onClick=${() => onRelearn(lo.id)}>Not sure? Go back to the Learn step for this objective</button></div>`
          : html`<section class="resources" aria-label="Resources for this objective"><h5 class="mini-h">Resources that cover this objective</h5>
          ${cover === null ? html`<p class="muted small">Loading resources…</p>` : cover.length ? html`<ul class="res-list">${cover.slice(0, 5).map((r) => html`<li key=${r.id}><a href=${r.u} target="_blank" rel="noopener noreferrer">${r.t}</a><span class="muted"> · ${r.p.replace(' (YouTube)', '')} · ${r.cat === 'video' || r.cat === 'practical' ? 'video' : 'notes'}</span> </li>`)}</ul>${cover.length > 5 ? html`<p class="small muted">${cover.length - 5} more are listed above.</p>` : null}`
            : html`<p class="muted small">No video is matched to this objective on its own. The videos listed above for this subtopic are the closest.</p>`}
        </section>`}
      </div>` : null}
    </li>`;
  };

  const Loading = ({ R }) => R.state === 'error'
    ? html`<div class="notebox" role="alert"><${Icon.Info} size=${18} /><div><p>The resource list could not be loaded, so videos and question sets are unavailable right now. Your objectives still work in the Check step.</p><button type="button" class="btn btn-quiet" onClick=${R.retry}>Try again</button></div></div>`
    : html`<p class="muted" role="status">Loading resources…</p>`;

  /* Teaching order: the video that starts at the earliest section of the specification comes first; ties go to Cognito, then FreeScienceLessons, then lesson order. */
  const provRank = (r) => (r.p === 'Cognito' ? 0 : /FreeScience/i.test(r.p) ? 1 : 2);
  const lessonNo = (r) => { const m = /\/(\d+)\.(\d+)-/.exec(r.u || ''); return m ? +m[1] * 100 + +m[2] : 0; };
  const inOrder = (sub) => (a, b) => {
    const gOf = (id) => sub.groups.findIndex((g) => g.loIds.includes(id));
    const first = (r) => { const ix = (r.los || []).map(gOf).filter((i) => i >= 0); return ix.length ? Math.min(...ix) : 999; };
    return first(a) - first(b) || provRank(a) - provRank(b) || lessonNo(a) - lessonNo(b) || a.t.localeCompare(b.t);
  };
  const byRelevance = (a, b) => (b.los || []).length - (a.los || []).length || (a.ver === 'VERIFIED' ? -1 : 0) - (b.ver === 'VERIFIED' ? -1 : 0) || a.t.localeCompare(b.t);

  /* The objectives of the subtopic in collapsible groups (specification sections). */
  const Groups = ({ sub, subject, topic, locked, R, mode, openGroups, setOpenGroups, openLos, setOpenLos, onRelearn }) => {
    const st = GM.useStore();
    const toggleG = (ref) => setOpenGroups((o) => Object.assign({}, o, { [ref]: !o[ref] }));
    const toggleL = (id) => setOpenLos((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
    return html`<div class="groups">${sub.groups.map((g) => {
      const gs = GM.calc.tally(g.loIds, st.progress); const gt = GM.splitTitle(g.title); const isOpen = !!openGroups[g.ref]; const gid = 'g-' + mode + '-' + g.ref.replace(/\./g, '-');
      return html`<section class=${'group' + (isOpen ? ' open' : '')} key=${g.ref}>
        <h3 class="group-h"><button type="button" class="group-btn" aria-expanded=${isOpen} aria-controls=${gid} onClick=${() => toggleG(g.ref)}>
          <span class="ref">${g.ref}</span><span class="group-title">${gt.title}</span><${Badges} list=${gt.badges} />
          <span class="group-count">${gs.done} of ${gs.total} mastered</span><${Icon.Chevron} size=${18} class=${isOpen ? 'flip' : ''} /></button></h3>
        ${isOpen ? html`<ul class="los" id=${gid}>${g.los.map((lo) => html`<${GM.Objective} key=${lo.id} mode=${mode} subject=${subject} topic=${topic} group=${g} lo=${lo} locked=${locked} R=${R} open=${openLos.includes(mode + lo.id)} onToggle=${() => toggleL(mode + lo.id)} onRelearn=${onRelearn} />`)}</ul>` : null}
      </section>`; })}</div>`;
  };

  GM.SubtopicPage = ({ subjectId, topicId, subRef, focusLo, section }) => {
    const st = GM.useStore();
    const subject = GM.data.subject(subjectId); const topic = GM.data.topic(subjectId, topicId);
    const sub = topic && topic.subtopics.find((s) => s.ref === subRef);
    const R = GM.useResources(subjectId);
    const SD = GM.useStudy(); const S = st; const nQ = SD ? (SD.qsBySub[subjectId + ':' + subRef] || []).length : 0; const cardList = SD ? (SD.cardsBySub[subjectId + ':' + subRef] || []) : []; const nC = cardList.length; const cKnown = cardList.filter((c) => st.cardSt[c.id] && st.cardSt[c.id].s === 'known').length;
    const startStep = focusLo ? 'check' : GM.stepFor(section || 'learn');
    const [step, setStep] = useState(startStep);
    const firstOpen = (mode) => {
      if (!sub) return {};
      const o = {}; const g = sub.groups.find((x) => focusLo ? x.loIds.includes(focusLo) : x.loIds.some((id) => !(st.progress[id] && st.progress[id].s === 2))) || sub.groups[0];
      if (g) o[g.ref] = true; return o;
    };
    const [gOpenLearn, setGOpenLearn] = useState(() => firstOpen('learn'));
    const [gOpenCheck, setGOpenCheck] = useState(() => firstOpen('check'));
    const [openLos, setOpenLos] = useState(() => (focusLo ? ['check' + focusLo] : []));
    const [allVids, setAllVids] = useState(false); const [allNotes, setAllNotes] = useState(false);
    const panel = useRef(null); const mounted = useRef(false);
    useEffect(() => {
      if (!sub) return;
      if (focusLo) setTimeout(() => { const el = document.getElementById('lo-' + focusLo); if (el) el.scrollIntoView({ block: 'center' }); }, 60);
      else window.scrollTo(0, 0);
    }, [!!sub]);
    useEffect(() => { if (sub) GM.store.setLast({ subject: subjectId, topic: topicId, ref: subRef, mode: step }); }, [!!sub]);
    if (!sub) return html`<div class="page"><${GM.Empty}>That subtopic could not be found.<//></div>`;

    const pw = GM.calc.pathway(subject, st);
    const node = pw.nodes.find((n) => n.topic.id === topicId); const locked = node.state === 'locked';
    const ti = topic.subtopics.indexOf(sub);
    const sum = pw.summary.topics[subject.topics.indexOf(topic)].subtopics[ti];
    const acts = GM.calc.activity(st.resDone)[subjectId + ':' + subRef] || 0;
    const state = GM.calc.subState(sum, acts);
    const cov = GM.data.coverage(subjectId, subRef);
    const { title, badges } = GM.splitTitle(sub.title);
    const rs = R.data ? (R.data.bySub[subRef] || []) : [];
    const vids = rs.filter((r) => r.cat === 'video').sort(inOrder(sub));
    const notes = rs.filter((r) => r.cat === 'notes' && r.p !== 'Cognito').sort(byRelevance);
    const pvids = rs.filter((r) => r.cat === 'practical');
    const sets = rs.filter((r) => r.cat === 'past_paper' && !r.weak).sort(byRelevance);
    const weak = rs.filter((r) => r.cat === 'past_paper' && r.weak);
    const pracs = subject.practicals.filter((p) => p.where && p.where.sub === subRef);
    const looseP = pvids.filter((v) => { const m = /practical\s*(\d+)/i.exec(v.t); return !m || !pracs.some((p) => p.n === +m[1]); });
    const nDone = (list) => list.filter((r) => st.resDone[r.id]).length;
    const flat = subject.topics.flatMap((t) => t.subtopics.map((s) => ({ t, s })));
    const idx = flat.findIndex((x) => x.s.ref === subRef); const prev = flat[idx - 1]; const nxt = flat[idx + 1];
    const allIds = sub.groups.flatMap((g) => g.loIds);
    const stepIdx = GM.STEPS.findIndex((s) => s[0] === step);
    // A step only shows a tick when there is real evidence: something watched or read, a set attempted, every objective mastered.
    const stepDone = { learn: !!R.data && (nDone(vids) + nDone(notes) > 0), practise: !!R.data && (nDone(sets) > 0), check: sum.total > 0 && sum.done === sum.total };

    const goStep = (k, opts) => {
      setStep(k); GM.store.setLast({ subject: subjectId, topic: topicId, ref: subRef, mode: k });
      try { history.replaceState(null, '', '#' + GM.route.sub(subjectId, subRef, k)); } catch (e) { /* the page still works without a shareable address */ }
      // After pressing Continue at the bottom of a step, bring the step bar back into view (only if it has scrolled away).
      setTimeout(() => { const el = document.querySelector('.stepper'); if (el && el.getBoundingClientRect().top < 60) window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - 64)); }, 0);
    };
    const relearn = (loId) => { const hit = subject.loIndex[loId]; setGOpenLearn((o) => Object.assign({}, o, { [hit.group.ref]: true })); setOpenLos((a) => (a.includes('learn' + loId) ? a : [...a, 'learn' + loId])); goStep('learn'); setTimeout(() => { const el = document.getElementById('lo-' + loId + '-learn'); if (el) el.scrollIntoView({ block: 'center' }); }, 30); };

    const counts = {
      learn: R.data ? `${nDone(vids)} of ${vids.length} videos watched` : 'Videos and notes',
      practise: R.data ? `${nDone(sets)} of ${sets.length} attempted` : 'Questions',
      check: `${sum.done} of ${sum.total} mastered`,
    };
    const StepNav = ({ pos }) => html`<div class=${'stepnav' + (pos === 'end' ? ' end' : '')}>
      ${stepIdx > 0 ? html`<button type="button" class="btn btn-quiet" onClick=${() => goStep(GM.STEPS[stepIdx - 1][0])}><${Icon.Back} size=${16} />Back to ${GM.STEPS[stepIdx - 1][1]}</button>` : html`<span></span>`}
      ${stepIdx < 2 ? html`<button type="button" class="btn btn-primary btn-lg" onClick=${() => goStep(GM.STEPS[stepIdx + 1][0])}>Continue to ${GM.STEPS[stepIdx + 1][1]}<${Icon.Arrow} size=${18} /></button>` : null}
    </div>`;

    return html`<div class="page subpage">
      <${GM.Crumbs} items=${[['Subjects', GM.route.subjects()], [subject.name, GM.route.subject(subjectId)], ['Topic ' + topic.ref, GM.route.topic(subjectId, topic.id)], ['Subtopic ' + subRef]]} />
      <header class="topic-head">
        <div><p class="eyebrow"><span class="dot"></span>${subject.name} · ${GM.splitTitle(topic.title).title} · ${subRef}</p>
          <h1 class="page-title">${title} <${GM.BookmarkButton} id=${'sub:' + subjectId + ':' + subRef} type="Subtopic" title=${subject.name + ' ' + subRef + ' ' + title} href=${GM.route.sub(subjectId, subRef)} subject=${subjectId} /></h1>
          <p class="subhead-chips"><${GM.StateChip} state=${state} /><${Badges} list=${badges} /></p></div>
        <div class="topic-prog"><span class="big-num sm">${GM.calc.pct(sum)}<small>%</small></span>
          <${Bar} t=${sum} label=${title + ' mastery'} /><p class="muted small">${sum.done} of ${sum.total} objectives mastered${sum.prog ? ` · ${sum.prog} in progress` : ''}${sum.rev ? ` · ${sum.rev} need revision` : ''}${sum.due ? ` · ${sum.due} review due` : ''}</p></div>
      </header>
      ${locked ? html`<div class="lockbanner" role="status"><${Icon.Lock} size=${20} /><div><strong>This topic is suggested for later.</strong> You can learn it now. Start it to track your progress.</div>
        <button type="button" class="btn btn-primary" onClick=${() => GM.store.unlockTopic(subjectId, topicId)}>Start this topic</button></div>` : null}

      <nav class="stepper" aria-label="Learning steps for this subtopic">
        <ol>${GM.STEPS.map(([k, l], i) => html`<li key=${k}><button type="button" class=${'step' + (k === step ? ' on' : '') + (stepDone[k] ? ' past' : '')} aria-current=${k === step ? 'step' : null} onClick=${() => goStep(k)}>
          <span class="step-n">${stepDone[k] ? html`<${Icon.Check} size=${14} sw=${3} />` : i + 1}</span>
          <span class="step-txt"><strong>${l}</strong><span class="step-sub">${counts[k]}</span></span></button></li>`)}</ol>
      </nav>

      <section class="steppanel" ref=${panel} aria-labelledby="step-h">
        ${step === 'learn' ? html`<${GM.react.Fragment}>
          <div class="step-intro"><p class="eyebrow">Step 1 of 3</p><h2 id="step-h" class="section-title">Learn</h2>
            <p class="lede">Watch the first video, then work through the objectives below until you could explain each one yourself.</p></div>
          ${R.state !== 'ready' ? html`<${Loading} R=${R} />` : html`<${GM.react.Fragment}>
            <h3 class="subsec-h">Videos <span class="muted">(${vids.length})</span></h3>
            ${vids.length ? html`<div class="rgrid">${(allVids ? vids : vids.slice(0, 5)).map((r, i) => html`<${GM.VideoCard} key=${r.id} r=${r} first=${i === 0} subject=${subject} topic=${topic} sub=${sub} />`)}</div>
              ${vids.length > 5 ? html`<button type="button" class="btn btn-quiet" onClick=${() => setAllVids(!allVids)}>${allVids ? 'Show fewer videos' : 'Show all ' + vids.length + ' videos'}</button>` : null}
              <p class="small muted">Videos are in the order the topic is taught.</p>`
              : html`<p class="empty">${cov && cov.exc ? 'Key ideas have no standalone videos. ' + cov.exc : 'No video is catalogued for this subtopic yet.'}</p>`}
            ${notes.length ? html`<details class="more-notes"><summary>More revision notes (${notes.length})</summary><ul class="rlist">${notes.map((r) => html`<${GM.NoteRow} key=${r.id} r=${r} subject=${subject} topic=${topic} sub=${sub} />`)}</ul></details>` : null}
            <${GM.CoverageBanner} subjectId=${subjectId} sub=${sub} nVideos=${vids.length} nSets=${sets.length} />
          <//>`}
          <div class="know"><div class="know-head"><h3 class="subsec-h">The knowledge, objective by objective</h3>
            <span class="row-actions"><button type="button" class="btn btn-quiet" onClick=${() => { setGOpenLearn(Object.fromEntries(sub.groups.map((g) => [g.ref, true]))); }}>Open all sections</button><button type="button" class="btn btn-quiet" onClick=${() => setGOpenLearn({})}>Close all</button></span></div>
            ${sub.intro ? sub.intro.map((t, k) => html`<p class="muted" key=${k}>${t}</p>`) : null}
            
            <${Groups} mode="learn" sub=${sub} subject=${subject} topic=${topic} locked=${locked} R=${R.data} openGroups=${gOpenLearn} setOpenGroups=${setGOpenLearn} openLos=${openLos} setOpenLos=${setOpenLos} onRelearn=${relearn} /></div>
          <${StepNav} pos="end" />
        <//>` : null}

        ${step === 'practise' ? html`<${GM.react.Fragment}>
          <div class="step-intro"><p class="eyebrow">Step 2 of 3</p><h2 id="step-h" class="section-title">Practise</h2>
            <p class="lede">Try exam-style questions without looking at your notes, then check your answers against the mark scheme.</p>
            <p class="small muted">These are PDFs from other websites. Nothing is marked here: check your answers with the mark scheme, then tick “Attempted”.</p></div>
          <h3 class="subsec-h">Test yourself</h3>
          <div class="testgrid">
            <div class="testtile"><h4>Quick quiz</h4><p class="small muted">${nQ ? nQ + ' multiple-choice questions with explanations.' : 'Not written for this subtopic yet.'}</p>${nQ ? html`<${GM.Link} to=${GM.route.quiz(subjectId, subRef)} class="btn btn-primary">${S.live && S.live.kind === 'quiz' && S.live.key === subjectId + ':' + subRef ? 'Resume quiz' : 'Start quiz'}<//>` : null}</div>
            <div class="testtile"><h4>Flashcards</h4><p class="small muted">${nC ? nC + ' cards' + (cKnown ? ', ' + cKnown + ' known' : '') + '.' : 'Not written for this subtopic yet.'}</p>${nC ? html`<${GM.Link} to=${GM.route.cards(subjectId, subRef)} class="btn btn-primary">${S.live && S.live.kind === 'cards' && S.live.ref === subRef && S.live.subject === subjectId ? 'Resume flashcards' : 'Open flashcards'}<//>` : null}</div>
          </div>
          ${R.state !== 'ready' ? html`<${Loading} R=${R} />` : html`<${GM.react.Fragment}>
            <h3 class="subsec-h">Exam questions <span class="muted">(${sets.length})</span></h3>
            ${sets.length ? html`<div class="rgrid">${sets.map((r) => html`<${GM.SetCard} key=${r.id} r=${r} R=${R.data} subject=${subject} topic=${topic} sub=${sub} />`)}</div>`
              : html`<p class="empty">${cov && cov.exc ? 'Key ideas are examined through the other topics, so practise them with those topics’ question sets.' : 'No question set is counted for this subtopic yet.'}</p>`}
            ${weak.length ? html`<details class="unchecked"><summary>${weak.length} small or weak-fit set${weak.length === 1 ? '' : 's'} (not counted)</summary><div class="rgrid">${weak.map((r) => html`<${GM.SetCard} key=${r.id} r=${r} R=${R.data} subject=${subject} topic=${topic} sub=${sub} />`)}</div></details>` : null}
            <${GM.Unchecked} list=${R.data.unvSub[subRef]} />
            <p class="small muted">Want a whole exam paper? <${GM.Link} to=${GM.route.papers()}>Open the past-paper library<//>.</p>
            
            ${pracs.length || pvids.length ? html`<h3 class="subsec-h">Required practical${pracs.length === 1 ? '' : 's'} in this subtopic</h3>
              ${pracs.map((p) => html`<article class="rcard rc-prac" key=${p.n}><p class="eyebrow">Required practical ${p.n}</p><h4 class="rc-title">${p.title.charAt(0).toUpperCase() + p.title.slice(1)}</h4>
                <p class="small muted">Purpose, apparatus, method, variables, safety, results and exam knowledge.</p>
                <div class="rc-actions"><${GM.Link} to=${GM.route.practical(subjectId, p.n)} class="btn btn-primary">Open practical ${p.n}<${Icon.Arrow} size=${16} /><//></div>
                ${pvids.filter((v) => { const m = /practical\s*(\d+)/i.exec(v.t); return m && +m[1] === p.n; }).map((v) => html`<${GM.VideoCard} key=${v.id} r=${v} subject=${subject} topic=${topic} sub=${sub} />`)}
              </article>`)}
              ${looseP.length ? html`<div class="rgrid">${looseP.map((v) => html`<${GM.VideoCard} key=${v.id} r=${v} subject=${subject} topic=${topic} sub=${sub} />`)}</div>` : null}` : null}
          <//>`}
          <${StepNav} pos="end" />
        <//>` : null}

        ${step === 'check' ? html`<${GM.react.Fragment}>
          <div class="step-intro"><p class="eyebrow">Step 3 of 3</p><h2 id="step-h" class="section-title">Check your knowledge</h2>
            <p class="lede">Go through each objective and rate yourself honestly.</p>
            <p class="notebox"><${Icon.Info} size=${18} /><span><strong>Mastered</strong> means you can explain it and use it in a question you have not seen before, not that you opened a resource. If you got it wrong or have forgotten it, choose <strong>Needs revision</strong>. <strong>In progress</strong> means you are still learning it.</span></p></div>
          <div class="know-head"><p class="small"><strong>${sum.done}</strong> of ${sum.total} mastered${sum.prog ? ` · ${sum.prog} in progress` : ''}${sum.rev ? ` · ${sum.rev} need revision` : ''}${sum.due ? ` · ${sum.due} review due` : ''}</p>
            <span class="row-actions"><button type="button" class="btn btn-quiet" onClick=${() => setGOpenCheck(Object.fromEntries(sub.groups.map((g) => [g.ref, true])))}>Open all sections</button><button type="button" class="btn btn-quiet" onClick=${() => setGOpenCheck({})}>Close all</button></span></div>
          <${Groups} mode="check" sub=${sub} subject=${subject} topic=${topic} locked=${locked} R=${R.data} openGroups=${gOpenCheck} setOpenGroups=${setGOpenCheck} openLos=${openLos} setOpenLos=${setOpenLos} onRelearn=${relearn} />
          <div class="card pcard donecard">
            <h3 class="mini-h">Your progress in this subtopic</h3>
            <ul class="legend"><li><i class="lg lg-done"></i>${sum.done} mastered</li><li><i class="lg lg-prog"></i>${sum.prog} in progress</li><li><i class="lg lg-rev"></i>${sum.rev} need revision</li><li><i class="lg lg-todo"></i>${sum.todo} not started</li></ul>
            ${R.state === 'ready' ? html`<p class="small muted">Activity so far: ${nDone(vids)} of ${vids.length} videos watched · ${nDone(sets)} of ${sets.length} question sets attempted. Activity is tracked separately and does not count as mastery.</p>` : null}
            ${sum.due ? html`<p class="small">${sum.due} mastered objective${sum.due === 1 ? ' is' : 's are'} due for review (not touched for ${GM.config.reviewDays} days).</p>` : null}
          </div>
          <${StepNav} pos="end" />
          <div class="subpager">
            ${prev ? html`<${GM.Link} to=${GM.route.sub(subjectId, prev.s.ref)} class="btn btn-quiet"><${Icon.Back} size=${16} />Previous: ${prev.s.ref} ${GM.splitTitle(prev.s.title).title}<//>` : html`<span></span>`}
            ${nxt ? html`<${GM.Link} to=${GM.route.sub(subjectId, nxt.s.ref)} class=${'btn ' + (sum.total && sum.done === sum.total ? 'btn-primary btn-lg' : 'btn-quiet')}>Next subtopic: ${nxt.s.ref} ${GM.splitTitle(nxt.s.title).title}<${Icon.Arrow} size=${16} /><//>` : html`<span></span>`}
          </div>
        <//>` : null}
      </section>
    </div>`;
  };
})();
