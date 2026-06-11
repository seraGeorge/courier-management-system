export type FieldErrors = Record<string, string[]>;

export type ApiError = {
  code: string;
  fieldErrors?: FieldErrors;
};

export type ApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  error: ApiError | null;
};
