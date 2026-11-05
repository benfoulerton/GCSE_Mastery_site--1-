/* Topic page: the subtopics of one topic, each linking to its learning page. */
(function () {
  const { html, Icon, Bar, Badges } = GM;

  GM.SubRow = ({ subject, topic, sub, tally, acts, big }) => {
    const sp = GM.splitTitle(sub.title); const cov = GM.data.coverage(subject.id, sub.ref);
    const state = GM.calc.subState(tally, acts);
    return html`<${GM.Link} to=${GM.route.sub(subject.id, sub.ref)} class=${'subrow' + (big ? ' subrow-big' : '')}>
      <span class="subrow-main"><span class="subrow-line"><span class=${'sdot2 st-' + state} aria-hidden="true"></span><span class="ref">${sub.ref}</span><span class="subrow-title">${sp.title}</span><${Badges} list=${sp.badges} /></span>
        <span class="subrow-chips"><${GM.StateChip} state=${state} />${cov && !cov.exc ? html`<span class="muted small">${cov.v} video${cov.v === 1 ? "" : "s"} · ${cov.pq} practice set${cov.pq === 1 ? "" : "s"}</span>` : null}</span></span>
      <span class="subrow-pct">${GM.calc.pctLabel(tally)} <span class="muted">(${tally.done}/${tally.total})</span></span>
      <${Bar} t=${tally} label=${sp.title + ' progress'} size="xs" />
    <//>`;
  };

  GM.TopicPage = ({ subjectId, topicId }) => {
    const st = GM.useStore();
    const subject = GM.data.subject(subjectId); const topic = GM.data.topic(subjectId, topicId);
    if (!topic) return html`<div class="page"><${GM.Empty}>That topic could not be found.<//></div>`;
    const R = GM.useResources(subjectId);
    const SD = GM.useStudy(); const tq = SD ? topic.subtopics.reduce((n, s) => n + (SD.qsBySub[subjectId + ':' + s.ref] || []).length, 0) : 0;
    const pw = GM.calc.pathway(subject, st);
    const node = pw.nodes.find((n) => n.topic.id === topicId);
    const locked = node.state === 'locked'; const sum = node.sum;
    const acts = GM.calc.activity(st.resDone);
    const { title, badges } = GM.splitTitle(topic.title);
    const cfg = GM.config.subjects.find((s) => s.id === subjectId);
    const unv = R.data ? (R.data.unvTopic[topic.id] || []) : [];
    return html`<div class="page">
      <${GM.Crumbs} items=${[['Subjects', GM.route.subjects()], [subject.name, GM.route.subject(subjectId)], ['Topic ' + topic.ref]]} />
      <header class="topic-head">
        <div><p class="eyebrow"><span class="dot"></span>${subject.name} · Topic ${topic.ref} <${Badges} list=${badges} /></p><h1 class="page-title">${title}</h1></div>
        <div class="topic-prog"><span class="big-num sm">${GM.calc.pct(sum)}<small>%</small></span>
          <${Bar} t=${sum} label=${title + ' progress'} /><p class="muted small">${sum.done} of ${sum.total} objectives mastered${sum.prog ? ` · ${sum.prog} in progress` : ''}${sum.rev ? ` · ${sum.rev} need revision` : ''}</p></div>
      </header>
      ${locked ? html`<div class="lockbanner" role="status"><${Icon.Lock} size=${20} /><div><strong>This topic is suggested for later.</strong> You can learn it now. Start it to track your progress.</div>
        <button type="button" class="btn btn-primary" onClick=${() => GM.store.unlockTopic(subjectId, topicId)}>Start this topic</button></div>` : null}
      ${topic.overview ? html`<details class="overview-spec"><summary>Official topic introduction from the specification</summary>${topic.overview.map((t, i) => html`<p key=${i}>${t}</p>`)}</details>` : null}
      ${tq ? html`<p><${GM.Link} to=${GM.route.topicQuiz(subjectId, topicId)} class="btn btn-quiet">Topic quiz (${tq} questions across this topic)<//></p>` : null}
      <h2 class="section-title">Subtopics</h2>
      <ul class="subrows">${topic.subtopics.map((sub, i) => html`<li key=${sub.ref}><${GM.SubRow} subject=${subject} topic=${topic} sub=${sub} tally=${sum.subtopics[i]} acts=${acts[subjectId + ':' + sub.ref] || 0} big=${true} /></li>`)}</ul>
      ${unv.length ? html`<${GM.Unchecked} list=${unv} />` : null}
    </div>`;
  };
})();
