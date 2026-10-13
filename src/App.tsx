import React, { useEffect, useRef, useState } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { UploadWorkspace } from './components/UploadWorkspace';
import { ScoreDashboard } from './components/ScoreDashboard';
import { RoastAndIssues } from './components/RoastAndIssues';
import { ReportsView, BuilderView, TipsView, AboutView } from './components/SecondaryViews';
import { ExperienceLevel, ResumeAnalysisResult } from './types';
import { exportAnalysisReportPDF } from './utils/exportUtils';
import { AlertCircle, CheckCircle2, Flame } from 'lucide-react';

const STORAGE_KEY = 'resume_roaster_saved_reports_v1';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('analyze');

  // Resume & Job inputs
  const [resumeText, setResumeText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [targetJobTitle, setTargetJobTitle] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('3–5 years');
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(true);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ResumeAnalysisResult | null>(null);
  const [savedReports, setSavedReports] = useState<ResumeAnalysisResult[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const uploadRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedReports(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const persistReports = (nextReports: ResumeAnalysisResult[]) => {
    setSavedReports(nextReports);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReports));
    } catch {
      // ignore quota errors
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      setAnalysisError('Please upload or paste your resume text before starting analysis.');
      return;
    }
    if (!privacyConsent) {
      setAnalysisError('Please confirm the privacy consent checkbox before analyzing.');
      return;
    }

    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          targetJobTitle,
          targetCompany,
          experienceLevel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      const fullResult: ResumeAnalysisResult = {
        ...data,
        id: `roast_${Date.now()}`,
        createdAt: new Date().toISOString(),
        fileName: fileName || 'Pasted_Resume.txt',
        targetJobTitle: targetJobTitle.trim() || undefined,
        targetCompany: targetCompany.trim() || undefined,
        experienceLevel,
        hasJobDescription: Boolean(jobDescription.trim().length > 15),
        originalResumeText: resumeText,
      };

      setCurrentResult(fullResult);
      persistReports([fullResult, ...savedReports.slice(0, 19)]);
      showToast('Resume roasted & scored! Scroll down for your full report.');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } catch (err: any) {
      setAnalysisError(err?.message || 'An unexpected error occurred during AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyBulletRewrite = (bulletId: string) => {
    if (!currentResult) return;

    const updatedBullets = currentResult.weakBullets.map((b) => {
      if (b.id === bulletId) {
        return { ...b, applied: !b.applied };
      }
      return b;
    });

    const targetBullet = currentResult.weakBullets.find((b) => b.id === bulletId);
    let updatedFullResume = currentResult.improvedFullResume;

    if (targetBullet) {
      const cleanCurrent = targetBullet.current.replace(/^[•\-*]\s*/, '').trim();
      const cleanRewrite = targetBullet.rewrite.replace(/^[•\-*]\s*/, '').trim();
      if (!targetBullet.applied) {
        if (updatedFullResume.includes(cleanCurrent)) {
          updatedFullResume = updatedFullResume.replace(cleanCurrent, cleanRewrite);
        } else {
          updatedFullResume = `${updatedFullResume.trim()}\n• ${cleanRewrite}`;
        }
        showToast('Applied improved bullet to your resume');
      } else {
        if (updatedFullResume.includes(cleanRewrite)) {
          updatedFullResume = updatedFullResume.replace(cleanRewrite, cleanCurrent);
        }
        showToast('Reverted bullet rewrite');
      }
    }

    const updatedResult: ResumeAnalysisResult = {
      ...currentResult,
      weakBullets: updatedBullets,
      improvedFullResume: updatedFullResume,
    };

    setCurrentResult(updatedResult);
    persistReports(
      savedReports.map((r) => (r.id === updatedResult.id ? updatedResult : r))
    );
  };

  const handleApplyAllBullets = () => {
    if (!currentResult) return;
    let updatedFullResume = currentResult.improvedFullResume;

    const updatedBullets = currentResult.weakBullets.map((b) => {
      const cleanCurrent = b.current.replace(/^[•\-*]\s*/, '').trim();
      const cleanRewrite = b.rewrite.replace(/^[•\-*]\s*/, '').trim();
      if (updatedFullResume.includes(cleanCurrent)) {
        updatedFullResume = updatedFullResume.replace(cleanCurrent, cleanRewrite);
      }
      return { ...b, applied: true };
    });

    const updatedResult: ResumeAnalysisResult = {
      ...currentResult,
      weakBullets: updatedBullets,
      improvedFullResume: updatedFullResume,
    };

    setCurrentResult(updatedResult);
    persistReports(
      savedReports.map((r) => (r.id === updatedResult.id ? updatedResult : r))
    );
    showToast('All bullet rewrites applied to Improved Resume');
  };

  const handleUpdateImprovedResume = (newText: string, newSummary?: string) => {
    if (!currentResult) return;
    const updatedResult: ResumeAnalysisResult = {
      ...currentResult,
      improvedFullResume: newText,
      rewrittenSummary: newSummary ?? currentResult.rewrittenSummary,
    };
    setCurrentResult(updatedResult);
    persistReports(
      savedReports.map((r) => (r.id === updatedResult.id ? updatedResult : r))
    );
  };

  const handleDeleteAnalysis = (id: string) => {
    const next = savedReports.filter((r) => r.id !== id);
    persistReports(next);
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
    showToast('Analysis permanently deleted');
  };

  const handleClearResume = () => {
    setResumeText('');
    setFileName('');
    setCurrentResult(null);
    showToast('Uploaded resume cleared from session');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        reportCount={savedReports.length}
        onStartRoast={() => {
          setActiveTab('analyze');
          setTimeout(() => {
            uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold shadow-lg border border-neutral-800 dark:border-neutral-200">
          <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'analyze' && (
          <div>
            <UploadWorkspace
              resumeText={resumeText}
              setResumeText={setResumeText}
              fileName={fileName}
              setFileName={setFileName}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              targetJobTitle={targetJobTitle}
              setTargetJobTitle={setTargetJobTitle}
              targetCompany={targetCompany}
              setTargetCompany={setTargetCompany}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              privacyConsent={privacyConsent}
              setPrivacyConsent={setPrivacyConsent}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyzeResume}
              onClearResume={handleClearResume}
              uploadRef={uploadRef}
            />

            {/* Error Banner */}
            {analysisError && (
              <div className="max-w-[1280px] mx-auto px-6 pb-8">
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Analysis Error</div>
                    <p className="mt-0.5">{analysisError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skeleton Loader during AI Analysis */}
            {isAnalyzing && (
              <div className="max-w-[1280px] mx-auto px-6 pb-20">
                <div className="p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-600 animate-bounce" />
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-neutral-950 dark:text-white">
                        Running 6-Point Recruiter &amp; ATS Diagnostic...
                      </div>
                      <p className="text-xs text-neutral-500">
                        Auditing ATS parsing, roasting vague responsibility bullets, scoring job
                        alignment, and drafting high-impact rewrites.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                    <div className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                    <div className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                  </div>
                  <div className="h-44 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                </div>
              </div>
            )}

            {/* Full Results Dashboard */}
            {currentResult && !isAnalyzing && (
              <div
                ref={resultsRef}
                className="max-w-[1280px] mx-auto px-6 pb-24 pt-4 space-y-14 scroll-mt-20"
              >
                <ScoreDashboard
                  result={currentResult}
                  onDownloadReport={() => {
                    exportAnalysisReportPDF(currentResult);
                    showToast('Downloaded PDF diagnostic report');
                  }}
                  onDeleteAnalysis={() => handleDeleteAnalysis(currentResult.id)}
                  onNewAnalysis={() => {
                    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                <RoastAndIssues
                  result={currentResult}
                  onApplyBulletRewrite={handleApplyBulletRewrite}
                  onApplyAllBullets={handleApplyAllBullets}
                  onUpdateImprovedResume={handleUpdateImprovedResume}
                  showToast={showToast}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsView
            reports={savedReports}
            onSelectReport={(rep) => {
              setCurrentResult(rep);
              setActiveTab('analyze');
              setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            onDeleteReport={handleDeleteAnalysis}
            onClearAllReports={() => {
              persistReports([]);
              setCurrentResult(null);
              showToast('All saved reports deleted');
            }}
            onStartNew={() => setActiveTab('analyze')}
          />
        )}

        {activeTab === 'builder' && (
          <BuilderView
            initialText={currentResult?.improvedFullResume || resumeText}
            showToast={showToast}
            onSendToAnalyzer={(updatedDraft) => {
              setResumeText(updatedDraft);
              setFileName('Builder_Draft_Resume.txt');
              setActiveTab('analyze');
              setTimeout(() => {
                uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          />
        )}

        {activeTab === 'tips' && <TipsView />}

        {activeTab === 'about' && <AboutView />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 px-6 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-white font-display">
              Resume Roaster
            </span>
            <span aria-hidden="true">·</span>
            <span>Your resume doesn&apos;t need compliments. It needs the truth.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('analyze')}
              className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Analyze
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              My Reports
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Resume Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className="hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Privacy &amp; Ethics
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
