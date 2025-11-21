export const els = {
  // Toasts
  toastContainer: document.getElementById("toast-container"),

  // Connection & Info
  url: document.getElementById("serverUrl"),
  urlHistory: document.getElementById("urlHistory"),
  creds: document.getElementById("credsFile"),
  // Auth Inputs
  authUser: document.getElementById("authUser"),
  authPass: document.getElementById("authPass"),
  authToken: document.getElementById("authToken"),
  
  btnConnect: document.getElementById("btnConnect"),
  statusText: document.getElementById("statusText"),
  statusDot: document.getElementById("statusDot"),
  rttLabel: document.getElementById("rttLabel"),
  btnInfo: document.getElementById("btnInfo"),
  
  // Modal
  infoModal: document.getElementById("infoModal"),
  btnCloseModal: document.getElementById("btnCloseModal"),
  serverInfoPre: document.getElementById("serverInfoPre"),
  
  // Panels
  subPanel: document.getElementById("subPanel"),
  appPanel: document.getElementById("appPanel"),
  
  // Sidebar
  subSubject: document.getElementById("subSubject"),
  btnSub: document.getElementById("btnSub"),
  subList: document.getElementById("subList"),
  subCount: document.getElementById("subCount"),
  subHistory: document.getElementById("subHistory"),
  
  // Tabs
  tabMsg: document.getElementById("tabMsg"),
  tabKv: document.getElementById("tabKv"),
  tabStream: document.getElementById("tabStream"),
  panelMsg: document.getElementById("panelMsg"),
  panelKv: document.getElementById("panelKv"),
  panelStream: document.getElementById("panelStream"),

  // Messaging
  pubSubject: document.getElementById("pubSubject"),
  pubPayload: document.getElementById("pubPayload"),
  btnHeaderToggle: document.getElementById("btnHeaderToggle"),
  headerContainer: document.getElementById("headerContainer"),
  pubHeaders: document.getElementById("pubHeaders"),
  reqTimeout: document.getElementById("reqTimeout"),
  btnPub: document.getElementById("btnPub"),
  btnReq: document.getElementById("btnReq"),
  messages: document.getElementById("messages"),
  logFilter: document.getElementById("logFilter"),
  btnPause: document.getElementById("btnPause"),
  btnClear: document.getElementById("btnClear"),

  // KV Store
  btnKvRefresh: document.getElementById("btnKvRefresh"),
  btnKvCreate: document.getElementById("btnKvCreate"),
  kvBucketSelect: document.getElementById("kvBucketSelect"),
  kvKeyList: document.getElementById("kvKeyList"),
  kvKeyInput: document.getElementById("kvKeyInput"),
  kvValueInput: document.getElementById("kvValueInput"),
  kvHistoryList: document.getElementById("kvHistoryList"),
  btnKvCopy: document.getElementById("btnKvCopy"),
  btnKvGet: document.getElementById("btnKvGet"),
  btnKvPut: document.getElementById("btnKvPut"),
  btnKvDelete: document.getElementById("btnKvDelete"),
  kvStatus: document.getElementById("kvStatus"),
  
  // Streams
  btnStreamRefresh: document.getElementById("btnStreamRefresh"),
  streamList: document.getElementById("streamList"),
  streamDetailView: document.getElementById("streamDetailView"),
  streamEmptyState: document.getElementById("streamEmptyState"),
  
  // Stream Details
  streamNameTitle: document.getElementById("streamNameTitle"),
  streamCreated: document.getElementById("streamCreated"),
  streamSubjects: document.getElementById("streamSubjects"),
  streamStorage: document.getElementById("streamStorage"),
  streamRetention: document.getElementById("streamRetention"),
  streamMsgs: document.getElementById("streamMsgs"),
  streamBytes: document.getElementById("streamBytes"),
  streamFirstSeq: document.getElementById("streamFirstSeq"),
  streamLastSeq: document.getElementById("streamLastSeq"),
  streamConsumerCount: document.getElementById("streamConsumerCount"),
  
  // Stream Actions
  btnStreamPurge: document.getElementById("btnStreamPurge"),
  btnStreamDelete: document.getElementById("btnStreamDelete"),
  
  // Consumers (NEW)
  btnLoadConsumers: document.getElementById("btnLoadConsumers"),
  consumerList: document.getElementById("consumerList"),

  // Messages
  btnStreamViewMsgs: document.getElementById("btnStreamViewMsgs"),
  streamMsgContainer: document.getElementById("streamMsgContainer"),
};
