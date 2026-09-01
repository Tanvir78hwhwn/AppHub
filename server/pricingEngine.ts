import { PricingRule, PricingSettings, PricingMode } from '../src/types';
import { db } from './db';

export interface PriceCalculationResult {
  accessType: 'FREE' | 'PAID';
  calculatedPrice: number;
  currency: string;
  appliedRuleId?: string;
  pricingExplanation: string;
}

export function calculateResourcePrice(params: {
  contentType: 'apk' | 'video' | 'course' | 'file';
  detectedPrice?: number;
  sourcePricingMode?: PricingMode;
  sourceDefaultPrice?: number;
  lessonsCount?: number;
  totalDurationMinutes?: number;
  isExplicitlyFree?: boolean;
}): PriceCalculationResult {
  const settings: PricingSettings = db.getPricingSettings();
  const rules: PricingRule[] = db.getPricingRules().filter(r => r.enabled);
  const currency = settings.currency || 'BDT';

  const {
    contentType,
    detectedPrice,
    sourcePricingMode = 'AUTOMATIC',
    sourceDefaultPrice,
    lessonsCount = 1,
    totalDurationMinutes = 0,
    isExplicitlyFree = false
  } = params;

  // 1. Explicitly Free or Source marked FREE
  if (isExplicitlyFree || sourcePricingMode === 'FREE') {
    return {
      accessType: 'FREE',
      calculatedPrice: 0,
      currency,
      pricingExplanation: 'Marked as free distribution by source policy.'
    };
  }

  // 2. Fixed Paid by Source
  if (sourcePricingMode === 'PAID' && typeof sourceDefaultPrice === 'number' && sourceDefaultPrice > 0) {
    const clamped = Math.max(settings.minPrice, Math.min(settings.maxPrice, sourceDefaultPrice));
    return {
      accessType: 'PAID',
      calculatedPrice: clamped,
      currency,
      pricingExplanation: `Fixed source default price applied (${clamped} ${currency}).`
    };
  }

  // 3. If Source provided a detected price and source pricing is allowed
  if (settings.allowSourcePrice && typeof detectedPrice === 'number' && detectedPrice > 0) {
    const clamped = Math.max(settings.minPrice, Math.min(settings.maxPrice, detectedPrice));
    return {
      accessType: 'PAID',
      calculatedPrice: clamped,
      currency,
      pricingExplanation: `Imported original source pricing of ${detectedPrice} ${currency} clamped within platform range.`
    };
  }

  // 4. Match against Custom Tiered Rules
  const typeRules = rules.filter(r => r.contentType === contentType);
  for (const rule of typeRules) {
    // Check lessons count rule
    if (typeof rule.minLessons === 'number' || typeof rule.maxLessons === 'number') {
      const min = rule.minLessons ?? 0;
      const max = rule.maxLessons ?? Infinity;
      if (lessonsCount >= min && lessonsCount <= max) {
        const clamped = Math.max(settings.minPrice, Math.min(settings.maxPrice, rule.price));
        return {
          accessType: clamped === 0 ? 'FREE' : 'PAID',
          calculatedPrice: clamped,
          currency,
          appliedRuleId: rule.id,
          pricingExplanation: `Matched tiered rule for ${lessonsCount} lessons (${clamped} ${currency}).`
        };
      }
    }

    // Check duration rule
    if (typeof rule.minDurationMinutes === 'number' || typeof rule.maxDurationMinutes === 'number') {
      const min = rule.minDurationMinutes ?? 0;
      const max = rule.maxDurationMinutes ?? Infinity;
      if (totalDurationMinutes >= min && totalDurationMinutes <= max) {
        const clamped = Math.max(settings.minPrice, Math.min(settings.maxPrice, rule.price));
        return {
          accessType: clamped === 0 ? 'FREE' : 'PAID',
          calculatedPrice: clamped,
          currency,
          appliedRuleId: rule.id,
          pricingExplanation: `Matched duration rule for ${totalDurationMinutes} mins (${clamped} ${currency}).`
        };
      }
    }

    // Generic match rule for this content type
    if (rule.minLessons === undefined && rule.maxLessons === undefined && rule.minDurationMinutes === undefined && rule.maxDurationMinutes === undefined) {
      const clamped = Math.max(settings.minPrice, Math.min(settings.maxPrice, rule.price));
      return {
        accessType: clamped === 0 ? 'FREE' : 'PAID',
        calculatedPrice: clamped,
        currency,
        appliedRuleId: rule.id,
        pricingExplanation: `Matched standard rule for ${contentType} (${clamped} ${currency}).`
      };
    }
  }

  // 5. Fallback to platform default prices
  let defaultPrice = settings.defaultApkPrice;
  if (contentType === 'video') defaultPrice = settings.defaultVideoPrice;
  if (contentType === 'course') defaultPrice = settings.defaultCoursePrice;

  const clamped = Math.max(settings.minPrice, Math.min(settings.maxPrice, defaultPrice));
  return {
    accessType: clamped === 0 ? 'FREE' : 'PAID',
    calculatedPrice: clamped,
    currency,
    pricingExplanation: `Standard platform default applied for ${contentType} (${clamped} ${currency}).`
  };
}
