import { submitAssessmentResult } from '../assets/js/core/api.js';
import { buildSpmPayload } from '../assets/js/core/payloads.js';

const CONFIG = {
  totalQuestions: 60,
  optionCount: 8,
  imageDir: '../assets/spm-webp/',
  imageExt: '.webp',
  storageKey: 'spm_answers_v2',
  metaKey: 'spm_meta_v2',
  answerClickLayout: {
    startX: 0.07,
    startY: 0.59,
    cellWidth: 0.19,
    cellHeight: 0.11,
    gapX: 0.028,
    gapY: 0.046,
    columns: 4,
  },
};

const ANSWER_KEY = {
  A1: 4, A2: 5, A3: 1, A4: 2, A5: 6, A6: 3, A7: 6, A8: 2, A9: 1, A10: 3, A11: 4, A12: 5,
  B1: 2, B2: 6, B3: 1, B4: 2, B5: 1, B6: 3, B7: 5, B8: 6, B9: 4, B10: 3, B11: 4, B12: 5,
  C1: 8, C2: 2, C3: 3, C4: 8, C5: 7, C6: 4, C7: 5, C8: 1, C9: 7, C10: 6, C11: 1, C12: 2,
  D1: 3, D2: 4, D3: 3, D4: 7, D5: 8, D6: 6, D7: 5, D8: 4, D9: 1, D10: 2, D11: 5, D12: 6,
  E1: 7, E2: 6, E3: 8, E4: 2, E5: 1, E6: 5, E7: 1, E8: 6, E9: 3, E10: 2, E11: 4, E12: 5,
};

const IQ_CONVERSION_TABLE = {
  2: 62, 3: 62, 4: 65, 5: 66, 6: 66, 7: 66, 8: 69, 9: 70, 10: 72,
  11: 73, 12: 74, 13: 74, 14: 74, 15: 74, 16: 74, 17: 76, 18: 76,
  19: 77, 20: 77, 21: 78, 22: 79, 23: 80, 24: 81, 25: 82, 26: 84,
  27: 85, 28: 87, 29: 88, 30: 89, 31: 90, 32: 92, 33: 93, 34: 94,
  35: 96, 36: 97, 37: 98, 38: 99, 39: 100, 40: 101, 41: 102, 42: 104,
  43: 105, 44: 107, 45: 108, 46: 110, 47: 113, 48: 115, 49: 117,
  50: 120, 51: 122, 52: 124, 53: 125, 54: 126, 55: 129, 56: 130,
  57: 134, 58: 134, 59: 138, 60: 138,
};

const el = (id) => document.getElementById(id);

const state = {
  index: 0,
  answers: loadAnswers(),
  startedAt: loadMeta().startedAt || new Date().toISOString(),
  sync: loadMeta().sync || null,
};

const questionIds = buildQuestionIds(CONFIG.totalQuestions);
const questions = questionIds.map((id) => ({ id, img: `${CONFIG.imageDir}${id}${CONFIG.imageExt}` }));

const ui = {
  qImg: el('qImg'),
  qTitle: el('qTitle'),
  qIndexLabel: el('qIndexLabel'),
  qTotalLabel: el('qTotalLabel'),
  selectedLabel: el('selectedLabel'),
  answeredCount: el('answeredCount'),
  answeredCount2: el('answeredCount2'),
  totalCount: el('totalCount'),
  remainingCount: el('remainingCount'),
  barFill: el('barFill'),
  choices: el('choices'),
  numsGrid: el('numsGrid'),
  resultBox: el('resultBox'),
  syncStatus: el('syncStatus'),
  btnNextTest: el('btnNextTest'),
  btnPrev: el('btnPrev'),
  btnNext: el('btnNext'),
  btnClear: el('btnClear'),
  btnFinish: el('btnFinish'),
  btnCopy: el('btnCopy'),
  btnReset: el('btnReset'),
  modal: el('modal'),
  btnZoom: el('btnZoom'),
  btnCloseModal: el('btnCloseModal'),
  modalImg: el('modalImg'),
  modalTitle: el('modalTitle'),
};

init();

function init() {
  ui.qTotalLabel.textContent = String(questions.length);
  ui.totalCount.textContent = String(questions.length);
  renderNums();
  renderQuestion();
  updateProgress();
  renderSyncStatus();
  wireEvents();
}

function buildQuestionIds(total) {
  if (total <= 12) {
    return Array.from({ length: total }, (_, i) => `A${i + 1}`);
  }

  const sets = ['A', 'B', 'C', 'D', 'E'];
  const ids = [];
  for (const set of sets) {
    for (let n = 1; n <= 12; n += 1) {
      ids.push(`${set}${n}`);
    }
  }
  return ids.slice(0, total);
}

function loadAnswers() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
  } catch {
    return {};
  }
}

function loadMeta() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.metaKey) || '{}');
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.answers));
  localStorage.setItem(CONFIG.metaKey, JSON.stringify({ startedAt: state.startedAt, sync: state.sync }));
}

function renderSyncStatus() {
  if (!ui.syncStatus) return;
  if (!state.sync) {
    ui.syncStatus.textContent = 'Belum dikirim ke Google Sheet.';
    return;
  }
  if (state.sync.status === 'success') {
    ui.syncStatus.textContent = 'Berhasil dikirim ke Google Sheet.';
    return;
  }
  if (state.sync.status === 'failed') {
    ui.syncStatus.textContent = `Gagal kirim ke Google Sheet: ${state.sync.message || 'unknown error'}`;
    return;
  }
  ui.syncStatus.textContent = `Status sinkronisasi: ${state.sync.status}`;
}

function renderNums() {
  ui.numsGrid.innerHTML = '';
  questions.forEach((q, i) => {
    const node = document.createElement('div');
    node.className = 'num';
    node.textContent = String(i + 1);
    node.onclick = () => {
      state.index = i;
      renderQuestion();
    };
    ui.numsGrid.appendChild(node);
  });
}

function renderChoices(selected) {
  ui.choices.innerHTML = '';
  for (let i = 1; i <= CONFIG.optionCount; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `choiceBtn${Number(selected) === i ? ' selected' : ''}`;
    btn.textContent = String(i);
    btn.onclick = () => selectAnswer(i);
    ui.choices.appendChild(btn);
  }
}

function getAnswerRegions() {
  const layout = CONFIG.answerClickLayout;
  return Array.from({ length: CONFIG.optionCount }, (_, index) => {
    const col = index % layout.columns;
    const row = Math.floor(index / layout.columns);

    return {
      value: index + 1,
      left: layout.startX + (col * (layout.cellWidth + layout.gapX)),
      top: layout.startY + (row * (layout.cellHeight + layout.gapY)),
      width: layout.cellWidth,
      height: layout.cellHeight,
    };
  });
}

function getImageAnswerFromEvent(event, image) {
  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  for (const region of getAnswerRegions()) {
    const insideX = x >= region.left && x <= region.left + region.width;
    const insideY = y >= region.top && y <= region.top + region.height;
    if (insideX && insideY) return region.value;
  }

  return null;
}

function updateImageCursor(event) {
  const value = getImageAnswerFromEvent(event, ui.qImg);
  ui.qImg.style.cursor = value ? 'pointer' : 'default';
}

function renderQuestion() {
  const q = questions[state.index];
  ui.qTitle.textContent = q.id;
  ui.qIndexLabel.textContent = String(state.index + 1);

  ui.qImg.src = q.img;
  ui.qImg.alt = `Gambar soal ${q.id}`;
  ui.qImg.onerror = () => {
    ui.qImg.alt = `Gambar tidak ditemukan: ${q.img}`;
  };

  const selected = state.answers[q.id] ?? null;
  ui.selectedLabel.textContent = selected ? String(selected) : '-';

  renderChoices(selected);
  syncNums();
  ui.btnPrev.disabled = state.index === 0;
  ui.btnNext.disabled = state.index === questions.length - 1;
}

function syncNums() {
  [...ui.numsGrid.children].forEach((node, i) => {
    const q = questions[i];
    node.classList.toggle('active', i === state.index);
    node.classList.toggle('done', !!state.answers[q.id]);
  });
}

function updateProgress() {
  const answered = Object.keys(state.answers).length;
  ui.answeredCount.textContent = String(answered);
  ui.answeredCount2.textContent = String(answered);
  ui.remainingCount.textContent = String(questions.length - answered);
  ui.barFill.style.width = `${Math.round((answered / questions.length) * 100)}%`;
  syncNums();
}

function selectAnswer(value) {
  const q = questions[state.index];
  state.answers[q.id] = value;

  if (state.index < questions.length - 1) {
    state.index += 1;
  }

  saveState();
  renderQuestion();
  updateProgress();
}

function clearAnswer() {
  const q = questions[state.index];
  delete state.answers[q.id];
  saveState();
  renderQuestion();
  updateProgress();
}

function buildScore() {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  const details = questions.map((q) => {
    const user = state.answers[q.id] ?? null;
    const key = ANSWER_KEY[q.id] ?? null;
    const isCorrect = user !== null && key !== null && Number(user) === Number(key);

    if (user === null) unanswered += 1;
    else if (isCorrect) correct += 1;
    else wrong += 1;

    return { id: q.id, user, key, isCorrect };
  });

  return { total: questions.length, correct, wrong, unanswered, details };
}

function convertRawScoreToIq(rawScore) {
  const n = Number(rawScore);
  if (!Number.isFinite(n)) return null;

  const clamped = Math.max(2, Math.min(60, Math.round(n)));
  return IQ_CONVERSION_TABLE[clamped] ?? null;
}

function classifyIq(iqScore) {
  if (iqScore === null) return null;
  if (iqScore >= 140) return 'Genius';
  if (iqScore >= 130) return 'Very Superior';
  if (iqScore >= 120) return 'Superior';
  if (iqScore >= 110) return 'High Average';
  if (iqScore >= 90) return 'Average';
  if (iqScore >= 80) return 'Low Average';
  if (iqScore >= 70) return 'Borderline Defective';
  return 'Mentally Defective';
}

function buildPayload() {
  const score = buildScore();
  const iqScore = convertRawScoreToIq(score.correct);
  const startedAt = state.startedAt || new Date().toISOString();
  const endedAt = new Date().toISOString();

  return {
    test: 'SPM',
    total_questions: score.total,
    started_at: startedAt,
    ended_at: endedAt,
    duration_sec: Math.max(1, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)),
    score: {
      correct: score.correct,
      wrong: score.wrong,
      unanswered: score.unanswered,
      total: score.total,
      percent: Math.round((score.correct / score.total) * 100),
    },
    iq_result: {
      raw_score: score.correct,
      iq: iqScore,
      classification: classifyIq(iqScore),
    },
    answers: score.details,
  };
}

async function submitToGoogleSheet(payload) {
  const session = JSON.parse(localStorage.getItem('HRRS_SESSION') || 'null') || {};
  const response = await submitAssessmentResult(buildSpmPayload({
    session: {
      ...session,
      candidate: {
        ...(session.candidate || {}),
        name: session?.candidate?.name || '',
      }
    },
    payload,
  }));

  state.sync = {
    status: response?.skipped ? 'skipped' : 'success',
    response,
    at: new Date().toISOString(),
  };
  saveState();
  renderSyncStatus();
}

function wireEvents() {
  ui.btnPrev.onclick = () => {
    if (state.index > 0) {
      state.index -= 1;
      renderQuestion();
    }
  };

  ui.btnNext.onclick = () => {
    if (state.index < questions.length - 1) {
      state.index += 1;
      renderQuestion();
    }
  };

  ui.btnClear.onclick = clearAnswer;

  ui.btnFinish.onclick = async () => {
    const payload = buildPayload();
    ui.resultBox.value = JSON.stringify(payload, null, 2);
    try {
      await submitToGoogleSheet(payload);
    } catch (error) {
      state.sync = {
        status: 'failed',
        message: error?.message || 'Sinkronisasi gagal.',
        at: new Date().toISOString(),
      };
      saveState();
      renderSyncStatus();
    }
    if (ui.btnNextTest) {
      ui.btnNextTest.style.display = 'inline-block';
    }
  };

  if (ui.btnNextTest) {
    ui.btnNextTest.onclick = () => {
      const session = JSON.parse(localStorage.getItem('HRRS_SESSION') || 'null') || {};
      localStorage.setItem('HRRS_SESSION', JSON.stringify({
        ...session,
        assessmentFlow: {
          ...(session.assessmentFlow || {}),
          current: 'kraepelin',
        }
      }));
      window.location.href = '../kraepelin.html';
    };
  }

  ui.btnCopy.onclick = async () => {
    const text = ui.resultBox.value || JSON.stringify(buildPayload(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      ui.btnCopy.textContent = 'Copied OK';
      setTimeout(() => {
        ui.btnCopy.textContent = 'Copy JSON';
      }, 900);
    } catch {
      alert('Gagal copy. Blok teks lalu Ctrl+C.');
    }
  };

  ui.btnReset.onclick = () => {
    if (!confirm('Reset semua jawaban?')) return;
    localStorage.removeItem(CONFIG.storageKey);
    localStorage.removeItem(CONFIG.metaKey);
    location.reload();
  };

  ui.btnZoom.onclick = () => {
    const q = questions[state.index];
    ui.modalTitle.textContent = `Zoom ${q.id}`;
    ui.modalImg.src = q.img;
    ui.modal.classList.add('show');
  };

  ui.btnCloseModal.onclick = () => ui.modal.classList.remove('show');
  ui.modal.onclick = (event) => {
    if (event.target === ui.modal) {
      ui.modal.classList.remove('show');
    }
  };

  ui.qImg.onclick = (event) => {
    const value = getImageAnswerFromEvent(event, ui.qImg);
    if (value !== null) {
      selectAnswer(value);
    }
  };

  ui.qImg.onmousemove = updateImageCursor;
  ui.qImg.onmouseleave = () => {
    ui.qImg.style.cursor = 'default';
  };

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') ui.btnPrev.click();
    if (event.key === 'ArrowRight') ui.btnNext.click();
    if (event.key === 'Escape') ui.modal.classList.remove('show');

    if (/^\d$/.test(event.key)) {
      const n = Number(event.key);
      if (n >= 1 && n <= CONFIG.optionCount) selectAnswer(n);
    }
  });
}
