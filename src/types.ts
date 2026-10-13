export type ExperienceLevel =
  | 'Fresher'
  | '1–3 years'
  | '3–5 years'
  | '5–10 years'
  | '10+ years';

export type RecruiterImpression = 'Strong' | 'Needs Work' | 'Major Rewrite';

export interface RoastItem {
  id: string;
  headline: string;
  quoteFromResume: string;
  observation: string;
  category: string;
}

export interface DiagnosticIssue {
  problem: string;
  whyItMatters: string;
  recommendation: string;
  example?: string;
}

export interface WeakBulletItem {
  id: string;
  section: string;
  current: string;
  roast: string;
  rewrite: string;
  applied?: boolean;
}

export interface AtsCheckItem {
  check: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface CareerPositioningAnalysis {
  detectedRole: string;
  detectedExperienceLevel: string;
  coreExpertise: string;
  careerDirection: string;
  specializationClarity: string;
  critique: string;
}

export interface SkillAnalysis {
  stronglyDemonstrated: string[];
  weaklyDemonstrated: string[];
  missingRecommended: string[];
}

export interface KeywordAnalysis {
  matchedKeywords: string[];
  missingKeywords: string[];
  potentiallyImportantKeywords: string[];
  overusedKeywords: string[];
  jobAlignmentSummary: string;
}

export interface ResumeAnalysisResult {
  id: string;
  createdAt: string;
  fileName: string;
  targetJobTitle?: string;
  targetCompany?: string;
  experienceLevel: ExperienceLevel;
  hasJobDescription: boolean;
  originalResumeText: string;

  overallScore: number;
  atsScore: number;
  contentScore: number;
  impactScore: number;
  formattingScore: number;
  skillsScore: number;
  jobMatchScore: number;
  careerPositioningScore: number;

  recruiterFirstImpression: RecruiterImpression;
  recruiterImpressionSummary: string;

  roast: RoastItem[];
  atsChecklist: AtsCheckItem[];
  careerPositioning: CareerPositioningAnalysis;

  criticalIssues: DiagnosticIssue[];
  improvements: DiagnosticIssue[];
  quickWins: DiagnosticIssue[];

  weakBullets: WeakBulletItem[];
  skillAnalysis: SkillAnalysis;

  matchedKeywords: string[];
  missingKeywords: string[];
  potentiallyImportantKeywords: string[];
  overusedKeywords: string[];
  jobAlignmentSummary: string;

  rewrittenSummary: string;
  rewrittenBullets: { original: string; improved: string }[];
  improvedFullResume: string;
}
