// ─────────────────────────────────────────────────────────
// Claude Code Kitchen — Analytics Module
// Paste this <script> block into your artifact's <head>
// Replace ANALYTICS_ENDPOINT with your Apps Script URL
// ─────────────────────────────────────────────────────────

const Analytics = (() => {

  const ENDPOINT = 'https://script.google.com/a/macros/wix.com/s/AKfycbx__mLxC5EwsdxUqQkLRd2bNLGxNUhgF2LH25erpSC3KYsNEyCWqsy61t-abBCyQONW/exec';

  // ── Session ID — persists across page reloads ─────────
  function getSessionId() {
    let id = localStorage.getItem('cck_session');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('cck_session', id);
    }
    return id;
  }

  // ── Detect device type ────────────────────────────────
  function getDevice() {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1200) return 'tablet';
    return 'desktop';
  }

  // ── Mission timer — tracks time spent per mission ─────
  const timers = {};
  function startTimer(key) {
    timers[key] = Date.now();
  }
  function getElapsed(key) {
    if (!timers[key]) return 0;
    return Math.round((Date.now() - timers[key]) / 1000);
  }

  // ── Fire event to Google Sheets ───────────────────────
  function track(action, level, mission, metadata = {}) {
    const missionKey = `${level}_${mission}`;
    const payload = {
      type: 'event',
      session_id: getSessionId(),
      level,
      mission,
      action,
      metadata,
      time_elapsed: action === 'mission_complete' ? getElapsed(missionKey) : 0,
      device: getDevice()
    };

    // Fire and forget — don't block the UI
    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // silently fail — never break the learning experience
  }

  // ── Fire feedback to Google Sheets ───────────────────
  function submitFeedback(level, rating, comment, extra = {}) {
    const payload = {
      type: 'feedback',
      session_id: getSessionId(),
      level,
      rating,
      comment,
      track: extra.track || '',
      level5_context: extra.level5_context || '',
      level5_sentence: extra.level5_sentence || ''
    };

    fetch(ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  // ── Public API ────────────────────────────────────────
  return {
    // Call when a level starts
    levelStart(level) {
      track('level_start', level, 0);
    },

    // Call when a mission becomes active (starts the timer)
    missionStart(level, mission) {
      startTimer(`${level}_${mission}`);
      track('mission_start', level, mission);
    },

    // Call when the learner marks a mission done
    missionComplete(level, mission) {
      track('mission_complete', level, mission);
    },

    // Call when a level is fully completed
    levelComplete(level) {
      track('level_complete', level, 0);
    },

    // Call when the cheatsheet is viewed
    cheatsheetViewed(level) {
      track('cheatsheet_viewed', level, 0);
    },

    // Call when solo retry is chosen
    soloRetry(level) {
      track('solo_retry', level, 0);
    },

    // Call when stuck button is clicked
    stuckClicked(level, mission) {
      track('stuck_clicked', level, mission);
    },

    // Call when a command copy button is clicked
    commandCopied(level, mission) {
      track('command_copied', level, mission);
    },

    // Call when Level 4 track is selected
    trackSelected(track) {
      Analytics.track('level4_track_selected', 4, 0, { track });
    },

    // Call when Level 5 discovery answers are submitted
    level5Discovery(context, motivation, size, sentence) {
      track('level5_discovery', 5, 0, { context, motivation, size, sentence });
    },

    // Submit star + text feedback
    feedback: submitFeedback,

    // Expose for internal use
    track
  };
})();

// ── Auto-track page visibility (detects tab switching / abandonment)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Analytics.track('page_hidden', 0, 0);
  }
});
