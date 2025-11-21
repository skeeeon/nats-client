import { els } from "./dom.js";
import * as utils from "./utils.js";
import * as ui from "./ui.js";
import * as nats from "./nats-client.js";

// --- INIT ---
const savedUrl = localStorage.getItem("nats_url");
if (savedUrl) els.url.value = savedUrl;

// --- EVENT LISTENERS ---

// 1. CONNECT
els.btnConnect.addEventListener("click", async () => {
  if (nats.isConnected()) {
    try {
      ui.setConnectionState(false);
      ui.showToast("Disconnected", "info");
      await nats.disconnect();
    } catch (err) {
      ui.showToast(`Error disconnecting: ${err.message}`, "error");
    }
    return; 
  }

  try {
    const url = els.url.value;
    localStorage.setItem("nats_url", url);
    utils.addToUrlHistory(url);
    
    els.statusText.innerText = "Connecting...";
    
    // Gather Auth Options
    const authOptions = {
        credsFile: els.creds.files.length > 0 ? els.creds.files[0] : null,
        user: els.authUser.value.trim(),
        pass: els.authPass.value.trim(),
        token: els.authToken.value.trim()
    };
    
    await nats.connectToNats(url, authOptions, (err) => {
      ui.setConnectionState(false);
      if (err) {
        ui.showToast(`Connection Lost: ${err.message}`, "error");
        els.statusText.innerText = "Error";
        els.statusText.style.color = "#d32f2f";
      }
    });

    ui.setConnectionState(true);
    ui.showToast("Connected to NATS", "success");

    if (els.tabKv.classList.contains('active')) {
      loadKvBucketsWrapper();
    }

  } catch (err) {
    els.statusText.innerText = "Error";
    els.statusText.style.color = "#d32f2f";
    ui.showToast(`Connection Failed: ${err.message}`, "error");
  }
});

// 2. INFO MODAL
els.btnInfo.addEventListener("click", () => {
  const info = nats.getServerInfo();
  els.serverInfoPre.innerText = info ? JSON.stringify(info, null, 2) : "Not connected.";
  els.infoModal.style.display = "flex";
});
els.btnCloseModal.addEventListener("click", () => els.infoModal.style.display = "none");
document.addEventListener("keydown", (e) => { if (e.key === "Escape") els.infoModal.style.display = "none"; });

// 3. TABS
els.tabMsg.onclick = () => ui.switchTab('msg');
els.tabKv.onclick = () => {
  ui.switchTab('kv');
  if (nats.isConnected()) loadKvBucketsWrapper();
};

// 4. SUBSCRIBE
els.btnSub.addEventListener("click", () => {
  const subj = els.subSubject.value.trim();
  if (!subj) return;
  try {
    utils.addToHistory(subj);
    const { id, subject, size } = nats.subscribe(subj);
    const li = document.createElement("li");
    li.id = `sub-li-${id}`;
    // Click-to-Fill Logic added here
    li.innerHTML = `
      <span style="cursor:pointer;" title="Click to copy to Publish" 
            onclick="document.getElementById('pubSubject').value = '${subject}'">
        ${subject}
      </span>
      <button class="danger" onclick="window.unsubscribe(${id})">X</button>
    `;
    els.subList.prepend(li);
    els.subCount.innerText = `(${size})`;
    els.subSubject.value = "";
    ui.showToast(`Subscribed to ${subject}`, "success");
  } catch (err) { ui.showToast(err.message, "error"); }
});

window.unsubscribe = (id) => {
  const size = nats.unsubscribe(id);
  const li = document.getElementById(`sub-li-${id}`);
  if (li) li.remove();
  els.subCount.innerText = `(${size})`;
};

// 5. PUBLISH & REQUEST
els.btnPub.addEventListener("click", () => {
  const subj = els.pubSubject.value.trim();
  if (!subj) return;
  try {
    utils.addToHistory(subj);
    nats.publish(subj, els.pubPayload.value, els.pubHeaders.value);
    const originalText = els.btnPub.innerText;
    els.btnPub.innerText = "✓";
    setTimeout(() => els.btnPub.innerText = "Pub", 1000);
  } catch (err) { ui.showToast(err.message, "error"); }
});

els.btnReq.addEventListener("click", async () => {
  const subj = els.pubSubject.value.trim();
  const timeout = parseInt(els.reqTimeout.value) || 2000;
  try {
    utils.addToHistory(subj);
    els.btnReq.disabled = true;
    const msg = await nats.request(subj, els.pubPayload.value, els.pubHeaders.value, timeout);
    ui.renderMessage(msg.subject, msg.data, true, msg.headers);
  } catch (err) { ui.showToast(err.message, "error"); }
  finally { els.btnReq.disabled = false; }
});

// --- UI HELPERS ---
els.subSubject.addEventListener("keyup", (e) => { if (e.key === "Enter") els.btnSub.click(); });
els.pubPayload.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") els.btnPub.click(); });

// Validation & Beautify
els.pubPayload.addEventListener("input", () => utils.validateJsonInput(els.pubPayload));
els.pubHeaders.addEventListener("input", () => utils.validateJsonInput(els.pubHeaders));
els.kvValueInput.addEventListener("input", () => utils.validateJsonInput(els.kvValueInput));

els.pubPayload.addEventListener("blur", () => { if(utils.validateJsonInput(els.pubPayload)) utils.beautify(els.pubPayload); });
els.pubHeaders.addEventListener("blur", () => { if(utils.validateJsonInput(els.pubHeaders)) utils.beautify(els.pubHeaders); });
els.kvValueInput.addEventListener("blur", () => { if(utils.validateJsonInput(els.kvValueInput)) utils.beautify(els.kvValueInput); });

els.btnClear.addEventListener("click", () => els.messages.innerHTML = "");
els.logFilter.addEventListener("keyup", (e) => ui.filterLogs(e.target.value));
els.btnPause.addEventListener("click", ui.toggleLogPause);
els.btnHeaderToggle.addEventListener("click", () => {
  const isHidden = els.headerContainer.style.display === "none";
  els.headerContainer.style.display = isHidden ? "block" : "none";
  els.btnHeaderToggle.innerText = isHidden ? "▼ Headers (Optional)" : "► Add Headers (Optional)";
});

// --- KV LOGIC ---

// CREATE
els.btnKvCreate.addEventListener("click", async () => {
    const name = prompt("Enter new bucket name:");
    if(!name) return;
    try {
        await nats.createKvBucket(name);
        ui.showToast(`Bucket ${name} created`, "success");
        loadKvBucketsWrapper();
    } catch(e) { ui.showToast(e.message, "error"); }
});

// LOAD BUCKETS
async function loadKvBucketsWrapper() {
  try {
    const list = await nats.getKvBuckets();
    els.kvBucketSelect.innerHTML = '<option value="">-- Select a Bucket --</option>';
    list.sort().forEach(b => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.innerText = b;
      els.kvBucketSelect.appendChild(opt);
    });
    ui.setKvStatus(`Loaded ${list.length} buckets.`);
  } catch (e) { ui.setKvStatus("Error loading buckets", true); }
}
els.btnKvRefresh.addEventListener("click", loadKvBucketsWrapper);

// SELECT BUCKET & WATCH
const kvKeysMap = new Set(); 

els.kvBucketSelect.addEventListener("change", async () => {
  const bucket = els.kvBucketSelect.value;
  els.kvKeyList.innerHTML = '';
  kvKeysMap.clear();
  
  if (!bucket) return;
  
  try {
    await nats.openKvBucket(bucket);
    ui.setKvStatus(`Watching ${bucket}...`);
    
    // Start Watching
    nats.watchKvBucket((key, op) => {
        if (op === "DEL" || op === "PURGE") {
             kvKeysMap.delete(key);
             const el = document.getElementById(`kv-key-${key}`);
             if(el) el.remove();
        } else {
            if(!kvKeysMap.has(key)) {
                kvKeysMap.add(key);
                const div = document.createElement("div");
                div.className = "kv-key";
                div.id = `kv-key-${key}`;
                div.innerText = key;
                div.onclick = () => selectKeyWrapper(key, div);
                els.kvKeyList.appendChild(div);
            }
        }
    });

  } catch (e) { ui.setKvStatus(e.message, true); }
});

// SELECT KEY & GET HISTORY
async function selectKeyWrapper(key, uiEl) {
  document.querySelectorAll(".kv-key").forEach(e => e.classList.remove("active"));
  if (uiEl) uiEl.classList.add("active");
  else {
      const existing = document.getElementById(`kv-key-${key}`);
      if(existing) existing.classList.add("active");
  }

  els.kvKeyInput.value = key;
  els.kvValueInput.value = "Loading...";
  els.kvHistoryList.innerHTML = "Loading history...";

  try {
    // Get Current
    const res = await nats.getKvValue(key);
    if (res) {
      els.kvValueInput.value = res.value;
      utils.beautify(els.kvValueInput);
      ui.setKvStatus(`Loaded '${key}' (Rev: ${res.revision})`);
    } else {
      els.kvValueInput.value = "";
      ui.setKvStatus("Key not found", true);
    }

    // Get History
    const hist = await nats.getKvHistory(key);
    els.kvHistoryList.innerHTML = "";
    if(hist.length === 0) els.kvHistoryList.innerHTML = "No history found.";
    
    hist.forEach(h => {
        const row = document.createElement("div");
        row.style.borderBottom = "1px solid #333";
        row.style.padding = "4px";
        row.innerHTML = `
            <span style="color:var(--accent)">Rev ${h.revision}</span> 
            <span class="badge" style="font-size:0.7em">${h.operation}</span>
            <span style="float:right; color:#666;">${h.created.toLocaleTimeString()}</span>
        `;
        row.title = h.value; 
        els.kvHistoryList.appendChild(row);
    });

  } catch (e) { 
      els.kvValueInput.value = ""; 
      ui.setKvStatus(e.message, true); 
  }
}

els.btnKvGet.addEventListener("click", () => selectKeyWrapper(els.kvKeyInput.value));

// COPY KV
els.btnKvCopy.addEventListener("click", () => {
  const val = els.kvValueInput.value;
  if(!val) return;
  navigator.clipboard.writeText(val);
  const orig = els.btnKvCopy.innerText;
  els.btnKvCopy.innerText = "Copied!";
  setTimeout(() => els.btnKvCopy.innerText = orig, 1000);
});

els.btnKvPut.addEventListener("click", async () => {
  const key = els.kvKeyInput.value.trim();
  const val = els.kvValueInput.value;
  if (!key) return;
  try {
    await nats.putKvValue(key, val);
    ui.setKvStatus(`Saved '${key}'`);
    ui.showToast("Key Saved", "success");
    selectKeyWrapper(key);
  } catch (e) { ui.setKvStatus(e.message, true); ui.showToast(e.message, "error"); }
});

els.btnKvDelete.addEventListener("click", async () => {
  const key = els.kvKeyInput.value.trim();
  if (!key || !confirm(`Delete '${key}'?`)) return;
  try {
    await nats.deleteKvValue(key);
    ui.setKvStatus(`Deleted '${key}'`);
    els.kvValueInput.value = "";
    els.kvHistoryList.innerHTML = "Key deleted.";
    ui.showToast("Key Deleted", "info");
  } catch (e) { ui.setKvStatus(e.message, true); ui.showToast(e.message, "error"); }
});
