// Safe wrapper around Supabase Edge Functions invocations with
// client-side caching, de-duplication, and retry/backoff to avoid rate limits.

type InvokeOptions = {
  cacheKey?: string;
  ttlMs?: number; // how long to cache successful responses (in ms)
  maxRetries?: number; // retries on 429/5xx
  retryDelayBaseMs?: number; // base delay for backoff
  headers?: Record<string, string>;
};

const memoryCache = new Map<string, { data: any; expiresAt: number }>();
const inFlight = new Map<string, Promise<any>>();

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function getNow() {
  return Date.now();
}

export async function safeInvokeFunction(
  supabaseFunctionsClient: any,
  name: string,
  body?: any,
  { cacheKey, ttlMs = 5 * 60_000, maxRetries = 2, retryDelayBaseMs = 400, headers }: InvokeOptions = {}
): Promise<any> {
  // Use cacheKey if provided; otherwise derive one from name+body
  const key = cacheKey || `${name}:${JSON.stringify(body || {})}`;

  // Check in-memory cache first
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > getNow()) {
    return cached.data;
  }

  // Check persistent cache (localStorage) to survive remounts
  try {
    const raw = localStorage.getItem(`fn-cache:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt > getNow()) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {}

  // De-duplicate concurrent calls by key
  if (inFlight.has(key)) {
    return inFlight.get(key)!;
  }

  const task = (async () => {
    let attempt = 0;
    let lastError: any = null;
    while (attempt <= maxRetries) {
      try {
        const { data, error } = await supabaseFunctionsClient.invoke(name, {
          body,
          headers,
        });
        if (error) throw error;

        // Success: cache
        const entry = { data, expiresAt: getNow() + (ttlMs || 0) };
        memoryCache.set(key, entry);
        try {
          localStorage.setItem(`fn-cache:${key}`, JSON.stringify(entry));
        } catch {}
        return data;
      } catch (e: any) {
        lastError = e;
        // Retry on 429 or 5xx
        const msg = String(e?.message || '');
        const status = (e && (e.status || e.code)) || undefined;
        const retriable = status === 429 || (status >= 500 && status <= 599) || /rate limit/i.test(msg);
        if (attempt < maxRetries && retriable) {
          const delay = retryDelayBaseMs * Math.pow(2, attempt); // backoff
          await sleep(delay);
          attempt++;
          continue;
        }
        break;
      }
    }
    throw lastError;
  })();

  inFlight.set(key, task);
  try {
    return await task;
  } finally {
    inFlight.delete(key);
  }
}

