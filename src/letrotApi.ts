import fs from "node:fs/promises";

export const LETROT_API_BASE = "https://www.letrot.com/v1/api";

interface FetchJsonOptions {
  /**
   * Absolute path to a local JSON file to fall back on when the live endpoint
   * is unreachable or returns a non-2xx status. Used while Letrot ships
   * endpoints that don't exist yet — once they go live, the fetch succeeds and
   * the mock is never read.
   */
  mockPath?: string;
}

/**
 * Fetch JSON from the Letrot API, falling back to a bundled mock file when a
 * `mockPath` is provided and the live request fails. Without a `mockPath`,
 * failures throw.
 */
export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
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
