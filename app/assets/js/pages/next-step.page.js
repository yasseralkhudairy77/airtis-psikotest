import { qs } from "../core/utils.js";
import { Storage } from "../core/storage.js";

const steps = {
  disc: {
    title: "Tes DISC Selesai",
    copy: "Silakan lanjut ke tes berikutnya: SPM Raven.",
    button: "Lanjut ke SPM Raven",
    href: "spm/index.html",
    next: "spm"
  },
  spm: {
    title: "Tes SPM Raven Selesai",
    copy: "Silakan lanjut ke tes berikutnya: Pauli Kraepelin.",
    button: "Lanjut ke Pauli Kraepelin",
    href: "kraepelin.html",
    next: "kraepelin"
  },
  kraepelin: {
    title: "Seluruh Tes Selesai",
    copy: "Terima kasih. Seluruh rangkaian tes kandidat telah selesai.",
    button: "Kembali ke Halaman Awal",
    href: "index.html",
    next: null
  }
};

const done = qs("done") || "disc";
const config = steps[done] || steps.disc;

document.getElementById("title").textContent = config.title;
document.getElementById("copy").textContent = config.copy;
document.getElementById("next-btn").textContent = config.button;
document.getElementById("next-btn").addEventListener("click", () => {
  const session = Storage.getSession() || {};
  Storage.setSession({
    ...session,
    assessmentFlow: {
      ...(session.assessmentFlow || {}),
      current: config.next
    }
  });
  window.location.href = config.href;
});
