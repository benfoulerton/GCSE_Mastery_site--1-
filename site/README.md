# GCSE Mastery

A structured revision platform for AQA GCSE Biology, Chemistry and Physics (Higher Tier, Triple Science).
Plain static site: React 18 + htm (vendored in `js/vendor`, no build step, no CDN needed for code).

## Run it
    python3 -m http.server 8000     # then open http://localhost:8000/index.html wrapped in a normal HTML page
`index.html` is written as a page fragment (no doctype/head) so it can be published as a hosted artifact.
For local use open `_test.html` (same content with the standard HTML skeleton), or paste the fragment into any HTML shell.

## Structure
    data/            curriculum JSON (generated), res-{subject}.json (every resource record), coverage.json (per-subtopic coverage), manifest.json
    tools/           build_data.py (curriculum), build_resources.py (resources + coverage), audit.py (import audit), source/ (curriculum JSON + resource catalogues)
    js/config.js     subjects, unlock threshold, review interval, resource categories, storage key
    js/store.js      progress store + StorageAdapter (localStorage now)
    js/data.js       loading, indexing, lazy resource loading, progress maths (GM.calc), pathway state, next-action logic
    js/ui.js         icons, progress bar, badges, status control, state/coverage/verification chips, route helpers
    js/components/   pathway, shell (header/home/subjects/curriculum), subtopic (learning page), resources (cards), topic, reference (practicals, maths, working scientifically), account (progress, settings)
    js/app.js        hash router, loading and mounting, theme (light/dark) setting
    css/styles.css   design tokens (light + dark), and all styles

## Routes (hash)
    #home  #subjects  #progress  #preferences
    #subject-biology            Topics (expandable topics > subtopics) with links to the pages below      #pathway-biology   winding pathway
    #practicals-biology  #maths-biology  #skills-biology  #practical-biology-3
    #topic-biology-4-1          topic overview        #sub-biology-4-1-1  subtopic learning page (add --learn / --practise / --check to jump to a step)
    #lo-B-4-1-1-1-LO01          opens the Check step of the subtopic on that objective

## Curriculum data
Hierarchy: Subject > Topic (4.x) > Subtopic (4.x.y) > Spec section (4.x.y.z) > Learning objective > Knowledge items.
Every knowledge item is tagged `S` (specification) or `E` (explanatory study aid), or `FLAG`/`NOTE` (ambiguity flagged).
Rebuild after editing the source: `python3 tools/build_data.py` (it asserts objective and spec-statement counts match the source:
Biology 434, Chemistry 576, Physics 479 objectives).

## Resource data
`tools/build_resources.py` converts the three resource catalogues into `data/res-*.json` (one record per resource and subtopic, original resource_id kept as `id`)
and `data/coverage.json` (video, practice and overall rating per subtopic, with the remaining gaps). It stops if a record is lost, an id is duplicated or a learning-objective id is unknown.
Record fields: `id, t` title, `p` provider, `ty` video|practice|notes|markscheme, `cat` display category, `u` url, `sub`, `refs`, `los`, `cov`, `free, acct, ans`, `ver` verification status, `why`/`vn` what was checked, `weak` (small or weak-fit set, shown but not counted).
Verification labels are shown on every card (VERIFIED, PARTIALLY_VERIFIED). Links never checked (86 PMT papers) are in `unverified` and appear only in a collapsed "not checked yet" list.
Resources load per subject when first needed; if that fails the curriculum still works and a retry button appears.
YouTube videos can be played in the page (youtube-nocookie embed, started by the student); every other provider opens in a new tab. Question sets are PDFs and are labelled as not interactive.

## Progress rules
Objective status: not started / in progress / mastered / needs revision, set by the student only; viewing or opening a resource never counts.
Percentage = mastered / total at every level (subtopic, topic, subject, all sciences). "In progress" and "needs revision" are shown but not counted.
A mastered objective untouched for 14 days is "review due". Neither this nor "needs revision" lowers a percentage; both put the subtopic into the Needs revision state.
Subtopic state: Not started, In progress (any objective or resource activity), Completed (all mastered), Needs revision.
Resource completion (watched / read / attempted) is stored separately (`resDone`) and never changes mastery.
Next step, in order: an objective flagged "needs revision"; the most recently studied unfinished subtopic; the first unfinished subtopic of the recommended pathway topic; a mastered objective due for review. Inside a subtopic the step follows Learn > Practise > Check: its best video until one is marked watched, then a question set until one is marked attempted, then the next objective. On Home, "Continue learning" resumes the subject worked in most recently (a new student starts at Biology 4.1.1).
Guided pathway: a topic opens at 50% of the previous topic mastered, or when started, or via Skip ahead. Open mode unlocks everything.

## Updating resources
Edit the catalogue JSON in `tools/source/` (or replace it with a new export), then run `python3 tools/build_resources.py` and `python3 tools/audit.py`.

## Adding accounts / cloud sync later
Progress is a single JSON object saved through an adapter with `name`, `load()` and `save(state)`. Write a cloud adapter with the same
shape and call `GM.store.useAdapter(adapter)`. No component needs to change. Export/import backup already uses the same state object.

## Colours
One palette (the original cream, beige and sage). Tokens are at the top of `css/styles.css`. The only per-subject colour is a small accent (the dot and card top border), set by `data-subject` on an element. There are no colour transitions or animations between subjects.

## Resources shown to students
- Videos are one simple card: title, provider, length if known, a **Watch** button (opens the original in a new tab) and a "Watched" tick. Everything else is behind **Details**.
- Cognito lesson/notes cards are no longer shown. Cognito *video* lessons are shown as ordinary videos. The notes-type Cognito records stay in `data/` but are filtered out of the UI.
- Videos are listed in teaching order (earliest spec section first; ties go to Cognito, then FreeScienceLessons, then lesson number). The same order picks the video on the Home "Continue" card.
- New Cognito videos are added by `tools/add_cognito_videos.py` (idempotent). See `COGNITO_VIDEO_COVERAGE_REPORT.md`.
- Pathway mode now defaults to Open for new students. Existing students keep their saved setting. Starting any objective in a "later" topic unlocks it automatically.

## Subtopic page
One page, three steps (Learn, Practise, Check your knowledge), chosen with a step bar. The step is in the address (`--learn`, `--practise`, `--check`) so refresh and links keep it.
Step ticks only appear on evidence (something watched or read, a set attempted, every objective mastered). Mastery is only ever set in the Check step.

## Practice system (flashcards, quizzes, past papers, revise, search)
All content is data, never in components. Files load lazily; each is optional, so the site still works if one is missing.
- `data/flashcards.json`: `{schema, cards:[{id, sub, refs, los, ty, q, a}]}`. Ids look like `FC-BIO-4.1.1-001` (BIO / CHE / PHY).
- `data/questions.json`: `{schema, questions:[{id, sub, refs, los, d, q, opts[4], a, ex[4]}]}`. `a` is the index of the right option, `ex` explains every option, `d` is difficulty 1-3. Options are shuffled each attempt.
- `data/papers.json`: official AQA papers (QP, MS and examiner report where one exists). Higher tier, June 2022 and 2023. Physics 2022 Paper 2 is left out because its question paper and mark scheme codes did not match.
- Author new cards and questions in `tools/content/pilot_<subj>_<ref>.py`, register the module in `mods` in `tools/build_study.py`, then run `python3 tools/build_study.py`. The builder checks ids, learning-objective ids, four options, a valid answer index and one explanation per option.
- Current content: Biology 4.1.1 (41 cards, 21 questions), Chemistry 4.1.1 (16, 10), Physics 4.2.1 (15, 9). Everything else shows a plain "not written yet" message.
- Routes: `#papers`, `#revise`, `#cards-<subject>-<ref>`, `#quiz-<subject>-<ref>`, `#topicquiz-<subject>-<topic>`. Search: `/` or Ctrl/Cmd+K.
- Progress state gained `bookmarks, last, live, sessions, qstats, cardSt`. `normalise()` fills them in for older backups, so nothing is reset.
- Keys: flashcards ← → Space 1 2; quiz 1-4 pick, Enter submits then continues; Esc closes search.

## Hosting on GitHub Pages
The zip's `index.html` is a full page and `.nojekyll` is included, so Pages serves the files as they are (no Jekyll build). Put the contents of the zip at the repo root, then Settings > Pages > Deploy from a branch > main / root.
