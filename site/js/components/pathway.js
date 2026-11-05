/* Learning pathway: a winding line, crisp circular nodes, and a card beside each node. */
(function () {
  const { html, Icon, Bar, Badges } = GM; const { useState, useRef, useLayoutEffect, useMemo } = GM.react;
  const STATE_LABEL = { completed: 'Completed', available: 'Available', current: 'Current', locked: 'Locked' };
  const NODE_ICON = { completed: Icon.Check, available: Icon.Star, current: Icon.Play, locked: Icon.Lock };

  GM.TopicNode = ({ node, subjectId, setRef }) => {
    const NI = NODE_ICON[node.state];
    const label = `${node.topic.title}, ${STATE_LABEL[node.state].toLowerCase()}, ${GM.calc.pctLabel(node.sum)} mastered`;
    return html`<a class=${'node node-' + node.state} href=${GM.href(GM.route.topic(subjectId, node.topic.id))} aria-label=${label} ref=${setRef}>
      <${NI} size=${30} sw=${node.state === 'completed' ? 3 : 2.2} /></a>`;
  };

  GM.TopicCard = ({ node, subjectId, expanded, onToggle, lastLabel }) => {
    const { topic, sum, state } = node;
    const { title, badges } = GM.splitTitle(topic.title);
    const pid = 'tc-' + subjectId + '-' + topic.id.replace(/\./g, '-');
    const cta = state === 'current' ? (node.started ? 'Continue' : 'Start here') : state === 'completed' ? 'Review' : state === 'locked' ? 'Preview' : 'Open';
    return html`<article class=${'tcard tcard-' + state} aria-labelledby=${pid + '-t'}>
      <div class="tcard-top">
        <div class="tcard-meta">
          <span class="ref">Topic ${topic.ref}</span>
          <span class=${'state state-' + state}>${state === 'current' ? 'Recommended next' : STATE_LABEL[state]}</span>
          <${Badges} list=${badges} />
        </div>
        <button type="button" class="chev" aria-expanded=${expanded} aria-controls=${pid + '-body'} aria-label=${(expanded ? 'Collapse ' : 'Expand ') + title + ' subtopics'} onClick=${onToggle}>
          <${Icon.Chevron} size=${20} class=${expanded ? 'flip' : ''} /></button>
      </div>
      <h3 id=${pid + '-t'} class="tcard-title"><${GM.Link} to=${GM.route.topic(subjectId, topic.id)}>${title}<//></h3>
      <div class="tcard-prog">
        <${Bar} t=${sum} label=${title + ' progress'} size="sm" />
        <span class="tcard-pct">${GM.calc.pctLabel(sum)}</span>
      </div>
      <p class="tcard-count">${sum.done} of ${sum.total} objectives mastered${sum.prog ? ` · ${sum.prog} in progress` : ''}${sum.rev ? ` · ${sum.rev} need revision` : ''}</p>
      ${expanded ? html`<ul class="tcard-subs" id=${pid + '-body'}>
        ${topic.subtopics.map((st, i) => { const s = sum.subtopics[i]; const sp = GM.splitTitle(st.title); const state = GM.calc.subState(s, GM.calc.activity(GM.store.getState().resDone)[subjectId + ':' + st.ref] || 0); return html`<li key=${st.ref}>
          <${GM.Link} to=${GM.route.sub(subjectId, st.ref)} class="subrow">
            <span class="subrow-main"><span class="subrow-line"><span class=${'sdot2 st-' + state} aria-hidden="true"></span><span class="ref">${st.ref}</span><span class="subrow-title">${sp.title}</span></span></span>
            <span class="subrow-pct">${GM.calc.pctLabel(s)}</span>
            <${Bar} t=${s} label=${sp.title + ' progress'} size="xs" />
          <//></li>`; })}
      </ul>` : null}
      <div class="tcard-actions">
        <${GM.Link} to=${GM.route.topic(subjectId, topic.id)} class=${'btn ' + (state === 'current' ? 'btn-primary' : 'btn-quiet')}>${cta}<${Icon.Arrow} size=${16} /><//>
        ${state === 'locked' ? html`<button type="button" class="btn btn-quiet" onClick=${() => GM.store.unlockTopic(subjectId, topic.id)}>Start this topic</button>` : null}
      </div>
      ${state === 'locked' ? html`<p class="tcard-lock">Suggested for later. You can open it any time.</p>` : null}
    </article>`;
  };

  GM.Pathway = ({ subject }) => {
    const st = GM.useStore();
    const pw = useMemo(() => GM.calc.pathway(subject, st), [subject, st]);
    const wrapRef = useRef(null); const nodeEls = useRef([]);
    const [pts, setPts] = useState([]); const [width, setWidth] = useState(900); const [height, setHeight] = useState(0);
    const [open, setOpen] = useState({});
    const amp = width < 640 ? 24 : 64;

    useLayoutEffect(() => {
      const measure = () => {
        const wrap = wrapRef.current; if (!wrap) return;
        const cr = wrap.getBoundingClientRect(); setWidth(cr.width); setHeight(cr.height);
        setPts(nodeEls.current.slice(0, pw.nodes.length).map((el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top }; }));
      };
      measure();
      let ro; if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(wrapRef.current); }
      window.addEventListener('resize', measure);
      return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', measure); };
    }, [pw.nodes.length, subject.id]);

    const curve = (p) => p.reduce((d, q, i) => { if (!q) return d; if (i === 0) return `M${q.x} ${q.y}`; const a = p[i - 1]; const m = (q.y - a.y) / 2; return d + ` C${a.x} ${a.y + m} ${q.x} ${q.y - m} ${q.x} ${q.y}`; }, '');
    const valid = pts.filter(Boolean);
    const lastActive = pw.current ? pw.current.index : (pw.nodes.length - 1);
    const doneUpTo = valid.slice(0, lastActive + 1);
    return html`<div class="path" ref=${wrapRef}>
      <svg class="path-svg" width=${width} height=${height} aria-hidden="true">
        <path d=${curve(valid)} class="path-line" />
        <path d=${curve(doneUpTo)} class="path-line path-line-done" />
      </svg>
      <ol class="path-list">
        ${pw.nodes.map((n, i) => {
          const off = Math.round(amp * Math.sin((i * Math.PI) / 2));
          const isCur = n.state === 'current';
          return html`<li class=${'path-row' + (isCur ? ' is-current' : '')} key=${n.key}>
            <div class="path-nodecol">
              <div class="node-slot" style=${{ transform: `translateX(${off}px)` }}>
                ${isCur ? html`<span class="node-tag">${n.started ? 'Continue' : 'Start here'}</span>` : null}
                <${GM.TopicNode} node=${n} subjectId=${subject.id} setRef=${(el) => { nodeEls.current[i] = el; }} />
              </div>
            </div>
            <${GM.TopicCard} node=${n} subjectId=${subject.id} expanded=${!!open[n.key]} onToggle=${() => setOpen((o) => Object.assign({}, o, { [n.key]: !o[n.key] }))} />
          </li>`;
        })}
      </ol>
    </div>`;
  };
})();
