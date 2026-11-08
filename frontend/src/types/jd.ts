export interface JobDescriptionCreate {
  title: string;
  description: string;
}

export interface JobDescriptionResponse {
  id: number;
  title: string;
  description: string;
}
