(function () {
  'use strict';

  const TOOLS = {
    'base64-encode': 'Base64 Encode',
    'base64-decode': 'Base64 Decode',
    'url-encode': 'URL Encode',
    'url-decode': 'URL Decode',
    'json-validate': 'JSON Validate',
    'jwt-decode': 'JWT Decode',
    'uuid-generate': 'UUID Generator',
    'epoch-convert': 'Epoch ↔ Date',
    'mod-headers': 'Mod Headers'
  };

  const STORAGE_KEY = 'dev-toolbox-selected-tool';
  const THEME_KEY = 'dev-toolbox-theme';
  const HEADERS_KEY = 'dev-toolbox-headers';
  const HEADERS_URL_KEY = 'dev-toolbox-headers-url';
  const TOOLS_NO_INPUT = new Set(['uuid-generate', 'epoch-convert']);

  const sidebar = document.querySelector('.sidebar');
  const toolBtns = document.querySelectorAll('.tool-btn');
  const inputEl = document.getElementById('input-text');
  const outputEl = document.getElementById('output-text');
  const convertBtn = document.getElementById('convert-btn');
  const inputArea = document.getElementById('input-area');
  const themeBtn = document.getElementById('theme-btn');
  const themeIcon = document.getElementById('theme-icon');
  const mainContent = document.getElementById('main-content');
  const headersPanel = document.getElementById('headers-panel');
  const headersList = document.getElementById('headers-list');
  const headersUrl = document.getElementById('headers-url');
  const headersAddBtn = document.getElementById('headers-add-btn');
  const headersCopyCurl = document.getElementById('headers-copy-curl');
  const headersCopyFetch = document.getElementById('headers-copy-fetch');
  const headersPreview = document.getElementById('headers-preview');

  let selectedTool = localStorage.getItem(STORAGE_KEY) || 'base64-encode';
  if (!TOOLS[selectedTool]) selectedTool = 'base64-encode';

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '☀️';
      themeBtn.setAttribute('title', 'Switch to light theme');
      themeBtn.setAttribute('aria-label', 'Switch to light theme');
    } else {
      root.removeAttribute('data-theme');
      themeIcon.textContent = '🌙';
      themeBtn.setAttribute('title', 'Switch to dark theme');
      themeBtn.setAttribute('aria-label', 'Switch to dark theme');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === 'dark' ? 'dark' : 'light');
  })();

  function setOutput(text, isEmpty) {
    outputEl.textContent = text;
    outputEl.classList.toggle('empty', !!isEmpty);
  }

  function base64Encode(input) {
    try {
      return btoa(unescape(encodeURIComponent(input)));
    } catch (e) {
      throw new Error('Encoding failed: ' + (e && e.message ? e.message : 'Unknown error'));
    }
  }

  function base64Decode(input) {
    try {
      return decodeURIComponent(escape(atob(input.trim())));
    } catch (e) {
      throw new Error('Decoding failed: invalid Base64 or encoding. ' + (e && e.message ? e.message : ''));
    }
  }

  function urlEncode(input) {
    return encodeURIComponent(input);
  }

  function urlDecode(input) {
    try {
      return decodeURIComponent(input.replace(/\+/g, ' '));
    } catch (e) {
      throw new Error('URL decode failed: ' + (e && e.message ? e.message : ''));
    }
  }

  function jsonValidate(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { valid: false, message: 'No input to validate.' };
    }
    try {
      const parsed = JSON.parse(trimmed);
      const pretty = JSON.stringify(parsed, null, 2);
      return { valid: true, message: 'Valid JSON.\n\n' + pretty };
    } catch (e) {
      const msg = e && e.message ? e.message : 'Unknown error';
      return { valid: false, message: 'Invalid JSON.\n\n' + msg };
    }
  }

  function jwtDecode(input) {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('Paste a JWT token.');
    const parts = trimmed.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT: expected 3 parts separated by dots.');
    try {
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const exp = payload.exp ? '\n  exp (expires): ' + new Date(payload.exp * 1000).toISOString() : '';
      return 'Header:\n' + JSON.stringify(header, null, 2) + '\n\nPayload:\n' + JSON.stringify(payload, null, 2) + exp;
    } catch (e) {
      throw new Error('JWT decode failed: ' + (e && e.message ? e.message : 'invalid base64 or JSON'));
    }
  }

  function uuidGenerate(input) {
    const count = Math.min(100, Math.max(1, parseInt(input.trim(), 10) || 1));
    const uuids = [];
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID());
    }
    return uuids.join('\n');
  }

  function epochConvert(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      const now = Date.now();
      return 'Current timestamp (ms): ' + now + '\nCurrent timestamp (s):  ' + Math.floor(now / 1000) + '\n\nISO: ' + new Date().toISOString();
    }
    const num = Number(trimmed);
    if (!Number.isNaN(num)) {
      const ms = num < 1e12 ? num * 1000 : num;
      const d = new Date(ms);
      if (isNaN(d.getTime())) throw new Error('Invalid timestamp.');
      return 'Date: ' + d.toISOString() + '\nLocale: ' + d.toLocaleString();
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) throw new Error('Invalid date or timestamp.');
    return 'Timestamp (ms): ' + d.getTime() + '\nTimestamp (s):  ' + Math.floor(d.getTime() / 1000) + '\n\nISO: ' + d.toISOString();
  }

  function convert() {
    const input = inputEl.value;
    let result;
    try {
      switch (selectedTool) {
        case 'base64-encode':
          result = base64Encode(input);
          setOutput(result, !result);
          break;
        case 'base64-decode':
          result = base64Decode(input);
          setOutput(result, !result);
          break;
        case 'url-encode':
          result = urlEncode(input);
          setOutput(result, !result);
          break;
        case 'url-decode':
          result = urlDecode(input);
          setOutput(result, !result);
          break;
        case 'json-validate': {
          const out = jsonValidate(input);
          setOutput(out.message, false);
          break;
        }
        case 'jwt-decode':
          result = jwtDecode(input);
          setOutput(result, false);
          break;
        case 'uuid-generate':
          result = uuidGenerate(input);
          setOutput(result, false);
          break;
        case 'epoch-convert':
          result = epochConvert(input);
          setOutput(result, false);
          break;
        default:
          setOutput('Unknown tool.', true);
      }
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      setOutput('Error: ' + msg, false);
    }
    outputEl.focus({ preventScroll: true });
  }

  function selectTool(toolId) {
    if (!TOOLS[toolId]) return;
    selectedTool = toolId;
    localStorage.setItem(STORAGE_KEY, toolId);
    toolBtns.forEach(function (btn) {
      const isActive = btn.getAttribute('data-tool') === toolId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    const isModHeaders = toolId === 'mod-headers';
    if (mainContent) {
      mainContent.classList.toggle('main--mod-headers', isModHeaders);
    }
    if (isModHeaders) {
      updateHeadersPreview();
      return;
    }
    const needsInput = !TOOLS_NO_INPUT.has(toolId);
    inputArea.hidden = !needsInput;
    if (needsInput) {
      setOutput('Select a tool and click Convert.', true);
    } else {
      convert();
    }
  }

  function getHeadersFromDOM() {
    const rows = headersList.querySelectorAll('.headers-row');
    const out = [];
    rows.forEach(function (row) {
      const name = (row.querySelector('.headers-name') && row.querySelector('.headers-name').value || '').trim();
      const value = (row.querySelector('.headers-value') && row.querySelector('.headers-value').value || '').trim();
      if (name) out.push({ name: name, value: value });
    });
    return out;
  }

  function saveHeadersToStorage() {
    try {
      const headers = getHeadersFromDOM();
      localStorage.setItem(HEADERS_KEY, JSON.stringify(headers));
      localStorage.setItem(HEADERS_URL_KEY, headersUrl.value || '');
    } catch (e) {}
  }

  function loadHeadersFromStorage() {
    try {
      const raw = localStorage.getItem(HEADERS_KEY);
      const headers = raw ? JSON.parse(raw) : [];
      const url = localStorage.getItem(HEADERS_URL_KEY) || '';
      headersUrl.value = url;
      headersList.innerHTML = '';
      headers.forEach(function (h) {
        addHeaderRow(h.name, h.value);
      });
      if (headers.length === 0) addHeaderRow('Authorization', '');
    } catch (e) {
      addHeaderRow('Authorization', '');
    }
  }

  function addHeaderRow(name, value) {
    const row = document.createElement('div');
    row.className = 'headers-row';
    row.setAttribute('role', 'listitem');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'headers-name';
    nameInput.placeholder = 'Header name';
    nameInput.value = name || '';
    nameInput.autocomplete = 'off';
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'headers-value';
    valueInput.placeholder = 'Value';
    valueInput.value = value || '';
    valueInput.autocomplete = 'off';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'headers-remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', function () {
      row.remove();
      saveHeadersToStorage();
      updateHeadersPreview();
    });
    nameInput.addEventListener('input', function () {
      saveHeadersToStorage();
      updateHeadersPreview();
    });
    valueInput.addEventListener('input', function () {
      saveHeadersToStorage();
      updateHeadersPreview();
    });
    row.appendChild(nameInput);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);
    headersList.appendChild(row);
  }

  function buildCurl() {
    const url = (headersUrl.value || '').trim() || 'https://example.com';
    const headers = getHeadersFromDOM();
    let out = 'curl -X GET';
    headers.forEach(function (h) {
      out += ' -H "' + h.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + ': ' + h.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    });
    out += ' "' + url.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    return out;
  }

  function buildFetch() {
    const url = (headersUrl.value || '').trim() || 'https://example.com';
    const headers = getHeadersFromDOM();
    const headersObj = {};
    headers.forEach(function (h) {
      headersObj[h.name] = h.value;
    });
    const headersStr = JSON.stringify(headersObj, null, 2).replace(/\n/g, '\n  ');
    return 'fetch("' + url.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '", {\n  method: "GET",\n  headers: ' + headersStr + '\n});';
  }

  function updateHeadersPreview() {
    const headers = getHeadersFromDOM();
    if (headers.length === 0) {
      headersPreview.textContent = 'Add headers and use Copy as cURL or Copy as fetch.';
      return;
    }
    headersPreview.textContent = buildCurl();
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      return Promise.resolve();
    } finally {
      document.body.removeChild(ta);
    }
  }

  headersAddBtn.addEventListener('click', function () {
    addHeaderRow('', '');
    saveHeadersToStorage();
    updateHeadersPreview();
  });

  headersCopyCurl.addEventListener('click', function () {
    const text = buildCurl();
    copyToClipboard(text).then(function () {
      headersPreview.textContent = 'Copied to clipboard:\n\n' + text;
    }).catch(function () {
      headersPreview.textContent = 'Copy failed. Preview:\n\n' + text;
    });
  });

  headersCopyFetch.addEventListener('click', function () {
    const text = buildFetch();
    copyToClipboard(text).then(function () {
      headersPreview.textContent = 'Copied to clipboard:\n\n' + text;
    }).catch(function () {
      headersPreview.textContent = 'Copy failed. Preview:\n\n' + text;
    });
  });

  loadHeadersFromStorage();
  headersUrl.addEventListener('input', function () {
    saveHeadersToStorage();
    updateHeadersPreview();
  });

  sidebar.addEventListener('click', function (e) {
    const btn = e.target.closest('.tool-btn');
    if (btn && btn.hasAttribute('data-tool')) {
      selectTool(btn.getAttribute('data-tool'));
    }
  });

  convertBtn.addEventListener('click', convert);

  themeBtn.addEventListener('click', toggleTheme);

  inputEl.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      convert();
    }
  });

  selectTool(selectedTool);
})();
