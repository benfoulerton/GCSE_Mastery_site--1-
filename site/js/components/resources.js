/* Resource components: video and note cards, question-set cards, coverage banner. All data comes from data/res-*.json and data/coverage.json. */
(function () {
  const { html, Icon } = GM; const { useState } = GM.react;
  const validUrl = (u) => /^https?:\/\/[^\s]+$/i.test(u || '');
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const BASIS = {
    title: 'Matched to objectives from the video title only. The video has not been watched or checked.',
    heading: "Matched to objectives from the lesson page's headings.",
    'subtopic-level': 'Covers the subtopic as a whole; not split by individual objective.',
    'question-level': 'Questions were matched to this subtopic one by one.',
  };

  /* Open the original resource in a new tab. A missing or malformed address shows a disabled button instead of a broken link. */
  GM.ExtLink = ({ href, children, primary, label }) => validUrl(href)
    ? html`<a class=${'btn ' + (primary ? 'btn-primary' : 'btn-quiet')} href=${href} target="_blank" rel="noopener noreferrer" aria-label=${label || null}>${children}<${Icon.External} size=${15} /></a>`
    : html`<span class="btn btn-quiet is-off" role="note">Link unavailable</span>`;

  GM.DoneToggle = ({ r, subjectId, topicId, subRef, verb }) => {
    const st = GM.useStore(); const on = !!st.resDone[r.id];
    return html`<label class=${'donebox' + (on ? ' on' : '')}><input type="checkbox" checked=${on} onChange=${(e) => GM.store.setResourceDone(subjectId, topicId, subRef, r.id, e.target.checked)} />
      <span>${on ? verb[1] : verb[0]}</span></label>`;
  };

  const costText = (r) => (r.free === 'paid' ? 'Paid' : r.acct === 'no' ? 'Free, no account' : r.acct === 'unconfirmed' ? 'Free to view (sign-in not confirmed)' : 'Free');

  /* Which objectives a resource covers, with their wording, collapsed by default. */
  const Covers = ({ r, subject, sub }) => {
    const ids = r.los || [];
    if (!ids.length) return html`<p class="muted small">${r.cov && r.cov.lvl === 'part of subtopic' && r.cov.marks ? '' : (BASIS[r.basis] || '')}</p>`;
    return html`<details class="covers"><summary>Covers ${ids.length} of ${sub.loIds.length} objectives in this subtopic</summary>
      <ul>${ids.map((id) => { const hit = subject.loIndex[id]; return html`<li key=${id}><${GM.Link} to=${GM.route.lo(id)}><span class="ref">${hit ? hit.group.ref : ''}</span> ${hit ? hit.lo.t : id}<//></li>`; })}</ul>
      <p class="muted small">${BASIS[r.basis] || ''}</p></details>`;
  };

  const About = ({ r }) => html`<details class="about"><summary>What was checked</summary>
    ${r.why ? html`<p class="small">${r.why}</p>` : null}${r.vn ? html`<p class="small muted">${r.vn}</p>` : null}
    <p class="small muted">Checked ${r.on || 'on 5 Nov 2026'}${r.verOrig ? ' · earlier status: ' + r.verOrig.replace(/_/g, ' ') : ''}</p></details>`;

  const minsOf = (r) => r.mins || ((/\((\d+) min stated/.exec(r.why || '') || [])[1] ? +(/\((\d+) min stated/.exec(r.why)[1]) : 0);
  const provName = (r) => r.p.replace(' (YouTube)', '').replace(' (alugha)', '');

  /* A video is a title, where it is from, how long it is, and one Watch button. Everything else is behind "Details". */
  GM.VideoCard = ({ r, subject, topic, sub, first }) => {
    const m = minsOf(r); const cognito = r.p === 'Cognito';
    return html`<article class=${'rcard rc-video' + (first ? ' rc-first' : '')} aria-label=${'Video: ' + r.t}>
      <div class="rc-top">${first ? html`<p class="rc-start">Start here</p>` : html`<span></span>`}<${GM.BookmarkButton} id=${r.id} type="Video" title=${r.t.replace(/^Cognito: /, '') + ' (' + sub.ref + ')'} href=${GM.route.sub(subject.id, sub.ref, 'learn')} subject=${subject.id} /></div>
      <h4 class="rc-title">${r.t.replace(/^Cognito: /, '')}</h4>
      <p class="rc-meta">${provName(r)}${m ? ' · ' + m + ' min' : ''}</p>
      <div class="rc-actions">
        <${GM.ExtLink} href=${r.u} primary=${true} label=${'Watch: ' + r.t}>Watch<//>
        <${GM.DoneToggle} r=${r} subjectId=${subject.id} topicId=${topic.id} subRef=${sub.ref} verb=${['Mark as watched', 'Watched']} />
      </div>
      <details class="rc-details"><summary>Details</summary>
        <p class="small">Opens ${cognito ? 'on Cognito' : 'on ' + host(r.u)} in a new tab.${cognito ? ' Cognito limits how many lessons you can open for free each week, and may ask you to sign in.' : ''}</p>
        <${Covers} r=${r} subject=${subject} sub=${sub} />
        ${r.why ? html`<p class="small muted">${r.why}</p>` : null}
        <p class="small muted">${r.vn || ''}</p>
      </details>
    </article>`;
  };

  /* Written notes from non-Cognito sources, kept small and out of the way. */
  GM.NoteRow = ({ r, subject, topic, sub }) => html`<li class="rrow" aria-label=${'Revision notes: ' + r.t}>
    <div class="rrow-main"><span class="rrow-title">${r.t}</span><span class="muted small">${provName(r)}</span></div>
    <div class="rc-actions"><${GM.ExtLink} href=${r.u}>Open<//><${GM.DoneToggle} r=${r} subjectId=${subject.id} topicId=${topic.id} subRef=${sub.ref} verb=${['Mark as read', 'Read']} /></div></li>`;

  /* An exam-question set (PDF) and its mark scheme, kept together as one resource. */
  GM.SetCard = ({ r, R, subject, topic, sub }) => {
    const ms = r.ms && R.byId[r.ms];
    const c = r.cov || {};
    const part = c.lvl === 'part of subtopic';
    return html`<article class=${'rcard rc-set' + (r.weak ? ' weak' : '')} aria-label=${'Practice questions: ' + r.t}>
      <div class="rc-top"><p class="rc-prov-line">${r.p}</p><${GM.BookmarkButton} id=${r.id} type="Practice paper" title=${r.t + ' (' + sub.ref + ')'} href=${GM.route.sub(subject.id, sub.ref, 'practise')} subject=${subject.id} /></div>
      <h4 class="rc-title">${r.t.replace(/^PMT topic questions: /, '')}</h4>
      <p class="rc-meta">Subtopic ${sub.ref}${r.tier ? ' · ' + r.tier : ''}${c.marks ? ' · about ' + c.marks + ' marks on this subtopic' : ''}${part ? ' · covers only part of it' : ''}</p>
      <ul class="pair">
        <li><span class="pair-type">Questions</span><${GM.ExtLink} href=${r.u} primary=${true}>Open PDF<//></li>
        <li><span class="pair-type ms">Mark scheme</span>${ms ? html`<${GM.ExtLink} href=${ms.u}>Open PDF<//>` : html`<span class="small muted">Not linked</span>`}</li>
      </ul>
      <div class="rc-actions"><${GM.DoneToggle} r=${r} subjectId=${subject.id} topicId=${topic.id} subRef=${sub.ref} verb=${['Mark as attempted', 'Attempted']} /></div>
      <details class="rc-details"><summary>Details</summary>
        <p class="small">${c.det || 'Not split by individual objective.'}</p>
        ${r.weak ? html`<p class="weaknote small">Small or weak fit for this subtopic, so it is not counted as practice.</p>` : null}
        <p class="small muted">PDFs on ${host(r.u)}. Not interactive: check your answers against the mark scheme.</p>
        <${About} r=${r} />
      </details>
    </article>`;
  };

  GM.Unchecked = ({ list }) => list && list.length ? html`<details class="unchecked"><summary>${list.length} more possible sources, not checked yet</summary>
    <p class="small muted">These links were found but never opened, so their content and scope are unknown. They are not counted towards coverage.</p>
    <ul>${list.map((u, i) => html`<li key=${i}><span class="small">${u.t}${u.kind === 'mark_scheme' ? ' (mark scheme)' : ' (question paper)'}</span> <${GM.ExtLink} href=${u.u}>Try it<//></li>`)}</ul></details>` : null;

  /* A plain statement of what exists for this subtopic. No ratings, no jargon. */
  GM.CoverageBanner = ({ subjectId, sub, nVideos, nSets }) => {
    const cov = GM.data.coverage(subjectId, sub.ref);
    if (!cov || cov.exc) return null;
    const bits = [];
    if (cov.vlo < cov.lo) bits.push('The videos do not cover every objective yet (' + cov.vlo + ' of ' + cov.lo + '), so for some objectives you will need the explanations below.');
    if (nSets <= 1) bits.push(nSets === 1 ? 'There is only one practice set so far.' : 'There is no practice set yet.');
    return bits.length ? html`<p class="small muted covnote">${bits.join(' ')}</p>` : null;
  };
})();
