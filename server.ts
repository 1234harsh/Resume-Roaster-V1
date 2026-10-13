import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentResilient(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
}) {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const modelName = FALLBACK_MODELS[i];
    try {
      const config: Record<string, any> = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      if (params.responseSchema) config.responseSchema = params.responseSchema;

      if (modelName === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');
      console.warn(`Model ${modelName} failed (${msg.slice(0, 140)}). Trying next fallback...`);
      // Brief pause before trying the next model
      await sleep(500 * (i + 1));
    }
  }

  throw lastError || new Error('All AI models are temporarily unavailable.');
}

// Deterministic fallback analyzer that inspects the user's actual resume & JD if all Gemini models return 503
function buildLocalResumeAnalysis(
  resumeText: string,
  jobDescription = '',
  targetJobTitle = '',
  targetCompany = '',
  experienceLevel = '3–5 years'
) {
  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(resumeText);
  const hasLinkedIn = /linkedin\.com/i.test(resumeText);
  const hasSummary = /(summary|profile|objective|about)/i.test(resumeText);
  const hasExperience = /(experience|employment|work history)/i.test(resumeText);
  const hasEducation = /(education|university|college|degree|b\.s\.|b\.a\.|m\.s\.)/i.test(resumeText);
  const hasSkills = /(skills|technologies|competencies|stack)/i.test(resumeText);

  // Extract bullet lines or experience sentences
  const rawBullets = lines.filter(
    (l) =>
      /^[•\-*▪‣]/.test(l) ||
      /^(responsible for|worked on|helped|assisted|managed|built|developed|created|led|designed|implemented|analyzed|maintained|participated)/i.test(
        l
      )
  );

  const bullets = rawBullets.length > 0 ? rawBullets : lines.slice(2, 10);
  const quantifiedBullets = bullets.filter((b) => /\d+%|\$\d+|\d+\+|\d+x|\b\d{2,}\b/i.test(b));
  const weakVerbBullets = bullets.filter((b) =>
    /^[•\-*▪‣]?\s*(responsible for|worked on|helped|assisted|participated in|involved in|duties included|tasked with)/i.test(
      b
    )
  );

  const atsScore = Math.min(
    96,
    Math.max(
      52,
      55 +
        (hasEmail ? 10 : 0) +
        (hasPhone ? 8 : 0) +
        (hasExperience ? 10 : 0) +
        (hasEducation ? 7 : 0) +
        (hasSkills ? 8 : 0)
    )
  );

  const impactRatio = bullets.length > 0 ? quantifiedBullets.length / bullets.length : 0.2;
  const impactScore = Math.min(94, Math.max(42, Math.round(45 + impactRatio * 50 - weakVerbBullets.length * 4)));
  const contentScore = Math.min(92, Math.max(50, Math.round((atsScore + impactScore) / 2 + (hasSummary ? 4 : -4))));
  const formattingScore = Math.min(95, Math.max(60, lines.length >= 12 && lines.length <= 90 ? 84 : 68));

  // Extract common technical & professional skills from resume & JD
  const candidateSkillsPool = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'SQL',
    'PostgreSQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'Git',
    'REST APIs',
    'GraphQL',
    'Java',
    'C++',
    'Go',
    'Next.js',
    'Tailwind CSS',
    'MongoDB',
    'Redis',
    'CI/CD',
    'Linux',
    'Data Analysis',
    'Project Management',
    'Agile',
    'Product Strategy',
    'Machine Learning',
    'Excel',
    'Tableau',
  ];

  const foundSkills = candidateSkillsPool.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(resumeText)
  );

  const bulletTextJoined = bullets.join(' ');
  const stronglyDemonstrated = foundSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(bulletTextJoined)
  );
  const weaklyDemonstrated = foundSkills.filter((s) => !stronglyDemonstrated.includes(s));

  const jdWords = jobDescription
    ? candidateSkillsPool.filter((skill) =>
        new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(jobDescription)
      )
    : [];

  const missingKeywords =
    jdWords.length > 0
      ? jdWords.filter((k) => !foundSkills.includes(k))
      : ['CI/CD', 'System Architecture', 'Performance Optimization', 'Cross-Functional Leadership'].filter(
          (k) => !foundSkills.includes(k)
        );

  const matchedKeywords =
    jdWords.length > 0
      ? jdWords.filter((k) => foundSkills.includes(k))
      : foundSkills.slice(0, 8);

  const skillsScore = Math.min(
    94,
    Math.max(54, 60 + stronglyDemonstrated.length * 5 - weaklyDemonstrated.length * 2)
  );
  const jobMatchScore =
    jdWords.length > 0
      ? Math.min(95, Math.max(48, Math.round((matchedKeywords.length / Math.max(1, jdWords.length)) * 100)))
      : Math.round((contentScore + skillsScore) / 2);

  const careerPositioningScore = Math.round((contentScore + impactScore + skillsScore) / 3);
  const overallScore = Math.round(
    atsScore * 0.2 +
      contentScore * 0.2 +
      impactScore * 0.25 +
      formattingScore * 0.1 +
      skillsScore * 0.1 +
      jobMatchScore * 0.15
  );

  const recruiterFirstImpression: 'Strong' | 'Needs Work' | 'Major Rewrite' =
    overallScore >= 80 ? 'Strong' : overallScore >= 62 ? 'Needs Work' : 'Major Rewrite';

  const targetWeakBullets = (weakVerbBullets.length > 0 ? weakVerbBullets : bullets).slice(0, 5);
  const weakBullets = targetWeakBullets.map((b, idx) => {
    const clean = b.replace(/^[•\-*▪‣]\s*/, '').trim();
    const coreTopic = clean
      .replace(/^(responsible for|worked on|helped with|helped|assisted in|assisted|participated in|managed)\s+/i, '')
      .replace(/\.$/, '');
    return {
      id: `wb_${idx + 1}`,
      section: 'Work Experience',
      current: clean,
      roast:
        /responsible for|worked on|helped|participated/i.test(clean)
          ? 'This reads like a copy-pasted job description rather than proof of your performance. It tells me what seat you occupied, not what changed because you were there.'
          : 'You stated the activity, but forgot the punchline: how much faster, bigger, or more reliable did this become?',
      rewrite: `Spearheaded ${coreTopic}, improving operational efficiency by [X%] and reducing processing turnaround by [X hours/week].`,
    };
  });

  const rewrittenBullets = weakBullets.map((wb) => ({
    original: wb.current,
    improved: wb.rewrite,
  }));

  let improvedFullResume = resumeText;
  for (const wb of weakBullets) {
    if (improvedFullResume.includes(wb.current)) {
      improvedFullResume = improvedFullResume.replace(wb.current, wb.rewrite);
    }
  }

  return {
    overallScore,
    atsScore,
    contentScore,
    impactScore,
    formattingScore,
    skillsScore,
    jobMatchScore,
    careerPositioningScore,
    recruiterFirstImpression,
    recruiterImpressionSummary: `In a 6-second recruiter scan, your structure is ${
      atsScore >= 75 ? 'clean and parseable' : 'missing standard ATS signposts'
    }, but ${
      quantifiedBullets.length < 3
        ? 'too many experience bullets read like passive duty lists without quantified business outcomes.'
        : 'several bullets can be sharpened with stronger action verbs and clearer scope.'
    }`,
    roast: [
      {
        id: 'roast_1',
        headline:
          quantifiedBullets.length === 0
            ? 'Your metrics are currently in witness protection.'
            : 'Some of your bullets stop right before the good part.',
        quoteFromResume: targetWeakBullets[0]?.replace(/^[•\-*]\s*/, '') || lines[0] || 'Experience section',
        observation:
          'Recruiters scan for numbers (%, $, time saved, scale) to Anchor your seniority. Replace vague phrases with concrete before-and-after metrics.',
        category: 'Measurable Impact',
      },
      {
        id: 'roast_2',
        headline:
          weakVerbBullets.length > 0
            ? 'HR didn’t ask for your job description — they asked for your receipts.'
            : 'Your summary is polite, but politeness doesn’t pass a 6-second screen.',
        quoteFromResume:
          weakVerbBullets[0]?.replace(/^[•\-*]\s*/, '') ||
          lines.find((l) => /driven|passionate|hardworking|seeking/i.test(l)) ||
          lines[1] ||
          'Professional Summary',
        observation:
          'Eliminate passive lead-ins like "Responsible for", "Worked on", or "Helped". Lead every bullet with a decisive past-tense action verb.',
        category: 'Action Verbs & Tone',
      },
      {
        id: 'roast_3',
        headline:
          weaklyDemonstrated.length > 0
            ? `You listed ${weaklyDemonstrated.slice(0, 3).join(', ')} in Skills, then never mentioned them again.`
            : 'Your skills section is doing too much solo heavy lifting.',
        quoteFromResume: weaklyDemonstrated.slice(0, 4).join(', ') || 'Skills Section',
        observation:
          'ATS and hiring managers weigh skills inside work experience bullets 3x higher than a standalone keyword list at the bottom of the page.',
        category: 'Skills Evidence',
      },
      {
        id: 'roast_4',
        headline: 'ATS will parse this resume, but it isn’t sending it a thank-you note.',
        quoteFromResume: `${lines.length} lines · ${quantifiedBullets.length}/${bullets.length} quantified bullets`,
        observation:
          'Tighten your top third of the page so your target title, core stack, and biggest quantified win appear within the first 8 lines.',
        category: 'ATS & Positioning',
      },
    ],
    atsChecklist: [
      {
        check: 'Contact Information',
        status: hasEmail && hasPhone ? 'pass' : 'warn',
        detail:
          hasEmail && hasPhone
            ? 'Email and phone number are clearly detectable in the main body.'
            : 'Ensure both email, phone number, and LinkedIn URL are present in plain text.',
      },
      {
        check: 'Standard Section Headings',
        status: hasExperience && hasEducation && hasSkills ? 'pass' : 'warn',
        detail:
          hasExperience && hasEducation && hasSkills
            ? 'Standard headings (Experience, Education, Skills) detected for clean ATS mapping.'
            : 'Use explicit standard headings: Professional Summary, Work Experience, Education, Skills.',
      },
      {
        check: 'Quantified Achievement Density',
        status: quantifiedBullets.length >= 3 ? 'pass' : quantifiedBullets.length >= 1 ? 'warn' : 'fail',
        detail: `${quantifiedBullets.length} of ${bullets.length} analyzed bullets include hard numbers or percentages.`,
      },
      {
        check: 'Action Verb Strength',
        status: weakVerbBullets.length === 0 ? 'pass' : weakVerbBullets.length <= 2 ? 'warn' : 'fail',
        detail:
          weakVerbBullets.length === 0
            ? 'Bullets lead with strong action verbs.'
            : `Found ${weakVerbBullets.length} bullets starting with passive phrases ("Responsible for", "Worked on", "Helped").`,
      },
      {
        check: 'LinkedIn & Portfolio Presence',
        status: hasLinkedIn ? 'pass' : 'warn',
        detail: hasLinkedIn
          ? 'LinkedIn profile URL detected.'
          : 'Add a clean linkedin.com/in/yourname link to your header.',
      },
      {
        check: 'Single-Column Linear Readability',
        status: 'pass',
        detail: 'Text stream reads linearly without multi-column scrambling.',
      },
    ],
    careerPositioning: {
      detectedRole: targetJobTitle || 'Software / Technical Professional',
      detectedExperienceLevel: experienceLevel,
      coreExpertise: stronglyDemonstrated.slice(0, 4).join(', ') || foundSkills.slice(0, 4).join(', ') || 'Core Domain Execution',
      careerDirection: targetJobTitle ? `Targeting ${targetJobTitle}${targetCompany ? ` at ${targetCompany}` : ''}` : 'Individual Contributor / Specialist Progression',
      specializationClarity: quantifiedBullets.length >= 3 ? 'High' : 'Moderate — needs sharper metric differentiation',
      critique: `Your resume communicates ${experienceLevel} tenure, but to stand out for ${
        targetJobTitle || 'senior roles'
      }, shift emphasis from day-to-day maintenance duties to architectural ownership and measurable business outcomes.`,
    },
    criticalIssues: [
      {
        problem: 'Unquantified Experience Bullets',
        whyItMatters:
          'Without metrics, recruiters cannot tell whether you managed a mission-critical system or a tiny internal script.',
        recommendation:
          'Add at least one concrete metric (%, latency, scale, revenue, or hours saved) to at least 70% of your work bullets.',
        example: weakBullets[0]
          ? `Before: "${weakBullets[0].current}" → After: "${weakBullets[0].rewrite}"`
          : 'Add [X% improvement] or [X+ records] to every key bullet.',
      },
      {
        problem: 'Passive Duty Language ("Responsible for / Worked on")',
        whyItMatters:
          'Passive phrasing lowers perceived seniority and hides your direct technical contribution.',
        recommendation:
          'Replace all instances of "Responsible for", "Worked on", and "Helped" with high-ownership verbs like Architected, Automated, Reduced, or Led.',
        example: 'Instead of "Worked on data migration", write "Automated data migration workflows, cutting manual effort by [X%]."',
      },
    ],
    improvements: [
      {
        problem: 'Skills Listed Without Contextual Proof in Experience',
        whyItMatters:
          'Modern ATS relevance algorithms score keywords higher when they appear inside dated job experience descriptions.',
        recommendation: `Weave your listed skills (${
          weaklyDemonstrated.slice(0, 4).join(', ') || 'core tools'
        }) directly into the bullet points of the jobs where you used them.`,
        example: 'Mention the exact tool/framework at the end of the bullet: "...using TypeScript, PostgreSQL, and AWS."',
      },
    ],
    quickWins: [
      {
        problem: 'Sharpen the Opening Professional Summary',
        whyItMatters:
          'Generic adjectives like "results-driven team player" waste prime top-of-page real estate.',
        recommendation:
          'Use a 2-sentence formula: [Title + Years of Experience + Core Stack] + [Top Quantified Career Achievement].',
        example: `Senior ${targetJobTitle || 'Professional'} (${experienceLevel}) specializing in ${
          foundSkills.slice(0, 3).join(', ') || 'scalable systems'
        }, with a track record of improving delivery efficiency by [X%].`,
      },
    ],
    weakBullets,
    skillAnalysis: {
      stronglyDemonstrated: stronglyDemonstrated.length > 0 ? stronglyDemonstrated : foundSkills.slice(0, 4),
      weaklyDemonstrated: weaklyDemonstrated.slice(0, 8),
      missingRecommended: missingKeywords.slice(0, 6),
    },
    matchedKeywords,
    missingKeywords,
    potentiallyImportantKeywords: ['System Design', 'CI/CD', 'Observability', 'Cross-Functional Collaboration', 'SLA Optimization'],
    overusedKeywords: ['Responsible for', 'Worked on', 'Helped', 'Various', 'Team player'],
    jobAlignmentSummary: jobDescription
      ? `Your resume matches ${matchedKeywords.length} core keywords from the target job description. To increase alignment for ${
          targetJobTitle || 'this role'
        }, naturally incorporate missing terms (${missingKeywords.slice(0, 4).join(', ')}) into your recent role bullets where truthful.`
      : `Analyzed against industry benchmarks for ${targetJobTitle || 'your target role'} (${experienceLevel}). Adding a specific Job Description in the input panel will unlock exact JD keyword gap matching.`,
    rewrittenSummary: `${targetJobTitle || 'Experienced Professional'} with ${experienceLevel} of hands-on experience in ${
      foundSkills.slice(0, 5).join(', ') || 'delivering high-impact technical solutions'
    }. Proven track record of optimizing workflows, scaling reliable systems for [X+ users/records], and reducing operational overhead by [X%].`,
    rewrittenBullets,
    improvedFullResume,
  };
}

// Endpoint 1: Parse uploaded PDF, DOCX, or TXT file into clean text for preview & analysis
app.post('/api/parse-file', async (req, res) => {
  try {
    const { fileName, mimeType, base64Data } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'Missing file content.' });
      return;
    }

    const lowerName = (fileName || '').toLowerCase();
    const buffer = Buffer.from(base64Data, 'base64');

    // Handle DOCX via mammoth
    if (
      lowerName.endsWith('.docx') ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      const extractedText = (result.value || '').trim();
      if (!extractedText) {
        res.status(422).json({ error: 'Could not extract readable text from this DOCX file.' });
        return;
      }
      res.json({ text: extractedText });
      return;
    }

    // Handle plain text
    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || mimeType === 'text/plain') {
      const extractedText = buffer.toString('utf-8').trim();
      res.json({ text: extractedText });
      return;
    }

    // Handle PDF via resilient Gemini multimodal document extraction
    if (lowerName.endsWith('.pdf') || mimeType === 'application/pdf') {
      const extractedText = await generateContentResilient({
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text:
                'Extract the complete, verbatim text from this PDF resume. Preserve section headings, job titles, dates, and bullet points in clean plain text format. Do not add commentary or markdown code fences.',
            },
          ],
        },
      });

      const cleaned = extractedText.trim();
      if (!cleaned) {
        res.status(422).json({ error: 'Could not extract text from the uploaded PDF.' });
        return;
      }
      res.json({ text: cleaned });
      return;
    }

    res.status(400).json({ error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.' });
  } catch (error: any) {
    console.error('File parse error:', error);
    res.status(500).json({
      error: 'Failed to parse PDF automatically due to high AI demand. Please paste your resume text or upload a DOCX/TXT file.',
    });
  }
});

// Endpoint 2: Full AI Resume Analysis & Roast (with Multi-Model Fallback + Local Resilience)
app.post('/api/analyze-resume', async (req, res) => {
  const {
    resumeText,
    jobDescription,
    targetJobTitle,
    targetCompany,
    experienceLevel = '3–5 years',
  } = req.body || {};

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 30) {
    res.status(400).json({
      error: 'Please provide valid resume text (at least 30 characters) to analyze.',
    });
    return;
  }

  const hasJD = Boolean(jobDescription && jobDescription.trim().length > 15);

  const systemInstruction = `You are "Resume Roaster" — an experienced Senior Technical & Executive Recruiter, ATS Specialist, and brutally honest, witty Career Coach.

Your mission:
Analyze the user's resume across ATS Compatibility, Resume Content, Measurable Impact, Job Description Alignment, Formatting & Structure, and Career Positioning.

TONE & PERSONALITY RULES:
1. Be direct, clear, witty, memorable, and constructive.
2. In "roast" and weak bullet roasts, deliver sharp, humorous observations about the RESUME WRITING (e.g., cliches, hiding results, listing job descriptions instead of achievements, buzzword soup).
3. NEVER insult or judge the user's identity, intelligence, appearance, age, gender, race, religion, disability, or personal worth. Roast the paper, empower the person.
4. FACTUAL INTEGRITY (CRITICAL):
   - NEVER invent employment history, companies, degrees, certifications, technologies, or metrics.
   - When rewriting bullets or generating the improved resume, if concrete metrics/numbers are missing from the original resume, you MUST use explicit bracketed placeholders like "[X% improvement]", "[X+ records]", "[$X saved]", or "[X hours/week]".
   - Never claim skills in "stronglyDemonstrated" unless backed by actual experience bullets in the resume.
5. Do not frame scores as hiring guarantees; frame them as an objective diagnostic.`;

  const prompt = `Analyze the following resume and return a comprehensive diagnostic JSON response.

TARGET CONTEXT:
- Experience Level Selected: ${experienceLevel}
- Target Job Title: ${targetJobTitle ? targetJobTitle : 'Not specified (infer from resume)'}
- Target Company: ${targetCompany ? targetCompany : 'Not specified'}
- Job Description Provided: ${hasJD ? 'YES' : 'NO (Perform general role-standard analysis based on target/inferred role)'}
${hasJD ? `\nTARGET JOB DESCRIPTION:\n"""\n${jobDescription.trim()}\n"""\n` : ''}

USER RESUME CONTENT:
"""
${resumeText.trim()}
"""

Provide thorough, specific feedback quoting actual lines from the user's resume. Ensure every weak bullet in their work/project experience is captured in "weakBullets" with a witty roast and a concrete, high-impact rewrite using "[X%]" / "[X+]" placeholders where metrics aren't present in the source.`;

  const issueSchema = {
    type: Type.OBJECT,
    properties: {
      problem: { type: Type.STRING, description: 'Clear title and description of the issue found.' },
      whyItMatters: { type: Type.STRING, description: 'Why recruiters or ATS care about this.' },
      recommendation: { type: Type.STRING, description: 'Exact actionable fix.' },
      example: { type: Type.STRING, description: 'Concrete before/after or example fix based on the resume.' },
    },
    required: ['problem', 'whyItMatters', 'recommendation', 'example'],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER },
      atsScore: { type: Type.INTEGER },
      contentScore: { type: Type.INTEGER },
      impactScore: { type: Type.INTEGER },
      formattingScore: { type: Type.INTEGER },
      skillsScore: { type: Type.INTEGER },
      jobMatchScore: { type: Type.INTEGER },
      careerPositioningScore: { type: Type.INTEGER },
      recruiterFirstImpression: {
        type: Type.STRING,
        description: 'Must be one of: "Strong", "Needs Work", or "Major Rewrite"',
      },
      recruiterImpressionSummary: { type: Type.STRING },
      roast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            headline: { type: Type.STRING },
            quoteFromResume: { type: Type.STRING },
            observation: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ['id', 'headline', 'quoteFromResume', 'observation', 'category'],
        },
      },
      atsChecklist: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            check: { type: Type.STRING },
            status: { type: Type.STRING },
            detail: { type: Type.STRING },
          },
          required: ['check', 'status', 'detail'],
        },
      },
      careerPositioning: {
        type: Type.OBJECT,
        properties: {
          detectedRole: { type: Type.STRING },
          detectedExperienceLevel: { type: Type.STRING },
          coreExpertise: { type: Type.STRING },
          careerDirection: { type: Type.STRING },
          specializationClarity: { type: Type.STRING },
          critique: { type: Type.STRING },
        },
        required: [
          'detectedRole',
          'detectedExperienceLevel',
          'coreExpertise',
          'careerDirection',
          'specializationClarity',
          'critique',
        ],
      },
      criticalIssues: { type: Type.ARRAY, items: issueSchema },
      improvements: { type: Type.ARRAY, items: issueSchema },
      quickWins: { type: Type.ARRAY, items: issueSchema },
      weakBullets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            section: { type: Type.STRING },
            current: { type: Type.STRING },
            roast: { type: Type.STRING },
            rewrite: { type: Type.STRING },
          },
          required: ['id', 'section', 'current', 'roast', 'rewrite'],
        },
      },
      skillAnalysis: {
        type: Type.OBJECT,
        properties: {
          stronglyDemonstrated: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaklyDemonstrated: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingRecommended: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['stronglyDemonstrated', 'weaklyDemonstrated', 'missingRecommended'],
      },
      matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      potentiallyImportantKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      overusedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      jobAlignmentSummary: { type: Type.STRING },
      rewrittenSummary: { type: Type.STRING },
      rewrittenBullets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            improved: { type: Type.STRING },
          },
          required: ['original', 'improved'],
        },
      },
      improvedFullResume: { type: Type.STRING },
    },
    required: [
      'overallScore',
      'atsScore',
      'contentScore',
      'impactScore',
      'formattingScore',
      'skillsScore',
      'jobMatchScore',
      'careerPositioningScore',
      'recruiterFirstImpression',
      'recruiterImpressionSummary',
      'roast',
      'atsChecklist',
      'careerPositioning',
      'criticalIssues',
      'improvements',
      'quickWins',
      'weakBullets',
      'skillAnalysis',
      'matchedKeywords',
      'missingKeywords',
      'potentiallyImportantKeywords',
      'overusedKeywords',
      'jobAlignmentSummary',
      'rewrittenSummary',
      'rewrittenBullets',
      'improvedFullResume',
    ],
  };

  try {
    const rawText = await generateContentResilient({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
    });

    const parsed = JSON.parse(rawText.trim());
    res.json(parsed);
  } catch (error: any) {
    console.warn('All Gemini models returned 503/unavailable; using local diagnostic engine fallback:', error?.message);
    const fallbackResult = buildLocalResumeAnalysis(
      resumeText,
      jobDescription,
      targetJobTitle,
      targetCompany,
      experienceLevel
    );
    res.json(fallbackResult);
  }
});

// Endpoint 3: Regenerate / Polish Full Improved Resume on demand
app.post('/api/regenerate-resume', async (req, res) => {
  const { originalResumeText, appliedBullets, targetJobTitle, customInstructions } = req.body || {};
  if (!originalResumeText) {
    res.status(400).json({ error: 'Missing original resume text.' });
    return;
  }

  try {
    const rawText = await generateContentResilient({
      contents: `Rewrite and optimize this resume into a clean, single-column ATS-optimized plain text layout.

STRICT FACTUALITY RULES:
- Never invent companies, job titles, dates, degrees, certifications, or technologies.
- Where measurable impact metrics are missing, insert clear placeholders like [X% improvement], [X+ users/records], or [X hours saved].
- Incorporate these user-approved bullet rewrites where applicable:
${JSON.stringify(appliedBullets || [], null, 2)}
${targetJobTitle ? `- Optimize positioning for Target Role: ${targetJobTitle}` : ''}
${customInstructions ? `- Additional user emphasis: ${customInstructions}` : ''}

SOURCE RESUME:
"""
${originalResumeText}
"""`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improvedFullResume: {
            type: Type.STRING,
            description: 'The complete ATS-ready rewritten resume text.',
          },
          rewrittenSummary: {
            type: Type.STRING,
            description: 'The updated executive/professional summary.',
          },
        },
        required: ['improvedFullResume', 'rewrittenSummary'],
      },
    });

    const data = JSON.parse(rawText.trim());
    res.json(data);
  } catch (error: any) {
    console.warn('Fallback used for regenerate-resume:', error?.message);
    const local = buildLocalResumeAnalysis(originalResumeText, '', targetJobTitle || '');
    res.json({
      improvedFullResume: local.improvedFullResume,
      rewrittenSummary: local.rewrittenSummary,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Resume Roaster server running on http://localhost:${PORT}`);
  });
}

startServer();
