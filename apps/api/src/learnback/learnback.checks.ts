import type { EvalDimension } from './learnback.types';

export type RubricFinding = {
  dimension: EvalDimension;
  evidence: string;
  suggestionIntent: string;
  priority: number;
  note?: string;
};

export type EvaluationResult = {
  status: 'feedback_available' | 'abstain';
  findings: RubricFinding[];
  unassessedDimensions: string[];
  abstainReason?: string;
};

/** Seeded educator-reviewed scenario content (system packs). */
export type ScenarioSeed = {
  packKey: string;
  revision: string;
  situation: string;
  corridorId: string;
  levelLabel: string;
  questionText: string;
  questionExplanation: string;
  intent: string;
  targetSkills: string[];
  followUpPrompts: string[];
  exampleAnswers: string[];
  phraseExamples: { phrase: string; meaning: string }[];
  rubricVersion: string;
  reviewerNote: string;
};

export const SYSTEM_SCENARIO_SEEDS: ScenarioSeed[] = [
  {
    packKey: 'interview_problem_solving',
    revision: 'interview_problem_solving_v1',
    situation: 'job_interview',
    corridorId: 'ak-en-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Tell me about a time you solved a problem at work or school.',
    questionExplanation:
      'Wɔrebisa wo sɛ ka bere bi a wokɔɔ so yɛɛ ɔhaw bi. Ka asɛm no pɔtee, dɛn na woyɛe, ne nea ɛbae.',
    intent: 'share_one_concrete_problem_action_result',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: [
      'What was the problem?',
      'What did you do?',
      'What changed afterward?',
    ],
    exampleAnswers: [
      'At my last job, our delivery list was wrong. I checked the orders, fixed two mistakes, and told my supervisor. The customer received the correct items the next day.',
    ],
    phraseExamples: [
      { phrase: 'I identified the issue', meaning: 'Mihuu ɔhaw no' },
      { phrase: 'I took responsibility', meaning: 'Migyee asɛdeɛ no' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'Native-reviewed interview prompt for adult practice — not hiring advice.',
  },
  {
    packKey: 'interview_problem_solving',
    revision: 'interview_problem_solving_v1',
    situation: 'job_interview',
    corridorId: 'en-ak-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Ka bere bi a wokɔɔ so yɛɛ ɔhaw bi wɔ adwuma anaa sukuu.',
    questionExplanation:
      'They want one clear story: the problem, what you did, and the result. Keep your facts; do not invent achievements.',
    intent: 'share_one_concrete_problem_action_result',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['Dɛn na ɔhaw no yɛ?', 'Dɛn na woyɛe?', 'Dɛn na ɛbae?'],
    exampleAnswers: [
      'Wɔ me adwuma a etwaam no, delivery list no yɛɛ mfomso. Mihwehwɛɛ orders no, mesiesiee mfomso mmienu, na meka kyerɛɛ me supervisor. Customer no nyaa nneɛma a ɛteɛ.',
    ],
    phraseExamples: [
      { phrase: 'Mihuu ɔhaw no', meaning: 'I identified the issue' },
      { phrase: 'Migyee asɛdeɛ no', meaning: 'I took responsibility' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'Practice in Akan/Twi with English explanations.',
  },
  {
    packKey: 'interview_teamwork',
    revision: 'interview_teamwork_v1',
    situation: 'job_interview',
    corridorId: 'ak-en-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Describe a time you worked with others to finish something important.',
    questionExplanation:
      'Ka sɛnea wone afoforo yɛɛ adwuma. Ka wo dwumadi, ɔkwan a modii so, ne nea mode wiee.',
    intent: 'describe_collaboration_with_clear_role',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['Who was involved?', 'What was your role?', 'How did you finish?'],
    exampleAnswers: [
      'Our team had to prepare a market stall before opening. I organized the price list while two coworkers set up the table. We opened on time and sold out of the morning stock.',
    ],
    phraseExamples: [
      { phrase: 'My role was…', meaning: 'Me dwumadi ne…' },
      { phrase: 'We finished together', meaning: 'Yɛwiee bom' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'Teamwork interview prompt — communication practice only.',
  },
  {
    packKey: 'customer_greeting',
    revision: 'customer_greeting_v1',
    situation: 'customer_service',
    corridorId: 'ak-en-customer',
    levelLabel: 'self_selected_beginner',
    questionText: 'A customer looks confused. What do you say first, and how do you help?',
    questionExplanation:
      'Ka nsɛm a wobɛka ahyɛ aseɛ, ɔkwan a wobɛfa so aboa, na woretie asɛm a ɔka.',
    intent: 'greet_offer_help_listen',
    targetSkills: ['relevance', 'completeness'],
    followUpPrompts: ['How do you greet them?', 'What question do you ask?'],
    exampleAnswers: [
      'Good morning. Welcome. How can I help you today? I can show you the right counter if you tell me what you need.',
    ],
    phraseExamples: [
      { phrase: 'How can I help you today?', meaning: 'Ɛyɛ dɛn na metumi aboa wo ɛnnɛ?' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'Customer-service practice; not employer training certification.',
  },
  {
    packKey: 'school_meeting_update',
    revision: 'school_meeting_update_v1',
    situation: 'school_meeting',
    corridorId: 'en-ak-school',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Ka nsɛm a ɛfa wo ba anaa sukuufoɔ bi ho wɔ nhyiamu yi mu.',
    questionExplanation:
      'Share one clear update: what happened, what support is needed, and the next step. This is practice speech, not formal school advice.',
    intent: 'give_clear_school_update',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['What happened?', 'What help is needed?', 'What is next?'],
    exampleAnswers: [
      'Me ba no yɛ nhoma yie, nanso ɔhia mmoa wɔ mathematics. Mesrɛ sɛ yɛbɛyɛ plan a ɛboa no wɔ fie.',
    ],
    phraseExamples: [
      { phrase: 'ɔhia mmoa', meaning: 'needs support' },
      { phrase: 'next step', meaning: 'anɔpa a ɛdi hɔ' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'School-meeting practice — not legal or counseling advice.',
  },
  {
    packKey: 'interview_problem_solving_fr',
    revision: 'interview_problem_solving_fr_v1',
    situation: 'job_interview',
    corridorId: 'en-fr-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Parlez-moi d’un problème que vous avez résolu au travail ou à l’école.',
    questionExplanation:
      'Give one concrete story: the problem, your action, and the result. Keep your real facts.',
    intent: 'share_one_concrete_problem_action_result',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['Quel était le problème?', 'Qu’avez-vous fait?', 'Quel a été le résultat?'],
    exampleAnswers: [
      'Dans mon dernier emploi, la liste de livraison était incorrecte. J’ai vérifié les commandes, corrigé deux erreurs et informé mon responsable. Le client a reçu les bons articles le lendemain.',
    ],
    phraseExamples: [
      { phrase: 'J’ai identifié le problème', meaning: 'I identified the issue' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'French practice with English explanations.',
  },
  {
    packKey: 'interview_problem_solving_fr_en',
    revision: 'interview_problem_solving_fr_en_v1',
    situation: 'job_interview',
    corridorId: 'fr-en-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Tell me about a time you solved a problem at work or school.',
    questionExplanation:
      'On vous demande une histoire claire: le problème, votre action et le résultat. Ne inventez pas de réussites.',
    intent: 'share_one_concrete_problem_action_result',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['What was the problem?', 'What did you do?', 'What was the result?'],
    exampleAnswers: [
      'At school, our group project file was missing. I rebuilt the outline from our notes, assigned tasks, and we submitted on time.',
    ],
    phraseExamples: [
      { phrase: 'I fixed the issue', meaning: 'J’ai résolu le problème' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'English practice with French explanations.',
  },
  {
    packKey: 'workplace_status_update_fr',
    revision: 'workplace_status_update_fr_v1',
    situation: 'workplace_conversation',
    corridorId: 'en-fr-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Donnez une mise à jour claire sur une tâche en cours à un collègue.',
    questionExplanation:
      'Share status, blockers, and the next step. Keep facts modest; this is practice speech, not a performance review.',
    intent: 'give_clear_workplace_status',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['What is done?', 'What is blocked?', 'What is next?'],
    exampleAnswers: [
      'La liste des commandes est terminée. Il me manque deux prix du fournisseur. Je les confirme demain matin et j’envoie le fichier.',
    ],
    phraseExamples: [
      { phrase: 'Voici mon statut', meaning: 'Here is my status' },
      { phrase: 'Prochaine étape', meaning: 'Next step' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'Workplace conversation practice — not HR certification.',
  },
  {
    packKey: 'workplace_status_update_en',
    revision: 'workplace_status_update_en_v1',
    situation: 'workplace_conversation',
    corridorId: 'fr-en-interview',
    levelLabel: 'self_selected_beginner_to_intermediate',
    questionText: 'Give a clear status update on a task you are working on.',
    questionExplanation:
      'Dites ce qui est fait, ce qui bloque, et la prochaine étape. Gardez vos faits; ce n’est pas une évaluation professionnelle.',
    intent: 'give_clear_workplace_status',
    targetSkills: ['relevance', 'completeness', 'organization'],
    followUpPrompts: ['What is done?', 'What is blocked?', 'What is next?'],
    exampleAnswers: [
      'I finished the order list. I am waiting on two supplier prices. Tomorrow morning I will confirm them and send the file.',
    ],
    phraseExamples: [
      { phrase: 'Here is my status', meaning: 'Voici mon statut' },
      { phrase: 'Next step', meaning: 'Prochaine étape' },
    ],
    rubricVersion: 'interview_v1',
    reviewerNote: 'Workplace conversation practice — not HR certification.',
  },
];

const ACTION_RE =
  /\b(i|we|me|yɛ|mi)[^\n.]{0,40}\b(fix|check|organiz|help|call|tell|build|solved|correct|vérif|corrig|inform)/i;
const RESULT_RE =
  /\b(result|after|next day|on time|received|finished|worked|submitted|sold|bae|wiee|résultat|lendemain)/i;
const PROBLEM_RE =
  /\b(problem|issue|wrong|missing|error|ɔhaw|mfomso|problème|erreur)/i;

export function evaluateAnswer(input: {
  questionText: string;
  transcript: string;
  intent: string;
  uncertainAsr: boolean;
}): EvaluationResult {
  const text = input.transcript.trim();
  if (!text) {
    return {
      status: 'abstain',
      findings: [],
      unassessedDimensions: ['relevance', 'completeness', 'organization', 'grammar', 'pronunciation', 'standardized_proficiency'],
      abstainReason: 'Empty transcript — nothing to evaluate.',
    };
  }
  if (input.uncertainAsr && text.length < 12) {
    return {
      status: 'abstain',
      findings: [],
      unassessedDimensions: ['relevance', 'completeness', 'organization', 'grammar', 'pronunciation', 'standardized_proficiency'],
      abstainReason:
        'ASR uncertainty is high. Correct the transcript before scoring — recognition errors are not learner errors.',
    };
  }

  const findings: RubricFinding[] = [];
  const lower = text.toLowerCase();

  if (!PROBLEM_RE.test(text) && input.intent.includes('problem')) {
    findings.push({
      dimension: 'relevance',
      evidence: text.slice(0, 120),
      suggestionIntent: 'name_the_problem_clearly',
      priority: 1,
      note: 'Mention the specific problem you faced.',
    });
  }

  if (
    input.intent.includes('workplace_status') &&
    !/\b(status|done|finished|block|waiting|next|terminé|bloque|statut)\b/i.test(text)
  ) {
    findings.push({
      dimension: 'relevance',
      evidence: text.slice(0, 120),
      suggestionIntent: 'state_done_blocked_next',
      priority: 1,
      note: 'Say what is done, what is blocked, and what is next.',
    });
  }

  if (!ACTION_RE.test(text) && !input.intent.includes('workplace_status')) {
    findings.push({
      dimension: 'completeness',
      evidence: text.slice(0, 120),
      suggestionIntent: 'explain_action_and_result',
      priority: 1,
      note: 'Add what you personally did.',
    });
  }

  if (!RESULT_RE.test(text) && !input.intent.includes('workplace_status')) {
    findings.push({
      dimension: 'organization',
      evidence: text.slice(0, 120),
      suggestionIntent: 'explain_action_and_result',
      priority: 2,
      note: 'Say what changed afterward so the story has a result.',
    });
  }

  if (text.split(/\s+/).length < 8) {
    findings.push({
      dimension: 'completeness',
      evidence: text,
      suggestionIntent: 'add_one_concrete_detail',
      priority: 1,
      note: 'A short answer can work — add one concrete detail from your story.',
    });
  }

  // Grammar: light descriptive note only when obvious negation/tense mess — never accent policing
  if (/\bi is\b|\bi has went\b/i.test(lower)) {
    findings.push({
      dimension: 'grammar',
      evidence: text.match(/\bi is\b|\bi has went\b/i)?.[0] ?? text.slice(0, 40),
      suggestionIntent: 'clarify_verb_form',
      priority: 3,
      note: 'Optional language polish — not an accent or intelligence judgment.',
    });
  }

  // Cap to two high-priority findings for pedagogy
  const prioritized = findings
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2);

  return {
    status: 'feedback_available',
    findings: prioritized,
    unassessedDimensions: ['standardized_proficiency', 'pronunciation'],
  };
}

export function buildImprovedExample(input: {
  transcript: string;
  exampleAnswers: string[];
  findings: RubricFinding[];
}): { example: string; placeholders: string[]; label: string } {
  const facts = input.transcript.trim();
  const placeholders: string[] = [];
  if (!RESULT_RE.test(facts)) {
    placeholders.push('[result — what changed afterward?]');
  }
  if (!ACTION_RE.test(facts)) {
    placeholders.push('[your action]');
  }

  // Preserve learner facts; reorganize lightly. Never invent achievements or swap in another biography.
  let example = facts;
  if (facts.split(/\s+/).length < 6) {
    const gaps = [
      ...placeholders,
      ...(ACTION_RE.test(facts) ? [] : ['[your action]']),
      ...(RESULT_RE.test(facts) ? [] : ['[result — what changed afterward?]']),
    ];
    const uniqueGaps = Array.from(new Set(gaps.length ? gaps : ['[add one concrete detail]']));
    return {
      example: `${facts}${facts.endsWith('.') ? '' : '.'} ${uniqueGaps.join(' ')}`.trim(),
      placeholders: uniqueGaps,
      label: 'example_preserving_learner_facts',
    };
  }

  if (placeholders.length) {
    example = `${facts}${facts.endsWith('.') ? '' : '.'} ${placeholders.join(' ')}`.trim();
  } else if (input.findings.some((f) => f.suggestionIntent === 'explain_action_and_result')) {
    example = `${facts} I explained the action I took and what changed afterward.`;
  }

  return {
    example,
    placeholders,
    label: 'example_preserving_learner_facts',
  };
}

export function detectPromptInjection(text: string): boolean {
  return /\bIGNORE\s+PREVIOUS\b|\bSYSTEM\s*:|\boverride\s+rubric\b|\bgrant\s+admin\b/i.test(
    text,
  );
}
