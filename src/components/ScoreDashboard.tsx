import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  RotateCcw,
  Compass,
  Info,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../types';

interface ScoreDashboardProps {
  result: ResumeAnalysisResult;
  onDownloadReport: () => void;
  onDeleteAnalysis: () => void;
  onNewAnalysis: () => void;
}

export const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  result,
  onDownloadReport,
  onDeleteAnalysis,
  onNewAnalysis,
}) => {
  const scoreMetrics = [
    { label: 'ATS Compatibility', score: result.atsScore },
    { label: 'Content Quality', score: result.contentScore },
    { label: 'Measurable Impact', score: result.impactScore },
    { label: 'Formatting & Structure', score: result.formattingScore },
    { label: 'Skills Demonstration', score: result.skillsScore },
    {
      label: result.hasJobDescription ? 'Job Description Match' : 'Role Alignment',
      score: result.jobMatchScore,
    },
    { label: 'Career Positioning', score: result.careerPositioningScore },
  ];

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColorClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-600 dark:bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-600';
  };

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, result.overallScore)) / 100) * circumference;

  return (
    <div className="space-y-8">
      {/* Header Bar with Metadata & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{result.fileName}</span>
            <span aria-hidden="true">·</span>
            <span>{result.experienceLevel}</span>
            {result.targetJobTitle && (
              <>
                <span aria-hidden="true">·</span>
                <span>Target: {result.targetJobTitle}</span>
              </>
            )}
            {result.targetCompany && (
              <>
                <span aria-hidden="true">·</span>
                <span>{result.targetCompany}</span>
              </>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white mt-1">
            Resume Diagnostic Scorecard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onDownloadReport}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Report PDF
          </button>
          <button
            type="button"
            onClick={onNewAnalysis}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Analyze Another
          </button>
          <button
            type="button"
            onClick={onDeleteAnalysis}
            className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Analysis
          </button>
        </div>
      </div>

      {/* Main Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: Circular Overall Score + Recruiter First Impression */}
        <div className="lg:col-span-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 136 136">
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-neutral-200 dark:text-neutral-800"
                />
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={
                    result.overallScore >= 80
                      ? 'text-emerald-500'
                      : result.overallScore >= 60
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono tabular-nums text-neutral-950 dark:text-white">
                  {result.overallScore}
                </span>
                <span className="text-xs font-mono text-neutral-500">/ 100</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Recruiter First Impression
              </div>
              <div
                className={`text-lg font-bold ${
                  result.recruiterFirstImpression === 'Strong'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : result.recruiterFirstImpression === 'Needs Work'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {result.recruiterFirstImpression}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {result.recruiterImpressionSummary}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-neutral-400" />
            <span>
              Diagnostic Notice: Scores are AI-generated writing and ATS diagnostics, not a hiring
              prediction or guarantee of interview success.
            </span>
          </div>
        </div>

        {/* Right 8 cols: 7 Sub-Score Bars */}
        <div className="lg:col-span-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-neutral-950 dark:text-white mb-4">
            Dimension Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {scoreMetrics.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {m.label}
                  </span>
                  <span className={`font-mono font-bold tabular-nums ${getScoreColorClass(m.score)}`}>
                    {m.score} / 100
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getBarColorClass(
                      m.score
                    )}`}
                    style={{ width: `${Math.min(100, Math.max(0, m.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Career Positioning & ATS Compatibility Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Career Positioning */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-600" />
            <h3 className="text-base font-bold text-neutral-950 dark:text-white">
              Career Positioning Audit
            </h3>
          </div>

          <dl className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Communicated Role</dt>
              <dd className="font-semibold text-neutral-900 dark:text-white text-right">
                {result.careerPositioning?.detectedRole || 'Unclear'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Perceived Seniority</dt>
              <dd className="font-semibold text-neutral-900 dark:text-white text-right">
                {result.careerPositioning?.detectedExperienceLevel || result.experienceLevel}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Core Expertise</dt>
              <dd className="font-semibold text-neutral-900 dark:text-white text-right">
                {result.careerPositioning?.coreExpertise || 'Generalist'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Specialization Clarity</dt>
              <dd className="font-semibold text-neutral-900 dark:text-white text-right">
                {result.careerPositioning?.specializationClarity || 'Moderate'}
              </dd>
            </div>
          </dl>

          {result.careerPositioning?.critique && (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 leading-relaxed">
              {result.careerPositioning.critique}
            </p>
          )}
        </div>

        {/* ATS Parsing & Structural Checklist */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-950 dark:text-white">
              ATS Compatibility &amp; Formatting Checks
            </h3>
            <span className="text-xs font-mono tabular-nums text-neutral-500">
              ATS Score: {result.atsScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(result.atsChecklist || []).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 flex items-start gap-2.5"
              >
                {item.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : item.status === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {item.check}{' '}
                    <span className="font-normal text-neutral-500">
                      · {item.status === 'pass' ? 'Passed' : item.status === 'warn' ? 'Warning' : 'Action Needed'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
