export interface Resume {
  id: number;
  title: string;
  user_id?: number;
  created_at?: string;
}

export interface ResumeDetail extends Resume {
  content: string;
}

export interface ResumeUploadResponse {
  message: string;
  resume_id: number;
  filename: string;
}

export interface ResumeDeleteResponse {
  message: string;
}
