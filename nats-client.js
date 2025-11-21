import { connect, StringCodec, credsAuthenticator, headers } from "nats.ws";
import { Kvm } from "@nats-io/kv";
import { els } from "./dom.js";
import { renderMessage } from "./ui.js";

let nc = null;
let kv = null;
// We need to keep track of the watcher to stop it when switching buckets
let activeKvWatcher = null; 

const sc = StringCodec();
const subscriptions = new Map();
let subCounter = 0;
let statsInterval = null;

// --- CONNECTION ---
export async function connectToNats(url, authOptions, onDisconnectCb) {
  await disconnect(); 

  const opts = { servers: url, ignoreClusterUpdates: true };

  // Handle .creds file
  if (authOptions.credsFile) {
    let rawText = await authOptions.credsFile.text();
    const jwtIndex = rawText.indexOf("-----BEGIN NATS USER JWT-----");
    if (jwtIndex > 0) rawText = rawText.substring(jwtIndex);
    else if (jwtIndex === -1) throw new Error("Invalid .creds file");
    rawText = rawText.replace(/\r\n/g, "\n");
    opts.authenticator = credsAuthenticator(new TextEncoder().encode(rawText));
  } 
  // Handle Token
  else if (authOptions.token) {
    opts.token = authOptions.token;
  }
  // Handle User/Pass
  else if (authOptions.user) {
    opts.user = authOptions.user;
    opts.pass = authOptions.pass;
  }

  nc = await connect(opts);

  nc.closed().then((err) => {
    if (onDisconnectCb) onDisconnectCb(err);
  });

  startStatsLoop();
  return nc;
}

export async function disconnect() {
  if (statsInterval) clearInterval(statsInterval);
  if (activeKvWatcher) {
    activeKvWatcher.stop();
    activeKvWatcher = null;
  }
  
  if (nc) {
    await nc.close();
    nc = null;
  }
  
  kv = null;
  subscriptions.clear();
  subCounter = 0;
}

export function isConnected() { return !!nc; }

export function getServerInfo() {
  return nc ? nc.info : null;
}

// --- STATS LOOP ---
function startStatsLoop() {
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(async () => {
    if (!nc || nc.isClosed()) return;
    try {
      const rtt = await nc.rtt();
      els.rttLabel.innerText = `RTT: ${rtt}ms`;
      els.rttLabel.style.opacity = 1;
    } catch (e) {
      // ignore
    }
  }, 2000);
}

// --- MESSAGING ---
export function subscribe(subject) {
  if (!nc) throw new Error("Not Connected");
  
  const sub = nc.subscribe(subject);
  const id = ++subCounter;
  subscriptions.set(id, { sub, subject });

  (async () => {
    for await (const m of sub) {
      try {
        renderMessage(m.subject, sc.decode(m.data), false, m.headers);
      } catch (e) {
        renderMessage(m.subject, `[Binary Data: ${m.data.length} bytes]`, false, m.headers);
      }
    }
  })();

  return { id, subject, size: subscriptions.size };
}

export function unsubscribe(id) {
  const item = subscriptions.get(id);
  if (item) {
    item.sub.unsubscribe();
    subscriptions.delete(id);
    return subscriptions.size;
  }
  return subscriptions.size;
}

export function publish(subject, payload, headersJson) {
  if (!nc) return;
  const h = parseHeaders(headersJson);
  nc.publish(subject, sc.encode(payload), { headers: h });
}

export async function request(subject, payload, headersJson, timeout) {
  if (!nc) return;
  const h = parseHeaders(headersJson);
  const msg = await nc.request(subject, sc.encode(payload), { timeout, headers: h });
  
  let data;
  try {
    data = sc.decode(msg.data);
  } catch (e) {
    data = `[Binary Response: ${msg.data.length} bytes]`;
  }

  return { subject: msg.subject, data, headers: msg.headers };
}

function parseHeaders(jsonStr) {
  const val = jsonStr.trim();
  if (!val) return undefined;
  try {
    const h = headers();
    const obj = JSON.parse(val);
    for (const k in obj) h.append(k, String(obj[k]));
    return h;
  } catch (e) {
    throw new Error("Invalid Headers JSON");
  }
}

// --- KV STORE ---
export async function getKvBuckets() {
  if (!nc) return [];
  const kvm = new Kvm(nc);
  const list = [];
  for await (const status of await kvm.list()) {
    list.push(status.bucket);
  }
  return list;
}

export async function createKvBucket(name) {
    const kvm = new Kvm(nc);
    await kvm.create(name);
}

export async function openKvBucket(bucketName) {
  const kvm = new Kvm(nc);
  kv = await kvm.open(bucketName);
  return kv;
}

// NEW: Real-time watcher
export async function watchKvBucket(onKeyChange) {
  if (!kv) return;
  
  // Stop previous watch if exists
  if (activeKvWatcher) {
    activeKvWatcher.stop();
  }

  const iter = await kv.watch();
  activeKvWatcher = iter;

  (async () => {
    try {
      for await (const e of iter) {
        // e.operation is "PUT", "DEL", or "PURGE"
        onKeyChange(e.key, e.operation);
      }
    } catch (err) {
      console.log("Watcher stopped or error", err);
    }
  })();
}

export async function getKvValue(key) {
  if (!kv) throw new Error("No Bucket Open");
  const entry = await kv.get(key);
  if (!entry) return null;
  return {
    value: sc.decode(entry.value),
    revision: entry.revision
  };
}

// NEW: Get History
export async function getKvHistory(key) {
    if (!kv) return [];
    const hist = [];
    const iter = await kv.history({ key });
    for await (const e of iter) {
        hist.push({
            revision: e.revision,
            operation: e.operation,
            value: e.value ? sc.decode(e.value) : null,
            created: e.created
        });
    }
    // Return newest first
    return hist.reverse();
}

export async function putKvValue(key, value) {
  if (!kv) throw new Error("No Bucket Open");
  await kv.put(key, sc.encode(value));
}

export async function deleteKvValue(key) {
  if (!kv) throw new Error("No Bucket Open");
  await kv.delete(key);
}
