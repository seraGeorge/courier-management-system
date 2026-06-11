export interface FetchApiConfig {
  baseUrl: string;
  headers?: HeadersInit;
}

export type FieldErrors = Record<string, string[]>;
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PACKAGE_NOT_FOUND = "PACKAGE_NOT_FOUND",
  CAPTCHA_FAILED = "CAPTCHA_FAILED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}
export interface ApiError {
  code: ErrorCode;
  fieldErrors?: FieldErrors;
};

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  error: ApiError | null;
};


class FetchApi {
  constructor(private config: FetchApiConfig) {}

  async request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: {
        ...this.config.headers,
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  get<T>(path: string) {
    return this.request<T>(path, {
      method: "GET",
    });
  }

  post<T, TBody>(path: string, body: TBody) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  patch<T, TBody>(path: string, body: TBody) {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, {
      method: "DELETE",
    });
  }
}

export default FetchApi;
