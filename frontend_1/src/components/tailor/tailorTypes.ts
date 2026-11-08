export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  portfolio?: string;
}

export type GroundingStatus = "grounding_verified" | "retained_original" | "flagged";

export interface TailoredBullet {
  id: string;
  original: string;
  tailored: string;
  explanation: string;
  grounding_status: GroundingStatus;
}

export interface ProjectItem {
  id: string;
  title: string;
  technologies?: string;
  dates?: string;
  description?: string;
  bullets: TailoredBullet[];
}

export interface WorkExperienceItem {
  id: string;
  company: string;
  role: string;
  dates?: string;
  location?: string;
  bullets: TailoredBullet[];
}

export interface SkillsCategory {
  category: string;
  skills: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  location?: string;
  dates?: string;
  gpa_or_details?: string;
}

export interface CertificationItem {
  name: string;
  issuer?: string;
  date?: string;
}

export interface AdditionalSectionItem {
  heading: string;
  items: string[];
}

export interface PreservationAudit {
  preserved_unchanged_count: number;
  rewritten_verified_count: number;
  flagged_count: number;
  missing_rejected_count: number;
}

export type SeniorityLevel =
  | "internship"
  | "entry-level"
  | "junior"
  | "mid-level"
  | "senior"
  | "staff";

export type ToneType = "professional" | "concise" | "impact-driven" | "technical";

export interface TailoredResumeData {
  id: string;
  resume_id: string;
  resume_filename: string;
  contact: ContactInfo;
  target_role: string;
  target_company?: string;
  seniority: SeniorityLevel;
  tone: ToneType;
  professional_summary: string;
  skills_categories: SkillsCategory[];
  experience: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  additional_sections?: AdditionalSectionItem[];
  skill_gaps: string[];
  unsupported_claims_flagged: string[];
  validation_summary: string;
  grounding_verified: boolean;
  content_preservation_verified: boolean;
  preservation_audit: PreservationAudit;
  raw_markdown: string;
  created_at: string;
}
