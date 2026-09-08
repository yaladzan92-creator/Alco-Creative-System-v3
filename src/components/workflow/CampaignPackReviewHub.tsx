import React from "react";
import { 
  Sparkles, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy, 
  Download, 
  RefreshCcw, 
  ShieldCheck, 
  Target, 
  FileText, 
  Layers, 
  Image as ImageIcon, 
  Video, 
  Layout, 
  Sliders, 
  Check, 
  TrendingUp, 
  Flame, 
  ExternalLink,
  ChevronDown,
  Eye,
  ArrowRight,
  Share2,
  Printer,
  Sparkle,
  Compass,
  Hammer,
  Code2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn, safeCopyToClipboard, handleAIError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { generateAIContent, parseRequiredAIJSON } from "@/services/aiService";
import { buildMetaAdsCampaignPack, downloadMetaAdsCampaignPack } from "@/lib/metaAdsCampaignPack";
import { downloadEcosystemBlueprint, buildEcosystemBlueprint } from "@/lib/ecosystemBlueprint";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";

interface CampaignPackReviewHubProps {
  project: any;
  onSaveProject: (updatedData: any) => void;
  onSwitchTab?: (tab: "review" | "image" | "carousel" | "video" | "landing") => void;
}

export default function CampaignPackReviewHub({ 
  project, 
  onSaveProject,
  onSwitchTab 
}: CampaignPackReviewHubProps) {
  const [loadingSection, setLoadingSection] = React.useState<Record<string, boolean>>({});
  const [globalRegenLoading, setGlobalRegenLoading] = React.useState<boolean>(false);
  const [regenProgressText, setRegenProgressText] = React.useState<string>("");
  const [showDocModal, setShowDocModal] = React.useState<boolean>(false);
  const [showRawDataModal, setShowRawDataModal] = React.useState<boolean>(false);
  const [showAdvancedExport, setShowAdvancedExport] = React.useState<boolean>(false);
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  // Build current campaign pack object
  const campaignPack = React.useMemo(() => {
    return buildMetaAdsCampaignPack(project);
  }, [project]);

  // Compute Campaign Readiness Score & Status
  const readinessAnalysis = React.useMemo(() => {
    let score = 0;
    const items: Array<{ label: string; ok: boolean; desc: string }> = [];

    // 1. Product & Niche
    const hasProduct = Boolean(
      project?.sharedBusinessContext?.brandName || 
      project?.name || 
      project?.nicheData?.output || 
      project?.nicheData?.input
    );
    if (hasProduct) score += 15;
    items.push({
      label: "Product Summary",
      ok: hasProduct,
      desc: hasProduct ? "Nama produk & ceruk pasar terdefinisi" : "Belum ada data produk dari Step 1"
    });

    // 2. Audience Snapshot
    const hasAudience = Boolean(
      project?.sharedBusinessContext?.targetAudience || 
      project?.audienceData?.output || 
      project?.painPointData?.output
    );
    if (hasAudience) score += 15;
    items.push({
      label: "Target Audience",
      ok: hasAudience,
      desc: hasAudience ? "Profil & pain point utama audiens siap" : "Riset audiens Step 2 & 3 belum lengkap"
    });

    // 3. Positioning & Offer
    const hasOffer = Boolean(
      project?.sharedBusinessContext?.uniqueSellingProposition || 
      project?.positioningData?.output || 
      project?.offerData?.output
    );
    if (hasOffer) score += 15;
    items.push({
      label: "Positioning & Offer",
      ok: hasOffer,
      desc: hasOffer ? "USP & penawaran utama terstruktur" : "Step 5 & 6 penawaran perlu diisi"
    });

    // 4. Marketing Angles
    const hasAngles = Boolean(
      (project?.adsGeneratedAngles && project.adsGeneratedAngles.length > 0) ||
      project?.marketingAngles?.output
    );
    if (hasAngles) score += 15;
    items.push({
      label: "Marketing Angles",
      ok: hasAngles,
      desc: hasAngles ? "Sudut pandang iklan A/B/C tersedia" : "Belum merender marketing angles"
    });

    // 5. Copywriting Pack
    const hasCopy = Boolean(
      project?.copyDirection?.output || 
      (project?.adsInputState?.headlines && project.adsInputState.headlines.length > 0) ||
      campaignPack.copy_assets.hooks.length > 0
    );
    if (hasCopy) score += 15;
    items.push({
      label: "Copywriting Pack",
      ok: hasCopy,
      desc: hasCopy ? "Headlines, Primary Text & CTA siap" : "Naskah iklan belum dibuat"
    });

    // 6. Creative Direction (Prompts/Video/Carousel)
    const hasCreatives = Boolean(
      campaignPack.image_ads.length > 0 &&
      campaignPack.image_ads[0]?.final_prompt
    );
    if (hasCreatives) score += 15;
    items.push({
      label: "Creative Direction",
      ok: hasCreatives,
      desc: hasCreatives ? "Prompt gambar, video script & carousel siap" : "Prompt visual belum dioptimasi"
    });

    // 7. Tracking & Policy Check
    const hasCompliance = Boolean(campaignPack.policy_flags.length > 0);
    if (hasCompliance) score += 10;
    items.push({
      label: "Meta Compliance",
      ok: hasCompliance,
      desc: "Pixel tracking & kebijakan Meta terverifikasi"
    });

    let status: "siap" | "hampir" | "belum" = "belum";
    let statusLabel = "Belum Lengkap ⚠️";
    let statusBadgeClass = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";

    if (score >= 80) {
      status = "siap";
      statusLabel = "SIAP DIJALANKAN 🚀 (Ready to Scale)";
      statusBadgeClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    } else if (score >= 50) {
      status = "hampir";
      statusLabel = "HAMPIR SIAP ⚡ (Nearly Ready)";
      statusBadgeClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }

    return { score, status, statusLabel, statusBadgeClass, items };
  }, [project, campaignPack]);

  const handleCopyText = (text: string, sectionName: string) => {
    safeCopyToClipboard(text);
    setCopiedSection(sectionName);
    toast.success(`Berhasil menyalin ${sectionName}!`);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const getCampaignContext = () => {
    const coreMemory = {
      projectName: project?.name || campaignPack.campaign_name,
      product: project?.initialProductData || project?.product || {},
      productStatus: project?.productStatus || project?.initialProductData?.status,
      brand: project?.brandFoundation?.output || project?.brandFoundation || {},
      niche: project?.sharedBusinessContext?.niche || project?.niche?.selected || project?.niche,
      audience: project?.audience?.output || project?.targetAudience || project?.sharedBusinessContext?.audience,
      painPoints: project?.painPoint?.output || project?.problemAnalysis?.output || project?.sharedBusinessContext?.painPoints,
      validation: project?.validation?.output || project?.marketValidation?.output,
      positioning: project?.positioning?.output || project?.brandPositioning?.output,
      offer: project?.offer?.output || project?.offerStack?.output || project?.sharedBusinessContext?.offer,
      angles: project?.marketingAngles?.output || project?.adsGeneratedAngles || campaignPack.image_ads,
      copywriting: project?.copyDirection?.output || campaignPack.copy_assets,
      selectedCharacter: project?.adsInputState?.ugcCharacterProfile || project?.adsInputState?.selectedCharacter || null,
      campaignPack: {
        campaignName: campaignPack.campaign_name,
        objective: campaignPack.campaign_objective,
        dailyBudget: campaignPack.dailyBudget,
        targeting: campaignPack.targeting,
        creativeStrategy: campaignPack.creative_strategy,
        copyAssets: campaignPack.copy_assets,
        policyFlags: campaignPack.policy_flags,
        assumptions: campaignPack.assumptions
      }
    };

    return `
KONTEKS CAMPAIGN MEMORY TERKUNCI:
${JSON.stringify(coreMemory, null, 2)}

ATURAN SINKRONISASI:
- Jangan mengganti produk, niche, persona, offer, CTA, atau angle utama kecuali data sumbernya memang kosong.
- Jika membuat aset baru, semua output wajib tetap konsisten dengan campaign memory di atas.
- Jika ada karakter/model/creator yang sudah dipilih, gunakan karakter yang sama untuk prompt gambar dan video.
- Jangan membuat klaim pendapatan, klaim hasil pasti, atau janji berlebihan yang rawan melanggar Meta Ads policy.
`.trim();
  };

  const getPreviousSectionOutput = (sectionKey: string) => {
    switch (sectionKey) {
      case "copywriting":
        return project?.copyDirection?.output || campaignPack.copy_assets;
      case "marketingAngles":
      case "imageConcepts":
        return project?.adsGeneratedAngles || campaignPack.image_ads;
      case "videoScripts":
        return project?.adsInputState?.generatedVideoDirections || campaignPack.video_ads;
      case "carouselDeck":
        return project?.adsInputState?.generatedCarousel || campaignPack.carousel_ads;
      case "landing":
        return project?.landingPageData?.output || campaignPack.landing_page;
      case "policyTracking":
        return project?.adsRecommendationsState || {
          tracking: campaignPack.tracking_checklist,
          policy: campaignPack.policy_flags
        };
      default:
        return campaignPack;
    }
  };

  const buildRegenerationContext = (sectionKey: string, sectionName: string, instruction: string) => {
    return buildRevisionPromptContext({
      revision: instruction,
      previousOutput: getPreviousSectionOutput(sectionKey),
      stepName: `Step 10 - ${sectionName}`,
      defaultContext: getCampaignContext()
    });
  };

  // --- REGENERATE LEVEL A (SINGLE SECTION) ---
  const handleRegenerateSingleSection = async (sectionKey: string, sectionName: string) => {
    setLoadingSection(prev => ({ ...prev, [sectionKey]: true }));
    try {
      const context = getCampaignContext();
      toast.info(`Merender ulang ${sectionName}...`);

      if (sectionKey === "copywriting") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Perbarui copywriting Meta Ads dalam Bahasa Indonesia. Pertahankan produk, persona, offer, angle utama, dan CTA dari campaign memory. Buat naskah lebih jelas, pendek, persuasif, dan ramah pemula.");
        const sys = `Return JSON strictly matching schema:
        {
          "hooks": ["hook 1", "hook 2", "hook 3"],
          "headlines": ["headline 1", "headline 2", "headline 3"],
          "primaryTexts": ["text 1", "text 2", "text 3"],
          "ctas": ["CTA 1", "CTA 2", "CTA 3"]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        onSaveProject({
          copyDirection: {
            ...(project.copyDirection || {}),
            output: {
              ...(project.copyDirection?.output || {}),
              hooks: parsed.hooks || campaignPack.copy_assets.hooks,
              headlines: parsed.headlines || campaignPack.copy_assets.headlines,
              adCopies: parsed.primaryTexts || campaignPack.copy_assets.primary_texts,
              ctas: parsed.ctas || campaignPack.copy_assets.ctas
            }
          }
        });
        toast.success(`Copywriting Pack berhasil diperbarui!`);
      } else if (sectionKey === "marketingAngles") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Perbarui 3 angle Meta Ads. Jangan mengganti produk, persona, offer, atau positioning utama. Setiap angle harus menjadi turunan langsung dari campaign memory dan siap dipakai untuk image, carousel, video, dan landing page.");
        const sys = `Return JSON with schema:
        {
          "angles": [
            {
              "id": "A",
              "name": "Sudut Pandang Emosional",
              "targetEmotion": "transisi emosional frustrasi ke kelegaan",
              "visualStrategy": "penjelasan strategi visual",
              "hookStrategy": "pola copy scroll stopping",
              "colorPsychology": "psikologi warna",
              "layoutStrategy": "tata letak elemen",
              "ctaRecommendation": "rekomendasi CTA",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis dalam Bahasa Indonesia..."
            },
            {
              "id": "B",
              "name": "Sudut Pandang Solusi Masalah",
              "targetEmotion": "kepercayaan penyelesaian masalah",
              "visualStrategy": "...",
              "hookStrategy": "...",
              "colorPsychology": "...",
              "layoutStrategy": "...",
              "ctaRecommendation": "...",
              "finalPrompt": "..."
            },
            {
              "id": "C",
              "name": "Sudut Pandang Gaya Hidup / Aspirasional",
              "targetEmotion": "upgrade status & impian",
              "visualStrategy": "...",
              "hookStrategy": "...",
              "colorPsychology": "...",
              "layoutStrategy": "...",
              "ctaRecommendation": "...",
              "finalPrompt": "..."
            }
          ]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        if (!parsed?.angles) throw new Error("Format Marketing Angles dari AI tidak lengkap.");
        onSaveProject({ adsGeneratedAngles: parsed.angles });
        toast.success(`Marketing Angles A/B/C diperbarui!`);
      } else if (sectionKey === "imageConcepts") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Perbarui prompt image ads fotorealistis. Semua prompt gambar wajib konsisten dengan produk, offer, persona, angle, tone brand, dan karakter/model jika ada. Jangan membuat konsep baru yang keluar dari campaign memory.");
        const sys = `Return JSON: {
          "angles": [
            {
              "id": "A",
              "name": "Sudut Pandang Emosional (Pembaruan)",
              "visualStrategy": "Visual studio fotorealistis dengan ekspresi lega pembeli",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis: Studio commercial photography..."
            },
            {
              "id": "B",
              "name": "Sudut Pandang Solusi Masalah (Pembaruan)",
              "visualStrategy": "Mockup 3D produk pada tablet dan laptop",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis: 3D High quality mockup..."
            }
          ]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        if (!parsed?.angles) throw new Error("Format Konsep Gambar dari AI tidak lengkap.");
        onSaveProject({ adsGeneratedAngles: parsed.angles });
        toast.success(`Konsep Gambar Iklan diperbarui!`);
      } else if (sectionKey === "videoScripts") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Perbarui video ads sebagai materi Meta Ads. Pertahankan campaign memory dan karakter/model jika ada. Jangan mengganti jenis kelamin/usia/penampilan karakter. Jika membuat struktur scene, gunakan pesan Hook, Solution, dan CTA yang konsisten dengan produk dan offer.");
        const sys = `Return JSON: {
          "videoDirections": [
            {
              "id": "A",
              "title": "Gaya UGC Organic Interrupt",
              "hookScript": "2 detik pertama yang menghentikan scroll jari",
              "visualPacing": "High energy jump cuts tiap 1.5s",
              "persona": "Kreator UGC santai & jujur",
              "fullScript": "0-3s: Hook... 3-10s: Agitate... 10-20s: Solution... 20-30s: CTA..."
            }
          ]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        if (!parsed?.videoDirections) throw new Error("Format Video Script dari AI tidak lengkap.");
        onSaveProject({
          adsInputState: {
            ...(project.adsInputState || {}),
            generatedVideoDirections: parsed.videoDirections
          }
        });
        toast.success(`Video Script Ads diperbarui!`);
      } else if (sectionKey === "carouselDeck") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Perbarui carousel Meta Ads 5 slide. Semua slide wajib mengikuti produk, persona, pain point, offer, angle utama, dan CTA dari campaign memory. Buat alur Hook, Pain, Solution, Offer, CTA yang mudah dipahami pemula.");
        const sys = `Return JSON: {
          "slides": [
            { "slideNumber": 1, "title": "Slide Hook", "visualNote": "Visual masalah utama" },
            { "slideNumber": 2, "title": "Slide Agitasi", "visualNote": "Alasan cara lama gagal" },
            { "slideNumber": 3, "title": "Slide Solusi", "visualNote": "Tampilan paket produk" },
            { "slideNumber": 4, "title": "Slide Offer", "visualNote": "Tumpukan bonus" },
            { "slideNumber": 5, "title": "Slide CTA", "visualNote": "Tombol aksi instan" }
          ]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        if (!parsed?.slides) throw new Error("Format Carousel dari AI tidak lengkap.");
        onSaveProject({
          adsInputState: {
            ...(project.adsInputState || {}),
            generatedCarousel: [{ id: "car_1", title: "Carousel Sequence", slides: parsed.slides }]
          }
        });
        toast.success(`Carousel Slide Deck diperbarui!`);
      } else if (sectionKey === "landing") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Perbarui blueprint landing page untuk traffic Meta Ads. Jangan mengganti produk, offer, persona, CTA, atau positioning. Fokus ke hero, subheadline, benefit, proof, dan CTA yang sesuai campaign memory.");
        const sys = `Return JSON: {
          "heroHeadline": "Headline penghenti scroll utama",
          "heroSubheadline": "Subheadline penjelas proposisi nilai",
          "primaryCta": "Dapatkan Akses Sekarang",
          "keyBenefits": ["Akses instan 24/7", "Bonus modul eksklusif", "Garansi kepuasan"]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        onSaveProject({
          landingPageData: {
            ...(project.landingPageData || {}),
            output: parsed
          }
        });
        toast.success(`Landing Page Blueprint diperbarui!`);
      } else if (sectionKey === "policyTracking") {
        const prompt = buildRegenerationContext(sectionKey, sectionName, "Audit tracking dan compliance Meta Ads berdasarkan campaign memory. Fokus ke Pixel/CAPI/Event/UTM dan flag klaim iklan berisiko. Jangan mengubah strategi kampanye.");
        const sys = `Return JSON: {
          "tracking_checklist": ["Pixel verify", "CAPI setup", "Event measurement"],
          "policy_flags": ["Avoid earning guarantee claims", "Include T&C link", "Use clean imagery"]
        }`;
        const res = await generateAIContent(prompt, sys);
        const parsed = parseRequiredAIJSON(res.text, sectionName);
        onSaveProject({
          adsRecommendationsState: {
            ...(project.adsRecommendationsState || {}),
            tracking: parsed.tracking_checklist,
            policy: parsed.policy_flags
          }
        });
        toast.success(`Tracking & Policy Flags diperbarui!`);
      } else {
        toast.success(`Data ${sectionName} disegarkan dari memori alur!`);
      }
    } catch (err: any) {
      handleAIError(err, `Gagal meregenerasi ${sectionName}`);
    } finally {
      setLoadingSection(prev => ({ ...prev, [sectionKey]: false }));
    }
  };

  // --- COPY HELPERS FOR THE 4 CORE BLOCKS ---
  const handleCopyImagePrompts = () => {
    const promptsText = campaignPack.image_ads
      .map((ad, idx) => `[Angle ${ad.id} - ${ad.angle_name} (${ad.aspect_ratio})]\n${ad.final_prompt || ad.visual_description}`)
      .join("\n\n");
    handleCopyText(promptsText, "Semua Prompt Gambar (Single Image)");
  };

  const handleCopyCarouselDeck = () => {
    const text = campaignPack.carousel_ads
      .map(car => `[${car.title}]\n` + car.slides.map(s => `Slide ${s.slide_number}: ${s.headline}\nVisual: ${s.visual_note}`).join("\n\n"))
      .join("\n\n");
    handleCopyText(text, "Slide Deck Carousel");
  };

  const handleCopyVideoScript = () => {
    const text = campaignPack.video_ads
      .map(vid => `[${vid.title}]\nPersona: ${vid.persona}\nPacing: ${vid.visual_pacing}\nHook Script (0-3s): ${vid.hook_script}\nFull Script:\n${vid.full_script || vid.hook_script}`)
      .join("\n\n");
    handleCopyText(text, "Video Script UGC");
  };

  const handleCopyLandingBlueprint = () => {
    const text = `[LANDING PAGE BLUEPRINT]
Hero Headline: ${campaignPack.copy_assets.headlines[0] || 'Akses Instan Produk Digital'}
CTA Button: ${campaignPack.copy_assets.ctas[0] || 'Dapatkan Sekarang'}
Value Proposition: ${campaignPack.creative_strategy.value_proposition}
Primary Angle: ${campaignPack.creative_strategy.primary_angle}
Visual Hook: ${campaignPack.creative_strategy.visual_hook}`;
    handleCopyText(text, "Landing Page Blueprint");
  };

  // --- REGENERATE LEVEL B (GROUP ACTIONS) ---
  const handleRegenerateGroup = async (groupType: "creatives" | "strategy") => {
    setGlobalRegenLoading(true);
    try {
      if (groupType === "creatives") {
        setRegenProgressText("Meregenerasi seluruh Creative Ads (Gambar + Video + Carousel)...");
        await handleRegenerateSingleSection("imageConcepts", "Konsep Gambar");
        await handleRegenerateSingleSection("videoScripts", "Video Script");
        await handleRegenerateSingleSection("carouselDeck", "Carousel Deck");
        toast.success("Seluruh Kelompok Creative Content berhasil diregenerasi!");
      } else {
        setRegenProgressText("Meregenerasi seluruh Strategi & Copywriting Pack...");
        await handleRegenerateSingleSection("marketingAngles", "Marketing Angles");
        await handleRegenerateSingleSection("copywriting", "Copywriting Pack");
        toast.success("Seluruh Kelompok Strategi & Naskah berhasil diregenerasi!");
      }
    } catch (err: any) {
      handleAIError(err, "Gagal meregenerasi kelompok ads");
    } finally {
      setGlobalRegenLoading(false);
      setRegenProgressText("");
    }
  };

  // --- REGENERATE LEVEL C (ENTIRE CAMPAIGN PACK) ---
  const handleRegenerateEntireCampaignPack = async () => {
    setGlobalRegenLoading(true);
    try {
      setRegenProgressText("Langkah 1/4: Menyusun ulang Marketing Angles & Positioning...");
      await handleRegenerateSingleSection("marketingAngles", "Marketing Angles");

      setRegenProgressText("Langkah 2/4: Memformulasikan ulang Copywriting Pack...");
      await handleRegenerateSingleSection("copywriting", "Copywriting Pack");

      setRegenProgressText("Langkah 3/4: Merender ulang seluruh Prompt Gambar, Video & Carousel...");
      await handleRegenerateSingleSection("imageConcepts", "Konsep Gambar");
      await handleRegenerateSingleSection("videoScripts", "Video Script");
      await handleRegenerateSingleSection("carouselDeck", "Carousel Deck");

      setRegenProgressText("Langkah 4/4: Melakukan Audit Meta Compliance & Tracking Checklist...");
      await handleRegenerateSingleSection("policyTracking", "Policy Flags");

      toast.success("🔥 SELURUH CAMPAIGN PACK META ADS BERHASIL DIREGENERASI PENGHUTANG PENUH!");
    } catch (err: any) {
      handleAIError(err, "Gagal menjalankan regenerasi penuh Campaign Pack");
    } finally {
      setGlobalRegenLoading(false);
      setRegenProgressText("");
    }
  };

  // Generate formatted markdown document for Release Documentation
  const generateReleaseDocMarkdown = () => {
    return `# 🚀 RELEASE PACK & CAMPAIGN SPECIFICATION
## ${campaignPack.campaign_name.toUpperCase()}

---

### 1. RINGKASAN PRODUK & EKONOMI IKLAN
- **Nama Produk**: ${project?.initialProductData?.productName || project?.name || campaignPack.campaign_name}
- **Ceruk Pasar (Niche)**: ${project?.sharedBusinessContext?.niche || "Digital Product"}
- **Harga Jual / Nilai**: ${project?.initialProductData?.price || campaignPack.targeting.interests[0] || "Penawaran Khusus"}
- **Target Budget Harian**: Rp ${campaignPack.dailyBudget.toLocaleString("id-ID")} / hari (CBO / Daily)
- **Objective Campaign**: ${campaignPack.campaign_objective} (Sales Conversion)

### 2. TARGET AUDIENS & DEMOGRAFI
- **Lokasi**: ${campaignPack.targeting.country}
- **Usia**: ${campaignPack.targeting.ageMin} - ${campaignPack.targeting.ageMax} tahun
- **Interests Kunci**: ${campaignPack.targeting.interests.join(", ")}
- **Perilaku (Behaviors)**: ${(campaignPack.targeting.behaviors || []).join(", ")}
- **Masalah Utama (Pain Point)**: ${campaignPack.creative_strategy.emotional_trigger}

### 3. POSITIONING & PENAWARAN UTAMA (USP)
- **Unique Selling Proposition**: ${campaignPack.creative_strategy.value_proposition}
- **Primary Marketing Angle**: ${campaignPack.creative_strategy.primary_angle}
- **Visual Hook Core**: ${campaignPack.creative_strategy.visual_hook}

### 4. NASKAH COPYWRITING PACK
#### A. Headlines (Scroll Stoppers)
${campaignPack.copy_assets.headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

#### B. Primary Texts / Ad Copies
${campaignPack.copy_assets.primary_texts.map((t, i) => `--- Variant ${i + 1} ---\n${t}`).join("\n\n")}

#### C. Call to Action (CTA)
${campaignPack.copy_assets.ctas.map((c, i) => `- ${c}`).join("\n")}

### 5. PROMPT DRAF ADS CREATIVE (FOTOREALISTIS)
${campaignPack.image_ads.map((img, i) => `
#### Image Ad Variant ${i + 1}: ${img.angle_name}
- **Format / Aspect Ratio**: ${img.aspect_ratio}
- **Visual Description**: ${img.visual_description}
- **Prompt Meta Ads**:
\`\`\`text
${img.final_prompt || img.visual_description}
\`\`\`
`).join("\n")}

### 6. DIRECTION VIDEO ADS (UGC & SCRIPT)
${campaignPack.video_ads.map((vid, i) => `
#### Video Script Variant ${i + 1}: ${vid.title}
- **Persona**: ${vid.persona}
- **Visual Pacing**: ${vid.visual_pacing}
- **Hook (0-3s)**: ${vid.hook_script}
- **Naskah Lengkap**: ${vid.full_script || vid.hook_script}
`).join("\n")}

### 7. CAROUSEL SLIDE DECK (5 SLIDES)
${campaignPack.carousel_ads.map((car) => `
#### Carousel: ${car.title}
${car.slides.map(s => `Slide ${s.slide_number}: **${s.headline}** — ${s.visual_note}`).join("\n")}
`).join("\n")}

### 8. META PIXEL & COMPLIANCE CHECKLIST
#### Tracking Setup:
${campaignPack.tracking_checklist.map(t => `- [x] ${t}`).join("\n")}

#### Policy Compliance Flags:
${campaignPack.policy_flags.map(p => `- [!] ${p}`).join("\n")}

---
*Generated with Google AI Studio Build - Meta Ads Campaign Pack System*
    `.trim();
  };

  const handleDownloadReleaseDoc = () => {
    const md = generateReleaseDocMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (project?.name || "meta_ads_release_pack").toLowerCase().replace(/\s+/g, "_");
    a.download = `${name}_release_documentation.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Dokumentasi Release Pack (.md) berhasil diunduh!");
  };

  const handleBackupProject = () => {
    try {
      const exportData = { ...project };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const safeName = (project?.name || "alco_project").toLowerCase().replace(/\s+/g, "_");
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `${safeName}_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Backup Project (.JSON) berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh backup project.");
    }
  };

  return (
    <div className="space-y-8 text-left pb-16">

      {/* 🚀 TOP HERO BANNER: CAMPAIGN LAUNCH CONTROL CONSOLE & READINESS METER */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-black text-[10px] uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PUSAT EKSEKUSI META ADS
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm",
                readinessAnalysis.statusBadgeClass
              )}>
                {readinessAnalysis.statusLabel}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight uppercase leading-tight">
              {campaignPack.campaign_name}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
              Selamat! Alur riset dan strategi campaign Anda telah matang. Halaman ini adalah **Launch Review Console** untuk meninjau naskah, prompt kreatif, dan menyalin data iklan sebelum dipasang ke Meta Ads Manager.
            </p>
          </div>

          {/* READINESS PROGRESS CIRCLE / METER */}
          <div className="p-5 rounded-3xl bg-slate-950/60 border border-slate-800 shrink-0 space-y-3 w-full lg:w-72 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">SKOR KESIAPAN IKLAN</span>
              <span className="text-xl font-black font-mono text-emerald-400">{readinessAnalysis.score}%</span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${readinessAnalysis.score}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-all",
                  readinessAnalysis.score >= 80 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                  readinessAnalysis.score >= 50 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                  "bg-gradient-to-r from-rose-500 to-red-400"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {readinessAnalysis.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[9.5px]">
                  {item.ok ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                  <span className={item.ok ? "text-slate-200 font-medium truncate" : "text-slate-500 truncate"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP LEVEL ACTION BAR: CLEAR HIERARCHY OF NEXT ACTIONS */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4 relative z-10">
          
          {/* 3 PRIMARY ACTION CARDS / BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* 1. TOMBOL UTAMA: LANJUT KE CONTENT ENGINE */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-indigo-900/40 border border-indigo-500/40 shadow-lg flex flex-col justify-between gap-3 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[10px] flex items-center justify-center">1</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Tahap Berikutnya</span>
                </div>
                <h4 className="text-sm font-heading font-black text-white">Lanjut ke Content Engine</h4>
                <p className="text-[11px] text-slate-300 font-sans leading-snug">
                  Buat kalender konten, caption, image prompt, carousel, dan video.
                </p>
              </div>
              <Button
                onClick={() => {
                  const success = downloadEcosystemBlueprint(project);
                  if (success) {
                    toast.success("Blueprint ALCO diunduh! Buka Content Engine dan import file ini.", {
                      description: "File alco_ecosystem_blueprint.json siap diunggah ke Content Engine."
                    });
                  }
                }}
                className="h-10 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-none flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                id="btn-goto-content-engine"
              >
                <Compass className="w-4 h-4 text-indigo-200" />
                <span>Lanjut ke Content Engine</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-200 ml-auto" />
              </Button>
            </div>

            {/* 2. TOMBOL KEDUA: LANJUT KE PRODUCT FORGE */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-purple-900/40 border border-purple-500/40 shadow-lg flex flex-col justify-between gap-3 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-black text-[10px] flex items-center justify-center">2</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Pengembangan Produk</span>
                </div>
                <h4 className="text-sm font-heading font-black text-white">Lanjut ke Product Forge</h4>
                <p className="text-[11px] text-slate-300 font-sans leading-snug">
                  Bangun produk, offer, modul, pricing, dan aset produk.
                </p>
              </div>
              <Button
                onClick={() => {
                  const success = downloadEcosystemBlueprint(project);
                  if (success) {
                    toast.success("Blueprint ALCO diunduh! Buka Product Forge dan import file ini.", {
                      description: "File alco_ecosystem_blueprint.json siap diunggah ke Product Forge."
                    });
                  }
                }}
                className="h-10 w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-none flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                id="btn-goto-product-forge"
              >
                <Hammer className="w-4 h-4 text-purple-200" />
                <span>Lanjut ke Product Forge</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-200 ml-auto" />
              </Button>
            </div>

            {/* 3. TOMBOL KETIGA: DOWNLOAD BLUEPRINT ALCO */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-emerald-900/40 border border-emerald-500/40 shadow-lg flex flex-col justify-between gap-3 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] flex items-center justify-center">3</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Blueprint Sentral</span>
                </div>
                <h4 className="text-sm font-heading font-black text-white">Download Blueprint ALCO</h4>
                <p className="text-[11px] text-slate-300 font-sans leading-snug">
                  Simpan satu file strategi utama untuk semua aplikasi ALCO.
                </p>
              </div>
              <Button
                onClick={() => {
                  const success = downloadEcosystemBlueprint(project);
                  if (success) {
                    toast.success("Blueprint ALCO (alco_ecosystem_blueprint.json) berhasil diunduh!");
                  }
                }}
                className="h-10 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md border-none flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                id="btn-download-blueprint-main"
              >
                <Download className="w-4 h-4 text-emerald-100" />
                <span>Download Blueprint ALCO</span>
              </Button>
            </div>

          </div>

          {/* SECONDARY ROW: ADVANCED EXPORT AREA & ACTIONS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            
            {/* AREA KECIL: ADVANCED EXPORT DROPDOWN */}
            <div className="relative">
              <Button
                onClick={() => setShowAdvancedExport(!showAdvancedExport)}
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-bold rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Advanced Export</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showAdvancedExport && "rotate-180")} />
              </Button>

              {showAdvancedExport && (
                <div className="absolute left-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 z-30 animate-in fade-in zoom-in-95 duration-150 text-left">
                  <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Opsi Export Khusus
                  </div>
                  
                  {/* 1. Backup Project */}
                  <button
                    type="button"
                    onClick={() => {
                      handleBackupProject();
                      setShowAdvancedExport(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="leading-tight font-heading">Backup Project</div>
                      <div className="text-[9.5px] text-slate-400 font-sans font-normal">Simpan salinan data lengkap (.JSON)</div>
                    </div>
                  </button>

                  {/* 2. Export Khusus Meta Ads */}
                  <button
                    type="button"
                    onClick={() => {
                      downloadMetaAdsCampaignPack(project);
                      toast.success("Export Khusus Meta Ads (.JSON) berhasil diunduh!");
                      setShowAdvancedExport(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <div className="leading-tight font-heading">Export Khusus Meta Ads</div>
                      <div className="text-[9.5px] text-slate-400 font-sans font-normal">Format Meta Ads Manager (.JSON)</div>
                    </div>
                  </button>

                  {/* 3. Raw Data */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRawDataModal(true);
                      setShowAdvancedExport(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="leading-tight font-heading">Raw Data</div>
                      <div className="text-[9.5px] text-slate-400 font-sans font-normal">Lihat & salin payload JSON mentah</div>
                    </div>
                  </button>

                  {/* 4. Export Dokumentasi */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadReleaseDoc();
                      setShowAdvancedExport(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800 mt-1 pt-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div>
                      <div className="leading-tight font-heading">Export Dokumentasi</div>
                      <div className="text-[9.5px] text-slate-400 font-sans font-normal">Dokumen Ringkasan (.MD)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* SECONDARY UTILITIES */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleRegenerateEntireCampaignPack}
                disabled={globalRegenLoading}
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-bold text-indigo-300 border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/60 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {globalRegenLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span>Regenerating All...</span>
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Regenerate Konten Iklan</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowDocModal(true)}
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Review Pack</span>
              </Button>
            </div>

          </div>
        </div>

        {/* Global Loading Status Banner */}
        {globalRegenLoading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3.5 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl flex items-center gap-3 text-xs text-indigo-200 font-sans font-medium"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
            <span>{regenProgressText || "Sedang meregenerasi seluruh konten AI Meta Ads..."}</span>
          </motion.div>
        )}
      </div>

      {/* --- RINGKASAN FINAL CAMPAIGN (CORE SUMMARY METRICS) --- */}
      <Card className="p-6 border border-border/80 rounded-3xl bg-card shadow-sm text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
              📊
            </div>
            <div>
              <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                📌 Ringkasan Final Campaign
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans">
                Ringkasan produk, estimasi budget Meta Ads, dan demografi target audiens
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 w-fit">
            ✓ Riset Step 1–8 Terintegrasi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 bg-secondary/30 rounded-2xl border border-border/40 space-y-1">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block font-mono">NAMA CAMPAIGN</span>
            <p className="text-xs font-bold text-foreground font-sans">{campaignPack.campaign_name}</p>
          </div>
          <div className="p-3.5 bg-secondary/30 rounded-2xl border border-border/40 space-y-1">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block font-mono">CERUK PASAR (NICHE)</span>
            <p className="text-xs font-bold text-foreground font-sans">{project?.sharedBusinessContext?.niche || "Digital Business"}</p>
          </div>
          <div className="p-3.5 bg-secondary/30 rounded-2xl border border-border/40 space-y-1">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block font-mono">BUDGET HARIAN DIREKOMENDASIKAN</span>
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-sans">
              Rp {campaignPack.dailyBudget.toLocaleString("id-ID")} / hari
            </p>
          </div>
          <div className="p-3.5 bg-secondary/30 rounded-2xl border border-border/40 space-y-1">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block font-mono">TARGET DEMOGRAFI</span>
            <p className="text-xs font-bold text-foreground font-sans">
              {campaignPack.targeting.country} • {campaignPack.targeting.ageMin}-{campaignPack.targeting.ageMax} Thn
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-1 text-left">
          <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block font-mono">💎 JANJI UTAMA PRODUK (CORE USP & VALUE PROPOSITION)</span>
          <p className="text-xs font-bold text-foreground leading-relaxed font-sans">
            {campaignPack.creative_strategy.value_proposition}
          </p>
        </div>
      </Card>

      {/* --- ORIENTATION CALLOUT: TAHAP REVIEW & REVISI STEP 10 --- */}
      <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
            <h3 className="text-xs font-heading font-black uppercase text-foreground tracking-wide">
              ⚡ 4 Aset Utama Hasil Final Kampanye
            </h3>
          </div>
          <p className="text-[11.5px] text-muted-foreground font-sans leading-relaxed">
            Seluruh materi iklan terbagi ke 4 hub aset di bawah. Untuk tiap aset, Anda dapat **Lihat Detail Studio**, **Regenerate**, atau **Copy** materi secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Status: Siap di-Export</span>
        </div>
      </div>

      {/* --- THE 4 MAIN CREATIVE BLOCKS (CORE RESULTS) --- */}
      <div className="space-y-8">

        {/* ========================================== */}
        {/* BLOCK 1: IMAGE ADS PORTAL CARD */}
        {/* ========================================== */}
        <Card className="p-6 border-2 border-indigo-500/30 dark:border-indigo-500/20 rounded-3xl bg-card shadow-md space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-500/20">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-black uppercase text-foreground tracking-tight">
                    1. Image Ads Studio (Single Image Prompts)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                    {campaignPack.image_ads.length} Variant Prompt Siap
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Visual fotorealistis & prompt Meta Ads berdaya scroll-stopping untuk single image ads.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={() => handleRegenerateSingleSection("imageConcepts", "Image Ads")}
                disabled={loadingSection.imageConcepts}
                size="sm"
                variant="outline"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 dark:border-indigo-800 bg-indigo-50/20 cursor-pointer flex items-center gap-1.5"
              >
                {loadingSection.imageConcepts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                <span>Regen</span>
              </Button>

              <Button
                onClick={handleCopyImagePrompts}
                size="sm"
                variant="secondary"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                <span>Copy</span>
              </Button>
            </div>
          </div>

          {/* Quick Snapshot Preview */}
          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/15 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
                ANGLES & RASIO DIVERSIFIKASI
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-mono">
                Rasio: 1:1 (Feed) & 9:16 (Stories/Reels)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {campaignPack.image_ads.map((ad, idx) => (
                <div key={idx} className="p-2.5 bg-card/80 rounded-xl border border-border/40 space-y-1">
                  <span className="text-[9.5px] font-black text-indigo-600 dark:text-indigo-400 uppercase font-mono block truncate">
                    ANGLE {ad.id}: {ad.angle_name}
                  </span>
                  <p className="text-[11px] text-muted-foreground font-sans line-clamp-2">
                    {ad.visual_description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Subpage Entry Button */}
          {onSwitchTab && (
            <div className="pt-1 flex justify-end">
              <Button
                onClick={() => onSwitchTab("image")}
                className="w-full sm:w-auto h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-indigo-200" />
                <span>🚀 Masuk Studio Halaman Image Ads →</span>
              </Button>
            </div>
          )}
        </Card>

        {/* ========================================== */}
        {/* BLOCK 2: CAROUSEL ADS PORTAL CARD */}
        {/* ========================================== */}
        <Card className="p-6 border-2 border-purple-500/30 dark:border-purple-500/20 rounded-3xl bg-card shadow-md space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-500/20">
                <Layers className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-black uppercase text-foreground tracking-tight">
                    2. Carousel Ads Studio (5-Slide Deck Sequence)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                    Urutan 5 Slide Siap
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Alur visual slide berantai dari hook masalah hingga tombol penawaran akhir.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={() => handleRegenerateSingleSection("carouselDeck", "Carousel Ads")}
                disabled={loadingSection.carouselDeck}
                size="sm"
                variant="outline"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider text-purple-600 border-purple-200 dark:border-purple-800 bg-purple-50/20 cursor-pointer flex items-center gap-1.5"
              >
                {loadingSection.carouselDeck ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                <span>Regen</span>
              </Button>

              <Button
                onClick={handleCopyCarouselDeck}
                size="sm"
                variant="secondary"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-purple-500" />
                <span>Copy</span>
              </Button>
            </div>
          </div>

          {/* Quick Snapshot Preview */}
          <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/15 space-y-3">
            <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 font-mono tracking-wider block">
              ALUR SLIDE SEQUENCING (5 CAROUSEL CARDS)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {campaignPack.carousel_ads[0]?.slides?.map((slide, sIdx) => (
                <div key={sIdx} className="p-2.5 bg-card/80 rounded-xl border border-border/40 space-y-1">
                  <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 font-mono block">
                    SLIDE #{slide.slide_number}
                  </span>
                  <p className="text-[10.5px] font-bold text-foreground font-sans line-clamp-2">
                    {slide.headline}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Subpage Entry Button */}
          {onSwitchTab && (
            <div className="pt-1 flex justify-end">
              <Button
                onClick={() => onSwitchTab("carousel")}
                className="w-full sm:w-auto h-10 px-5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-purple-200" />
                <span>🚀 Masuk Studio Halaman Carousel Ads →</span>
              </Button>
            </div>
          )}
        </Card>

        {/* ========================================== */}
        {/* BLOCK 3: VIDEO ADS PORTAL CARD */}
        {/* ========================================== */}
        <Card className="p-6 border-2 border-rose-500/30 dark:border-rose-500/20 rounded-3xl bg-card shadow-md space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-500/20">
                <Video className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-black uppercase text-foreground tracking-tight">
                    3. Video Ads Studio (UGC Script & Directions)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                    Script UGC 30 Detik Ready
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Naskah narasi video organik, hook 0-3 detik, dan pengarah persona kreator.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={() => handleRegenerateSingleSection("videoScripts", "Video Ads")}
                disabled={loadingSection.videoScripts}
                size="sm"
                variant="outline"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider text-rose-600 border-rose-200 dark:border-rose-800 bg-rose-50/20 cursor-pointer flex items-center gap-1.5"
              >
                {loadingSection.videoScripts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                <span>Regen</span>
              </Button>

              <Button
                onClick={handleCopyVideoScript}
                size="sm"
                variant="secondary"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-rose-500" />
                <span>Copy</span>
              </Button>
            </div>
          </div>

          {/* Quick Snapshot Preview */}
          <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/15 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 font-mono tracking-wider">
                CREATOR PERSONA & HOOK 0-3s
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-300 font-mono">
                Format: Reel / TikTok UGC
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-card/80 rounded-xl border border-border/40 space-y-1">
                <span className="text-[9px] font-black uppercase text-muted-foreground font-mono">PERSONA KREATOR</span>
                <p className="text-xs font-bold text-foreground font-sans">
                  {campaignPack.video_ads[0]?.persona || "Kreator Edukasi Digital"}
                </p>
              </div>
              <div className="p-3 bg-card/80 rounded-xl border border-border/40 space-y-1">
                <span className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 font-mono">HOOK VERBAL (0-3s)</span>
                <p className="text-xs font-bold text-foreground font-sans line-clamp-2">
                  "{campaignPack.video_ads[0]?.hook_script || "Stop scroll sebentar kalau kamu lagi bisnis!"}"
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Subpage Entry Button */}
          {onSwitchTab && (
            <div className="pt-1 flex justify-end">
              <Button
                onClick={() => onSwitchTab("video")}
                className="w-full sm:w-auto h-10 px-5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-rose-200" />
                <span>🚀 Masuk Studio Halaman Video Script →</span>
              </Button>
            </div>
          )}
        </Card>

        {/* ========================================== */}
        {/* BLOCK 4: LANDING PAGE PORTAL CARD */}
        {/* ========================================== */}
        <Card className="p-6 border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl bg-card shadow-md space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/20">
                <Layout className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-black uppercase text-foreground tracking-tight">
                    4. Landing Page Direction (Sales Blueprint)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                    Penampung Trafik Ready
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Struktur halaman penampung trafik Meta Ads dari Hero Section hingga Call to Action.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={() => handleRegenerateSingleSection("landing", "Landing Page Direction")}
                disabled={loadingSection.landing}
                size="sm"
                variant="outline"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 cursor-pointer flex items-center gap-1.5"
              >
                {loadingSection.landing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                <span>Regen</span>
              </Button>

              <Button
                onClick={handleCopyLandingBlueprint}
                size="sm"
                variant="secondary"
                className="h-9 px-3 text-xs font-bold uppercase tracking-wider bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copy</span>
              </Button>
            </div>
          </div>

          {/* Quick Snapshot Preview */}
          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/15 space-y-3">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono tracking-wider block">
              BLUEPRINT HERO SECTION & CTA
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-card/80 rounded-xl border border-border/40 space-y-1">
                <span className="text-[9px] font-black uppercase text-muted-foreground font-mono">HERO HEADLINE</span>
                <p className="text-xs font-bold text-foreground font-sans">
                  "{campaignPack.copy_assets.headlines[0] || 'Akses Instan Produk Digital'}"
                </p>
              </div>
              <div className="p-3 bg-card/80 rounded-xl border border-border/40 space-y-1">
                <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono">CTA BUTTON TEXT</span>
                <p className="text-xs font-bold text-foreground font-sans">
                  "{campaignPack.copy_assets.ctas[0] || 'Dapatkan Sekarang'}"
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Subpage Entry Button */}
          {onSwitchTab && (
            <div className="pt-1 flex justify-end">
              <Button
                onClick={() => onSwitchTab("landing")}
                className="w-full sm:w-auto h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-emerald-200" />
                <span>🚀 Masuk Builder Halaman Landing Page →</span>
              </Button>
            </div>
          )}
        </Card>

      </div>

      {/* --- SUPPORTING STRATEGY & COMPLIANCE SECTIONS --- */}
      <div className="space-y-6 pt-4 border-t border-border/40">
        <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight text-left">
          📋 Strategi Kampanye & Dokumen Pendukung
        </h3>

        {/* SECTION 5: COPYWRITING PACK */}
        <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                ✍️
              </div>
              <div>
                <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                  Copywriting Pack (Headlines, Primary Text, CTAs)
                </h3>
                <p className="text-[11px] text-muted-foreground font-sans">Naskah penghenti scroll & teks iklan berkonversi tinggi</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleCopyText(campaignPack.copy_assets.primary_texts.join("\n\n"), "Semua Copy Text")}
                size="sm"
                variant="ghost"
                className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy All
              </Button>

              <Button
                onClick={() => handleRegenerateSingleSection("copywriting", "Copywriting Pack")}
                disabled={loadingSection.copywriting}
                size="sm"
                variant="outline"
                className="h-8 text-[10px] font-bold uppercase tracking-wider text-rose-600 border-rose-200 bg-rose-50/20"
              >
                {loadingSection.copywriting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCcw className="w-3.5 h-3.5 mr-1" />}
                Regen Copywriting
              </Button>
            </div>
          </div>

          <div className="space-y-4 text-left">
            {/* Headlines */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider block font-mono">📌 HEADLINES</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {campaignPack.copy_assets.headlines.map((hl, i) => (
                  <div key={i} className="p-3 bg-secondary/30 rounded-xl border border-border/40 text-xs font-bold text-foreground flex items-center justify-between gap-2">
                    <span className="truncate">{hl}</span>
                    <Button onClick={() => handleCopyText(hl, `Headline ${i + 1}`)} size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Primary Texts */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block font-mono">📄 PRIMARY TEXT / AD COPIES</span>
              <div className="space-y-3">
                {campaignPack.copy_assets.primary_texts.map((pt, i) => (
                  <div key={i} className="p-4 bg-secondary/20 rounded-2xl border border-border/40 space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-muted-foreground font-mono">PRIMARY TEXT #{i + 1}</span>
                      <Button onClick={() => handleCopyText(pt, `Primary Text ${i + 1}`)} size="sm" variant="outline" className="h-7 text-[9px] font-bold uppercase tracking-wider">
                        <Copy className="w-3 h-3 mr-1" /> Copy Text
                      </Button>
                    </div>
                    <p className="text-xs text-foreground font-sans leading-relaxed whitespace-pre-line font-medium">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 9 & 10: TRACKING CHECKLIST & POLICY FLAGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SECTION 9: META PIXEL & CAPI TRACKING */}
          <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  9
                </div>
                <h3 className="text-xs font-heading font-black uppercase text-foreground">📊 Tracking & Pixel Checklist</h3>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="space-y-2">
              {campaignPack.tracking_checklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/15 text-xs text-foreground font-sans font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 10: POLICY FLAGS & META COMPLIANCE */}
          <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                  10
                </div>
                <h3 className="text-xs font-heading font-black uppercase text-foreground">🛡️ Meta Policy Flags & Safety</h3>
              </div>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-2">
              {campaignPack.policy_flags.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/15 text-xs text-foreground font-sans font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* SECTION 11: IMPLEMENTATION & LAUNCH PRE-FLIGHT CHECKLIST */}
        <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                11
              </div>
              <div>
                <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                  📋 Implementation Checklist (5-Min Meta Ads Launch)
                </h3>
                <p className="text-[11px] text-muted-foreground font-sans">Langkah demi langkah mengeksekusi iklan di Ads Manager</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  const success = downloadEcosystemBlueprint(project);
                  if (success) {
                    toast.success("Blueprint ALCO (alco_ecosystem_blueprint.json) berhasil diunduh!");
                  }
                }}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download Blueprint ALCO
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {campaignPack.implementation_checklist.map((step, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 rounded-xl border border-border/40 text-xs font-bold text-foreground font-sans flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-mono text-[11px] shrink-0 font-bold">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* --- MODAL / DRAWER FOR RELEASE PACK DOCUMENTATION PREVIEW --- */}
      <AnimatePresence>
        {showDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                    📄 Release Documentation Pack - {campaignPack.campaign_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDownloadReleaseDoc}
                    size="sm"
                    className="h-8 text-[10px] font-bold uppercase bg-primary text-primary-foreground rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Download (.md)
                  </Button>
                  <Button
                    onClick={() => handleCopyText(generateReleaseDocMarkdown(), "Dokumentasi Release Pack")}
                    size="sm"
                    variant="outline"
                    className="h-8 text-[10px] font-bold uppercase rounded-xl"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Markdown
                  </Button>
                  <Button
                    onClick={() => setShowDocModal(false)}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-[10px] font-bold uppercase rounded-xl"
                  >
                    Tutup
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-200 leading-relaxed whitespace-pre-wrap flex-1 select-text">
                {generateReleaseDocMarkdown()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL FOR RAW DATA PAYLOAD PREVIEW --- */}
      <AnimatePresence>
        {showRawDataModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                      Raw JSON Data Payload
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">Snapshot data proyek lengkap dari alur Alco Creative System</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      const json = JSON.stringify(project, null, 2);
                      safeCopyToClipboard(json);
                      toast.success("Raw JSON berhasil disalin ke clipboard!");
                    }}
                    size="sm"
                    className="h-8 text-[10px] font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy JSON
                  </Button>
                  <Button
                    onClick={() => setShowRawDataModal(false)}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-[10px] font-bold uppercase rounded-xl"
                  >
                    Tutup
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto font-mono text-xs bg-slate-950 text-emerald-400/90 leading-relaxed whitespace-pre-wrap flex-1 select-text">
                {JSON.stringify(project, null, 2)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
