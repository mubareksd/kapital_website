import { accessToken, isSubscriptionStub, refreshToken, userId } from "./payload";

type Session = {
  accessToken: string;
  refreshToken: string | null;
  brokerUserId: string | null;
  expiresAt: number;
};

let session: Session | null = null;
let loginPromise: Promise<Session> | null = null;

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function proxyUrl(): string {
  const url = env("MARLIN_PROXY_URL", "http://196.189.51.9:3000");
  return url.replace(/\/+$/, "");
}

function timeoutMs(): number {
  const raw = Number(env("MARLIN_TIMEOUT_MS", "12000"));
  return Number.isFinite(raw) && raw > 0 ? raw : 12000;
}

function userAgent(): string {
  return env(
    "MARLIN_USER_AGENT",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );
}

async function relay(
  method: string,
  path: string,
  options: { body?: unknown; token?: string | null } = {},
): Promise<{ status: number; body: unknown }> {
  const secret = env("MARLIN_PROXY_SECRET");
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "User-Agent": userAgent(),
  };
  if (secret) {
    headers["X-Proxy-Secret"] = secret;
  }

  const payload: Record<string, unknown> = {
    method: method.toUpperCase(),
    path: path.replace(/^\/+/, ""),
    headers: options.token
      ? { Authorization: `Bearer ${options.token}` }
      : {},
  };
  if (options.body !== undefined) {
    payload.body = options.body;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await fetch(`${proxyUrl()}/relay`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function credentials(): { username: string; password: string } {
  const username = env("MARLIN_USERNAME");
  const password = env("MARLIN_PASSWORD");
  if (!username || !password) {
    throw new Error(
      "MARLIN_USERNAME and MARLIN_PASSWORD must be set in the server environment.",
    );
  }
  return { username, password };
}

async function login(): Promise<Session> {
  const { username, password } = credentials();
  const { status, body } = await relay("POST", "/marlin-authentication/login-new", {
    body: {
      email: username,
      password,
      userName: username,
      username,
    },
  });

  if (status < 200 || status >= 300 || !body || typeof body !== "object") {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Marlin login failed (HTTP ${status})`;
    throw new Error(message);
  }

  const data = body as Record<string, unknown>;
  if (isSubscriptionStub(data)) {
    throw new Error(
      "Marlin returned a subscription catalog instead of a session. Check investor credentials.",
    );
  }

  const token = accessToken(data);
  if (!token) {
    throw new Error("Marlin login did not return an access token.");
  }

  session = {
    accessToken: token,
    refreshToken: refreshToken(data),
    brokerUserId: userId(data),
    expiresAt: Date.now() + 50 * 60 * 1000,
  };
  return session;
}

async function ensureSession(): Promise<Session> {
  if (session && session.expiresAt > Date.now()) {
    return session;
  }
  if (!loginPromise) {
    loginPromise = login().finally(() => {
      loginPromise = null;
    });
  }
  return loginPromise;
}

export async function marlinGetJson(path: string): Promise<unknown> {
  let current = await ensureSession();
  let result = await relay("GET", path, { token: current.accessToken });

  if (result.status === 401 || result.status === 403) {
    session = null;
    current = await ensureSession();
    result = await relay("GET", path, { token: current.accessToken });
  }

  if (result.status < 200 || result.status >= 300) {
    const message =
      result.body && typeof result.body === "object" && "message" in result.body
        ? String((result.body as { message: unknown }).message)
        : `Broker request failed (HTTP ${result.status})`;
    throw new Error(message);
  }

  if (isSubscriptionStub(result.body)) {
    return [];
  }

  return result.body;
}

export async function marlinConnected(): Promise<boolean> {
  try {
    await ensureSession();
    const result = await relay("GET", "/lookups/current-date-time/", {
      token: session?.accessToken,
    });
    return result.status >= 200 && result.status < 300;
  } catch {
    return false;
  }
}

export function hasMarlinSession(): boolean {
  return Boolean(session && session.expiresAt > Date.now());
}

export function resetMarlinSession(): void {
  session = null;
}
