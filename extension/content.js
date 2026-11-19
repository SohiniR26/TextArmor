/**
 * Text Armor — Active Shield (Chrome Extension Content Script)
 * Dual-Mode Moderation Engine:
 * 1. Outbound Active Shield: Intercepts input fields/textareas in real time before submission.
 * 2. Inbound Reader Shield: Automatically scans and blurs toxic, hostile, or 18+ content on pages you visit.
 */

(() => {
  const BACKEND_URL = 'http://127.0.0.1:8000/screen';
  let activeDebounceTimers = new Map();
  let overlayContainerMap = new Map();
  let isReaderScanning = false;
  let readerDebounceTimer = null;

  // Organic Minimalist Editorial Palette
  const PALETTE = {
    bgMain: '#F7F4F0',
    bgCard: '#FFFFFF',
    surfaceSunken: '#FAF8F5',
    border: '#DFD8CD',
    espresso: '#2C2623',
    espressoMuted: '#7A7067',
    champagne: '#C5A880',
    champagneHover: '#B59468',
    restrictBg: '#F9EBEB',
    restrictBorder: '#E8C9C9',
    restrictText: '#8C3B3B',
    reviewBg: '#FAF3E6',
    reviewBorder: '#EBDABA',
    reviewText: '#8F6423',
    safeBg: '#EBF2ED',
    safeBorder: '#C4D8CB',
    safeText: '#2D5F45'
  };

  console.log('[Text Armor Dual Shield] Initialized on page:', window.location.hostname);

  const trackedReaderItems = [];
  let currentStrictState = false;
  let currentReaderEnabled = true;
  let currentShieldEnabled = true;

  // Initialize cached settings immediately
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['active_shield_enabled', 'reader_shield_enabled', 'strict_parental_mode'], (res) => {
      if (res) {
        currentShieldEnabled = res.active_shield_enabled !== false;
        currentReaderEnabled = res.reader_shield_enabled !== false;
        currentStrictState = res.strict_parental_mode === true;
      }
    });
  }

  // Check if Outbound Active Shield is enabled
  function isShieldEnabled(callback) {
    callback(currentShieldEnabled);
  }

  // Check if Inbound Reader Shield is enabled
  function isReaderEnabled(callback) {
    callback(currentReaderEnabled);
  }

  // Check if Strict Parental Lock is enabled (disables Click to Reveal)
  function isStrictMode(callback) {
    callback(currentStrictState);
  }

  // ==============================================================================
  // 1. OUTBOUND ACTIVE SHIELD (Typing Interception & Policy Overlay)
  // ==============================================================================

  function attachShieldListeners(target) {
    if (target.dataset.textArmorAttached) return;

    const isInput = target.tagName === 'INPUT' && ['text', 'search', 'email', 'url', ''].includes(target.type.toLowerCase());
    const isTextarea = target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;

    if (!isInput && !isTextarea && !isContentEditable) return;

    target.dataset.textArmorAttached = 'true';

    const handleInput = () => {
      isShieldEnabled((enabled) => {
        if (!enabled) return;

        const text = isContentEditable ? target.innerText : target.value;
        if (!text || text.trim().length < 4) {
          removeOverlay(target);
          return;
        }

        // Debounce requests by 450ms
        if (activeDebounceTimers.has(target)) {
          clearTimeout(activeDebounceTimers.get(target));
        }

        const timer = setTimeout(() => {
          screenContent(target, text.trim());
        }, 450);

        activeDebounceTimers.set(target, timer);
      });
    };

    target.addEventListener('input', handleInput);
    target.addEventListener('change', handleInput);
    target.addEventListener('keyup', handleInput);
  }

  function scanAndAttach() {
    const inputs = document.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]');
    inputs.forEach(attachShieldListeners);
  }

  // Screen outbound content against FastAPI backend
  async function screenContent(targetElement, rawText) {
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          client_source: `chrome_extension_outbound:${window.location.hostname}`
        })
      });

      if (!response.ok) return;

      const data = await response.json();
      renderShieldOverlay(targetElement, data);
    } catch (err) {
      console.warn('[Text Armor Active Shield] Backend unreachable:', err.message);
    }
  }

  // Render or update policy overlay near the intercepted input
  function renderShieldOverlay(target, data) {
    const decision = data.moderation_decision;

    if (decision === 'ALLOW') {
      removeOverlay(target);
      target.style.filter = 'none';
      showTemporarySafePill(target, data);
      return;
    }

    let host = overlayContainerMap.get(target);
    if (!host || !document.body.contains(host)) {
      host = document.createElement('div');
      host.className = 'text-armor-shadow-host';
      host.style.position = 'absolute';
      host.style.zIndex = '2147483647';
      host.style.fontFamily = '"Inter", system-ui, -apple-system, sans-serif';
      document.body.appendChild(host);
      overlayContainerMap.set(target, host);
    }

    const rect = target.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    host.style.top = `${rect.bottom + scrollY + 8}px`;
    host.style.left = `${rect.left + scrollX}px`;
    host.style.width = `${Math.max(rect.width, 360)}px`;
    host.style.maxWidth = '520px';

    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' });
    }

    const isRestrict = decision === 'RESTRICT';
    const bg = isRestrict ? PALETTE.restrictBg : PALETTE.reviewBg;
    const border = isRestrict ? PALETTE.restrictBorder : PALETTE.reviewBorder;
    const textAccent = isRestrict ? PALETTE.restrictText : PALETTE.reviewText;
    const badgeLabel = isRestrict ? 'RESTRICTED CONTENT DETECTED' : 'POLICY REVIEW TRIGGERED';

    target.style.transition = 'filter 0.3s ease';
    target.style.filter = 'blur(3px)';

    const tokens = data.explainable_ai?.flagged_tokens || [];

    shadow.innerHTML = `
      <style>
        .shield-card {
          background: ${bg};
          border: 1px solid ${border};
          box-shadow: 0 10px 30px rgba(44, 38, 35, 0.08), 0 2px 8px rgba(44, 38, 35, 0.04);
          border-radius: 14px;
          padding: 16px;
          color: ${PALETTE.espresso};
          font-family: inherit;
          box-sizing: border-box;
          animation: armorFadeIn 0.25s ease-out;
        }
        @keyframes armorFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: ${PALETTE.espresso};
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .score-pill {
          font-size: 11px;
          font-family: monospace;
          padding: 2px 8px;
          border-radius: 6px;
          background: #FFFFFF;
          border: 1px solid ${border};
          color: ${textAccent};
          font-weight: 700;
        }
        .title {
          font-size: 13px;
          font-weight: 700;
          color: ${textAccent};
          margin-bottom: 4px;
        }
        .desc {
          font-size: 11px;
          color: ${PALETTE.espressoMuted};
          line-height: 1.4;
          margin-bottom: 10px;
        }
        .tokens-box {
          margin-bottom: 12px;
        }
        .tokens-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          color: ${PALETTE.espresso};
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          display: block;
        }
        .tokens-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .token-tag {
          font-size: 10px;
          font-family: monospace;
          background: #FFFFFF;
          border: 1px solid ${border};
          color: ${textAccent};
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          border-top: 1px solid rgba(223, 216, 205, 0.6);
          padding-top: 10px;
        }
        .btn {
          font-size: 11px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-gold {
          background: ${PALETTE.champagne};
          color: ${PALETTE.espresso};
          box-shadow: 0 4px 12px rgba(197, 168, 128, 0.25);
        }
        .btn-gold:hover {
          background: ${PALETTE.champagneHover};
        }
        .btn-secondary {
          background: #FFFFFF;
          color: ${PALETTE.espressoMuted};
          border: 1px solid ${PALETTE.border};
        }
        .btn-secondary:hover {
          color: ${PALETTE.espresso};
          border-color: ${PALETTE.champagne};
        }
      </style>

      <div class="shield-card">
        <div class="header">
          <div class="brand">
            <span>🛡️ TEXT ARMOR · ACTIVE SHIELD</span>
          </div>
          <div class="score-pill">
            Risk: ${data.multi_dimensional_risk_score} / 100
          </div>
        </div>

        <div class="title">${badgeLabel} (${data.age_rating})</div>
        <div class="desc">${data.explainable_ai?.explanation_summary || 'Policy compliance limits reached.'}</div>

        ${tokens.length > 0 ? `
          <div class="tokens-box">
            <span class="tokens-label">Explainable Trigger Tokens:</span>
            <div class="tokens-list">
              ${tokens.map(t => `<span class="token-tag">${t.token} (${t.category})</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="actions">
          <button id="btnClear" class="btn btn-secondary">Clear Input</button>
          <button id="btnUnblur" class="btn btn-gold">Review & Edit</button>
          <button id="btnDismiss" class="btn btn-secondary">Dismiss</button>
        </div>
      </div>
    `;

    shadow.getElementById('btnUnblur').onclick = () => {
      target.style.filter = 'none';
      target.focus();
    };

    shadow.getElementById('btnClear').onclick = () => {
      if (target.isContentEditable) {
        target.innerText = '';
      } else {
        target.value = '';
      }
      target.style.filter = 'none';
      removeOverlay(target);
    };

    shadow.getElementById('btnDismiss').onclick = () => {
      target.style.filter = 'none';
      removeOverlay(target);
    };
  }

  function removeOverlay(target) {
    const host = overlayContainerMap.get(target);
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
    overlayContainerMap.delete(target);
  }

  function showTemporarySafePill(target, data) {
    let host = overlayContainerMap.get(target);
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
      overlayContainerMap.delete(target);
    }

    const pill = document.createElement('div');
    pill.style.position = 'absolute';
    pill.style.zIndex = '2147483647';
    pill.style.pointerEvents = 'none';
    pill.style.transition = 'opacity 0.4s ease';

    const rect = target.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;

    pill.style.top = `${rect.bottom + scrollY + 4}px`;
    pill.style.left = `${rect.left + scrollX}px`;

    pill.innerHTML = `
      <div style="
        background: ${PALETTE.safeBg};
        border: 1px solid ${PALETTE.safeBorder};
        color: ${PALETTE.safeText};
        font-size: 11px;
        font-family: monospace;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 4px 12px rgba(44, 38, 35, 0.08);
      ">
        <span>✓</span>
        <span>Text Armor: Compliant (Risk: ${data.multi_dimensional_risk_score})</span>
      </div>
    `;

    document.body.appendChild(pill);
    setTimeout(() => {
      pill.style.opacity = '0';
      setTimeout(() => pill.remove(), 400);
    }, 2000);
  }

  // ==============================================================================
  // 2. INBOUND READER SHIELD (Safe Browsing & Content Blurring on Live Pages)
  // ==============================================================================

  const READER_SELECTORS = [
    // YouTube Comments (Old and New 2024-2026 Layouts)
    '#content-text',
    'ytd-comment-view-model #content-text',
    'ytd-comment-view-model .yt-core-attributed-string',
    'yt-formatted-string#content-text',
    'yt-attributed-string#content-text',
    'ytd-comment-renderer #content-text',
    '#comment-content #content-text',
    // Reddit Comments & Posts
    '[data-testid="comment"] p',
    'shreddit-comment p',
    'div[data-click-id="text"] p',
    // Twitter / X Tweets
    '[data-testid="tweetText"]',
    // Wikipedia Articles & Encyclopedic Text
    '#mw-content-text p',
    '.mw-parser-output > p',
    // Generic Articles, Reviews & Forums
    'article p',
    '.comment-text',
    '.comment-body',
    '.comment-content',
    '.review-text',
    'p.comment'
  ];

  async function scanReaderContent() {
    if (isReaderScanning) return;

    isReaderEnabled(async (enabled) => {
      if (!enabled) return;

      isReaderScanning = true;

      try {
        const selectorStr = READER_SELECTORS.join(', ');
        const candidates = document.querySelectorAll(selectorStr);

        const toScan = [];
        for (const el of candidates) {
          if (el.dataset.textArmorReaderChecked) continue;
          if (el.closest('.text-armor-shadow-host') || el.closest('.text-armor-reader-pill')) continue;

          const text = el.innerText ? el.innerText.trim() : '';
          // Scan sequences between 10 and 1200 characters
          if (text.length >= 10 && text.length <= 1200) {
            el.dataset.textArmorReaderChecked = 'true';
            toScan.push({ el, text });
          }
          if (toScan.length >= 8) break; // Process up to 8 comments/paragraphs per cycle
        }

        // Screen candidates asynchronously
        for (const item of toScan) {
          await screenAndBlurReaderElement(item.el, item.text);
        }
      } catch (err) {
        console.warn('[Text Armor Reader Shield] Scan error:', err);
      } finally {
        isReaderScanning = false;
      }
    });
  }

  async function screenAndBlurReaderElement(element, rawText) {
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          client_source: `chrome_extension_reader:${window.location.hostname}`
        })
      });

      if (!response.ok) return;

      const data = await response.json();
      const decision = data.moderation_decision;
      const risk = data.multi_dimensional_risk_score || 0;
      // Smart Inbound Policy:
      // Normal Mode: Blur only confirmed high-threat (RESTRICT / 18+ or risk >= 42.0)
      // Strict Parental Lock: Also blur FLAG_FOR_REVIEW / 13+ content (risk >= 30.0)
      const isRestricted = (decision === 'RESTRICT' || risk >= 42.0) ||
                           (currentStrictState && (decision === 'FLAG_FOR_REVIEW' || risk >= 30.0));

      if (isRestricted) {
        applyReaderBlur(element, data);
      }
    } catch (err) {
      // Backend unavailable; fail silently without interrupting browsing
    }
  }

  function renderBadgeContent(item, isStrict) {
    const risk = item.data?.multi_dimensional_risk_score || 50;
    const rating = item.data?.age_rating || '18+ Restricted';

    if (isStrict) {
      // STRICT PARENTAL LOCK:
      // Completely disable and remove reveal button.
      // Force element to remain blurred permanently.
      item.isBlurred = true;
      item.element.style.filter = 'blur(6px)';
      item.element.style.userSelect = 'none';
      item.element.style.cursor = 'default';
      item.badge.style.cursor = 'default';
      item.badge.style.background = '#F9EBEB';
      item.badge.style.borderColor = '#E8C9C9';
      item.badge.style.color = '#8C3B3B';

      item.badge.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          <span>🛡️</span>
          <span>Text Armor: Blocked by Strict Parental Lock (${rating})</span>
        </span>
      `;

      item.badge.onclick = null;
      item.element.onclick = null;
    } else {
      // ADVISORY SAFE BROWSING:
      // Interactive Click to Reveal / Click to Re-hide for adult readers
      item.element.style.cursor = 'pointer';
      item.badge.style.cursor = 'pointer';

      const updateUI = () => {
        if (item.isBlurred) {
          item.element.style.filter = 'blur(6px)';
          item.element.style.userSelect = 'none';
          item.badge.style.background = '#F9EBEB';
          item.badge.style.borderColor = '#E8C9C9';
          item.badge.style.color = '#8C3B3B';
          item.badge.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span>🛡️</span>
              <span>Text Armor: Blurred (${rating} · Threat: ${risk}/100)</span>
            </span>
            <span class="reveal-btn" style="text-decoration: underline; color: #2C2623; margin-left: 6px; font-weight: 700;">[Click to Reveal]</span>
          `;
        } else {
          item.element.style.filter = 'none';
          item.element.style.userSelect = 'auto';
          item.badge.style.background = '#EBF2ED';
          item.badge.style.borderColor = '#C4D8CB';
          item.badge.style.color = '#2D5F45';
          item.badge.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span>🛡️</span>
              <span>Text Armor: Content Revealed (${rating})</span>
            </span>
            <span class="reveal-btn" style="text-decoration: underline; color: #2D5F45; margin-left: 6px; font-weight: 700;">[Click to Re-hide]</span>
          `;
        }
      };

      updateUI();

      item.badge.onclick = (e) => {
        e.stopPropagation();
        item.isBlurred = !item.isBlurred;
        updateUI();
      };

      item.element.onclick = (e) => {
        if (item.isBlurred) {
          e.stopPropagation();
          item.isBlurred = false;
          updateUI();
        }
      };
    }
  }

  function applyReaderBlur(element, data) {
    if (element.dataset.textArmorBlurred) return;
    element.dataset.textArmorBlurred = 'true';

    // Apply visual blur & disallow accidental text selection
    element.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
    element.style.filter = currentReaderEnabled ? 'blur(6px)' : 'none';
    element.style.userSelect = currentReaderEnabled ? 'none' : 'auto';

    // Construct reader warning badge
    const badge = document.createElement('div');
    badge.className = 'text-armor-reader-pill';
    badge.style.display = currentReaderEnabled ? 'inline-flex' : 'none';
    badge.style.alignItems = 'center';
    badge.style.gap = '8px';
    badge.style.margin = '6px 0 8px 0';
    badge.style.padding = '5px 12px';
    badge.style.borderRadius = '8px';
    badge.style.background = '#F9EBEB';
    badge.style.border = '1px solid #E8C9C9';
    badge.style.color = '#8C3B3B';
    badge.style.fontSize = '11px';
    badge.style.fontFamily = 'monospace';
    badge.style.fontWeight = '600';
    badge.style.boxShadow = '0 2px 6px rgba(140, 59, 59, 0.08)';
    badge.style.transition = 'all 0.2s ease';

    const item = {
      element,
      badge,
      data,
      isBlurred: true
    };
    trackedReaderItems.push(item);

    renderBadgeContent(item, currentStrictState);

    // Insert badge immediately above the blurred element
    if (element.parentNode) {
      element.parentNode.insertBefore(badge, element);
    }
  }

  // Real-time live settings sync from extension popup
  function applyLiveSettings(settings) {
    if (!settings) return;

    if (typeof settings.strict_parental_mode === 'boolean') {
      currentStrictState = settings.strict_parental_mode;
      for (const item of trackedReaderItems) {
        if (item && item.element && item.badge && document.body.contains(item.element)) {
          renderBadgeContent(item, currentStrictState);
        }
      }
    }

    if (typeof settings.reader_shield_enabled === 'boolean') {
      currentReaderEnabled = settings.reader_shield_enabled;
      for (const item of trackedReaderItems) {
        if (item && item.element && item.badge && document.body.contains(item.element)) {
          if (!currentReaderEnabled) {
            item.element.style.filter = 'none';
            item.element.style.userSelect = 'auto';
            item.badge.style.display = 'none';
          } else {
            item.badge.style.display = 'inline-flex';
            if (item.isBlurred) {
              item.element.style.filter = 'blur(6px)';
              item.element.style.userSelect = 'none';
            }
          }
        }
      }
      if (currentReaderEnabled) {
        scanReaderContent();
      }
    }

    if (typeof settings.active_shield_enabled === 'boolean') {
      currentShieldEnabled = settings.active_shield_enabled;
      if (!currentShieldEnabled) {
        for (const [target] of overlayContainerMap.entries()) {
          removeOverlay(target);
        }
      }
    }
  }

  // 1. Direct message listener from popup.html
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.type === 'TEXT_ARMOR_SETTINGS_CHANGED') {
        applyLiveSettings(message.settings);
        sendResponse({ success: true });
      }
    });
  }

  // 2. Storage change listener across tabs
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      chrome.storage.local.get(['active_shield_enabled', 'reader_shield_enabled', 'strict_parental_mode'], (res) => {
        if (res) {
          applyLiveSettings({
            active_shield_enabled: res.active_shield_enabled !== false,
            reader_shield_enabled: res.reader_shield_enabled !== false,
            strict_parental_mode: res.strict_parental_mode === true
          });
        }
      });
    });
  }

  // ==============================================================================
  // 3. MUTATION OBSERVER & LIFECYCLE
  // ==============================================================================

  const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        hasNewNodes = true;
        break;
      }
    }
    if (hasNewNodes) {
      scanAndAttach(); // Outbound listener check
      if (readerDebounceTimer) clearTimeout(readerDebounceTimer);
      readerDebounceTimer = setTimeout(scanReaderContent, 700); // Throttled Inbound Reader scan
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial Boot Scan
  scanAndAttach();
  setTimeout(scanReaderContent, 1000);

})();
