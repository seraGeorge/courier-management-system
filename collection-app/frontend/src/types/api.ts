export interface FieldErrors {
  [key: string]: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  error: string | null;
  fieldErrors: FieldErrors | null;
  data: T | null;
};
