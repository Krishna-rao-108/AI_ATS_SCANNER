export interface AnalysisResultData {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  summary?: string;
}

export interface AnalysisRequest {
  resume_id: number;
  jd_id?: number | null;
  analysis_type?: string;
}

export interface AnalysisApiResponse {
  id: number;
  resume_id: number;
  jd_id?: number | null;
  analysis_type?: string;
  result: string | AnalysisResultData;
}

export interface AnalysisHistoryRecord {
  id: number;
  resume_id: number;
  jd_id?: number | null;
  analysis_type?: string;
  resume_title?: string;
  jd_title?: string;
  result: string | AnalysisResultData;
}

export interface StoredAnalysisRecord {
  id: number;
  resume_id: number;
  jd_id?: number | null;
  analysis_type?: string;
  resume_title?: string;
  jd_title?: string;
  result_data: AnalysisResultData;
  created_at: string;
}

export interface ContactInfo {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  portfolio?: string;
}

export interface BulletComparison {
  original: string;
  tailored: string;
  explanation: string;
  source_evidence: string;
  grounding_status: string; // 'verified' | 'retained_original' | 'flagged'
}

export interface WorkExperienceItem {
  company: string;
  role: string;
  location?: string;
  dates?: string;
  bullets: BulletComparison[];
}

export interface ProjectItem {
  title: string;
  technologies?: string;
  dates?: string;
  description?: string;
  link?: string;
  bullets: BulletComparison[];
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

export interface SkillsCategory {
  category: string;
  skills: string[];
}

export interface AdditionalSectionItem {
  heading: string;
  items: string[];
}

export interface PreservationAuditItem {
  category: string;
  item_name: string;
  status: 'preserved_unchanged' | 'rewritten_verified' | 'added_verified' | 'flagged_for_review' | 'missing_or_rejected';
  source_text: string;
  tailored_text?: string;
  notes?: string;
}

export interface ContentPreservationAudit {
  preserved_unchanged_count: number;
  rewritten_verified_count: number;
  added_verified_count: number;
  flagged_count: number;
  missing_rejected_count: number;
  items: PreservationAuditItem[];
}

export interface TailoredResumeData {
  contact: ContactInfo;
  target_role: string;
  target_company?: string;
  seniority: string;
  tone: string;
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
  preservation_audit?: ContentPreservationAudit;
  preservation_warnings?: string[];
}

export type SeniorityLevel = 'internship' | 'entry-level' | 'junior' | 'mid-level' | 'senior' | 'staff';
export type ToneType = 'professional' | 'concise' | 'impact-driven' | 'technical';

export interface ResumeTailorRequest {
  resume_id: number;
  target_role?: string;
  job_title?: string;
  company_name?: string;
  job_description: string;
  tone?: ToneType;
  seniority?: SeniorityLevel;
}

export interface TailoredBullet {
  original: string;
  tailored: string;
  explanation: string;
}

export interface ResumeTailorResponse {
  resume_id: number;
  target_role: string;
  company_name?: string;
  tone: string;
  seniority: string;
  summary: string;
  bullets: TailoredBullet[];
  anti_hallucination_note: string;
  tailored_resume: TailoredResumeData;
  raw_markdown: string;
  grounding_verified: boolean;
  content_preservation_verified: boolean;
  preservation_audit?: ContentPreservationAudit;
  preservation_warnings?: string[];
  skill_gaps: string[];
  unsupported_claims_flagged: string[];
}

export interface DownloadTailoredDocumentRequest {
  resume_id: number;
  format: 'pdf' | 'docx';
  tailored_resume: TailoredResumeData;
}

export interface CoverLetterRequest {
  resume_id: number;
  job_title: string;
  company_name: string;
  job_description: string;
  tone?: 'professional' | 'persuasive' | 'conversational';
}

export interface CoverLetterResponse {
  resume_id: number;
  job_title: string;
  company_name: string;
  tone: string;
  candidate_name?: string;
  recipient?: string;
  opening_paragraph?: string;
  evidence_paragraph?: string;
  contribution_paragraph?: string;
  closing_paragraph?: string;
  sign_off?: string;
  cover_letter: string;
  key_qualifications_addressed: string[];
  verified_skills_referenced?: string[];
  unsupported_skills_avoided?: string[];
  word_count?: number;
}
