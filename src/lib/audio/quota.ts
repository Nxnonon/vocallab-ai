/**
 * Daily Export Quota Tracking (2 Full Exports / Day for Free Users)
 */

export const DAILY_FREE_QUOTA = 2;
export const QUOTA_STORAGE_KEY = "vocallab_daily_export_quota";

export interface QuotaState {
  date: string;
  count: number;
}

export interface QuotaStatus {
  count: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  isPro: boolean;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

export function getDailyExportQuota(isPro: boolean = false): QuotaStatus {
  if (isPro) {
    return {
      count: 0,
      limit: Infinity,
      remaining: Infinity,
      isExceeded: false,
      isPro: true,
    };
  }

  const storage = getStorage();
  if (!storage) {
    return {
      count: 0,
      limit: DAILY_FREE_QUOTA,
      remaining: DAILY_FREE_QUOTA,
      isExceeded: false,
      isPro: false,
    };
  }

  const today = getTodayDateString();

  try {
    const raw = storage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const data: QuotaState = JSON.parse(raw);
      if (data && data.date === today && typeof data.count === "number") {
        const count = Math.max(0, data.count);
        const remaining = Math.max(0, DAILY_FREE_QUOTA - count);
        return {
          count,
          limit: DAILY_FREE_QUOTA,
          remaining,
          isExceeded: count >= DAILY_FREE_QUOTA,
          isPro: false,
        };
      }
    }
  } catch {}

  // New day or first time: initialize quota
  const initialData: QuotaState = { date: today, count: 0 };
  try {
    storage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(initialData));
  } catch {}

  return {
    count: 0,
    limit: DAILY_FREE_QUOTA,
    remaining: DAILY_FREE_QUOTA,
    isExceeded: false,
    isPro: false,
  };
}

export function incrementDailyExportQuota(isPro: boolean = false): QuotaStatus {
  if (isPro) {
    return {
      count: 0,
      limit: Infinity,
      remaining: Infinity,
      isExceeded: false,
      isPro: true,
    };
  }

  const storage = getStorage();
  if (!storage) {
    return {
      count: 0,
      limit: DAILY_FREE_QUOTA,
      remaining: DAILY_FREE_QUOTA,
      isExceeded: false,
      isPro: false,
    };
  }

  const today = getTodayDateString();
  let currentCount = 0;

  try {
    const raw = storage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const data: QuotaState = JSON.parse(raw);
      if (data && data.date === today && typeof data.count === "number") {
        currentCount = data.count;
      }
    }

    const nextCount = currentCount + 1;
    const nextData: QuotaState = { date: today, count: nextCount };
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(nextData));

    const remaining = Math.max(0, DAILY_FREE_QUOTA - nextCount);
    return {
      count: nextCount,
      limit: DAILY_FREE_QUOTA,
      remaining,
      isExceeded: nextCount >= DAILY_FREE_QUOTA,
      isPro: false,
    };
  } catch {
    return getDailyExportQuota(false);
  }
}
