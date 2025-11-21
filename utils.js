import { els } from "./dom.js";

// --- HISTORY MANAGEMENT ---
let subjectHistory = JSON.parse(localStorage.getItem("nats_subject_history") || "[]");
let urlHistory = JSON.parse(localStorage.getItem("nats_url_history") || "[]");

export function renderHistory() {
  els.subHistory.innerHTML = subjectHistory.map(s => `<option value="${s}">`).join("");
  els.urlHistory.innerHTML = urlHistory.map(u => `<option value="${u}">`).join("");
}

export function addToHistory(subject) {
  if (!subject) return;
  subjectHistory = subjectHistory.filter(s => s !== subject);
  subjectHistory.unshift(subject);
  if (subjectHistory.length > 10) subjectHistory.pop();
  localStorage.setItem("nats_subject_history", JSON.stringify(subjectHistory));
  renderHistory();
}

export function addToUrlHistory(url) {
  if (!url) return;
  urlHistory = urlHistory.filter(u => u !== url);
  urlHistory.unshift(url);
  if (urlHistory.length > 5) urlHistory.pop();
  localStorage.setItem("nats_url_history", JSON.stringify(urlHistory));
  renderHistory();
}

// --- JSON UTILS ---
export function beautify(el) {
  const val = el.value.trim();
  if (!val) return;
  try { 
    const obj = JSON.parse(val); 
    el.value = JSON.stringify(obj, null, 2); 
  } catch (e) { 
    // Ignore invalid JSON
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

// --- GLOBAL HELPERS (Attached to window for HTML onclicks) ---
window.copyToClipboard = (id) => {
  const el = document.getElementById(id);
  if (el) navigator.clipboard.writeText(el.innerText);
};

// Load Initial State
renderHistory();
