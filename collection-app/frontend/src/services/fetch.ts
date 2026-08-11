import { getStaffAuthHeaders } from "@/utils/staffAuth";

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
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  error: ApiError | null;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class FetchApi {
  constructor(private config: FetchApiConfig) {}

  async request<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const { requiresAuth = true, ...fetchOptions } = options ?? {};
    const body =
      typeof fetchOptions.body === "string" ? fetchOptions.body : "";
    const authHeaders =
      requiresAuth === false ? {} : await getStaffAuthHeaders(body);

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...fetchOptions,
      headers: {
        ...this.config.headers,
        ...authHeaders,
        ...fetchOptions.headers,
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

  post<T, TBody>(path: string, body: TBody, options?: { requiresAuth?: boolean }) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      requiresAuth: options?.requiresAuth,
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
