import React from "react";
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  RefreshCcw,
  Download,
  Info,
  Sliders,
  Flame,
  ShieldCheck,
  Target,
  Palette,
  Check,
  FileText,
  HelpCircle,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Layers,
  Play,
  Film,
  Layout,
  User,
  UserCheck,
  UserPlus,
  BookmarkPlus,
  Clapperboard,
  Plus,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateAIContent, safeParseJSON } from "@/services/aiService";
import { toast } from "sonner";
import { cn, safeCopyToClipboard, handleAIError } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import UGCCharacterFlow from "./UGCCharacterFlow";
import LandingBuilder from "./LandingBuilder";
import CampaignPackReviewHub from "./CampaignPackReviewHub";
import { downloadMetaAdsCampaignPack } from "@/lib/metaAdsCampaignPack";
import { downloadEcosystemBlueprint } from "@/lib/ecosystemBlueprint";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";

interface AdsContentStepProps {
  project: any;
  onSaveProject: (data: any) => void;
}

const toScalarString = (val: any, defaultVal = ""): string => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (val.recommendedValue !== undefined) return toScalarString(val.recommendedValue, defaultVal);
    if (val.value !== undefined) return toScalarString(val.value, defaultVal);
    if (val.title !== undefined) return toScalarString(val.title, defaultVal);
    if (val.name !== undefined) return toScalarString(val.name, defaultVal);
    if (Array.isArray(val) && val.length > 0) return toScalarString(val[0], defaultVal);
  }
  return defaultVal;
};

const toScalarNumber = (val: any, defaultVal = 5): number => {
  const s = toScalarString(val, "");
  const num = parseInt(s, 10);
  return isNaN(num) ? defaultVal : num;
};

const PLATFORM_OPTIONS = [
  "Facebook Feed",
  "Instagram Feed",
  "Instagram Story",
  "TikTok",
  "Shopee Ads",
  "Landing Page Hero",
  "WhatsApp Ads"
];

const FORMAT_OPTIONS = [
  "1:1",
  "4:5",
  "9:16",
  "16:9"
];

const EMOTIONAL_FLOW_OPTIONS = [
  "Frustration -> Relief",
  "Fear -> Hope",
  "Stress -> Solution",
  "Insecure -> Confidence",
  "Problem -> Transformation",
  "Desire -> Achievement",
  "Custom"
];

const VISUAL_HOOK_OPTIONS = [
  "Before After",
  "Emotional Face",
  "Problem Visualization",
  "Dream Outcome",
  "Lifestyle",
  "Transformation",
  "Product Focus",
  "Social Proof"
];

const STYLE_OPTIONS = [
  "Hyper Realistic",
  "UGC Style",
  "Cinematic",
  "Premium",
  "Luxury",
  "Emotional",
  "Dramatic",
  "Minimalist",
  "Viral Social Media Style",
  "Corporate Clean",
  "Soft Natural Lighting"
];

const TEXT_DENSITY_OPTIONS = [
  "No Text",
  "Minimal Text",
  "Medium Text",
  "Strong Sales Text"
];

const CTA_STYLE_OPTIONS = [
  "Soft CTA",
  "Hard CTA",
  "Urgency CTA",
  "Friendly CTA",
  "Premium CTA"
];

export default function AdsContentStep({ project, onSaveProject }: AdsContentStepProps) {
  // Active layout format: "review" | "image" | "carousel" | "video" | "landing"
  const [activeFormat, setActiveFormat] = React.useState<"review" | "image" | "carousel" | "video" | "landing">("review");

  // --- CAROUSEL CUSTOM STATES ---
  const [carouselSlidesCount, setCarouselSlidesCount] = React.useState<number>(5);
  const [carouselMainGoal, setCarouselMainGoal] = React.useState<string>("Deep Pain Agitation to Irresistible Core Offer Stack");
  const [carouselRecommendations, setCarouselRecommendations] = React.useState<Record<string, { recommendedValue: any; explanation: string }>>({
    carouselSlidesCount: { 
      recommendedValue: 5, 
      explanation: "5 slide berurutan ideal: Slide 1 (Hook), Slide 2 (Agitate), Slide 3 (Solution), Slide 4 (Offer Pack), Slide 5 (CTA) menghasilkan tingkat penelusuran (completion rate) tertinggi."
    },
    carouselMainGoal: { 
      recommendedValue: "Deep Pain Agitation to Irresistible Core Offer Stack", 
      explanation: "Menghubungkan langsung rasa frustrasi mendasar audiens dengan tumpuan bonus eksklusif yang Anda berikan." 
    }
  });
  const [generatedCarousel, setGeneratedCarousel] = React.useState<any[]>([]);
  const [carouselLoading, setCarouselLoading] = React.useState<boolean>(false);
  const [selectedCarouselOption, setSelectedCarouselOption] = React.useState<string>("A");

  // --- VIDEO CUSTOM STATES ---
  const [videoHookType, setVideoHookType] = React.useState<string>("Visual Pattern Intervener & Bold Callout");
  const [videoPersona, setVideoPersona] = React.useState<string>("UGC Authentic Creator (Casual/Spontaneous Vibe)");
  const [videoPacing, setVideoPacing] = React.useState<string>("High-Energy 1.5s Jump Cuts with Pop-up Overlays");
  const [videoMusicVibe, setVideoMusicVibe] = React.useState<string>("Modern Lofi-Trap or High-Converting Energetic Beat");
  const [videoResolution, setVideoResolution] = React.useState<string>("9:16 portrait format (Sempurna untuk TikTok/Reels/Shorts)");
  const [videoAdditionalReq, setVideoAdditionalReq] = React.useState<string>("");

  const [videoRecommendations, setVideoRecommendations] = React.useState<Record<string, { recommendedValue: any; explanation: string }>>({
    videoHookType: {
      recommendedValue: "Visual Pattern Interrupt - Membuka dengan pameran kekecewaan mendalam yang kontras.",
      explanation: "Mematikan gerakan jempol dalam 2 detik pertama dengan membenturkan kegagalan metode umum vs janji instan platform Anda."
    },
    videoPersona: {
      recommendedValue: "UGC Authentic Creator (Santer & Natural tanpa nuansa jualan kaku)",
      explanation: "Audiens modern sangat alergi terhadap iklan korporat. Menggunakan gaya UGC organik meningkatkan retensi hingga 74%."
    },
    videoPacing: {
      recommendedValue: "High-Energy 1.5s Jump Cuts with Pop-up Overlays & Dynamic Sound FX",
      explanation: "Setiap transisi kecil dilengkapi teks popup warna senada merangsang dopamin visual untuk meminimalisir penolakan video beralih."
    },
    videoMusicVibe: {
      recommendedValue: "Modern Lofi-Trap - Beats berirama mantap dengan frekuensi vokal ditinggikan",
      explanation: "Ketukan bersemangat menjaga mood positif penonton tanpa tabrakan audio dengan artikulasi vokal narator penting."
    },
    videoResolution: {
      recommendedValue: "9:16 portrait format - Full Imersif Layar Seluler Vertikal",
      explanation: "Mendominasi 100% viewport ponsel pintar, memicu interaksi alami langsung seperti ketukan dan swipe-up."
    },
    videoAdditionalReq: {
      recommendedValue: "Tambahkan demonstrasi produk berkecepatan 2x di layar tablet pada pertengahan video untuk membuktikan kemudahan mekanismenya.",
      explanation: "Visualisasi nyata performa produk menghancurkan keraguan logis pembeli secara instan."
    }
  });
  const [generatedVideoDirections, setGeneratedVideoDirections] = React.useState<any[]>([]);
  const [videoDirectionsLoading, setVideoDirectionsLoading] = React.useState<boolean>(false);
  const [selectedVideoOption, setSelectedVideoOption] = React.useState<string>("A");
  const [completedChecks, setCompletedChecks] = React.useState<Record<string, boolean>>({});

  // --- VIDEO SUB-MODE & UGC CHARACTER FLOW STATES ---
  const [videoSubMode, setVideoSubMode] = React.useState<"quick" | "ugc">("ugc");
  const [ugcCharacterSource, setUgcCharacterSource] = React.useState<"ai" | "upload" | "library">("ai");
  const [ugcGender, setUgcGender] = React.useState<"female" | "male">("female");
  const [ugcAgeRange, setUgcAgeRange] = React.useState<"20-25" | "26-35" | "36-45" | "auto">("20-25");
  const [ugcTargetDemographic, setUgcTargetDemographic] = React.useState<string>("Wanita 20-30th (Kreator Beauty / Lifestyle)");
  const [ugcTopicFocus, setUgcTopicFocus] = React.useState<string>("");
  const [ugcModelImage, setUgcModelImage] = React.useState<string>("");
  const [ugcDigitalProductTitle, setUgcDigitalProductTitle] = React.useState<string>("");
  const [ugcProductCoverImage, setUgcProductCoverImage] = React.useState<string>("");
  const [selectedCharacterId, setSelectedCharacterId] = React.useState<string>("new");
  const [characterLibrary, setCharacterLibrary] = React.useState<any[]>([]);
  const [ugcOutput, setUgcOutput] = React.useState<any | null>(null);
  const [ugcLoading, setUgcLoading] = React.useState<boolean>(false);
  const [scene1Note, setScene1Note] = React.useState<string>("");
  const [scene2Note, setScene2Note] = React.useState<string>("");
  const [scene3Note, setScene3Note] = React.useState<string>("");
  const [aiNoteLoading, setAiNoteLoading] = React.useState<Record<string, boolean>>({});
  const [regenerateSceneLoading, setRegenerateSceneLoading] = React.useState<Record<string, boolean>>({});

  // State for the 9 core fields
  const [platform, setPlatform] = React.useState<string>("Instagram Feed");
  const [imageFormat, setImageFormat] = React.useState<string>("4:5");
  const [emotionalFlow, setEmotionalFlow] = React.useState<string>("Frustration -> Relief");
  const [customEmotionalFlow, setCustomEmotionalFlow] = React.useState<string>("");
  const [visualHookFocus, setVisualHookFocus] = React.useState<string>("Transformation");
  const [styleDirection, setStyleDirection] = React.useState<string[]>(["Hyper Realistic", "Premium", "Soft Natural Lighting"]);
  const [colorStrategy, setColorStrategy] = React.useState<string>("Main: Deep Cobalt Blue (#1D4ED8), Secondary: Warm White (#F8FAFC), Accent: Golden Orange (#F59E0B)");
  const [textDensity, setTextDensity] = React.useState<string>("Minimal Text");
  const [ctaStyle, setCtaStyle] = React.useState<string>("Urgency CTA");
  const [additionalRequest, setAdditionalRequest] = React.useState<string>("");

  // AI recommendations state for each of the 9 inputs
  const [recommendations, setRecommendations] = React.useState<Record<string, { recommendedValue: any; explanation: string }>>({
    platform: { 
      recommendedValue: "Instagram Feed", 
      explanation: "Berdasarkan target audiens, platform ini memiliki engagement visual terbaik untuk digital creative." 
    },
    imageFormat: { 
      recommendedValue: "4:5", 
      explanation: "Format potrait 4:5 memberikan screen-estate terbesar di Instagram Feed tanpa mengganggu navigasi." 
    },
    emotionalFlow: { 
      recommendedValue: "Frustration -> Relief", 
      explanation: "Pain point pelanggan sangat dalam, arah dari frustrasi ke kelegaan memicu emosi pembelian tercepat." 
    },
    visualHookFocus: { 
      recommendedValue: "Transformation", 
      explanation: "Pembuktian transformasi sebelum-sesudah instan menghentikan scroll jari audiens dalam 2 detik." 
    },
    styleDirection: { 
      recommendedValue: ["Hyper Realistic", "Premium", "Soft Natural Lighting"], 
      explanation: "Memberikan kesan produk mapan yang bersih secara korporasi namun tetap hangat dan realistis." 
    },
    colorStrategy: { 
      recommendedValue: "Main: Royal Blue (#1E3A8A), Secondary: White (#FFFFFF), Accent: Radiant Yellow (#FBBF24)", 
      explanation: "Paduan warna Royal Blue memicu kepercayaan, putih melambangkan kebersihan solusi, dan Accent kuning mengarahkan pandangan ke CTA utama." 
    },
    textDensity: { 
      recommendedValue: "Minimal Text", 
      explanation: "Berdasarkan pedoman CTR Meta Ads terkini, teks gambar di bawah 20% memiliki performa tayang organik 3.4x lebih tinggi." 
    },
    ctaStyle: { 
      recommendedValue: "Urgency CTA", 
      explanation: "Mendorong pendaftaran instan dikarenakan ketersediaan tawaran khusus waktu terbatas." 
    },
    additionalRequest: { 
      recommendedValue: "Tunjukkan model profesional yang mengekspresikan senyum lega di depan laptop cerah dengan pencahayaan studio lembut.", 
      explanation: "Melambangkan visualisasi pencapaian dan kebahagiaan sejati pengguna produk digital Anda secara nyata." 
    }
  });

  // Load saved states from project if exists
  const hasLoadedStateRef = React.useRef(false);

  React.useEffect(() => {
    if (project?.adsInputState) {
      const s = project.adsInputState;
      if (s.platform) setPlatform(toScalarString(s.platform, "Instagram Feed"));
      if (s.imageFormat) setImageFormat(toScalarString(s.imageFormat, "4:5"));
      if (s.emotionalFlow) setEmotionalFlow(toScalarString(s.emotionalFlow, "Frustration -> Relief"));
      if (s.customEmotionalFlow) setCustomEmotionalFlow(toScalarString(s.customEmotionalFlow, ""));
      if (s.visualHookFocus) setVisualHookFocus(toScalarString(s.visualHookFocus, "Transformation"));
      if (s.styleDirection) setStyleDirection(Array.isArray(s.styleDirection) ? s.styleDirection : [toScalarString(s.styleDirection, "")]);
      if (s.colorStrategy) setColorStrategy(toScalarString(s.colorStrategy, ""));
      if (s.textDensity) setTextDensity(toScalarString(s.textDensity, "Minimal Text"));
      if (s.ctaStyle) setCtaStyle(toScalarString(s.ctaStyle, "Urgency CTA"));
      if (s.additionalRequest) setAdditionalRequest(toScalarString(s.additionalRequest, ""));

      // Set active format on first load only so user is not bounced back on state saves
      if (!hasLoadedStateRef.current) {
        if (s.activeFormat) {
          setActiveFormat(s.activeFormat as any);
        } else {
          setActiveFormat("review");
        }
        hasLoadedStateRef.current = true;
      }

      // Load carousel
      if (s.carouselSlidesCount) setCarouselSlidesCount(toScalarNumber(s.carouselSlidesCount, 5));
      if (s.carouselMainGoal) setCarouselMainGoal(toScalarString(s.carouselMainGoal, ""));
      if (s.carouselRecommendations) setCarouselRecommendations(s.carouselRecommendations);
      if (s.generatedCarousel) setGeneratedCarousel(s.generatedCarousel);
      if (s.selectedCarouselOption) setSelectedCarouselOption(toScalarString(s.selectedCarouselOption, "A"));

      // Load video
      if (s.videoHookType) setVideoHookType(toScalarString(s.videoHookType, "Visual Pattern Intervener & Bold Callout"));
      if (s.videoPersona) setVideoPersona(toScalarString(s.videoPersona, "UGC Authentic Creator (Casual/Spontaneous Vibe)"));
      if (s.videoPacing) setVideoPacing(toScalarString(s.videoPacing, "High-Energy 1.5s Jump Cuts with Pop-up Overlays"));
      if (s.videoMusicVibe) setVideoMusicVibe(toScalarString(s.videoMusicVibe, "Modern Lofi-Trap or High-Converting Energetic Beat"));
      if (s.videoResolution) setVideoResolution(toScalarString(s.videoResolution, "9:16 portrait format (Sempurna untuk TikTok/Reels/Shorts)"));
      if (s.videoAdditionalReq) setVideoAdditionalReq(toScalarString(s.videoAdditionalReq, ""));
      if (s.videoRecommendations) setVideoRecommendations(s.videoRecommendations);
      if (s.generatedVideoDirections) setGeneratedVideoDirections(s.generatedVideoDirections);
      if (s.selectedVideoOption) setSelectedVideoOption(toScalarString(s.selectedVideoOption, "A"));

      // Load UGC Character Flow
      if (s.videoSubMode) setVideoSubMode(s.videoSubMode);
      if (s.ugcCharacterSource) setUgcCharacterSource(s.ugcCharacterSource);
      if (s.ugcGender) setUgcGender(s.ugcGender);
      if (s.ugcAgeRange) setUgcAgeRange(s.ugcAgeRange);
      if (s.ugcTargetDemographic) setUgcTargetDemographic(s.ugcTargetDemographic);
      if (s.ugcTopicFocus) setUgcTopicFocus(s.ugcTopicFocus);
      if (s.ugcModelImage) setUgcModelImage(s.ugcModelImage);
      if (s.ugcDigitalProductTitle) setUgcDigitalProductTitle(s.ugcDigitalProductTitle);
      if (s.ugcProductCoverImage) setUgcProductCoverImage(s.ugcProductCoverImage);
      if (s.selectedCharacterId) setSelectedCharacterId(s.selectedCharacterId);
      if (s.characterLibrary && Array.isArray(s.characterLibrary)) setCharacterLibrary(s.characterLibrary);
      if (s.ugcOutput) setUgcOutput(s.ugcOutput);
      if (s.scene1Note) setScene1Note(s.scene1Note);
      if (s.scene2Note) setScene2Note(s.scene2Note);
      if (s.scene3Note) setScene3Note(s.scene3Note);
    }

    if (project?.adsRecommendationsState) {
      setRecommendations(project.adsRecommendationsState);
    }
    if (project?.adsGeneratedAngles) {
      setGeneratedAngles(project.adsGeneratedAngles);
      setSelectedAngle(project.adsGeneratedAngles[0]?.id || "A");
    }
  }, [project]);

  // Load character library backup from localStorage
  React.useEffect(() => {
    try {
      const savedLib = localStorage.getItem("ugc_character_library");
      if (savedLib) {
        const parsed = JSON.parse(savedLib);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCharacterLibrary((prev) => (prev.length === 0 ? parsed : prev));
        }
      }
    } catch (e) {
      console.error("Failed to load local character library", e);
    }
  }, []);

  // Loading states for individual fields or global operations
  const [activeSubTab, setActiveSubTab] = React.useState<"form" | "output">("output");
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState<boolean>(false);
  const [loadingField, setLoadingField] = React.useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = React.useState<boolean>(false);
  const [anglesLoading, setAnglesLoading] = React.useState<boolean>(false);

  // New States for Token Saving, Collapsible strategy, and simulated loading thoughts
  const [generationScope, setGenerationScope] = React.useState<"single" | "all">("single");
  const [imageTargetAngle, setImageTargetAngle] = React.useState<"A" | "B" | "C">("A");
  const [videoTargetStyle, setVideoTargetStyle] = React.useState<"A" | "B" | "C">("A");
  const [isBaseStrategyCollapsed, setIsBaseStrategyCollapsed] = React.useState<boolean>(true);
  const [activeThoughtIdx, setActiveThoughtIdx] = React.useState<number>(0);

  const THOUGHT_STEPS = [
    "🧠 Menganalisis data pasar dan kebiasaan Niche produk Anda...",
    "🔍 Memetakan hasrat terdalam dan rintangan terbesar (Pain Point) audiens...",
    "🎯 Menyusun visual hook penangkap perhatian mata dalam 1.5 detik pertama (Scroll Stopping)...",
    "🎨 Menyusun kombinasi kode warna berdasarkan psikologi warna digital konversi...",
    "📐 Mendesain tata letak yang ramah format mobile feed dan minim gangguan visual...",
    "✍️ Memformulasikan naskah Headline, Subheadline, dan Badge promosi penarik klik...",
    "✨ Mengintegrasikan draf CTA persuasif dengan dorongan urgensi alami...",
    "🛡️ Memasang barisan Negative Prompt sebagai benteng kualitas visual gambar...",
    "🚀 Menyempurnaan rancangan kreatif draf instan komersial..."
  ];

  const isAnyLoading = anglesLoading || carouselLoading || videoDirectionsLoading || globalLoading;

  React.useEffect(() => {
    if (!isAnyLoading) {
      setActiveThoughtIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveThoughtIdx((prev) => (prev + 1) % THOUGHT_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isAnyLoading]);

  // A/B/C Angles state
  const [generatedAngles, setGeneratedAngles] = React.useState<any[]>([]);
  const [selectedAngle, setSelectedAngle] = React.useState<string>("A");

  // In-app visual render state
  const [renderingImage, setRenderingImage] = React.useState<Record<string, boolean>>({});
  const [renderedUrls, setRenderedUrls] = React.useState<Record<string, string>>({});

  const getStepValue = (stepData: any) => {
    if (!stepData) return "Belum ditentukan";
    if (typeof stepData === "string") return stepData;
    if (stepData.selectedOption) {
      if (typeof stepData.selectedOption === "string") return stepData.selectedOption;
      const opt = stepData.selectedOption;
      if (opt.main_offer) {
        const mo = typeof opt.main_offer === 'object' && opt.main_offer !== null ? (opt.main_offer.main_offer || JSON.stringify(opt.main_offer)) : opt.main_offer;
        return `${opt.type || "Offer"}: ${mo}`;
      }
      return opt.name || opt.angle || opt.title || JSON.stringify(opt);
    }
    if (stepData.optimized_text) return stepData.optimized_text;
    return JSON.stringify(stepData);
  };

  const getCampaignContext = () => {
    const nicheStr = getStepValue(project?.nicheData);
    const audienceStr = getStepValue(project?.audienceData);
    const painStr = getStepValue(project?.painPointData);
    const validationStr = getStepValue(project?.validationData);
    const positioningStr = getStepValue(project?.positioningData);
    const offerStr = getStepValue(project?.offerData);
    const angleStr = getStepValue(project?.marketingAngles);
    const copyStr = getStepValue(project?.copyDirection);
    
    return `
      === STRATEGI PROYEK AKTIF (STEP 1 - 8) ===
      Niche: ${nicheStr}
      Audience: ${audienceStr}
      Pain Point: ${painStr}
      Market Validation: ${validationStr}
      Positioning: ${positioningStr}
      Offer: ${offerStr}
      Marketing Angle: ${angleStr}
      Copy Direction: ${copyStr}
    `.trim();
  };

  // Perform AI optimization for a single field
  const handleAIOptimizeField = (fieldId: string) => {
    const rec = recommendations[fieldId];
    if (!rec) return;

    if (fieldId === "platform") setPlatform(rec.recommendedValue);
    else if (fieldId === "imageFormat") setImageFormat(rec.recommendedValue);
    else if (fieldId === "emotionalFlow") {
      setEmotionalFlow(rec.recommendedValue);
      if (rec.recommendedValue === "Custom") {
        setCustomEmotionalFlow(rec.explanation);
      }
    }
    else if (fieldId === "visualHookFocus") setVisualHookFocus(rec.recommendedValue);
    else if (fieldId === "styleDirection") setStyleDirection(rec.recommendedValue);
    else if (fieldId === "colorStrategy") setColorStrategy(rec.recommendedValue);
    else if (fieldId === "textDensity") setTextDensity(rec.recommendedValue);
    else if (fieldId === "ctaStyle") setCtaStyle(rec.recommendedValue);
    else if (fieldId === "additionalRequest") setAdditionalRequest(rec.recommendedValue);

    toast.success(`Optimasi AI diterapkan untuk ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
  };

  // Regenerate suggestion for a single field
  const handleRegenerateSuggestion = async (fieldId: string) => {
    setLoadingField(prev => ({ ...prev, [fieldId]: true }));
    try {
      const fieldLabels: Record<string, string> = {
        platform: "Platform Optimization (best platform and typical placement layout)",
        imageFormat: "Image Format Aspect Ratio",
        emotionalFlow: "Emotional Transition Flow",
        visualHookFocus: "Visual Hook Focus style",
        styleDirection: "Style Direction aesthetic guidelines",
        colorStrategy: "Color Strategy palette with psychology reasons",
        textDensity: "Text Overlay Density",
        ctaStyle: "Call to Action Style category",
        additionalRequest: "Additional Visual Element instructions"
      };

      const systemInstruction = `You are a Direct-Response Advertising Strategist and Visual Psychologist. Based on the provided target business context, recommend the absolute best choice for the ${fieldLabels[fieldId] || fieldId} field. Return a JSON object with this EXACT schema:
      {
        "recommendedValue": "recommended string value or string array matching selections if multi-select style",
        "explanation": "concise digital psychology and conversion potential reasoning in Indonesian language"
      }`;

      const context = getCampaignContext();
      const prompt = `Based on the following context, generate a recommended value and a detailed Indonesia-language conversion explanation for the field: ${fieldId}.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || parsed.recommendedValue === undefined) {
        throw new Error("Respon AI tidak valid atau tidak memiliki format rekomendasi yang benar.");
      }

      setRecommendations(prev => {
        const updated = {
          ...prev,
          [fieldId]: {
            recommendedValue: parsed.recommendedValue,
            explanation: parsed.explanation
          }
        };
        saveStateToProject({ adsRecommendationsState: updated });
        return updated;
      });

      toast.success(`Rekomendasi baru untuk ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()} berhasil dimuat!`);
    } catch (err: any) {
      handleAIError(err, `Gagal memuat rekomendasi field ${fieldId}`);
    } finally {
      setLoadingField(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Global Creative Optimizer: Optimizes all 9 fields at once
  const handleFullAIOptimization = async () => {
    setGlobalLoading(true);
    try {
      const systemInstruction = `You are a master CRO Ad Copywriter. Read the campaign context from Step 1-8. Evaluate and output a unified, highly optimized advertising creative strategy encompassing all 9 direction fields:
      1) platform (Facebook Feed, Instagram Feed, etc.)
      2) imageFormat (1:1, 4:5, 9:16, 16:9)
      3) emotionalFlow (transition path description)
      4) visualHookFocus (visual focus anchor)
      5) styleDirection (array of styles)
      6) colorStrategy (cohesive palette & details)
      7) textDensity (No Text, Minimal Text, etc.)
      8) ctaStyle (Premium CTA, Urgency CTA, etc.)
      9) additionalRequest (clarified custom prompt additions)

      Return a single JSON object where keys are the 9 field names. Each key absolute contains fields:
      - "recommendedValue": best string or array of strings
      - "explanation": conversion justification in structured Indonesian language.
      
      Ensure perfect psychological consensus among all 9 areas to create a scroll-stopping master direction.`;

      const context = getCampaignContext();
      const prompt = `Analyze current setup and generate the complete optimized layout parameters based on our target system inputs.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed) {
        throw new Error("Respon AI untuk optimasi global tidak valid.");
      }

      setRecommendations(parsed);
      
      // Auto apply all of them for ultimate premium user experience
      if (parsed.platform) setPlatform(parsed.platform.recommendedValue);
      if (parsed.imageFormat) setImageFormat(parsed.imageFormat.recommendedValue);
      if (parsed.emotionalFlow) {
        setEmotionalFlow(parsed.emotionalFlow.recommendedValue);
        if (parsed.emotionalFlow.recommendedValue === "Custom") {
          setCustomEmotionalFlow(parsed.emotionalFlow.explanation);
        }
      }
      if (parsed.visualHookFocus) setVisualHookFocus(parsed.visualHookFocus.recommendedValue);
      if (parsed.styleDirection) setStyleDirection(parsed.styleDirection.recommendedValue);
      if (parsed.colorStrategy) setColorStrategy(parsed.colorStrategy.recommendedValue);
      if (parsed.textDensity) setTextDensity(parsed.textDensity.recommendedValue);
      if (parsed.ctaStyle) setCtaStyle(parsed.ctaStyle.recommendedValue);
      if (parsed.additionalRequest) setAdditionalRequest(parsed.additionalRequest.recommendedValue);

      saveStateToProject({ 
        adsRecommendationsState: parsed,
        adsInputState: {
          platform: parsed.platform?.recommendedValue || platform,
          imageFormat: parsed.imageFormat?.recommendedValue || imageFormat,
          emotionalFlow: parsed.emotionalFlow?.recommendedValue || emotionalFlow,
          customEmotionalFlow: parsed.emotionalFlow?.recommendedValue === "Custom" ? parsed.emotionalFlow.explanation : customEmotionalFlow,
          visualHookFocus: parsed.visualHookFocus?.recommendedValue || visualHookFocus,
          styleDirection: parsed.styleDirection?.recommendedValue || styleDirection,
          colorStrategy: parsed.colorStrategy?.recommendedValue || colorStrategy,
          textDensity: parsed.textDensity?.recommendedValue || textDensity,
          ctaStyle: parsed.ctaStyle?.recommendedValue || ctaStyle,
          additionalRequest: parsed.additionalRequest?.recommendedValue || additionalRequest
        }
      });

      toast.success("Optimasi Global Berhasil! Seluruh model input telah selaras otomatis.");
    } catch (err: any) {
      handleAIError(err, "Gagal menjalankan optimasi global AI.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Step 2 & 3 & 4: Generate A/B/C Angle Prompts / Single Focused Angle
  const handleGenerateAngles = async (customRevision?: string) => {
    setAnglesLoading(true);
    try {
      const activeContext = getCampaignContext();
      const currentInputs = `
        === CREATIVE DIRECTION INPUTS ===
        Platform Optimization: ${platform}
        Image Format: ${imageFormat}
        Emotional Flow: ${emotionalFlow} ${emotionalFlow === "Custom" ? `(${customEmotionalFlow})` : ""}
        Visual Hook Focus: ${visualHookFocus}
        Style Direction: ${styleDirection.join(", ")}
        Color Strategy: ${colorStrategy}
        Text Density: ${textDensity}
        CTA Style: ${ctaStyle}
        Additional Visual Request: ${additionalRequest}
        Generation Scope: ${generationScope === "single" ? `Single Angle (${imageTargetAngle})` : "All 3 Angles (A, B, C)"}
      `.trim();

      const previousOutput = generatedAngles.length > 0 ? generatedAngles : project?.adsGeneratedAngles;
      const effectiveRevision = customRevision || additionalRequest;

      const fullPromptContext = buildRevisionPromptContext({
        revision: effectiveRevision,
        previousOutput,
        stepName: "Step 10: Image Ads Studio (Angles Prompts)",
        defaultContext: `
          === CAMPAIGN CONTEXT ===
          ${activeContext}

          ${currentInputs}
        `
      });

      let systemInstruction = "";
      if (generationScope === "single") {
        const optionName = imageTargetAngle === "A" 
          ? "Sudut Pandang Emosional" 
          : imageTargetAngle === "B" 
            ? "Sudut Pandang Solusi Masalah" 
            : "Sudut Pandang Gaya Hidup / Aspirasional";

        const optTarget = imageTargetAngle === "A"
          ? "fokus pada transformasi emosional, pengurangan rasa sakit/frustrasi, dan kelegaan psikologis instan"
          : imageTargetAngle === "B"
            ? "fokus ketat pada penyelesaian masalah utama pengguna dan penjelasan mekanisme fungsional produk"
            : "fokus pada hasil akhir, peningkatan status sosial, dan upgrade identitas digital";

        systemInstruction = `Anda adalah seorang ahli optimasi konversi dan prompt engineer pembuatan gambar kreatif iklan berbayar dan organik di Meta (Facebook & Instagram). Pastikan SELURUH analisis, rekomendasi, penjelasan, strategi, naskah tombol, teks, dan nilai prompt visual (seperti finalPrompt) ditulis 100% dalam Bahasa Indonesia secara mendalam, persuasif, dan berkonversi tinggi. 
        
        Hasilkan HANYA SATU opsi iklan sudut pandang tunggal yang sesuai dengan kriteria pengguna, yaitu:
        ID Opsi: "${imageTargetAngle}"
        Nama Opsi: "${optionName}"
        Fokus Opsi: ${optTarget}

        Kembalikan EXACTLY string JSON dengan skema berikut berisi tepat 1 objek di dalam list 'angles' dengan id '${imageTargetAngle}':
        {
          "angles": [
            {
              "id": "${imageTargetAngle}",
              "name": "${optionName}",
              "targetEmotion": "${imageTargetAngle === 'A' ? 'transisi detail dari frustrasi mendalam menjadi kelegaan instan' : imageTargetAngle === 'B' ? 'detail fungsional solusi menyelesaikan problem utama' : 'peningkatan status diri, kebanggaan, dan pencapaian impian'}",
              "visualStrategy": "Detail strategi visual dalam Bahasa Indonesia yang menjelaskan keselarasan gambar",
              "hookStrategy": "Deskripsi pola copy penghenti scroll langsung (scroll stopping) dalam Bahasa Indonesia",
              "colorPsychology": "Arti warna yang diterapkan berdasarkan pilihan pengguna dalam Bahasa Indonesia",
              "layoutStrategy": "Posisi letak elemen (headline di atas, subjek gambar di tengah, ruang kosong di bawah untuk CTA)",
              "ctaRecommendation": "Rekomendasi teks tombol CTA dan konteksnya dalam Bahasa Indonesia",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis:\\n\\nBuat gambar kreatif iklan Meta Ads yang fotorealistis.\\n\\nNiche/Audiens:\\n[Masukkan nama ceruk/niche dan target audiens di sini secara detail]\\n\\nMasalah Utama / Hook:\\n[Masukkan rumusan masalah utama / hook emosional dari sudut pandang terpilih di sini]\\n\\nPenawaran / Manfaat:\\n[Masukkan penawaran utama / solusi manfaat produk di sini]\\n\\nAdegan Visual:\\n[Deskripsikan adegan visual fotorealistis berkualitas studio komersial secara detail, dengan emosi jujur, tanpa hiasan digital artifikasi 3D buatan]\\n\\nSubjek Utama:\\n[Deskripsikan subjek utama, misalnya pria/wanita berumur X, ekspresi wajah, pose, baju dst]\\n\\nObjek Konversi:\\n[Sebutkan produk digital, fisik, mock-up atau visualisasi solusi yang ditonjolkan]\\n\\nLayout\\n\\nBagian Atas:\\n[Deskripsikan elemen atau ruang kosong untuk teks headline di visual]\\n\\nBagian Tengah:\\n[Deskripsikan penempatan subjek utama & produk agar fokus fokus langsung terlihat]\\n\\nBagian Bawah:\\n[Deskripsikan penempatan ruang kosong atau area CTA button]\\n\\nGaya Visual\\n\\nFotografi komersial premium, fotorealistis, fokus tajam pada subjek, latar belakang bokeh lembut.\\n\\nBukan kartun.\\n\\nPencahayaan\\n\\n[Deskripsikan pencahayaan komersial premium, e.g., soft cinematic, studio lighting, natural sunlight]\\n\\nWarna\\n\\n[Deskripsikan strategi warna yang selaras kontras tinggi sesuai psikologi warna pengguna]\\n\\nRasio\\n\\n4:5 vertikal untuk Instagram Feed dan Facebook Feed.\\n\\nElemen UI yang Mendukung Aksi\\n\\nTambahkan elemen antarmuka yang mendorong tindakan seperti:\\n\\n- Tombol CTA yang terlihat jelas\\n- Badge dengan teks\\n- Font yang mudah dibaca\\n\\nTeks yang Ditampilkan di Dalam Gambar (Opsional)\\n\\nHeadline:\\n[Teks headline singkat berkonversi tinggi]\\n\\nSubheadline:\\n[Teks subheadline singkat]\\n\\nBadge:\\n[Teks badge diskon atau penawaran pendukung]\\n\\nCTA:\\n[Teks tombol CTA, misal: Ambil Sekarang]\\n\\nNegative Prompt\\n\\n- No stock photo look\\n- No cartoon\\n- No illustration\\n- No distorted face\\n- No deformed hands\\n- No extra fingers\\n- No blurry text\\n- No watermark\\n- No logo placement errors\\n- No cluttered composition\\n- No low quality rendering\\n\\nHasil Akhir yang Diinginkan\\n\\n- Terlihat seperti iklan Meta Ads profesional\\n- Memiliki hook visual yang kuat\\n- Produk atau solusi terlihat jelas\\n- Komposisi bersih dan mudah dipahami dalam 1–3 detik\\n- Fokus visual jelas\\n- Mobile-friendly\\n- Siap digunakan untuk Instagram Feed dan Facebook Feed"
            }
          ]
        }`;
      } else {
        systemInstruction = `Anda adalah seorang ahli optimasi konversi dan prompt engineer pembuatan gambar kreatif iklan berbayar dan organik di Meta (Facebook & Instagram). Pastikan SELURUH analisis, rekomendasi, penjelasan, strategi, naskah tombol, teks, dan nilai prompt visual (seperti finalPrompt) ditulis 100% dalam Bahasa Indonesia secara mendalam, persuasif, dan berkonversi tinggi. Hasilkan TIGA opsi iklan (A, B, C) yang sesuai dengan kriteria pengguna.
        
        Opsi A adalah: Emotional Angle (fokus pada transformasi emosional, pengurangan rasa sakit/frustrasi, dan kelegaan psikologis instan)
        Opsi B adalah: Problem-Solution Angle (fokus ketat pada penyelesaian masalah utama pengguna dan penjelasan mekanisme fungsional produk)
        Opsi C adalah: Aspirational / Lifestyle Angle (fokus pada hasil akhir, peningkatan status sosial, dan upgrade identitas digital)

        Kembalikan EXACTLY string JSON dengan skema berikut:
        {
          "angles": [
            {
              "id": "A",
              "name": "Sudut Pandang Emosional",
              "targetEmotion": "detail transformasi dari rasa frustrasi menjadi kelegaan instan",
              "visualStrategy": "Detail strategi visual dalam Bahasa Indonesia yang menjelaskan keselarasan gambar",
              "hookStrategy": "Deskripsi pola copy penghenti scroll langsung (scroll stopping) dalam Bahasa Indonesia",
              "colorPsychology": "Arti warna yang diterapkan berdasarkan pilihan pengguna dalam Bahasa Indonesia",
              "layoutStrategy": "Posisi letak elemen (headline di atas, subjek gambar di tengah, ruang kosong di bawah untuk CTA)",
              "ctaRecommendation": "Rekomendasi teks tombol CTA dan konteksnya dalam Bahasa Indonesia",
              "finalPrompt": "Template Prompt Meta Ads Fotorealistis:\\n\\nBuat gambar kreatif iklan Meta Ads yang fotorealistis.\\n\\nNiche/Audiens:\\n[Masukkan nama ceruk/niche dan target audiens di sini secara detail]\\n\\nMasalah Utama / Hook:\\n[Masukkan rumusan masalah utama / hook emosional dari sudut pandang terpilih di sini]\\n\\nPenawaran / Manfaat:\\n[Masukkan penawaran utama / solusi manfaat produk di sini]\\n\\nAdegan Visual:\\n[Deskripsikan adegan visual fotorealistis berkualitas studio komersial secara detail, dengan emosi jujur, tanpa hiasan digital artifikasi 3D buatan]\\n\\nSubjek Utama:\\n[Deskripsikan subjek utama, misalnya pria/wanita berumur X, ekspresi wajah, pose, baju dst]\\n\\nObjek Konversi:\\n[Sebutkan produk digital, fisik, mock-up atau visualisasi solusi yang ditonjolkan]\\n\\nLayout\\n\\nBagian Atas:\\n[Deskripsikan elemen atau ruang kosong untuk teks headline di visual]\\n\\nBagian Tengah:\\n[Deskripsikan penempatan subjek utama & produk agar fokus fokus langsung terlihat]\\n\\nBagian Bawah:\\n[Deskripsikan penempatan ruang kosong atau area CTA button]\\n\\nGaya Visual\\n\\nFotografi komersial premium, fotorealistis, fokus tajam pada subjek, latar belakang bokeh lembut.\\n\\nBukan kartun.\\n\\nPencahayaan\\n\\n[Deskripsikan pencahayaan komersial premium, e.g., soft cinematic, studio lighting, natural sunlight]\\n\\nWarna\\n\\n[Deskripsikan strategi warna yang selaras kontras tinggi sesuai psikologi warna pengguna]\\n\\nRasio\\n\\n4:5 vertikal untuk Instagram Feed dan Facebook Feed.\\n\\nElemen UI yang Mendukung Aksi\\n\\nTambahkan elemen antarmuka yang mendorong tindakan seperti:\\n\\n- Tombol CTA yang terlihat jelas\\n- Badge dengan teks\\n- Font yang mudah dibaca\\n\\nTeks yang Ditampilkan di Dalam Gambar (Opsional)\\n\\nHeadline:\\n[Teks headline singkat berkonversi tinggi]\\n\\nSubheadline:\\n[Teks subheadline singkat]\\n\\nBadge:\\n[Teks badge diskon atau penawaran pendukung]\\n\\nCTA:\\n[Teks tombol CTA, misal: Ambil Sekarang]\\n\\nNegative Prompt\\n\\n- No stock photo look\\n- No cartoon\\n- No illustration\\n- No distorted face\\n- No deformed hands\\n- No extra fingers\\n- No blurry text\\n- No watermark\\n- No logo placement errors\\n- No cluttered composition\\n- No low quality rendering\\n\\nHasil Akhir yang Diinginkan\\n\\n- Terlihat seperti iklan Meta Ads profesional\\n- Memiliki hook visual yang kuat\\n- Produk atau solusi terlihat jelas\\n- Komposisi bersih dan mudah dipahami dalam 1–3 detik\n- Fokus visual jelas\n- Mobile-friendly\n- Siap digunakan untuk Instagram Feed dan Facebook Feed"
            },
            {
              "id": "B",
              "name": "Sudut Pandang Solusi Masalah",
              "targetEmotion": "kepercayaan penyelesaian masalah & detail kelegaan",
              "visualStrategy": "...",
              "hookStrategy": "...",
              "colorPsychology": "...",
              "layoutStrategy": "...",
              "ctaRecommendation": "...",
              "finalPrompt": "...[Harus mengikuti struktur format tepat 'Template Prompt Meta Ads Fotorealistis:' yang sama persis dengan Opsi A dengan detail yang disesuaikan untuk sudut solusi masalah]..."
            },
            {
              "id": "C",
              "name": "Sudut Pandang Gaya Hidup / Aspirasional",
              "targetEmotion": "rasa bangga, upgrade status, dan impian masa depan",
              "visualStrategy": "...",
              "hookStrategy": "...",
              "colorPsychology": "...",
              "layoutStrategy": "...",
              "ctaRecommendation": "...",
              "finalPrompt": "...[Harus mengikuti struktur format tepat 'Template Prompt Meta Ads Fotorealistis:' yang sama persis dengan Opsi A dengan detail yang disesuaikan untuk sudut gaya hidup / aspirasional]..."
            }
          ]
        }`;
      }

      const prompt = `Generate ${generationScope === "single" ? `ONLY the selected "${imageTargetAngle}" ad angle` : "all A, B, C converting ad angles"} conforming strictly to the requested schema. Provide custom creative text in finalPrompt. Use 100% Indonesia for ALL fields (including finalPrompt visual descriptions, strategies, and analysis) - completely remove English prompts.\n\nContext:\n${fullPromptContext}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || !Array.isArray(parsed.angles)) {
        throw new Error("Respon AI tidak memiliki format angles yang valid.");
      }

      setGeneratedAngles(parsed.angles);
      setSelectedAngle(parsed.angles[0]?.id || "A");
      setActiveSubTab("output");
      
      saveStateToProject({ 
        adsGeneratedAngles: parsed.angles,
        adsInputState: {
          platform,
          imageFormat,
          emotionalFlow,
          customEmotionalFlow,
          visualHookFocus,
          styleDirection,
          colorStrategy,
          textDensity,
          ctaStyle,
          additionalRequest
        }
      });

      toast.success(generationScope === "single" ? `1 Angle "${parsed.angles[0]?.name}" Berhasil Dihasilkan (Sangat Hemat Token)!` : "Tiga Angle Iklan Berkinerja Tinggi Berhasil Dihasilkan!");
      // scroll to top of content
      const element = document.getElementById("creative-ads-system");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      handleAIError(err, "Gagal membuat prompt marketing angle.");
    } finally {
      setAnglesLoading(false);
    }
  };

  // Save current input state and generated results manually to project
  const saveStateToProject = (extraUpdates: any = {}) => {
    const dataToSave = {
      adsInputState: {
        platform,
        imageFormat,
        emotionalFlow,
        customEmotionalFlow,
        visualHookFocus,
        styleDirection,
        colorStrategy,
        textDensity,
        ctaStyle,
        additionalRequest,

        activeFormat,
        carouselSlidesCount,
        carouselMainGoal,
        carouselRecommendations,
        generatedCarousel,
        selectedCarouselOption,

        videoHookType,
        videoPersona,
        videoPacing,
        videoMusicVibe,
        videoResolution,
        videoAdditionalReq,
        videoRecommendations,
        generatedVideoDirections,
        selectedVideoOption,

        videoSubMode,
        ugcCharacterSource,
        ugcGender,
        ugcAgeRange,
        ugcTargetDemographic,
        ugcTopicFocus,
        ugcModelImage,
        ugcDigitalProductTitle,
        ugcProductCoverImage,
        selectedCharacterId,
        characterLibrary,
        ugcOutput
      },
      adsRecommendationsState: recommendations,
      adsGeneratedAngles: generatedAngles,
      ...extraUpdates
    };
    onSaveProject(dataToSave);
  };

  const handleManualSaveTrigger = () => {
    saveStateToProject();
    toast.success("Seluruh data input dan rekomendasi disimpan ke proyek!");
  };

  // --- VIDEO & CAROUSEL HELPERS ---

  // Video Field Optimization applying
  const handleAIOptimizeVideoField = (fieldId: string) => {
    const rec = videoRecommendations[fieldId];
    if (!rec) return;

    if (fieldId === "videoHookType") setVideoHookType(rec.recommendedValue);
    else if (fieldId === "videoPersona") setVideoPersona(rec.recommendedValue);
    else if (fieldId === "videoPacing") setVideoPacing(rec.recommendedValue);
    else if (fieldId === "videoMusicVibe") setVideoMusicVibe(rec.recommendedValue);
    else if (fieldId === "videoResolution") setVideoResolution(rec.recommendedValue);
    else if (fieldId === "videoAdditionalReq") setVideoAdditionalReq(rec.recommendedValue);

    toast.success(`Optimasi AI diterapkan untuk VIDEO ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
  };

  // Regenerate suggestion for single video field
  const handleRegenerateVideoSuggestion = async (fieldId: string) => {
    setLoadingField(prev => ({ ...prev, [fieldId]: true }));
    try {
      const fieldLabels: Record<string, string> = {
        videoHookType: "Video Slide/Intro Hook Strategy",
        videoPersona: "Video Presenter / UGC Creator Persona",
        videoPacing: "Video Pacing and Editing Rhythm",
        videoMusicVibe: "Background Audio and Music Vibe",
        videoResolution: "Video Aspect Ratio / Resolution",
        videoAdditionalReq: "Additional Video Scene Specifications"
      };

      const systemInstruction = `You are an elite Direct-Response Video Ad Strategist. Based on the target business context, recommend the absolute best option for the video ad parameter: ${fieldLabels[fieldId] || fieldId}. Return a JSON object with this EXACT schema:
      {
        "recommendedValue": "recommended string value",
        "explanation": "concise digital psychology and conversion potential reasoning in Indonesian language"
      }`;

      const context = getCampaignContext();
      const prompt = `Based on the following context, generate a recommended value and a detailed Indonesia-language explanation for video field: ${fieldId}.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || parsed.recommendedValue === undefined) {
        throw new Error("Respon AI tidak valid atau tidak memiliki format video rekomendasi yang benar.");
      }

      setVideoRecommendations(prev => {
        const updated = {
          ...prev,
          [fieldId]: {
            recommendedValue: parsed.recommendedValue,
            explanation: parsed.explanation
          }
        };
        return updated;
      });

      toast.success(`Saran video untuk ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()} diperbarui!`);
    } catch (err: any) {
      handleAIError(err, `Gagal memperbarui saran video field ${fieldId}`);
    } finally {
      setLoadingField(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Perform full video AI optimization
  const handleFullVideoAIOptimization = async () => {
    setGlobalLoading(true);
    try {
      const systemInstruction = `You are an elite conversion strategist for video marketing campaigns. Based on the target brand, audience, positioning, pain point, and offer, generate optimal settings for all 6 video parameters: videoHookType, videoPersona, videoPacing, videoMusicVibe, videoResolution, and videoAdditionalReq. 
      Return a JSON string matching this exact schema:
      {
        "videoHookType": { "recommendedValue": "specific hook strategy", "explanation": "psychology reason in Indonesian" },
        "videoPersona": { "recommendedValue": "actor profile details", "explanation": "psychology reason in Indonesian" },
        "videoPacing": { "recommendedValue": "editing speed description", "explanation": "psychology reason in Indonesian" },
        "videoMusicVibe": { "recommendedValue": "vibe style", "explanation": "psychology reason in Indonesian" },
        "videoResolution": { "recommendedValue": "aspect ratio selection", "explanation": "psychology reason in Indonesian" },
        "videoAdditionalReq": { "recommendedValue": "specific scene composition suggestion", "explanation": "psychology reason in Indonesian" }
      }`;

      const context = getCampaignContext();
      const prompt = `Perform complete brand-aligned video parameter configurations for video ad campaign.\n\nContext:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed) {
        throw new Error("Respon AI untuk optimasi video tidak valid.");
      }

      if (parsed.videoHookType) setVideoHookType(parsed.videoHookType.recommendedValue);
      if (parsed.videoPersona) setVideoPersona(parsed.videoPersona.recommendedValue);
      if (parsed.videoPacing) setVideoPacing(parsed.videoPacing.recommendedValue);
      if (parsed.videoMusicVibe) setVideoMusicVibe(parsed.videoMusicVibe.recommendedValue);
      if (parsed.videoResolution) setVideoResolution(parsed.videoResolution.recommendedValue);
      if (parsed.videoAdditionalReq) setVideoAdditionalReq(parsed.videoAdditionalReq.recommendedValue);

      setVideoRecommendations(parsed);
      toast.success("Optimasi Video AI Selesai! Seluruh parameter diselaraskan otomatis.");
    } catch (err: any) {
      handleAIError(err, "Gagal melakukan optimasi video global.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Generate 1 Selected Direction for Video (Token-saving & highly-converting choice)
  const handleGenerateVideoDirections = async (customRevision?: string) => {
    setVideoDirectionsLoading(true);
    try {
      const activeContext = getCampaignContext();
      const currentInputs = `
        === VIDEO ADS SPECIFICATION ===
        Hook Type: ${videoHookType}
        Presenter Persona: ${videoPersona}
        Pacing & Editing Rhythm: ${videoPacing}
        Music Vibe: ${videoMusicVibe}
        Aspect Ratio & Platform Target: ${videoResolution}
        Additional Spec: ${videoAdditionalReq}
        Selected Style Option: ${videoTargetStyle}
      `.trim();

      const previousOutput = generatedVideoDirections.length > 0 ? generatedVideoDirections : project?.adsInputState?.generatedVideoDirections;
      const effectiveRevision = customRevision || videoAdditionalReq;

      const fullPromptContext = buildRevisionPromptContext({
        revision: effectiveRevision,
        previousOutput,
        stepName: "Step 10: Video Ads Studio (Video Scripts)",
        defaultContext: `
          === CAMPAIGN CONTEXT ===
          ${activeContext}

          ${currentInputs}
        `
      });

      const optName = videoTargetStyle === "A" 
        ? "Gaya UGC Alami (Organic Style)" 
        : videoTargetStyle === "B" 
          ? "Gaya Native TikTok Loop" 
          : "Gaya Sinematik Premium";

      const optDesc = videoTargetStyle === "A"
        ? "fokus pada keaslian organik, hook agresif berupa pola-interupsi (pattern-interrupt) dari sudut pandang pembuat konten kasual, transisi dinamis cepat, dan kedekatan emosional personal tanpa rekayasa."
        : videoTargetStyle === "B"
          ? "fokus pada ritme tempo sengit cepat, teknik looping tak berujung, penumpukan overlay teks tebal (kinetic typography), dan estetika tren orisinal media sosial."
          : "fokus pada penceritaan emosional terarah (storytelling), pencahayaan komersial hangat bermutu studio, pergerakan kamera sinematik lambat, dan musik latar megah penuh nuansa.";

      const systemInstruction = `You are a viral Direct-Response Video Ad scriptwriter, media buying analyst, and expert copywriter. Pastikan SELURUH draf video, deskripsi scene, teks visual, dialog pengisi suara (voiceover), transkrip, strategi, nilai metrik, dan skrip video lengkap ditulis 100% dalam Bahasa Indonesia secara mendalam dan persuasif.

      Hasilkan HANYA SATU opsi arah video ads sesuai kriteria yang dipilih oleh pengguna:
      ID Gaya Target: "${videoTargetStyle}"
      Nama Gaya: "${optName}"
      Fokus Gaya: ${optDesc}

      Apply these strict guidelines to write the "videoPrompt" field of the selected option in the JSON response:
      - Act as a professional direct response short video ads script writer.
      - Buat script video ads pendek berdasarkan data dari project sebelumnya, sesuaikan input tambahan untuk kebutuhan prompt buat untuk Meta Ads dengan format EXACT seperti contoh di bawah ini.
      - WAJIB:
        1. Output harus per scene (dari Scene 1 sampai Scene 6 berkaitan dengan Hook, Masalah, Kesalahan, Solusi, Proof, CTA).
        2. Setiap scene wajib punya secara runtun:
           - Judul scene (EXACTLY: "Scene 1 (Hook - 0–3s)", "Scene 2 (Masalah)", "Scene 3 (Kesalahan)", "Scene 4 (Solusi)", "Scene 5 (Proof)", "Scene 6 (CTA)")
           - Teks (kalimat pendek dibungkus tanda kutip, maksimal 2 baris/kalimat pendek per scene)
           - Highlight (frasa terpenting dibungkus tanda kutip)
           - Visual (deskripsi visual ringkas & instruksi gerakan kamera)
           - Emosi (jenis emosi yang dipacu)
        3. Format harus super rapi.
        4. Gunakan gaya bahasa Indonesia yang pendek, brutal, high CTR, persuasif dan asyik.
        5. Fokus total pada hook kuat dan retensi tinggi.
        6. Gunakan HURUF KAPITAL pada KATA PENTING untuk penekanan brutal.
        7. Maksimal 2 kalimat pendek per scene.
        8. Jangan kasih penjelasan tambahan di luar format.
        9. Jangan kasih kalimat pengantar/intro atau kesimpulan apa pun.
        10. Langsung output script utuh di dalam string "videoPrompt" tersebut.

      Struktur isi dari "videoPrompt" HARUS PERSIS SEPERTI INI (tanpa teks intro maupun outro):

      Scene 1 (Hook - 0–3s)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 2 (Masalah)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 3 (Kesalahan)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 4 (Solusi)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 5 (Proof)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Scene 6 (CTA)
      Teks:
      "..."
      "..."
      Highlight: "..."
      Visual: ...
      Emosi: ...

      Kembalikan EXACTLY string JSON dengan skema berikut berisi tepat 1 objek di dalam list 'directions' dengan id '${videoTargetStyle}':
      {
        "directions": [
          {
            "id": "${videoTargetStyle}",
            "name": "${optName}",
            "hookStyle": "${videoTargetStyle === 'A' ? 'Penginterupsi pola UGC organik instan' : videoTargetStyle === 'B' ? 'Overlay teks padat bertempo cepat' : 'Storytelling emosional dengan musik orkestra lambat'}",
            "pacingStyle": "${videoTargetStyle === 'A' ? 'Sangat cepat & spontan' : videoTargetStyle === 'B' ? 'Looping ketat & energik' : 'Peralihan dramatis & mulus'}",
            "audioDirection": "Deskripsi efek suara & musik pengiring dalam Bahasa Indonesia",
            "voiceoverOutline": "Ringkasan intonasi ucapan pengisi suara dalam Bahasa Indonesia",
            "script": [
              { "time": "0-3s [Hook]", "visual": "Detail visual pembuka yang melarang mata berpaling dari layar dalam Bahasa Indonesia", "audioText": "Naskah narasi Bahasa Indonesia penghenti jempol" },
              { "time": "3-7s [Problem]", "visual": "Bahasa Indonesia detail visual visualisasi masalah utama", "audioText": "Narasi Bahasa Indonesia yang mengupas tuntas pain point" },
              { "time": "7-12s [Solution]", "visual": "Bahasa Indonesia detail presentasi solusi produk", "audioText": "Narasi penjelasan kontribusi produk menyelesaikan masalah" },
              { "time": "12-15s [CTA]", "visual": "Bahasa Indonesia detail penunjuk penekanan tombol dan tawaran penjelas", "audioText": "Ajakan bertindak / dorongan urgensi" }
            ],
            "videoPrompt": "The full formatted Scene 1 to Scene 6 direct response script written exactly as requested in Indonesian language.",
            "visualPlan": {
              "lighting": "Strategi pencahayaan ramah feed handphone dalam Bahasa Indonesia",
              "colorPalette": "Rencana skema palet warna dominan dan kontras tinggi",
              "typography": "Overlay teks gaya kontras tinggi ramah mobile"
            },
            "metricsDashboard": {
              "targetHookRate": "38%+",
              "avgRetention": "58% (Sangat Optimal)",
              "targetCTR": "1.25% (Rasio konversi fantastis)",
              "evalTool": "CLIP Semantic Alignment & VBench evaluation"
            }
          }
        ]
      }`;

      const prompt = `Hasilkan SATU draf penataan video ads yang terpilih berdasarkan format pilihan "${videoTargetStyle}" secara detail. Tulis detail naskah "videoPrompt" dari Scene 1 sampai Scene 6 seluruhnya dalam Bahasa Indonesia.\n\nContext:\n${fullPromptContext}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || !Array.isArray(parsed.directions)) {
        throw new Error("Respon AI tidak memiliki format draf video directions yang valid.");
      }

      setGeneratedVideoDirections(parsed.directions);
      setSelectedVideoOption(parsed.directions[0]?.id || "A");
      setActiveSubTab("output");
      toast.success(`Skrip Video "${parsed.directions[0]?.name}" Berhasil Diformulasikan (Sangat Hemat Token)!`);
      // scroll to top of content
      const element = document.getElementById("creative-ads-system");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      handleAIError(err, "Gagal melahirkan draf video ads AI.");
    } finally {
      setVideoDirectionsLoading(false);
    }
  };

  // Carousel Slide Optimization applying
  const handleAIOptimizeCarouselField = (fieldId: string) => {
    const rec = carouselRecommendations[fieldId];
    if (!rec) return;

    if (fieldId === "carouselSlidesCount") setCarouselSlidesCount(rec.recommendedValue);
    else if (fieldId === "carouselMainGoal") setCarouselMainGoal(rec.recommendedValue);

    toast.success(`Optimasi AI diterapkan untuk CAROUSEL ${fieldId.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
  };

  // Regenerate Carousel suggestion
  const handleRegenerateCarouselSuggestion = async (fieldId: string) => {
    setLoadingField(prev => ({ ...prev, [fieldId]: true }));
    try {
      const fieldLabels: Record<string, string> = {
        carouselSlidesCount: "Carousel Number of Slides Count recommendation",
        carouselMainGoal: "Carousel Core Concept Hook Flow"
      };

      const systemInstruction = `You are a Direct-Response Carousel Ads pro. Recommend the absolute best option for: ${fieldLabels[fieldId] || fieldId}. Return EXACTLY a JSON:
      {
        "recommendedValue": "recommended string or number value",
        "explanation": "psychological explanation in Indonesian"
      }`;

      const context = getCampaignContext();
      const prompt = `For carousel parameter ${fieldId}, generate recommendation. Context:\n${context}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || parsed.recommendedValue === undefined) {
        throw new Error("Respon AI tidak valid atau tidak memiliki format carousel rekomendasi yang benar.");
      }

      setCarouselRecommendations(prev => ({
        ...prev,
        [fieldId]: {
          recommendedValue: parsed.recommendedValue,
          explanation: parsed.explanation
        }
      }));

      toast.success(`Rekomendasi Carousel untuk ${fieldId} diperbarui!`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingField(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Generate Carousel Ads Options
  const handleGenerateCarousel = async (customRevision?: string) => {
    setCarouselLoading(true);
    try {
      const activeContext = getCampaignContext();
      const currentInputs = `
        === CAROUSEL ADS SPECIFICATION ===
        Slides Count: ${carouselSlidesCount}
        Main Goal: ${carouselMainGoal}
      `.trim();

      const previousOutput = generatedCarousel.length > 0 ? generatedCarousel : project?.adsInputState?.generatedCarousel;
      const effectiveRevision = customRevision || additionalRequest;

      const fullPromptContext = buildRevisionPromptContext({
        revision: effectiveRevision,
        previousOutput,
        stepName: "Step 10: Carousel Ads Studio (Slide Deck)",
        defaultContext: `
          === CAMPAIGN CONTEXT ===
          ${activeContext}

          ${currentInputs}
        `
      });

      const systemInstruction = `You are a world-class Direct-Response Carousel Ads designer, Conversion Rate Optimization (CRO) strategist, and Image Prompt Engineer.
      Generate exactly THREE advertising options (A, B, C) matching the user criteria.
      
      Option A is: Storytelling Thread (narrates a customer transformational path slide-by-slide)
      Option B is: Feature Breakdown (showcases different parts of the offer and bonuses in each slide)
      Option C is: Framework Education (teaches a 3-step value before showing the CTA as slide 5)

      Crucially, for EACH SLIDE's imagePrompt, you MUST generate an extremely detailed, highly optimized, Indonesian-language image prompt. DO NOT write simple sentences. The prompt MUST be a long string formatted with clean newline characters (\\n) using this exact template structures:

      Buat gambar iklan berkonversi tinggi untuk produk digital.

      KONTEKS PEMASARAN:
      - Ceruk (Niche): [Nama Ceruk]
      - Audiens: [Target Audiens]
      - Peran Slide (Slide Role): [Misal: Slide 1 - Hook Utama / Slide 2 - Penajaman Frustrasi / Slide 3 - Solusi / Slide 4 - Penawaran Spesifik / Slide 5 - Desakan & CTA Final]
      - Sudut Pemasaran (Angle): [Deskripsi Angle di slide ini]

      ---

      ADEGAN VISUAL:
      [Deskripsikan adegan visual fotorealistis secara detail dalam Bahasa Indonesia. Deskripsikan orang/subjek dengan ekspresi wajah mikro asli yang jujur seperti rasa frustrasi atau rasa lega, objek, latar belakang, pakaian kasual, gaya kamera candid UGC, dan pencahayaan studio/alami tanpa kelihatan plastik/palsu model AI]

      ---

      HOOK EMOSIONAL:
      [Deskripsikan trigger psikologis hook visual untuk menghentikan scroll jari di slide ini]

      ---

      LAYOUT KOMPOSISI:
      - AREA ATAS: [Ruang kosong bersih di atas untuk overlay teks headline tebal]
      - AREA TENGAH: [Fokus utama subjek visual / objek]
      - AREA BAWAH: [Ruang bersih di bagian bawah untuk indikator slide / teks keterangan]

      ---

      ARAHAN GAYA:
      [Gaya visual spesifik seperti Foto candid UGC ponsel pintar, iklan komersial berkualitas tinggi, pencahayaan alami, atau studio softbox yang realistis]

      ---

      STRATEGI WARNA:
      [Detail palet warna kontras tinggi yang membangkitkan emosional slide ini]

      ---

      OPTIMASI PLATFORM:
      - Format: 1:1 Persegi (Square Carousel) dengan safe zone teks overlay

      ---

      INTENSI IKLAN:
      [Penjelasan bagaimana slide visual ini memicu rasa penasaran atau urgensi direct-response agar audiens menggeser (swipe) ke slide carousel berikutnya]

      Keep EVERYTHING in Indonesian including headlines, bodies, imagePrompts, and overall concepts. Return EXACTLY a JSON string with the following schema:
      {
        "options": [
          {
            "id": "A",
            "name": "Storytelling Thread",
            "mainConcept": "Ide narasi utama dalam Bahasa Indonesia",
            "slides": [
              { "slideNumber": 1, "headline": "Headline slide 1", "body": "Body slide 1", "imagePrompt": "[Prompt visual slide 1 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 2, "headline": "Headline slide 2", "body": "Body slide 2", "imagePrompt": "[Prompt visual slide 2 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 3, "headline": "Headline slide 3", "body": "Body slide 3", "imagePrompt": "[Prompt visual slide 3 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 4, "headline": "Headline slide 4", "body": "Body slide 4", "imagePrompt": "[Prompt visual slide 4 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 5, "headline": "Headline slide 5", "body": "Body slide 5 (CTA)", "imagePrompt": "[Prompt visual slide 5 menggunakan format paragraf berstruktur di atas]" }
            ]
          },
          {
            "id": "B",
            "name": "Feature Breakdown",
            "mainConcept": "Analisis fitur utama dalam Bahasa Indonesia",
            "slides": [
              { "slideNumber": 1, "headline": "Headline slide 1", "body": "Body slide 1", "imagePrompt": "[Prompt visual slide 1 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 2, "headline": "Headline slide 2", "body": "Body slide 2", "imagePrompt": "[Prompt visual slide 2 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 3, "headline": "Headline slide 3", "body": "Body slide 3", "imagePrompt": "[Prompt visual slide 3 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 4, "headline": "Headline slide 4", "body": "Body slide 4", "imagePrompt": "[Prompt visual slide 4 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 5, "headline": "Headline slide 5", "body": "Body (CTA)", "imagePrompt": "[Prompt visual slide 5 menggunakan format paragraf berstruktur di atas]" }
            ]
          },
          {
            "id": "C",
            "name": "Framework Education",
            "mainConcept": "Cetak biru edukasi dalam Bahasa Indonesia",
            "slides": [
              { "slideNumber": 1, "headline": "Headline slide 1", "body": "Body slide 1", "imagePrompt": "[Prompt visual slide 1 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 2, "headline": "Headline slide 2", "body": "Body slide 2", "imagePrompt": "[Prompt visual slide 2 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 3, "headline": "Headline slide 3", "body": "Body slide 3", "imagePrompt": "[Prompt visual slide 3 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 4, "headline": "Headline slide 4", "body": "Body slide 4", "imagePrompt": "[Prompt visual slide 4 menggunakan format paragraf berstruktur di atas]" },
              { "slideNumber": 5, "headline": "Headline slide 5", "body": "Body (CTA)", "imagePrompt": "[Prompt visual slide 5 menggunakan format paragraf berstruktur di atas]" }
            ]
          }
        ]
      }`;

      const prompt = `Generate Carousel Option A, B, and C with slide scripting. Ensure EACH slide's imagePrompt is written as a comprehensive, multi-section direct-response visual generator spec matching the requested template (including KONTEKS PEMASARAN, ADEGAN VISUAL, HOOK EMOSIONAL, LAYOUT KOMPOSISI, ARAHAN GAYA, STRATEGI WARNA, OPTIMASI PLATFORM, and INTENSI IKLAN). Keep EVERYTHING in Indonesian including slide headlines, bodies, imagePrompts, and overall suggestions. Absolutely no English is allowed.\n\nContext:\n${fullPromptContext}`;

      const response = await generateAIContent(prompt, systemInstruction);
      const parsed = safeParseJSON(response.text, null);
      if (!parsed || !Array.isArray(parsed.options)) {
        throw new Error("Respon AI tidak memiliki format draf carousel options yang valid.");
      }

      setGeneratedCarousel(parsed.options);
      setSelectedCarouselOption("A");
      setActiveSubTab("output");
      toast.success("Carousel Slides Berhasil Dihasilkan!");
      // scroll to top of content
      const element = document.getElementById("creative-ads-system");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: any) {
      handleAIError(err, "Gagal melahirkan pilihan Carousel Ads.");
    } finally {
      setCarouselLoading(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    safeCopyToClipboard(text).then((success) => {
      if (success) {
        toast.success("Prompt berhasil disalin ke clipboard!");
      } else {
        toast.error("Gagal menyalin secara otomatis, silakan salin teks secara manual.");
      }
    });
  };

  // Get instant image URL using pollinations.ai format
  const getPollinationsUrl = (promptText: string) => {
    const parsedScene = promptText.match(/(?:ADEGAN VISUAL|VISUAL SCENE):([\s\S]*?)---/i) || ["", promptText];
    const cleanSceneDesc = parsedScene[1] ? parsedScene[1].trim() : promptText.substring(0, 300);
    
    const formattedStyle = styleDirection.join(" Style, ") + " Style";
    const colorDesc = colorStrategy.substring(0, 100);
    const combinedInput = `${cleanSceneDesc}. Style: ${formattedStyle}, photography, commercial advertisement layout, high detail, photorealistic, premium lighting, color tones: ${colorDesc}`.replace(/[#]/g, "");

    const seed = 42; // static seed
    const width = imageFormat === "1:1" ? 1024 : imageFormat === "16:9" ? 1280 : imageFormat === "9:16" ? 720 : 820;
    const height = imageFormat === "1:1" ? 1024 : imageFormat === "16:9" ? 720 : imageFormat === "9:16" ? 1280 : 1025;

    return `https://image.pollinations.ai/p/${encodeURIComponent(combinedInput)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
  };

  // Checkbox/Multi-select toggle helper for Style Direction
  const toggleStyleSelection = (styleName: string) => {
    setStyleDirection(prev => {
      if (prev.includes(styleName)) {
        return prev.filter(s => s !== styleName);
      } else {
        return [...prev, styleName];
      }
    });
  };

  // Select recommended styles directly
  const applyRecommendedStyles = (recommended: string[]) => {
    setStyleDirection(recommended);
    toast.success("Kombinasi Style rekomendasi AI diterapkan.");
  };

  // --- UGC CHARACTER FLOW HANDLERS ---
  const handleUgcCharacterSourceChange = (newSource: "ai" | "upload" | "library") => {
    setUgcCharacterSource(newSource);
    if (newSource === "ai") {
      setSelectedCharacterId("new");
    } else if (newSource === "upload") {
      setSelectedCharacterId("upload");
    } else if (newSource === "library") {
      if (characterLibrary.length > 0) {
        const charToSelect = characterLibrary.find((c) => c.id === selectedCharacterId) || characterLibrary[0];
        setSelectedCharacterId(charToSelect.id);
        if (charToSelect.gender) setUgcGender(charToSelect.gender);
        if (charToSelect.ageRange) setUgcAgeRange(charToSelect.ageRange);
      }
    }
  };

  const handleSaveCharacterToLibrary = (charToSave: any) => {
    if (!charToSave) return;
    const newChar = {
      id: charToSave.id || `char_${Date.now()}`,
      name: charToSave.name || "Karakter UGC AI",
      gender: charToSave.gender || ugcGender || "female",
      ageRange: charToSave.ageRange || ugcAgeRange || "20-25",
      faceAndAppearance: charToSave.faceAndAppearance || "",
      clothing: charToSave.clothing || "",
      speakingStyle: charToSave.speakingStyle || "",
      locationSetting: charToSave.locationSetting || "",
      consistencyDescription: charToSave.consistencyDescription || "",
      avatarImageUrl: charToSave.avatarImageUrl || "",
      createdAt: new Date().toLocaleDateString("id-ID")
    };

    const existingIdx = characterLibrary.findIndex((c) => c.id === newChar.id || c.name === newChar.name);
    let updatedLib = [];
    if (existingIdx >= 0) {
      updatedLib = [...characterLibrary];
      updatedLib[existingIdx] = newChar;
    } else {
      updatedLib = [newChar, ...characterLibrary];
    }

    setCharacterLibrary(updatedLib);
    try {
      localStorage.setItem("ugc_character_library", JSON.stringify(updatedLib));
    } catch (e) {
      console.error(e);
    }
    toast.success(`Karakter "${newChar.name}" berhasil disimpan ke Character Library!`);
    saveStateToProject({ characterLibrary: updatedLib });
  };

  const handleDeleteCharacter = (id: string) => {
    const updated = characterLibrary.filter((c) => c.id !== id);
    setCharacterLibrary(updated);
    try {
      localStorage.setItem("ugc_character_library", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (selectedCharacterId === id) {
      setSelectedCharacterId("new");
    }
    toast.info("Karakter dihapus dari library.");
    saveStateToProject({ characterLibrary: updated });
  };

  const handleDownloadCharacterImage = async (imageUrl: string, fileName = "ugc-character-reference.png") => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Gambar referensi karakter berhasil diunduh!");
    } catch (e) {
      window.open(imageUrl, "_blank");
      toast.info("Gambar referensi terbuka di tab baru. Silakan klik kanan -> Simpan Gambar.");
    }
  };

  const handleGetAISceneNoteSuggestion = async (sceneKey: "scene1" | "scene2" | "scene3") => {
    setAiNoteLoading((prev) => ({ ...prev, [sceneKey]: true }));
    try {
      const activeContext = getCampaignContext();
      let sceneGoal = "";
      if (sceneKey === "scene1") {
        sceneGoal = "Hook (Scene 1): Menghentikan scroll penonton, mengangkat pain point emosional utama, dan menyampaikan angle iklan yang kuat.";
      } else if (sceneKey === "scene2") {
        sceneGoal = "Solution (Scene 2): Memperkenalkan solusi produk, menonjolkan benefit utama, dan memperlihatkan mekanisme produk / pembuktian visual.";
      } else {
        sceneGoal = "CTA (Scene 3): Mendorong tindakan/Call to Action (CTA), menyampaikan penawaran/offer khusus, urgensi waktu, dan hasil/outcome akhir yang dicapai.";
      }

      const promptContext = `
=== STRATEGI CAMPAIGN (STEP 1 - STEP 8) ===
${activeContext}

=== TUGAS AI DIRECTOR ===
Buat 1-2 kalimat catatan pengarahan adegan (Scene Note) yang sangat spesifik untuk ${sceneGoal}.
Catatan ini harus selaras 100% dengan data riset campaign di atas, praktis, dan siap dipakai sebagai instruksi sutradara untuk karakter UGC.
Tulis dalam Bahasa Indonesia yang lugas dan to-the-point tanpa tanda kutip.
      `.trim();

      const response = await generateAIContent(promptContext, "You are an expert Meta Ads UGC Video Director and Campaign Strategist.");
      const suggestionText = response.text ? response.text.trim().replace(/^"+|"+$/g, "") : "";

      if (suggestionText) {
        if (sceneKey === "scene1") setScene1Note(suggestionText);
        else if (sceneKey === "scene2") setScene2Note(suggestionText);
        else if (sceneKey === "scene3") setScene3Note(suggestionText);
        toast.success(`Saran AI untuk ${sceneKey === "scene1" ? "Scene 1 (Hook)" : sceneKey === "scene2" ? "Scene 2 (Solution)" : "Scene 3 (CTA)"} berhasil diterapkan!`);
      } else {
        toast.error("Gagal membuat saran AI.");
      }
    } catch (err) {
      handleAIError(err, "Gagal membuat saran AI untuk catatan scene.");
    } finally {
      setAiNoteLoading((prev) => ({ ...prev, [sceneKey]: false }));
    }
  };

  const handleRegenerateScene = async (sceneKey: "scene1" | "scene2" | "scene3") => {
    if (!ugcOutput || !ugcOutput.script) {
      toast.error("Belum ada output UGC yang dibuat.");
      return;
    }
    setRegenerateSceneLoading((prev) => ({ ...prev, [sceneKey]: true }));
    try {
      const activeContext = getCampaignContext();
      const currentProfile = ugcOutput.characterProfile || {};
      const existingScript = ugcOutput.script || {};
      const specificNote = sceneKey === "scene1" ? scene1Note : sceneKey === "scene2" ? scene2Note : scene3Note;
      const sceneMeta = sceneKey === "scene1" ? "Scene 1: Hook (8 Detik)" : sceneKey === "scene2" ? "Scene 2: Solution (8 Detik)" : "Scene 3: CTA (8 Detik)";

      const isMale = currentProfile.gender === "male" || ugcOutput.gender === "male" || /pria|male|man|cowok|laki/i.test(`${currentProfile.name} ${currentProfile.faceAndAppearance}`);
      const isFemale = currentProfile.gender === "female" || ugcOutput.gender === "female" || /wanita|female|woman|cewek|perempuan/i.test(`${currentProfile.name} ${currentProfile.faceAndAppearance}`);
      const ageRange = currentProfile.ageRange || ugcOutput.ageRange || "";
      const ageStr = ageRange && ageRange !== "auto" ? `${ageRange} years old ` : "";

      let characterDescriptor = "";
      if (ugcOutput.characterSource === "upload") {
        characterDescriptor = "the creator from the reference image";
      } else if (currentProfile.name && currentProfile.name !== "Nama Persona Karakter" && currentProfile.name !== "the creator" && currentProfile.name !== "Kreator UGC AI") {
        characterDescriptor = `${currentProfile.name}, a ${ageStr}Southeast Asian ${isMale ? "male " : isFemale ? "female " : ""}creator`.replace(/\s+/g, " ").trim();
      } else {
        characterDescriptor = `a ${ageStr}Southeast Asian ${isMale ? "male " : isFemale ? "female " : ""}creator`.replace(/\s+/g, " ").trim();
      }

      const promptContext = `
=== STRATEGI CAMPAIGN ===
${activeContext}

=== PROFIL KARAKTER UGC SAAT INI (KONSISTEN 100%) ===
Sumber Karakter: ${ugcOutput.characterSource === "upload" ? "Unggah Foto Model" : ugcOutput.characterSource === "library" ? "Character Library" : "Buat Karakter Baru AI"}
Nama: ${currentProfile.name || "the creator"}
Gender: ${isMale ? "Laki-laki" : "Perempuan"}
Deskripsi Penampilan: ${currentProfile.faceAndAppearance || currentProfile.appearance || ""}
Pakaian: ${currentProfile.clothing || ""}
Gaya Bicara: ${currentProfile.speakingStyle || ""}
Setting: ${currentProfile.locationSetting || ""}

=== ADEGAN LAIN DALAM VIDEO INI (JAGA KESELARASAN) ===
${Object.keys(existingScript)
  .filter((k) => k !== sceneKey)
  .map((k) => `[${k.toUpperCase()}]: Audio: "${existingScript[k]?.audioScript}", Visual: "${existingScript[k]?.visualDescription}"`)
  .join("\n")}

=== CATATAN KHUSUS REVISI UNTUK ${sceneMeta} ===
${specificNote ? `Catatan Khusus Pengarahan: "${specificNote}"` : "Buat ulang adegan ini agar lebih menonjol, punchy, dan berkonversi tinggi."}
${ugcDigitalProductTitle ? `Nama Produk Digital: "${ugcDigitalProductTitle}"` : ""}
      `.trim();

      const systemInstruction = `You are a world-class Direct-Response Meta Ads UGC Video Director and Visual Prompt Engineer.
Regenerate ONLY the single scene '${sceneKey}' (${sceneMeta}) for an existing Meta Ads UGC Video Pack while maintaining 100% character identity and tone consistency with '${characterDescriptor}'.

Output MUST be a valid JSON object containing:
{
  "scene": {
    "title": "${sceneMeta}",
    "time": "8s duration",
    "objective": "${sceneKey === "scene1" ? "Hook" : sceneKey === "scene2" ? "Solution" : "CTA"}",
    "visualDescription": "Deskripsi adegan visual Meta Ads dalam Bahasa Indonesia",
    "audioScript": "Naskah ucapan audio karakter dalam Bahasa Indonesia (8 detik, punchy, natural)",
    "onScreenText": "Teks overlay layar HP (max 6 kata)",
    "subtitleText": "Rekomendasi subtitle layar mobile",
    "ctaText": "Teks badge/stiker Meta Ads",
    "emotion": "Ekspresi & emosi karakter",
    "cameraDirection": "Arah pergerakan kamera (${sceneKey === "scene1" ? "close-up / medium close-up / over-the-shoulder reaction" : sceneKey === "scene2" ? "medium shot / medium close-up / insert shot ke product atau screen" : "close-up / medium shot / slight push-in CTA shot"})",
    "googleFlowPrompt": "A single fluid narrative sentence in English following the exact Google Flow standard."
  },
  "googleFlowPrompt": "A single fluid narrative sentence in English following the exact Google Flow standard."
}

CRITICAL RULES FOR GOOGLE FLOW VIDEO PROMPTS:
The video prompt MUST be a single cohesive narrative string following this EXACT format:
"A 9:16 vertical [shot variation] shot of ${characterDescriptor} [setting]. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"[exact spoken dialogue / hook]\\". Natural indoor lighting, UGC style, 8 seconds."

Shot Variation Guidelines for ${sceneKey}:
- Scene 1 (Hook): close-up / medium close-up / over-the-shoulder reaction
- Scene 2 (Solution): medium shot / medium close-up / insert shot ke product atau screen
- Scene 3 (CTA): close-up / medium shot / slight push-in CTA shot

Mandatory Rules:
1. MUST start with "A 9:16 vertical [shot variation] shot of ${characterDescriptor}" and end with "UGC style, 8 seconds."
2. MUST include the exact phrase "speaking in Indonesian".
3. NO old formats (do NOT use "UGC video, 9:16 aspect ratio" or "Vertical 9:16 ... 8s duration").
4. Character description MUST match '${characterDescriptor}' consistently.
5. NO fragmented metadata, bracket tags, or dialogue outside the prompt string.
`;

      const response = await generateAIContent(promptContext, systemInstruction);
      const parsed = safeParseJSON(response.text, null);

      if (parsed && (parsed.scene || parsed.script)) {
        const updatedScene = parsed.scene || parsed.script;
        const speechSample = updatedScene.audioScript || updatedScene.onScreenText || (sceneKey === "scene1" ? "Masih pusing bikin materi iklan setiap hari?" : sceneKey === "scene2" ? "Lihat sendiri gimana solusi ini mempermudah bisnis kamu." : "Coba sekarang dan rasakan kemudahannya lewat tombol di bawah.");
        const fallbackPrompt =
          sceneKey === "scene1"
            ? `A 9:16 vertical close-up shot of ${characterDescriptor} in front of a laptop. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: "${speechSample}". Natural indoor lighting, UGC style, 8 seconds.`
            : sceneKey === "scene2"
            ? `A 9:16 vertical medium shot of ${characterDescriptor} holding a smartphone demonstrating the solution. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: "${speechSample}". Natural indoor lighting, UGC style, 8 seconds.`
            : `A 9:16 vertical slight push-in CTA shot of ${characterDescriptor} smiling confidently and gesturing downward. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: "${speechSample}". Natural indoor lighting, UGC style, 8 seconds.`;
        const updatedPrompt = parsed.googleFlowPrompt || updatedScene.googleFlowPrompt || fallbackPrompt;

        const updatedScript = {
          ...ugcOutput.script,
          [sceneKey]: {
            ...ugcOutput.script?.[sceneKey],
            ...updatedScene,
            googleFlowPrompt: updatedPrompt,
          },
        };

        const updatedPrompts = {
          ...ugcOutput.googleFlowPrompts,
          [`${sceneKey}Prompt`]: updatedPrompt,
        };

        const newUgcOutput = {
          ...ugcOutput,
          script: updatedScript,
          googleFlowPrompts: updatedPrompts,
        };

        setUgcOutput(newUgcOutput);
        saveStateToProject({ ugcOutput: newUgcOutput });
        toast.success(`${sceneMeta} berhasil di-regenerate!`);
      } else {
        toast.error("Format AI tidak sesuai. Silakan coba lagi.");
      }
    } catch (err) {
      handleAIError(err, `Gagal regenerate ${sceneKey}.`);
    } finally {
      setRegenerateSceneLoading((prev) => ({ ...prev, [sceneKey]: false }));
    }
  };

  const handleGenerateUGCCharacterFlow = async (customRevision?: string) => {
    setUgcLoading(true);
    try {
      const activeContext = getCampaignContext();

      // Determine explicit character identity strictly based on active user source (mutually exclusive)
      let resolvedGender = ugcGender;
      let resolvedAge = ugcAgeRange;
      let characterModeContext = "";
      let expectedCreatorDescriptor = "";
      let selectedChar: any = null;

      if (ugcCharacterSource === "upload") {
        // EXCLUSIVE: Uploaded model photo only
        expectedCreatorDescriptor = "the creator from the reference image";
        characterModeContext = `SUMBER KARAKTER: [UNGGAH FOTO MODEL] User menggunakan foto model referensi yang diunggah. Gender model: ${ugcGender === "male" ? "Laki-laki" : "Perempuan"}, Rentang Usia: ${ugcAgeRange === "auto" ? "Sesuaikan foto" : ugcAgeRange + " Tahun"}. Seluruh prompt video & image WAJIB merujuk tepat pada "the creator from the reference image".`;
      } else if (ugcCharacterSource === "library") {
        // EXCLUSIVE: Saved Character Library only
        selectedChar = characterLibrary.find((c) => c.id === selectedCharacterId) || (characterLibrary.length > 0 ? characterLibrary[0] : null);
        if (selectedChar) {
          resolvedGender = selectedChar.gender === "male" || /pria|laki|male/i.test(selectedChar.gender || "") ? "male" : "female";
          resolvedAge = selectedChar.ageRange || "20-25";
          const ageStr = resolvedAge && resolvedAge !== "auto" ? `${resolvedAge} years old ` : "";
          const genderStr = resolvedGender === "male" ? "male" : "female";
          expectedCreatorDescriptor = `${selectedChar.name}, a ${ageStr}Southeast Asian ${genderStr} creator`.replace(/\s+/g, " ").trim();
          characterModeContext = `SUMBER KARAKTER: [CHARACTER LIBRARY] Gunakan karakter resmi tersimpan: "${selectedChar.name}" (Gender: ${resolvedGender === "male" ? "Laki-laki" : "Perempuan"}, Usia: ${resolvedAge}, Tampilan: ${selectedChar.faceAndAppearance || selectedChar.appearance || ""}, Pakaian: ${selectedChar.clothing || ""}, Gaya Bicara: ${selectedChar.speakingStyle || ""}, Setting: ${selectedChar.locationSetting || ""}). Seluruh prompt video & image WAJIB konsisten menggunakan karakter ini.`;
        } else {
          const ageStr = ugcAgeRange === "20-25" ? "20-25 years old " : ugcAgeRange === "26-35" ? "26-35 years old " : ugcAgeRange === "36-45" ? "36-45 years old " : "";
          const genderStr = ugcGender === "male" ? "male" : "female";
          expectedCreatorDescriptor = `a ${ageStr}Southeast Asian ${genderStr} creator`.replace(/\s+/g, " ").trim();
          characterModeContext = `SUMBER KARAKTER: [BUAT KARAKTER BARU AI] Gender: ${ugcGender === "male" ? "Laki-laki (Male)" : "Perempuan (Female)"}, Usia: ${ugcAgeRange === "auto" ? "Sesuaikan Target Audiens" : ugcAgeRange + " Tahun"}, Demografi: "${ugcTargetDemographic}".`;
        }
      } else {
        // EXCLUSIVE: AI New Character only (ugcCharacterSource === "ai")
        const ageStr = ugcAgeRange === "20-25" ? "20-25 years old " : ugcAgeRange === "26-35" ? "26-35 years old " : ugcAgeRange === "36-45" ? "36-45 years old " : "";
        const genderStr = ugcGender === "male" ? "male" : "female";
        expectedCreatorDescriptor = `a ${ageStr}Southeast Asian ${genderStr} creator`.replace(/\s+/g, " ").trim();
        characterModeContext = `SUMBER KARAKTER: [BUAT KARAKTER BARU AI] Gender Wajib: ${ugcGender === "male" ? "Laki-laki (Male)" : "Perempuan (Female)"}, Rentang Usia: ${ugcAgeRange === "auto" ? "Sesuaikan Target Audiens" : ugcAgeRange + " Tahun"}, Demografi: "${ugcTargetDemographic}". Buat persona karakter baru AI dengan wajah, rambut, pakaian, dan gaya bicara yang spesifik dan fotorealistik.`;
      }

      const promptContext = `
=== CAMPAIGN CONTEXT ===
${activeContext}

=== UGC CHARACTER FLOW CONFIGURATION ===
${characterModeContext}
Fokus Topik / Pesan Kunci UGC: ${ugcTopicFocus || "Highlight utama manfaat produk dan pemicu masalah emosional audiens"}
${ugcDigitalProductTitle ? `[UTAMA] JUDUL EBOOK / PRODUK DIGITAL SPESIFIK: "${ugcDigitalProductTitle}"` : "[OPSIONAL] Produk Digital / Ebook: Sebutkan produk utama dari campaign context."}
${ugcCharacterSource === "upload" && ugcModelImage ? `[UTAMA] USER MENGUNGGAH FOTO MODEL REFERENSI KARAKTER. Seluruh deskripsi karakter (wajah, pakaian, gaya, dan prompt Google Flow) HARUS selaras dengan model referensi ini.` : ugcCharacterSource === "library" && selectedChar ? `[UTAMA] KARAKTER TERPILIH DARI LIBRARY: "${selectedChar.name}". Wajah: ${selectedChar.faceAndAppearance || selectedChar.appearance || ""}, Pakaian: ${selectedChar.clothing || ""}, Gaya Bicara: ${selectedChar.speakingStyle || ""}.` : "[OPSIONAL] Karakter AI: Buat profil visual karakter AI yang fotorealistik."}
${ugcProductCoverImage ? `[UTAMA] USER MENGUNGGAH COVER PRODUK / EBOOK. Dalam Scene 2 & prompt Google Flow, karakter WAJIB memamerkan sampul produk ini pada layar smartphone/tablet atau mockup buku.` : "[OPSIONAL] Cover Image: Buat deskripsi visual penawaran produk."}

=== CATATAN PENGARAHAN PER SCENE (OPSIONAL) ===
- Catatan Scene 1 (Hook): ${scene1Note || "Ikuti pola Hook standar yang menghentikan scroll dalam 8 detik pertama."}
- Catatan Scene 2 (Solution): ${scene2Note || "Ikuti pola Solution standar yang menjelaskan solusi & benefit produk."}
- Catatan Scene 3 (CTA): ${scene3Note || "Ikuti pola CTA standar yang mendorong tindakan penonton."}

${customRevision ? `CATATAN REVISI USER: "${customRevision}"` : ""}
      `.trim();

      const systemInstruction = `You are a world-class Direct-Response Meta Ads UGC Video Strategist, Character Consistency Architect, and Master Visual Prompt Engineer.
Generate a high-converting 3-Scene Meta Ads UGC Video Production Pack (8 seconds per scene, 24s total) equipped with Master Photorealistic Image Prompts, Cinematic Google Flow AI Video Prompts for each scene, and complete Meta Ads Text Overlays & Subtitles.

STRICT CHARACTER CONSISTENCY MANDATE:
- ONE OFFICIAL CHARACTER SOURCE MUST BE USED ACROSS ALL SCENES.
- Character Descriptor to use in ALL English Prompts: "${expectedCreatorDescriptor}".
- Gender: ${resolvedGender === "male" ? "MALE (Laki-laki)" : "FEMALE (Perempuan)"}.
- NEVER switch, randomize, or default to a different gender or character descriptor.
- ALL image prompts and ALL Google Flow video prompts MUST use "${expectedCreatorDescriptor}".
- If reference image was chosen: The prompt MUST refer to "the creator from the reference image".

DEFAULT 3-SCENE META ADS DIRECT-RESPONSE STRUCTURE (8 SECONDS PER SCENE):
- SCENE 1 (Hook - 8 Detik):
  * Objective: "Hook"
  * Title: "Scene 1: Hook (8 Detik)"
  * Time: "8s duration"
  * Shot variation: close-up / medium close-up / over-the-shoulder reaction
- SCENE 2 (Solution - 8 Detik):
  * Objective: "Solution"
  * Title: "Scene 2: Solution (8 Detik)"
  * Time: "8s duration"
  * Shot variation: medium shot / medium close-up / insert shot to product or screen
- SCENE 3 (CTA - 8 Detik):
  * Objective: "CTA"
  * Title: "Scene 3: CTA (8 Detik)"
  * Time: "8s duration"
  * Shot variation: close-up / medium shot / slight push-in CTA shot

STRICT REALISTIC IMAGE PROMPT STANDARDS (Photorealism & Consistency):
All image prompts (characterReferenceImagePrompt, scene1ReferenceImagePrompt, scene2ReferenceImagePrompt, and scene3ReferenceImagePrompt) MUST BE IN DETAILED ENGLISH and MANDATE:
- Must feature ${expectedCreatorDescriptor}.
- Photorealistic human face with natural skin texture, visible pores, real skin tone, realistic eyes with natural reflections, real hands with 5 anatomically correct fingers.
- Vertical 9:16 mobile aspect ratio (--ar 9:16).
- Natural candid indoor/window daylight or lifestyle ambient lighting.
- Authentic UGC mobile phone photo look.
- STRICTLY FORBIDDEN: Cartoon, CGI, 3D render, illustration, plastic unnaturally smooth skin, heavy beauty filter, uncanny valley faces, deformed fingers/face.
- 100% facial, hair, outfit, and vibe consistency across all reference prompts.

CRITICAL RULES FOR GOOGLE FLOW VIDEO PROMPTS (scene1Prompt, scene2Prompt, scene3Prompt & script.sceneX.googleFlowPrompt):
Every AI video prompt MUST be a single fluid narrative sentence adhering strictly to this format:
"A 9:16 vertical [shot variation] shot of ${expectedCreatorDescriptor} [setting]. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"[exact spoken dialogue text]\\". [Action / lighting], UGC style, 8 seconds."

CONTROLLED SHOT VARIATION GUIDELINES:
- Scene 1: close-up / medium close-up / over-the-shoulder reaction
- Scene 2: medium shot / medium close-up / insert shot to product or screen
- Scene 3: close-up / medium shot / slight push-in CTA shot

MANDATORY RULES:
1. ALWAYS start with "A 9:16 vertical ... shot of ${expectedCreatorDescriptor}".
2. ALWAYS use the exact phrase "speaking in Indonesian".
3. ALWAYS include the spoken monologue in quotes after "synchronizing to: ".
4. ALWAYS end with "UGC style, 8 seconds."
5. DO NOT shorten, simplify, or modify this Google Flow formula.

Output MUST be a valid JSON object strictly matching this schema:
{
  "formatMode": "3_scene",
  "characterSource": "${ugcCharacterSource}",
  "gender": "${resolvedGender}",
  "ageRange": "${resolvedAge}",
  "characterProfile": {
    "id": "${selectedChar ? selectedChar.id : `char_${Date.now()}`}",
    "name": "${selectedChar ? selectedChar.name : (resolvedGender === 'male' ? 'Rian - Kreator Video' : 'Sarah - Kreator Video')}",
    "gender": "${resolvedGender}",
    "ageRange": "${resolvedAge}",
    "faceAndAppearance": "Detail deskripsi wajah, usia, gaya rambut, dan ekspresi karakter dalam Bahasa Indonesia",
    "clothing": "Detail pakaian dan outfit karakter dalam Bahasa Indonesia",
    "speakingStyle": "Gaya bicara, intonasi, dan ekspresi emosional dalam Bahasa Indonesia",
    "locationSetting": "Lokasi dan setting tempat pengambilan video dalam Bahasa Indonesia",
    "consistencyDescription": "Instruksi ketat konsistensi karakter untuk AI generator dalam Bahasa Indonesia"
  },
  "characterReferenceImagePrompt": "Master Character Reference Photo. Vertical 9:16 aspect ratio (--ar 9:16). Photorealistic headshot portrait of ${expectedCreatorDescriptor}, wearing [clothing]. Authentic candid indoor room lighting, natural skin texture with visible pores, realistic eyes, soft daylight, high resolution mobile camera photo --no cgi, 3d render, plastic skin, cartoon, deformed.",
  "sceneVisualPrompts": {
    "scene1ReferenceImagePrompt": "Vertical 9:16 realistic photo (--ar 9:16). Medium close-up of ${expectedCreatorDescriptor}, reacting with concern to their smartphone screen. [visual], candid mobile camera style, natural window daylight, authentic skin texture, 100% same character facial identity, no CGI.",
    "scene2ReferenceImagePrompt": "Vertical 9:16 realistic photo (--ar 9:16). Medium shot of ${expectedCreatorDescriptor}, smiling warmly while holding their smartphone to demonstrate a product solution. [visual], bright indoor room lighting, clean candid photo, realistic hands, 100% same character facial identity, no CGI.",
    "scene3ReferenceImagePrompt": "Vertical 9:16 realistic photo (--ar 9:16). Close-up portrait of ${expectedCreatorDescriptor}, smiling confidently and gesturing downward toward the bottom screen CTA. [visual], warm ambient room lighting, engaging creator photo style, 100% same character facial identity, no CGI."
  },
  "script": {
    "scene1": {
      "title": "Scene 1: Hook (8 Detik)",
      "time": "8s duration",
      "objective": "Hook",
      "visualDescription": "Deskripsi adegan visual Meta Ads dalam Bahasa Indonesia",
      "audioScript": "Naskah ucapan audio karakter Scene 1 dalam Bahasa Indonesia (punchy, jujur, cepat)",
      "onScreenText": "Teks overlay layar HP (max 6 kata, singkat & menyetop scroll)",
      "subtitleText": "Rekomendasi subtitle layar mobile untuk penonton tanpa suara (sound-off)",
      "ctaText": "Teks badge/stiker hook Meta Ads",
      "emotion": "Ekspresi & emosi karakter",
      "cameraDirection": "close-up",
      "googleFlowPrompt": "A 9:16 vertical close-up shot of ${expectedCreatorDescriptor} in front of a laptop. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"...\\". Natural indoor lighting, UGC style, 8 seconds."
    },
    "scene2": {
      "title": "Scene 2: Solution (8 Detik)",
      "time": "8s duration",
      "objective": "Solution",
      "visualDescription": "Deskripsi adegan visual Meta Ads dalam Bahasa Indonesia",
      "audioScript": "Naskah ucapan audio karakter Scene 2 dalam Bahasa Indonesia",
      "onScreenText": "Teks overlay penawaran/solusi",
      "subtitleText": "Rekomendasi subtitle layar mobile untuk penonton tanpa suara (sound-off)",
      "ctaText": "Teks Tombol/Stiker CTA Meta Ads",
      "emotion": "Ekspresi & emosi karakter",
      "cameraDirection": "medium shot",
      "googleFlowPrompt": "A 9:16 vertical medium shot of ${expectedCreatorDescriptor} holding a smartphone demonstrating the solution. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"...\\". Natural indoor lighting, UGC style, 8 seconds."
    },
    "scene3": {
      "title": "Scene 3: CTA (8 Detik)",
      "time": "8s duration",
      "objective": "CTA",
      "visualDescription": "Deskripsi adegan visual Meta Ads dalam Bahasa Indonesia",
      "audioScript": "Naskah ucapan audio karakter Scene 3 dalam Bahasa Indonesia",
      "onScreenText": "Teks overlay CTA/Proof",
      "subtitleText": "Rekomendasi subtitle layar mobile untuk penonton tanpa suara (sound-off)",
      "ctaText": "Teks Tombol/Stiker CTA Meta Ads",
      "emotion": "Ekspresi & emosi karakter",
      "cameraDirection": "slight push-in CTA",
      "googleFlowPrompt": "A 9:16 vertical slight push-in CTA shot of ${expectedCreatorDescriptor} smiling confidently and gesturing downward. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"...\\". Natural indoor lighting, UGC style, 8 seconds."
    }
  },
  "googleFlowPrompts": {
    "scene1Prompt": "A 9:16 vertical close-up shot of ${expectedCreatorDescriptor} in front of a laptop. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"...\\". Natural indoor lighting, UGC style, 8 seconds.",
    "scene2Prompt": "A 9:16 vertical medium shot of ${expectedCreatorDescriptor} holding a smartphone demonstrating the solution. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"...\\". Natural indoor lighting, UGC style, 8 seconds.",
    "scene3Prompt": "A 9:16 vertical slight push-in CTA shot of ${expectedCreatorDescriptor} smiling confidently and gesturing downward. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: \\"...\\". Natural indoor lighting, UGC style, 8 seconds."
  }
}

Important rules:
1. All descriptions in script (visualDescription, audioScript) and character profile MUST be in Bahasa Indonesia.
2. The image prompts and googleFlowPrompts MUST be in English.
3. Every video prompt MUST follow the exact format: start with "A 9:16 vertical ... shot", contain the phrase "speaking in Indonesian", and end with "8 seconds."
4. If a character profile from the library was provided or reference model image uploaded, use those EXACT details so the prompts match the character.
`;

      const response = await generateAIContent(promptContext, systemInstruction);
      const parsed = safeParseJSON(response.text, null);

      if (parsed && parsed.characterProfile && parsed.script) {
        const charProf = parsed.characterProfile;
        const masterPrompt = parsed.characterReferenceImagePrompt || `Authentic UGC creator portrait photo of ${charProf.faceAndAppearance || 'Indonesian creator'}, wearing ${charProf.clothing || 'casual outfit'}, location in ${charProf.locationSetting || 'modern room'}, 8k resolution, photorealistic, natural skin texture, realistic lighting`;
        const generatedAvatarUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(masterPrompt)}?width=512&height=912&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

        const finalAvatarUrl =
          ugcCharacterSource === "upload"
            ? ugcModelImage || generatedAvatarUrl
            : ugcCharacterSource === "library"
            ? selectedChar?.avatarImageUrl || charProf.avatarImageUrl || generatedAvatarUrl
            : generatedAvatarUrl;

        const finalOutput = {
          ...parsed,
          characterSource: ugcCharacterSource,
          gender: resolvedGender,
          ageRange: resolvedAge,
          characterProfile: {
            ...charProf,
            gender: resolvedGender,
            ageRange: resolvedAge,
            avatarImageUrl: finalAvatarUrl
          },
          digitalProductTitle: ugcDigitalProductTitle,
          productCoverImage: ugcProductCoverImage,
          modelImage: ugcCharacterSource === "upload" ? ugcModelImage : undefined
        };

        setUgcOutput(finalOutput);
        setActiveSubTab("output");
        toast.success("Paket Produksi Video Ads dengan Karakter & Google Flow Prompts berhasil dibuat!");
        saveStateToProject({
          ugcOutput: finalOutput,
          adsInputState: {
            ...project?.adsInputState,
            ugcCharacterSource,
            ugcGender,
            ugcAgeRange,
            scene1Note,
            scene2Note,
            scene3Note,
          },
        });
      } else {
        toast.error("Format AI tidak sesuai. Silakan coba lagi.");
      }
    } catch (err) {
      handleAIError(err, "Gagal membuat Video Ads dengan Karakter.");
    } finally {
      setUgcLoading(false);
    }
  };

  const hasOutput = (activeFormat === "image" && generatedAngles.length > 0) || 
                    (activeFormat === "carousel" && generatedCarousel.length > 0) || 
                    (activeFormat === "video" && (generatedVideoDirections.length > 0 || !!ugcOutput)) ||
                    (activeFormat === "landing");

  return (
    <div className="space-y-6 pb-20" id="creative-ads-system">
      
      {/* SECTION HEADER - STEP 10 FINAL REVIEW & LAUNCH HUB (ONLY SHOWN IN MAIN REVIEW TAB) */}
      {activeFormat === "review" && (
        <div className="relative p-4 md:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden self-center mb-3 text-left">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> STEP 10: REVIEW & EKSEKUSI
              </div>
              <h2 className="text-base md:text-lg font-heading font-black tracking-tight text-white uppercase leading-snug">
                Review Kesiapan & Eksekusi Meta Ads
              </h2>
              <p className="text-slate-300 text-[11.5px] leading-tight font-sans">
                Riset, copy, prompt visual, dan aset Meta Ads siap ditinjau atau diexport.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <Button
                onClick={handleFullAIOptimization}
                disabled={globalLoading}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase tracking-wider text-[10.5px] h-8.5 px-3.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                id="global-optimize-btn"
              >
                {globalLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sinkronisasi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Optimasi AI</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => {
                  const success = downloadEcosystemBlueprint(project);
                  if (success) {
                    toast.success("Blueprint ALCO (alco_ecosystem_blueprint.json) berhasil diunduh!");
                  }
                }}
                variant="outline"
                size="sm"
                title="Gunakan file ini untuk Content Engine dan Product Forge"
                className="border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-wider text-[10.5px] h-8.5 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Download Blueprint ALCO</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATIVE AD FORMAT SELECTOR HUB - 5 MASTER CREATOR STUDIOS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              PILIH STUDIO KONTEN & REVIEW (STEP 10):
            </span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground hidden sm:inline-block">
            Klik studio untuk membuka workspace & hasil
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {[
            {
              id: "review",
              title: "1. Launch Review Hub",
              badge: "Eksekusi Total",
              desc: "Tinjau Kesiapan & Export Pack Final",
              icon: Target,
              activeColor: "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/20 shadow-md",
              badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
              iconColor: "text-emerald-400",
            },
            {
              id: "image",
              title: "2. Gambar Iklan",
              badge: generatedAngles.length > 0 ? "✓ 3 Angles" : "Single Image",
              desc: "Angle Single Image (Prompt & Copy)",
              icon: ImageIcon,
              activeColor: "border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-indigo-500/20 shadow-md",
              badgeColor: generatedAngles.length > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
              iconColor: "text-indigo-400",
            },
            {
              id: "carousel",
              title: "3. Carousel",
              badge: generatedCarousel.length > 0 ? "✓ 5 Slides" : "Carousel Deck",
              desc: "Cerita 5 Slide (Hook → Offer → CTA)",
              icon: Layers,
              activeColor: "border-purple-500 bg-purple-500/10 text-purple-400 ring-2 ring-purple-500/20 shadow-md",
              badgeColor: generatedCarousel.length > 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30",
              iconColor: "text-purple-400",
            },
            {
              id: "video",
              title: "4. Video Ads dengan Karakter",
              badge: ugcOutput ? "✓ 3 Scene Pack" : "Karakter & Script",
              desc: "Karakter AI, 3 Scene Google Flow & Script",
              icon: Film,
              activeColor: "border-rose-500 bg-rose-500/10 text-rose-400 ring-2 ring-rose-500/20 shadow-md",
              badgeColor: ugcOutput ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30",
              iconColor: "text-rose-400",
            },
            {
              id: "landing",
              title: "5. Landing Page",
              badge: "Hero & Offer",
              desc: "Headline, Offer Stack & Structure LP",
              icon: Layout,
              activeColor: "border-cyan-500 bg-cyan-500/10 text-cyan-400 ring-2 ring-cyan-500/20 shadow-md",
              badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
              iconColor: "text-cyan-400",
            },
          ].map((studio) => {
            const isSel = activeFormat === studio.id;
            const Icon = studio.icon;
            return (
              <button
                key={studio.id}
                type="button"
                onClick={() => {
                  setActiveFormat(studio.id as any);
                  saveStateToProject({ adsInputState: { activeFormat: studio.id } });
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 relative group shadow-sm",
                  isSel
                    ? studio.activeColor
                    : "bg-card border-border hover:bg-secondary/40 hover:border-border/80"
                )}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <div className={cn("p-1.5 rounded-lg bg-background/80 border border-border/50 shrink-0", studio.iconColor)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={cn("text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border font-mono tracking-wider shrink-0", studio.badgeColor)}>
                    {studio.badge}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h4 className={cn("text-[11.5px] font-heading font-black uppercase tracking-tight line-clamp-1", isSel ? "text-foreground" : "text-foreground/90")}>
                    {studio.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-sans line-clamp-2 leading-tight">
                    {studio.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB NAVIGATOR & STUDIO STATUS HEADER FOR INDIVIDUAL CREATOR STUDIOS */}
      {activeFormat !== "landing" && activeFormat !== "review" && (
        <div className="p-3 md:p-3.5 bg-card border border-border/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm my-1.5">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold text-sm shrink-0">
              {activeFormat === "image" && <ImageIcon className="w-5 h-5 text-indigo-400" />}
              {activeFormat === "carousel" && <Layers className="w-5 h-5 text-purple-400" />}
              {activeFormat === "video" && <Film className="w-5 h-5 text-rose-400" />}
            </div>
            <div>
              <h3 className="text-sm md:text-base font-heading font-black uppercase tracking-tight text-foreground">
                {activeFormat === "image" && "Studio 2: Gambar Iklan (3 Angles A/B/C)"}
                {activeFormat === "carousel" && "Studio 3: Carousel Ads (5-Slide Story Pack)"}
                {activeFormat === "video" && "Studio 4: Video Ads dengan Karakter & Google Flow AI"}
              </h3>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {activeFormat === "image" && "Formulasikan prompt foto fotorealistik (Emosional, Solusi, Lifestyle) + copywriting iklan."}
                {activeFormat === "carousel" && "Buat naskah & prompt visual 5 slide edukasi & penawaran berurutan."}
                {activeFormat === "video" && "Rancang karakter visual konsisten, naskah 3 scene (Hook • Solution • CTA), dan prompt video Google Flow."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/80 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setActiveSubTab("output")}
                className={cn(
                  "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeSubTab === "output"
                    ? "bg-indigo-600 text-white shadow-md font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ Hasil Output</span>
                {hasOutput && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("form");
                  setShowAdvancedSettings(true);
                }}
                className={cn(
                  "flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  activeSubTab === "form"
                    ? "bg-indigo-600 text-white shadow-md font-black"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>⚙️ Parameter</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveFormat("review");
                saveStateToProject({ adsInputState: { activeFormat: "review" } });
              }}
              className="h-10 px-3.5 text-xs font-black uppercase tracking-wider border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Ke Review Hub</span>
            </Button>
          </div>
        </div>
      )}

      {/* INSTANT LAUNCH PAD / EMPTY STATE FOR OUTPUT TAB WHEN NOTHING HAS BEEN GENERATED YET */}
      {activeFormat !== "landing" && activeFormat !== "review" && activeSubTab === "output" && !hasOutput && (
        <Card className="p-8 md:p-12 text-center border border-border bg-card rounded-3xl max-w-2xl mx-auto space-y-6 shadow-md animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> REKOMENDASI AI SIAP TERINTEGRASI
            </div>
            <h3 className="text-xl font-heading font-black uppercase tracking-tight text-foreground">
              {activeFormat === "video"
                ? "Formulasikan Video Ads dengan Karakter & Google Flow"
                : `Generate Konten ${activeFormat === "image" ? "Single Image" : "Carousel Deck"} Siap Pakai`}
            </h3>
            <p className="text-xs text-muted-foreground font-sans max-w-md mx-auto leading-relaxed">
              {activeFormat === "video"
                ? "Rancang profil karakter konsisten & naskah 3 scene (Hook 8s • Solution 8s • CTA 8s) lengkap dengan prompt Google Flow siap pakai."
                : "Seluruh data riset Step 1–8 telah terintegrasi secara otomatis. Tekan tombol di bawah untuk langsung menghasilkan copywriting dan prompt visual instan."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              onClick={() => {
                if (activeFormat === "image") handleGenerateAngles();
                else if (activeFormat === "carousel") handleGenerateCarousel();
                else if (activeFormat === "video") {
                  handleGenerateUGCCharacterFlow();
                }
              }}
              disabled={anglesLoading || carouselLoading || ugcLoading}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-xs h-12 px-7 rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {(anglesLoading || carouselLoading || ugcLoading) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Konten AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {activeFormat === "video"
                      ? "Generate Video Ads dengan Karakter"
                      : `Generate Konten ${activeFormat.toUpperCase()} Sekarang`}
                  </span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActiveSubTab("form");
                if (activeFormat !== "video") {
                  setShowAdvancedSettings(true);
                }
              }}
              className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground h-12 px-5 rounded-xl border-border cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeFormat === "video" ? "Buka Form Video Karakter" : "⚙️ Edit Detail Parameter"}</span>
            </Button>
          </div>
        </Card>
      )}

      {activeFormat === "review" ? (
        <CampaignPackReviewHub 
          project={project} 
          onSaveProject={saveStateToProject} 
          onSwitchTab={(tab) => setActiveFormat(tab)} 
        />
      ) : activeFormat === "landing" ? (
        <LandingBuilder project={project} />
      ) : (
        <div className="w-full space-y-8">
        
        {/* MAIN CREATIVE DIRECTION ENTRANCE FORM CONTROLLER */}
        <div className="space-y-8 w-full">
          
          {activeFormat === "image" && (
            <>
              {activeSubTab === "form" && (
                <div className="p-5 bg-card border border-border/80 rounded-2xl shadow-sm text-left space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                        <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                          ⚙️ Detail Parameter & Direction Kreatif (Single Image)
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Seluruh 9 parameter teknis telah diselaraskan otomatis berdasarkan hasil riset Step 1–8.
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="h-9 px-4 text-xs font-extrabold uppercase tracking-wider rounded-xl border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{showAdvancedSettings ? "Sembunyikan Detail" : "Edit Detail Parameter"}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showAdvancedSettings && "rotate-180")} />
                    </Button>
                  </div>

                  {!showAdvancedSettings && (
                    <div className="p-3.5 bg-secondary/25 rounded-xl border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
                        <span className="font-extrabold text-foreground">Status Parameter:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          ✓ Ter-Optimasi AI (Default)
                        </span>
                        <span className="text-muted-foreground font-medium">
                          Platform: {platform} | Rasio: {imageFormat} | Flow: {emotionalFlow} | CTA: {ctaStyle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedSettings(true)}
                        className="text-[10.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                      >
                        Ubah Detail Parameter &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE OUTPUTS PANEL */}
              {activeSubTab === "output" && generatedAngles.length > 0 && (
                <div className="p-6 md:p-8 bg-card border border-indigo-500/30 rounded-[2rem] shadow-xl text-left animate-in fade-in duration-300 space-y-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> Output Ready for A/B/C Campaign Deployment (Image)
                    </div>
                    <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Hasil Promosi Multi-Angle Image
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">
                      AI telah menganalisis input kampanye dan menghasilkan 3 Angle Iklan Image yang siap digunakan.
                    </p>
                  </div>

                  {/* TAB SELECTOR */}
                  <div className="flex flex-col md:flex-row gap-2.5 p-1.5 bg-secondary/35 border border-border/80 rounded-2xl">
                    {[
                      { id: "A", name: "🔥 A. Emotional", desc: "Pain → Relief Focus" },
                      { id: "B", name: "⚡ B. Problem-Solution", desc: "Core Problem Resolving" },
                      { id: "C", name: "💎 C. Aspirational", desc: "Status Upgrade & Dream" }
                    ].map((tab) => {
                      const isSelected = selectedAngle === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedAngle(tab.id)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[50px]",
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                              : "bg-card text-foreground border-border/60 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{tab.name}</span>
                          <span className={cn("text-[8px] font-medium mt-0.5 opacity-80", isSelected ? "text-indigo-100" : "text-muted-foreground")}>
                            {tab.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ANGLE ANALYSIS BOX */}
                  {generatedAngles.map((angle) => {
                    if (angle.id !== selectedAngle) return null;

                    return (
                      <div key={angle.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                        {/* LEFT COLUMN: PROMPT ENGINE AND GENERATOR HUB (occupying 7/12 width) */}
                        <div className="lg:col-span-7 space-y-6">
                          
                          {/* 1. STRUCTURED GEN-PROMPT BOX (PROMINENT AND INSTANTLY VISIBLE) */}
                          <div className="p-5 border border-slate-800 bg-slate-950 text-slate-100 rounded-[1.75rem] shadow-lg space-y-4 font-mono text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3 relative z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="text-left">
                                  <span className="text-[10px] uppercase font-black tracking-widest font-sans text-indigo-400 block">HASIL SALINAN PROMPT</span>
                                  <h4 className="text-[11px] font-bold font-sans text-slate-200">Copyable Image Gen Prompt</h4>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleCopyPrompt(angle.finalPrompt)}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 rounded-xl text-[10px] font-heading font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy Prompt
                              </Button>
                            </div>

                            <p className="text-[10px] text-indigo-300/80 normal-case leading-relaxed font-sans bg-indigo-950/20 p-3 rounded-xl border border-indigo-950/30">
                              📍 Salin prompt visual di bawah secara utuh, lalu gunakan pada generator gambar pilihan Anda di bawah untuk mendapatkan visual kampanye berkualitas premium!
                            </p>

                            <pre className="text-[10px] leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto pr-2 text-indigo-200 bg-[#020512]/60 p-4 rounded-xl border border-indigo-950/40 select-text">
                              {angle.finalPrompt}
                            </pre>
                          </div>

                          {/* 2. VISUAL ADS GENERATOR HUB (RE-POSITIONED TO DIRECTLY UNTERNEATH THE PROMPT) */}
                          <div className="p-6 bg-card border border-border/80 rounded-[1.75rem] space-y-4 shadow-sm text-left">
                            <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                              <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
                              <div className="text-left">
                                <h4 className="text-xs font-heading font-black text-foreground uppercase tracking-tight">
                                  Visual Ads Generator Hub
                                </h4>
                                <p className="text-[9.5px] text-muted-foreground font-sans">Kirim perintah gambar hasil generate ke studio AI pembuat gambar di bawah:</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* ChatGPT Box */}
                              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col justify-between gap-3 text-left">
                                <div className="space-y-1 block">
                                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">🟢 DALL-E 3 (ChatGPT)</span>
                                  <p className="text-[9.5px] text-muted-foreground font-sans leading-relaxed">Sangat ideal untuk ilustrasi komersial & adegan harian bersih.</p>
                                </div>
                                <a
                                  href="https://chatgpt.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleCopyPrompt(angle.finalPrompt)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-heading font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                  Open ChatGPT
                                </a>
                              </div>

                              {/* Google Gemini Box */}
                              <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-between gap-3 text-left">
                                <div className="space-y-1 block">
                                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1 font-bold">🟣 Imagen 3 (Gemini)</span>
                                  <p className="text-[9.5px] text-muted-foreground font-sans leading-relaxed">Sangat kuat untuk subjek manusia fotorealistis & tata cahaya natural.</p>
                                </div>
                                <a
                                  href="https://gemini.google.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleCopyPrompt(angle.finalPrompt)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-heading font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                  Open Gemini
                                </a>
                              </div>

                              {/* Instan Server Box */}
                              <div className="p-4 bg-slate-500/5 dark:bg-slate-500/10 border border-slate-500/20 rounded-2xl flex flex-col justify-between gap-3 text-left">
                                <div className="space-y-1 block">
                                  <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1 font-bold">🔘 Instan Server</span>
                                  <p className="text-[9.5px] text-muted-foreground font-sans leading-relaxed">Lihat pratinjau instan rendering gambar tanpa kredensial berbayar.</p>
                                </div>
                                <a
                                  href={getPollinationsUrl(angle.finalPrompt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-[10px] font-heading font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                                >
                                  Render Instan
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: VISUAL AD STRATEGY MATRIX (occupying 5/12 width side-by-side) */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className="p-5.5 bg-[#fcfcfd] dark:bg-zinc-900/40 border border-border rounded-[1.75rem] space-y-4 shadow-sm text-left">
                            <div className="pb-2.5 border-b border-border/60">
                              <span className="text-[8px] font-mono font-black text-indigo-500 uppercase tracking-[0.2em] block">STRATEGY LAYER</span>
                              <h4 className="text-xs font-heading font-black uppercase text-foreground tracking-wider block">
                                Visual Ad Strategy Matrix
                              </h4>
                            </div>

                            <div className="space-y-4 text-left">
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">1. Target Emotion</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.targetEmotion}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">2. Visual Strategy</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.visualStrategy}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">3. Hook Strategy</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.hookStrategy}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">4. Color Psychology</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.colorPsychology}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-secondary/20 rounded-xl border border-secondary/35">
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-500 tracking-widest block">5. Layout Strategy</span>
                                <span className="text-[11px] font-bold text-foreground block leading-relaxed">{angle.layoutStrategy}</span>
                              </div>
                              <div className="space-y-1 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <span className="text-[8.5px] uppercase font-mono font-black text-emerald-600 tracking-widest block">6. CTA Recommendation</span>
                                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 block leading-relaxed">{angle.ctaRecommendation}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

          {activeSubTab === "form" && showAdvancedSettings && (
            <>
              {/* INPUT FIELDS CARDS */}
              <div className="space-y-6">

            {/* 1. Platform Optimization */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                      Platform Optimization
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Fokus distribusi saluran iklan utama</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("platform")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("platform")}
                      disabled={loadingField.platform}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.platform ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={toScalarString(platform, "Instagram Feed")}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {PLATFORM_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.platform?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.platform?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Image Ratio Format */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                      Image Format Ratio
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Aspek rasio piksel dimensi konten</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("imageFormat")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("imageFormat")}
                      disabled={loadingField.imageFormat}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.imageFormat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <div className="grid grid-cols-4 gap-2">
                      {FORMAT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setImageFormat(opt)}
                          className={cn(
                            "py-2 px-1 rounded-xl border font-mono font-bold text-[11px] transition-all",
                            imageFormat === opt 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                              : "bg-secondary/35 text-foreground border-border/80 hover:bg-secondary/60"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.imageFormat?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.imageFormat?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Emotional Flow */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">3</span>
                      Emotional Flow Direction
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Transisi psikologis yang diadopsi gambar</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("emotionalFlow")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("emotionalFlow")}
                      disabled={loadingField.emotionalFlow}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.emotionalFlow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5 space-y-3">
                    <select
                      value={toScalarString(emotionalFlow, "Frustration -> Relief")}
                      onChange={(e) => setEmotionalFlow(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {EMOTIONAL_FLOW_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    {emotionalFlow === "Custom" && (
                      <textarea
                        value={customEmotionalFlow}
                        onChange={(e) => setCustomEmotionalFlow(e.target.value)}
                        placeholder="Tuliskan transisi emosi khusus (misal: Sceptical -> Astonished)"
                        className="w-full min-h-[80px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.emotionalFlow?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.emotionalFlow?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. Visual Hook Focus */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">4</span>
                      Visual Hook Focus
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Titik utama penangkap atensi mata</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("visualHookFocus")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("visualHookFocus")}
                      disabled={loadingField.visualHookFocus}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.visualHookFocus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={toScalarString(visualHookFocus, "Transformation")}
                      onChange={(e) => setVisualHookFocus(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {VISUAL_HOOK_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.visualHookFocus?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.visualHookFocus?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 5. Style Direction */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">5</span>
                      Style Direction Multi-Select
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Gabungan atmosfer visual & teknik render</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    {recommendations.styleDirection?.recommendedValue && (
                      <Button
                        onClick={() => applyRecommendedStyles(recommendations.styleDirection.recommendedValue)}
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                      </Button>
                    )}
                    <Button
                      onClick={() => handleRegenerateSuggestion("styleDirection")}
                      disabled={loadingField.styleDirection}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.styleDirection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5 space-y-2">
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-wider">Pilih Gaya Visual (Multi-Pilih):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-1 border border-border/40 rounded-xl bg-secondary/15">
                      {STYLE_OPTIONS.map((style) => {
                        const isSelected = styleDirection.includes(style);
                        return (
                          <button
                            key={style}
                            onClick={() => toggleStyleSelection(style)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                              isSelected 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-card text-foreground border-border/70 hover:bg-secondary/40"
                            )}
                          >
                            {isSelected && <span className="text-[8px]">✓</span>}
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">
                        💡 AI Recommendation: {Array.isArray(recommendations.styleDirection?.recommendedValue) ? recommendations.styleDirection.recommendedValue.join(", ") : recommendations.styleDirection?.recommendedValue}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.styleDirection?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 6. Color Strategy */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">6</span>
                      Color Strategy & Psychology
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Formula perpaduan kode warna penunjuk mata</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("colorStrategy")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("colorStrategy")}
                      disabled={loadingField.colorStrategy}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.colorStrategy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5 space-y-4">
                    <textarea
                      value={colorStrategy}
                      onChange={(e) => setColorStrategy(e.target.value)}
                      placeholder="Tuliskan palet warna utama, sekunder, dan aksen untuk gambar"
                      className="w-full min-h-[90px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    {/* Visual Color Picker Swatch Row for Interactive styling */}
                    <div className="flex items-center gap-2.5 p-2 bg-secondary/20 rounded-xl border border-border/20">
                      <span className="text-[9px] uppercase font-black text-muted-foreground">Palet Sampel:</span>
                      <div className="flex -space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-600 shadow-sm border border-card" />
                        <span className="w-5 h-5 rounded-full bg-amber-500 shadow-sm border border-card" />
                        <span className="w-5 h-5 rounded-full bg-slate-900 shadow-sm border border-card" />
                        <span className="w-5 h-5 rounded-full bg-slate-100 shadow-sm border border-card" />
                      </div>
                      <span className="text-[8px] font-bold text-muted-foreground/60 italic">(Interactive Mockup)</span>
                    </div>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Color Strategy Recommendation</span>
                    </div>
                    <p className="text-[11px] font-bold text-foreground">
                      {recommendations.colorStrategy?.recommendedValue}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1">
                      {recommendations.colorStrategy?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 7. Text Density */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">7</span>
                      Text Density
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Batas porsi teks overlay pada kanvas visual</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("textDensity")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("textDensity")}
                      disabled={loadingField.textDensity}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.textDensity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={toScalarString(textDensity, "Minimal Text")}
                      onChange={(e) => setTextDensity(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {TEXT_DENSITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.textDensity?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.textDensity?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 8. CTA Style */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">8</span>
                      CTA Button Style
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Model penawaran penentu tombol ajakan</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("ctaStyle")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("ctaStyle")}
                      disabled={loadingField.ctaStyle}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.ctaStyle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <select
                      value={toScalarString(ctaStyle, "Urgency CTA")}
                      onChange={(e) => setCtaStyle(e.target.value)}
                      className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      {CTA_STYLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation: {recommendations.ctaStyle?.recommendedValue}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      {recommendations.ctaStyle?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 9. Additional Visual Request */}
            <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="space-y-0.5">
                    <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">9</span>
                      Additional Visual Request
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">Instruksi manual ataupun objek spesifik tambahan</p>
                  </div>
                  
                  {/* Field Tools */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAIOptimizeField("additionalRequest")}
                      size="sm"
                      variant="outline"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                    </Button>
                    <Button
                      onClick={() => handleRegenerateSuggestion("additionalRequest")}
                      disabled={loadingField.additionalRequest}
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary"
                    >
                      {loadingField.additionalRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <textarea
                      value={additionalRequest}
                      onChange={(e) => setAdditionalRequest(e.target.value)}
                      placeholder="Tuliskan elemen spesifik lain yang diinginkan (misal: Seorang pebisnis tersenyum lega menatap dasbor laptop cerah, natural, background blurred kantor modern)..."
                      className="w-full min-h-[100px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* AI Suggestion Box */}
                  <div className="md:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">💡 AI Recommendation Refined Request</span>
                    </div>
                    <p className="text-[11px] text-foreground font-bold leading-normal">
                      "{recommendations.additionalRequest?.recommendedValue}"
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t border-border/30 pt-1 mt-1">
                      {recommendations.additionalRequest?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* MAIN GENERATE ACTION WORKSPACE TRIGGER */}
          {!anglesLoading ? (
            <div className="p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-[2.5rem] space-y-6 text-white shadow-xl relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
              
              <div className="relative z-10 space-y-2 max-w-xl text-left">
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 font-bold text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[9px] uppercase tracking-wider leading-none text-left">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> SINGLE PROMPT OPTIMIZE ENGINE
                </div>
                <h3 className="text-xl font-heading font-black uppercase tracking-wide text-white text-left">
                  LANGKAH 2 — Formula & Cetak Prompt Iklan (Satu Prompt)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium text-left">
                  Sesuai arahan terbaru, sistem memproduksi **tepat 1 draf prompt iklan visual terbaik** berdasarkan sudut pandang (angle) terpilih. Hal ini menghemat token API Anda hingga 70% dan memberikan fokus total.
                </p>
              </div>

              {/* INTERACTIVE MARKETING ANGLE SELECTOR */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-3xl relative z-10 space-y-4 text-left w-full my-4">
                <div className="flex items-center gap-2 pb-1 border-b border-white/5 text-left">
                  <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                  <div className="text-left">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block">
                      PILIHAN UTAMA SUDUT PANDANG IKLAN (AD ANGLE):
                    </span>
                    <h3 className="text-xs font-black uppercase text-slate-200">
                      PILIH 1 SUDUT SEBELUM GENERATE PROMPT
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal text-left">
                  Pilih salah satu sudut pandang strategi di bawah ini untuk diformulasikan menjadi satu prompt gambar berkualitas tinggi:
                </p>

                {/* VISUAL LAYOUT SELECTOR CARDS FOR THE 3 ANGLES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "A",
                      title: "🔥 A. Emotional Approach",
                      desc: "Pain to Relief & Kelegaan",
                      detail: "Fokus emosional: transisi perasaan frustrasi audiens ke rasa leganya memakai produk."
                    },
                    {
                      id: "B",
                      title: "⚡ B. Problem-Solution",
                      desc: "Fungsional & Logis",
                      detail: "Fokus logis: penyelesaian rintangan nyata melalui kelebihan detail produk."
                    },
                    {
                      id: "C",
                      title: "💎 C. Aspirational Model",
                      desc: "Status Upgrade & Impian",
                      detail: "Fokus gaya hidup: pencapaian impian, prestise, dan kebanggaan sosial visual premium."
                    }
                  ].map((item) => {
                    const isSelected = imageTargetAngle === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setImageTargetAngle(item.id as any)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-auto gap-2 text-xs relative hover:scale-[1.01] duration-150",
                          isSelected 
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/30" 
                            : "bg-slate-950/40 hover:bg-slate-950/70 border-slate-850 text-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn("text-[11px] font-black uppercase tracking-tight", isSelected ? "text-indigo-400" : "text-slate-200")}>
                            {item.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </div>
                        <div className="space-y-0.5 block text-left">
                          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">{item.desc}</span>
                          <span className="text-[10px] text-slate-400 leading-relaxed block">{item.detail}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SHOW STEP 7 SELECTED OPTION IF SAVED */}
                {project?.marketingAngles?.selectedOption && (
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3 text-left text-xs animate-in fade-in duration-200 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-left">
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-400 block">
                        ✅ STRATEGI TERKONEKSI (STEP 7: ANGLE TERPILIH):
                      </span>
                      <p className="font-bold text-slate-200">
                        "{project.marketingAngles.selectedOption.angle_set_title}" — Hook: "{project.marketingAngles.selectedOption.hook}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative z-10 pt-2 text-center md:text-left">
                <Button 
                  onClick={handleGenerateAngles}
                  disabled={anglesLoading}
                  className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl transition-all w-full md:w-auto cursor-pointer"
                  id="generate-angles-btn"
                >
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse text-amber-300" />
                  Generate Prompt Angle {imageTargetAngle === "A" ? "A (Emotional)" : imageTargetAngle === "B" ? "B (Solusi)" : "C (Aspirasi)"}
                </Button>
              </div>
            </div>
          ) : (
            /* DYNAMIC ENTERTAINING THINKER LOUNGE FOR SINGLE IMAGE */
            <div className="p-8 bg-slate-950 border border-indigo-500/30 rounded-[2rem] text-left space-y-6 text-white shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                      <Brain className="w-5 h-5 text-indigo-400 rotate-12 duration-1000 animate-pulse" />
                    </div>
                    {/* Glowing ring */}
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-black uppercase tracking-wider text-white">PROSEDUR ANALISIS KREATIF AKTIF</h4>
                    <p className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">MODEL: GOOGLE GEMINI 2.5 • SENSITIVITAS KONVERSI TINGGI</p>
                  </div>
                </div>
                <div className="text-[10px] font-mono px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-slate-300 h-7 flex items-center shrink-0">
                  Status: <span className="text-amber-400 animate-pulse font-bold ml-1">AI SEDANG BERPIKIR...</span>
                </div>
              </div>

              {/* Dynamic steps queue */}
              <div className="space-y-3 relative z-10">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">ALUR PEMIKIRAN STRATEGI VISUAL:</p>
                
                <div className="space-y-2">
                  {THOUGHT_STEPS.map((stepText, idx) => {
                    const isDone = idx < activeThoughtIdx;
                    const isActive = idx === activeThoughtIdx;

                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 transform",
                          isActive 
                            ? "bg-indigo-600/10 border-indigo-500/30 text-white translate-x-1" 
                            : isDone
                              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-70"
                              : "bg-white/5 border-transparent text-slate-600 opacity-30"
                        )}
                      >
                        <div className="shrink-0">
                          {isDone ? (
                            <div className="w-4 h-4 rounded-full bg-emerald-500/25 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold">✓</div>
                          ) : isActive ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white/5 text-slate-600 flex items-center justify-center text-[9px] font-mono">{idx + 1}</div>
                          )}
                        </div>
                        <span className="leading-tight">{stepText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Saling edukasi edukatif */}
              <div className="p-4.5 bg-indigo-500/5 rounded-2xl border border-indigo-500/15 flex items-start gap-3 relative z-10">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce text-amber-300" />
                <div className="space-y-0.5 text-left">
                  <p className="text-xs font-black text-white uppercase tracking-wider">💡 Tahukah Anda?</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                    Setiap prompt gambar yang didesain AI ini telah mematuhi strict visual engineering Meta Ads konversi tinggi, menghindari penataan hiasan Digital Art palsu agar iklan Anda terasa organik & natural dan melipatgandakan Click-Through Rate (CTR).
                  </p>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </>
      )}

          {activeFormat === "carousel" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {activeSubTab === "form" && (
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-heading font-black text-foreground uppercase tracking-tight">
                      CAROUSEL — Ad Strategy Configuration
                    </h2>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                    Configuring sequential slider ads
                  </span>
                </div>
              )}

              {/* CAROUSEL OUTPUT PANELS */}
              {activeSubTab === "output" && generatedCarousel.length > 0 && (
                <div className="p-6 md:p-8 bg-card border border-indigo-500/30 rounded-[2rem] shadow-xl text-left animate-in fade-in duration-300 space-y-6">
                  {/* Title and summary */}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Layers className="w-3" /> Output Ready for Carousel Strategy
                    </div>
                    <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Sequential Slide-by-Slide Blueprint
                    </h3>
                    <p className="text-[10.5px] text-muted-foreground">
                      AI telah menterjemahkan konsep Anda ke dalam slide bercerita yang runtut. Salin prompt gambar dan copywriting masing-masing slide di bawah ini.
                    </p>
                  </div>

                  {/* TAB SELECTOR */}
                  <div className="flex flex-col md:flex-row gap-2.5 p-1.5 bg-secondary/35 border border-border/80 rounded-2xl">
                    {[
                      { id: "A", name: "🔥 A. Storytelling", desc: "Customer journey path" },
                      { id: "B", name: "⚡ B. Feature Details", desc: "Benefit highlights" },
                      { id: "C", name: "💎 C. Edu-Framework", desc: "Teaches 3-step value" }
                    ].map((tab) => {
                      const isSelected = selectedCarouselOption === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedCarouselOption(tab.id)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[50px]",
                            isSelected 
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                              : "bg-card text-foreground border-border/60 hover:bg-secondary/40"
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{tab.name}</span>
                          <span className={cn("text-[8px] font-medium mt-0.5 opacity-80", isSelected ? "text-indigo-100" : "text-muted-foreground")}>
                            {tab.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SELECTED CAROUSEL OPTION */}
                  {generatedCarousel.map((option) => {
                    if (option.id !== selectedCarouselOption) return null;

                    return (
                      <div key={option.id} className="space-y-5 animate-in fade-in duration-300 text-left">
                        <div className="p-4 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-xl">
                          <span className="text-[8px] text-indigo-500 font-mono font-black uppercase tracking-widest block">🎯 MAIN NARRATIVE CONCEPT</span>
                          <p className="text-xs font-bold text-foreground mt-0.5 leading-relaxed">{option.mainConcept}</p>
                        </div>

                        {/* SLIDES storybook sequence */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1 pb-1 border-b border-border/50">
                            📊 Carousel Slide Storyboard ({option.slides.length} Slides)
                          </h4>

                          <div className="grid grid-cols-1 gap-3.5">
                            {option.slides.map((slide: any) => (
                              <Card key={slide.slideNumber} className="border border-border rounded-xl p-4 shadow-sm bg-card hover:bg-secondary/10 transition-all">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                  {/* Slide info and copy text */}
                                  <div className="lg:col-span-12 xl:col-span-4 space-y-2 flex flex-col justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-6 h-6 bg-indigo-600 text-white font-mono font-black text-[11px] rounded-full flex items-center justify-center">
                                          {slide.slideNumber}
                                        </span>
                                        <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">
                                          {slide.slideNumber === 1 ? "Slide 1: HOOK" : slide.slideNumber === option.slides.length ? "Slide Final: CTA" : `Slide ${slide.slideNumber}`}
                                        </span>
                                      </div>

                                      {/* Copy text block */}
                                      <div className="space-y-1.5 bg-secondary/20 p-3 rounded-xl border border-border/30 text-left">
                                        <div>
                                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black block">HEADLINE TEXT</span>
                                          <h5 className="text-[11.5px] font-black text-foreground leading-snug">{slide.headline}</h5>
                                        </div>
                                        <div className="border-t border-border/30 pt-1.5">
                                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black block">BODY TEXT</span>
                                          <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{slide.body}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visual prompt for the slide image */}
                                  <div className="lg:col-span-12 xl:col-span-5 space-y-1.5 font-mono flex flex-col">
                                    <div className="p-3.5 bg-slate-950 border border-slate-900 text-slate-100 rounded-xl flex flex-col justify-between gap-2 text-left h-full">
                                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-400 font-sans">SLIDE IMAGE PROMPT (Midjourney / Imagen)</span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyPrompt(slide.imagePrompt)}
                                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[8px] font-sans font-black uppercase tracking-widest flex items-center gap-1"
                                        >
                                          <Copy className="w-3 h-3" /> Copy
                                        </button>
                                      </div>
                                      <div className="text-[9.5px] leading-relaxed text-indigo-200 max-h-[200px] overflow-y-auto pr-1 whitespace-pre-wrap">
                                        {slide.imagePrompt}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dynamic Visual Slide Image Preview */}
                                  <div className="lg:col-span-12 xl:col-span-3 space-y-1.5">
                                    <div className="p-3 bg-secondary/25 border border-border/50 rounded-xl flex flex-col justify-center items-center h-full min-h-[180px] text-center relative group overflow-hidden">
                                      <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground font-sans absolute top-2 left-2 z-10 bg-background/80 px-1.5 py-0.5 rounded border border-border">Preview</span>
                                      
                                      <div className="w-full aspect-square relative rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        <img
                                          src={getPollinationsUrl(slide.imagePrompt)}
                                          alt={`Slide ${slide.slideNumber}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 p-2">
                                          <a
                                            href={getPollinationsUrl(slide.imagePrompt)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-900 text-white rounded text-[8px] font-sans font-black uppercase tracking-widest transition-all"
                                          >
                                            Fullscreen
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          <Button
                            onClick={handleGenerateCarousel}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[9px] px-4 h-10 rounded-xl"
                          >
                            <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Regenerate Carousel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeSubTab === "form" && (
                <div className="p-5 bg-card border border-border/80 rounded-2xl shadow-sm text-left space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                        <h3 className="text-sm font-heading font-black uppercase text-foreground tracking-tight">
                          ⚙️ Detail Parameter & Direction (Carousel Deck)
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-sans">
                        Parameter jumlah slide dan tujuan utama carousel telah diselaraskan otomatis berdasarkan riset Step 1–8.
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="h-9 px-4 text-xs font-extrabold uppercase tracking-wider rounded-xl border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{showAdvancedSettings ? "Sembunyikan Detail" : "Edit Detail Parameter"}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showAdvancedSettings && "rotate-180")} />
                    </Button>
                  </div>

                  {!showAdvancedSettings && (
                    <div className="p-3.5 bg-secondary/25 rounded-xl border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
                        <span className="font-extrabold text-foreground">Status Parameter:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          ✓ Ter-Optimasi AI (Default)
                        </span>
                        <span className="text-muted-foreground font-medium">
                          Jumlah Slide: {carouselSlidesCount} | Goal: {carouselMainGoal?.slice(0, 45)}...
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedSettings(true)}
                        className="text-[10.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer shrink-0"
                      >
                        Ubah Detail Parameter &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === "form" && showAdvancedSettings && (
                <>
                  <div className="space-y-6">
                  {/* 1. Carousel Slides Count */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">1</span>
                          Jumlah Slide Carousel
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Kuantitas optimal kartu cerita bertahap</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeCarouselField("carouselSlidesCount")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateCarouselSuggestion("carouselSlidesCount")}
                          disabled={loadingField.carouselSlidesCount}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.carouselSlidesCount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5">
                        <select
                          value={toScalarNumber(carouselSlidesCount, 5)}
                          onChange={(e) => setCarouselSlidesCount(parseInt(e.target.value))}
                          className="w-full h-11 px-3 py-2 bg-secondary/40 border border-border/80 rounded-xl font-bold text-xs text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>{num} Slide</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1 text-left">
                        <span className="text-[9px] uppercase font-black text-indigo-500 block">💡 Rekomendasi AI</span>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          {carouselRecommendations.carouselSlidesCount?.recommendedValue} slide
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                          {carouselRecommendations.carouselSlidesCount?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Carousel Main Goal */}
                <Card className="p-6 border border-border/70 rounded-3xl bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="space-y-0.5">
                        <label className="text-xs uppercase font-black text-foreground tracking-widest flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center font-mono font-bold text-[10px]">2</span>
                          Fokus Alur Narasi Carousel
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium font-sans">Formula transisi psikologis slide-by-slide</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleAIOptimizeCarouselField("carouselMainGoal")}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 bg-indigo-50/20"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Use AI Recommended
                        </Button>
                        <Button
                          onClick={() => handleRegenerateCarouselSuggestion("carouselMainGoal")}
                          disabled={loadingField.carouselMainGoal}
                          size="sm"
                          variant="ghost"
                          className="h-8 text-muted-foreground text-[10px]"
                        >
                          {loadingField.carouselMainGoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12 xl:col-span-5">
                        <textarea
                          value={carouselMainGoal}
                          onChange={(e) => setCarouselMainGoal(e.target.value)}
                          placeholder="Tuliskan tujuan / alur spesifik (misal: Menjelaskan 3 langkah bebas hutang riba dengan produk finansial kita)..."
                          className="w-full min-h-[100px] p-3 text-xs bg-secondary/30 border border-border/70 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      <div className="md:col-span-12 xl:col-span-7 p-3 bg-secondary/20 rounded-xl border border-secondary/50 space-y-1 text-left">
                        <span className="text-[9px] uppercase font-black text-indigo-500 block">💡 Rekomendasi AI</span>
                        <p className="text-[11px] text-foreground font-bold leading-normal">
                          "{carouselRecommendations.carouselMainGoal?.recommendedValue}"
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                          {carouselRecommendations.carouselMainGoal?.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ACTION BUTTON */}
              <div className="p-8 bg-gradient-to-r from-teal-750 to-teal-900 border border-teal-800 rounded-[2rem] text-center space-y-5 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
                <div className="relative z-10 max-w-xl mx-auto space-y-2">
                  <h3 className="text-xl font-heading font-black uppercase tracking-wide">
                    GENERATE 3 CAROUSEL OPTIONS
                  </h3>
                  <p className="text-xs text-teal-100 leading-relaxed font-sans">
                    Mulai rancang 3 skenario draf carousel berenergi tinggi lengkap dengan detail visual prompt, headline, dan body text di setiap slide kartu.
                  </p>
                </div>
                
                <div className="relative z-10">
                  <Button 
                    onClick={handleGenerateCarousel}
                    disabled={carouselLoading}
                    className="h-14 px-8 bg-white hover:bg-slate-100 text-teal-800 font-black uppercase tracking-[0.2em] text-[12px] rounded-2xl shadow-xl w-full md:w-auto"
                  >
                    {carouselLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-teal-850 mr-2" />
                        Merangkai Skenario Carousel...
                      </>
                    ) : (
                      "Generate Carousel Slide Decks"
                    )}
                  </Button>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {activeFormat === "video" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <UGCCharacterFlow
                  activeSubTab={activeSubTab}
                  setActiveSubTab={setActiveSubTab}
                  ugcCharacterSource={ugcCharacterSource}
                  setUgcCharacterSource={handleUgcCharacterSourceChange}
                  ugcGender={ugcGender}
                  setUgcGender={setUgcGender}
                  ugcAgeRange={ugcAgeRange}
                  setUgcAgeRange={setUgcAgeRange}
                  ugcTargetDemographic={ugcTargetDemographic}
                  setUgcTargetDemographic={setUgcTargetDemographic}
                  ugcTopicFocus={ugcTopicFocus}
                  setUgcTopicFocus={setUgcTopicFocus}
                  ugcModelImage={ugcModelImage}
                  setUgcModelImage={setUgcModelImage}
                  ugcDigitalProductTitle={ugcDigitalProductTitle}
                  setUgcDigitalProductTitle={setUgcDigitalProductTitle}
                  ugcProductCoverImage={ugcProductCoverImage}
                  setUgcProductCoverImage={setUgcProductCoverImage}
                  selectedCharacterId={selectedCharacterId}
                  setSelectedCharacterId={setSelectedCharacterId}
                  characterLibrary={characterLibrary}
                  ugcOutput={ugcOutput}
                  ugcLoading={ugcLoading}
                  handleGenerateUGCCharacterFlow={handleGenerateUGCCharacterFlow}
                  handleSaveCharacterToLibrary={handleSaveCharacterToLibrary}
                  handleDeleteCharacter={handleDeleteCharacter}
                  handleDownloadCharacterImage={handleDownloadCharacterImage}
                  hasOutput={hasOutput}
                  scene1Note={scene1Note}
                  setScene1Note={setScene1Note}
                  scene2Note={scene2Note}
                  setScene2Note={setScene2Note}
                  scene3Note={scene3Note}
                  setScene3Note={setScene3Note}
                  handleGetAISceneNoteSuggestion={handleGetAISceneNoteSuggestion}
                  aiNoteLoading={aiNoteLoading}
                  handleRegenerateScene={handleRegenerateScene}
                  regenerateSceneLoading={regenerateSceneLoading}
                />

            </div>
          )}

        </div>

      </div>
      )}

    </div>
  );
}
