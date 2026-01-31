(function () {
  'use strict';

  const TOOLS = {
    'base64-encode': 'Base64 Encode',
    'base64-decode': 'Base64 Decode',
    'url-encode': 'URL Encode',
    'url-decode': 'URL Decode',
    'html-encode': 'HTML Encode',
    'html-decode': 'HTML Decode',
    'unicode-escape': 'Unicode Escape',
    'unicode-unescape': 'Unicode Unescape',
    'binary-to-text': 'Binary to Text',
    'text-to-binary': 'Text to Binary',
    'hex-to-text': 'Hex to Text',
    'text-to-hex': 'Text to Hex',
    'ascii-table': 'ASCII Table',
    'json-validate': 'JSON Validate',
    'uppercase': 'Uppercase',
    'lowercase': 'Lowercase',
    'camel-case': 'CamelCase',
    'snake-case': 'Snake_case',
    'kebab-case': 'Kebab-case',
    'remove-extra-spaces': 'Remove extra spaces',
    'sort-lines': 'Sort lines',
    'remove-duplicate-lines': 'Remove duplicate lines',
    'line-word-char-counter': 'Line / Word / Char counter',
    'find-replace': 'Find & Replace'
  };

  const STORAGE_KEY = 'dev-toolbox-selected-tool';

  const sidebar = document.querySelector('.sidebar');
  const toolBtns = document.querySelectorAll('.tool-btn');
  const inputEl = document.getElementById('input-text');
  const outputEl = document.getElementById('output-text');
  const convertBtn = document.getElementById('convert-btn');
  const findReplaceRow = document.getElementById('find-replace-row');
  const findInput = document.getElementById('find-input');
  const replaceInput = document.getElementById('replace-input');

  let selectedTool = localStorage.getItem(STORAGE_KEY) || 'base64-encode';

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

  const htmlEncodeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function htmlEncode(input) {
    return input.replace(/[&<>"']/g, function (ch) { return htmlEncodeMap[ch]; });
  }

  const htmlDecodeMap = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" };
  function htmlDecode(input) {
    return input.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;/g, function (m) { return htmlDecodeMap[m]; });
  }

  function unicodeEscape(input) {
    return input.split('').map(function (c) {
      const code = c.charCodeAt(0);
      return code > 127 ? '\\u' + ('0000' + code.toString(16)).slice(-4) : c;
    }).join('');
  }

  function unicodeUnescape(input) {
    return input.replace(/\\u([0-9a-fA-F]{4})/g, function (_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    });
  }

  function binaryToText(input) {
    const s = input.replace(/\s/g, '');
    if (!/^[01]*$/.test(s) || s.length % 8 !== 0) {
      throw new Error('Invalid binary: use only 0 and 1, length must be multiple of 8.');
    }
    const bytes = [];
    for (let i = 0; i < s.length; i += 8) {
      bytes.push(parseInt(s.slice(i, i + 8), 2));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  function textToBinary(input) {
    const bytes = new TextEncoder().encode(input);
    return Array.from(bytes).map(function (b) {
      return ('00000000' + b.toString(2)).slice(-8);
    }).join(' ');
  }

  function hexToText(input) {
    const s = input.replace(/\s/g, '');
    if (!/^[0-9a-fA-F]*$/.test(s) || s.length % 2 !== 0) {
      throw new Error('Invalid hex: use 0-9 and a-f, length must be even.');
    }
    const bytes = [];
    for (let i = 0; i < s.length; i += 2) {
      bytes.push(parseInt(s.slice(i, i + 2), 16));
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  function textToHex(input) {
    const bytes = new TextEncoder().encode(input);
    return Array.from(bytes).map(function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join(' ');
  }

  function asciiTable() {
    const lines = ['Dec  Hex  Char | Dec  Hex  Char | Dec  Hex  Char | Dec  Hex  Char'];
    for (let row = 0; row < 32; row++) {
      const cells = [];
      for (let col = 0; col < 4; col++) {
        const dec = row + col * 32;
        const hex = dec.toString(16).toUpperCase().padStart(2, '0');
        const char = dec >= 32 && dec < 127 ? String.fromCharCode(dec) : (dec === 127 ? 'DEL' : '');
        cells.push((dec + '').padStart(3) + '  ' + hex + '   ' + (char || '').padEnd(3));
      }
      lines.push(cells.join(' | '));
    }
    return lines.join('\n');
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

  function toCamelCase(input) {
    return input.trim().split(/[\s_-]+/).map(function (word, i) {
      const w = word.toLowerCase();
      return i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1);
    }).join('');
  }

  function toSnakeCase(input) {
    return input.trim().replace(/\s+/g, '_').replace(/-/g, '_').toLowerCase();
  }

  function toKebabCase(input) {
    return input.trim().replace(/\s+/g, '-').replace(/_/g, '-').toLowerCase();
  }

  function removeExtraSpaces(input) {
    return input.split('\n').map(function (line) {
      return line.trim().replace(/\s+/g, ' ');
    }).join('\n').trim();
  }

  function sortLines(input) {
    return input.split('\n').filter(Boolean).sort().join('\n');
  }

  function removeDuplicateLines(input) {
    const seen = new Set();
    return input.split('\n').filter(function (line) {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    }).join('\n');
  }

  function lineWordCharCounter(input) {
    const lines = input.split('\n');
    const lineCount = lines.length;
    const text = input.trim();
    const words = text ? text.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const charCount = input.length;
    const charCountNoSpaces = input.replace(/\s/g, '').length;
    return 'Lines: ' + lineCount + '\nWords: ' + wordCount + '\nCharacters: ' + charCount + '\nCharacters (no spaces): ' + charCountNoSpaces;
  }

  function doFindReplace(input, findStr, replaceStr) {
    if (!findStr) return input;
    return input.split(findStr).join(replaceStr);
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
        case 'html-encode':
          result = htmlEncode(input);
          setOutput(result, !result);
          break;
        case 'html-decode':
          result = htmlDecode(input);
          setOutput(result, !result);
          break;
        case 'unicode-escape':
          result = unicodeEscape(input);
          setOutput(result, !result);
          break;
        case 'unicode-unescape':
          result = unicodeUnescape(input);
          setOutput(result, !result);
          break;
        case 'binary-to-text':
          result = binaryToText(input);
          setOutput(result, !result);
          break;
        case 'text-to-binary':
          result = textToBinary(input);
          setOutput(result, !result);
          break;
        case 'hex-to-text':
          result = hexToText(input);
          setOutput(result, !result);
          break;
        case 'text-to-hex':
          result = textToHex(input);
          setOutput(result, !result);
          break;
        case 'ascii-table':
          result = asciiTable();
          setOutput(result, false);
          break;
        case 'json-validate': {
          const out = jsonValidate(input);
          setOutput(out.message, false);
          break;
        }
        case 'uppercase':
          result = input.toUpperCase();
          setOutput(result, !result);
          break;
        case 'lowercase':
          result = input.toLowerCase();
          setOutput(result, !result);
          break;
        case 'camel-case':
          result = toCamelCase(input);
          setOutput(result, !result);
          break;
        case 'snake-case':
          result = toSnakeCase(input);
          setOutput(result, !result);
          break;
        case 'kebab-case':
          result = toKebabCase(input);
          setOutput(result, !result);
          break;
        case 'remove-extra-spaces':
          result = removeExtraSpaces(input);
          setOutput(result, !result);
          break;
        case 'sort-lines':
          result = sortLines(input);
          setOutput(result, !result);
          break;
        case 'remove-duplicate-lines':
          result = removeDuplicateLines(input);
          setOutput(result, !result);
          break;
        case 'line-word-char-counter':
          result = lineWordCharCounter(input);
          setOutput(result, false);
          break;
        case 'find-replace':
          result = doFindReplace(input, (findInput.value || ''), (replaceInput.value || ''));
          setOutput(result, !result);
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
    findReplaceRow.hidden = toolId !== 'find-replace';
    setOutput('Select a tool and click Convert.', true);
  }

  sidebar.addEventListener('click', function (e) {
    const btn = e.target.closest('.tool-btn');
    if (btn && btn.hasAttribute('data-tool')) {
      selectTool(btn.getAttribute('data-tool'));
    }
  });

  convertBtn.addEventListener('click', convert);

  inputEl.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      convert();
    }
  });

  selectTool(selectedTool);
})();
