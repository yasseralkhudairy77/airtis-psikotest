import { ensureSession, updateSession } from "../core/session.js";
import { getTest } from "../tests/registry.js";
import { Storage } from "../core/storage.js";
import { qs } from "../core/utils.js";
import { buildAssessmentPayload } from "../core/payloads.js";
import { submitAssessmentResult } from "../core/api.js";

async function main(){
  const testId = qs("test");
  const { runner, manifest } = getTest(testId);

  const session = ensureSession();

  if(!session.candidate){
    window.location.href = "candidate.html";
    return;
  }

  if(!session.assessment || session.assessment.testId !== testId){
    updateSession({ assessment: { testId, startedAt: Date.now(), finishedAt: null } });
  }

  document.getElementById("title").textContent = manifest.name;

  const root = document.getElementById("test-root");
  const submitBtn = document.getElementById("btn-submit");
  const errorBox = document.getElementById("error-box");

  const api = runner.init({ root, session });

  submitBtn.addEventListener("click", async () => {
    errorBox.textContent = "";
    try{
      const result = api.submit();
      const end = Date.now();
      const start = Storage.getSession().assessment.startedAt;
      const durationSec = Math.round((end - start)/1000);

      const updatedSession = updateSession({ assessment: { ...Storage.getSession().assessment, finishedAt: end } });

      const savedResult = {
        testId,
        meta: { durationSec },
        ...result
      };

      Storage.saveResult(testId, savedResult);

      const payload = buildAssessmentPayload({
        session: updatedSession,
        result: savedResult,
        manifest,
        testId
      });

      try{
        const remote = await submitAssessmentResult(payload);
        Storage.saveResult(testId, {
          ...savedResult,
          sync: {
            status: remote?.skipped ? "skipped" : "success",
            at: Date.now(),
            response: remote || null
          }
        });
      }catch(syncError){
        Storage.saveResult(testId, {
          ...savedResult,
          sync: {
            status: "failed",
            at: Date.now(),
            message: syncError?.message || "Sinkronisasi gagal."
          }
        });
      }

      window.location.href = `next-step.html?done=${encodeURIComponent(testId)}`;
    }catch(err){
      errorBox.textContent = err?.message || "Terjadi kesalahan.";
    }
  });
}

main();
