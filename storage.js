// ============================================================================
// CENTRALIZED STORAGE MANAGEMENT
// ============================================================================
// All localStorage operations in one place
// Makes it easy to change storage backend or add encryption later

// ============================================================================
// STORAGE KEYS
// ============================================================================
// All keys defined as constants - easier to find/change/avoid typos

const KEYS = {
  CONNECTION_URL: "nats_url",
  SUBJECT_HISTORY: "nats_subject_history",
  URL_HISTORY: "nats_url_history",
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_SUBJECT_HISTORY = 10;
const MAX_URL_HISTORY = 5;

// ============================================================================
// CONNECTION URL
// ============================================================================

export function getLastUrl() {
  return localStorage.getItem(KEYS.CONNECTION_URL) || "";
}

export function saveUrl(url) {
  if (!url) return;
  localStorage.setItem(KEYS.CONNECTION_URL, url);
}

// ============================================================================
// SUBJECT HISTORY
// ============================================================================

export function getSubjectHistory() {
  try {
    const raw = localStorage.getItem(KEYS.SUBJECT_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load subject history:", e);
    return [];
  }
}

export function addSubjectToHistory(subject) {
  if (!subject) return;
  
  const history = getSubjectHistory();
  
  // Remove duplicates
  const filtered = history.filter(s => s !== subject);
  
  // Add to front
  filtered.unshift(subject);
  
  // Trim to max size
  const trimmed = filtered.slice(0, MAX_SUBJECT_HISTORY);
  
  try {
    localStorage.setItem(KEYS.SUBJECT_HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save subject history:", e);
  }
}

// ============================================================================
// URL HISTORY
// ============================================================================

export function getUrlHistory() {
  try {
    const raw = localStorage.getItem(KEYS.URL_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load URL history:", e);
    return [];
  }
}

export function addUrlToHistory(url) {
  if (!url) return;
  
  const history = getUrlHistory();
  
  // Remove duplicates
  const filtered = history.filter(u => u !== url);
  
  // Add to front
  filtered.unshift(url);
  
  // Trim to max size
  const trimmed = filtered.slice(0, MAX_URL_HISTORY);
  
  try {
    localStorage.setItem(KEYS.URL_HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    console.error("Failed to save URL history:", e);
  }
}

// ============================================================================
// UTILITY - CLEAR ALL DATA
// ============================================================================

export function clearAllData() {
  Object.values(KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to clear ${key}:`, e);
    }
  });
}
