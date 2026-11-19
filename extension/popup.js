// Text Armor — Active Shield Popup Controller (Manifest V3)
// Strictly separated from popup.html to comply with Chrome Content Security Policy (CSP).

document.addEventListener('DOMContentLoaded', () => {
  const BACKEND_URL = 'http://127.0.0.1:8000';
  const shieldToggle = document.getElementById('shieldToggle');
  const readerToggle = document.getElementById('readerToggle');
  const strictToggle = document.getElementById('strictToggle');
  const healthBadge = document.getElementById('healthBadge');
  const btnTest = document.getElementById('btnTest');
  const sandboxText = document.getElementById('sandboxText');
  const resultBox = document.getElementById('resultBox');
  const verdictText = document.getElementById('verdictText');
  const scoreText = document.getElementById('scoreText');
  const explanationText = document.getElementById('explanationText');
  const tokensCloud = document.getElementById('tokensCloud');
  const syncToast = document.getElementById('syncToast');

  function showToast() {
    if (!syncToast) return;
    syncToast.style.display = 'block';
    setTimeout(() => {
      syncToast.style.display = 'none';
    }, 1600);
  }

  // Load saved extension state reliably
  function loadSavedState() {
    // 1. Instant synchronous read from localStorage
    try {
      const strictSaved = localStorage.getItem('strict_parental_mode');
      if (strictSaved !== null) {
        strictToggle.checked = (strictSaved === 'true');
      }
      const shieldSaved = localStorage.getItem('active_shield_enabled');
      if (shieldSaved !== null) {
        shieldToggle.checked = (shieldSaved !== 'false');
      }
      const readerSaved = localStorage.getItem('reader_shield_enabled');
      if (readerSaved !== null) {
        readerToggle.checked = (readerSaved !== 'false');
      }
    } catch (e) {}

    // 2. Read from chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['active_shield_enabled', 'reader_shield_enabled', 'strict_parental_mode'], (res) => {
        if (chrome.runtime.lastError || !res) return;
        if (typeof res.strict_parental_mode === 'boolean') {
          strictToggle.checked = res.strict_parental_mode;
          try { localStorage.setItem('strict_parental_mode', res.strict_parental_mode ? 'true' : 'false'); } catch (e) {}
        }
        if (typeof res.active_shield_enabled === 'boolean') {
          shieldToggle.checked = res.active_shield_enabled;
          try { localStorage.setItem('active_shield_enabled', res.active_shield_enabled ? 'true' : 'false'); } catch (e) {}
        }
        if (typeof res.reader_shield_enabled === 'boolean') {
          readerToggle.checked = res.reader_shield_enabled;
          try { localStorage.setItem('reader_shield_enabled', res.reader_shield_enabled ? 'true' : 'false'); } catch (e) {}
        }
      });
    }
  }

  loadSavedState();

  function broadcastSettings() {
    const settings = {
      active_shield_enabled: shieldToggle.checked,
      reader_shield_enabled: readerToggle.checked,
      strict_parental_mode: strictToggle.checked
    };

    // 1. Instant synchronous write to localStorage
    try {
      localStorage.setItem('strict_parental_mode', settings.strict_parental_mode ? 'true' : 'false');
      localStorage.setItem('active_shield_enabled', settings.active_shield_enabled ? 'true' : 'false');
      localStorage.setItem('reader_shield_enabled', settings.reader_shield_enabled ? 'true' : 'false');
    } catch (e) {}

    // 2. Persist to chrome.storage.local
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(settings);
    }

    // 3. Persist to Background Service Worker
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SET_SETTINGS', settings: settings }).catch(() => {});
    }

    // 4. Send directly to active tab so tab updates IMMEDIATELY without reload
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TEXT_ARMOR_SETTINGS_CHANGED',
            settings: settings
          }).catch(() => {});
        }
      });
    }

    showToast();
  }

  shieldToggle.addEventListener('change', broadcastSettings);
  readerToggle.addEventListener('change', broadcastSettings);
  strictToggle.addEventListener('change', broadcastSettings);

  // Check backend health
  fetch(`${BACKEND_URL}/health`)
    .then(r => r.json())
    .then(data => {
      healthBadge.textContent = '● Online';
      healthBadge.style.color = 'var(--safe-text)';
      healthBadge.style.background = 'var(--safe-bg)';
      healthBadge.style.borderColor = 'var(--safe-border)';
    })
    .catch(() => {
      healthBadge.textContent = '● Standby';
      healthBadge.style.color = 'var(--review-text)';
      healthBadge.style.background = 'var(--review-bg)';
      healthBadge.style.borderColor = 'var(--review-border)';
    });

  // Sandbox Test Screen
  btnTest.addEventListener('click', async () => {
    const text = sandboxText.value.trim();
    if (!text) return;

    btnTest.textContent = 'Screening...';
    btnTest.disabled = true;

    try {
      const res = await fetch(`${BACKEND_URL}/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          client_source: 'chrome_extension_popup'
        })
      });

      const data = await res.json();
      resultBox.style.display = 'block';

      verdictText.textContent = data.moderation_decision;
      scoreText.textContent = `Risk: ${data.multi_dimensional_risk_score} / 100`;

      if (data.moderation_decision === 'RESTRICT') {
        verdictText.style.color = 'var(--restrict-text)';
      } else if (data.moderation_decision === 'FLAG_FOR_REVIEW') {
        verdictText.style.color = 'var(--review-text)';
      } else {
        verdictText.style.color = 'var(--safe-text)';
      }

      explanationText.textContent = data.explainable_ai?.explanation_summary || data.age_rating;

      tokensCloud.innerHTML = '';
      const tokens = data.explainable_ai?.flagged_tokens || [];
      if (tokens.length > 0) {
        tokens.forEach(t => {
          const span = document.createElement('span');
          span.className = 'tag-token';
          span.textContent = `${t.token} (${t.category})`;
          tokensCloud.appendChild(span);
        });
      }
    } catch (err) {
      alert('Could not reach Text Armor backend on 127.0.0.1:8000');
    } finally {
      btnTest.textContent = 'Screen Content';
      btnTest.disabled = false;
    }
  });
});
