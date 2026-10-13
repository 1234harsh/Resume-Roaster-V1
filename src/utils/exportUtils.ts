import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { ResumeAnalysisResult } from '../types';

export async function exportResumeToPDF(resumeText: string, fileName = 'Improved_Resume.pdf') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxLineWidth = pageWidth - margin * 2;
  let y = margin;

  const lines = resumeText.split('\n');
  doc.setFont('helvetica', 'normal');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const isHeader =
      line.length > 0 &&
      line.length < 48 &&
      (line === line.toUpperCase() || /^(SUMMARY|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS)/i.test(line));

    if (isHeader) {
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }

    const wrappedLines = doc.splitTextToSize(line || ' ', maxLineWidth);
    for (const wLine of wrappedLines) {
      if (y + 16 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wLine, margin, y);
      y += isHeader ? 16 : 14;
    }
  }

  doc.save(fileName);
}

export async function exportResumeToDOCX(resumeText: string, fileName = 'Improved_Resume.docx') {
  const lines = resumeText.split('\n');
  const children: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      children.push(new Paragraph({ text: '' }));
      continue;
    }

    const isHeader =
      line.length < 48 &&
      (line === line.toUpperCase() || /^(SUMMARY|EXPERIENCE|WORK EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS)/i.test(line));

    if (isHeader) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: line, bold: true, size: 24 })],
        })
      );
    } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [new TextRun({ text: line.replace(/^[•\-*]\s*/, ''), size: 21 })],
        })
      );
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: line, size: 21 })],
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAnalysisReportPDF(report: ResumeAnalysisResult) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const addSectionTitle = (title: string) => {
    if (y + 36 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += 18;
  };

  const addParagraph = (text: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    const wrapped = doc.splitTextToSize(text, maxWidth);
    for (const line of wrapped) {
      if (y + 15 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    }
    y += 4;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Resume Roaster — Diagnostic Report', margin, y);
  y += 22;

  addParagraph(
    `Candidate File: ${report.fileName} · Analyzed: ${new Date(report.createdAt).toLocaleDateString()} · Experience Level: ${report.experienceLevel}`
  );
  addParagraph(
    `Overall Score: ${report.overallScore}/100 | ATS: ${report.atsScore}/100 | Impact: ${report.impactScore}/100 | Content: ${report.contentScore}/100 | Formatting: ${report.formattingScore}/100 | Skills: ${report.skillsScore}/100 | Job Match: ${report.jobMatchScore}/100`,
    true
  );
  addParagraph(
    `Recruiter First Impression: ${report.recruiterFirstImpression} — ${report.recruiterImpressionSummary}`
  );

  addSectionTitle('1. The Roast');
  for (const r of report.roast) {
    addParagraph(`• "${r.headline}" (${r.category})`, true);
    addParagraph(`  Resume Quote: "${r.quoteFromResume}"`);
    addParagraph(`  Fix: ${r.observation}`);
  }

  addSectionTitle('2. Critical Issues');
  for (const issue of report.criticalIssues) {
    addParagraph(`• ${issue.problem}`, true);
    addParagraph(`  Why it matters: ${issue.whyItMatters}`);
    addParagraph(`  Recommendation: ${issue.recommendation}`);
  }

  addSectionTitle('3. Bullet Point Rewrites');
  for (const b of report.weakBullets) {
    addParagraph(`Current: "${b.current}"`);
    addParagraph(`Roast: ${b.roast}`);
    addParagraph(`Rewrite: "${b.rewrite}"`, true);
  }

  doc.save(`Resume_Roaster_Report_${report.fileName.replace(/\.[^.]+$/, '')}.pdf`);
}

export const SAMPLE_RESUME_TEXT = `ALEX MERCER
San Francisco, CA | alex.mercer@email.com | (555) 234-5678 | linkedin.com/in/alexmercer

PROFESSIONAL SUMMARY
Results-driven and detail-oriented Senior Full-Stack Developer with a passion for building scalable web applications. Hardworking team player seeking a challenging role where I can utilize my skills and grow professionally.

WORK EXPERIENCE

Senior Software Engineer | CloudPulse Technologies | Jan 2023 – Present
• Responsible for managing backend microservices and APIs for the customer analytics portal.
• Worked on data migration projects from legacy SQL databases to modern cloud infrastructure.
• Helped the frontend team build new dashboard features using React and TypeScript.
• Participated in code reviews, daily standups, and sprint planning meetings with product managers.
• Fixed various production bugs and improved server response times.

Software Developer | NexaRetail Inc. | Jun 2020 – Dec 2022
• Built e-commerce checkout pages and integrated third-party payment gateways.
• Responsible for database queries and maintaining PostgreSQL tables.
• Worked closely with QA engineers to test new software releases before deployment.
• Assisted in onboarding junior developers and documenting internal APIs.

EDUCATION
B.S. in Computer Science | University of California, Davis | 2016 – 2020

SKILLS
JavaScript, TypeScript, React, Node.js, Python, SQL, PostgreSQL, AWS, Docker, Git, Agile, Communication, Teamwork, Problem Solving`;

export const SAMPLE_JD_TEXT = `Senior Full-Stack Engineer — FinTech Platform (Stripe / Scale-stage)
We are looking for a Senior Full-Stack Engineer (5+ years experience) to architect high-throughput distributed systems and customer-facing analytics applications.
Requirements:
- Strong proficiency in TypeScript, React, Node.js, and PostgreSQL.
- Proven track record of designing event-driven microservices on AWS, Kubernetes, and Redis.
- Experience optimizing CI/CD pipelines, observability (Datadog/OpenTelemetry), and API latency at scale.
- Demonstrated history of measurable business impact, system reliability (99.99% uptime), and technical mentorship.`;
