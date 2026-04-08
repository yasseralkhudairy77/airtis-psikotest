import { CONFIG } from "./config.js";
export const Storage = {
  getSession() {
    const raw = localStorage.getItem(CONFIG.storageKey);
    return raw ? JSON.parse(raw) : null;
  },
  setSession(session) {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem(CONFIG.storageKey);
  },
  saveResult(testId, payload) {
    localStorage.setItem(CONFIG.resultKeyPrefix + testId, JSON.stringify(payload));
  },
  getResult(testId) {
    const raw = localStorage.getItem(CONFIG.resultKeyPrefix + testId);
    return raw ? JSON.parse(raw) : null;
  },
  getAllResults() {
    const out = {};
    for(let i = 0; i < localStorage.length; i += 1){
      const key = localStorage.key(i);
      if(!key || !key.startsWith(CONFIG.resultKeyPrefix)) continue;
      const testId = key.slice(CONFIG.resultKeyPrefix.length);
      try{
        out[testId] = JSON.parse(localStorage.getItem(key) || "null");
      }catch{
        out[testId] = null;
      }
    }
    return out;
  }
};
