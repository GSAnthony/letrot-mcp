import fs from "node:fs/promises";

export const LETROT_API_BASE = "https://rec2.letrot.com/v1/api";

/**
 * Default request headers. Some Letrot endpoints (e.g. cross-performance) reject
 * requests that don't look like a browser session (HTTP 403 to bare clients),
 * so we send a browser User-Agent / Referer / Origin by default.
 */
const DEFAULT_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://rec2.letrot.com/",
  Origin: "https://rec2.letrot.com",
};

/**
 * Build the HTTP Basic Auth header for the (secured) rec2 host from the
 * `LETROT_BASIC_AUTH_USER` / `LETROT_BASIC_AUTH_PASSWORD` environment variables.
 * Throws a clear error when either is missing so a misconfiguration is never
 * silently masked by a mock fallback.
 */
function basicAuthHeader(): Record<string, string> {
  const user = process.env.LETROT_BASIC_AUTH_USER;
  const pass = process.env.LETROT_BASIC_AUTH_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Missing Letrot Basic Auth credentials: set LETROT_BASIC_AUTH_USER and LETROT_BASIC_AUTH_PASSWORD",
    );
  }
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

interface FetchJsonOptions {
  /**
   * Absolute path to a local JSON file to fall back on when the live endpoint
   * is unreachable or returns a non-2xx status. Used while Letrot ships
   * endpoints that don't exist yet — once they go live, the fetch succeeds and
   * the mock is never read.
   */
  mockPath?: string;
  /** Extra request headers merged on top of the browser-like defaults. */
  headers?: Record<string, string>;
}

/**
 * Fetch JSON from the Letrot API, falling back to a bundled mock file when a
 * `mockPath` is provided and the live request fails. Without a `mockPath`,
 * failures throw.
 */
export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  // Resolved eagerly so a missing-credentials error always surfaces instead of
  // being swallowed into the mock fallback below.
  const authHeader = basicAuthHeader();
  try {
    const response = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...authHeader, ...(options.headers ?? {}) },
    });
    if (response.ok) {
      return await response.json();
    }
    if (!options.mockPath) {
      throw new Error(`Letrot API returned ${response.status} ${response.statusText} for ${url}`);
    }
  } catch (error) {
    if (!options.mockPath) throw error;
  }

  const text = await fs.readFile(options.mockPath, "utf-8");
  return JSON.parse(text);
}
