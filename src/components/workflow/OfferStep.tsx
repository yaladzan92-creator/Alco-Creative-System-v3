import React from "react";
import { 
  Gift, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Tag, 
  Calculator, 
  Package, 
  Clock, 
  ArrowRight,
  Flame,
  Check,
  RotateCcw,
  ShoppingBag,
  Layers,
  GitFork,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import StepAiDraftBar from "./StepAiDraftBar";
import { cn } from "@/lib/utils";

import { 
  OfferStructureType, 
  MainOfferItem, 
  BonusItem, 
  GuaranteeItem, 
  PricingStructure, 
  TierPackage, 
  OrderBumpItem, 
  UpsellItem,
  formatRp,
  parseNum
} from "@/types/offer";

import SingleOfferForm from "./offer/SingleOfferForm";
import TieredPackagesForm from "./offer/TieredPackagesForm";
import UpsellFunnelForm from "./offer/UpsellFunnelForm";
import LiveOfferPreview from "./offer/LiveOfferPreview";

export default function OfferStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  
  // 1. Chosen Offer Structure (Default: "single")
  const [structureType, setStructureType] = React.useState<OfferStructureType>("single");

  // State: Single Offer & Base Offers
  const [mainOffers, setMainOffers] = React.useState<MainOfferItem[]>([
    {
      id: "main-1",
      name: project?.name || "ALCO Creative System — Core Engine",
      description: "Akses sistem otomasi strategi digital dan ekosistem terintegrasi siap pakai.",
      price: 299000
    }
  ]);

  const [bonuses, setBonuses] = React.useState<BonusItem[]>([
    {
      id: "bonus-1",
      name: "ALCO Auto Motion — Video Motion Preset",
      description: "Kumpulan template animasi promosi berkonversi tinggi siap pakai.",
      value: 149000
    },
    {
      id: "bonus-2",
      name: "Master Copywriting Prompt Library",
      description: "Bank formula hook dan naskah iklan Meta Ads teruji.",
      value: 99000
    }
  ]);

  const [guarantees, setGuarantees] = React.useState<GuaranteeItem[]>([
    {
      id: "guarantee-1",
      title: "Garansi 100% Kepuasan & Uang Kembali",
      duration: "30 Hari",
      description: "Jika dalam 30 hari Anda tidak merasakan manfaat nyata, kami kembalikan dana Anda 100% tanpa syarat rumit."
    }
  ]);

  const [pricing, setPricing] = React.useState<PricingStructure>({
    normalPrice: 299000,
    discountType: "percentage",
    discountValue: 50,
    finalPrice: 149000,
    urgencyNote: "Harga Promo Spesial Hanya untuk 50 Pembeli Pertama",
    ctaText: "Ambil Paket Penawaran Spesial Sekarang 👉"
  });

  // State: Tiered Packages
  const [tierPackages, setTierPackages] = React.useState<TierPackage[]>([
    {
      id: "tier-1",
      name: "Paket Starter",
      tagline: "Pilihan esensial untuk memulai tanpa risiko.",
      isRecommended: false,
      features: [
        "Akses Modul Utama Core Engine",
        "Akses Pembaruan Sistem 6 Bulan",
        "Dukungan Email Support Standar"
      ],
      bonuses: [
        {
          id: "tb-1",
          name: "Quickstart Checklist PDF",
          description: "Panduan ringkas langkah pertama.",
          value: 49000
        }
      ],
      guarantee: {
        id: "tg-1",
        title: "Garansi 14 Hari Kepuasan",
        duration: "14 Hari",
        description: "Pengembalian dana jika materi tidak sesuai deskripsi."
      },
      totalValue: 349000,
      normalPrice: 199000,
      discountType: "percentage",
      discountValue: 50,
      finalPrice: 99000,
      ctaText: "Pilih Paket Starter 👉"
    },
    {
      id: "tier-2",
      name: "Paket Pro (Paling Populer)",
      tagline: "Paket lengkap dengan fitur terbaik untuk akselerasi maksimal.",
      isRecommended: true,
      features: [
        "Akses Seluruh Modul Core Engine Lengkap",
        "Akses Update Seumur Hidup (Lifetime)",
        "Grup Komunitas & Diskusi Eksklusif",
        "Prioritas Support via WhatsApp"
      ],
      bonuses: [
        {
          id: "tb-2",
          name: "ALCO Auto Motion Video Preset Pack",
          description: "Template animasi video berkonversi tinggi.",
          value: 149000
        },
        {
          id: "tb-3",
          name: "Master Copywriting Prompt Library",
          description: "Bank formula hook iklan Meta Ads.",
          value: 99000
        }
      ],
      guarantee: {
        id: "tg-2",
        title: "Garansi 30 Hari Uang Kembali 100%",
        duration: "30 Hari",
        description: "Jaminan tanpa risiko jika tidak merasakan manfaat nyata."
      },
      totalValue: 699000,
      normalPrice: 399000,
      discountType: "percentage",
      discountValue: 50,
      finalPrice: 199000,
      ctaText: "Ambil Paket Pro Sekarang 👉"
    },
    {
      id: "tier-3",
      name: "Paket VIP / Masterclass",
      tagline: "Solusi eksklusif dengan bimbingan langsung 1-on-1.",
      isRecommended: false,
      features: [
        "Semua Fitur Paket Pro",
        "1-on-1 Audit & Konsultasi Langsung",
        "Review Campaign Iklan Pribadi",
        "Akses Private VIP Circle"
      ],
      bonuses: [
        {
          id: "tb-4",
          name: "Semua Koleksi Bonus Pro + VIP Assets",
          description: "Aset desain dan workflow premium.",
          value: 299000
        }
      ],
      guarantee: {
        id: "tg-3",
        title: "Garansi Pendampingan Sampai Berhasil",
        duration: "60 Hari",
        description: "Bimbingan intensif hingga kampanye siap jalan."
      },
      totalValue: 1299000,
      normalPrice: 799000,
      discountType: "percentage",
      discountValue: 40,
      finalPrice: 479000,
      ctaText: "Daftar Paket VIP Sekarang 👉"
    }
  ]);

  // State: Funnel (Main Offer + Order Bump + Upsells)
  const [orderBump, setOrderBump] = React.useState<OrderBumpItem>({
    id: "bump-1",
    name: "Koleksi 100+ Template Desain Iklan Canva & Figma Siap Pakai",
    description: "Tingkatkan konversi iklan Anda dengan template visual yang sudah teruji menghasilkan CTR tinggi.",
    price: 49000,
    normalPrice: 149000
  });

  const [upsells, setUpsells] = React.useState<UpsellItem[]>([
    {
      id: "upsell-1",
      name: "Sesi Audit & Konsultasi Strategi Privat 1-on-1",
      description: "Penawaran satu kali (One-Time Offer) untuk membedah strategi penawaran & funnel bisnis Anda secara personal.",
      normalPrice: 499000,
      upsellPrice: 199000
    }
  ]);

  // Initialize from project data if exists
  React.useEffect(() => {
    if (project?.offerData) {
      const data = project.offerData;

      if (data.structureType) {
        setStructureType(data.structureType);
      }

      if (Array.isArray(data.mainOffers) && data.mainOffers.length > 0) {
        setMainOffers(data.mainOffers);
      } else if (data.selectedOption?.main_offer || data.selectedOption?.product_name) {
        setMainOffers([
          {
            id: "main-init",
            name: data.selectedOption.main_offer || data.selectedOption.product_name || project?.name,
            description: data.selectedOption.deliverables?.join(", ") || data.selectedOption.description || "Akses penawaran utama.",
            price: typeof data.selectedOption.price === "number" ? data.selectedOption.price : parseNum(data.selectedOption.price) || 299000
          }
        ]);
      }

      if (Array.isArray(data.bonuses) && data.bonuses.length > 0) {
        setBonuses(data.bonuses.map((b: any, idx: number) => {
          if (typeof b === "string") {
            return { id: `bonus-${idx}`, name: b, description: "Bonus eksklusif.", value: 99000 };
          }
          return b;
        }));
      }

      if (Array.isArray(data.guarantees) && data.guarantees.length > 0) {
        setGuarantees(data.guarantees);
      }

      if (data.pricing) {
        setPricing(prev => ({
          ...prev,
          ...data.pricing
        }));
      }

      if (Array.isArray(data.tierPackages) && data.tierPackages.length > 0) {
        setTierPackages(data.tierPackages);
      }

      if (data.orderBump) {
        setOrderBump(data.orderBump);
      }

      if (Array.isArray(data.upsells) && data.upsells.length > 0) {
        setUpsells(data.upsells);
      }
    }
  }, [project]);

  // AI Generator based on selected structureType
  const handleAIGenerate = async () => {
    setLoading(true);
    try {
      const context = `
NAMA PROYEK: ${project?.name || "Digital Marketing Offer"}
DESKRIPSI: ${project?.description || ""}
AUDIENCE TARGET: ${project?.targetAudience || JSON.stringify(project?.painPointData?.selectedOption || {})}
POSITIONING: ${JSON.stringify(project?.positioningData?.selectedOption || {})}
STRUKTUR YANG DIINGINKAN: ${structureType.toUpperCase()}
EXTRA CONTEXT: ${extraContext || "Buat penawaran yang sangat persuasif, harga realistis rupiah, bonus bernilai nyata, dan garansi kuat."}
      `;

      let prompt = "";
      if (structureType === "single") {
        prompt = `
Hasilkan struktur Single Offer Stack dalam format JSON:
{
  "mainOffers": [
    { "name": "...", "description": "...", "price": 299000 }
  ],
  "bonuses": [
    { "name": "...", "description": "...", "value": 99000 },
    { "name": "...", "description": "...", "value": 149000 }
  ],
  "guarantees": [
    { "title": "Garansi 100% Kepuasan & Uang Kembali", "duration": "30 Hari", "description": "..." }
  ],
  "pricing": {
    "normalPrice": 299000,
    "discountType": "percentage",
    "discountValue": 50,
    "finalPrice": 149000,
    "urgencyNote": "Harga Promo Spesial Hanya untuk 50 Pembeli Pertama",
    "ctaText": "Ambil Paket Penawaran Spesial Sekarang 👉"
  }
}
Kembalikan HANYA JSON murni tanpa markdown pembuka/penutup.
        `;
      } else if (structureType === "tiered") {
        prompt = `
Hasilkan struktur Tiered Packages (minimal 3 tingkatan paket: Starter, Pro, Complete/VIP) dalam format JSON:
{
  "tierPackages": [
    {
      "name": "Paket Starter",
      "tagline": "...",
      "isRecommended": false,
      "features": ["Fitur 1", "Fitur 2", "Fitur 3"],
      "bonuses": [{ "name": "...", "description": "...", "value": 49000 }],
      "guarantee": { "title": "Garansi 14 Hari", "duration": "14 Hari", "description": "..." },
      "totalValue": 299000,
      "normalPrice": 199000,
      "discountType": "percentage",
      "discountValue": 50,
      "finalPrice": 99000,
      "ctaText": "Pilih Paket Starter 👉"
    },
    {
      "name": "Paket Pro (Paling Populer)",
      "tagline": "...",
      "isRecommended": true,
      "features": ["Semua fitur Starter", "Fitur Pro 1", "Fitur Pro 2", "Fitur Pro 3"],
      "bonuses": [{ "name": "...", "description": "...", "value": 99000 }, { "name": "...", "description": "...", "value": 149000 }],
      "guarantee": { "title": "Garansi 30 Hari Uang Kembali", "duration": "30 Hari", "description": "..." },
      "totalValue": 599000,
      "normalPrice": 399000,
      "discountType": "percentage",
      "discountValue": 50,
      "finalPrice": 199000,
      "ctaText": "Ambil Paket Pro Sekarang 👉"
    },
    {
      "name": "Paket VIP / Masterclass",
      "tagline": "...",
      "isRecommended": false,
      "features": ["Semua fitur Pro", "1-on-1 Konsultasi", "Akses VIP Circle"],
      "bonuses": [{ "name": "...", "description": "...", "value": 299000 }],
      "guarantee": { "title": "Garansi 60 Hari Kepuasan Penuh", "duration": "60 Hari", "description": "..." },
      "totalValue": 1199000,
      "normalPrice": 799000,
      "discountType": "percentage",
      "discountValue": 40,
      "finalPrice": 479000,
      "ctaText": "Daftar Paket VIP Sekarang 👉"
    }
  ]
}
Kembalikan HANYA JSON murni tanpa markdown pembuka/penutup.
        `;
      } else {
        prompt = `
Hasilkan struktur Main Offer + Order Bump + Upsells dalam format JSON:
{
  "mainOffers": [
    { "name": "...", "description": "...", "price": 299000 }
  ],
  "pricing": {
    "normalPrice": 299000,
    "discountType": "percentage",
    "discountValue": 50,
    "finalPrice": 149000,
    "urgencyNote": "Harga Promo Spesial Terbatas",
    "ctaText": "Beli Sekarang 👉"
  },
  "orderBump": {
    "name": "...",
    "description": "...",
    "price": 49000,
    "normalPrice": 149000
  },
  "upsells": [
    {
      "name": "...",
      "description": "...",
      "normalPrice": 499000,
      "upsellPrice": 199000
    }
  ]
}
Kembalikan HANYA JSON murni tanpa markdown pembuka/penutup.
        `;
      }

      const response = await generateAIContent(
        `${context}\n\n${prompt}`,
        AGENT_PROMPTS.STEP_6_OFFER || AGENT_PROMPTS.OFFER
      );

      let cleanRes = response.trim();
      if (cleanRes.startsWith("```json")) {
        cleanRes = cleanRes.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanRes.startsWith("```")) {
        cleanRes = cleanRes.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanRes);

      if (parsed.mainOffers && Array.isArray(parsed.mainOffers)) {
        setMainOffers(parsed.mainOffers.map((m: any, i: number) => ({
          id: `ai-main-${Date.now()}-${i}`,
          name: m.name || "Penawaran Utama",
          description: m.description || "",
          price: parseNum(m.price) || 199000
        })));
      }

      if (parsed.bonuses && Array.isArray(parsed.bonuses)) {
        setBonuses(parsed.bonuses.map((b: any, i: number) => ({
          id: `ai-bonus-${Date.now()}-${i}`,
          name: b.name || "Bonus",
          description: b.description || "",
          value: parseNum(b.value) || 99000
        })));
      }

      if (parsed.guarantees && Array.isArray(parsed.guarantees)) {
        setGuarantees(parsed.guarantees.map((g: any, i: number) => ({
          id: `ai-guar-${Date.now()}-${i}`,
          title: g.title || "Garansi Kepuasan",
          duration: g.duration || "30 Hari",
          description: g.description || ""
        })));
      }

      if (parsed.pricing) {
        setPricing(prev => ({
          ...prev,
          ...parsed.pricing,
          normalPrice: parseNum(parsed.pricing.normalPrice) || prev.normalPrice,
          discountValue: parseNum(parsed.pricing.discountValue) || prev.discountValue,
          finalPrice: parseNum(parsed.pricing.finalPrice) || prev.finalPrice
        }));
      }

      if (parsed.tierPackages && Array.isArray(parsed.tierPackages)) {
        setTierPackages(parsed.tierPackages.map((t: any, i: number) => ({
          id: `ai-tier-${Date.now()}-${i}`,
          name: t.name || `Paket #${i + 1}`,
          tagline: t.tagline || "",
          isRecommended: Boolean(t.isRecommended),
          features: Array.isArray(t.features) ? t.features : ["Fitur Utama"],
          bonuses: Array.isArray(t.bonuses) ? t.bonuses : [],
          guarantee: t.guarantee || { title: "Garansi 30 Hari", duration: "30 Hari", description: "" },
          totalValue: parseNum(t.totalValue) || 499000,
          normalPrice: parseNum(t.normalPrice) || 299000,
          discountType: t.discountType || "percentage",
          discountValue: parseNum(t.discountValue) || 50,
          finalPrice: parseNum(t.finalPrice) || 149000,
          ctaText: t.ctaText || "Pilih Paket Ini 👉"
        })));
      }

      if (parsed.orderBump) {
        setOrderBump({
          id: `ai-bump-${Date.now()}`,
          name: parsed.orderBump.name || "Order Bump Spesial",
          description: parsed.orderBump.description || "",
          price: parseNum(parsed.orderBump.price) || 49000,
          normalPrice: parseNum(parsed.orderBump.normalPrice) || 149000
        });
      }

      if (parsed.upsells && Array.isArray(parsed.upsells)) {
        setUpsells(parsed.upsells.map((u: any, i: number) => ({
          id: `ai-up-${Date.now()}-${i}`,
          name: u.name || "Upsell OTO",
          description: u.description || "",
          normalPrice: parseNum(u.normalPrice) || 499000,
          upsellPrice: parseNum(u.upsellPrice) || 199000
        })));
      }

      toast.success("Rekomendasi Penawaran berhasil dibuat!");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal men-generate penawaran AI, silakan gunakan form manual.");
    } finally {
      setLoading(false);
    }
  };

  // Save Step
  const handleSaveStep = () => {
    // Determine active pricing and name summary
    let mainOfferName = mainOffers[0]?.name || project?.name || "Penawaran Utama";
    let finalActivePrice = pricing.finalPrice;
    let normalActivePrice = pricing.normalPrice;

    if (structureType === "tiered") {
      const recTier = tierPackages.find(t => t.isRecommended) || tierPackages[0];
      if (recTier) {
        mainOfferName = recTier.name;
        finalActivePrice = recTier.finalPrice;
        normalActivePrice = recTier.normalPrice;
      }
    }

    const payload = {
      structureType,
      mainOffers,
      bonuses,
      guarantees,
      pricing: {
        ...pricing,
        totalMainOffersValue: mainOffers.reduce((s, i) => s + (Number(i.price) || 0), 0),
        totalBonusesValue: bonuses.reduce((s, i) => s + (Number(i.value) || 0), 0),
        totalValueStack: mainOffers.reduce((s, i) => s + (Number(i.price) || 0), 0) + bonuses.reduce((s, i) => s + (Number(i.value) || 0), 0)
      },
      tierPackages,
      orderBump,
      upsells,
      // Backward compatibility for downstream steps
      selectedOption: {
        structureType,
        product_name: mainOfferName,
        main_offer: mainOfferName,
        price: finalActivePrice,
        pricing: finalActivePrice,
        price_point: `Rp ${formatRp(finalActivePrice)} (Diskon dari Rp ${formatRp(normalActivePrice)})`,
        pricing_strategy: `Harga Promo Rp ${formatRp(finalActivePrice)} (Normal Rp ${formatRp(normalActivePrice)})`,
        bonuses: structureType === "tiered" 
          ? tierPackages.flatMap(t => t.bonuses.map(b => b.name))
          : bonuses.map(b => b.name),
        guarantee: guarantees[0]?.title || "Garansi 100% Kepuasan",
        guarantees,
        urgency: pricing.urgencyNote,
        cta: pricing.ctaText,
        deliverables: mainOffers.map(m => m.name),
        benefits: mainOffers.map(m => m.description).filter(Boolean),
        tierPackages,
        orderBump,
        upsells
      },
      output: `Struktur Penawaran: ${structureType.toUpperCase()} | Produk: ${mainOfferName} | Harga Promo: Rp ${formatRp(finalActivePrice)}`
    };

    if (onSave) onSave(payload);
    if (onSaveProject) {
      onSaveProject({
        ...project,
        offerData: payload
      });
    }

    toast.success("Formulasi Paket Penawaran & Pricing berhasil disimpan!");
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleAIGenerate}
      onFixAndContinue={handleSaveStep}
      onSaveProject={handleSaveStep}
      hasResult={true}
      activeStep={6}
    >
      <div className="space-y-10">
        {/* Level 1: Step-Level AI Draft Fill with Preview & Confirmation */}
        <StepAiDraftBar
          stepNumber={6}
          stepName="Paket Penawaran & Pricing"
          project={project}
          currentValues={{
            mainOfferName: mainOffers[0]?.name || "",
            mainOfferDesc: mainOffers[0]?.description || "",
            bonus1Name: bonuses[0]?.name || "",
            bonus1Desc: bonuses[0]?.description || "",
            guaranteeName: guarantees[0]?.title || "",
            guaranteeDesc: guarantees[0]?.description || "",
            urgencyNote: pricing.urgencyNote || "",
            ctaText: pricing.ctaText || ""
          }}
          fieldLabels={{
            mainOfferName: "Nama Produk / Paket Utama",
            mainOfferDesc: "Deskripsi Singkat Penawaran Utama",
            bonus1Name: "Nama Bonus Utama",
            bonus1Desc: "Deskripsi Manfaat Bonus",
            guaranteeName: "Nama Garansi Bebas Risiko",
            guaranteeDesc: "Ketentuan Garansi",
            urgencyNote: "Trigger Urgensi / Batas Promo",
            ctaText: "Teks Tombol CTA Menarik"
          }}
          onApplyAll={(newVals) => {
            if (newVals.mainOfferName || newVals.mainOfferDesc) {
              setMainOffers(prev => [
                {
                  ...prev[0],
                  name: newVals.mainOfferName || prev[0]?.name || "Penawaran Utama",
                  description: newVals.mainOfferDesc || prev[0]?.description || ""
                },
                ...prev.slice(1)
              ]);
            }
            if (newVals.bonus1Name || newVals.bonus1Desc) {
              setBonuses(prev => [
                {
                  ...prev[0],
                  name: newVals.bonus1Name || prev[0]?.name || "Bonus Eksklusif",
                  description: newVals.bonus1Desc || prev[0]?.description || ""
                },
                ...prev.slice(1)
              ]);
            }
            if (newVals.guaranteeName || newVals.guaranteeDesc) {
              setGuarantees(prev => [
                {
                  ...prev[0],
                  title: newVals.guaranteeName || prev[0]?.title || "Garansi 100% Kepuasan",
                  description: newVals.guaranteeDesc || prev[0]?.description || ""
                },
                ...prev.slice(1)
              ]);
            }
            if (newVals.urgencyNote || newVals.ctaText) {
              setPricing(prev => ({
                ...prev,
                urgencyNote: newVals.urgencyNote || prev.urgencyNote,
                ctaText: newVals.ctaText || prev.ctaText
              }));
            }
          }}
        />

        {/* ========================================================= */}
        {/* 1. TOP SELECTOR: PILIH STRUKTUR PENAWARAN */}
        {/* ========================================================= */}
        <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary px-2.5 py-1 rounded-full bg-primary/10">
              Langkah 1: Tentukan Model Penawaran
            </span>
            <h3 className="text-base md:text-lg font-heading font-black text-foreground mt-2">
              Pilih Struktur Penawaran (Offer Structure)
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Sesuaikan arsitektur penawaran dengan tujuan konversi landing page Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Single Offer */}
            <button
              type="button"
              onClick={() => setStructureType("single")}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all relative space-y-3 cursor-pointer",
                structureType === "single"
                  ? "bg-primary/5 border-primary shadow-md ring-2 ring-primary/20"
                  : "bg-secondary/30 border-border hover:border-primary/40 hover:bg-secondary/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="w-5 h-5" />
                </div>
                {structureType === "single" && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-heading font-black text-foreground">
                    1. Single Offer
                  </h4>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
                  1 paket penawaran utama dengan tumpukan bonus, garansi kuat, dan harga promo coret.
                </p>
              </div>
            </button>

            {/* Card 2: Tiered Packages */}
            <button
              type="button"
              onClick={() => setStructureType("tiered")}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all relative space-y-3 cursor-pointer",
                structureType === "tiered"
                  ? "bg-indigo-500/5 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                  : "bg-secondary/30 border-border hover:border-indigo-500/40 hover:bg-secondary/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                {structureType === "tiered" && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-heading font-black text-foreground">
                  2. Tiered Packages
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
                  2-3 pilihan paket bertingkat (misal: Starter, Pro, VIP) dengan tabel perbandingan harga & badge rekomendasi.
                </p>
              </div>
            </button>

            {/* Card 3: Main Offer + Upsell / Order Bump */}
            <button
              type="button"
              onClick={() => setStructureType("upsell")}
              className={cn(
                "p-5 rounded-2xl border-2 text-left transition-all relative space-y-3 cursor-pointer",
                structureType === "upsell"
                  ? "bg-amber-500/5 border-amber-500 shadow-md ring-2 ring-amber-500/20"
                  : "bg-secondary/30 border-border hover:border-amber-500/40 hover:bg-secondary/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <GitFork className="w-5 h-5" />
                </div>
                {structureType === "upsell" && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-heading font-black text-foreground">
                  3. Main Offer + Upsell
                </h4>
                <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
                  Funnel konversi maksimal: Produk Utama + Order Bump (checkout) + One-Time Offer (Upsell).
                </p>
              </div>
            </button>
          </div>

          {/* AI Generator Helper Bar */}
          <div className="p-4 bg-secondary/30 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                Butuh inspirasi formulasi harga & penawaran?
              </span>
            </div>

            <Button
              type="button"
              onClick={handleAIGenerate}
              disabled={loading}
              className="h-9 px-4 rounded-xl font-bold text-xs gap-2 cursor-pointer bg-primary text-primary-foreground shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Merancang Penawaran...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Rekomendasi Penawaran (AI)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. DYNAMIC FORM ACCORDING TO SELECTED STRUCTURE */}
        {/* ========================================================= */}
        {structureType === "single" && (
          <SingleOfferForm
            mainOffers={mainOffers}
            setMainOffers={setMainOffers}
            bonuses={bonuses}
            setBonuses={setBonuses}
            guarantees={guarantees}
            setGuarantees={setGuarantees}
            pricing={pricing}
            setPricing={setPricing}
          />
        )}

        {structureType === "tiered" && (
          <TieredPackagesForm
            packages={tierPackages}
            setPackages={setTierPackages}
          />
        )}

        {structureType === "upsell" && (
          <UpsellFunnelForm
            mainOffers={mainOffers}
            setMainOffers={setMainOffers}
            bonuses={bonuses}
            setBonuses={setBonuses}
            guarantee={guarantees[0] || { id: "g1", title: "Garansi 30 Hari", duration: "30 Hari", description: "" }}
            setGuarantee={(val) => setGuarantees([typeof val === "function" ? (val as any)(guarantees[0]) : val])}
            pricing={pricing}
            setPricing={setPricing}
            orderBump={orderBump}
            setOrderBump={setOrderBump}
            upsells={upsells}
            setUpsells={setUpsells}
          />
        )}

        {/* ========================================================= */}
        {/* 3. LIVE OFFER PREVIEW */}
        {/* ========================================================= */}
        <div className="p-6 md:p-8 bg-card rounded-3xl border border-border shadow-sm space-y-6">
          <LiveOfferPreview
            structureType={structureType}
            mainOffers={mainOffers}
            bonuses={bonuses}
            guarantees={guarantees}
            pricing={pricing}
            tierPackages={tierPackages}
            orderBump={orderBump}
            upsells={upsells}
          />
        </div>
      </div>
    </StepWrapper>
  );
}
