/* GCSE Mastery – configuration and shared namespace */
window.GM = window.GM || {};
GM.config = {
  storageKey: 'gcsemastery.progress.v1',
  schemaVersion: 2,
  // A mastered objective that has not been touched for this many days is flagged "review due".
  reviewDays: 14,
  // In guided mode a topic opens up once this share of the previous topic is mastered.
  unlockThreshold: 0.5,
  subjects: [
    { id: 'biology', letter: 'B', name: 'Biology', spec: '8461' },
    { id: 'chemistry', letter: 'C', name: 'Chemistry', spec: '8462' },
    { id: 'physics', letter: 'P', name: 'Physics', spec: '8463' },
  ],
  // Mastery states for a learning objective. Absent from the store = not started.
  STATUS: { NOT_STARTED: 0, IN_PROGRESS: 1, COMPLETED: 2, NEEDS_REVISION: 3 },
  // Resource categories shown to students, in display order.
  categories: [['video', 'Videos'], ['past_paper', 'Past-paper questions'], ['markscheme', 'Mark schemes and answers'], ['notes', 'Revision notes'], ['practical', 'Required practical resources'], ['practice', 'Practice questions'], ['worksheet', 'Worksheets'], ['other', 'Other resources']],
};
