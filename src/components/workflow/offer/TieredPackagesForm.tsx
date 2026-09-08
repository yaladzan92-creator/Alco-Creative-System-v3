import React from "react";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Gift, 
  ShieldCheck, 
  Star,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TierPackage, BonusItem, GuaranteeItem, formatRp, parseNum } from "@/types/offer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TieredPackagesFormProps {
  packages: TierPackage[];
  setPackages: React.Dispatch<React.SetStateAction<TierPackage[]>>;
}

export default function TieredPackagesForm({
  packages,
  setPackages
}: TieredPackagesFormProps) {

  const addPackage = () => {
    const newTierNum = packages.length + 1;
    const newPkg: TierPackage = {
      id: `tier-${Date.now()}`,
      name: `Paket ${newTierNum === 2 ? "Pro" : newTierNum === 3 ? "Complete / VIP" : `Pilihan #${newTierNum}`}`,
      tagline: "Paket lengkap akselerasi terbaik dengan fitur maksimal.",
      isRecommended: false,
      features: [
        "Akses Seluruh Modul Core Engine",
        "Akses Update Otomatis Seumur Hidup",
        "Grup Komunitas Eksklusif & Diskusi",
        "1-on-1 Onboarding Support"
      ],
      bonuses: [
        {
          id: `b-${Date.now()}-1`,
          name: "Video Motion Template Pack",
          description: "Template siap render format Canva & Figma.",
          value: 149000
        }
      ],
      guarantee: {
        id: `g-${Date.now()}`,
        title: "Garansi 100% Kepuasan",
        duration: "30 Hari",
        description: "Pengembalian dana penuh tanpa syarat rumit jika tidak merasakan manfaatnya."
      },
      totalValue: 599000,
      normalPrice: 399000,
      discountType: "percentage",
      discountValue: 50,
      finalPrice: 199000,
      ctaText: "Pilih Paket Ini Sekarang 👉"
    };
    setPackages(prev => [...prev, newPkg]);
  };

  const removePackage = (id: string) => {
    if (packages.length <= 2) {
      toast.error("Minimal harus ada 2 opsi paket untuk struktur Tiered Packages");
      return;
    }
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const setAsRecommended = (id: string) => {
    setPackages(prev => prev.map(p => ({
      ...p,
      isRecommended: p.id === id
    })));
  };

  const updatePackageField = (id: string, field: keyof TierPackage, value: any) => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const movePackage = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === packages.length - 1)) return;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...packages];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setPackages(updated);
  };

  // Features list helpers
  const handleFeaturesChange = (id: string, text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    updatePackageField(id, "features", lines.length > 0 ? lines : [text]);
  };

  // Pricing calculations for a tier
  const handleNormalPriceChange = (id: string, normal: number) => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        const norm = Math.max(0, normal);
        let final = p.finalPrice;
        if (p.discountType === "percentage") {
          final = Math.max(0, Math.round(norm * (1 - p.discountValue / 100)));
        } else {
          final = Math.max(0, norm - p.discountValue);
        }
        return { ...p, normalPrice: norm, finalPrice: final };
      }
      return p;
    }));
  };

  const handleDiscountTypeChange = (id: string, type: "percentage" | "fixed") => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        let discVal = p.discountValue;
        let final = p.finalPrice;
        if (type === "percentage") {
          discVal = p.normalPrice > 0 
            ? Math.min(100, Math.max(0, Math.round(((p.normalPrice - p.finalPrice) / p.normalPrice) * 100))) 
            : 50;
          final = Math.max(0, Math.round(p.normalPrice * (1 - discVal / 100)));
        } else {
          discVal = Math.max(0, p.normalPrice - p.finalPrice);
          final = Math.max(0, p.normalPrice - discVal);
        }
        return { ...p, discountType: type, discountValue: discVal, finalPrice: final };
      }
      return p;
    }));
  };

  const handleDiscountValueChange = (id: string, disc: number) => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        const val = Math.max(0, disc);
        let final = p.finalPrice;
        if (p.discountType === "percentage") {
          const clamped = Math.min(100, val);
          final = Math.max(0, Math.round(p.normalPrice * (1 - clamped / 100)));
          return { ...p, discountValue: clamped, finalPrice: final };
        } else {
          final = Math.max(0, p.normalPrice - val);
          return { ...p, discountValue: val, finalPrice: final };
        }
      }
      return p;
    }));
  };

  const handleFinalPriceChange = (id: string, finalVal: number) => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        const fin = Math.max(0, finalVal);
        let disc = p.discountValue;
        if (p.discountType === "percentage") {
          disc = p.normalPrice > 0 
            ? Math.max(0, Math.min(100, Math.round(((p.normalPrice - fin) / p.normalPrice) * 100))) 
            : 0;
        } else {
          disc = Math.max(0, p.normalPrice - fin);
        }
        return { ...p, finalPrice: fin, discountValue: disc };
      }
      return p;
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 bg-card rounded-3xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
              Struktur Tiered Packages ({packages.length} Pilihan Paket)
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Sediakan beberapa tingkatan paket pada landing page. Tandai 1 paket sebagai <strong>Recommended</strong> untuk mengarahkan pembelian terbanyak.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={addPackage}
          className="h-10 px-4 rounded-xl font-bold text-xs gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4" />
          + Tambah Paket Baru
        </Button>
      </div>

      {/* Package Cards */}
      <div className="space-y-6">
        {packages.map((pkg, idx) => {
          return (
            <div
              key={pkg.id}
              className={cn(
                "p-6 md:p-8 rounded-3xl border transition-all space-y-6",
                pkg.isRecommended 
                  ? "bg-indigo-500/5 border-indigo-500 shadow-md ring-2 ring-indigo-500/20" 
                  : "bg-card border-border"
              )}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-black">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={pkg.name}
                        onChange={(e) => updatePackageField(pkg.id, "name", e.target.value)}
                        placeholder="Contoh: Paket Starter / Pro / VIP"
                        className="text-base font-heading font-black text-foreground bg-transparent border-0 px-0 h-7 focus-visible:ring-0 w-auto min-w-[200px]"
                      />
                    </div>
                    <Input
                      value={pkg.tagline}
                      onChange={(e) => updatePackageField(pkg.id, "tagline", e.target.value)}
                      placeholder="Tagline singkat paket..."
                      className="text-xs text-muted-foreground bg-transparent border-0 px-0 h-5 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAsRecommended(pkg.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer",
                      pkg.isRecommended
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Star className={cn("w-3.5 h-3.5", pkg.isRecommended && "fill-white")} />
                    {pkg.isRecommended ? "★ Paket Rekomendasi Utama" : "Set sebagai Rekomendasi"}
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => movePackage(idx, "up")}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={idx === packages.length - 1}
                    onClick={() => movePackage(idx, "down")}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {packages.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePackage(pkg.id)}
                      className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded-lg cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Hapus
                    </Button>
                  )}
                </div>
              </div>

              {/* Package Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Features & Deliverables */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Daftar Fitur / Deliverables yang Didapat (Satu baris per item)
                    </Label>
                    <Textarea
                      value={pkg.features.join("\n")}
                      onChange={(e) => handleFeaturesChange(pkg.id, e.target.value)}
                      placeholder="Modul 1: Dasar Strategi&#10;Modul 2: Eksekusi Iklan&#10;Template Desain Siap Pakai&#10;Akses Komunitas"
                      rows={5}
                      className="bg-background rounded-2xl text-xs font-medium resize-none"
                    />
                  </div>

                  {/* Bonus summary input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-600" />
                      Bonus Khusus Paket Ini
                    </Label>
                    <Input
                      value={pkg.bonuses.map(b => b.name).join(", ")}
                      onChange={(e) => {
                        const names = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                        const updatedBonuses = names.map((name, i) => ({
                          id: pkg.bonuses[i]?.id || `b-${i}`,
                          name,
                          description: "Bonus akselerasi paket.",
                          value: pkg.bonuses[i]?.value || 99000
                        }));
                        updatePackageField(pkg.id, "bonuses", updatedBonuses);
                      }}
                      placeholder="Contoh: Template Copywriting, Video Motion Pack (Pisahkan dengan koma)"
                      className="bg-background rounded-xl text-xs"
                    />
                  </div>

                  {/* Guarantee input */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Garansi Paket
                    </Label>
                    <Input
                      value={pkg.guarantee.title ? `${pkg.guarantee.title} (${pkg.guarantee.duration})` : ""}
                      onChange={(e) => {
                        updatePackageField(pkg.id, "guarantee", {
                          ...pkg.guarantee,
                          title: e.target.value || "Garansi Kepuasan",
                          duration: "30 Hari"
                        });
                      }}
                      placeholder="Contoh: Garansi 30 Hari Uang Kembali"
                      className="bg-background rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Right: Pricing Calculator for this tier */}
                <div className="p-5 bg-secondary/30 rounded-2xl border border-border space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Kalkulasi Harga {pkg.name || "Paket"}
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">
                        Total Nilai (Value Stack)
                      </Label>
                      <Input
                        type="text"
                        value={pkg.totalValue ? formatRp(pkg.totalValue) : ""}
                        onChange={(e) => updatePackageField(pkg.id, "totalValue", parseNum(e.target.value))}
                        placeholder="599.000"
                        className="bg-background rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground">
                        Harga Normal Coret
                      </Label>
                      <Input
                        type="text"
                        value={pkg.normalPrice ? formatRp(pkg.normalPrice) : ""}
                        onChange={(e) => handleNormalPriceChange(pkg.id, parseNum(e.target.value))}
                        placeholder="399.000"
                        className="bg-background rounded-xl text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Diskon & Tipe */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-muted-foreground">
                          Diskon
                        </Label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDiscountTypeChange(pkg.id, "percentage")}
                            className={cn("text-[9px] font-bold px-1 rounded cursor-pointer", pkg.discountType === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDiscountTypeChange(pkg.id, "fixed")}
                            className={cn("text-[9px] font-bold px-1 rounded cursor-pointer", pkg.discountType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                          >
                            Rp
                          </button>
                        </div>
                      </div>
                      <Input
                        type="text"
                        value={pkg.discountValue ? (pkg.discountType === "percentage" ? pkg.discountValue : formatRp(pkg.discountValue)) : ""}
                        onChange={(e) => handleDiscountValueChange(pkg.id, parseNum(e.target.value))}
                        placeholder={pkg.discountType === "percentage" ? "50" : "100.000"}
                        className="bg-background rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-black text-emerald-600">
                        Harga Final Promo
                      </Label>
                      <Input
                        type="text"
                        value={pkg.finalPrice ? formatRp(pkg.finalPrice) : ""}
                        onChange={(e) => handleFinalPriceChange(pkg.id, parseNum(e.target.value))}
                        placeholder="199.000"
                        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 rounded-xl text-sm font-black"
                      />
                    </div>
                  </div>

                  {/* CTA Text */}
                  <div className="space-y-1 pt-2 border-t border-border/60">
                    <Label className="text-[11px] font-bold text-muted-foreground">
                      Teks Tombol CTA
                    </Label>
                    <Input
                      value={pkg.ctaText}
                      onChange={(e) => updatePackageField(pkg.id, "ctaText", e.target.value)}
                      placeholder="Pilih Paket Ini Sekarang 👉"
                      className="bg-background rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
