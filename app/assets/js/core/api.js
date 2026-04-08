import { CONFIG } from "./config.js";

function withTimeout(promise, timeoutMs){
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timeout.")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function submitAssessmentResult(payload){
  if(!CONFIG.api.enabled || !CONFIG.api.endpoint){
    return { skipped: true, reason: "API endpoint belum diaktifkan." };
  }

  const response = await withTimeout(fetch(CONFIG.api.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  }), CONFIG.api.timeoutMs);

  const text = await response.text();
  let data = null;
  try{
    data = text ? JSON.parse(text) : null;
  }catch{
    data = { raw: text };
  }

  if(!response.ok){
    throw new Error(data?.message || `Gagal submit ke endpoint (${response.status}).`);
  }

  return data || { ok: true };
}
