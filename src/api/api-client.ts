const DEFAULT_API_URL =
  "https://barberia-cale.onrender.com/api";

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  DEFAULT_API_URL
).replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 15_000;

export type ApiErrorCode =
  | "ABORTED"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "INVALID_RESPONSE"
  | "NETWORK"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVER"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: ApiErrorCode;
  readonly details: unknown;

  constructor({
    message,
    status = null,
    code = "UNKNOWN",
    details,
  }: {
    message: string;
    status?: number | null;
    code?: ApiErrorCode;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type UnauthorizedHandler = (
  rejectedToken: string
) => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
const unauthorizedTokensPending = new Set<string>();

export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null
) {
  unauthorizedHandler = handler;
}

function notifyUnauthorized(rejectedToken: string) {
  if (
    !unauthorizedHandler ||
    unauthorizedTokensPending.has(rejectedToken)
  ) {
    return;
  }

  unauthorizedTokensPending.add(rejectedToken);

  Promise.resolve(unauthorizedHandler(rejectedToken))
    .catch(() => {
      // El request original ya comunica el error al usuario.
    })
    .finally(() => {
      unauthorizedTokensPending.delete(rejectedToken);
    });
}

function statusCodeToErrorCode(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER";
  return "UNKNOWN";
}

function fallbackMessageForStatus(status: number) {
  if (status === 400 || status === 422) {
    return "Revisa la información ingresada e inténtalo de nuevo.";
  }

  if (status === 401) {
    return "Tu sesión expiró. Inicia sesión nuevamente.";
  }

  if (status === 403) {
    return "No tienes permiso para realizar esta acción.";
  }

  if (status === 404) {
    return "No encontramos la información solicitada.";
  }

  if (status === 409) {
    return "La información cambió mientras realizabas la acción. Actualiza e inténtalo nuevamente.";
  }

  if (status === 429) {
    return "Hay demasiadas solicitudes en este momento. Espera un poco e inténtalo nuevamente.";
  }

  if (status >= 500) {
    return "El servidor no está disponible en este momento. Inténtalo nuevamente en unos segundos.";
  }

  return "No pudimos completar la solicitud.";
}

function readApiMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return null;
}

async function parseResponse(response: Response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  json?: unknown;
  timeoutMs?: number;
  notifyOnUnauthorized?: boolean;
};

export async function apiRequest<T>(
  path: string,
  {
    token,
    json,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    notifyOnUnauthorized = true,
    headers: providedHeaders,
    signal: providedSignal,
    ...requestOptions
  }: ApiRequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  let didTimeout = false;

  const abortFromCaller = () => controller.abort();

  if (providedSignal?.aborted) {
    controller.abort();
  } else {
    providedSignal?.addEventListener("abort", abortFromCaller, {
      once: true,
    });
  }

  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  const headers = new Headers(providedHeaders);

  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      body: json === undefined ? undefined : JSON.stringify(json),
      headers,
      signal: controller.signal,
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401 && token && notifyOnUnauthorized) {
        notifyUnauthorized(token);
      }

      throw new ApiError({
        message:
          readApiMessage(payload) ?? fallbackMessageForStatus(response.status),
        status: response.status,
        code: statusCodeToErrorCode(response.status),
        details: payload,
      });
    }

    if (
      payload === null ||
      typeof payload === "string"
    ) {
      throw new ApiError({
        message:
          "El servidor devolvió una respuesta inesperada. Inténtalo nuevamente.",
        status: response.status,
        code: "INVALID_RESPONSE",
        details: payload,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiError({
        message: didTimeout
          ? "La solicitud tardó demasiado. Revisa tu conexión e inténtalo nuevamente."
          : "La solicitud fue cancelada.",
        code: didTimeout ? "TIMEOUT" : "ABORTED",
      });
    }

    throw new ApiError({
      message:
        "No pudimos conectarnos. Revisa tu conexión a internet e inténtalo nuevamente.",
      code: "NETWORK",
      details: error,
    });
  } finally {
    clearTimeout(timeout);
    providedSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export function createQueryString(
  values: Record<
    string,
    string | number | boolean | null | undefined
  >
) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}
