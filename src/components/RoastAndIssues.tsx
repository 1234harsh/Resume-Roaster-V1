import React, { useState } from 'react';
import {
  Flame,
  AlertOctagon,
  AlertTriangle,
  Lightbulb,
  Check,
  Copy,
  FileDown,
  Wand2,
  Loader2,
  Search,
} from 'lucide-react';
import { ResumeAnalysisResult, DiagnosticIssue } from '../types';
import {
  exportResumeToPDF,
  exportResumeToDOCX,
  exportAnalysisReportPDF,
} from '../utils/exportUtils';

interface RoastAndIssuesProps {
  result: ResumeAnalysisResult;
  onApplyBulletRewrite: (bulletId: string) => void;
  onApplyAllBullets: () => void;
  onUpdateImprovedResume: (newText: string, newSummary?: string) => void;
  showToast: (msg: string) => void;
}

export const RoastAndIssues: React.FC<RoastAndIssuesProps> = ({
  result,
  onApplyBulletRewrite,
  onApplyAllBullets,
  onUpdateImprovedResume,
  showToast,
}) => {
  const [issueTab, setIssueTab] = useState<'critical' | 'improvements' | 'quickWins'>('critical');
  const [highlightMode, setHighlightMode] = useState<'matched' | 'overused' | 'none'>('matched');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [customEmphasis, setCustomEmphasis] = useState('');

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`);
    } catch {
      showToast('Failed to copy to clipboard');
    }
  };

  const handleGenerateImprovedResume = async () => {
    setIsRegenerating(true);
    try {
      const appliedBullets = result.weakBullets
        .filter((b) => b.applied)
        .map((b) => ({ current: b.current, rewrite: b.rewrite }));

      const response = await fetch('/api/regenerate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalResumeText: result.originalResumeText,
          appliedBullets,
          targetJobTitle: result.targetJobTitle,
          customInstructions: customEmphasis,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate improved resume');
      }
      onUpdateImprovedResume(data.improvedFullResume, data.rewrittenSummary);
      showToast('Improved resume generated with factual placeholders');
    } catch (err: any) {
      showToast(err?.message || 'Error generating improved resume');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Highlight matched or overused keywords inside the original resume text
  const renderHighlightedResume = () => {
    const text = result.originalResumeText || '';
    const keywords =
      highlightMode === 'matched'
        ? result.matchedKeywords || []
        : highlightMode === 'overused'
        ? result.overusedKeywords || []
        : [];

    const validKeywords = keywords
      .map((k) => k.trim())
      .filter((k) => k.length > 2)
      .sort((a, b) => b.length - a.length);

    if (validKeywords.length === 0 || highlightMode === 'none') {
      return <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{text}</pre>;
    }

    const escaped = validKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(\\b(?:${escaped.join('|')})\\b)`, 'gi');
    const parts = text.split(regex);

    return (
      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
        {parts.map((part, i) => {
          const isMatch = validKeywords.some((k) => k.toLowerCase() === part.toLowerCase());
          if (isMatch) {
            return (
              <mark
                key={i}
                className={
                  highlightMode === 'matched'
                    ? 'bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100 px-1 rounded-xs'
                    : 'bg-red-200/80 dark:bg-red-900/70 text-red-950 dark:text-red-100 px-1 rounded-xs'
                }
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </pre>
    );
  };

  const renderIssuesList = (issues: DiagnosticIssue[], emptyLabel: string) => {
    if (!issues || issues.length === 0) {
      return (
        <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          {emptyLabel}
        </div>
      );
    }

    return (
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        {issues.map((item, idx) => (
          <div key={idx} className="p-6 space-y-3">
            <h4 className="text-sm font-bold text-neutral-950 dark:text-white">
              {idx + 1}. {item.problem}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Why it matters
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.whyItMatters}
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Exact Recommendation
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.recommendation}
                </p>
              </div>
            </div>
            {item.example && (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                <span className="font-semibold text-orange-600 dark:text-orange-400">Example: </span>
                {item.example}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const appliedCount = (result.weakBullets || []).filter((b) => b.applied).length;

  return (
    <div className="space-y-14">
      {/* 5. 🔥 THE ROAST SECTION */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-600" />
              <span>THE ROAST</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Direct, unfiltered recruiter reactions to the exact lines on your page—roasting the
              paper, never the person.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(result.roast || []).map((item, index) => (
            <div
              key={item.id || index}
              className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  0{index + 1} · {item.category}
                </div>
                <h3 className="text-base font-bold text-neutral-950 dark:text-white leading-snug">
                  &ldquo;{item.headline}&rdquo;
                </h3>
                {item.quoteFromResume && (
                  <blockquote className="pl-3 border-l-2 border-neutral-300 dark:border-neutral-700 text-xs font-mono text-neutral-500 dark:text-neutral-400 italic">
                    From your resume: &ldquo;{item.quoteFromResume}&rdquo;
                  </blockquote>
                )}
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <strong className="text-neutral-900 dark:text-white">Coach&apos;s Fix: </strong>
                {item.observation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PROBLEMS FOUND (Critical Issues, Improvements, Quick Wins) */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">
              Problems Found &amp; Action Plan
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Prioritized issues holding back your response rate, with exact fixes and examples.
            </p>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              type="button"
              onClick={() => setIssueTab('critical')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                issueTab === 'critical'
                  ? 'bg-white dark:bg-neutral-950 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Critical Issues ({result.criticalIssues?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setIssueTab('improvements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                issueTab === 'improvements'
                  ? 'bg-white dark:bg-neutral-950 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Improvements ({result.improvements?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setIssueTab('quickWins')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                issueTab === 'quickWins'
                  ? 'bg-white dark:bg-neutral-950 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Suggestions &amp; Quick Wins ({result.quickWins?.length || 0})</span>
            </button>
          </div>
        </div>

        {issueTab === 'critical' &&
          renderIssuesList(result.criticalIssues, 'No critical dealbreakers detected.')}
        {issueTab === 'improvements' &&
          renderIssuesList(result.improvements, 'No major improvements listed.')}
        {issueTab === 'quickWins' &&
          renderIssuesList(result.quickWins, 'No quick wins listed.')}
      </section>

      {/* 8. BULLET POINT ROASTER */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">
              Bullet Point Roaster
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Every weak bullet point from your resume roasted and rewritten for measurable impact.
              Click &ldquo;Apply Rewrite&rdquo; to update your improved resume automatically.
            </p>
          </div>

          {result.weakBullets?.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tabular-nums text-neutral-500">
                {appliedCount} of {result.weakBullets.length} applied
              </span>
              <button
                type="button"
                onClick={onApplyAllBullets}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:opacity-90 rounded-lg transition-opacity whitespace-nowrap cursor-pointer"
              >
                Apply All Rewrites
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {(result.weakBullets || []).map((bullet, idx) => (
            <div
              key={bullet.id || idx}
              className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-medium text-neutral-500">
                  Bullet #{idx + 1} · {bullet.section}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(bullet.rewrite, 'Rewritten bullet')}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyBulletRewrite(bullet.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      bullet.applied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {bullet.applied ? 'Rewrite Applied' : 'Apply Rewrite'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-500">Current Bullet</div>
                  <p className="text-xs font-mono text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    &ldquo;{bullet.current}&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/40 space-y-1.5">
                  <div className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                    The Roast
                  </div>
                  <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {bullet.roast}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    High-Impact Rewrite
                  </div>
                  <p className="text-xs font-mono text-neutral-900 dark:text-neutral-100 leading-relaxed">
                    &ldquo;{bullet.rewrite}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9 & 10. SKILLS ANALYSIS & JOB DESCRIPTION KEYWORD MATCH */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">
            Skills &amp; Keyword Alignment
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Separates proven skills from unsupported claims and highlights exact keyword coverage.
          </p>
        </div>

        {/* 3-Column Skills Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Strongly Demonstrated ({result.skillAnalysis?.stronglyDemonstrated?.length || 0})
            </div>
            <p className="text-xs text-neutral-500">
              Skills clearly backed by evidence in your work or project bullets.
            </p>
            <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
              {(result.skillAnalysis?.stronglyDemonstrated || []).join(' · ') ||
                'None strongly proven yet'}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Mentioned but Weakly Demonstrated (
              {result.skillAnalysis?.weaklyDemonstrated?.length || 0})
            </div>
            <p className="text-xs text-neutral-500">
              Listed in your skills section, but never shown in action in your experience.
            </p>
            <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
              {(result.skillAnalysis?.weaklyDemonstrated || []).join(' · ') || 'None detected'}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
            <div className="text-xs font-semibold text-red-600 dark:text-red-400">
              Missing / Recommended for Target Role (
              {result.skillAnalysis?.missingRecommended?.length || 0})
            </div>
            <p className="text-xs text-neutral-500">
              Frequently expected for this role—only add if you genuinely have experience with them.
            </p>
            <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
              {(result.skillAnalysis?.missingRecommended || []).join(' · ') || 'None missing'}
            </div>
          </div>
        </div>

        {/* Keyword Matrix + Interactive Resume Keyword Highlighter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
            <h3 className="text-base font-bold text-neutral-950 dark:text-white">
              Keyword Diagnostics
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {result.jobAlignmentSummary}
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Matched Keywords ({result.matchedKeywords?.length || 0})
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {(result.matchedKeywords || []).join(' · ') || 'None'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="font-semibold text-red-600 dark:text-red-400">
                  Missing Target Keywords ({result.missingKeywords?.length || 0})
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {(result.missingKeywords || []).join(' · ') || 'None'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="font-semibold text-sky-600 dark:text-sky-400">
                  Potentially Important Keywords (
                  {result.potentiallyImportantKeywords?.length || 0})
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {(result.potentiallyImportantKeywords || []).join(' · ') || 'None'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="font-semibold text-amber-600 dark:text-amber-400">
                  Overused Words &amp; Cliches ({result.overusedKeywords?.length || 0})
                </div>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {(result.overusedKeywords || []).join(' · ') || 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Keyword Highlighter inside the Resume */}
          <div className="lg:col-span-6 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                  Keyword Highlighter in Resume
                </h3>
              </div>

              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHighlightMode('matched')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    highlightMode === 'matched'
                      ? 'bg-white dark:bg-neutral-950 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Matched
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('overused')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    highlightMode === 'overused'
                      ? 'bg-white dark:bg-neutral-950 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Overused
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightMode('none')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    highlightMode === 'none'
                      ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Plain
                </button>
              </div>
            </div>

            <div className="h-[340px] overflow-y-auto p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
              {renderHighlightedResume()}
            </div>
          </div>
        </div>
      </section>

      {/* 11 & 12. ✨ IMPROVED RESUME & EXPORT */}
      <section className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-950 dark:text-white">
              Improved Resume &amp; Export
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Fact-preserving rewrite using bracketed metric placeholders like{' '}
              <code className="font-mono text-orange-600 dark:text-orange-400">[X% improvement]</code>{' '}
              where numbers are needed. Never invents employers, degrees, or technologies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isRegenerating}
              onClick={handleGenerateImprovedResume}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Improved Resume...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>✨ Generate Improved Resume</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Custom Regeneration Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customEmphasis}
            onChange={(e) => setCustomEmphasis(e.target.value)}
            placeholder="Optional instruction before regenerating (e.g., 'Emphasize backend leadership and cloud cost optimization')..."
            className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Rewritten Professional Summary Highlight */}
        {result.rewrittenSummary && (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Upgraded Professional Summary
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(result.rewrittenSummary, 'Professional summary')}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copy Summary
              </button>
            </div>
            <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
              {result.rewrittenSummary}
            </p>
          </div>
        )}

        {/* Full Editable Improved Resume */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="improved-resume-editor"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              Full Rewritten Resume (Editable — fill in your exact numbers inside [X%] brackets before
              downloading)
            </label>

            {/* Export Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(result.improvedFullResume, 'Improved resume')}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Improved Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  exportResumeToPDF(
                    result.improvedFullResume,
                    `Improved_${result.fileName.replace(/\.[^.]+$/, '')}.pdf`
                  );
                  showToast('Downloaded improved resume as PDF');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                type="button"
                onClick={async () => {
                  await exportResumeToDOCX(
                    result.improvedFullResume,
                    `Improved_${result.fileName.replace(/\.[^.]+$/, '')}.docx`
                  );
                  showToast('Downloaded improved resume as DOCX');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download DOCX
              </button>
              <button
                type="button"
                onClick={() => {
                  exportAnalysisReportPDF(result);
                  showToast('Downloaded full analysis report PDF');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-900/60 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download Analysis Report
              </button>
            </div>
          </div>

          <textarea
            id="improved-resume-editor"
            rows={18}
            value={result.improvedFullResume}
            onChange={(e) => onUpdateImprovedResume(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-4 text-xs sm:text-sm font-mono leading-relaxed text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </section>
    </div>
  );
};
