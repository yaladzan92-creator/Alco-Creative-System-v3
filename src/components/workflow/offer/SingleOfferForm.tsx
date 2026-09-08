import React from "react";
import { 
  Package, 
  Gift, 
  ShieldCheck, 
  Calculator, 
  Plus, 
  Trash2, 
  Sparkles,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  MainOfferItem, 
  BonusItem, 
  GuaranteeItem, 
  PricingStructure, 
  formatRp, 
  parseNum 
} from "@/types/offer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SingleOfferFormProps {
  mainOffers: MainOfferItem[];
  setMainOffers: React.Dispatch<React.SetStateAction<MainOfferItem[]>>;
  bonuses: BonusItem[];
  setBonuses: React.Dispatch<React.SetStateAction<BonusItem[]>>;
  guarantees: GuaranteeItem[];
  setGuarantees: React.Dispatch<React.SetStateAction<GuaranteeItem[]>>;
  pricing: PricingStructure;
  setPricing: React.Dispatch<React.SetStateAction<PricingStructure>>;
}

export default function SingleOfferForm({
  mainOffers,
  setMainOffers,
  bonuses,
  setBonuses,
  guarantees,
  setGuarantees,
  pricing,
  setPricing
}: SingleOfferFormProps) {

  // Totals calculations
  const totalMainValue = React.useMemo(() => {
    return mainOffers.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [mainOffers]);

  const totalBonusValue = React.useMemo(() => {
    return bonuses.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  }, [bonuses]);

  const totalValueStack = React.useMemo(() => {
    return totalMainValue + totalBonusValue;
  }, [totalMainValue, totalBonusValue]);

  // Main Offer Handlers
  const addMainOffer = () => {
    const newItem: MainOfferItem = {
      id: `main-${Date.now()}`,
      name: "",
      description: "",
      price: 199000
    };
    setMainOffers(prev => [...prev, newItem]);
  };

  const updateMainOffer = (id: string, field: keyof MainOfferItem, value: any) => {
    setMainOffers(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeMainOffer = (id: string) => {
    if (mainOffers.length <= 1) {
      toast.error("Minimal harus ada 1 Penawaran Utama");
      return;
    }
    setMainOffers(prev => prev.filter(item => item.id !== id));
  };

  const moveMainOffer = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === mainOffers.length - 1)) return;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...mainOffers];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setMainOffers(updated);
  };

  // Bonus Handlers
  const addBonus = () => {
    const newItem: BonusItem = {
      id: `bonus-${Date.now()}`,
      name: "",
      description: "",
      value: 99000
    };
    setBonuses(prev => [...prev, newItem]);
  };

  const updateBonus = (id: string, field: keyof BonusItem, value: any) => {
    setBonuses(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeBonus = (id: string) => {
    setBonuses(prev => prev.filter(item => item.id !== id));
  };

  const moveBonus = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === bonuses.length - 1)) return;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...bonuses];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setBonuses(updated);
  };

  // Guarantee Handlers
  const addGuarantee = () => {
    const newItem: GuaranteeItem = {
      id: `guarantee-${Date.now()}`,
      title: "Garansi 100% Uang Kembali",
      duration: "30 Hari",
      description: "Jaminan tanpa risiko jika tidak mendapatkan manfaat yang dijanjikan."
    };
    setGuarantees(prev => [...prev, newItem]);
  };

  const updateGuarantee = (id: string, field: keyof GuaranteeItem, value: any) => {
    setGuarantees(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeGuarantee = (id: string) => {
    if (guarantees.length <= 1) {
      toast.error("Minimal harus ada 1 ketentuan garansi");
      return;
    }
    setGuarantees(prev => prev.filter(item => item.id !== id));
  };

  // Pricing Handlers
  const handleNormalPriceChange = (val: number) => {
    const normal = Math.max(0, val);
    let final = pricing.finalPrice;
    if (pricing.discountType === "percentage") {
      final = Math.max(0, Math.round(normal * (1 - pricing.discountValue / 100)));
    } else {
      final = Math.max(0, normal - pricing.discountValue);
    }
    setPricing(prev => ({ ...prev, normalPrice: normal, finalPrice: final }));
  };

  const handleDiscountTypeChange = (type: "percentage" | "fixed") => {
    let newDiscVal = pricing.discountValue;
    let newFinal = pricing.finalPrice;
    if (type === "percentage") {
      newDiscVal = pricing.normalPrice > 0 
        ? Math.min(100, Math.max(0, Math.round(((pricing.normalPrice - pricing.finalPrice) / pricing.normalPrice) * 100))) 
        : 50;
      newFinal = Math.max(0, Math.round(pricing.normalPrice * (1 - newDiscVal / 100)));
    } else {
      newDiscVal = Math.max(0, pricing.normalPrice - pricing.finalPrice);
      newFinal = Math.max(0, pricing.normalPrice - newDiscVal);
    }
    setPricing(prev => ({
      ...prev,
      discountType: type,
      discountValue: newDiscVal,
      finalPrice: newFinal
    }));
  };

  const handleDiscountValueChange = (val: number) => {
    const disc = Math.max(0, val);
    let final = pricing.finalPrice;
    if (pricing.discountType === "percentage") {
      const clampedDisc = Math.min(100, disc);
      final = Math.max(0, Math.round(pricing.normalPrice * (1 - clampedDisc / 100)));
      setPricing(prev => ({ ...prev, discountValue: clampedDisc, finalPrice: final }));
    } else {
      final = Math.max(0, pricing.normalPrice - disc);
      setPricing(prev => ({ ...prev, discountValue: disc, finalPrice: final }));
    }
  };

  const handleFinalPriceChange = (val: number) => {
    const final = Math.max(0, val);
    let disc = pricing.discountValue;
    if (pricing.discountType === "percentage") {
      disc = pricing.normalPrice > 0 
        ? Math.max(0, Math.min(100, Math.round(((pricing.normalPrice - final) / pricing.normalPrice) * 100))) 
        : 0;
    } else {
      disc = Math.max(0, pricing.normalPrice - final);
    }
    setPricing(prev => ({ ...prev, finalPrice: final, discountValue: disc }));
  };

  return (
    <div className="space-y-8">
      {/* 1. PENAWARAN UTAMA */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                  1. Penawaran Utama
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                  {mainOffers.length} Item
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Produk, kurikulum, atau layanan inti yang didapatkan pembeli.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            Subtotal: <strong className="text-foreground">Rp {formatRp(totalMainValue)}</strong>
          </div>
        </div>

        <div className="space-y-4">
          {mainOffers.map((item, index) => (
            <div 
              key={item.id}
              className="p-5 bg-secondary/20 rounded-2xl border border-border/80 space-y-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Penawaran #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveMainOffer(index, "up")}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === mainOffers.length - 1}
                    onClick={() => moveMainOffer(index, "down")}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {mainOffers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMainOffer(item.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded-lg cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Hapus
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Nama Produk / Layanan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateMainOffer(item.id, "name", e.target.value)}
                    placeholder="Contoh: ALCO Creative System — Core Engine"
                    className="bg-background rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Nilai / Harga Normal (Rp)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="text"
                      value={item.price ? formatRp(item.price) : ""}
                      onChange={(e) => updateMainOffer(item.id, "price", parseNum(e.target.value))}
                      placeholder="299.000"
                      className="bg-background pl-10 rounded-xl text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-foreground">
                  Deskripsi Singkat / Isi Modul
                </Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateMainOffer(item.id, "description", e.target.value)}
                  placeholder="Jelaskan apa saja isi penawaran ini dan deliverable yang diterima..."
                  rows={2}
                  className="bg-background rounded-xl text-xs resize-none"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addMainOffer}
          className="w-full h-11 border-dashed border-primary/40 text-primary hover:bg-primary/5 rounded-2xl font-bold text-xs gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Item Penawaran Utama
        </Button>
      </div>

      {/* 2. BONUS */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                  2. Bonus Akselerasi
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                  {bonuses.length} Bonus
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Bonus pelengkap untuk memperbesar persepsi value dan mempercepat konversi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            Total Bonus: <strong className="text-emerald-600">Rp {formatRp(totalBonusValue)}</strong>
          </div>
        </div>

        <div className="space-y-4">
          {bonuses.map((item, index) => (
            <div 
              key={item.id}
              className="p-5 bg-secondary/20 rounded-2xl border border-border/80 space-y-4 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-black">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Bonus #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveBonus(index, "up")}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === bonuses.length - 1}
                    onClick={() => moveBonus(index, "down")}
                    className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBonus(item.id)}
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded-lg cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Nama Bonus
                  </Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateBonus(item.id, "name", e.target.value)}
                    placeholder="Contoh: Master Copywriting Prompt Library"
                    className="bg-background rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Nilai Bonus (Rp)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="text"
                      value={item.value ? formatRp(item.value) : ""}
                      onChange={(e) => updateBonus(item.id, "value", parseNum(e.target.value))}
                      placeholder="149.000"
                      className="bg-background pl-10 rounded-xl text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-foreground">
                  Deskripsi Bonus
                </Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateBonus(item.id, "description", e.target.value)}
                  placeholder="Jelaskan manfaat bonus ini untuk mempercepat hasil..."
                  rows={2}
                  className="bg-background rounded-xl text-xs resize-none"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addBonus}
          className="w-full h-11 border-dashed border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/5 rounded-2xl font-bold text-xs gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Bonus
        </Button>
      </div>

      {/* 3. GARANSI */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                  3. Garansi & Pembalik Risiko
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black">
                  {guarantees.length} Garansi
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Jaminan keamanan yang menghapus keraguan calon pembeli.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {guarantees.map((item, index) => (
            <div 
              key={item.id}
              className="p-5 bg-secondary/20 rounded-2xl border border-border/80 space-y-4 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-black">
                    #{index + 1}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Garansi #{index + 1}
                  </span>
                </div>

                {guarantees.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGuarantee(item.id)}
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Nama / Judul Garansi
                  </Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateGuarantee(item.id, "title", e.target.value)}
                    placeholder="Contoh: Garansi 100% Uang Kembali Tanpa Ribet"
                    className="bg-background rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Durasi Garansi
                  </Label>
                  <Input
                    value={item.duration}
                    onChange={(e) => updateGuarantee(item.id, "duration", e.target.value)}
                    placeholder="Contoh: 30 Hari"
                    className="bg-background rounded-xl text-sm font-bold"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["7 Hari", "14 Hari", "30 Hari", "Seumur Hidup"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateGuarantee(item.id, "duration", d)}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer",
                          item.duration === d 
                            ? "bg-blue-600 text-white" 
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-foreground">
                  Deskripsi / Ketentuan Garansi
                </Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateGuarantee(item.id, "description", e.target.value)}
                  placeholder="Jelaskan syarat atau komitmen garansi kepada pembeli..."
                  rows={2}
                  className="bg-background rounded-xl text-xs resize-none"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addGuarantee}
          className="w-full h-11 border-dashed border-blue-500/40 text-blue-600 hover:bg-blue-500/5 rounded-2xl font-bold text-xs gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Garansi
        </Button>
      </div>

      {/* 4. PRICING & OFFER STRUCTURE */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
              4. Pricing & Offer Structure
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Rancang harga normal paket, strategi diskon penawaran, dan tetapkan harga promo final.
            </p>
          </div>
        </div>

        {/* Value Breakdown Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-2xl border border-border space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Total Penawaran Utama
            </p>
            <p className="text-lg font-heading font-black text-foreground">
              Rp {formatRp(totalMainValue)}
            </p>
            <p className="text-[10px] text-muted-foreground">{mainOffers.length} Item</p>
          </div>

          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/15 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
              Total Nilai Bonus
            </p>
            <p className="text-lg font-heading font-black text-emerald-600">
              Rp {formatRp(totalBonusValue)}
            </p>
            <p className="text-[10px] text-muted-foreground">{bonuses.length} Bonus</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-pink-500/10 via-primary/10 to-amber-500/10 rounded-2xl border border-pink-500/20 space-y-1">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <p className="text-[10px] font-black uppercase tracking-wider text-pink-600">
                Total Value Stack
              </p>
            </div>
            <p className="text-2xl font-heading font-black text-foreground">
              Rp {formatRp(totalValueStack)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">
              Nilai nyata total penawaran
            </p>
          </div>
        </div>

        {/* Pricing Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* 1. Harga Normal Paket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Harga Normal Paket
              </Label>
              <button
                type="button"
                onClick={() => handleNormalPriceChange(totalMainValue > 0 ? totalMainValue : totalValueStack)}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Gunakan Subtotal
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-black text-muted-foreground">
                Rp
              </span>
              <Input
                type="text"
                value={pricing.normalPrice ? formatRp(pricing.normalPrice) : ""}
                onChange={(e) => handleNormalPriceChange(parseNum(e.target.value))}
                placeholder="199.000"
                className="bg-background pl-10 rounded-xl text-base font-bold h-12"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Harga coret sebelum diskon.
            </p>
          </div>

          {/* 2. Diskon */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Skema Diskon
              </Label>
              <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange("percentage")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer",
                    pricing.discountType === "percentage" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                  )}
                >
                  % Persen
                </button>
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange("fixed")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer",
                    pricing.discountType === "fixed" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                  )}
                >
                  Rp Nominal
                </button>
              </div>
            </div>

            <div className="relative">
              {pricing.discountType === "fixed" && (
                <span className="absolute left-3 top-3 text-xs font-black text-muted-foreground">
                  Rp
                </span>
              )}
              <Input
                type="text"
                value={pricing.discountValue ? (pricing.discountType === "percentage" ? pricing.discountValue : formatRp(pricing.discountValue)) : ""}
                onChange={(e) => handleDiscountValueChange(parseNum(e.target.value))}
                placeholder={pricing.discountType === "percentage" ? "50" : "100.000"}
                className={cn(
                  "bg-background rounded-xl text-base font-bold h-12",
                  pricing.discountType === "fixed" ? "pl-10" : "pr-8"
                )}
              />
              {pricing.discountType === "percentage" && (
                <span className="absolute right-3 top-3 text-xs font-black text-muted-foreground">
                  %
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {pricing.discountType === "percentage" ? (
                [20, 30, 50, 70, 80].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleDiscountValueChange(pct)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black transition-colors cursor-pointer",
                      pricing.discountValue === pct 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pct}%
                  </button>
                ))
              ) : (
                [50000, 100000, 150000].map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => handleDiscountValueChange(nom)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black transition-colors cursor-pointer",
                      pricing.discountValue === nom 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {formatRp(nom)}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 3. Harga Promo Final */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-emerald-600 flex items-center justify-between">
              <span>Harga Promo Final</span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                Wajib Menarik
              </span>
            </Label>

            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-black text-emerald-600">
                Rp
              </span>
              <Input
                type="text"
                value={pricing.finalPrice ? formatRp(pricing.finalPrice) : ""}
                onChange={(e) => handleFinalPriceChange(parseNum(e.target.value))}
                placeholder="99.000"
                className="bg-emerald-500/5 border-emerald-500/30 pl-10 rounded-xl text-lg font-black h-12 text-emerald-600 focus-visible:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Harga aktual yang dibayar oleh pembeli saat checkout.
            </p>
          </div>
        </div>

        {/* Urgency & CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">
              Catatan Urgensi & Kelangkaan
            </Label>
            <Input
              value={pricing.urgencyNote}
              onChange={(e) => setPricing(prev => ({ ...prev, urgencyNote: e.target.value }))}
              placeholder="Contoh: Harga Promo Spesial Hanya untuk 50 Pembeli Pertama"
              className="bg-background rounded-xl text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">
              Teks Tombol Tindakan (CTA)
            </Label>
            <Input
              value={pricing.ctaText}
              onChange={(e) => setPricing(prev => ({ ...prev, ctaText: e.target.value }))}
              placeholder="Contoh: Ambil Paket Penawaran Spesial Sekarang 👉"
              className="bg-background rounded-xl text-xs font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
