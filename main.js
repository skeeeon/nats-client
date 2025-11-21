import { connect, StringCodec, credsAuthenticator, headers } from "nats.ws";

// --- STATE ---
let nc = null;
const sc = StringCodec();
const subscriptions = new Map(); 
let subCounter = 0;

// --- DOM ELEMENTS ---
const els = {
  url: document.getElementById("serverUrl"),
  creds: document.getElementById("credsFile"),
  btnConnect: document.getElementById("btnConnect"),
  statusText: document.getElementById("statusText"),
  statusDot: document.getElementById("statusDot"),
  
  subPanel: document.getElementById("subPanel"),
  appPanel: document.getElementById("appPanel"),
  
  subSubject: document.getElementById("subSubject"),
  btnSub: document.getElementById("btnSub"),
  subList: document.getElementById("subList"),
  subCount: document.getElementById("subCount"),
  subHistory: document.getElementById("subHistory"),
  
  pubSubject: document.getElementById("pubSubject"),
  pubPayload: document.getElementById("pubPayload"),
  
  // New Header & Timeout UI
  btnHeaderToggle: document.getElementById("btnHeaderToggle"),
  headerContainer: document.getElementById("headerContainer"),
  pubHeaders: document.getElementById("pubHeaders"),
  reqTimeout: document.getElementById("reqTimeout"),
  
  btnPub: document.getElementById("btnPub"),
  btnReq: document.getElementById("btnReq"),
  
  messages: document.getElementById("messages"),
  logFilter: document.getElementById("logFilter"),
  btnClear: document.getElementById("btnClear"),
};

// --- INIT & HISTORY ---
const savedUrl = localStorage.getItem("nats_url");
if (savedUrl) els.url.value = savedUrl;

const savedPubSubj = localStorage.getItem("nats_last_pub_subject");
if (savedPubSubj) els.pubSubject.value = savedPubSubj;

let subjectHistory = JSON.parse(localStorage.getItem("nats_subject_history") || "[]");
renderHistory();

function addToHistory(subject) {
  if (!subject) return;
  subjectHistory = subjectHistory.filter(s => s !== subject);
  subjectHistory.unshift(subject);
  if (subjectHistory.length > 10) subjectHistory.pop();
  localStorage.setItem("nats_subject_history", JSON.stringify(subjectHistory));
  renderHistory();
}

function renderHistory() {
  els.subHistory.innerHTML = subjectHistory.map(s => `<option value="${s}">`).join("");
}

// --- HEADER UI LOGIC ---
els.btnHeaderToggle.addEventListener("click", () => {
  const isHidden = els.headerContainer.style.display === "none";
  els.headerContainer.style.display = isHidden ? "block" : "none";
  els.btnHeaderToggle.innerText = isHidden ? "▼ Headers (Optional)" : "► Add Headers (Optional)";
});

// Helper to parse Headers JSON Input
const getHeaders = () => {
  const val = els.pubHeaders.value.trim();
  if (!val) return undefined;
  
  try {
    const h = headers(); // Create NATS headers object
    const obj = JSON.parse(val);
    for (const k in obj) {
      h.append(k, String(obj[k]));
    }
    return h;
  } catch (e) {
    alert("Invalid Headers JSON. Please check syntax.");
    return null; // Signal error
  }
};

// --- RENDER LOG ---
const renderMessage = (subject, data, isRpc = false, msgHeaders = null) => {
  const filterText = els.logFilter.value.toLowerCase();
  const fullText = (subject + data).toLowerCase();
  const isHidden = filterText && !fullText.includes(filterText);

  const div = document.createElement("div");
  div.className = "msg-entry";
  if (isHidden) div.style.display = "none";

  let content = data;
  try {
    const obj = JSON.parse(data);
    content = JSON.stringify(obj, null, 2); 
  } catch (e) {}

  const time = new Date().toLocaleTimeString();
  const badgeClass = isRpc ? "badge-rpc" : "badge-sub";
  const badgeText = isRpc ? "RPC" : "MSG";
  const msgId = `msg-${Date.now()}-${Math.random()}`;

  // Process Headers for display
  let headerHtml = "";
  if (msgHeaders) {
    const headerList = [];
    for (const [key, value] of msgHeaders) {
      headerList.push(`${key}: ${value}`);
    }
    if (headerList.length > 0) {
      headerHtml = `<div style="margin-top:4px;"><span class="badge badge-hdr">HEAD</span> <span style="color:#888; font-size:0.8em">${headerList.join(", ")}</span></div>`;
    }
  }

  div.innerHTML = `
    <div class="msg-meta">
      <span class="badge ${badgeClass}">${badgeText}</span>
      <span>${time}</span>
      <span style="color:#ddd; font-weight:bold;">${subject}</span>
      <button class="copy-btn" onclick="window.copyToClipboard('${msgId}')">Copy JSON</button>
    </div>
    ${headerHtml}
    <pre id="${msgId}">${content}</pre>
  `;
  els.messages.prepend(div);
  if (els.messages.children.length > 100) els.messages.lastChild.remove();
};

// --- FILTER & COPY ---
els.logFilter.addEventListener("keyup", (e) => {
  const val = e.target.value.toLowerCase();
  document.querySelectorAll(".msg-entry").forEach(entry => {
    entry.style.display = entry.innerText.toLowerCase().includes(val) ? "block" : "none";
  });
});

window.copyToClipboard = (id) => {
  const el = document.getElementById(id);
  if (el) navigator.clipboard.writeText(el.innerText);
};

// --- CONNECT ---
els.btnConnect.addEventListener("click", async () => {
  try {
    localStorage.setItem("nats_url", els.url.value);
    const opts = { servers: els.url.value, ignoreClusterUpdates: true };

    if (els.creds.files.length > 0) {
      const file = els.creds.files[0];
      let rawText = await file.text();
      const jwtIndex = rawText.indexOf("-----BEGIN NATS USER JWT-----");
      if (jwtIndex > 0) rawText = rawText.substring(jwtIndex);
      else if (jwtIndex === -1) throw new Error("Invalid .creds file");
      rawText = rawText.replace(/\r\n/g, "\n");
      opts.authenticator = credsAuthenticator(new TextEncoder().encode(rawText));
    }

    els.statusText.innerText = "Connecting...";
    nc = await connect(opts);

    els.statusText.innerText = "Connected";
    els.statusText.style.color = "#4CAF50";
    els.statusDot.classList.add("connected");
    els.btnConnect.disabled = true;
    els.url.disabled = true; 
    els.subPanel.style.display = "flex";
    els.appPanel.style.display = "flex";

  } catch (err) {
    els.statusText.innerText = "Error";
    els.statusText.style.color = "#d32f2f";
    alert(`Connection Failed: ${err.message}`);
  }
});

// --- SUBSCRIBE ---
els.btnSub.addEventListener("click", () => {
  const subject = els.subSubject.value.trim();
  if (!nc || !subject) return;
  addToHistory(subject);

  try {
    const sub = nc.subscribe(subject);
    const id = ++subCounter;
    subscriptions.set(id, { sub, subject });
    updateSubCount();

    const li = document.createElement("li");
    li.id = `sub-li-${id}`;
    li.innerHTML = `<span>${subject}</span><button class="danger" onclick="window.unsubscribe(${id})">X</button>`;
    els.subList.prepend(li);
    els.subSubject.value = "";

    (async () => {
      for await (const m of sub) {
        // Pass m.headers to renderMessage
        renderMessage(m.subject, sc.decode(m.data), false, m.headers);
      }
    })();
  } catch (err) {
    alert("Invalid Subject");
  }
});

window.unsubscribe = (id) => {
  const item = subscriptions.get(id);
  if (item) {
    item.sub.unsubscribe();
    subscriptions.delete(id);
    const li = document.getElementById(`sub-li-${id}`);
    if (li) li.remove();
    updateSubCount();
  }
};

function updateSubCount() {
  els.subCount.innerText = `(${subscriptions.size})`;
}

// --- PUBLISH ---
els.btnPub.addEventListener("click", () => {
  const subj = els.pubSubject.value.trim();
  const payload = els.pubPayload.value;
  if (!nc || !subj) return;
  
  const h = getHeaders();
  if (h === null) return; // Stop if headers are invalid JSON

  addToHistory(subj);
  localStorage.setItem("nats_last_pub_subject", subj);
  
  nc.publish(subj, sc.encode(payload), { headers: h });
  
  const originalText = els.btnPub.innerText;
  els.btnPub.innerText = "✓";
  setTimeout(() => els.btnPub.innerText = "Pub", 1000);
});

// --- REQUEST ---
els.btnReq.addEventListener("click", async () => {
  const subj = els.pubSubject.value.trim();
  const payload = els.pubPayload.value;
  if (!nc || !subj) return;
  
  const h = getHeaders();
  if (h === null) return;

  const timeoutVal = parseInt(els.reqTimeout.value) || 2000;

  addToHistory(subj);
  localStorage.setItem("nats_last_pub_subject", subj);
  
  els.btnReq.disabled = true;
  try {
    const msg = await nc.request(subj, sc.encode(payload), { timeout: timeoutVal, headers: h });
    // Pass msg.headers to renderMessage
    renderMessage(msg.subject, sc.decode(msg.data), true, msg.headers);
  } catch (err) {
    alert("Request Failed: Timeout");
  } finally {
    els.btnReq.disabled = false;
  }
});

// --- UTILS ---
els.subSubject.addEventListener("keyup", (e) => {
  if (e.key === "Enter") els.btnSub.click();
});

els.pubPayload.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") els.btnPub.click();
});

// Beautify JSON on blur
const beautify = (el) => {
  const val = el.value.trim();
  if (!val) return;
  try {
    const obj = JSON.parse(val);
    el.value = JSON.stringify(obj, null, 2);
  } catch (e) {}
};
els.pubPayload.addEventListener("blur", () => beautify(els.pubPayload));
els.pubHeaders.addEventListener("blur", () => beautify(els.pubHeaders));

els.btnClear.addEventListener("click", () => els.messages.innerHTML = "");
