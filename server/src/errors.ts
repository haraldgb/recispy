export type ErrorCode =
  | 'invalid_input'
  | 'unauthenticated'
  | 'not_allowlisted'
  | 'not_found'
  | 'fetch_failed'
  | 'extraction_invalid'
  | 'internal';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(code: ErrorCode, message: string) {
  return { error: { code, message } };
}
