/* Village Sprint — shared state module. No build step, no dependencies. */
window.VS = (function () {
  const KEY = 'village-sprint-2026';
  const START = new Date(2026, 6, 8);   // Jul 8
  const END = new Date(2026, 6, 23);    // Jul 23
  const FRIDAYS = ['2026-07-10', '2026-07-17'];

  const TOPICS = ['BFS', 'Graphs', 'Backtracking', 'Binary Search', 'DFS', 'Heap',
    'Two Pointers', 'Sliding Window', 'Stack', 'Linked List', 'Intervals',
    'DP', 'Greedy', 'Trie', 'Prefix Sum', 'Matrices', 'Other'];
  const TOPIC_TRACK = { 'BFS': 'bfs', 'Graphs': 'graphs', 'Backtracking': 'backtracking' };

  const DEFAULT_TRACKS = [
    { id: 'bfs', name: 'BFS', total: 8, done: 4, type: 'count' },
    { id: 'graphs', name: 'Graphs', total: 6, done: 0, type: 'count' },
    { id: 'backtracking', name: 'Backtracking', total: 6, done: 0, type: 'count' },
    { id: 'cap', name: 'CAP Theorem', total: 1, done: 0, type: 'count', sub: 'system design' },
    { id: 'numbers', name: 'Numbers to Know', total: 1, done: 0, type: 'count', sub: 'system design' },
    { id: 'sentences', name: 'First-sentence drills', total: 4, done: 0, type: 'count', sub: 'stories #1 #2 #5 #6' }
  ];

  const CHECKS = [
    { id: 'algo', t: 'Algorithm problem', s: '60\u201375 min \u00b7 out loud, 5-step framework' },
    { id: 'kotlin', t: 'Kotlin rewrite / Koans', s: '30 min \u00b7 rewrite today\u2019s solution' },
    { id: 'third', t: '', s: '30 min' },
    { id: 'closeout', t: 'Close-out written', s: '10 min \u00b7 two lines' }
  ];

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function todayIso() { return iso(new Date()); }
  function dayList() {
    const out = [];
    for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) out.push(iso(new Date(d)));
    return out;
  }
  const DAYS = dayList();
  function activeKey() { return DAYS.includes(todayIso()) ? todayIso() : DAYS[0]; }

  let state = {
    days: {},
    tracks: DEFAULT_TRACKS.map(t => ({ id: t.id, done: t.done })),
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
        if (Array.isArray(p.tracks)) state.tracks = p.tracks;
        if (Array.isArray(p.resolve)) state.resolve = p.resolve;
        if (typeof p.resolved === 'number') state.resolved = p.resolved;
        if (Array.isArray(p.problems)) state.problems = p.problems;
        if (p.timer && p.timer.end > Date.now()) state.timer = p.timer;
      } catch (e) { /* corrupted state — start fresh rather than crash */ }
    } else {
      // brand-new install: seed the one problem we know was solved on day 1
      state.problems = [{
        id: 'p' + Date.now(),
        name: 'Minimum Knight Moves', url: '', topic: 'BFS', diff: 'Medium',
        notes: '', date: '2026-07-08', lastReview: null
      }];
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function dayState(k) { return state.days[k] || {}; }
  function isMin(ds) { return !!(ds.algo && ds.kotlin); }
  function isFull(ds) { return !!(ds.algo && ds.kotlin && ds.third && ds.closeout); }

  function streak() {
    let s = 0;
    let i = DAYS.indexOf(activeKey());
    if (i < 0) return 0;
    if (!isMin(dayState(DAYS[i]))) i--;
    for (; i >= 0; i--) { if (isMin(dayState(DAYS[i]))) s++; else break; }
    return s;
  }
  function daysLeft() {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((END - now) / 86400000));
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

  return {
    KEY, DAYS, FRIDAYS, TOPICS, TOPIC_TRACK, DEFAULT_TRACKS, CHECKS,
    state: () => state, load, save,
    iso, todayIso, activeKey, dayState, isMin, isFull,
    streak, daysLeft, esc, fmtDate, markNav
  };
})();
