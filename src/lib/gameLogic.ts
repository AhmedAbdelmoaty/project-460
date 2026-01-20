import {
  Attempt,
  CaseOutcome,
  DECLARATION_RULES,
  EvidenceId,
  GameResult,
  GameSession,
  HypothesisId,
  JustificationQuality,
  REJECTION_RULES,
  Step,
  SuccessRank,
  TimelineItem,
  TRAP_MESSAGES,
} from '@/types/game';
import { mainScenario } from '@/data/scenario';

// =====================
// 1) التحقق من الرفض
// =====================
export function canRejectHypothesisWithEvidence(
  hypothesisId: Exclude<HypothesisId, 'H3'>,
  evidenceIds: EvidenceId[]
): { valid: boolean; isTrap: boolean; message?: string } {
  const evidenceId = evidenceIds[0];
  const rule = REJECTION_RULES[hypothesisId];

  if (!evidenceId) {
    return { valid: false, isTrap: false, message: 'لازم تختار دليل واحد على الأقل.' };
  }

  if (rule.trap.includes(evidenceId)) {
    return { valid: false, isTrap: true, message: TRAP_MESSAGES[evidenceId] };
  }

  if (rule.valid.includes(evidenceId)) {
    return { valid: true, isTrap: false };
  }

  return { valid: false, isTrap: false, message: 'الدليل ده ما ينفعش يرفض الفرضية دي بشكل منطقي.' };
}

// =====================
// 2) تقييم إعلان القرار
// =====================
export function evaluateDeclaration(
  hypothesisId: HypothesisId,
  evidenceIds: EvidenceId[]
): {
  outcome: CaseOutcome;
  justification: JustificationQuality;
} {
  if (!evidenceIds || evidenceIds.length === 0) {
    return { outcome: 'incorrect', justification: 'none' };
  }

  // لو اللاعب استخدم ضجيج ضمن التبرير
  if (evidenceIds.some((e) => DECLARATION_RULES[hypothesisId].noise.includes(e))) {
    // حتى لو الفرضية الصحيحة… تبرير ضجيج = غير مقبول
    return { outcome: 'incorrect', justification: 'noise' };
  }

  // لو استخدم دليل غير صالح ضمن التبرير
  if (evidenceIds.some((e) => DECLARATION_RULES[hypothesisId].invalid.includes(e))) {
    return { outcome: 'incorrect', justification: 'invalid' };
  }

  const hasStrong = evidenceIds.some((e) => DECLARATION_RULES[hypothesisId].strong.includes(e));
  const hasWeak = evidenceIds.some((e) => DECLARATION_RULES[hypothesisId].weak.includes(e));

  // H3 هي الفرضية الصحيحة
  if (hypothesisId === mainScenario.correctHypothesis) {
    if (hasStrong) return { outcome: 'correct', justification: 'strong' };
    if (hasWeak) return { outcome: 'correct', justification: 'weak' };
    // أي شيء غير كده = لا تبرير
    return { outcome: 'incorrect', justification: 'none' };
  }

  // H1/H2 خاطئين في هذا الكيس
  // حتى لو عنده مؤشر يوحي… النتيجة خاطئة.
  if (hasStrong || hasWeak) {
    return { outcome: 'incorrect', justification: hasStrong ? 'strong' : 'weak' };
  }

  return { outcome: 'incorrect', justification: 'none' };
}

// =====================
// 3) التقييم بالنقاط (بدون بطاقات)
// =====================

function countOpenedEvidenceBeforeDecision(steps: Step[]): number {
  const opened = new Set<EvidenceId>();
  for (const s of steps) {
    if (s.action === 'declare_solution') break;
    if (typeof s.result === 'string' && s.result.startsWith('discovered_')) {
      const id = s.result.replace('discovered_', '') as EvidenceId;
      opened.add(id);
    }
  }
  return opened.size;
}

function didUseEvidence(steps: Step[], evidenceId: EvidenceId): boolean {
  return steps.some((s) => Array.isArray(s.evidence) && s.evidence.includes(evidenceId));
}

function getSuccessRank(score: number): SuccessRank {
  if (score >= 300) return 'خبير';
  if (score >= 200) return 'محلل كويس';
  if (score >= 120) return 'على الطريق';
  return 'يحتاج تدريب';
}

function outcomeTitle(outcome: CaseOutcome): string {
  switch (outcome) {
    case 'correct':
      return 'قرار صحيح';
    case 'incorrect':
      return 'قرار غير صحيح';
    case 'no_decision':
      return 'بدون قرار';
  }
}

function buildScore(attempt: Attempt) {
  const breakdown: { label: string; points: number }[] = [];

  const decision = attempt.finalDecision;
  const outcome: CaseOutcome = decision?.outcome || (attempt.status === 'no_decision' ? 'no_decision' : 'incorrect');

  // 1) قرار متسرع: أعلن قرار قبل ما يفتح دليلين
  const openedBeforeDecision = countOpenedEvidenceBeforeDecision(attempt.steps || []);
  const rushedDecision = (attempt.steps || []).some((s) => s.action === 'declare_solution') && openedBeforeDecision < 2;

  // 2) نقاط القرار النهائي (الوزن الأكبر)
  let decisionPoints = 0;
  if (outcome === 'correct' && decision?.hypothesis === mainScenario.correctHypothesis) {
    if (decision.justification === 'strong') decisionPoints = 200;
    else if (decision.justification === 'weak') decisionPoints = 120;
  }

  // في حالة التسرع: سقف القرار ينخفض + خصم
  if (rushedDecision) {
    const capped = Math.min(decisionPoints, 120);
    if (capped !== decisionPoints) {
      decisionPoints = capped;
    }
    breakdown.push({ label: 'قرار متسرع (قبل فتح دليلين)', points: -20 });
  }

  if (decisionPoints > 0) {
    breakdown.push({
      label: decisionPoints === 200 ? 'قرار صحيح بتبرير قوي' : 'قرار صحيح بتبرير مقبول',
      points: decisionPoints,
    });
  }

  // 3) الاستبعاد الصحيح
  const validRejectH1 = (attempt.steps || []).some(
    (s) => s.action === 'reject_hypothesis' && s.valid === true && s.hypothesis === 'H1'
  );
  const validRejectH2 = (attempt.steps || []).some(
    (s) => s.action === 'reject_hypothesis' && s.valid === true && s.hypothesis === 'H2'
  );

  if (validRejectH1) breakdown.push({ label: 'استبعاد H1 بشكل صحيح', points: 60 });
  if (validRejectH2) breakdown.push({ label: 'استبعاد H2 بشكل صحيح', points: 60 });
  if (validRejectH1 && validRejectH2) breakdown.push({ label: 'مكافأة استبعاد البديلين', points: 40 });

  // 4) أخطاء الاستبعاد
  const wrongRejectCount = (attempt.steps || []).filter((s) => s.action === 'reject_hypothesis' && s.valid === false).length;
  if (wrongRejectCount > 0) breakdown.push({ label: `محاولات استبعاد غلط ×${wrongRejectCount}`, points: -15 * wrongRejectCount });

  // 5) ضجيج/فخاخ
  const usedE5 = didUseEvidence(attempt.steps || [], 'E5');
  if (usedE5) breakdown.push({ label: 'استخدام كلام عام كدليل', points: -25 });

  const usedOnlyE2InDecision = decision?.evidence?.length === 1 && decision.evidence[0] === 'E2';
  if (usedOnlyE2InDecision) breakdown.push({ label: 'اعتماد على مؤشر عام لوحده', points: -10 });

  // 6) كفاءة (اختياري)
  const openedTotal = Array.isArray(attempt.discoveredEvidence) ? attempt.discoveredEvidence.length : 0;
  const strongAndCorrect = outcome === 'correct' && decision?.justification === 'strong' && decision?.hypothesis === mainScenario.correctHypothesis;
  if (strongAndCorrect && openedTotal >= 2 && openedTotal <= 3) {
    breakdown.push({ label: 'كفاءة في استخدام خطوات التحقيق', points: 10 });
  }

  const score = Math.max(0, breakdown.reduce((sum, b) => sum + b.points, 0));
  return { score, breakdown, outcome, rushedDecision, wrongRejectCount, validRejectH1, validRejectH2, usedE5, usedOnlyE2InDecision };
}

// =====================
// 4) رسائل النهاية (بسيطة ومصرية)
// =====================
function buildEndMessage(meta: ReturnType<typeof buildScore>, attempt: Attempt): string {
  const decision = attempt.finalDecision;

  if (meta.outcome === 'no_decision') {
    return 'جمعت شوية معلومات بس ماحسمتش قرار. حتى لو مش متأكد 100% لازم تختار تفسير في الآخر.';
  }

  if (meta.outcome === 'incorrect') {
    if (meta.usedE5) {
      return 'القرار طلع غلط… وكمان اعتمدت على كلام عام. جرّب تركز على مؤشرات من جوه المحل.';
    }
    if (meta.rushedDecision) {
      return 'استعجلت في القرار. افتح دليلين على الأقل وبعدين احكم.';
    }
    if (!decision?.evidence || decision.evidence.length === 0 || decision.justification === 'none') {
      return 'حكمت من غير دليل واضح. افتح شوية أدلة وبعدين قرر.';
    }
    return 'القرار طلع غلط. جرّب المرة الجاية تقارن بين مؤشرين مختلفين قبل ما تقفل.';
  }

  // correct
  const eliminatedCount = (meta.validRejectH1 ? 1 : 0) + (meta.validRejectH2 ? 1 : 0);

  if (meta.rushedDecision) {
    return 'إجابتك صح… بس استعجلت. افتح دليلين على الأقل عشان مايبقاش الموضوع حظ.';
  }

  if (decision?.justification === 'strong') {
    if (eliminatedCount === 2 && meta.wrongRejectCount === 0 && !meta.usedE5) {
      return 'ممتاز جدًا: قرار صح بدليل قوي، وكمان استبعدت البديلين بشكل نظيف.';
    }
    if (eliminatedCount === 0) {
      return 'إجابتك صح بدليل قوي… بس كنت محتاج تستبعد بديل واحد على الأقل قبل ما تقفل.';
    }
    if (meta.wrongRejectCount > 0) {
      return 'إجابتك صح، وفي الآخر مشيت كويس… بس كان عندك محاولات استبعاد غلط في الأول.';
    }
    if (eliminatedCount === 1) {
      return 'تمام جدًا: قرار صح بدليل قوي. لو استبعدت البديل التاني كمان هتبقى أقوى.';
    }
    return 'قرار صح بدليل قوي. شغل كويس.';
  }

  // correct but weak
  if (meta.usedOnlyE2InDecision) {
    return 'إجابتك صح… بس اعتمدت على رقم لوحده. حاول تجيب دليل يفرق أكتر قبل ما تحسم.';
  }

  return 'إجابتك صح، بس تبريرك كان ضعيف شوية. حاول المرة الجاية تجيب دليل أقوى.';
}

// =====================
// 5) Timeline
// =====================
export function buildTimeline(steps: Step[]): TimelineItem[] {
  return steps.map((step, index) => {
    let description = '';
    let outcome = '';
    let isPositive = true;

    if (step.action === 'reject_hypothesis') {
      const hypothesis = mainScenario.hypotheses.find((h) => h.id === step.hypothesis);
      description = `رفض فرضية: ${hypothesis?.text}`;
      if (step.valid) {
        outcome = 'رفض صحيح ✓';
      } else {
        outcome = 'رفض غير صحيح ✗';
        isPositive = false;
      }
    } else if (step.action === 'declare_solution') {
      description = 'أعلنت القرار';
      outcome = step.result === 'correct' ? 'القرار صحيح ✓' : 'القرار غير صحيح ✗';
      isPositive = step.result === 'correct';
    } else if (step.action === 'end_investigation') {
      description = 'أنهيت التحقيق';
      outcome = 'بدون قرار';
      isPositive = false;
    } else {
      const action = mainScenario.actions.find((a) => a.id === step.action);
      description = action?.label || String(step.action);

      if (step.result?.startsWith('discovered_')) {
        const evidenceId = step.result.replace('discovered_', '') as EvidenceId;
        const evidence = mainScenario.evidence.find((e) => e.id === evidenceId);
        outcome = `اكتشفت مؤشر: ${evidence?.id}`;
      } else {
        outcome = '—';
      }
    }

    return {
      step: index + 1,
      description,
      outcome,
      isPositive,
    };
  });
}

// =====================
// 6) Game Result
// =====================

export function calculateAttemptResult(attempt: Attempt, attemptUsed: number): GameResult {
  const meta = buildScore(attempt);
  const message = buildEndMessage(meta, attempt);

  const result: GameResult = {
    outcome: meta.outcome,
    outcomeTitle: outcomeTitle(meta.outcome),
    score: meta.score,
    feedbackText: message,
    breakdown: meta.breakdown,
    timeline: buildTimeline(attempt.steps || []),
    attemptUsed,
  };

  if (meta.outcome === 'correct') {
    result.rank = getSuccessRank(meta.score);
  }

  return result;
}

export function calculateGameResult(session: GameSession): GameResult {
  const currentAttempt = session.attempts[session.currentAttempt - 1];

  // احتياط: لو مفيش محاولة (نادر)
  const attempt: Attempt =
    currentAttempt ||
    ({
      attemptNumber: session.currentAttempt,
      steps: [],
      discoveredEvidence: [],
      rejectedHypotheses: [],
      status: 'failed',
    } as Attempt);

  return calculateAttemptResult(attempt, session.currentAttempt);
}

export function generateGameOverFeedback(): string {
  // Feedback عام جدًا: لا يذكر الحل ولا اسم دليل بعينه
  return 'خلصت المحاولات. المرة الجاية حاول ما تعتمدش على مؤشر واحد… وقبل ما تحسم، استبعد بديل واحد بدليل مناسب.';
}
