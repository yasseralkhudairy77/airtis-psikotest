function safeStringify(value){
  try{
    return JSON.stringify(value ?? null);
  }catch{
    return JSON.stringify({ error: "payload_not_serializable" });
  }
}

export function buildAssessmentPayload({ session, result, manifest, testId }){
  const candidate = session?.candidate || {};
  const assessment = session?.assessment || {};
  const summary = buildSummary(testId, result);

  return {
    app_name: "AIRTIS Psikotest",
    submitted_at: new Date().toISOString(),
    token: session?.token || "",
    candidate_name: candidate.name || "",
    candidate_phone: candidate.phone || "",
    candidate_gender: candidate.gender || "",
    candidate_age: candidate.age || "",
    candidate_position: candidate.position || "",
    test_id: testId || manifest?.id || "",
    test_name: manifest?.name || testId || "",
    test_version: manifest?.version || "",
    duration_sec: result?.meta?.durationSec ?? "",
    started_at: assessment?.startedAt ? new Date(assessment.startedAt).toISOString() : "",
    finished_at: assessment?.finishedAt ? new Date(assessment.finishedAt).toISOString() : "",
    score_summary: summary.scoreSummary,
    interpretation_summary: summary.interpretationSummary,
    flags: safeStringify(result?.flags || []),
    raw_result_json: safeStringify(result),
    raw_session_json: safeStringify({
      token: session?.token || "",
      candidate,
      assessment
    })
  };
}

function buildSummary(testId, result){
  if(testId === "disc"){
    const score = result?.score || {};
    const dominant = score?.dominant || "";
    const graph = score?.graph?.line3 || {};
    const scoreSummary = [
      dominant ? `dominant=${dominant}` : "",
      `D=${graph.D ?? ""}`,
      `I=${graph.I ?? ""}`,
      `S=${graph.S ?? ""}`,
      `C=${graph.C ?? ""}`
    ].filter(Boolean).join(" | ");

    const interpretationSummary = result?.interpretation?.paragraph || "";
    return { scoreSummary, interpretationSummary };
  }

  if(testId === "iq"){
    const scoring = result?.scoring || {};
    return {
      scoreSummary: `score=${scoring.score ?? 0} / ${scoring.maxScore ?? 0} | correct=${scoring.correctCount ?? 0}`,
      interpretationSummary: `Section aktif terakhir: ${result?.activeSection || "-"}`
    };
  }

  if(testId === "kraepelin"){
    const scoring = result?.scoring || {};
    return {
      scoreSummary: [
        `correct=${scoring.correct ?? 0}`,
        `wrong=${scoring.wrong ?? 0}`,
        `attempts=${scoring.totalAttempts ?? 0}`,
        `columns=${scoring.lastColumn ?? 0}`
      ].join(" | "),
      interpretationSummary: `Peserta menyelesaikan hingga kolom ${scoring.lastColumn ?? 0}`
    };
  }

  return {
    scoreSummary: "",
    interpretationSummary: ""
  };
}

export function buildIqPayload({ session, payload }){
  return buildAssessmentPayload({
    session: {
      ...session,
      assessment: {
        testId: "iq",
        startedAt: payload?.meta?.startedAt || null,
        finishedAt: payload?.meta?.finishedAt || null
      }
    },
    result: payload,
    manifest: {
      id: "iq",
      name: "IQ / IST",
      version: "1.0.0"
    },
    testId: "iq"
  });
}

export function buildKraepelinPayload({ session, payload }){
  return buildAssessmentPayload({
    session: {
      ...session,
      assessment: {
        testId: "kraepelin",
        startedAt: payload?.meta?.startedAt || null,
        finishedAt: payload?.meta?.finishedAt || null
      }
    },
    result: payload,
    manifest: {
      id: "kraepelin",
      name: "Pauli Kraepelin",
      version: "1.0.0"
    },
    testId: "kraepelin"
  });
}
