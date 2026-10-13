import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Download,
  ArrowUpRight,
  Copy,
  FileDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ResumeAnalysisResult } from '../types';
import {
  exportResumeToPDF,
  exportResumeToDOCX,
  exportAnalysisReportPDF,
  SAMPLE_RESUME_TEXT,
} from '../utils/exportUtils';

interface ReportsViewProps {
  reports: ResumeAnalysisResult[];
  onSelectReport: (report: ResumeAnalysisResult) => void;
  onDeleteReport: (id: string) => void;
  onClearAllReports: () => void;
  onStartNew: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  onSelectReport,
  onDeleteReport,
  onClearAllReports,
  onStartNew,
}) => {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-950 dark:text-white">
            My Saved Diagnostic Reports
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Stored locally in your browser for privacy. You can inspect, export, or permanently
            delete your reports at any time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {reports.length > 0 && (
            <button
              type="button"
              onClick={onClearAllReports}
              className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All Data
            </button>
          )}
          <button
            type="button"
            onClick={onStartNew}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors cursor-pointer"
          >
            + New Resume Analysis
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="p-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-4">
          <FileText className="w-10 h-10 text-neutral-400 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
              No Resume Reports Yet
            </h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Upload a resume on the Analyze tab to generate your first ATS compatibility score,
              roast critique, and bullet point rewrites.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNew}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors cursor-pointer"
          >
            Analyze Your First Resume
          </button>
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-950/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="font-mono tabular-nums">
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{rep.experienceLevel}</span>
                  {rep.targetJobTitle && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Target: {rep.targetJobTitle}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Impression: {rep.recruiterFirstImpression}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                  {rep.fileName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-400 pt-1">
                  <span>Overall: {rep.overallScore}/100</span>
                  <span>ATS: {rep.atsScore}/100</span>
                  <span>Impact: {rep.impactScore}/100</span>
                  <span>Job Match: {rep.jobMatchScore}/100</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectReport(rep)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-white dark:text-neutral-950 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => exportAnalysisReportPDF(rep)}
                  className="px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteReport(rep.id)}
                  className="p-2 text-xs text-red-600 dark:text-red-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  aria-label="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface BuilderViewProps {
  initialText: string;
  showToast: (msg: string) => void;
  onSendToAnalyzer: (text: string) => void;
}

export const BuilderView: React.FC<BuilderViewProps> = ({
  initialText,
  showToast,
  onSendToAnalyzer,
}) => {
  const [draft, setDraft] = useState(initialText || SAMPLE_RESUME_TEXT);

  // Detect any remaining [X%] placeholders so the user can fill them in easily
  const placeholders = Array.from(new Set(draft.match(/\[[^\]]+\]/g) || []));

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-950 dark:text-white">
            ATS-Clean Resume Builder
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Fine-tune your rewritten resume, replace metric placeholders with your real numbers, and
            export a clean single-column PDF or DOCX.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(draft);
              showToast('Resume text copied to clipboard');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Text
          </button>
          <button
            type="button"
            onClick={() => {
              exportResumeToPDF(draft, 'ATS_Optimized_Resume.pdf');
              showToast('Downloaded PDF resume');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={async () => {
              await exportResumeToDOCX(draft, 'ATS_Optimized_Resume.docx');
              showToast('Downloaded DOCX resume');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Download DOCX
          </button>
          <button
            type="button"
            onClick={() => onSendToAnalyzer(draft)}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors cursor-pointer"
          >
            Re-Analyze This Draft
          </button>
        </div>
      </div>

      {placeholders.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs space-y-1.5">
          <div className="font-semibold text-amber-800 dark:text-amber-300">
            Metric Placeholders Remaining ({placeholders.length})
          </div>
          <p className="text-neutral-700 dark:text-neutral-300">
            Replace these bracketed placeholders with your real figures before sending to
            recruiters: <span className="font-mono">{placeholders.join(' · ')}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-2">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Plain-Text Source Editor
          </label>
          <textarea
            rows={26}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 text-xs sm:text-sm font-mono leading-relaxed text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="lg:col-span-6 space-y-2">
          <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            ATS Single-Column Document Preview
          </div>
          <div className="p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 min-h-[580px] space-y-2.5 text-neutral-900 dark:text-neutral-100">
            {draft.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={i} className="h-2" />;
              const isHeader =
                trimmed.length < 48 &&
                (trimmed === trimmed.toUpperCase() ||
                  /^(SUMMARY|PROFESSIONAL SUMMARY|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS)/i.test(
                    trimmed
                  ));
              if (isHeader && i > 0) {
                return (
                  <h3
                    key={i}
                    className="text-xs font-bold tracking-wider text-neutral-950 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-1 pt-3"
                  >
                    {trimmed}
                  </h3>
                );
              }
              if (i === 0) {
                return (
                  <h2 key={i} className="text-lg font-bold text-neutral-950 dark:text-white">
                    {trimmed}
                  </h2>
                );
              }
              return (
                <p key={i} className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TipsView: React.FC = () => {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-12">
      <div className="max-w-3xl space-y-3 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold text-neutral-950 dark:text-white">
          Recruiter &amp; ATS Survival Guide
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Concrete rules used by technical recruiters and modern Applicant Tracking Systems (Greenhouse,
          Lever, Workday, Ashby) when evaluating resumes in under 8 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
          <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
            01. The Google XYZ Bullet Formula
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Never start a bullet with &ldquo;Responsible for&rdquo;, &ldquo;Helped with&rdquo;, or
            &ldquo;Worked on&rdquo;. Frame every bullet as: Accomplished [X] as measured by [Y], by
            doing [Z].
          </p>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs font-mono">
            <div className="text-red-600 dark:text-red-400">
              Weak: &ldquo;Worked on optimizing backend API endpoints.&rdquo;
            </div>
            <div className="text-emerald-600 dark:text-emerald-400">
              Strong: &ldquo;Reduced p95 checkout API latency by 42% (from 680ms to 390ms) by
              implementing Redis caching and indexing high-frequency PostgreSQL queries.&rdquo;
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
          <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
            02. ATS Formatting Traps to Eliminate
          </h2>
          <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <li>
              • <strong>Multi-column layouts &amp; sidebars:</strong> Older parsers read left-to-right
              across the entire page, scrambling your job titles with your skills sidebar.
            </li>
            <li>
              • <strong>Skill progress bars &amp; star ratings:</strong> &ldquo;Python: 4/5
              stars&rdquo; means nothing to a hiring manager and parses as blank characters in ATS.
            </li>
            <li>
              • <strong>Contact info in document headers/footers:</strong> Many enterprise parsers
              strip Word header/footer zones completely. Put your email and phone in the main body.
            </li>
            <li>
              • <strong>Non-standard section titles:</strong> Use &ldquo;Work Experience&rdquo;,
              &ldquo;Education&rdquo;, and &ldquo;Skills&rdquo;—not &ldquo;Where I&apos;ve
              Been&rdquo; or &ldquo;My Arsenal&rdquo;.
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
          <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
            03. How to Quantify When You Don&apos;t Have Revenue Numbers
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            You don&apos;t need to work in sales to have metrics. Measure scale, frequency, speed, or
            reliability:
          </p>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
            <li>• <strong>Scale:</strong> Number of users served, records processed, services maintained, or requests/sec.</li>
            <li>• <strong>Time Saved:</strong> Hours of manual QA, reporting, or deployment effort eliminated per week.</li>
            <li>• <strong>Quality &amp; Reliability:</strong> Bug reduction rate, test coverage increase, or uptime SLA achieved.</li>
            <li>• <strong>Cadence:</strong> Delivered 14 production releases across 3 cross-functional squads ahead of schedule.</li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
          <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
            04. Natural Keyword Alignment vs. Keyword Stuffing
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Modern recruiters filter by skills AND read the surrounding sentence context. Listing 50
            keywords at the bottom of your resume without mentioning them in a single work bullet
            signals padding. Weave your top 5–8 target role keywords directly into the bullet points
            of your most recent two roles.
          </p>
        </div>
      </div>
    </div>
  );
};

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-12">
      <div className="max-w-3xl space-y-3 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold text-neutral-950 dark:text-white">
          About Resume Roaster
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Built to replace sugar-coated, generic resume feedback with candid, actionable diagnostics
          grounded in real recruiting standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Our Coaching Philosophy
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            We combine the lens of an experienced technical recruiter, an ATS specialist, and a
            witty career coach. Our humor targets clichés, passive verbs, and missing metrics on the
            page—never the person behind the resume.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-neutral-950 dark:text-white">
              Strict Factual Integrity
            </h2>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            AI should never fabricate employment history, degrees, companies, or fake percentages.
            When your resume lacks numbers, Resume Roaster inserts transparent{' '}
            <code className="font-mono">[X%]</code> placeholders so you remain 100% truthful in
            interviews.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3">
          <h2 className="text-base font-bold text-neutral-950 dark:text-white">
            Privacy &amp; Data Control
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Your resume contains personal information. Uploaded resumes are never used for model
            training without explicit user consent, and you have one-click controls to delete your
            uploaded resume and diagnostic reports at any time.
          </p>
        </div>
      </div>

      {/* Extensible Career Suite Architecture */}
      <div className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
        <h2 className="text-lg font-bold text-neutral-950 dark:text-white">
          Modular Career Suite Architecture
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Resume Roaster is architected on a structured diagnostic schema designed to power your
          entire job search workflow:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { title: 'Job-Specific Optimization', status: 'Active in Workspace' },
            { title: 'ATS Single-Column Builder', status: 'Active in Builder Tab' },
            { title: 'Multi-Version Report Vault', status: 'Active in My Reports' },
            { title: 'LinkedIn & Cover Letter Sync', status: 'Schema Ready' },
          ].map((item) => (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-white">
                <span>{item.title}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="text-xs text-neutral-500">{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
