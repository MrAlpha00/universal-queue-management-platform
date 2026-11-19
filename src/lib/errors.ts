export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INVALID_QR"
  | "EXPIRED_QR"
  | "WRONG_ORGANIZATION"
  | "ALREADY_CHECKED_IN"
  | "SLOT_UNAVAILABLE"
  | "CONFIGURATION"
  | "INTERNAL";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INVALID_QR: 400,
  EXPIRED_QR: 410,
  WRONG_ORGANIZATION: 403,
  ALREADY_CHECKED_IN: 409,
  SLOT_UNAVAILABLE: 409,
  CONFIGURATION: 503,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export const errors = {
  unauthorized: (message = "Authentication is required") =>
    new AppError("UNAUTHORIZED", message),
  forbidden: (message = "You do not have permission to do that") =>
    new AppError("FORBIDDEN", message),
  notFound: (message = "The requested resource was not found") =>
    new AppError("NOT_FOUND", message),
  validation: (message = "Please check the information provided", details?: unknown) =>
    new AppError("VALIDATION", message, details),
  conflict: (message = "This action conflicts with the current state") =>
    new AppError("CONFLICT", message),
  slotUnavailable: (message = "That time slot is no longer available") =>
    new AppError("SLOT_UNAVAILABLE", message),
  invalidQr: (message = "This QR code is not valid") =>
    new AppError("INVALID_QR", message),
  expiredQr: (message = "This token is no longer valid for check-in") =>
    new AppError("EXPIRED_QR", message),
  wrongOrganization: (message = "This token does not belong to this organization") =>
    new AppError("WRONG_ORGANIZATION", message),
  alreadyCheckedIn: (message = "This token has already been checked in") =>
    new AppError("ALREADY_CHECKED_IN", message),
  configuration: (message = "A required service is not configured") =>
    new AppError("CONFIGURATION", message),
  rateLimited: (message = "Too many attempts. Please try again shortly") =>
    new AppError("RATE_LIMITED", message),
};

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  console.error("[TokenFlow] Unexpected error", error);
  return new AppError("INTERNAL", "Something went wrong. Please try again.");
}
