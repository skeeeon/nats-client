// utils.js
import { els } from "./dom.js";

// --- HISTORY MANAGEMENT ---
let subjectHistory = JSON.parse(localStorage.getItem("nats_subject_history") || "[]");

export function renderHistory() {
  els.subHistory.innerHTML = subjectHistory.map(s => `<option value="${s}">`).join("");
}

export function addToHistory(subject) {
  if (!subject) return;
  subjectHistory = subjectHistory.filter(s => s !== subject);
  subjectHistory.unshift(subject);
  if (subjectHistory.length > 10) subjectHistory.pop();
  localStorage.setItem("nats_subject_history", JSON.stringify(subjectHistory));
  renderHistory();
}

// --- JSON BEAUTIFIER ---
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

// --- GLOBAL HELPERS (Attached to window for HTML onclicks) ---
window.copyToClipboard = (id) => {
  const el = document.getElementById(id);
  if (el) navigator.clipboard.writeText(el.innerText);
};

// Load Initial State
renderHistory();
