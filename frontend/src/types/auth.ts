export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  message?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MeResponse {
  user_id: number;
}
