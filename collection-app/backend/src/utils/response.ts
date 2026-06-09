import type { ApiResponse, FieldErrors } from "@/types/response.js";

export const buildResponse = <T>(
  status: number,
  message: string,
  data: T | null = null,
  error: string | null = null,
  fieldErrors: Record<string, string[]> | null = null,
): ApiResponse<T> => ({
  success: status >= 200 && status < 300,
  status,
  message,
  data,
  error,
  fieldErrors,
});
