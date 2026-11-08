const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem('ats_access_token');
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('ats_access_token', token);
    } else {
      localStorage.removeItem('ats_access_token');
    }
  } catch (err) {
    console.error('Failed to update auth token in storage');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData and Content-Type is not set, default to JSON
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  let responseData: any = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let message = 'An unexpected error occurred';

    if (responseData) {
      if (typeof responseData === 'object' && responseData.detail) {
        if (typeof responseData.detail === 'string') {
          message = responseData.detail;
        } else if (Array.isArray(responseData.detail)) {
          // Pydantic 422 validation errors
          message = responseData.detail.map((err: any) => `${err.loc?.slice(-1)[0] || 'field'}: ${err.msg}`).join(', ');
        }
      } else if (typeof responseData === 'object' && responseData.message) {
        message = responseData.message;
      } else if (typeof responseData === 'string' && responseData.trim()) {
        message = responseData;
      }
    }

    if (!responseData || !message) {
      if (response.status === 401) message = 'Session expired or unauthenticated. Please log in.';
      else if (response.status === 403) message = 'You do not have permission to access this resource.';
      else if (response.status === 404) message = 'The requested resource was not found.';
      else if (response.status === 413) message = 'File is too large. Maximum size is 5 MB.';
      else if (response.status >= 500) message = 'Server error. Please verify backend service status.';
    }

    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    });
  },

  async downloadBlob(endpoint: string, body?: any): Promise<{ blob: Blob; filename: string }> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = new Headers();
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errText = 'Failed to download document';
      try {
        const j = await response.json();
        errText = j.detail || j.message || errText;
      } catch {
        // fallback
      }
      throw new ApiError(errText, response.status);
    }

    const disposition = response.headers.get('content-disposition') || '';
    let filename = 'tailored_resume.pdf';
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }

    const blob = await response.blob();
    return { blob, filename };
  },
};

