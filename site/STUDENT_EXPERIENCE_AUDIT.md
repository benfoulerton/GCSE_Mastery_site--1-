# GCSE Mastery: Student Experience Audit

Nothing on the site was changed during this audit. No content, data or code was edited.

## How this was tested (read this first)

| Method | What it covered |
|---|---|
| **Live site in Chrome** (the published artifact, as a real student sees it) | Homepage, Biology 4.1.1 Learn and Practise, the YouTube player, the "Open on YouTube" link, a Cognito lesson page, the 4.1.1 practice PDF and its mark scheme |
| **Headless browser on an identical local copy** (fresh empty progress, like a first-time student) | Homepage, Subjects, Progress page, Chemistry subject page, Physics Forces topic (locked state), Physics required practicals list and practical 1, Biology 4.1.1 Check step |
| **Reading the site's own content and data** | The first two objectives of 7 sample subtopics (Bio 4.1.1, 4.2.2; Chem 4.1.1, 4.2.1; Phys 4.1.1, 4.2.1, 4.5.1), explanation coverage across all 1,489 objectives, resource counts per subtopic |

**What I could NOT do, so I am not claiming it:**
- I did not watch any video start to finish. I confirmed that links open the right video and that the in-page player is blocked.
- I did not sit the practice paper. I opened the PDF and the mark scheme and read enough to judge fit; I did not answer the questions and mark them.
- I did not do a full live Chrome walkthrough of Chemistry and Physics. Those were checked locally (same code and data as the live site), not in the live tab.
- I did not mark things as Mastered or Needs revision on the live site, because that would overwrite the stored progress in your browser. I checked the controls exist and what they say, and read how the logic works.
- No real-phone test in this audit. Earlier layout tests at phone width showed no overflow, but I did not use it as a student on a phone.
- Because of the limits above, the "can I learn Chemistry and Physics here" judgement leans on content reads, not on a full live study session.

---

## 1. Overall verdict

**Ease of use: good. Learning effectiveness: patchy.**

The site is easy to navigate. I opened it, saw one big button, pressed it, and I was on the first subtopic with a clear Learn → Practise → Check path. That part works.

The problem is what's behind the button. As a student who wants to *understand* the content, I ran into this:

1. **The in-page video player is blocked on the live site.** "This content is blocked." Videos only work via "Open on YouTube". For a site built around videos, that is the single biggest break.
2. **A lot of the "free" lessons are metered.** Cognito showed me "You've used 2 of 5 free notes and lessons this week." That's about one subtopic's worth of lessons a week. A big share of the catalogue is Cognito (245 of 624 videos, 314 notes). The site calls them "Free, no account".
3. **The site doesn't actually teach much itself.** Short study aids exist for only 682 of 1,489 objectives (46%), at roughly 25-29 words each. Many are vocab or exam tips, not explanations. Physics is thinnest (164 of 479).
4. **Practice is thin and not interactive.** Mostly one PDF question set per subtopic (22 of 25 Biology subtopics have exactly one). Nothing is marked in the site. For 4.1.1 Cell structure the set barely tests the content.
5. **The "what to do next" suggestion is sometimes wrong.** On a fresh account it tells me to watch a video that covers objectives from later in the subtopic, not the first one.

**Would I use it for my whole GCSE?** As a *map, tracker and resource finder*: yes. As my main way to *learn* the content from scratch: not yet. I'd end up leaving the site for most of the actual learning, and I'd hit the Cognito limit within a few days. For a student who already learns from videos and wants to organise them against the spec, it's already useful.

---

## 2. First impressions

**What worked**
- The homepage has one dominant card: "START LEARNING - Biology · 4.1.1 Cell structure" with a "Start learning" button. I knew what to press.
- The three subject cards (Biology, Chemistry, Physics) are obvious, each with a percentage and "Start X".
- The Learn / Practise / Check bar answers "what do I do in a subtopic" without being told.
- The "Mastered means you can explain it and use it in a question you have not seen before" line explains the mastery system well.

**What confused me**
- "Next: Watch: Cognito: Specialised Cells & Differentiation." I'm on the first objective (eukaryotes vs prokaryotes) and I'm told to watch a video about specialised cells. As a beginner I'd assume that's the right starting video and be lost (see ISS-04).
- Nothing tells me *why* the three-step order is Learn → Practise → Check, or how long a subtopic takes.
- "0 of 25 objectives mastered" is intimidating on day one with no sense of how small a chunk to take at once.
- "Free, no account" labels: I assumed unlimited. I found the weekly cap only after clicking through.
- In the Check step, the options are Not started / In progress / Mastered / Needs revision. "Not started" and "In progress" are not explained, and it's unclear when I should set "In progress".

**What was missing**
- A short "How this works" line for a first-time user (3 sentences max).
- Any in-site explanation to read *before* I leave for a video: a short "the big idea" per subtopic.
- A visible sign of how much of the weekly Cognito allowance I'm using.

---

## 3. Complete issue log

Severity: **Critical** = stops learning; **High** = badly hurts learning or trust; **Medium** = friction; **Low** = polish.
Category: Navigation / Layout / Learning / Resources / Progress / Other.
"Tested" says how I saw it: **Live** = live Chrome; **Local** = headless local copy; **Data** = read from content/data.

| ID | Subject | Location | Category | What happened | Why it was a problem | Severity | Suggested improvement | Tested |
|---|---|---|---|---|---|---|---|---|
| ISS-01 | All (seen in Bio) | Any video card, "Play here" button | Resources | Pressing "Play here" shows "This content is blocked. Contact the site owner to fix the issue." No video plays in the page. | The main learning resource can't be watched in place. I have to leave the site for every video, then come back and manually mark it watched. | **Critical** | First confirm the cause: the artifact sandbox on claude.ai appears to block the YouTube embed. If it can't be allowed there, make "Open on YouTube" the primary button and hide/relabel "Play here" so it doesn't appear broken. If you host the site elsewhere, the embed may work. | Live |
| ISS-02 | All | Cognito resources (lesson/notes cards) | Resources | A Cognito lesson page showed "You've used 2 of 5 free notes and lessons this week. Upgrade to Pro." Site label says "Free, no account" or "Free to view". | The label is misleading. 5 per week is roughly one subtopic. Cognito is 245 of 624 videos and 314 of 691 notes. A student could hit the wall mid-topic with no warning. | **High** | Label Cognito resources honestly ("Free: 5 per week limit"). Prefer non-metered alternatives (FreeScienceLessons, PMT notes) as the *first* suggested resource, and put Cognito second. Add a one-line explainer. | Live |
| ISS-03 | Biology | 4.1.1 Learn, card "Cognito: Specialised Cells & Differentiation" | Resources | Labelled a video with button "Open lesson". It opens a notes page that contains a video plus text. | Not clear what I'm getting. I expected a video, got a text lesson with a video inside, and used one of my five weekly views. | Medium | Name the type honestly ("Lesson: video + notes") and show it uses the weekly allowance. | Live |
| ISS-04 | Biology | Home Continue card and 4.1.1 Learn, first recommended video | Learning / Progress | On a fresh account the first recommended video is "Specialised Cells & Differentiation". The first objective is eukaryotes and prokaryotes. | The "best video" is chosen by how many objectives it covers, not by teaching order. A beginner watches content that depends on cell structure they haven't met. | **High** | Recommend in teaching order: the first video that covers the first unmastered objective. Use coverage count only as a tiebreaker. | Local+Live |
| ISS-05 | Biology | 4.1.1 Practise | Resources | One question set only: a PMT PDF, 7 pages, 2 questions, 31 marks. Q1 is Salmonella vaccination, then antibiotic discs. Coverage badge says "Practice: Complete". | The set hardly tests eukaryotes, prokaryotes, or specialised cells. "Complete" tells me I'm covered when I'm not. One set means I can't practise again if I get it wrong. | **High** | Re-label coverage honestly (e.g. "1 set, partly relevant"). Add short, targeted recall questions per objective (can be in-site and self-marked). Keep PDFs as exam-style extras. | Live |
| ISS-06 | All | Practise step, all subtopics | Resources | Practice is PDF-only and not interactive. The site says this clearly. Answers are not checked in the site. | I have to download, print or scroll a PDF, answer on paper, find the mark scheme, mark myself, then return and tick "Attempted" by hand. Easy to skip. | High | Add simple in-site retrieval questions with instant feedback for key facts and definitions. Put the mark scheme link next to the question set (it already exists, which is good). | Live |
| ISS-07 | All | Practise: quantity | Resources | 22 of 25 Biology, 25 of 33 Chemistry and 18 of 31 Physics subtopics have exactly one question set. | One set per subtopic is not enough for "straight 9s". There's nothing to do if I want more practice or to retest after revising. | High | Prioritise adding 2-3 more sets for the large or hard subtopics first (Forces, Electricity, Bonding, Organisation). | Data |
| ISS-08 | Physics | 4.2.1 Electricity, 4.5.1 Forces | Learning | Explanations exist for 11 of 24 (Electricity) and 7 of 21 (Forces) objectives. The first two Electricity objectives show only two exam tips. | The two hardest-feeling Physics topics have the least text. The first objectives I see don't teach, they just advise. | **High** | Write short plain-English explanations for every objective in these topics first, starting with the first objectives in each subtopic. | Data |
| ISS-09 | All | Study aids across the curriculum | Learning | Only 682 of 1,489 objectives (Bio 197/434, Chem 321/576, Phys 164/479) have an "Explanation". Average about 25-29 words. Many are vocab or tips (e.g. "Eukaryote = 'true nucleus'"). | A 25-word note can't explain WHY. A student relying on the site alone won't build understanding. | **High** | Do not fill the gap with generic text. Target the ~800 objectives with none, and expand the thin ones to 2-4 short paragraphs with one example each. | Data |
| ISS-10 | Biology | 4.1.1 Learn, objective list | Learning | Objective text is the spec wording, e.g. "Use scale, size and order of magnitude to compare cells and sub-cellular structures". Several objectives say "Organs to know from KS3: ..." | Assumes KS3 knowledge and spec language. A student with weak prior knowledge doesn't know what to do with it. | Medium | Show a plain-English "In simple terms" line under each spec objective. Add an optional "Check you know this first" for KS3 prerequisites. | Data |
| ISS-11 | All | Objectives with no matched video | Resources | Several objectives show "No catalogued video or notes are matched to this objective individually". | Honest, but a dead end. I'm told there's nothing and not where to go next. | Medium | Point to the nearest broader video or lesson ("Covered in: ..., 3:20 onward if timestamp known"). | Local |
| ISS-12 | Physics | 4.1.1 Energy, video order | Resources | Top-listed videos are "Calculating Power", "Elastic Potential Energy" and "Energy Transfers Bungee Jumper". The first objective, "Define a system", has no explanation. | I start at "Energy changes in a system" and the first thing offered is calculating power. That's not an introduction. | Medium | Same fix as ISS-04: order by teaching sequence. Add a short explanation for "system" first. | Data |
| ISS-13 | All | Learn step, video cards | Layout | Each card repeats a verification badge, "What was checked" and "Covers N of M objectives". | A lot of metadata for each video. As a student I care about: what is it, how long, does it cover what I'm on. The rest is noise. | Medium | Collapse verification detail behind a small "Details" toggle. Keep title, source, length and "covers X" visible. | Live |
| ISS-14 | All | Sticky header + stepper | Layout | Top bar plus the three-step bar stay fixed while scrolling. | On a laptop screen it eats a visible chunk of the page. On a phone it will eat more (not tested as a student on a phone). | Medium | Make the stepper non-sticky, or shrink it when scrolled. Check on a real phone. | Live |
| ISS-15 | All | Learn step, video "Mark as watched" | Progress | Watched and attempted are manual ticks. | Easy to forget or to tick without watching. Step ticks only show on evidence, which is good, but the evidence is me pressing a button. | Low | Fine for now. Consider a gentle prompt when returning to the page ("Did you finish this video?"). | Local |
| ISS-16 | All | Check step, status control | Progress | Choices are Not started / In progress / Mastered / Needs revision. "In progress" is not explained. | I don't know when to use "In progress" versus "Needs revision". | Medium | One-line help under the title: "In progress = still learning it. Needs revision = I got it wrong or forgot." | Local |
| ISS-17 | All | Check step | Progress | Mastering needs 25 separate self-ratings for 4.1.1. | Rating every objective one by one is tedious (ADHD-unfriendly), and "I mastered nothing" feels bleak. | Medium | Add "Mark section as mastered" with undo. Keep per-objective control. | Local |
| ISS-18 | Physics | #topic-physics-4-5 (Forces) and other locked topics | Navigation / Progress | Banner: "This topic is locked in guided mode. It opens when 50% of the previous topic is mastered. You can read it now, or skip ahead." Status controls are disabled until I press "Skip ahead". | A student who wants to learn Forces now is stopped and has to press a button to even track progress. The banner is heavy. Gating by 50% mastered also assumes self-rating is honest. | Medium | Explain in the banner *why* (order helps). Make "Skip ahead" a clear secondary link. Consider making guided mode off by default. | Local |
| ISS-19 | All | Coverage labels ("Practice: Complete", "Videos: Complete", "Limited", "Needs verification") | Resources | Subtopic lists show words like "Limited", "Needs verification", "Complete". | A student can't tell what these mean for them. "Complete" reads as "you're covered", which isn't true (ISS-05). | Medium | Replace with plain terms: "Lots of videos", "1 practice set", "Few resources yet". | Local |
| ISS-20 | All | Home: "Recently studied", "Needs revision" | Progress | On a fresh account these show "Nothing yet..." and "Nothing to revise...". | Fine, but 3 empty lists on day one is clutter. | Low | Hide empty lists until there's something to show. | Local |
| ISS-21 | All | Cognito and PDF links | Navigation | Links open in a new tab. | Normal, but on a phone I can lose my place. No "come back here" cue. | Low | Add a small "You'll return to this page" or "Mark as watched when you're back" nudge. | Live |
| ISS-22 | All | Physics practical 1 (and other practical pages) | Resources | The practical page has a "Specific heat capacity" video from FreeScienceLessons with "Play here" (blocked on the live site) and "Open on YouTube". | Same as ISS-01. Also the page says the method is "study aids written for this platform, not specification text", which is honest but I'd want to know how far to trust it. | Medium | Fix ISS-01. Keep the honesty note. | Local |
| ISS-23 | All | Whole site | Learning | The site never shows a worked example or step-by-step calculation inline (checked in the samples I read). | Physics and Chemistry calculations (power, moles, resistance) need worked examples. A student can't see how to start. | High | Add one worked example per calculation objective. | Data |

(23 issues. Of these, 1 is Critical, 7 High, 10 Medium, 5 Low by my rating above.)

---

## 4. Subject-specific feedback

### Biology
- **Where I actually studied.** 4.1.1 Cell structure: Learn, YouTube, Cognito, PDF, mark scheme (live). 4.2.2 sampled from content.
- The best-supported subject by volume: 210 videos, 25 subtopics, all with at least one practice set.
- The first objective is clear and the structure is easy to follow. But the first recommended video is out of order (ISS-04) and the practice set doesn't fit the content (ISS-05).
- The Cognito lesson was genuinely well made: sections, key terms, exam technique, key points. It is the nearest thing to "being taught" that I found. It is also the one that's metered.
- Explanations cover 197 of 434 objectives (45%).

### Chemistry
- **Sampled:** Atomic structure 4.1.1 and 4.2.1 (content read), the Chemistry subject page (local).
- Subject page clearly offers "Start A simple model of the atom...". First suggested resource is "Cognito: Development of the Atomic Model", so the same Cognito limit applies.
- Better explanation coverage than the other two (321 of 576, 56%), which makes it the subject most likely to let me learn from the site.
- 25 of 33 subtopics have only one practice set.
- Bonding was not read in depth. I can't say whether it is better or worse than the others.

### Physics
- **Sampled:** 4.1.1 Energy, 4.2.1 Electricity, 4.5.1 Forces (content read), Forces topic page, required practicals list and practical 1 (local).
- Weakest of the three: 164 of 479 explanations (34%). Forces 7 of 21; Electricity 11 of 24.
- The calculation-heavy subject has the fewest worked explanations (ISS-23).
- Energy's opening videos are out of order for a beginner (ISS-12).
- The 10 required practicals are easy to find from the subject page, and the practical page is structured (purpose, apparatus, method...). I could not check the full content or run the practical.
- Forces is locked until the previous topic is half-mastered (ISS-18).

**Difference between subjects:** navigation and look are the same. The *learning depth* differs: Chemistry > Biology > Physics, in that order.

---

## 5. Learning quality assessment

| Area | Rating | Notes |
|---|---|---|
| Structure and sequencing of the curriculum | Good | Follows the AQA spec order. Clear subtopic to objective hierarchy. |
| Order of resources within a subtopic | Weak | Sorted by objective coverage, not by teaching order (ISS-04, ISS-12). |
| In-site explanations | Weak | 46% of objectives have one; short; often tips not teaching (ISS-09). |
| Explaining WHY | Weak | I saw definitions and facts far more than mechanisms. The best "why" came from the Cognito page, not the site. |
| Worked examples | Missing | None seen in my samples (ISS-23). |
| Scientific terms defined before use | Mixed | Spec terms appear without plain-English glosses (ISS-10). |
| Videos | Good source, broken delivery | FreeScienceLessons is a sound choice. The embed is blocked (ISS-01). |
| Practice questions | Weak | One PDF per subtopic mostly; poor fit in the 4.1.1 case; not interactive (ISS-05-07). |
| Checking answers | Fair | Mark scheme link exists and works. Marking is manual. |
| Honesty about limits | Good | "These question sets are PDFs... not interactive", "Partly verified" labels. Some labels overstate (ISS-19). |
| Knowing whether I understood | Fair | Self-rating only. No test of understanding in the site. |

**Bottom line:** a good curriculum map and resource index with a thin teaching layer. If the site's job is "organise the best free resources and track progress", it's close. If the job is "teach me", the in-site content isn't there yet.

---

## 6. Positive observations (keep these)

1. **One dominant "Continue learning" card** on Home. I never wondered what to press.
2. **Three-step Learn → Practise → Check flow**, with counts on each step ("0 of 22 watched or read", "0 of 1 attempted", "0 of 25 mastered").
3. **Honest mastery definition** ("Mastered means you can explain it and use it in a question you have not seen before").
4. **Honest notices**: PDFs are not interactive; "Partly verified"; spec text vs study aids kept separate.
5. **Mark schemes next to question sets**, and they opened correctly.
6. **Subject colours** (sage / orange / blue). I always knew which subject I was in. Dark mode looked good in the live view.
7. **Percentages only count mastered objectives** and the Progress page says so.
8. **Progress page** shows mastered / in progress / needs revision / not started, plus overall 0 of 1,489.
9. **Required practicals** are findable from the subject page with a consistent structure.
10. **"Open on YouTube" works** and opens the right video.
11. **Cognito lesson content** itself is clear and well structured (despite the limit).
12. **Collapsible groups in Check** with "Open all / Close all" keep a 25-item list manageable.

---

## 7. Prioritised improvements

None of these have been started.

### Priority 1: Blocking problems

**P1-A. Fix or work around the blocked video player.**
- *What:* Confirm why "Play here" is blocked on the published artifact. If it can't be fixed there, make "Open on YouTube" the main button and remove the broken-looking player.
- *Why:* Videos are the main teaching resource; right now each one needs a tab switch and a manual tick.
- *Improves:* Students can actually watch from the page, or at least don't think it's broken.
- *Component:* Video card / embed component in the Learn step and practical pages (`js/components/subtopic.js` and the resource card; practical pages).

**P1-B. Be honest about Cognito's weekly limit and stop leading with it.**
- *What:* Label Cognito resources with the limit; rank unmetered resources first.
- *Why:* A student can burn their 5 free views on day one and hit a paywall mid-topic.
- *Improves:* Trust, and a smoother first week.
- *Component:* Resource cards, `nextAction` resource choice, resource data labels.

### Priority 2: Major usability improvements

**P2-A. Recommend in teaching order, not by coverage count** (ISS-04, ISS-12).
- *Why:* Beginners get out-of-order content on the very first click.
- *Component:* `nextAction`, Learn step resource sorting in `js/data.js` and `js/components/subtopic.js`.

**P2-B. Replace overstated coverage labels with plain ones** (ISS-05, ISS-19).
- *Why:* "Complete" misleads. *Improves:* students trust what they see.
- *Component:* Coverage badges on subtopic lists and the Practise step.

**P2-C. Lighten the video cards** (ISS-13) and **sticky header** (ISS-14).
- *Component:* Resource card, topbar/stepper CSS.

**P2-D. Explain status options and add "mark section mastered"** (ISS-16, ISS-17).
- *Component:* `GM.Objective` check mode.

**P2-E. Soften the locked-topic banner** (ISS-18).
- *Component:* Topic page banner.

### Priority 3: Learning improvements

**P3-A. Write plain-English explanations for objectives that have none, Physics first** (ISS-08, ISS-09). Start with Electricity and Forces, then every subtopic's first objectives. Do not use generic filler; each should explain why, with one example.
**P3-B. Worked examples for every calculation objective** (ISS-23).
**P3-C. Add in-site retrieval questions with instant feedback** (ISS-05, ISS-06), then more practice sets for single-set subtopics (ISS-07).
**P3-D. "In simple terms" line and KS3 prerequisite checks** (ISS-10).
**P3-E. Better fallbacks for objectives with no matched video** (ISS-11).
- *Component for all:* content data (study aids), subtopic Learn/Practise panels.

### Priority 4: Polish

- Hide empty lists on a fresh Home (ISS-20).
- "You'll come back here" cue for external links (ISS-21).
- Optional "welcome / how this works" line for first visit.
- Test on a real phone.

---

## 8. Suggested ideal student journey

1. **Open Home.** Three short lines: "Learn it, practise it, check it." One big card: "Start: Cell structure. About 40 minutes."
2. **Press Start.** Land on Learn for 4.1.1.1, with a 3-4 sentence plain-English "big idea" at the top.
3. **Read the short explanation** for objective 1, including why it matters and one example.
4. **Watch the one best video for that objective**, in the page. If the embed can't work, a clear "Open on YouTube" button that returns me here. Marked as "unmetered" or "5 per week" honestly.
5. **Answer 3-5 quick questions on that objective**, marked instantly, with the right answer and a one-line reason.
6. **Rate myself** for that objective (Got it / Not sure / Needs revision). A single tap per section, not 25 ratings in a row.
7. **Next objective.** The site moves me along in teaching order.
8. **At the end of the subtopic:** a short exam-style set with a mark scheme, then a summary of what I flagged.
9. **Return to Home.** The Continue card says exactly where I stopped. "Needs revision" shows the things I flagged. Overall progress shows as a simple % with what it counts.
10. **Weeks later:** a gentle "review due" nudge for things I mastered 14+ days ago.

---

## Final note

Nothing was changed on the site. Nothing will be changed until you've reviewed this.
