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

  return {
    scoreSummary: "",
    interpretationSummary: ""
  };
}
