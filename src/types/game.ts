// أنواع البيانات الأساسية للعبة (النسخة المُعاد تصميمها)

export type HypothesisId = 'H1' | 'H2' | 'H3';
export type EvidenceId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

export type CharacterId =
  | 'owner'
  | 'salesperson'
  | 'cashier'
  | 'stockkeeper'
  | 'customer';

export type ActionId =
  | 'talk_salesperson'
  | 'review_invoices'
  | 'check_stock'
  | 'talk_cashier'
  | 'talk_customer'
  | 'declare_solution'
  | 'end_investigation';

export type EvidenceType = 'factual' | 'misleading' | 'decisive' | 'supporting' | 'trap';

export type AttemptStatus = 'in_progress' | 'success' | 'failed' | 'no_decision';

export type CaseOutcome = 'correct' | 'incorrect' | 'no_decision';

export type ThinkingLevel = 'sound' | 'weak' | 'unacceptable';

export interface Hypothesis {
  id: HypothesisId;
  text: string;
  status: 'active' | 'rejected';
}

export interface Evidence {
  id: EvidenceId;
  text: string;
  type: EvidenceType;
  source: ActionId;
  trapMessage?: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  avatar: string;
}

export interface GameAction {
  id: ActionId;
  label: string;
  icon: string;
  yieldsEvidence: EvidenceId | null;
}

export interface Dialogue {
  character: CharacterId | null;
  lines: string[];
  hasEvidence: boolean;
  evidenceId?: EvidenceId;
}

export interface Scenario {
  id: string;
  title: string;
  domain: string;
  problem: string;
  correctHypothesis: HypothesisId;
  hypotheses: Hypothesis[];
  characters: Character[];
  actions: GameAction[];
  evidence: Evidence[];
  dialogues: Record<ActionId, Dialogue>;
}

export interface Step {
  stepNumber: number;
  action: ActionId | 'reject_hypothesis';
  hypothesis?: HypothesisId;
  evidence?: EvidenceId[];
  result?: string;
  valid?: boolean;
  timestamp: number;
}

export interface Attempt {
  attemptNumber: number;
  steps: Step[];
  discoveredEvidence: EvidenceId[];
  rejectedHypotheses: HypothesisId[];
  finalDecision?: {
    hypothesis: HypothesisId;
    evidence: EvidenceId[];
    outcome: CaseOutcome;
    justification: JustificationQuality;
  };
  status: AttemptStatus;
}

export interface GameSession {
  sessionId: string;
  startTime: number;
  currentAttempt: number;
  maxAttempts: number;
  maxSteps: number;
  attempts: Attempt[];
}

export interface TimelineItem {
  step: number;
  description: string;
  outcome: string;
  isPositive: boolean;
}

export type EvidenceStrength = 'strong' | 'weak' | 'invalid' | 'noise' | 'none';
export type EliminationQuality = 'both_correct' | 'one_correct' | 'none' | 'has_wrong';
export type NoiseQuality = 'clean' | 'overweighted_e2' | 'used_noise_e5';

export type JustificationQuality = EvidenceStrength;

export interface EvaluationCards {
  evidence: {
    level: EvidenceStrength;
    text: string;
  };
  elimination: {
    level: EliminationQuality;
    text: string;
  };
  noise: {
    level: NoiseQuality;
    text: string;
  };
}

export interface GameResult {
  outcome: CaseOutcome;
  outcomeTitle: string;
  thinking: ThinkingLevel;
  thinkingTitle: string;
  cards: EvaluationCards;
  feedbackText: string;
  timeline: TimelineItem[];
  attemptUsed: number;
}

// ===== قواعد اللعبة =====

export const GAME_LIMITS = {
  MAX_ATTEMPTS: 3,
  MAX_STEPS: 4, // خطوات التحقيق (جمع الأدلة فقط)
};

// قواعد رفض الفرضيات (Level 1)
export const REJECTION_RULES: Record<Exclude<HypothesisId, 'H3'>, {
  valid: EvidenceId[];
  trap: EvidenceId[];
}> = {
  H1: { valid: ['E1'], trap: ['E2', 'E5'] },
  H2: { valid: ['E3'], trap: ['E2', 'E5'] },
};

// قواعد تبرير الحل النهائي
// strong: دليل يفرّق بوضوح
// weak: مؤشر غير تشخيصي/لا يكفي وحده
// invalid/noise: غير صالح كتبرير
export const DECLARATION_RULES: Record<HypothesisId, {
  strong: EvidenceId[];
  weak: EvidenceId[];
  invalid: EvidenceId[];
  noise: EvidenceId[];
}> = {
  H1: {
    strong: [],
    weak: [],
    invalid: ['E1', 'E2', 'E3', 'E4'],
    noise: ['E5'],
  },
  H2: {
    strong: [],
    weak: ['E2'],
    invalid: ['E1', 'E3', 'E4'],
    noise: ['E5'],
  },
  H3: {
    strong: ['E3'],
    weak: ['E2', 'E4'],
    invalid: ['E1'],
    noise: ['E5'],
  },
};

// رسائل الفخاخ/الضجيج (مختصرة وواضحة)
export const TRAP_MESSAGES: Record<string, string> = {
  E2: 'الرقم ده مغري، لكنه لوحده لا يحدد السبب. لازم مؤشر يفرّق بين الفرضيات.',
  E5: 'ده رأي عام، مش دليل على المتجر ده تحديداً. حاول تعتمد على مؤشرات قابلة للقياس.',
};
