import { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Code2,
  FolderGit2,
  GraduationCap,
  Layers,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { TailoredResumeData } from "./tailorTypes";
import { cn } from "@/lib/utils";

interface TailorEditorProps {
  resume: TailoredResumeData;
  onChange: (updated: TailoredResumeData) => void;
}

export function TailorEditor({ resume, onChange }: TailorEditorProps) {
  const [activeSection, setActiveSection] = useState<string>("summary");

  const sections = [
    { id: "summary", label: "Summary", icon: User },
    { id: "skills", label: "Skills", icon: Code2 },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: FolderGit2 },
    { id: "education", label: "Education", icon: GraduationCap },
  ];

  const handleUpdateSummary = (val: string) => {
    onChange({ ...resume, professional_summary: val });
  };

  const handleUpdateExperienceBullet = (
    expIdx: number,
    bulletIdx: number,
    val: string
  ) => {
    const item = resume.experience[expIdx];
    if (!item) return;
    const bullet = item.bullets[bulletIdx];
    if (!bullet) return;
    const nextBullets = [...item.bullets];
    nextBullets[bulletIdx] = { ...bullet, tailored: val };
    const nextExp = [...resume.experience];
    nextExp[expIdx] = { ...item, bullets: nextBullets };
    onChange({ ...resume, experience: nextExp });
  };

  const handleUpdateProjectDesc = (projIdx: number, val: string) => {
    const item = resume.projects[projIdx];
    if (!item) return;
    const nextProj = [...resume.projects];
    nextProj[projIdx] = { ...item, description: val };
    onChange({ ...resume, projects: nextProj });
  };

  const handleUpdateProjectBullet = (
    projIdx: number,
    bulletIdx: number,
    val: string
  ) => {
    const item = resume.projects[projIdx];
    if (!item) return;
    const bullet = item.bullets[bulletIdx];
    if (!bullet) return;
    const nextBullets = [...item.bullets];
    nextBullets[bulletIdx] = { ...bullet, tailored: val };
    const nextProj = [...resume.projects];
    nextProj[projIdx] = { ...item, bullets: nextBullets };
    onChange({ ...resume, projects: nextProj });
  };


  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`editor-sec-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Sticky Section Quick Jump Navigation */}
      <div className="surface-card p-2.5 flex items-center justify-between gap-2 overflow-x-auto sticky top-16 z-10 backdrop-blur bg-card/90">
        <div className="flex items-center gap-1.5 min-w-max">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                activeSection === id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-success border-success/40 bg-success-soft">
          <CheckCircle2 className="size-3 mr-1" /> Live Sync Active
        </Badge>
      </div>

      {/* Editor Surface */}
      <div className="surface-card p-6 space-y-8">
        {/* Contact Info Header (Preview) */}
        <div className="border-b border-border pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {resume.contact.name || "Candidate Name"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {[
                  resume.contact.email,
                  resume.contact.phone,
                  resume.contact.location,
                  resume.contact.linkedin,
                  resume.contact.github,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              ATS Single-Column Format
            </Badge>
          </div>
        </div>

        {/* 1. Professional Summary */}
        <div id="editor-sec-summary" className="space-y-2 pt-1 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-primary" />
              Professional Summary
            </h4>
            <span className="text-[11px] text-muted-foreground">Editable · Included in download</span>
          </div>
          <Textarea
            rows={4}
            value={resume.professional_summary}
            onChange={(e) => handleUpdateSummary(e.target.value)}
            className="text-xs leading-relaxed bg-background font-normal"
            placeholder="Write a concise professional summary tailored to the target role..."
          />
        </div>

        {/* 2. Technical Skills */}
        <div id="editor-sec-skills" className="space-y-3 pt-2 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code2 className="size-3.5 text-primary" />
              Technical Skills Categories
            </h4>
            <span className="text-[11px] text-muted-foreground">Keyword-aligned</span>
          </div>
          <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-4">
            {resume.skills_categories.map((cat, idx) => (
              <div key={idx} className="text-xs flex flex-wrap items-baseline gap-1.5">
                <span className="font-semibold text-foreground min-w-[150px]">{cat.category}:</span>
                <span className="text-muted-foreground">{cat.skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Work Experience */}
        <div id="editor-sec-experience" className="space-y-4 pt-2 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-primary" />
              Work Experience ({resume.experience.length})
            </h4>
            <span className="text-[11px] text-muted-foreground">Reformulated with impact verbs</span>
          </div>

          <div className="space-y-4">
            {resume.experience.map((exp, eIdx) => (
              <div
                key={exp.id || eIdx}
                className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-border/60">
                  <span className="text-sm font-bold text-foreground">
                    {exp.role} <span className="font-normal text-muted-foreground">at</span> {exp.company}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {exp.location && <span>{exp.location}</span>}
                    {exp.dates && <Badge variant="outline">{exp.dates}</Badge>}
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-3 pt-1">
                  {exp.bullets.map((b, bIdx) => (
                    <div key={b.id || bIdx} className="space-y-1.5 pl-1">
                      <div className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-1 text-sm">•</span>
                        <div className="flex-1 space-y-1">
                          <Input
                            value={b.tailored}
                            onChange={(e) =>
                              handleUpdateExperienceBullet(eIdx, bIdx, e.target.value)
                            }
                            className="text-xs font-medium bg-background"
                          />
                          <p className="text-[11px] text-muted-foreground/80 pl-1">
                            <span className="font-semibold text-muted-foreground">Source fact:</span>{" "}
                            "{b.original}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Technical Projects */}
        <div id="editor-sec-projects" className="space-y-4 pt-2 scroll-mt-28">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderGit2 className="size-3.5 text-primary" />
              Technical Projects ({resume.projects.length})
            </h4>
            <span className="text-[11px] text-muted-foreground">Architectural relevance</span>
          </div>

          <div className="space-y-4">
            {resume.projects.map((proj, pIdx) => (
              <div
                key={proj.id || pIdx}
                className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-border/60">
                  <span className="text-sm font-bold text-foreground">{proj.title}</span>
                  <div className="flex items-center gap-2">
                    {proj.technologies && (
                      <span className="text-xs text-primary font-mono">{proj.technologies}</span>
                    )}
                    {proj.dates && <Badge variant="outline">{proj.dates}</Badge>}
                  </div>
                </div>

                {/* Project Description Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Project Scope / Architecture
                  </label>
                  <Input
                    value={proj.description || ""}
                    placeholder="Brief description of architecture and technical scope..."
                    onChange={(e) => handleUpdateProjectDesc(pIdx, e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>

                {/* Bullets */}
                <div className="space-y-3 pt-1">
                  {proj.bullets.map((b, bIdx) => (
                    <div key={b.id || bIdx} className="space-y-1.5 pl-1">
                      <div className="flex items-start gap-2">
                        <span className="text-primary font-bold mt-1 text-sm">•</span>
                        <div className="flex-1 space-y-1">
                          <Input
                            value={b.tailored}
                            onChange={(e) =>
                              handleUpdateProjectBullet(pIdx, bIdx, e.target.value)
                            }
                            className="text-xs font-medium bg-background"
                          />
                          <p className="text-[11px] text-muted-foreground/80 pl-1">
                            <span className="font-semibold text-muted-foreground">Source fact:</span>{" "}
                            "{b.original}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Education & Credentials */}
        <div id="editor-sec-education" className="space-y-3 pt-2 scroll-mt-28">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-primary" />
            Education & Certifications
          </h4>
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2.5">
            {resume.education.map((edu, idx) => (
              <div key={idx} className="flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="font-bold text-foreground">
                  {edu.degree} — {edu.institution}
                  {edu.gpa_or_details && ` (${edu.gpa_or_details})`}
                </span>
                <span className="text-muted-foreground font-mono">{edu.dates}</span>
              </div>
            ))}
            {resume.certifications.map((cert, idx) => (
              <div key={idx} className="flex flex-wrap items-center justify-between text-xs gap-1 pt-1 border-t border-border/50">
                <span className="text-foreground">
                  {cert.name}
                  {cert.issuer && ` · ${cert.issuer}`}
                </span>
                <span className="text-muted-foreground font-mono">{cert.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
