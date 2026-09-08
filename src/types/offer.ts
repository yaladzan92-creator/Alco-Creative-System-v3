export type OfferStructureType = "single" | "tiered" | "upsell";

export interface MainOfferItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface BonusItem {
  id: string;
  name: string;
  description: string;
  value: number;
}

export interface GuaranteeItem {
  id: string;
  title: string;
  duration: string;
  description: string;
}

export interface PricingStructure {
  normalPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  finalPrice: number;
  urgencyNote: string;
  ctaText: string;
  totalMainOffersValue?: number;
  totalBonusesValue?: number;
  totalValueStack?: number;
}

export interface TierPackage {
  id: string;
  name: string;
  tagline: string;
  isRecommended: boolean;
  features: string[];
  bonuses: BonusItem[];
  guarantee: GuaranteeItem;
  totalValue: number;
  normalPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  finalPrice: number;
  ctaText: string;
}

export interface OrderBumpItem {
  id: string;
  name: string;
  description: string;
  price: number;
  normalPrice?: number;
}

export interface UpsellItem {
  id: string;
  name: string;
  description: string;
  normalPrice: number;
  upsellPrice: number;
}

export interface OfferDataState {
  structureType: OfferStructureType;
  // For Single Offer
  mainOffers: MainOfferItem[];
  bonuses: BonusItem[];
  guarantees: GuaranteeItem[];
  pricing: PricingStructure;
  
  // For Tiered Packages
  tierPackages: TierPackage[];
  
  // For Main Offer + Upsell / Order Bump
  funnelMainOffer: {
    mainOffers: MainOfferItem[];
    bonuses: BonusItem[];
    guarantee: GuaranteeItem;
    pricing: PricingStructure;
  };
  orderBump: OrderBumpItem;
  upsells: UpsellItem[];
}

export const formatRp = (val: number | string | undefined | null): string => {
  if (val === null || val === undefined || val === "") return "0";
  const num = typeof val === "string" ? parseInt(val.replace(/\D/g, ""), 10) || 0 : val;
  return new Intl.NumberFormat("id-ID").format(num);
};

export const parseNum = (val: string | number | undefined | null): number => {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ""), 10) || 0;
};
