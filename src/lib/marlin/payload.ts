export function asList(data: unknown): unknown[] {
  if (!Array.isArray(data) && (data === null || typeof data !== "object")) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  const obj = data as Record<string, unknown>;
  for (const key of [
    "data",
    "content",
    "result",
    "items",
    "list",
    "securities",
    "records",
    "payload",
    "body",
    "rows",
  ]) {
    if (Array.isArray(obj[key]) || (obj[key] && typeof obj[key] === "object")) {
      return asList(obj[key]);
    }
  }

  return [];
}

export function isSubscriptionStub(data: unknown): boolean {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? [data]
      : [];
  if (list.length === 0) return false;

  let stubs = 0;
  let maps = 0;
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    maps += 1;
    const r = row as Record<string, unknown>;
    const hasSub =
      "subscriptionId" in r || "subscription_id" in r;
    const hasSymbol =
      "symbol" in r ||
      "symbolCode" in r ||
      "securityCode" in r ||
      "securityStatsDTO" in r ||
      "bestMarketDTO" in r ||
      "accessToken" in r ||
      "token" in r;
    if (hasSub && !hasSymbol) stubs += 1;
  }

  return maps > 0 && stubs === maps;
}

export function accessToken(data: Record<string, unknown>): string | null {
  const token = data.accessToken ?? data.token ?? data.access_token;
  return typeof token === "string" && token !== "" ? token : null;
}

export function refreshToken(data: Record<string, unknown>): string | null {
  const token = data.refreshToken ?? data.refresh_token;
  return typeof token === "string" && token !== "" ? token : null;
}

export function userId(data: Record<string, unknown>): string | null {
  for (const key of ["Id", "id", "userId", "user_id"]) {
    const value = data[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return null;
}
