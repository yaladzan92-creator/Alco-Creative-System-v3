import React from "react";
import { 
  GitFork, 
  Package, 
  Gift, 
  ShieldCheck, 
  Zap, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ShoppingBag,
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
  OrderBumpItem, 
  UpsellItem,
  formatRp, 
  parseNum 
} from "@/types/offer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UpsellFunnelFormProps {
  mainOffers: MainOfferItem[];
  setMainOffers: React.Dispatch<React.SetStateAction<MainOfferItem[]>>;
  bonuses: BonusItem[];
  setBonuses: React.Dispatch<React.SetStateAction<BonusItem[]>>;
  guarantee: GuaranteeItem;
  setGuarantee: React.Dispatch<React.SetStateAction<GuaranteeItem>>;
  pricing: PricingStructure;
  setPricing: React.Dispatch<React.SetStateAction<PricingStructure>>;
  orderBump: OrderBumpItem;
  setOrderBump: React.Dispatch<React.SetStateAction<OrderBumpItem>>;
  upsells: UpsellItem[];
  setUpsells: React.Dispatch<React.SetStateAction<UpsellItem[]>>;
}

export default function UpsellFunnelForm({
  mainOffers,
  setMainOffers,
  bonuses,
  setBonuses,
  guarantee,
  setGuarantee,
  pricing,
  setPricing,
  orderBump,
  setOrderBump,
  upsells,
  setUpsells
}: UpsellFunnelFormProps) {

  // Main Offer actions
  const addMainOffer = () => {
    setMainOffers(prev => [
      ...prev,
      {
        id: `main-${Date.now()}`,
        name: "",
        description: "",
        price: 199000
      }
    ]);
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

  // Upsell actions
  const addUpsell = () => {
    setUpsells(prev => [
      ...prev,
      {
        id: `upsell-${Date.now()}`,
        name: `Paket Upgrade VIP / Konsultasi #${prev.length + 1}`,
        description: "Akses sesi konsultasi privat 1-on-1 dan audit implementasi langsung.",
        normalPrice: 499000,
        upsellPrice: 199000
      }
    ]);
  };

  const updateUpsell = (id: string, field: keyof UpsellItem, value: any) => {
    setUpsells(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const removeUpsell = (id: string) => {
    setUpsells(prev => prev.filter(u => u.id !== id));
  };

  const moveUpsell = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === upsells.length - 1)) return;
    const newIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...upsells];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setUpsells(updated);
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="p-6 bg-card rounded-3xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
              Struktur Funnel: Main Offer + Order Bump + Upsell
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Tingkatkan Average Order Value (AOV) dengan penawaran tambahan di halaman checkout dan penawaran satu kali (OTO/Upsell) setelah pembelian.
            </p>
          </div>
        </div>
      </div>

      {/* 1. FRONT-END MAIN OFFER */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
            1
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
              A. Penawaran Utama (Front-End Offer)
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Produk awal yang menjadi daya tarik utama calon pembeli di halaman penjualan.
            </p>
          </div>
        </div>

        {/* Main Offer Items */}
        <div className="space-y-4">
          {mainOffers.map((item, index) => (
            <div 
              key={item.id}
              className="p-5 bg-secondary/20 rounded-2xl border border-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Produk Utama #{index + 1}
                </span>
                {mainOffers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMainOffer(item.id)}
                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Hapus
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold text-foreground">
                    Nama Produk Utama
                  </Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateMainOffer(item.id, "name", e.target.value)}
                    placeholder="Contoh: ALCO Creative System — Core Engine"
                    className="bg-background rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-foreground">
                    Harga Normal (Rp)
                  </Label>
                  <Input
                    type="text"
                    value={item.price ? formatRp(item.price) : ""}
                    onChange={(e) => updateMainOffer(item.id, "price", parseNum(e.target.value))}
                    placeholder="299.000"
                    className="bg-background rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  Deskripsi Singkat
                </Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateMainOffer(item.id, "description", e.target.value)}
                  placeholder="Deskripsi ringkas produk utama..."
                  rows={2}
                  className="bg-background rounded-xl text-xs resize-none"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addMainOffer}
            className="w-full h-10 border-dashed border-primary/40 text-primary hover:bg-primary/5 rounded-xl font-bold text-xs gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Tambah Produk Utama
          </Button>
        </div>

        {/* Pricing for Main Offer */}
        <div className="p-5 bg-secondary/30 rounded-2xl border border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground">
              Harga Normal Coret
            </Label>
            <Input
              type="text"
              value={pricing.normalPrice ? formatRp(pricing.normalPrice) : ""}
              onChange={(e) => setPricing(prev => ({ ...prev, normalPrice: parseNum(e.target.value) }))}
              placeholder="299.000"
              className="bg-background rounded-xl text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-muted-foreground">
              Diskon (%)
            </Label>
            <Input
              type="text"
              value={pricing.discountValue || ""}
              onChange={(e) => {
                const disc = parseNum(e.target.value);
                const final = Math.max(0, Math.round(pricing.normalPrice * (1 - disc / 100)));
                setPricing(prev => ({ ...prev, discountValue: disc, finalPrice: final }));
              }}
              placeholder="50"
              className="bg-background rounded-xl text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-black text-emerald-600">
              Harga Promo Front-End
            </Label>
            <Input
              type="text"
              value={pricing.finalPrice ? formatRp(pricing.finalPrice) : ""}
              onChange={(e) => setPricing(prev => ({ ...prev, finalPrice: parseNum(e.target.value) }))}
              placeholder="149.000"
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 rounded-xl text-sm font-black"
            />
          </div>
        </div>
      </div>

      {/* 2. ORDER BUMP (CHECKOUT ADD-ON) */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-xs">
            2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                B. Order Bump (Penawaran Tambahan di Checkout)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black">
                1-Click Add-on
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Produk pelengkap berharga terjangkau yang dapat dicentang langsung saat pembeli mengisi form pemesanan.
            </p>
          </div>
        </div>

        <div className="p-5 bg-amber-500/5 rounded-2xl border border-dashed border-amber-500/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[11px] font-bold text-foreground">
                Nama Produk Order Bump
              </Label>
              <Input
                value={orderBump.name}
                onChange={(e) => setOrderBump(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: + Tambahkan 100+ Template Canva & Desain Iklan Siap Pakai"
                className="bg-background rounded-xl text-sm font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-foreground">
                Harga Order Bump (Rp)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="text"
                  value={orderBump.price ? formatRp(orderBump.price) : ""}
                  onChange={(e) => setOrderBump(prev => ({ ...prev, price: parseNum(e.target.value) }))}
                  placeholder="49.000"
                  className="bg-background pl-10 rounded-xl text-sm font-black text-amber-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-foreground">
              Deskripsi Singkat / Alasan Kenapa Harus Ditambahkan
            </Label>
            <Textarea
              value={orderBump.description}
              onChange={(e) => setOrderBump(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Jelaskan kenapa penawaran ini adalah no-brainer add-on yang sayang dilewatkan di checkout..."
              rows={2}
              className="bg-background rounded-xl text-xs resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. UPSELL / ONE TIME OFFER (OTO) */}
      <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 font-black text-xs">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                  C. Upsell / One-Time Offer (OTO)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-black">
                  {upsells.length} Upsell
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Penawaran eksklusif bernilai tinggi yang ditampilkan setelah pembeli menyelesaikan pesanan pertama.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={addUpsell}
            className="h-9 px-3 rounded-xl font-bold text-xs gap-1.5 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Upsell
          </Button>
        </div>

        {upsells.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-2xl space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Belum ada Upsell ditambahkan. Tambahkan Upsell untuk memaksimalkan omset per pembeli.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUpsell}
              className="text-xs font-bold rounded-xl"
            >
              + Tambah Upsell Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {upsells.map((upsell, index) => (
              <div
                key={upsell.id}
                className="p-5 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-700 flex items-center justify-center text-xs font-black">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                      Upsell #{index + 1} (One-Time Offer)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveUpsell(index, "up")}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === upsells.length - 1}
                      onClick={() => moveUpsell(index, "down")}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpsell(upsell.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold rounded-lg cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[11px] font-bold text-foreground">
                      Nama Produk Upsell
                    </Label>
                    <Input
                      value={upsell.name}
                      onChange={(e) => updateUpsell(upsell.id, "name", e.target.value)}
                      placeholder="Contoh: VIP Mentoring & Audit Iklan 1-on-1"
                      className="bg-background rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-foreground">
                      Harga Normal (Rp)
                    </Label>
                    <Input
                      type="text"
                      value={upsell.normalPrice ? formatRp(upsell.normalPrice) : ""}
                      onChange={(e) => updateUpsell(upsell.id, "normalPrice", parseNum(e.target.value))}
                      placeholder="499.000"
                      className="bg-background rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black text-purple-700">
                      Harga Khusus Upsell (Rp)
                    </Label>
                    <Input
                      type="text"
                      value={upsell.upsellPrice ? formatRp(upsell.upsellPrice) : ""}
                      onChange={(e) => updateUpsell(upsell.id, "upsellPrice", parseNum(e.target.value))}
                      placeholder="199.000"
                      className="bg-purple-500/10 border-purple-500/30 text-purple-700 rounded-xl text-sm font-black"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">
                    Deskripsi / Alasan Khusus OTO
                  </Label>
                  <Textarea
                    value={upsell.description}
                    onChange={(e) => updateUpsell(upsell.id, "description", e.target.value)}
                    placeholder="Jelaskan penawaran satu kali ini dan kenapa harga ini hanya berlaku saat ini saja..."
                    rows={2}
                    className="bg-background rounded-xl text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
