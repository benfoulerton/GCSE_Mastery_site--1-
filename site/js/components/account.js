/* Progress overview and Settings pages. */
(function () {
  const { html, Icon, Bar } = GM; const { useState, useRef } = GM.react;

  const Legend = ({ t }) => html`<ul class="legend"><li><i class="lg lg-done"></i>${t.done} mastered</li><li><i class="lg lg-prog"></i>${t.prog} in progress</li><li><i class="lg lg-rev"></i>${t.rev || 0} need revision</li><li><i class="lg lg-todo"></i>${t.todo} not started</li></ul>`;

  GM.ProgressPage = () => {
    const st = GM.useStore(); const c = GM.combined(st);
    return html`<div class="page"><p class="eyebrow">Detailed breakdown</p><h1 class="page-title">Progress</h1>
      <section class="card prog-total" aria-label="All three sciences">
        <div class="prog-total-head"><span class="big-num">${GM.calc.pct(c)}<small>%</small></span><span class="big-cap">of the Biology, Chemistry and Physics specifications mastered</span></div>
        <${Bar} t=${c} label="All sciences combined" size="lg" /><${Legend} t=${c} />
        <p class="muted small">${c.topicsDone} of ${c.topics} topics completed. Percentages count mastered objectives only. “In progress” and “needs revision” objectives are shown separately and do not raise the percentage.</p>
      </section>
      <${GM.StudyLists} />
      ${GM.data.subjects().map((s) => { const x = GM.calc.summary(s, st.progress); const cfg = GM.config.subjects.find((q) => q.id === s.id);
        return html`<section class="prog-subj" key=${s.id} data-subject=${cfg.id}>
          <div class="prog-subj-head"><h2 class="section-title"><span class="dot"></span><${GM.Link} to=${GM.route.subject(s.id)}>${s.name}<//></h2><span class="allsci-total">${GM.calc.pctLabel(x)} · ${x.done} of ${x.total}</span></div>
          <${Bar} t=${x} label=${s.name + ' progress'} /><${Legend} t=${x} />
          <div class="prog-topics">${s.topics.map((t, i) => { const tx = x.topics[i]; const tt = GM.splitTitle(t.title);
            return html`<details class="prog-topic" key=${t.id}><summary>
              <span class="prog-topic-main"><span class="ref">${t.ref}</span><span>${tt.title}</span></span><span class="prog-topic-pct">${GM.calc.pctLabel(tx)}</span><${Bar} t=${tx} label=${tt.title + ' progress'} size="xs" /></summary>
              <ul class="prog-subs">${t.subtopics.map((sub, k) => html`<li key=${sub.ref}><${GM.SubRow} subject=${s} topic=${t} sub=${sub} tally=${tx.subtopics[k]} acts=${GM.calc.activity(st.resDone)[s.id + ':' + sub.ref] || 0} /></li>`)}</ul>
              <p class="tcard-actions"><${GM.Link} to=${GM.route.topic(s.id, t.id)} class="btn btn-quiet">Open topic<${Icon.Arrow} size=${16} /><//></p></details>`; })}</div>
        </section>`; })}
    </div>`;
  };

  GM.storageOk = (() => { try { localStorage.setItem('__gm', '1'); localStorage.removeItem('__gm'); return true; } catch (e) { return false; } })();

  GM.SettingsPage = () => {
    const st = GM.useStore();
    const [msg, setMsg] = useState(''); const [text, setText] = useState(''); const [confirmReset, setConfirmReset] = useState(false); const [showFlags, setShowFlags] = useState(false);
    const fileRef = useRef(null);
    const meta = GM.data.coverageMeta(); const msum = meta.summary || {};
    const lib = GM.data.subjects().map((s) => { const cov = { COMPLETE: 0, LIMITED: 0, MISSING: 0, 'REQUIRES VERIFICATION': 0, EXC: 0 }; s.topics.forEach((t) => t.subtopics.forEach((sub) => { const c = GM.data.coverage(s.id, sub.ref); if (!c) return; if (c.exc) cov.EXC++; else cov[c.ov]++; })); const m = msum[s.id] || { records: 0, byCategory: {}, byVerification: {} }; return { s, m, cov }; });
    const exported = GM.store.exportJSON();
    const copy = async () => { try { await navigator.clipboard.writeText(exported); setMsg('Backup copied to the clipboard.'); } catch (e) { document.getElementById('backup-out').select(); setMsg('Select the text and copy it manually.'); } };
    const doImport = (t) => { try { GM.store.importJSON(t); setMsg('Progress restored.'); setText(''); } catch (e) { setMsg(e.message || 'That backup could not be read.'); } };
    const onFile = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => doImport(String(r.result)); r.readAsText(f); e.target.value = ''; };
    const stats = GM.data.subjects().map((s) => ({ s, subs: s.topics.reduce((a, t) => a + t.subtopics.length, 0), los: s.loIds.length, spec: s.topics.reduce((a, t) => a + t.subtopics.reduce((b, x) => b + x.groups.reduce((c, g) => c + g.spec.length, 0), 0), 0) }));
    const flags = GM.data.subjects().flatMap((s) => s.topics.flatMap((t) => t.subtopics.flatMap((sub) => sub.groups.flatMap((g) => g.los.flatMap((lo) => lo.k.filter((k) => k[0] === 'FLAG').map((k) => ({ s, g, lo, text: k[2] })))))));
    return html`<div class="page narrow"><p class="eyebrow">Account and application</p><h1 class="page-title">Settings</h1>
      <section class="card setcard" aria-labelledby="set-prof"><h2 id="set-prof" class="section-title">Profile</h2>
        <label class="field" for="name-in"><span>Display name</span><input id="name-in" type="text" value=${st.profile.name} maxlength="40" placeholder="Optional" onInput=${(e) => GM.store.setName(e.target.value)} /></label>
        <label class="field" for="subj-in"><span>Subject shown on Home</span><select id="subj-in" value=${st.settings.subject} onChange=${(e) => GM.store.setSetting('subject', e.target.value)}>${GM.config.subjects.map((s) => html`<option key=${s.id} value=${s.id}>${s.name}</option>`)}</select></label>
      </section>
      <section class="card setcard" aria-labelledby="set-path"><h2 id="set-path" class="section-title">Learning pathway</h2>
        <fieldset class="radios"><legend class="visually-hidden">Pathway mode</legend>
          ${[['guided', 'Guided', `Topics are suggested in order. A later topic is marked as “later” until ${Math.round(GM.config.unlockThreshold * 100)}% of the one before is mastered, but you can open and start any topic at any time.`], ['open', 'Open', 'No topic is marked as “later”.']].map(([v, l, d]) => html`<label key=${v} class=${'radio' + (st.settings.pathMode === v ? ' on' : '')}><input type="radio" name="pathmode" value=${v} checked=${st.settings.pathMode === v} onChange=${() => GM.store.setSetting('pathMode', v)} /><span><strong>${l}</strong><br /><span class="muted small">${d}</span></span></label>`)}</fieldset>
        <label class="field" for="theme-in"><span>Appearance</span><select id="theme-in" value=${st.settings.theme} onChange=${(e) => { GM.store.setSetting('theme', e.target.value); }}><option value="auto">Match my device</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      </section>
      <section class="card setcard" aria-labelledby="set-data"><h2 id="set-data" class="section-title">Your progress data</h2>
        <p class="small">Progress is saved in ${GM.storageOk ? 'this browser on this device' : 'memory only, because this browser is blocking storage'}. It does not sync between devices yet. Use the backup below to move it.</p>
        <label class="field" for="backup-out"><span>Backup</span><textarea id="backup-out" readOnly rows="4" value=${exported}></textarea></label>
        <div class="row-actions"><button type="button" class="btn btn-quiet" onClick=${copy}><${Icon.Download} size=${16} />Copy backup</button><button type="button" class="btn btn-quiet" onClick=${() => fileRef.current.click()}><${Icon.Upload} size=${16} />Restore from file</button><input ref=${fileRef} type="file" accept="application/json,.json" hidden onChange=${onFile} /></div>
        <label class="field" for="backup-in"><span>Or paste a backup to restore</span><textarea id="backup-in" rows="3" value=${text} onInput=${(e) => setText(e.target.value)} placeholder="Paste backup text here"></textarea></label>
        <div class="row-actions"><button type="button" class="btn btn-quiet" disabled=${!text.trim()} onClick=${() => doImport(text)}>Restore pasted backup</button></div>
        <p class="status-msg" role="status">${msg}</p>
        <div class="danger">${confirmReset ? html`<p class="small"><strong>Reset all progress?</strong> Every objective goes back to not started. Your name and settings are kept.</p>
          <div class="row-actions"><button type="button" class="btn btn-danger" onClick=${() => { GM.store.reset(); setConfirmReset(false); setMsg('Progress reset.'); }}>Yes, reset progress</button><button type="button" class="btn btn-quiet" onClick=${() => setConfirmReset(false)}>Cancel</button></div>` : html`<button type="button" class="btn btn-quiet" onClick=${() => setConfirmReset(true)}>Reset all progress</button>`}</div>
      </section>
      <section class="card setcard" aria-labelledby="set-how"><h2 id="set-how" class="section-title">How progress is calculated</h2>
        <ul class="plist small">
          <li><strong>Mastery is your call.</strong> An objective becomes “Mastered” only when you set it. Opening a video, a PDF or a link never changes it.</li>
          <li><strong>Percentages</strong> are mastered objectives divided by all objectives: subtopic = its objectives, topic = its subtopics’ objectives, subject = its topics’, overall = all three sciences.</li>
          <li><strong>Needs revision</strong> is an objective you flag yourself. A mastered objective you have not touched for ${GM.config.reviewDays} days shows “review due”. Neither lowers a percentage; both put the subtopic into “Needs revision”.</li>
          <li><strong>Subtopic states:</strong> Not started (nothing done), In progress (any objective or resource started), Completed (every objective mastered), Needs revision.</li>
          <li><strong>Learning activity</strong> (videos watched, notes read, question sets attempted) is recorded separately and only changes a subtopic from “Not started” to “In progress”.</li>
          <li><strong>Next step</strong> picks, in order: an objective you flagged for revision; the subtopic you last worked on if unfinished; the first unfinished subtopic of the recommended topic; a mastered objective due for review.</li></ul>
      </section>
      <section class="card setcard" aria-labelledby="set-lib"><h2 id="set-lib" class="section-title">Resource library</h2>
        <p class="small">Every resource record from the collection is in the app. Coverage ratings come from the Resource Coverage Report (5 Nov 2026) and are shown honestly: a link existing does not make coverage good.</p>
        <div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Subject</th><th scope="col">Records</th><th scope="col">Videos</th><th scope="col">Question sets</th><th scope="col">Mark schemes</th><th scope="col">Notes</th><th scope="col">Practical videos</th><th scope="col">Partly verified</th></tr></thead>
          <tbody>${lib.map((x) => html`<tr key=${x.s.id}><th scope="row">${x.s.name}</th><td>${x.m.records}</td><td>${x.m.byCategory.video || 0}</td><td>${x.m.byCategory.past_paper || 0}</td><td>${x.m.byCategory.markscheme || 0}</td><td>${x.m.byCategory.notes || 0}</td><td>${x.m.byCategory.practical || 0}</td><td>${x.m.byVerification.PARTIALLY_VERIFIED || 0}</td></tr>`)}</tbody></table></div>
        <div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Subtopic coverage</th><th scope="col">Complete</th><th scope="col">Limited</th><th scope="col">Missing</th><th scope="col">Needs verification</th><th scope="col">No standalone resources needed</th></tr></thead>
          <tbody>${lib.map((x) => html`<tr key=${x.s.id}><th scope="row">${x.s.name}</th><td>${x.cov.COMPLETE}</td><td>${x.cov.LIMITED}</td><td>${x.cov.MISSING}</td><td>${x['cov']['REQUIRES VERIFICATION']}</td><td>${x.cov.EXC}</td></tr>`)}</tbody></table></div>
        <p class="muted small">Worksheets and non-PDF interactive practice: none collected. Question sets are PDFs on Physics &amp; Maths Tutor and are not interactive. Videos opened in the player come from YouTube; other providers open in a new tab.</p>
      </section>
      <section class="card setcard" aria-labelledby="set-cur"><h2 id="set-cur" class="section-title">About the curriculum</h2>
        <p class="small">Built from the AQA GCSE Biology (8461), Chemistry (8462) and Physics (8463) specifications, Higher Tier, Triple Science. Every specification statement is kept with its original reference. Material added to help understanding is labelled as a study aid.</p>
        <div class="tablewrap"><table class="tbl"><thead><tr><th scope="col">Subject</th><th scope="col">Topics</th><th scope="col">Subtopics</th><th scope="col">Spec statements</th><th scope="col">Objectives</th><th scope="col">Practicals</th></tr></thead>
          <tbody>${stats.map((x) => html`<tr key=${x.s.id}><th scope="row">${x.s.name}</th><td>${x.s.topics.length}</td><td>${x.subs}</td><td>${x.spec}</td><td>${x.los}</td><td>${x.s.practicals.length}</td></tr>`)}</tbody></table></div>
        <button type="button" class="btn btn-quiet" aria-expanded=${showFlags} onClick=${() => setShowFlags(!showFlags)}><${Icon.Flag} size=${16} />${flags.length} points flagged in the specification</button>
        ${showFlags ? html`<ul class="flaglist">${flags.map((f, i) => html`<li key=${i}><${GM.Link} to=${GM.route.lo(f.lo.id)}>${f.s.name} ${f.g.ref}<//> · ${f.text}</li>`)}</ul>` : null}
        <p class="muted small">Storage: ${GM.store.adapterName()}. Resource records: ${lib.reduce((a, x) => a + x.m.records, 0)}.</p>
      </section>
    </div>`;
  };
})();
