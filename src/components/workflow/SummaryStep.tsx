import React from "react";
import { 
  ClipboardList, 
  Download, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Loader2,
  FileJson,
  Layout
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { useBranding } from "@/contexts/BrandingContext";
import { mergeWorkflowResult, exportBrandIntelligence } from "../../services/brandIntelligence";
import { downloadEcosystemBlueprint } from "@/lib/ecosystemBlueprint";
import { downloadMetaAdsCampaignPack } from "@/lib/metaAdsCampaignPack";
import DocumentationEngineView from "./DocumentationEngineView";

interface SummaryStepProps {
  project: any;
  onSave: (data: any, next?: boolean) => void;
  onNext: () => void;
}

export default function SummaryStep({ project, onSave, onNext }: SummaryStepProps) {
  const { config } = useBranding();
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<any>(project?.summaryData || null);
  const [viewTab, setViewTab] = React.useState<"summary" | "doc_engine">("doc_engine");

  const renderValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val !== "object") return String(val);
    if (Array.isArray(val)) return val.join(", ");
    if (val.main_offer || val.bonuses || val.guarantee) {
      const parts = [];
      if (val.main_offer) {
        parts.push(typeof val.main_offer === 'object' ? JSON.stringify(val.main_offer) : val.main_offer);
      }
      if (val.bonuses && Array.isArray(val.bonuses)) {
        parts.push(`Bonuses: ${val.bonuses.join(", ")}`);
      }
      if (val.guarantee) {
        parts.push(`Guarantee: ${val.guarantee}`);
      }
      return parts.join(" | ");
    }
    return JSON.stringify(val);
  };

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      const context = `
        STRATEGY DATA:
        Niche: ${JSON.stringify(project.nicheData || {})}
        Audience: ${JSON.stringify(project.audienceData || {})}
        Pain Points: ${JSON.stringify(project.painPointData || {})}
        Validation: ${JSON.stringify(project.validationData || {})}
        Positioning: ${JSON.stringify(project.positioningData || {})}
        Offer: ${JSON.stringify(project.offerData || {})}
        Angles: ${JSON.stringify(project.marketingAngles || {})}
        Copy Direction: ${JSON.stringify(project.copyDirection || {})}
        Brand Foundation: ${JSON.stringify(project.brandFoundationData || {})}
      `;

      const response = await generateAIContent(context, AGENT_PROMPTS.PROJECT_SUMMARY);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      setSummary(data);
      onSave(data, false);
      toast.success("Strategy Summary Compiled!");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to generate summary: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!summary && !loading) {
      handleGenerateSummary();
    }
  }, []);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  const generateMarkdownBlueprint = () => {
    let md = `# BLUEPRINT STRATEGI ADVERTISING & BISNIS: ${project.name?.toUpperCase() || "PROYEK BARU"}\n`;
    md += `*Blueprint taktis yang dirancang dan disinkronkan sepenuhnya oleh AI pada tahun 2026*\n\n`;
    
    md += `========================================================\n`;
    md += `🎯 PROMPT INTEGRASI UNTUK CHATGPT / CLAUDE / AI LAIN:\n`;
    md += `Copy-paste seluruh isi file ini, lalu gunakan instruksi berikut:\n`;
    md += `"Halo AI, di bawah ini adalah data Blueprint Riset dan Strategi Bisnis saya secara lengkap. Tolong analisis produk apa saja yang harus saya siapkan sekarang, lalu buatkan materi rencana jadwal konten Instagram selama 1 bulan penuh (30 hari, mencakup caption persuasif, ide visual, dan tagar/relevan) untuk menjangkau target pelanggan ini."\n`;
    md += `========================================================\n\n`;

    md += `## 💡 KELOMPOK DATA 1: TARGET CERUK PASAR (NICHE)\n`;
    md += `- **Negara Target Iklan**: ${project.nicheData?.input?.country || "Indonesia"}\n`;
    md += `- **Rentang Usia**: ${project.nicheData?.input?.age || "18-45 tahun"}\n`;
    md += `- **Topik Ceruk (Minat/Hobi)**: ${project.nicheData?.input?.interest || "-"}\n`;
    md += `- **Keahlian / Kelebihan Produk**: ${project.nicheData?.input?.skill || "-"}\n`;
    md += `- **Target Pendapatan**: ${project.nicheData?.input?.goal || "-"}\n`;
    md += `- **Strategi Traffic**: ${project.nicheData?.input?.traffic || "Organic"}\n\n`;

    md += `## 👥 KELOMPOK DATA 2: KARAKTER PELANGGAN (AUDIENCE PERSONA)\n`;
    const selectedAudience = project.audienceData?.selectedOption || {};
    md += `- **Keluhan Terdalam**: ${project.audienceData?.input?.topPain || selectedAudience.main_pain || "-"}\n`;
    md += `- **Gol Terbesar**: ${project.audienceData?.input?.audienceGoal || selectedAudience.persona || "-"}\n`;
    md += `- **Ketakutan Utama**: ${project.audienceData?.input?.fears || selectedAudience.fears || "-"}\n`;
    md += `- **Hasrat Mendalam**: ${project.audienceData?.input?.desires || selectedAudience.desires || "-"}\n\n`;

    md += `## 🚨 KELOMPOK DATA 3: ANALISIS KELUHAN & MASALAH\n`;
    const selectedProblem = project.painPointData?.selectedOption || {};
    md += `- **Titik Masalah Utama**: ${selectedProblem.title || "-"}\n`;
    md += `- **Deskripsi Keluhan**: ${selectedProblem.description || "-"}\n`;
    md += `- **Dampak Lebih Lanjut (Cost of Inaction)**: ${selectedProblem.cost_of_inaction || "-"}\n\n`;

    md += `## 🏷️ KELOMPOK DATA 4: POSITIONING PREMIUM & USP\n`;
    const selectedPos = project.positioningData?.selectedOption || {};
    md += `- **Market Hook Utama**: ${selectedPos.market_hook || "-"}\n`;
    md += `- **Unique Selling Proposition (USP)**: ${selectedPos.usp || "-"}\n`;
    md += `- **Keunikan Pembeda (Core Differentiator)**: ${selectedPos.core_differentiator || "-"}\n\n`;

    md += `## 🎁 KELOMPOK DATA 5: FORMULASI PAKET PENAWARAN (OFFER)\n`;
    const selectedOffer = project.offerData?.selectedOption || project.offerData || {};
    const structType = selectedOffer.structureType || project.offerData?.structureType || "single";
    md += `- **Struktur Penawaran**: ${structType === "tiered" ? "Tiered Packages (Multi-Tier)" : structType === "upsell" ? "Funnel (Main Offer + Order Bump + Upsell)" : "Single Offer Stack"}\n`;

    if (structType === "tiered" && Array.isArray(project.offerData?.tierPackages || selectedOffer.tierPackages)) {
      const tiers = project.offerData?.tierPackages || selectedOffer.tierPackages;
      md += `- **Daftar Pilihan Paket**:\n`;
      tiers.forEach((t: any, i: number) => {
        md += `  ${i + 1}. **${t.name}** ${t.isRecommended ? "(★ Rekomendasi Utama)" : ""}: Rp ${(t.finalPrice || 0).toLocaleString('id-ID')} (Normal: Rp ${(t.normalPrice || 0).toLocaleString('id-ID')}) - ${t.tagline || ""}\n`;
      });
    } else if (structType === "upsell") {
      const mainOffersList = Array.isArray(project.offerData?.mainOffers || selectedOffer.mainOffers) 
        ? (project.offerData?.mainOffers || selectedOffer.mainOffers).map((o: any) => `${o.name} (Rp ${(o.price || 0).toLocaleString('id-ID')})`).join(", ")
        : (selectedOffer.main_offer || "-");
      md += `- **Produk Front-End**: ${mainOffersList}\n`;
      md += `- **Harga Front-End**: Rp ${(selectedOffer.price || selectedOffer.pricing?.finalPrice || 0).toLocaleString('id-ID')}\n`;
      
      const bump = project.offerData?.orderBump || selectedOffer.orderBump;
      if (bump?.name) {
        md += `- **Order Bump di Checkout**: ${bump.name} (+Rp ${(bump.price || 0).toLocaleString('id-ID')})\n`;
      }
      
      const upsells = project.offerData?.upsells || selectedOffer.upsells;
      if (Array.isArray(upsells) && upsells.length > 0) {
        md += `- **Upsell / One-Time Offer (OTO)**:\n`;
        upsells.forEach((u: any, idx: number) => {
          md += `  ${idx + 1}. **${u.name}**: Rp ${(u.upsellPrice || 0).toLocaleString('id-ID')} (Normal: Rp ${(u.normalPrice || 0).toLocaleString('id-ID')}) - ${u.description || ""}\n`;
        });
      }
    } else {
      const mainOffersList = Array.isArray(project.offerData?.mainOffers || selectedOffer.mainOffers) 
        ? (project.offerData?.mainOffers || selectedOffer.mainOffers).map((o: any) => `${o.name} (Rp ${(o.price || 0).toLocaleString('id-ID')})`).join(", ")
        : (selectedOffer.main_offer || "-");
      md += `- **Produk / Penawaran Utama**: ${mainOffersList}\n`;

      if (project.offerData?.pricing || selectedOffer.pricing) {
        const p = project.offerData?.pricing || selectedOffer.pricing;
        md += `- **Total Nilai Keseluruhan (Value Stack)**: Rp ${(p.totalValueStack || 0).toLocaleString('id-ID')}\n`;
        md += `- **Harga Normal Paket**: Rp ${(p.normalPrice || 0).toLocaleString('id-ID')}\n`;
        md += `- **Diskon**: ${p.discountType === 'percentage' ? p.discountValue + '%' : 'Rp ' + (p.discountValue || 0).toLocaleString('id-ID')}\n`;
        md += `- **Harga Promo Final**: Rp ${(p.finalPrice || 0).toLocaleString('id-ID')}\n`;
      } else {
        md += `- **Rekomendasi Skema Harga**: ${selectedOffer.price_point || selectedOffer.pricing_strategy || "-"}\n`;
      }

      const bonusesList = Array.isArray(project.offerData?.bonuses || selectedOffer.bonuses)
        ? (project.offerData?.bonuses || selectedOffer.bonuses).map((b: any) => typeof b === "object" ? `${b.name} (Nilai: Rp ${(b.value || 0).toLocaleString('id-ID')})` : b).join(", ")
        : (selectedOffer.bonuses || "-");
      md += `- **Bonus Bernilai Tinggi**: ${bonusesList}\n`;

      const guaranteesList = Array.isArray(project.offerData?.guarantees || selectedOffer.guarantees)
        ? (project.offerData?.guarantees || selectedOffer.guarantees).map((g: any) => `${g.title} (${g.duration}): ${g.description}`).join("; ")
        : (selectedOffer.guarantee || "-");
      md += `- **Garansi Keamanan**: ${guaranteesList}\n`;
      md += `- **Pemicu Kelangkaan (Urgency)**: ${selectedOffer.pricing?.urgencyNote || selectedOffer.urgency || "-"}\n\n`;
    }

    md += `## 📢 KELOMPOK DATA 6: MATERI COPYWRITING & MATERI IKLAN\n`;
    const selectedAngle = project.marketingAngles?.selectedOption || {};
    md += `- **Sudut Pandang Kreatif**: ${selectedAngle.concept || "-"}\n`;
    md += `- **Ide Visual Hook**: ${selectedAngle.visual_hook || "-"}\n`;
    const selectedCopy = project.copyDirection?.selectedOption || {};
    md += `- **Formula Copywriting**: ${selectedCopy.framework || "AIDA"}\n`;
    md += `- **Kalimat Hook**: ${selectedCopy.hook || "-"}\n`;
    md += `- **Isi Pesan Utama**: ${selectedCopy.body || "-"}\n`;
    md += `- **Call To Action (CTA)**: ${selectedCopy.cta || "-"}\n\n`;

    md += `## 🎨 KELOMPOK DATA 7: PONDASI IDENTITAS BRAND (BRAND FOUNDATION)\n`;
    const brandData = project.brandFoundationData || {};
    md += `- **Nama Brand**: ${brandData.brandName || "-"}\n`;
    md += `- **Gaya Kepribadian (Personality)**: ${Array.isArray(brandData.brandPersonality) ? brandData.brandPersonality.join(", ") : (brandData.brandPersonality || "-")}\n`;
    md += `- **Nada Komunikasi (Style)**: ${Array.isArray(brandData.communicationStyle) ? brandData.communicationStyle.join(", ") : (brandData.communicationStyle || "-")}\n`;
    md += `- **Gaya Visual & Tata Letak**: ${brandData.visualDirection || "-"}\n`;
    md += `- **Warna Identitas (Palet)**: ${brandData.colors ? `Primary (${brandData.colors.primary}), Secondary (${brandData.colors.secondary}), Accent (${brandData.colors.accent})` : "-"}\n`;
    md += `- **Rasa & Pembawaan Brand (Feel)**: ${brandData.brandFeel || "-"}\n`;
    md += `- **Nama Perusahaan / Legalitas**: ${brandData.companyName || "-"}\n`;
    md += `- **Model Kerjasama / Afiliasi / Distribusi**: ${brandData.collaborations || "-"}\n`;
    md += `- **Spokesperson / Tokoh Pengiklan**: ${brandData.advertiserFigure || "-"}\n\n`;

    md += `--- \n`;
    md += `*Selesai. Terintegrasi 100% dan Siap Di-remix.*`;
    return md;
  };

  const exportAsJSON = () => {
    downloadFile(JSON.stringify(project, null, 2), `${project.name || "strategy"}_complete.json`, "application/json");
  };

  const exportBrandIntelligenceData = () => {
    const bi = mergeWorkflowResult(project);
    const biStr = exportBrandIntelligence(bi);
    downloadFile(biStr, `${project.name || "brand"}_brand_intelligence.json`, "application/json");
    toast.success("File Brand Intelligence Core JSON berhasil di-download!");
  };

  const exportAsMarkdown = () => {
    const mdContent = generateMarkdownBlueprint();
    downloadFile(mdContent, `${project.name || "strategy"}_blueprint.md`, "text/markdown");
    toast.success("File Markdown (.md) Blueprint berhasil di-download!");
  };

  const copyPromptToClipboard = () => {
    const mdContent = generateMarkdownBlueprint();
    navigator.clipboard.writeText(mdContent);
    toast.success("Prompt Blueprint disalin! Tempelkan langsung ke ChatGPT atau Claude untuk membuat rencana konten IG!");
  };

  const [promptCopied, setPromptCopied] = React.useState(false);
  const handleCopyAction = () => {
    copyPromptToClipboard();
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">Compiling Strategy Memory...</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8 pb-20">
      {/* Informational Tooltip / Guide Banner on Top */}
      <div className="p-5 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 text-left space-y-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
            Tips: Integrasi Cepat ke ChatGPT / Claude Anda!
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            Salin Blueprint ini dengan 1-Klik di samping lalu unggah ke ChatGPT atau Claude untuk langsung menganalisis stok produk yang harus disiapkan serta menyusun draf konten Instagram selama 30 Hari penuh secara otomatis!
          </p>
        </div>
        <Button 
          onClick={handleCopyAction}
          className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl h-12 px-6 gap-2 shrink-0 cursor-pointer shadow-lg shadow-cyan-500/10 font-bold uppercase text-[10px] tracking-widest transition-all hover:scale-103"
        >
          {promptCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <ClipboardList className="w-4 h-4" />}
          {promptCopied ? "Berhasil Disalin! ✓" : "Salin Prompt ChatGPT ✨"}
        </Button>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-3 bg-secondary/50 p-1.5 rounded-2xl border border-border w-fit">
        <Button
          variant={viewTab === "doc_engine" ? "default" : "ghost"}
          onClick={() => setViewTab("doc_engine")}
          className="rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-wider gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          Documentation Engine (7 Structure Pack)
        </Button>
        <Button
          variant={viewTab === "summary" ? "default" : "ghost"}
          onClick={() => setViewTab("summary")}
          className="rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-wider gap-2 cursor-pointer"
        >
          <ClipboardList className="w-4 h-4 text-cyan-500" />
          Executive Strategy Summary
        </Button>
      </div>

      {viewTab === "doc_engine" ? (
        <DocumentationEngineView project={project} />
      ) : (
        <>
          <div className="space-y-6 text-left">
            {/* Primary CTA Section */}
            <Card className="rounded-[2.5rem] border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    FILE STRATEGI UTAMA ALCO
                  </span>
                  <h3 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-white uppercase italic">
                    Download ALCO Ecosystem Blueprint
                  </h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Gunakan file ini untuk ALCO Content Engine dan ALCO Product Forge.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const success = downloadEcosystemBlueprint(project);
                    if (success) {
                      toast.success("Blueprint ALCO (alco_ecosystem_blueprint.json) berhasil diunduh!");
                    }
                  }}
                  className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl h-14 px-8 shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 gap-3 cursor-pointer shrink-0"
                >
                  <Download className="w-5 h-5" /> Download Blueprint ALCO
                </Button>
              </div>
            </Card>

            {/* Next Steps: Ecosystem Apps Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-3xl border border-border p-5 space-y-3 bg-secondary/20 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    LANGKAH 1 — KONTEN
                  </span>
                  <ChevronRight className="w-4 h-4 text-cyan-500" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">Lanjut ke Content Engine</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Buat kalender konten, caption, image prompt, carousel, dan video.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    const success = downloadEcosystemBlueprint(project);
                    if (success) {
                      toast.success("Blueprint ALCO siap diimpor ke ALCO Content Engine!");
                    }
                  }}
                  variant="outline"
                  className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-wider border-cyan-500/30 text-cyan-600 hover:bg-cyan-500/10 gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Blueprint & Lanjut
                </Button>
              </Card>

              <Card className="rounded-3xl border border-border p-5 space-y-3 bg-secondary/20 hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    LANGKAH 2 — PRODUK
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-base font-black text-foreground">Lanjut ke Product Forge</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bangun produk, offer, modul, pricing, dan aset produk.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    const success = downloadEcosystemBlueprint(project);
                    if (success) {
                      toast.success("Blueprint ALCO siap diimpor ke ALCO Product Forge!");
                    }
                  }}
                  variant="outline"
                  className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-wider border-purple-500/30 text-purple-600 hover:bg-purple-500/10 gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Blueprint & Lanjut
                </Button>
              </Card>
            </div>

            {/* Advanced / Backup Collapsible Section */}
            <details className="group rounded-2xl border border-border bg-card p-4 transition-all">
              <summary className="flex items-center justify-between font-black uppercase text-[10px] tracking-wider text-muted-foreground cursor-pointer select-none">
                <span className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-muted-foreground" />
                  Advanced / Backup & Export Format Lain
                </span>
                <span className="text-xs font-mono text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="pt-4 mt-3 border-t border-border flex flex-wrap gap-2.5">
                <Button variant="outline" size="sm" onClick={exportAsJSON} className="rounded-xl h-9 gap-2 border-border hover:border-cyan-500/50 uppercase font-black text-[9px] tracking-wider">
                  <FileJson className="w-3.5 h-3.5 text-cyan-500" /> Backup Project (.JSON)
                </Button>
                <Button variant="outline" size="sm" onClick={exportBrandIntelligenceData} className="rounded-xl h-9 gap-2 border-border hover:border-indigo-500/50 uppercase font-black text-[9px] tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Brand Intelligence (.JSON)
                </Button>
                <Button variant="outline" size="sm" onClick={exportAsMarkdown} className="rounded-xl h-9 gap-2 border-border hover:border-blue-500/50 uppercase font-black text-[9px] tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-blue-500" /> Markdown Blueprint (.MD)
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  downloadMetaAdsCampaignPack(project);
                  toast.success("Export Khusus Meta Ads berhasil di-download!");
                }} className="rounded-xl h-9 gap-2 border-border hover:border-emerald-500/50 uppercase font-black text-[9px] tracking-wider">
                  <Download className="w-3.5 h-3.5 text-emerald-500" /> Export Khusus Meta Ads
                </Button>
              </div>
            </details>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-border shadow-xl hover:shadow-2xl transition-all border-l-8 border-l-blue-500">
          <CardContent className="p-8 space-y-6">
             <div className="flex items-center gap-2 text-blue-500">
                <Layout className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Niche & Audience</h3>
             </div>
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Main Niche</p>
                   <p className="text-sm font-bold">{renderValue(summary.niche_summary.main_niche)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Target Persona</p>
                   <p className="text-sm font-bold text-blue-600">{renderValue(summary.target_audience.persona)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Top Desires</p>
                      <p className="text-[11px] leading-relaxed italic">"{renderValue(summary.target_audience.desires)}"</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Core Fears</p>
                      <p className="text-[11px] leading-relaxed italic">"{renderValue(summary.target_audience.fears)}"</p>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border shadow-xl hover:shadow-2xl transition-all border-l-8 border-l-amber-500">
          <CardContent className="p-8 space-y-6">
             <div className="flex items-center gap-2 text-amber-500">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Market Logic</h3>
             </div>
             <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Prime Pain Points</p>
                   <p className="text-sm font-bold">{renderValue(summary.analysis.pain_points)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Positioning Statement</p>
                   <p className="text-xs font-medium leading-loose bg-secondary/50 p-3 rounded-xl border border-border italic">"{renderValue(summary.business_model.positioning)}"</p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">USP / Unique Mechanism</p>
                   <p className="text-xs font-black text-amber-600">{renderValue(summary.business_model.usp || summary.analysis.unique_mechanism)}</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-border shadow-xl hover:shadow-2xl transition-all border-l-8 border-l-pink-500 md:col-span-2">
          <CardContent className="p-8">
             <div className="flex items-center gap-2 text-pink-500 mb-8">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Winning Marketing Strategy</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Hooks & Angles</p>
                      <p className="text-xs font-bold leading-relaxed">{renderValue(summary.marketing_strategy.winning_angles)}</p>
                   </div>
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Emotional Triggers</p>
                      <p className="text-xs font-bold leading-relaxed">{renderValue(summary.marketing_strategy.triggers)}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-900 text-white rounded-2xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-400 mb-1">Offer Structure</p>
                      <p className="text-xs font-bold">{renderValue(summary.business_model.offer_structure)}</p>
                      <p className="text-[10px] font-black text-pink-500 mt-2">{renderValue(summary.business_model.pricing_strategy)}</p>
                   </div>
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Communication Tone</p>
                      <p className="text-xs font-bold">{renderValue(summary.marketing_strategy.tone)}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">Content Strategy</p>
                      <p className="text-xs font-bold leading-relaxed">{renderValue(summary.marketing_strategy.content_strategy)}</p>
                   </div>
                   <div className="p-4 border-2 border-dashed border-pink-500 bg-pink-500/5 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-[11px] font-black uppercase tracking-widest text-pink-600">Langkah Berikutnya</p>
                      <Button onClick={onNext} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-11 shadow-lg shadow-pink-500/30">
                         PROSES BRANDING <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* High-Contrast Conversion Banner for Beginners */}
      <div className="mt-12 bg-gradient-to-r from-pink-500 via-pink-600 to-indigo-600 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
        <div className="relative z-10 space-y-2 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
            <span>✨ STRATEGI SELESAI</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-heading font-black tracking-tight leading-tight">
            Ads Strategy Siap! Waktunya Membangun Identitas Brand Anda 🚀
          </h3>
          <p className="text-[11px] md:text-xs font-semibold text-white/80 leading-relaxed">
            Anda telah berhasil menyusun seluruh formula riset & strategi iklan yang matang! Untuk mulai melahirkan desain gambar & script video ads yang bernilai tinggi, mari buat <strong className="font-extrabold text-white underline decoration-wavy decoration-pink-300">Pondasi Identitas Brand (Branding Foundation)</strong> terlebih dahulu.
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-full md:w-auto">
          <Button 
            onClick={onNext} 
            className="w-full md:w-auto bg-white text-indigo-700 hover:bg-white/90 font-black uppercase tracking-[0.15em] text-[11px] rounded-2xl h-14 px-8 shadow-2xl transition-all hover:scale-105 active:scale-95 gap-2 flex items-center justify-center border-2 border-white cursor-pointer"
          >
            LANJUT KE PROSES BRANDING
            <ChevronRight className="w-4 h-4 text-indigo-700 animate-bounce" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center pt-8">
        <Button 
          variant="outline" 
          onClick={handleGenerateSummary}
          className="rounded-xl font-black uppercase tracking-widest text-[10px] h-12 px-8 gap-2 border-border"
        >
          <RefreshCcw className="w-4 h-4" /> Regenerate Strategy Summary
        </Button>
      </div>
        </>
      )}
    </div>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}
