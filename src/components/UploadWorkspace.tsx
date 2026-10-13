import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Flame,
  ArrowDown,
} from 'lucide-react';
import { ExperienceLevel } from '../types';
import { SAMPLE_RESUME_TEXT, SAMPLE_JD_TEXT } from '../utils/exportUtils';

interface UploadWorkspaceProps {
  resumeText: string;
  setResumeText: (text: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  jobDescription: string;
  setJobDescription: (jd: string) => void;
  targetJobTitle: string;
  setTargetJobTitle: (title: string) => void;
  targetCompany: string;
  setTargetCompany: (company: string) => void;
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (level: ExperienceLevel) => void;
  privacyConsent: boolean;
  setPrivacyConsent: (consent: boolean) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onClearResume: () => void;
  uploadRef: React.RefObject<HTMLDivElement | null>;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Fresher',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  '10+ years',
];

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({
  resumeText,
  setResumeText,
  fileName,
  setFileName,
  jobDescription,
  setJobDescription,
  targetJobTitle,
  setTargetJobTitle,
  targetCompany,
  setTargetCompany,
  experienceLevel,
  setExperienceLevel,
  privacyConsent,
  setPrivacyConsent,
  isAnalyzing,
  onAnalyze,
  onClearResume,
  uploadRef,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showJobPanel, setShowJobPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const howItWorksRef = useRef<HTMLDivElement | null>(null);

  const handleFileSelect = async (file: File) => {
    setFileError(null);
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      setFileError('File exceeds the 10 MB maximum recommended size. Please upload a smaller PDF or DOCX.');
      return;
    }

    const lower = file.name.toLowerCase();
    const validExt = lower.endsWith('.pdf') || lower.endsWith('.docx') || lower.endsWith('.txt') || lower.endsWith('.md');
    if (!validExt) {
      setFileError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setIsParsingFile(true);
    setUploadProgress(20);
    setFileName(file.name);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.min(65, Math.round((ev.loaded / ev.total) * 60)));
          }
        };
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file from disk.'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(75);
      const response = await fetch('/api/parse-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          base64Data,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not parse document.');
      }

      setUploadProgress(100);
      setResumeText(data.text);
    } catch (err: any) {
      setFileError(err?.message || 'Error parsing file. You can also paste your resume text manually.');
      setUploadProgress(0);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const loadSampleData = () => {
    setFileError(null);
    setFileName('Alex_Mercer_Senior_Engineer.pdf');
    setResumeText(SAMPLE_RESUME_TEXT);
    setTargetJobTitle('Senior Full-Stack Engineer');
    setTargetCompany('Stripe');
    setExperienceLevel('5–10 years');
    setJobDescription(SAMPLE_JD_TEXT);
    setPrivacyConsent(true);
    setUploadProgress(100);
  };

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="pt-12 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-orange-600 dark:text-orange-400">
              <span>AI Resume Diagnostic</span>
              <span aria-hidden="true">·</span>
              <span>ATS Compatibility Check</span>
              <span aria-hidden="true">·</span>
              <span>Impact Bullet Rewriter</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-950 dark:text-white leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              Your resume doesn&apos;t need compliments.{' '}
              <span className="text-orange-600 dark:text-orange-500">It needs the truth.</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
              Upload your resume and optional target job description. Our AI recruiter and ATS engine
              evaluates formatting, exposes vague responsibility bullets, scores your job alignment,
              and rewrites weak statements for measurable impact.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                Roast My Resume
              </button>
              <button
                type="button"
                onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                See How It Works
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={loadSampleData}
                className="px-4 py-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer"
              >
                Try with a sample resume &amp; JD
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN UPLOAD & JOB DESCRIPTION WORKSPACE */}
      <section ref={uploadRef} className="max-w-[1280px] mx-auto px-6 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 columns: Resume Upload / Paste + Preview */}
          <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-950 dark:text-white">
                  01. Resume Input
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Upload PDF or DOCX (max 10 MB) or paste your resume text directly.
                </p>
              </div>

              {/* Interactive Segmented Control */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  Upload Resume
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    inputMode === 'paste'
                      ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  Paste Resume
                </button>
              </div>
            </div>

            {inputMode === 'upload' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-orange-500 dark:hover:border-orange-500 bg-neutral-50/60 dark:bg-neutral-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
                  {isParsingFile ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {isParsingFile
                    ? `Extracting text from ${fileName}...`
                    : 'Drag and drop your resume here, or click to browse'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Supports PDF, DOCX, and TXT · Maximum file size 10 MB
                </p>

                {(isParsingFile || uploadProgress > 0) && (
                  <div className="max-w-xs mx-auto mt-4 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                      <span className="truncate max-w-[200px]">{fileName || 'Resume'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-600 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {fileError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Resume Preview / Manual Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="resume-preview-textarea"
                  className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-600" />
                  <span>
                    {inputMode === 'upload' ? 'Resume Preview & Editable Text' : 'Paste Resume Text'}
                  </span>
                  {fileName && (
                    <span className="text-neutral-500 font-normal">
                      · {fileName}
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono tabular-nums">
                  <span>{wordCount} words</span>
                  {resumeText && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearResume();
                        setUploadProgress(0);
                        setFileError(null);
                      }}
                      className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Resume
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="resume-preview-textarea"
                rows={11}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  if (!fileName) setFileName('Pasted_Resume.txt');
                }}
                placeholder="Paste your full resume content here (Summary, Work Experience, Projects, Education, Skills) or upload a PDF/DOCX file above..."
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-4 text-xs sm:text-sm font-mono leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Right 5 columns: Optional Job Description Input + Privacy & Submit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                    <span>02. Want a more accurate roast?</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Optional target job details for keyword &amp; role alignment scoring.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowJobPanel(!showJobPanel)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  {showJobPanel ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showJobPanel && (
                <div className="space-y-4 pt-1">
                  {/* Experience Level Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Experience Level
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {EXPERIENCE_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setExperienceLevel(lvl)}
                          className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap truncate cursor-pointer ${
                            experienceLevel === lvl
                              ? 'border-orange-600 bg-orange-600 text-white'
                              : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Job Title & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="target-job-title"
                        className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1"
                      >
                        Target Job Title
                      </label>
                      <input
                        id="target-job-title"
                        type="text"
                        value={targetJobTitle}
                        onChange={(e) => setTargetJobTitle(e.target.value)}
                        placeholder="e.g., Senior Data Analyst"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="target-company"
                        className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1"
                      >
                        Target Company
                      </label>
                      <input
                        id="target-company"
                        type="text"
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                        placeholder="e.g., Stripe, Linear, Acme"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 py-2 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Job Description Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="job-description-input"
                        className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                      >
                        Target Job Description (Optional)
                      </label>
                      {jobDescription && (
                        <button
                          type="button"
                          onClick={() => setJobDescription('')}
                          className="text-xs text-neutral-500 hover:text-red-600 cursor-pointer"
                        >
                          Clear JD
                        </button>
                      )}
                    </div>
                    <textarea
                      id="job-description-input"
                      rows={5}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description here to unlock exact keyword matching, missing skill detection, and role alignment scoring..."
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-3 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Privacy & Consent Notice */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-neutral-900 dark:text-neutral-200">Privacy Guarantee:</strong>{' '}
                    Your resume contains personal information. Uploaded resumes are processed strictly for
                    your real-time diagnostic session, never used for model training without explicit user
                    consent, and can be permanently deleted at any time.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>
                    I consent to processing my resume text to generate my diagnostic score, roast feedback,
                    and bullet rewrites.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={isAnalyzing || !resumeText.trim() || !privacyConsent}
                  onClick={onAnalyze}
                  className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:text-neutral-500 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Roasting &amp; Analyzing Resume...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section ref={howItWorksRef} className="max-w-[1280px] mx-auto px-6 pt-8 scroll-mt-20">
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950 dark:text-white">
              How Resume Roaster Works
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Most resume checkers flatter you with generic scores. We inspect your resume the way an
              exhausted technical recruiter and a strict ATS parser actually read it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                num: '01. ATS Structural Audit',
                desc: 'Checks section headings, date formatting consistency, contact readability, and multi-column or table parsing traps.',
              },
              {
                num: '02. Brutally Honest Roast',
                desc: 'Calls out empty buzzwords ("results-driven visionary") and quotes exact lines where your achievements are hiding.',
              },
              {
                num: '03. Bullet Point Roaster',
                desc: 'Transforms passive duty lists ("Responsible for managing data") into high-impact XYZ outcomes with one click.',
              },
              {
                num: '04. Fact-Preserving Rewrite',
                desc: 'Generates an improved, export-ready PDF/DOCX resume using [X%] metric placeholders—never inventing fake history.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-950 dark:text-white">{step.num}</h3>
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
