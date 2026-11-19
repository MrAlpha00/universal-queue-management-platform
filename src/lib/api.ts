import { NextResponse } from "next/server";
import { AppError, toAppError } from "@/lib/errors";

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { code: string; message: string; details?: unknown };
    };

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResult<T>>({ ok: true, data }, { status });
}

export function apiError(error: unknown) {
  const appError: AppError = toAppError(error);
  return NextResponse.json<ApiResult<never>>(
    {
      ok: false,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details ? { details: appError.details } : {}),
      },
    },
    { status: appError.status },
  );
}

export async function withApiHandler<T>(
  handler: () => Promise<T> | T,
): Promise<NextResponse> {
  try {
    return apiSuccess(await handler());
  } catch (error) {
    return apiError(error);
  }
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
