export type FieldErrors = Record<string, string[]>;
export type ApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  error: string | null;
  fieldErrors: FieldErrors | null;
  data: T | null;
};
