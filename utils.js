// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

// Maximum items in subject/URL history (stored in localStorage)
// Keep UI snappy - more than 10 gets unwieldy to scan in dropdown
const MAX_SUBJECT_HISTORY = 10;
const MAX_URL_HISTORY = 5;

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

let subjectHistory = JSON.parse(localStorage.getItem("nats_subject_history") || "[]");
let urlHistory = JSON.parse(localStorage.getItem("nats_url_history") || "[]");

export function getSubjectHistory() { return subjectHistory; }
export function getUrlHistory() { return urlHistory; }

export function addSubjectHistory(subject) {
  if (!subject) return subjectHistory;
  subjectHistory = subjectHistory.filter(s => s !== subject);
  subjectHistory.unshift(subject);
  if (subjectHistory.length > MAX_SUBJECT_HISTORY) subjectHistory.pop();
  localStorage.setItem("nats_subject_history", JSON.stringify(subjectHistory));
  return subjectHistory;
}

export function addUrlHistory(url) {
  if (!url) return urlHistory;
  urlHistory = urlHistory.filter(u => u !== url);
  urlHistory.unshift(url);
  if (urlHistory.length > MAX_URL_HISTORY) urlHistory.pop();
  localStorage.setItem("nats_url_history", JSON.stringify(urlHistory));
  return urlHistory;
}

// ============================================================================
// JSON UTILITIES
// ============================================================================

export function beautify(el) {
  const val = el.value.trim();
  if (!val) return;
  try { 
    const obj = JSON.parse(val); 
    el.value = JSON.stringify(obj, null, 2); 
  } catch (e) { 
    // Ignore invalid JSON - user might still be typing
  }
}

export function validateJsonInput(el) {
  const val = el.value.trim();
  if (!val) {
    el.classList.remove("input-error");
    return true;
  }
  try {
    JSON.parse(val);
    el.classList.remove("input-error");
    return true;
  } catch (e) {
    el.classList.add("input-error");
    return false;
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

/**
 * Syntax highlight JSON for display
 * Returns HTML string with color-coded spans
 */
export function syntaxHighlight(json) {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
}

// ============================================================================
// GLOBAL HELPERS
// ============================================================================

/**
 * Copy element text to clipboard
 * Used by onclick handlers in rendered HTML
 */
window.copyToClipboard = (id) => {
  const el = document.getElementById(id);
  if (el) navigator.clipboard.writeText(el.innerText);
};
