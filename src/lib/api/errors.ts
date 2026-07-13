// Normalizes backend/network failures into friendly, actionable, i18n-able messages.
// UI never shows raw backend text — it shows these, positioned + colored by severity.
export interface ApiError {
  status: number;
  message: string;
  traceId?: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiFetchError extends Error {
  readonly status: number;
  readonly traceId?: string;
  readonly fieldErrors?: Record<string, string[]>;
  constructor(readonly apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiFetchError';
    this.status = apiError.status;
    this.traceId = apiError.traceId;
    this.fieldErrors = apiError.fieldErrors;
  }
}

function readString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

// Status → friendly copy. i18n keys are layered on when the ErrorState/Toast components are built.
export function friendlyMessage(status: number, body: unknown): string {
  const backend = readString(body, 'error');
  switch (status) {
    case 400:
      return backend ?? 'Some details are invalid. Please check and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have access to this.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return backend ?? 'That action conflicts with the current state.';
    case 422:
      return backend ?? 'Please fix the highlighted fields.';
    case 429:
      return 'Too many requests — please wait a moment and try again.';
    default:
      if (status >= 500) return 'Something went wrong on our end. Please retry.';
      return backend ?? 'Something went wrong. Please try again.';
  }
}

export async function normalizeError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON response — keep body null
  }
  return {
    status: res.status,
    message: friendlyMessage(res.status, body),
    traceId: res.headers.get('x-request-id') ?? undefined,
  };
}
