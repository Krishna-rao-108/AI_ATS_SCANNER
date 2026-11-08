import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileText,
  Loader2,
  Printer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { downloadText } from "@/components/app/ui";
import type { TailoredResumeData } from "./tailorTypes";
import { exportResumeAsMarkdown } from "./tailorMockData";

interface TailorDocumentPreviewProps {
  resume: TailoredResumeData;
}

export function TailorDocumentPreview({ resume }: TailorDocumentPreviewProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    const md = exportResumeAsMarkdown(resume);
    navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("Tailored resume copied to clipboard as Markdown!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const md = exportResumeAsMarkdown(resume);
    const filename = `${resume.contact.name.replace(/\s+/g, "_")}_Tailored_ATS_Resume.txt`;
    downloadText(filename, md, "text/plain");
    toast.success(`Downloaded ATS Plaintext: ${filename}`);
  };

  const handleDownloadDocument = (format: "pdf" | "docx") => {
    setDownloadingFormat(format);
    const md = exportResumeAsMarkdown(resume);
    const filename = `${resume.contact.name.replace(/\s+/g, "_")}_Tailored_ATS_Resume.${format}`;

    // Simulate formatting generation latency
    setTimeout(() => {
      // Create a mock downloadable blob with resume content
      const mime =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      downloadText(filename, md, mime);
      setDownloadingFormat(null);
      toast.success(
        `Downloaded demo ${format.toUpperCase()} document: ${filename} (Zero Content Loss)`
      );
    }, 850);
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="surface-card p-4 flex flex-wrap items-center justify-between gap-3 bg-card">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <div>
            <h4 className="text-xs font-bold text-foreground">ATS Document Preview</h4>
            <p className="text-[11px] text-muted-foreground">
              Single-column, machine-readable ATS format with 100% selectable text
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleDownloadDocument("pdf")}
            disabled={downloadingFormat !== null}
            className="gap-1.5 shadow-xs"
          >
            {downloadingFormat === "pdf" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Download PDF
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDownloadDocument("docx")}
            disabled={downloadingFormat !== null}
            className="gap-1.5"
          >
            {downloadingFormat === "docx" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            Download DOCX
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadTxt}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            .TXT
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyMarkdown}
            className="gap-1.5"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Markdown"}
          </Button>
        </div>
      </div>

      {/* Realistic Document Paper Container */}
      <div className="surface-card p-8 md:p-12 shadow-lift bg-card border border-border/80 text-foreground max-w-4xl mx-auto space-y-6">
        {/* Document Header */}
        <div className="text-center border-b border-border pb-5 space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
            {resume.contact.name || "Candidate Name"}
          </h1>
          <p className="text-xs text-muted-foreground font-mono flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
            {resume.contact.location && <span>{resume.contact.location}</span>}
            {resume.contact.phone && <span>{resume.contact.phone}</span>}
            {resume.contact.email && <span>{resume.contact.email}</span>}
            {resume.contact.linkedin && <span>{resume.contact.linkedin}</span>}
            {resume.contact.github && <span>{resume.contact.github}</span>}
          </p>
        </div>

        {/* Professional Summary */}
        {resume.professional_summary && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              Professional Summary
            </h2>
            <p className="text-xs leading-relaxed text-foreground/90 font-normal">
              {resume.professional_summary}
            </p>
          </div>
        )}

        {/* Technical Skills */}
        {resume.skills_categories.length > 0 && (
          <div className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              Technical Skills
            </h2>
            <div className="space-y-1 text-xs">
              {resume.skills_categories.map((cat, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-1.5">
                  <span className="font-semibold text-foreground">{cat.category}:</span>
                  <span className="text-muted-foreground">{cat.skills.join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {resume.experience.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {resume.experience.map((exp, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex flex-wrap justify-between items-baseline font-bold text-foreground">
                    <span>
                      {exp.role} — <span className="font-semibold">{exp.company}</span>
                    </span>
                    <span className="text-muted-foreground font-mono font-normal">
                      {exp.dates} {exp.location && `| ${exp.location}`}
                    </span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 pt-1 text-foreground/90">
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {b.tailored}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Projects */}
        {resume.projects.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              Technical Projects
            </h2>
            <div className="space-y-4">
              {resume.projects.map((proj, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex flex-wrap justify-between items-baseline font-bold text-foreground">
                    <span>{proj.title}</span>
                    {proj.dates && (
                      <span className="text-muted-foreground font-mono font-normal">
                        {proj.dates}
                      </span>
                    )}
                  </div>
                  {proj.technologies && (
                    <p className="text-[11px] text-primary italic font-mono">
                      Tech Stack: {proj.technologies}
                    </p>
                  )}
                  {proj.description && (
                    <p className="text-xs text-muted-foreground">{proj.description}</p>
                  )}
                  <ul className="list-disc pl-5 space-y-1 pt-1 text-foreground/90">
                    {proj.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        {b.tailored}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              Education
            </h2>
            <div className="space-y-1.5 text-xs">
              {resume.education.map((edu, idx) => (
                <div key={idx} className="flex flex-wrap justify-between items-baseline">
                  <span className="font-bold text-foreground">
                    {edu.degree} — {edu.institution}
                    {edu.gpa_or_details && ` (${edu.gpa_or_details})`}
                  </span>
                  <span className="text-muted-foreground font-mono">{edu.dates}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              Certifications
            </h2>
            <div className="space-y-1 text-xs">
              {resume.certifications.map((c, idx) => (
                <div key={idx} className="flex flex-wrap justify-between items-baseline">
                  <span className="font-medium text-foreground">
                    {c.name} {c.issuer && `— ${c.issuer}`}
                  </span>
                  <span className="text-muted-foreground font-mono">{c.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        {resume.additional_sections?.map((addSec, idx) => (
          <div key={idx} className="space-y-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
              {addSec.heading}
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-xs text-foreground/90">
              {addSec.items.map((item, itemIdx) => (
                <li key={itemIdx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
