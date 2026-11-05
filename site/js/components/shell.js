/* App shell and the overview components shared by Home, Subjects and the subject page. */
(function () {
  const { html, Icon, Bar, Sprig, LeafMark } = GM;

  GM.combined = (state) => {
    const subs = GM.data.subjects();
    const t = { done: 0, prog: 0, rev: 0, total: 0, topics: 0, topicsDone: 0 };
    subs.forEach((s) => { const x = GM.calc.summary(s, state.progress); t.done += x.done; t.prog += x.prog; t.rev += x.rev; t.total += x.total; t.topics += s.topics.length; t.topicsDone += x.topicsDone; });
    t.frac = t.total ? t.done / t.total : 0; t.todo = t.total - t.done - t.prog - t.rev;
    return t;
  };

  GM.Header = ({ route, onSearch }) => {
    const st = GM.useStore();
    const nav = [['home', 'Home', Icon.Home], ['subjects', 'Subjects', Icon.Books], ['papers', 'Papers', Icon.Doc], ['revise', 'Revise', Icon.Refresh], ['progress', 'Progress', Icon.Chart], ['preferences', 'Settings', Icon.Gear]];
    const active = route.section;
    const initials = GM.initials(st.profile.name);
    return html`<${GM.react.Fragment}>
      <header class="topbar"><div class="topbar-in">
        <${GM.Link} to="home" class="brand" aria-label="GCSE Mastery home"><${LeafMark} size=${24} /><span>GCSE Mastery</span><//>
        <nav class="topnav" aria-label="Main">
          ${nav.map(([to, label]) => html`<${GM.Link} key=${to} to=${to} class=${'topnav-link' + (active === to ? ' on' : '')} aria-current=${active === to ? 'page' : null}>${label}<//>`)}
        </nav>
        <button type="button" class="searchbtn" onClick=${onSearch} aria-label="Search (press /)"><${Icon.Search} size=${18} /><span>Search</span></button>
        <${GM.Link} to="preferences" class="avatar" aria-label="Profile and settings">${initials ? initials : html`<${Icon.User} size=${18} />`}<//>
      </div></header>
      <nav class="tabbar" aria-label="Main">
        ${nav.map(([to, label, I]) => html`<${GM.Link} key=${to} to=${to} class=${'tab' + (active === to ? ' on' : '')} aria-current=${active === to ? 'page' : null}><${I} size=${22} /><span>${label}</span><//>`)}
      </nav>
    <//>`;
  };

  /* Three pills that switch subject. Each pill wears its own colour; the page colour changes via the route (see theme.js). */
  GM.SubjectSwitch = ({ current, hrefFor }) => html`<nav class="subjswitch" aria-label="Switch subject">
    ${GM.config.subjects.map((s) => html`<${GM.Link} key=${s.id} to=${hrefFor(s.id)} data-subject=${s.id} class=${'subjswitch-btn' + (current === s.id ? ' on' : '')} aria-current=${current === s.id ? 'page' : null}><span class="dot"></span>${s.name}<//>`)}
  </nav>`;

  GM.SubjectOverview = ({ subject, headingLevel = 1 }) => {
    const st = GM.useStore();
    const sum = GM.calc.summary(subject, st.progress);
    const cfg = GM.config.subjects.find((x) => x.id === subject.id);
    const H = 'h' + headingLevel;
    return html`<section class="overview" data-subject=${cfg.id} aria-labelledby="ov-title">
      <div class="overview-main">
        <p class="eyebrow"><span class="dot"></span>AQA GCSE · Higher Tier</p>
        <${H} id="ov-title" class="page-title">${subject.name}<//>
        <div class="overview-big"><span class="big-num">${GM.calc.pct(sum)}<small>%</small></span><span class="big-cap">of the specification mastered</span></div>
        <${GM.Bar} t=${sum} label=${subject.name + ' overall progress'} size="lg" />
        <dl class="stats">
          <div><dt>Topics completed</dt><dd>${sum.topicsDone}<span> of ${subject.topics.length}</span></dd></div>
          <div><dt>Objectives mastered</dt><dd>${sum.done}<span> of ${sum.total}</span></dd></div>
          <div><dt>In progress</dt><dd>${sum.prog}</dd></div>
          <div><dt>Needs revision</dt><dd>${sum.rev}</dd></div>
        </dl>
      </div>
      <${Sprig} size=${110} class="overview-sprig" />
    </section>`;
  };

  /* The three steps of every subtopic. */
  GM.STEPS = [['learn', 'Learn'], ['practise', 'Practise'], ['check', 'Check your knowledge']];
  GM.stepFor = (section) => (section === 'practise' || section === 'practicals' ? 'practise' : section === 'learn' ? 'learn' : 'check');

  const WHY = {
    review: (x) => `You flagged ${x.pick.t.rev} objective${x.pick.t.rev === 1 ? '' : 's'} here as needing revision.`,
    resume: () => 'You were last working here.',
    start: (x) => `The next unfinished subtopic in ${GM.splitTitle(x.topic.title).title}.`,
    due: () => `You mastered this more than ${GM.config.reviewDays} days ago. A quick review keeps it fresh.`,
  };
  const linkFor = (subject, act) => (act.section === 'check' && act.objective && (act.kind === 'review' || act.kind === 'due') ? GM.route.lo(act.objective.lo.id) : GM.route.sub(subject.id, act.sub.ref, act.section));

  /* Home: the one thing to do next, across all three sciences. */
  GM.ContinueCard = ({ act: first }) => {
    const st = GM.useStore();
    const R = GM.useResources(first.subject.id); // so a suggested video or question set can be named once the resources have loaded
    const act = GM.calc.globalAction(st) || first; const fresh = act.fresh; // recomputed here so it picks up the resources when they arrive
    const sub = act.sub; const t = GM.splitTitle(sub.title).title; const tl = act.pick.t;
    const step = GM.stepFor(act.section);
    const ready = R.state !== 'loading';
    const what = ready ? (act.resource ? act.verb + ': ' + act.resource.t.replace(/^Cognito: /, '') : act.objective ? act.verb + ': ' + act.objective.lo.t : '') : '';
    const to = linkFor(act.subject, act);
    const started = !fresh && act.kind !== 'start';
    return html`<section class="continue" data-subject=${act.subject.id} aria-labelledby="cont-h">
      <div class="continue-main">
        <p class="eyebrow" id="cont-h">${started ? 'Continue learning' : 'Start learning'}</p>
        <p class="continue-where"><span class="dot"></span>${act.subject.name} · Topic ${act.topic.ref} ${GM.splitTitle(act.topic.title).title} · ${sub.ref}</p>
        <h2 class="continue-title">${t}</h2>
        <div class="continue-prog"><${GM.Bar} t=${tl} label=${t + ' progress'} /><span class="muted small">${tl.done} of ${tl.total} objectives mastered</span></div>
        <ol class="mini-steps" aria-label="Where you are in this subtopic">${GM.STEPS.map(([k, l], i) => html`<li key=${k} class=${k === step ? 'on' : ''}><span class="mini-n">${i + 1}</span>${l}</li>`)}</ol>
        <p class="continue-next">${what ? html`<strong>Next:</strong> ${what}` : ready ? '' : html`<span class="muted">Finding your next step…</span>`}</p>
        <p class="muted small">${WHY[act.kind](act)}</p>
        <div class="continue-actions"><${GM.Link} to=${to} class="btn btn-primary btn-lg">${started ? 'Continue learning' : fresh ? 'Start learning' : 'Start this subtopic'}<${Icon.Arrow} size=${18} /><//></div>
      </div>
    </section>`;
  };

  /* Subject page: a smaller version of the same idea, for that subject only. */
  GM.NextStep = ({ subject }) => {
    const st = GM.useStore();
    GM.useResources(subject.id);
    const act = GM.calc.nextAction(subject, st);
    let body;
    if (!act) {
      body = html`<h2 class="panel-title">Every topic is mastered.</h2><p class="panel-text">You have mastered all ${GM.calc.summary(subject, st.progress).total} objectives in ${subject.name}. Review any topic to keep it fresh, or move on to another science.</p>
        <${GM.Link} to=${GM.route.subjects()} class="btn btn-primary">Choose another subject<${Icon.Arrow} size=${18} /><//>`;
    } else {
      const t = GM.splitTitle(act.sub.title).title;
      const head = { review: 'Review ' + t, resume: 'Continue ' + t, start: 'Start ' + t, due: 'Refresh ' + t }[act.kind];
      const what = act.resource ? act.verb + ': ' + act.resource.t.replace(/^Cognito: /, '') : act.objective ? act.verb + ': ' + act.objective.lo.t : '';
      body = html`<h2 class="panel-title">${head}.</h2>
        <p class="panel-text"><span class="muted">${act.sub.ref} · ${WHY[act.kind](act)}</span>${what ? html`<br />${what}` : null}</p>
        <${GM.Link} to=${linkFor(subject, act)} class="btn btn-primary btn-lg">${act.kind === 'start' ? 'Start learning' : 'Continue learning'}<${Icon.Arrow} size=${18} /><//>`;
    }
    return html`<section class="nextstep" aria-labelledby="next-h"><p class="eyebrow" id="next-h">Your next step in ${subject.name}</p>${body}</section>`;
  };

  /* A subject card: its own colour, overall progress and one way in. Used on Home and Subjects. */
  GM.SubjectCard = ({ subject, current }) => {
    const st = GM.useStore();
    const x = GM.calc.summary(subject, st.progress); const cfg = GM.config.subjects.find((q) => q.id === subject.id);
    const inProgress = x.topics.filter((t) => t.total && t.done < t.total && t.done + t.prog + t.rev > 0).length;
    const started = x.done + x.prog + x.rev > 0;
    return html`<article class=${'subjcard' + (current ? ' is-current' : '')} data-subject=${subject.id}>
      <p class="eyebrow">AQA ${cfg.spec} · Higher Tier</p>
      <h3 class="subjcard-title"><${GM.Link} to=${GM.route.subject(subject.id)}>${subject.name}<//></h3>
      <div class="subjcard-pct">${GM.calc.pct(x)}<small>%</small></div>
      <${GM.Bar} t=${x} label=${subject.name + ' progress'} />
      <p class="subjcard-count">${x.topicsDone} of ${subject.topics.length} topics completed${inProgress ? ` · ${inProgress} in progress` : ''}</p>
      <div class="row-actions"><${GM.Link} to=${GM.route.subject(subject.id)} class="btn btn-primary">${started ? 'Open ' : 'Start '}${subject.name}<${Icon.Arrow} size=${16} /><//></div>
    </article>`;
  };

  /* Recently studied, needs revision and (on Home) up next, taken from real activity. */
  GM.StudyLists = ({ upNext }) => {
    const st = GM.useStore(); const subs = GM.data.subjects();
    const recent = GM.calc.recentSubtopics(subs, st, 4); const rev = GM.calc.revisionSubtopics(subs, st).slice(0, 5);
    const Row = ({ x, note }) => html`<li><${GM.Link} to=${GM.route.sub(x.subject.id, x.sub.ref)} class="subrow" data-subject=${x.subject.id}><span class="subrow-main"><span class="subrow-line"><span class=${'sdot2 st-' + x.state} aria-hidden="true"></span><span class="ref">${x.subject.name.slice(0, 3)} ${x.sub.ref}</span><span class="subrow-title">${GM.splitTitle(x.sub.title).title}</span></span></span>
      <span class="subrow-pct muted">${note}</span><${GM.Bar} t=${x.t} label=${x.sub.title + ' progress'} size="xs" /><//></li>`;
    const ago = (ts) => { const d = Math.floor((Date.now() - ts) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
    return html`<div class=${'studylists' + (upNext ? ' three' : '')}>
      <section class="card" aria-labelledby="rs-h"><h2 id="rs-h" class="section-title">Recently studied</h2>
        ${recent.length ? html`<ul class="subrows">${recent.map((x) => html`<${Row} key=${x.key} x=${x} note=${ago(x.last)} />`)}</ul>` : html`<p class="muted small">Nothing yet. Open a subtopic and mark an objective or a resource, and it will appear here.</p>`}</section>
      <section class="card" aria-labelledby="nr-h"><h2 id="nr-h" class="section-title">Needs revision</h2>
        ${rev.length ? html`<ul class="subrows">${rev.map((x) => html`<${Row} key=${x.key} x=${x} note=${[x.t.rev ? x.t.rev + ' flagged' : '', x.t.due ? x.t.due + ' due for review' : ''].filter(Boolean).join(' · ')} />`)}</ul>` : html`<p class="muted small">Nothing to revise. Objectives you flag as “Needs revision”, and mastered objectives untouched for ${GM.config.reviewDays} days, will show here.</p>`}</section>
      ${upNext ? html`<section class="card" aria-labelledby="un-h"><h2 id="un-h" class="section-title">Up next</h2>
        ${upNext.list.length ? html`<ul class="subrows">${upNext.list.map((x) => html`<${Row} key=${x.key} x=${x} note=${x.state === 'notstarted' ? 'not started' : 'in progress'} />`)}</ul>` : html`<p class="muted small">Nothing else is waiting. Every unlocked subtopic is complete.</p>`}
        <${GM.Link} to=${GM.route.pathway(upNext.subject.id)} class="textlink">See the full ${upNext.subject.name} learning pathway<${Icon.Arrow} size=${14} /><//></section>` : null}
    </div>`;
  };

  GM.HomePage = () => {
    const st = GM.useStore();
    const act = GM.calc.globalAction(st);
    const subs = GM.data.subjects();
    const focus = act ? act.subject : (GM.data.subject(st.settings.subject) || subs[0]);
    const upNext = { subject: focus, list: GM.calc.upcoming(focus, st, act ? act.sub.ref : null, 3) };
    return html`<div class="page home">
      <div class="home-hello"><p class="eyebrow">${st.profile.name ? 'Welcome back, ' + st.profile.name : 'Welcome'}</p><h1 class="visually-hidden">Home</h1></div>
      ${(() => {
        const L = st.live; const last = st.last;
        if (L && GM.data.subject(L.subject)) {
          const what = L.kind === 'quiz' ? 'quiz (question ' + Math.min(L.i + 1, L.order.length) + ' of ' + L.order.length + ')' : 'flashcards (card ' + Math.min(L.i + 1, L.order.length) + ' of ' + L.order.length + ')';
          const to = L.kind === 'quiz' ? (L.ref ? GM.route.quiz(L.subject, L.ref) : GM.route.topicQuiz(L.subject, L.topic)) : GM.route.cards(L.subject, L.ref);
          return html`<aside class="resume" aria-label="Resume"><span>You left a ${what} unfinished.</span><${GM.Link} to=${to} class="btn btn-quiet">Resume<//></aside>`;
        }
        if (last && last.ref && GM.data.subtopic(last.subject, last.ref)) {
          const h = GM.data.subtopic(last.subject, last.ref); const step = { learn: 'learn', practise: 'practise', check: 'check', cards: 'practise', quiz: 'practise' }[last.mode] || 'learn';
          return html`<aside class="resume" aria-label="Last activity"><span>Last time: ${GM.data.subject(last.subject).name} ${last.ref} ${GM.splitTitle(h.sub.title).title} (${{ learn: 'Learn', practise: 'Practise', check: 'Check', cards: 'Flashcards', quiz: 'Quiz' }[last.mode] || 'Learn'})</span><${GM.Link} to=${GM.route.sub(last.subject, last.ref, step)} class="btn btn-quiet">Go back<//></aside>`;
        }
        return null;
      })()}
      ${act ? html`<${GM.ContinueCard} act=${act} />` : html`<section class="continue" data-subject=${focus.id}><div class="continue-main"><p class="eyebrow">All done</p><h2 class="continue-title">Every subtopic is mastered.</h2><p class="muted">Review any topic to keep it fresh.</p><div class="continue-actions"><${GM.Link} to=${GM.route.subjects()} class="btn btn-primary btn-lg">Browse subjects<//></div></div></section>`}
      <section aria-labelledby="hs-h"><h2 id="hs-h" class="section-title">Your subjects</h2>
        <div class="subj-grid">${subs.map((s) => html`<${GM.SubjectCard} key=${s.id} subject=${s} current=${act && act.subject.id === s.id} />`)}</div></section>
      <${GM.StudyLists} upNext=${upNext} />
    </div>`;
  };

  GM.SubjectsPage = () => {
    const st = GM.useStore();
    const c = GM.combined(st);
    return html`<div class="page">
      <p class="eyebrow">AQA GCSE · Triple Science · Higher Tier</p><h1 class="page-title">Subjects</h1>
      <p class="lede">${c.done} of ${c.total} objectives mastered across all three sciences (${GM.calc.pct(c)}%).</p>
      <div class="subj-grid">${GM.data.subjects().map((s) => html`<${GM.SubjectCard} key=${s.id} subject=${s} />`)}</div></div>`;
  };

  /* Subject curriculum: expandable topics with their subtopics, progress and resource coverage beneath. */
  GM.Curriculum = ({ subject }) => {
    const st = GM.useStore();
    const pw = GM.calc.pathway(subject, st); const acts = GM.calc.activity(st.resDone);
    const cur = pw.current ? pw.current.topic.id : subject.topics[0].id;
    const [open, setOpen] = GM.react.useState(() => ({ [cur]: true }));
    const allOpen = subject.topics.every((t) => open[t.id]);
    return html`<section aria-labelledby="cur-h">
      <div class="cur-head"><h2 id="cur-h" class="section-title">Topics and subtopics</h2>
        <button type="button" class="btn btn-quiet" onClick=${() => setOpen(allOpen ? {} : Object.fromEntries(subject.topics.map((t) => [t.id, true])))}>${allOpen ? 'Collapse all' : 'Expand all'}</button></div>
      <p class="lede">${subject.topics.length} topics, ${subject.topics.reduce((a, t) => a + t.subtopics.length, 0)} subtopics, ${subject.loIds.length} learning objectives. Open a subtopic to learn it.</p>
      <ul class="ctopics">${pw.nodes.map((n) => {
        const t = n.topic; const tt = GM.splitTitle(t.title); const isOpen = !!open[t.id]; const pid = 'ct-' + t.id.replace(/\./g, '-');
        return html`<li key=${t.id} class=${'ctopic' + (isOpen ? ' open' : '')}>
          <h3 class="ctopic-h"><button type="button" class="ctopic-btn" aria-expanded=${isOpen} aria-controls=${pid} onClick=${() => setOpen((o) => Object.assign({}, o, { [t.id]: !o[t.id] }))}>
            <span class="ctopic-main"><span class="ref">${t.ref}</span><span class="ctopic-title">${tt.title}</span><${GM.Badges} list=${tt.badges} />${n.state === 'current' ? html`<span class="state state-current">Recommended</span>` : n.state === 'locked' ? html`<${Icon.Lock} size=${15} />` : null}</span>
            <span class="ctopic-side"><span class="sub-pct">${GM.calc.pctLabel(n.sum)}</span><span class="sub-count">${n.sum.done}/${n.sum.total}</span><${Icon.Chevron} size=${20} class=${isOpen ? 'flip' : ''} /></span>
            <${GM.Bar} t=${n.sum} label=${tt.title + ' progress'} size="sm" /></button></h3>
          ${isOpen ? html`<div id=${pid} class="ctopic-body"><ul class="subrows">${t.subtopics.map((sub, i) => html`<li key=${sub.ref}><${GM.SubRow} subject=${subject} topic=${t} sub=${sub} tally=${n.sum.subtopics[i]} acts=${acts[subject.id + ':' + sub.ref] || 0} /></li>`)}</ul>
            <p class="ctopic-foot"><${GM.Link} to=${GM.route.topic(subject.id, t.id)} class="btn btn-quiet">Topic overview<${Icon.Arrow} size=${15} /><//></p></div>` : null}
        </li>`; })}</ul></section>`;
  };

  /* Subject page. Topics are the main thing; the pathway and reference pages sit underneath as secondary links. */
  const SUB_PAGES = [['pathway', 'Learning pathway', 'See the topics as a winding path with locked and unlocked stages.', GM.route.pathway, Icon.Flag],
    ['practicals', 'Required practicals', null, GM.route.practicals, Icon.Flask],
    ['maths', 'Maths skills', 'Every maths skill the specification can examine, with where to apply it.', GM.route.maths, Icon.Sigma],
    ['skills', 'Working scientifically', 'Working scientifically and apparatus techniques.', GM.route.skills, Icon.Books]];

  GM.SubjectPage = ({ id, tab }) => {
    const subject = GM.data.subject(id);
    if (!subject) return html`<div class="page"><${GM.Empty}>That subject does not exist.<//></div>`;
    const here = SUB_PAGES.find((p) => p[0] === tab);
    const hrefFor = (sid) => (here ? here[3](sid) : GM.route.subject(sid));
    const switcher = html`<${GM.SubjectSwitch} current=${id} hrefFor=${hrefFor} />`;
    if (here) {
      return html`<div class="page">
        <div class="page-head"><${GM.Crumbs} items=${[['Subjects', GM.route.subjects()], [subject.name, GM.route.subject(id)], [here[1]]]} />${switcher}</div>
        ${tab === 'pathway' ? html`<section><h1 class="page-title">${subject.name} learning pathway</h1><p class="lede">The same topics as the list, laid out in order. In guided mode a topic opens once half of the one before is mastered.</p><${GM.Pathway} subject=${subject} /></section>`
          : tab === 'practicals' ? html`<${GM.PracticalList} subject=${subject} />` : tab === 'skills' ? html`<${GM.SkillsPage} subject=${subject} />` : html`<${GM.MathsPage} subject=${subject} />`}
      </div>`;
    }
    return html`<div class="page">
      <div class="page-head"><${GM.Crumbs} items=${[['Subjects', GM.route.subjects()], [subject.name]]} />${switcher}</div>
      <div class="home-grid"><${GM.SubjectOverview} subject=${subject} /><${GM.NextStep} subject=${subject} /></div>
      <${GM.Curriculum} subject=${subject} />
      <section class="more" aria-labelledby="more-h"><h2 id="more-h" class="section-title">More in ${subject.name}</h2>
        <ul class="more-grid">${SUB_PAGES.map(([k, l, d, route, I]) => html`<li key=${k}><${GM.Link} to=${route(id)} class="morecard"><${I} size=${22} /><span><strong>${l}</strong><span class="muted small">${k === 'practicals' ? subject.practicals.length + ' required practical activities, each with method, variables and safety.' : d}</span></span><${Icon.ChevronRight} size=${18} /><//></li>`)}</ul></section>
    </div>`;
  };

  GM.Crumbs = ({ items }) => html`<nav class="crumbs" aria-label="Breadcrumb"><ol>
    ${items.map(([label, to], i) => html`<li key=${i}>${to ? html`<${GM.Link} to=${to}>${label}<//>` : html`<span aria-current="page">${label}</span>`}</li>`)}
  </ol></nav>`;
})();
