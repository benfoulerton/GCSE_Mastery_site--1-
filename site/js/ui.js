/* GCSE Mastery – shared UI primitives (icons, bars, badges, status controls). */
(function () {
  const { createElement: h, useState, useEffect, useLayoutEffect, useRef, useMemo, useSyncExternalStore, Fragment } = React;
  const html = htm.bind(h);
  GM.h = h; GM.html = html;
  GM.react = { useState, useEffect, useLayoutEffect, useRef, useMemo, useSyncExternalStore, Fragment };

  const svg = (children, props = {}) => html`<svg viewBox="0 0 24 24" width=${props.size || 20} height=${props.size || 20} fill="none" stroke="currentColor" stroke-width=${props.sw || 2} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class=${props.class || ''}>${children}</svg>`;

  const Icon = {
    Check: (p) => svg(html`<path d="M5 12.5l4.5 4.5L19 7.5" />`, p),
    Search: (p) => svg(html`<circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />`, p),
    Star: (p) => svg(html`<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />`, p),
    Play: (p) => svg(html`<path d="M8 5.5v13l11-6.5z" fill="currentColor" />`, p),
    Lock: (p) => svg(html`<rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 018 0v2.5" />`, p),
    Chevron: (p) => svg(html`<path d="M6 9l6 6 6-6" />`, p),
    ChevronRight: (p) => svg(html`<path d="M9 6l6 6-6 6" />`, p),
    Arrow: (p) => svg(html`<path d="M5 12h14M13 6l6 6-6 6" />`, p),
    Back: (p) => svg(html`<path d="M19 12H5M11 6l-6 6 6 6" />`, p),
    Home: (p) => svg(html`<path d="M4 11l8-6.5 8 6.5M6 9.5V19h12V9.5" />`, p),
    Books: (p) => svg(html`<path d="M5 4.5h4V19H5zM9 4.5h4V19H9zM14.2 5.6l3.8-1 3 13.8-3.8 1z" />`, p),
    Chart: (p) => svg(html`<path d="M4 19.5h16M7 16v-5M12 16V6M17 16v-8" />`, p),
    Gear: (p) => svg(html`<circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" />`, p),
    Flag: (p) => svg(html`<path d="M6 20V4.5M6 5h11l-2 3.5 2 3.5H6" />`, p),
    Flask: (p) => svg(html`<path d="M9.5 4h5M10.5 4v5.5L5.5 18a1.6 1.6 0 001.4 2.4h10.2a1.6 1.6 0 001.4-2.4l-5-8.5V4" /><path d="M8 14.5h8" />`, p),
    Sigma: (p) => svg(html`<path d="M17.5 5.5h-11l6 6.5-6 6.5h11" />`, p),
    Info: (p) => svg(html`<circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.2" />`, p),
    Download: (p) => svg(html`<path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />`, p),
    Upload: (p) => svg(html`<path d="M12 16V5M7 9.5l5-5 5 5M5 19.5h14" />`, p),
    Link: (p) => svg(html`<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />`, p),
    Refresh: (p) => svg(html`<path d="M19 8a7.5 7.5 0 00-13.2-1.5L4 9M4 4.5V9h4.5M5 16a7.5 7.5 0 0013.2 1.5L20 15M20 19.5V15h-4.5" />`, p),
    External: (p) => svg(html`<path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v4.5a1 1 0 01-1 1H5.5a1 1 0 01-1-1V8a1 1 0 011-1H10" />`, p),
    Doc: (p) => svg(html`<path d="M7 3.5h7l4 4V20a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5z M14 3.5V8h4M9 12.5h6M9 16h6" />`, p),
    Video: (p) => svg(html`<rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M10.5 9.5v5l4-2.5z" fill="currentColor" />`, p),
    User: (p) => svg(html`<circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5" />`, p),
  };
  GM.Icon = Icon;

  /* Delicate botanical line drawings, used sparingly. */
  GM.Sprig = ({ size = 120, class: cls = '' }) => html`
    <svg viewBox="0 0 120 160" width=${size} height=${size * 160 / 120} fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=${'sprig ' + cls}>
      <path d="M60 156C58 120 62 84 66 40" />
      <path d="M61 124c-16-2-26-12-30-26 16 0 27 9 30 26z" /><path d="M62 104c15-3 25-13 28-28-16 1-26 12-28 28z" />
      <path d="M63 82c-14-3-23-12-26-25 15 0 24 9 26 25z" /><path d="M64 64c12-3 21-11 24-24-14 1-22 10-24 24z" />
      <path d="M65 46c-9-4-14-12-14-22 10 2 15 11 14 22z" /><path d="M66 40c3-8 9-14 17-16-1 9-7 15-17 16z" />
      <path d="M61 124c-5-6-9-13-11-21M62 104c5-5 10-11 14-18" opacity=".55" />
    </svg>`;
  GM.LeafMark = ({ size = 22 }) => html`
    <svg viewBox="0 0 24 24" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 19c0-8 5-14 14-14 0 9-5 14-14 14z" /><path d="M5 19c3-4 6-7 10-10" />
    </svg>`;

  /* ---- progress bar: completed (sage) then in progress (light sage) ---- */
  GM.Bar = ({ t, label, size = 'md' }) => {
    const done = t.total ? (t.done / t.total) * 100 : 0;
    const prog = t.total ? (t.prog / t.total) * 100 : 0;
    return html`<div class=${'bar bar-' + size} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${GM.calc.pct(t)} aria-label=${label || 'Progress'}>
      <span class="bar-done" style=${{ width: done + '%' }}></span><span class="bar-prog" style=${{ width: prog + '%' }}></span>
    </div>`;
  };

  GM.Badge = ({ children, kind = '' }) => html`<span class=${'badge ' + kind}>${children}</span>`;
  GM.Badges = ({ list }) => list.map((b, i) => html`<${GM.Badge} key=${i} kind=${/HT/.test(b) ? 'ht' : 'only'}>${b}<//>`);

  /* ---- mastery status control ---- */
  const STATUS_LABEL = ['Not started', 'In progress', 'Mastered', 'Needs revision'];
  GM.STATUS_LABEL = STATUS_LABEL;
  GM.StatusDot = ({ status, size = 28 }) => html`<span class=${'sdot s' + status} style=${{ width: size + 'px', height: size + 'px' }} aria-hidden="true">
    ${status === 2 ? html`<${Icon.Check} size=${size * 0.62} sw=${2.6} />` : status === 1 ? html`<span class="sdot-half"></span>` : status === 3 ? html`<${Icon.Refresh} size=${size * 0.6} sw=${2.4} />` : null}</span>`;

  GM.StatusSegment = ({ status, onChange, disabled, name }) => html`
    <div class="seg" role="radiogroup" aria-label="Mastery status">
      ${STATUS_LABEL.map((l, i) => html`<button type="button" key=${i} role="radio" aria-checked=${status === i} disabled=${disabled}
        class=${'seg-btn' + (status === i ? ' on s' + i : '')} onClick=${() => onChange(i)}>${l}</button>`)}
    </div>`;

  GM.TYPE_LABEL = { def: 'Definition', proc: 'Process', cmp: 'Comparison', expl: 'Explanation', diag: 'Diagram', eq: 'Equation', calc: 'Calculation', exp: 'Experiment', lim: 'Limit', vocab: 'Vocabulary', ex: 'Example', tip: 'Exam tip', misc: 'Note' };

  /* ---- subtopic state chip and resource-coverage chip ---- */
  GM.StateChip = ({ state }) => html`<span class=${'schip st-' + state}>${GM.calc.STATE_LABEL[state]}</span>`;
  const COV_LABEL = { 'COMPLETE': 'Complete', 'LIMITED': 'Limited', 'MISSING': 'Missing', 'REQUIRES VERIFICATION': 'Needs verification' };
  GM.COV_LABEL = COV_LABEL;
  GM.CovChip = ({ cov, label, short }) => {
    if (!cov) return null;
    if (cov.exc) return html`<span class="cchip cc-EXC" title="Key ideas are taught through the other topics; no standalone resources are needed.">${short ? 'Via topics' : 'No standalone resources needed'}</span>`;
    const r = cov.ov;
    return html`<span class=${'cchip cc-' + r.replace(/ /g, '_')} title=${(label || 'Resource coverage') + ': ' + COV_LABEL[r]}>${short ? COV_LABEL[r] : (label ? label + ': ' : '') + COV_LABEL[r]}</span>`;
  };
  const VER_LABEL = { VERIFIED: 'Verified', PARTIALLY_VERIFIED: 'Partly verified', UNVERIFIED: 'Not checked', INACCESSIBLE: 'Inaccessible' };
  GM.VER_LABEL = VER_LABEL;
  GM.VerBadge = ({ ver }) => html`<span class=${'vbadge vb-' + ver} title=${(GM.data.coverageMeta().verification || {})[ver] || ''}>${VER_LABEL[ver] || ver}</span>`;

  GM.Empty = ({ children }) => html`<p class="empty">${children}</p>`;

  /* ---- hash routing helpers (hash names may only use letters, digits and hyphens) ---- */
  GM.route = {
    home: () => 'home',
    subjects: () => 'subjects',
    progress: () => 'progress',
    settings: () => 'preferences',
    subject: (s) => 'subject-' + s,
    topic: (s, t) => 'topic-' + s + '-' + t.replace(/\./g, '-'),
    sub: (s, ref, section) => 'sub-' + s + '-' + ref.replace(/\./g, '-') + (section ? '--' + section : ''),
    pathway: (s) => 'pathway-' + s,
    lo: (id) => 'lo-' + id.replace(/\./g, '-'),
    practicals: (s) => 'practicals-' + s,
    practical: (s, n) => 'practical-' + s + '-' + n,
    maths: (s) => 'maths-' + s,
    skills: (s) => 'skills-' + s,
    cards: (s, ref) => 'cards-' + s + '-' + ref.replace(/\./g, '-'),
    quiz: (s, ref) => 'quiz-' + s + '-' + ref.replace(/\./g, '-'),
    topicQuiz: (s, t) => 'topicquiz-' + s + '-' + t.replace(/\./g, '-'),
    papers: () => 'papers',
    revise: () => 'revise',
  };
  GM.href = (name) => '#' + name;
  GM.go = (name) => { if (location.hash.replace('#', '') === name) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = name; };
  GM.Link = ({ to, class: cls, children, ...rest }) => html`<a href=${'#' + to} class=${cls} ...${rest}>${children}</a>`;

  GM.useStore = () => useSyncExternalStore(GM.store.subscribe, GM.store.getState);
  GM.initials = (name) => (name || '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
})();
