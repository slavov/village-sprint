/* Village Sprint — shared state module. No build step, no dependencies. */
window.VS = (function () {
  const KEY = 'village-sprint-2026';

  const ALGO_TOPICS = ['BFS', 'Graphs', 'Backtracking', 'Binary Search', 'DFS', 'Heap',
    'Two Pointers', 'Sliding Window', 'Stack', 'Linked List', 'Intervals',
    'DP', 'Greedy', 'Trie', 'Prefix Sum', 'Matrices', 'Other'];
  const KOTLIN_TOPICS = ['Coroutines', 'Flow', 'Collections', 'Null safety',
    'Sealed & data classes', 'Generics', 'Scope functions', 'Delegation',
    'Extension functions', 'Koans', 'Other'];
  const SYSDESIGN_TOPICS = ['Case study', 'Scalability', 'Caching', 'Databases',
    'Load balancing', 'Messaging / queues', 'Consistency & CAP', 'API design', 'Other'];

  // The three pillars. `check` ties a track to today's checklist box;
  // `topics` feeds the topic dropdown in the log form.
  const TRACK_DEFS = [
    { id: 'Algorithm', short: 'Algo', check: 'algo', chip: 'algo', topics: ALGO_TOPICS },
    { id: 'Kotlin', short: 'Kotlin', check: 'kotlin', chip: 'kotlin', topics: KOTLIN_TOPICS },
    { id: 'System Design', short: 'SysDes', check: 'sysdesign', chip: 'sysdesign', topics: SYSDESIGN_TOPICS }
  ];

  const CHECKS = [
    { id: 'algo', t: 'Algorithm problem', s: '60–75 min · out loud, 5-step framework' },
    { id: 'kotlin', t: 'Kotlin rewrite / Koans', s: '30 min · rewrite today’s solution' },
    { id: 'sysdesign', t: 'System design', s: '30 min · one case study, out loud' },
    { id: 'closeout', t: 'Close-out written', s: '10 min · two lines' }
  ];

  const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function todayIso() { return iso(new Date()); }

  function mondayOf(d) {
    const x = new Date(d);
    const dow = (x.getDay() + 6) % 7; // 0 = Monday
    x.setDate(x.getDate() - dow);
    x.setHours(12, 0, 0, 0);
    return x;
  }
  // Rolling calendar grid: `weeks` full Mon–Sun weeks ending with the current week.
  function gridDays(weeks) {
    weeks = weeks || 4;
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const start = mondayOf(today);
    start.setDate(start.getDate() - 7 * (weeks - 1));
    const out = [];
    const d = new Date(start);
    while (out.length < weeks * 7) {
      out.push(iso(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function isRevisitDay(k) { return new Date(k + 'T12:00:00').getDay() === 5; } // Friday
  function isFuture(k) { return k > todayIso(); }

  let state = {
    days: {},
    resolve: [],
    resolved: 0,
    problems: []
  };

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p.days) state.days = p.days;
        if (Array.isArray(p.resolve)) state.resolve = p.resolve;
        if (typeof p.resolved === 'number') state.resolved = p.resolved;
        if (Array.isArray(p.problems)) state.problems = p.problems;
        if (p.timer && p.timer.end > Date.now()) state.timer = p.timer;
      } catch (e) { /* corrupted state — start fresh rather than crash */ }
    } else {
      // brand-new install: seed the one problem we know was solved on day 1
      state.problems = [{
        id: 'p' + Date.now(),
        name: 'Minimum Knight Moves', url: '', track: 'Algorithm', topic: 'BFS', diff: 'Medium',
        notes: '', date: '2026-07-08', lastReview: null
      }];
    }
    // migration: entries logged before tracks existed are algorithm problems
    (state.problems || []).forEach(p => { if (!p.track) p.track = 'Algorithm'; });
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function dayState(k) { return state.days[k] || {}; }
  function isMin(ds) { return !!(ds.algo && ds.kotlin && ds.sysdesign); }
  function isFull(ds) { return !!(ds.algo && ds.kotlin && ds.sysdesign && ds.closeout); }

  // Current streak: consecutive days (ending today or yesterday) with the minimum done.
  function streak() {
    let s = 0;
    const d = new Date(); d.setHours(12, 0, 0, 0);
    let k = iso(d);
    if (!isMin(dayState(k))) { d.setDate(d.getDate() - 1); k = iso(d); }
    while (isMin(dayState(k))) {
      s++;
      d.setDate(d.getDate() - 1);
      k = iso(d);
    }
    return s;
  }
  // Longest streak ever, scanning actual logged days (calendar-adjacent, not just array order).
  function longestStreak() {
    const doneDays = Object.keys(state.days).filter(k => isMin(state.days[k])).sort();
    let longest = 0, run = 0, prev = null;
    doneDays.forEach(k => {
      if (prev) {
        const diff = Math.round((new Date(k + 'T12:00:00') - new Date(prev + 'T12:00:00')) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else run = 1;
      longest = Math.max(longest, run);
      prev = k;
    });
    return longest;
  }
  function totalActiveDays() {
    return Object.keys(state.days).filter(k => {
      const d = state.days[k];
      return !!(d && (d.algo || d.kotlin || d.sysdesign || d.closeout));
    }).length;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(k) {
    return new Date(k + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function markNav(page) {
    document.querySelectorAll('.nav a').forEach(a => {
      if (a.getAttribute('data-page') === page) a.classList.add('active');
    });
  }
  function trackDef(id) { return TRACK_DEFS.find(t => t.id === id) || TRACK_DEFS[0]; }

  return {
    KEY, TRACK_DEFS, ALGO_TOPICS, KOTLIN_TOPICS, SYSDESIGN_TOPICS, CHECKS, DOW_LABELS,
    state: () => state, load, save,
    iso, todayIso, gridDays, isRevisitDay, isFuture,
    dayState, isMin, isFull, streak, longestStreak, totalActiveDays,
    esc, fmtDate, markNav, trackDef
  };
})();
