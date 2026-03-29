const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
];

const BLOCKED_HOSTNAMES = ["localhost", "[::1]"];

export function isPrivateUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return true;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return true;
  }

  const hostname = parsed.hostname;

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return true;
  }

  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return true;
  }

  return false;
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 10_000; // 10s

export async function fetchUrlContent(url: string): Promise<string> {
  if (isPrivateUrl(url)) {
    throw new Error("URL points to a private/internal address");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Memula/1.0 (content-fetcher)",
        Accept: "text/html,application/json,text/plain",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      throw new Error("Response too large (max 5MB)");
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_SIZE) {
      return text.slice(0, MAX_RESPONSE_SIZE);
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}
