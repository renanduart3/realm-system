import { systemConfigService } from './systemConfigService';
import { appConfig } from '../config/app.config';
import { supabaseService } from './supabaseService';
import { safeInvokeFunction } from '../utils/safeInvoke';
import type { CachedPlans } from '../model/types';

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export const planCacheService = {
  async getCached(): Promise<CachedPlans | null> {
    const cfg = await systemConfigService.getConfig();
    // @ts-ignore - propriedade opcional
    return (cfg && (cfg as any).cached_plans) || null;
  },

  async saveCached(plans: CachedPlans): Promise<void> {
    await systemConfigService.saveConfig({
      // @ts-ignore - salvar propriedade extra
      cached_plans: plans,
    } as any);
  },

  isStale(plans: CachedPlans | null, ttlMs: number = DEFAULT_TTL_MS): boolean {
    if (!plans || !plans.lastUpdated) return true;
    const ts = Date.parse(plans.lastUpdated);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts > ttlMs;
  },

  async fetchRemote(): Promise<CachedPlans> {
    try {
      const data = await safeInvokeFunction(
        supabaseService.functions,
        'get-stripe-plans',
        undefined,
        { cacheKey: 'get-stripe-plans', ttlMs: 5 * 60_000, maxRetries: 2, retryDelayBaseMs: 500 }
      );
      const monthly = Array.isArray(data) ? data.find((p: any) => p.interval === 'month') : null;
      const annual = Array.isArray(data) ? data.find((p: any) => p.interval === 'year') : null;
      if (monthly || annual) {
        return {
          monthly: monthly ? { name: monthly.name || 'Premium', priceId: monthly.priceId, price: monthly.price ?? null, interval: 'month' } : null,
          annual: annual ? { name: annual.name || 'Premium', priceId: annual.priceId, price: annual.price ?? null, interval: 'year' } : null,
          lastUpdated: new Date().toISOString(),
          source: 'supabase',
        };
      }
      // fallback to appConfig below
    } catch (e) {
      // ignore, fallback
    }

    const monthlyId = (appConfig.subscription.plans.premium as any)?.price?.monthlyPriceId;
    const annualId = (appConfig.subscription.plans.premium as any)?.price?.annualPriceId;
    const monthlyPrice = (appConfig.subscription.plans.premium as any)?.price?.monthly;
    const annualPrice = (appConfig.subscription.plans.premium as any)?.price?.annual;
    return {
      monthly: monthlyId ? { name: 'Premium', priceId: monthlyId, price: monthlyPrice ?? null, interval: 'month' } : null,
      annual: annualId ? { name: 'Premium', priceId: annualId, price: annualPrice ?? null, interval: 'year' } : null,
      lastUpdated: new Date().toISOString(),
      source: 'appConfig',
    };
  },

  async ensurePlans(options?: { force?: boolean; ttlMs?: number }): Promise<CachedPlans> {
    const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
    const force = options?.force ?? false;
    const cached = await this.getCached();
    if (!force && cached && !this.isStale(cached, ttl)) {
      return cached;
    }
    const fresh = await this.fetchRemote();
    await this.saveCached(fresh);
    return fresh;
  },
};

