/* Required practicals and maths skills (reference material from the curriculum documents). */
(function () {
  const { html, Icon } = GM;

  GM.PracticalList = ({ subject }) => html`<section aria-labelledby="pl-h">
    <h2 id="pl-h" class="section-title">Required practicals</h2>
    <p class="lede">${subject.practicals.length} required practical activities in AQA ${subject.name}. Each page covers purpose, apparatus, method, variables, safety, expected results, analysis, errors and exam knowledge.</p>
    <ul class="prac-grid">${subject.practicals.map((p) => html`<li key=${p.n} class="praccard">
      <p class="eyebrow">Required practical ${p.n}</p>
      <h3 class="praccard-title"><${GM.Link} to=${GM.route.practical(subject.id, p.n)}>${cap(p.title)}<//></h3>
      <p class="muted small">${(p.at || []).map((a) => a.split(' – ')[0]).join(' · ')}</p>
      <${GM.Link} to=${GM.route.practical(subject.id, p.n)} class="btn btn-quiet">Open practical<${Icon.Arrow} size=${16} /><//>
    </li>`)}</ul></section>`;

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const List = ({ items, ordered }) => html`<${ordered ? 'ol' : 'ul'} class="plist">${items.map((t, i) => html`<li key=${i}>${t}</li>`)}<//>`;

  GM.PracticalPage = ({ subjectId, n }) => {
    const subject = GM.data.subject(subjectId); const p = subject && subject.practicals.find((x) => x.n === n);
    const R = GM.useResources(subjectId);
    if (!p) return html`<div class="page"><${GM.Empty}>That practical could not be found.<//></div>`;
    const f = p.fields || {}; const w = p.where;
    const Sec = ({ title, k, ordered, kind }) => (f[k] && f[k].length ? html`<section class=${'psec' + (kind ? ' ' + kind : '')}><h3 class="psec-h">${title}</h3>${f[k].length === 1 && k !== 'METHOD' && k !== 'APPARATUS' ? html`<p>${f[k][0]}</p>` : html`<${List} items=${f[k]} ordered=${ordered} />`}</section>` : null);
    return html`<div class="page prac-page">
      <${GM.Crumbs} items=${[['Subjects', GM.route.subjects()], [subject.name, GM.route.subject(subjectId)], ['Required practicals', GM.route.practicals(subjectId)], ['Practical ' + p.n]]} />
      <p class="eyebrow">${subject.name} · Required practical ${p.n}</p>
      <h1 class="page-title">${cap(p.title)}</h1>
      <div class="notebox"><${Icon.Info} size=${18} /><p>The specification states the aim and the skills assessed. The method, expected results and error analysis below are study aids written for this platform, not specification text.</p></div>
      <details class="specquote"><summary>What the specification says</summary>
        ${p.stmt.map((t, i) => html`<blockquote key=${i}><p>${t}</p></blockquote>`)}
        ${p.at.length ? html`<h4 class="mini-h">Apparatus and techniques (AT)</h4><${List} items=${p.at} />` : null}
        ${p.skills.length ? html`<h4 class="mini-h">Working scientifically and maths skills</h4><${List} items=${p.skills} />` : null}
      </details>
      ${w ? html`<p class="small">Sits in the content at <${GM.Link} to=${GM.route.lo(w.lo)}>${w.ref}<//>. <${GM.Link} to=${GM.route.sub(subjectId, w.sub, 'learn')}>Open subtopic ${w.sub}<//></p>` : null}
      ${(() => {
        const hit = w && GM.data.subtopic(subjectId, w.sub); if (!hit) return null;
        const vids = R.data ? (R.data.bySub[w.sub] || []).filter((r) => r.cat === 'practical' && (() => { const m = /practical\s*(\d+)/i.exec(r.t); return m && +m[1] === n; })()) : [];
        return html`<section class="psec" aria-label="Videos for this practical"><h3 class="psec-h">Video for this practical</h3>
          ${R.state === 'error' ? html`<p class="muted small">The resource list could not be loaded.</p>` : R.state !== 'ready' ? html`<p class="muted small">Loading…</p>`
            : vids.length ? html`<div class="rgrid">${vids.map((v) => html`<${GM.VideoCard} key=${v.id} r=${v} subject=${subject} topic=${hit.topic} sub=${hit.sub} />`)}</div>` : html`<p class="muted small">No video is catalogued for this practical.</p>`}</section>`;
      })()}
      <${Sec} title="Purpose" k="PURPOSE" /><${Sec} title="Apparatus and materials" k="APPARATUS" /><${Sec} title="Method" k="METHOD" ordered=${true} />
      <section class="psec"><h3 class="psec-h">Variables</h3><dl class="vars">
        ${[['Independent', 'IV'], ['Dependent', 'DV'], ['Control', 'CV']].map(([l, k]) => f[k] && f[k].length ? html`<div key=${k}><dt>${l}</dt><dd>${f[k].length === 1 ? f[k][0] : html`<${List} items=${f[k]} />`}</dd></div>` : null)}</dl></section>
      <${Sec} title="Safety" k="SAFETY" kind="safety" /><${Sec} title="Expected observations and results" k="RESULTS" />
      <${Sec} title="Analysis and calculations" k="ANALYSIS" /><${Sec} title="Sources of error and improvements" k="ERRORS" /><${Sec} title="Exam knowledge" k="EXAM" />
      <div class="row-actions"><${GM.Link} to=${GM.route.practicals(subjectId)} class="btn btn-quiet"><${Icon.Back} size=${16} />All practicals<//></div>
    </div>`;
  };

  GM.SkillsPage = ({ subject }) => html`<section aria-labelledby="sk-h">
    <h2 id="sk-h" class="section-title">Working scientifically and apparatus</h2>
    <p class="lede">The ${subject.ws.length} working scientifically skills and ${subject.at.length} apparatus and techniques requirements from the AQA ${subject.name} specification. These are assessed through the required practicals and across the papers.</p>
    <div class="msec"><h3 class="msec-h">Working scientifically (WS)</h3>
      <ul class="mlist">${subject.ws.map((w) => html`<li key=${w.code}><div class="mrow"><span class="ref">${w.code}</span><span class="mtext">${w.text}</span></div>
        ${w.ex && w.ex.length ? html`<ul class="plist small">${w.ex.map((a, i) => html`<li key=${i}>${a}</li>`)}</ul>` : null}</li>`)}</ul></div>
    <div class="msec"><h3 class="msec-h">Apparatus and techniques (AT)</h3>
      <ul class="mlist">${subject.at.map(([code, text]) => html`<li key=${code}><div class="mrow"><span class="ref">${code}</span><span class="mtext">${text}</span></div></li>`)}</ul></div>
  </section>`;

  GM.MathsPage = ({ subject }) => {
    const m = subject.maths;
    const pretty = (k) => k.charAt(0) + k.slice(1).toLowerCase();
    return html`<section aria-labelledby="mp-h">
      <h2 id="mp-h" class="section-title">Maths skills</h2>
      <p class="lede">${m.intro}</p>
      ${m.secs.map((s) => html`<div class="msec" key=${s.n}><h3 class="msec-h">${s.n}. ${s.title}</h3>
        <ul class="mlist">${s.items.map((it) => html`<li key=${it.code} id=${'ms-' + it.code.replace(' ', '-')}><div class="mrow"><span class="ref">${it.code}</span><span class="mtext">${it.text}</span></div>
          ${it.apply.length ? html`<ul class="plist small">${it.apply.map((a, i) => html`<li key=${i}>${a}</li>`)}</ul>` : null}</li>`)}</ul></div>`)}
      ${m.calcs.length ? html`<div class="msec"><h3 class="msec-h">Subject calculations</h3><${List} items=${m.calcs} /></div>` : null}
      ${Object.keys(m.notes).map((k) => html`<div class="msec" key=${k}><h3 class="msec-h">${pretty(k)}</h3><${List} items=${m.notes[k]} /></div>`)}
    </section>`;
  };
})();
