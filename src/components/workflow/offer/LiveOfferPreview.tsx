import React from "react";
import { 
  Package, 
  Gift, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Star, 
  Flame, 
  ShoppingBag,
  Zap,
  CheckCircle2,
  Lock
} from "lucide-react";
import { 
  OfferStructureType, 
  MainOfferItem, 
  BonusItem, 
  GuaranteeItem, 
  PricingStructure, 
  TierPackage, 
  OrderBumpItem, 
  UpsellItem, 
  formatRp 
} from "@/types/offer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveOfferPreviewProps {
  structureType: OfferStructureType;
  // Single offer data
  mainOffers: MainOfferItem[];
  bonuses: BonusItem[];
  guarantees: GuaranteeItem[];
  pricing: PricingStructure;
  // Tiered packages data
  tierPackages: TierPackage[];
  // Funnel data
  orderBump: OrderBumpItem;
  upsells: UpsellItem[];
}

export default function LiveOfferPreview({
  structureType,
  mainOffers,
  bonuses,
  guarantees,
  pricing,
  tierPackages,
  orderBump,
  upsells
}: LiveOfferPreviewProps) {

  // Single Offer calculations
  const singleTotalMain = React.useMemo(() => {
    return mainOffers.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [mainOffers]);

  const singleTotalBonus = React.useMemo(() => {
    return bonuses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }, [bonuses]);

  const singleTotalValue = React.useMemo(() => {
    return singleTotalMain + singleTotalBonus;
  }, [singleTotalMain, singleTotalBonus]);

  const singleSavings = React.useMemo(() => {
    const baseline = singleTotalValue > 0 ? singleTotalValue : pricing.normalPrice;
    return Math.max(0, baseline - pricing.finalPrice);
  }, [singleTotalValue, pricing.normalPrice, pricing.finalPrice]);

  const singleSavingsPercent = React.useMemo(() => {
    const baseline = singleTotalValue > 0 ? singleTotalValue : pricing.normalPrice;
    if (baseline <= 0) return 0;
    return Math.min(100, Math.round((singleSavings / baseline) * 100));
  }, [singleSavings, singleTotalValue, pricing.normalPrice]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight">
            Live Offer Preview (Tampilan Sales Page)
          </h3>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
          {structureType === "single" && "Single Offer Stack"}
          {structureType === "tiered" && "Multi-Tier Pricing Table"}
          {structureType === "upsell" && "Funnel (Main + Bump + Upsell)"}
        </span>
      </div>

      {/* 1. SINGLE OFFER PREVIEW */}
      {structureType === "single" && (
        <div className="max-w-2xl mx-auto bg-gradient-to-b from-card to-secondary/10 rounded-3xl border-2 border-primary/20 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-primary text-primary-foreground p-5 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary-foreground/20 text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-current" />
              Paket Penawaran Spesial Terbatas
            </div>
            <h4 className="text-lg md:text-xl font-heading font-black">
              {mainOffers[0]?.name || "Penawaran Spesial Hari Ini"}
            </h4>
            {pricing.urgencyNote && (
              <p className="text-xs text-primary-foreground/90 font-medium pt-0.5">
                ⚡ {pricing.urgencyNote}
              </p>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Main items */}
            <div className="space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Semua yang Anda Dapatkan dalam Paket Ini:
              </h5>
              <div className="space-y-2.5">
                {mainOffers.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    className="flex items-start justify-between gap-3 p-3 bg-secondary/30 rounded-xl border border-border/80"
                  >
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {item.name || `Item Penawaran #${idx + 1}`}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.price > 0 && (
                      <span className="text-xs font-bold text-muted-foreground shrink-0 line-through">
                        Rp {formatRp(item.price)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bonuses */}
            {bonuses.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  Bonus Eksklusif Akselerasi (Gratis):
                </h5>
                <div className="space-y-2.5">
                  {bonuses.map((bonus, idx) => (
                    <div 
                      key={bonus.id || idx}
                      className="flex items-start justify-between gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20"
                    >
                      <div className="flex items-start gap-2.5">
                        <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-foreground">
                              {bonus.name || `Bonus #${idx + 1}`}
                            </p>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black uppercase">
                              GRATIS
                            </span>
                          </div>
                          {bonus.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                              {bonus.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {bonus.value > 0 && (
                        <span className="text-xs font-bold text-emerald-700 shrink-0 line-through">
                          Rp {formatRp(bonus.value)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Box */}
            <div className="p-6 bg-gradient-to-br from-secondary/50 via-background to-secondary/30 rounded-2xl border-2 border-border space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground">
                  Total Nilai Riil Keseluruhan:
                </p>
                <p className="text-lg font-heading font-bold text-muted-foreground line-through">
                  Rp {formatRp(singleTotalValue)}
                </p>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Investasi Promo Final Hari Ini:
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-xs text-muted-foreground line-through font-bold">
                    Rp {formatRp(pricing.normalPrice)}
                  </span>
                  <span className="text-3xl md:text-4xl font-heading font-black text-emerald-600">
                    Rp {formatRp(pricing.finalPrice)}
                  </span>
                </div>
                {singleSavings > 0 && (
                  <p className="text-[11px] font-bold text-emerald-700">
                    🎉 Anda Berhemat Rp {formatRp(singleSavings)} ({singleSavingsPercent}%)!
                  </p>
                )}
              </div>

              {/* Guarantee badge */}
              {guarantees.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-foreground pt-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{guarantees[0].title} ({guarantees[0].duration})</span>
                </div>
              )}

              {/* CTA Button */}
              <Button
                type="button"
                className="w-full h-13 text-sm md:text-base font-heading font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer gap-2"
              >
                <span>{pricing.ctaText || "Ambil Paket Penawaran Spesial Sekarang 👉"}</span>
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-medium pt-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Checkout Aman 256-bit
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Akses Instan Langsung Aktif
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TIERED PACKAGES PREVIEW */}
      {structureType === "tiered" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {tierPackages.map((pkg) => {
            return (
              <div
                key={pkg.id}
                className={cn(
                  "rounded-3xl border transition-all flex flex-col justify-between overflow-hidden",
                  pkg.isRecommended
                    ? "bg-card border-indigo-500 shadow-xl ring-2 ring-indigo-500/30 md:-translate-y-2"
                    : "bg-card border-border shadow-sm"
                )}
              >
                {pkg.isRecommended && (
                  <div className="bg-indigo-600 text-white text-center py-1.5 px-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    PILIHAN TERBAIK (RECOMMENDED)
                  </div>
                )}

                <div className="p-6 space-y-6 flex-1">
                  <div className="space-y-1">
                    <h4 className="text-lg font-heading font-black text-foreground">
                      {pkg.name}
                    </h4>
                    <p className="text-xs text-muted-foreground min-h-[32px]">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Harga Normal:</span>
                      <span className="line-through font-bold">Rp {formatRp(pkg.normalPrice)}</span>
                    </div>
                    <div className="pt-1">
                      <p className="text-2xl font-heading font-black text-foreground">
                        Rp {formatRp(pkg.finalPrice)}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">
                        Hemat {pkg.discountType === "percentage" ? `${pkg.discountValue}%` : `Rp ${formatRp(pkg.discountValue)}`}
                      </p>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      Fitur & Keuntungan:
                    </p>
                    <ul className="space-y-2">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground font-medium">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bonus List */}
                  {pkg.bonuses.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" /> Bonus:
                      </p>
                      <div className="space-y-1">
                        {pkg.bonuses.map((b, bi) => (
                          <p key={bi} className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                            🎁 {b.name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guarantee */}
                  {pkg.guarantee?.title && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{pkg.guarantee.title}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0">
                  <Button
                    type="button"
                    className={cn(
                      "w-full h-11 font-bold text-xs rounded-xl cursor-pointer",
                      pkg.isRecommended
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    )}
                  >
                    {pkg.ctaText || "Pilih Paket Ini 👉"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. UPSELL FUNNEL PREVIEW */}
      {structureType === "upsell" && (
        <div className="space-y-6">
          {/* Funnel Flow Diagram */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-secondary/30 rounded-2xl border border-border text-xs font-bold text-muted-foreground">
            <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground">
              1. Front-End Offer (Rp {formatRp(pricing.finalPrice)})
            </span>
            <span>➔</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white">
              2. Order Bump (+Rp {formatRp(orderBump.price)})
            </span>
            <span>➔</span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white">
              3. Upsell / OTO ({upsells.length} Penawaran)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front-End & Order Bump Mockup */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-5 shadow-sm">
              <h4 className="text-sm font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Halaman Checkout & Order Bump
              </h4>

              {/* Main item line */}
              <div className="p-4 bg-secondary/30 rounded-2xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {mainOffers[0]?.name || "Produk Utama"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Penawaran Paket Pilihan</p>
                </div>
                <span className="text-sm font-black text-foreground">
                  Rp {formatRp(pricing.finalPrice)}
                </span>
              </div>

              {/* Order Bump Box with dashed border */}
              <div className="p-4 bg-amber-500/5 rounded-2xl border-2 border-dashed border-amber-500/50 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-700">
                      YA! Tambahkan {orderBump.name || "Order Bump Tambahan"} Hanya Rp {formatRp(orderBump.price)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {orderBump.description || "Dapatkan keuntungan ekstra dengan penawaran 1x centang ini."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total simulation */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Estimasi Total Checkout:</span>
                <span className="text-base font-black text-emerald-600">
                  Rp {formatRp(pricing.finalPrice + (orderBump.price || 0))}
                </span>
              </div>
            </div>

            {/* Upsell / OTO Mockup */}
            <div className="bg-card rounded-3xl border border-purple-500/30 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-heading font-black text-purple-700 uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Halaman One-Time Offer (OTO)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 text-[10px] font-black">
                  Pasca Checkout
                </span>
              </div>

              {upsells.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Belum ada Upsell ditambahkan.
                </p>
              ) : (
                <div className="space-y-4">
                  {upsells.map((up, idx) => (
                    <div 
                      key={up.id || idx}
                      className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                          Tawaran Khusus #{idx + 1}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs line-through text-muted-foreground">
                            Rp {formatRp(up.normalPrice)}
                          </span>
                          <span className="text-sm font-black text-purple-700">
                            Rp {formatRp(up.upsellPrice)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-foreground">{up.name}</p>
                      <p className="text-[11px] text-muted-foreground">{up.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
