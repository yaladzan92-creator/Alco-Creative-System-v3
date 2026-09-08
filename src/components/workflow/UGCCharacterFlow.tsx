import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Copy,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Sliders,
  Sparkles,
  Upload,
  User,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, safeCopyToClipboard } from "@/lib/utils";

type SceneKey = "scene1" | "scene2" | "scene3";

type SceneData = {
  title?: string;
  time?: string;
  objective?: string;
  visualDescription?: string;
  audioScript?: string;
  onScreenText?: string;
  subtitleText?: string;
  ctaText?: string;
  emotion?: string;
  cameraDirection?: string;
  googleFlowPrompt?: string;
};

interface UGCCharacterFlowProps {
  activeSubTab: "form" | "output";
  setActiveSubTab: (tab: "form" | "output") => void;
  ugcCharacterSource?: "ai" | "upload" | "library";
  setUgcCharacterSource?: (v: "ai" | "upload" | "library") => void;
  ugcGender?: "female" | "male";
  setUgcGender?: (v: "female" | "male") => void;
  ugcAgeRange?: "20-25" | "26-35" | "36-45" | "auto";
  setUgcAgeRange?: (v: "20-25" | "26-35" | "36-45" | "auto") => void;
  ugcTargetDemographic: string;
  setUgcTargetDemographic: (v: string) => void;
  ugcTopicFocus: string;
  setUgcTopicFocus: (v: string) => void;
  ugcModelImage?: string;
  setUgcModelImage?: (v: string) => void;
  ugcDigitalProductTitle?: string;
  setUgcDigitalProductTitle?: (v: string) => void;
  ugcProductCoverImage?: string;
  setUgcProductCoverImage?: (v: string) => void;
  selectedCharacterId: string;
  setSelectedCharacterId: (v: string) => void;
  characterLibrary: any[];
  ugcOutput: any;
  ugcLoading: boolean;
  handleGenerateUGCCharacterFlow: (customRevision?: string) => Promise<void>;
  handleSaveCharacterToLibrary: (charToSave: any) => void;
  handleDeleteCharacter: (id: string) => void;
  handleDownloadCharacterImage?: (imageUrl: string, fileName?: string) => void;
  hasOutput: boolean;

  // Scene Notes & AI Assistance & Regenerate Props
  scene1Note?: string;
  setScene1Note?: (v: string) => void;
  scene2Note?: string;
  setScene2Note?: (v: string) => void;
  scene3Note?: string;
  setScene3Note?: (v: string) => void;
  handleGetAISceneNoteSuggestion?: (sceneKey: SceneKey) => Promise<void>;
  aiNoteLoading?: Record<string, boolean>;
  handleRegenerateScene?: (sceneKey: SceneKey) => Promise<void>;
  regenerateSceneLoading?: Record<string, boolean>;
}

const SCENE_META: Record<
  SceneKey,
  { title: string; duration: string; objective: string; accent: "rose" | "emerald" | "amber" }
> = {
  scene1: {
    title: "Scene 1: Hook (8 Detik)",
    duration: "8s duration",
    objective: "Hook",
    accent: "rose",
  },
  scene2: {
    title: "Scene 2: Solution (8 Detik)",
    duration: "8s duration",
    objective: "Solution",
    accent: "emerald",
  },
  scene3: {
    title: "Scene 3: CTA (8 Detik)",
    duration: "8s duration",
    objective: "CTA",
    accent: "amber",
  },
};

function toQuotedLine(value?: string, fallback = "[Isi teks belum tersedia]") {
  const text = (value || "").trim();
  if (!text) return `"${fallback}"`;
  return `"${text.replace(/^"+|"+$/g, "")}"`;
}

function normalizeSingleLine(value?: string, fallback = "-") {
  const text = (value || "").trim();
  return text || fallback;
}

function getAccentClasses(accent: "rose" | "emerald" | "amber") {
  if (accent === "rose") {
    return {
      chip: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
      box: "bg-rose-950/20 border border-rose-500/30",
      button: "bg-rose-600 hover:bg-rose-500 text-white",
      label: "text-rose-400",
    };
  }
  if (accent === "emerald") {
    return {
      chip: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      box: "bg-emerald-950/20 border border-emerald-500/30",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white",
      label: "text-emerald-400",
    };
  }
  return {
    chip: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    box: "bg-amber-950/20 border border-amber-500/30",
    button: "bg-amber-600 hover:bg-amber-500 text-white",
    label: "text-amber-400",
  };
}

function buildSceneHeading(sceneKey: SceneKey, rawScene: SceneData | undefined) {
  const explicitTitle = (rawScene?.title || "").trim();
  if (explicitTitle.startsWith("Scene ")) return explicitTitle;
  return SCENE_META[sceneKey].title;
}

function buildSceneScriptText(sceneKey: SceneKey, rawScene: SceneData | undefined) {
  const textLine1 = rawScene?.onScreenText || rawScene?.subtitleText;
  const textLine2 = rawScene?.audioScript || rawScene?.ctaText;
  const highlight = rawScene?.ctaText || rawScene?.onScreenText || rawScene?.subtitleText;

  return [
    buildSceneHeading(sceneKey, rawScene),
    "",
    "Teks:",
    toQuotedLine(textLine1),
    toQuotedLine(textLine2),
    `Highlight: ${toQuotedLine(highlight, "Isi highlight belum tersedia")}`,
    `Visual: ${normalizeSingleLine(rawScene?.visualDescription)}`,
    `Emosi: ${normalizeSingleLine(rawScene?.emotion)}`,
  ].join("\n").trim();
}

function buildCharacterDescriptor(ugcOutput: any) {
  const profile = ugcOutput?.characterProfile || {};
  const name = profile.name || "";
  const appearance = profile.faceAndAppearance || profile.appearance || "";
  const clothing = profile.clothing || "";
  const speakingStyle = profile.speakingStyle || "";

  const gender = profile.gender || ugcOutput?.gender || "";
  const ageRange = profile.ageRange || ugcOutput?.ageRange || "";
  const characterSource = ugcOutput?.characterSource || "";

  const isMale = gender === "male" || /pria|male|man|cowok|laki/i.test(`${name} ${appearance}`);
  const isFemale = gender === "female" || /wanita|female|woman|cewek|perempuan/i.test(`${name} ${appearance}`);
  const ageStr = ageRange && ageRange !== "auto" ? `${ageRange} years old ` : "";

  let descriptor = "";
  let possessive = isMale ? "his" : isFemale ? "her" : "their";
  let pronoun = "The creator";

  if (characterSource === "upload" || (!characterSource && (ugcOutput?.productCoverImage || ugcOutput?.modelImage))) {
    descriptor = "the creator from the reference image";
  } else if (name && name !== "Nama Persona Karakter" && name !== "the creator" && name !== "Kreator UGC AI") {
    descriptor = `${name}, a ${ageStr}Southeast Asian ${isMale ? "male " : isFemale ? "female " : ""}creator`.replace(/\s+/g, " ").trim();
  } else {
    descriptor = `a ${ageStr}Southeast Asian ${isMale ? "male " : isFemale ? "female " : ""}creator`.replace(/\s+/g, " ").trim();
  }

  return { name: name || "the creator", descriptor, possessive, pronoun, appearance, clothing, speakingStyle, gender: isMale ? "male" : "female", ageRange };
}

function formatNarrativeGoogleFlowPrompt(
  sceneKey: SceneKey,
  scene: SceneData | undefined,
  ugcOutput: any,
  rawPrompt?: string
): string {
  if (
    rawPrompt &&
    rawPrompt.startsWith("A 9:16 vertical") &&
    rawPrompt.endsWith("8 seconds.") &&
    rawPrompt.includes("speaking in Indonesian") &&
    !rawPrompt.includes("===") &&
    !rawPrompt.includes("Visual:") &&
    !rawPrompt.includes("Audio:")
  ) {
    return rawPrompt.trim();
  }

  let speechText = (
    scene?.audioScript ||
    scene?.onScreenText ||
    scene?.subtitleText ||
    scene?.ctaText ||
    ""
  )
    .replace(/^"+|"+$/g, "")
    .trim();

  if (!speechText) {
    speechText =
      sceneKey === "scene1"
        ? "Solusi serba praktis yang bikin pekerjaan kamu selesai lebih cepat."
        : sceneKey === "scene2"
        ? "Lihat sendiri gimana fitur ini mempermudah alur kerja harian kamu."
        : "Coba sekarang dan rasakan sendiri kemudahannya lewat tombol di bawah.";
  }

  const { descriptor } = buildCharacterDescriptor(ugcOutput);

  // Controlled shot variation per scene
  // Scene 1: close-up / medium close-up / over-the-shoulder reaction
  // Scene 2: medium shot / medium close-up / insert shot ke product atau screen
  // Scene 3: close-up / medium shot / slight push-in CTA shot
  const cameraDir = (scene?.cameraDirection || "").toLowerCase();
  let shotType = "close-up";
  if (sceneKey === "scene1") {
    if (cameraDir.includes("over-the-shoulder") || cameraDir.includes("shoulder")) {
      shotType = "over-the-shoulder reaction";
    } else if (cameraDir.includes("medium close-up")) {
      shotType = "medium close-up";
    } else {
      shotType = "close-up";
    }
  } else if (sceneKey === "scene2") {
    if (cameraDir.includes("insert") || cameraDir.includes("screen") || cameraDir.includes("product")) {
      shotType = "insert";
    } else if (cameraDir.includes("medium close-up")) {
      shotType = "medium close-up";
    } else {
      shotType = "medium";
    }
  } else {
    if (cameraDir.includes("push-in") || cameraDir.includes("cta")) {
      shotType = "slight push-in CTA";
    } else if (cameraDir.includes("medium")) {
      shotType = "medium";
    } else {
      shotType = "close-up";
    }
  }

  const setting =
    sceneKey === "scene1"
      ? "in front of a laptop"
      : sceneKey === "scene2"
      ? "holding a smartphone demonstrating the solution"
      : "in a bright natural indoor setting";

  return `A 9:16 vertical ${shotType} shot of ${descriptor} ${setting}. The creator delivers a realistic monologue directly to the camera with natural mouth movements speaking in Indonesian synchronizing to: "${speechText}". Natural indoor lighting, UGC style, 8 seconds.`;
}

function buildFallbackGoogleFlowPrompt(sceneKey: SceneKey, scene: SceneData | undefined, ugcOutput: any) {
  return formatNarrativeGoogleFlowPrompt(sceneKey, scene, ugcOutput);
}

function getCharacterImagePrompt(ugcOutput: any): string {
  if (ugcOutput?.characterReferenceImagePrompt) {
    return ugcOutput.characterReferenceImagePrompt;
  }
  const { descriptor, appearance } = buildCharacterDescriptor(ugcOutput);
  const clothing = ugcOutput?.characterProfile?.clothing || "casual modern outfit";
  return `Master Character Reference Photo. Vertical 9:16 aspect ratio (--ar 9:16). Photorealistic headshot portrait of ${descriptor}, wearing ${clothing}. Authentic candid indoor room lighting, natural skin texture with visible pores, realistic eyes, soft daylight, high resolution mobile camera photo --no cgi, 3d render, plastic skin, cartoon, deformed.`;
}

function getSceneImagePrompt(sceneKey: SceneKey, ugcOutput: any): string {
  const mapKey: Record<SceneKey, string> = {
    scene1: "scene1ReferenceImagePrompt",
    scene2: "scene2ReferenceImagePrompt",
    scene3: "scene3ReferenceImagePrompt",
  };
  const specific = ugcOutput?.sceneVisualPrompts?.[mapKey[sceneKey]];
  if (specific) return specific;

  const scene = ugcOutput?.script?.[sceneKey];
  const { descriptor, possessive } = buildCharacterDescriptor(ugcOutput);
  const visual = scene?.visualDescription || "candid room setting";

  if (sceneKey === "scene1") {
    return `Vertical 9:16 realistic photo (--ar 9:16). Medium close-up of ${descriptor}, reacting with concern to ${possessive} smartphone screen. ${visual}, candid mobile camera style, natural window daylight, authentic skin texture, 100% same character facial identity, no CGI.`;
  }
  if (sceneKey === "scene2") {
    return `Vertical 9:16 realistic photo (--ar 9:16). Medium shot of ${descriptor}, smiling warmly while holding ${possessive} smartphone to demonstrate a product solution. ${visual}, bright indoor room lighting, clean candid photo, realistic hands, 100% same character facial identity, no CGI.`;
  }
  return `Vertical 9:16 realistic photo (--ar 9:16). Close-up portrait of ${descriptor}, smiling confidently and gesturing downward toward the bottom screen CTA. ${visual}, warm ambient room lighting, engaging creator photo style, 100% same character facial identity, no CGI.`;
}

function getAllImagePromptsText(ugcOutput: any): string {
  if (!ugcOutput) return "";
  const master = getCharacterImagePrompt(ugcOutput);
  const s1 = getSceneImagePrompt("scene1", ugcOutput);
  const s2 = getSceneImagePrompt("scene2", ugcOutput);
  const isThreeScene = ugcOutput?.formatMode !== "2_scene";
  const s3 = isThreeScene ? getSceneImagePrompt("scene3", ugcOutput) : null;

  return [
    `=== MASTER CHARACTER REFERENCE IMAGE PROMPT ===\n${master}`,
    `=== SCENE 1 IMAGE PROMPT (HOOK PHOTO) ===\n${s1}`,
    `=== SCENE 2 IMAGE PROMPT (SOLUTION PHOTO) ===\n${s2}`,
    s3 ? `=== SCENE 3 IMAGE PROMPT (CTA PHOTO) ===\n${s3}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function UGCCharacterFlow({
  activeSubTab,
  setActiveSubTab,
  ugcCharacterSource = "ai",
  setUgcCharacterSource,
  ugcGender = "female",
  setUgcGender,
  ugcAgeRange = "20-25",
  setUgcAgeRange,
  ugcTargetDemographic,
  setUgcTargetDemographic,
  ugcTopicFocus,
  setUgcTopicFocus,
  ugcModelImage = "",
  setUgcModelImage,
  ugcDigitalProductTitle = "",
  setUgcDigitalProductTitle,
  ugcProductCoverImage = "",
  setUgcProductCoverImage,
  selectedCharacterId,
  setSelectedCharacterId,
  characterLibrary,
  ugcOutput,
  ugcLoading,
  handleGenerateUGCCharacterFlow,
  handleSaveCharacterToLibrary,
  handleDeleteCharacter,
  hasOutput,
  scene1Note = "",
  setScene1Note,
  scene2Note = "",
  setScene2Note,
  scene3Note = "",
  setScene3Note,
  handleGetAISceneNoteSuggestion,
  aiNoteLoading = {},
  handleRegenerateScene,
  regenerateSceneLoading = {},
}: UGCCharacterFlowProps) {
  const [showAdvancedForm, setShowAdvancedForm] = React.useState<boolean>(false);
  const [showFullPackPreview, setShowFullPackPreview] = React.useState<boolean>(false);
  const [showMasterImages, setShowMasterImages] = React.useState<boolean>(false);
  const [showCharacterLibrary, setShowCharacterLibrary] = React.useState<boolean>(false);
  const [showSceneRevision, setShowSceneRevision] = React.useState<Record<string, boolean>>({});

  const handleCopy = async (text: string, successMessage: string) => {
    const ok = await safeCopyToClipboard(text);
    if (ok) toast.success(successMessage);
    else toast.error("Gagal menyalin teks.");
  };

  const isThreeScene = ugcOutput?.formatMode === "2_scene" ? false : true;
  const sceneKeys: SceneKey[] = isThreeScene ? ["scene1", "scene2", "scene3"] : ["scene1", "scene2"];

  const getSceneText = (sceneKey: SceneKey) => buildSceneScriptText(sceneKey, ugcOutput?.script?.[sceneKey]);

  const getSceneVideoPrompt = (sceneKey: SceneKey) => {
    const rawPrompt =
      ugcOutput?.googleFlowPrompts?.[`${sceneKey}Prompt`] ||
      ugcOutput?.script?.[sceneKey]?.googleFlowPrompt;
    return formatNarrativeGoogleFlowPrompt(sceneKey, ugcOutput?.script?.[sceneKey], ugcOutput, rawPrompt);
  };

  const getAllVideoPromptsText = () => {
    if (!ugcOutput) return "";
    return sceneKeys
      .map(
        (sceneKey, idx) =>
          `=== GOOGLE FLOW VIDEO PROMPT SCENE ${idx + 1} (${SCENE_META[sceneKey].objective}) ===\n${getSceneVideoPrompt(
            sceneKey
          )}`
      )
      .join("\n\n");
  };

  const getFullScriptText = () => {
    if (!ugcOutput) return "";

    const productName =
      ugcOutput.digitalProductTitle ||
      ugcDigitalProductTitle ||
      ugcTopicFocus ||
      "Produk Digital / Campaign Meta Ads";

    const characterName = ugcOutput.characterProfile?.name || "Kreator Video";

    const packageHeader = [
      "Berikut adalah paket prompt iklan 3-Scene (masing-masing 8 detik) yang dioptimalkan untuk konten Meta Ads dengan karakter berbicara Bahasa Indonesia.",
      "",
      `Produk: ${productName}`,
      `Karakter: ${characterName}`,
      "",
      "- Paket 1: Gaya Ekspresif & Interaktif (Video Ads Kasual)",
      "",
    ].join("\n");

    const sceneBlocks = sceneKeys
      .map((sceneKey) => {
        const title = buildSceneHeading(sceneKey, ugcOutput?.script?.[sceneKey]);
        return [
          `- ${title}`,
          `  Script:`,
          getSceneText(sceneKey)
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n"),
          "",
          `  Prompt Image: ${getSceneImagePrompt(sceneKey, ugcOutput)}`,
          "",
          `  Prompt Video: ${getSceneVideoPrompt(sceneKey)}`,
        ].join("\n");
      })
      .join("\n\n");

    return `${packageHeader}${sceneBlocks}`.trim();
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter?: (val: string) => void
  ) => {
    if (!setter) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setter(evt.target.result as string);
        toast.success("Gambar berhasil diunggah!");
      }
    };
    reader.readAsDataURL(file);
  };

  const renderSceneScriptCard = (sceneKey: SceneKey) => {
    const scene = ugcOutput?.script?.[sceneKey] || {};
    const meta = SCENE_META[sceneKey];
    const accent = getAccentClasses(meta.accent);
    const scriptText = getSceneText(sceneKey);
    const title = buildSceneHeading(sceneKey, scene);
    const duration = scene.time || meta.duration;
    const sceneImagePrompt = getSceneImagePrompt(sceneKey, ugcOutput);
    const sceneVideoPrompt = getSceneVideoPrompt(sceneKey);
    const currentNote = sceneKey === "scene1" ? scene1Note : sceneKey === "scene2" ? scene2Note : scene3Note;
    const setNote = sceneKey === "scene1" ? setScene1Note : sceneKey === "scene2" ? setScene2Note : setScene3Note;
    const isRevisionOpen = !!showSceneRevision[sceneKey];

    return (
      <div key={sceneKey} className="p-5 bg-card border border-border/80 rounded-3xl shadow-sm space-y-4">
        {/* SCENE HEADER */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <span className={cn("px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase", accent.chip)}>
            {title}
          </span>
          <span className="text-[10px] font-mono bg-secondary/60 text-muted-foreground px-2.5 py-1 rounded-lg font-bold">
            Durasi {duration}
          </span>
        </div>

        {/* 1. SCRIPT SCENE */}
        <div className={cn("rounded-2xl p-3.5 space-y-2", accent.box)}>
          <div className="flex items-center justify-between gap-2">
            <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", accent.label)}>
              <FileText className="w-3.5 h-3.5" /> 1. Script Scene (Naskah & Teks)
            </span>
            <Button
              size="sm"
              onClick={() => handleCopy(scriptText, `${title} script disalin!`)}
              className={cn("h-7 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer", accent.button)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy Script
            </Button>
          </div>

          <pre className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-[10.5px] leading-relaxed text-slate-100 border border-slate-800">
            {scriptText}
          </pre>
        </div>

        {/* 2. PROMPT VIDEO GOOGLE FLOW */}
        <div className="space-y-1.5 p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-2xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-rose-400" /> 2. Prompt Video Google Flow (9:16, 8s)
            </span>
            <Button
              size="sm"
              onClick={() => handleCopy(sceneVideoPrompt, `Prompt Video ${title} disalin!`)}
              className="h-7 px-3 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              <Copy className="w-3 h-3 mr-1" /> Copy Video
            </Button>
          </div>
          <div className="rounded-xl border border-rose-900/60 bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-rose-200/90 break-words max-h-32 overflow-y-auto">
            {sceneVideoPrompt}
          </div>
        </div>

        {/* 3. PROMPT IMAGE SCENE */}
        <div className="space-y-1.5 p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> 3. Prompt Image Scene (Foto Midjourney / Flux)
            </span>
            <Button
              size="sm"
              onClick={() => handleCopy(sceneImagePrompt, `Prompt Image ${title} disalin!`)}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              <Copy className="w-3 h-3 mr-1" /> Copy Image
            </Button>
          </div>
          <div className="rounded-xl border border-emerald-900/60 bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-emerald-200/90 break-words max-h-28 overflow-y-auto">
            {sceneImagePrompt}
          </div>
        </div>

        {/* SECTION REVISI & REGENERATE SCENE (SEKUNDER / COLLAPSIBLE) */}
        <div className="pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={() =>
              setShowSceneRevision((prev) => ({
                ...prev,
                [sceneKey]: !prev[sceneKey],
              }))
            }
            className="w-full flex items-center justify-between text-[11px] font-bold text-muted-foreground hover:text-foreground py-1.5 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Revisi & Regenerate {title} {currentNote ? "(Ada Catatan)" : ""}
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isRevisionOpen && "rotate-180")} />
          </button>

          {isRevisionOpen && (
            <div className="mt-2.5 p-3.5 bg-secondary/30 rounded-2xl border border-border/60 space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Catatan Revisi Scene ({sceneKey === "scene1" ? "Hook" : sceneKey === "scene2" ? "Solution" : "CTA"}):
                  </span>
                  {handleGetAISceneNoteSuggestion && (
                    <button
                      type="button"
                      onClick={() => handleGetAISceneNoteSuggestion(sceneKey)}
                      disabled={aiNoteLoading?.[sceneKey]}
                      className="text-[9.5px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {aiNoteLoading?.[sceneKey] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      )}
                      <span>Rekomendasi AI</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={currentNote}
                  onChange={(e) => setNote?.(e.target.value)}
                  placeholder={`Masukkan arahan revisi khusus untuk ${title}...`}
                  className="w-full min-h-[50px] p-2.5 text-[11px] bg-background border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {handleRegenerateScene && (
                <Button
                  size="sm"
                  onClick={() => handleRegenerateScene(sceneKey)}
                  disabled={regenerateSceneLoading?.[sceneKey]}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider h-8.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {regenerateSceneLoading?.[sceneKey] ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Meregenerasi {title}...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>Regenerate Scene Ini</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left">
      {/* FORM TAB */}
      {activeSubTab === "form" && (
        <Card className="p-6 md:p-8 border border-rose-500/30 rounded-[2rem] bg-card shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Clapperboard className="w-3.5 h-3.5 text-rose-500" /> GOOGLE FLOW PRODUCTION PACK
              </div>
              <h3 className="text-xl font-heading font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500 shrink-0" /> Video Ads dengan Karakter
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rangkai paket produksi video ads berkinerja tinggi 3 scene (8 detik) untuk Meta Ads secara instan.
              </p>
            </div>

            {hasOutput && (
              <Button
                onClick={() => setActiveSubTab("output")}
                variant="outline"
                size="sm"
                className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                Lihat Hasil Video <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* 1. SUMBER KARAKTER */}
            <div className="space-y-2.5">
              <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                1. Sumber Karakter
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Opsi 1: Buat Karakter Baru AI */}
                <button
                  type="button"
                  onClick={() => {
                    setUgcCharacterSource?.("ai");
                    setSelectedCharacterId("new");
                  }}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2.5",
                    ugcCharacterSource === "ai" && selectedCharacterId === "new"
                      ? "bg-rose-500/10 border-rose-500 text-foreground ring-2 ring-rose-500/30 font-bold"
                      : "bg-secondary/30 border-border/70 hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight text-foreground">Buat Karakter Baru AI</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground font-sans leading-normal">
                    Generate persona, visual look, dan gaya bicara otomatis dengan AI.
                  </p>
                </button>

                {/* Opsi 2: Unggah Foto Model */}
                <button
                  type="button"
                  onClick={() => {
                    setUgcCharacterSource?.("upload");
                    setSelectedCharacterId("upload");
                  }}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2.5",
                    ugcCharacterSource === "upload" || selectedCharacterId === "upload"
                      ? "bg-rose-500/10 border-rose-500 text-foreground ring-2 ring-rose-500/30 font-bold"
                      : "bg-secondary/30 border-border/70 hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight text-foreground">Unggah Foto Model</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground font-sans leading-normal">
                    Gunakan foto kreator/model nyata sebagai referensi wajah identik.
                  </p>
                </button>

                {/* Opsi 3: Pilih Character Library */}
                <button
                  type="button"
                  onClick={() => {
                    setUgcCharacterSource?.("library");
                    if (characterLibrary.length > 0 && selectedCharacterId === "new") {
                      setSelectedCharacterId(characterLibrary[0].id);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2.5",
                    ugcCharacterSource === "library" || (selectedCharacterId !== "new" && selectedCharacterId !== "upload")
                      ? "bg-rose-500/10 border-rose-500 text-foreground ring-2 ring-rose-500/30 font-bold"
                      : "bg-secondary/30 border-border/70 hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <BookmarkPlus className="w-4 h-4 font-bold" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-black uppercase tracking-tight text-foreground truncate">Character Library</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[9px] font-black">{characterLibrary.length}</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground font-sans leading-normal">
                    Pilih dari persona tersimpan untuk menjaga konsistensi lintas iklan.
                  </p>
                </button>
              </div>
            </div>

            {/* SELEKSI DARI CHARACTER LIBRARY (JIKA SUMBER = LIBRARY) */}
            {(ugcCharacterSource === "library" || (selectedCharacterId !== "new" && selectedCharacterId !== "upload")) && (
              <div className="p-4 bg-secondary/20 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <BookmarkPlus className="w-4 h-4" /> Pilih Karakter Tersimpan
                  </span>
                  <span className="text-[10.5px] text-muted-foreground">
                    {characterLibrary.length} karakter tersedia
                  </span>
                </div>

                {characterLibrary.length === 0 ? (
                  <div className="p-4 text-center space-y-2 bg-background/50 rounded-xl border border-dashed border-border">
                    <p className="text-xs text-muted-foreground">Belum ada karakter yang tersimpan di Library.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUgcCharacterSource?.("ai");
                        setSelectedCharacterId("new");
                      }}
                      className="text-xs font-bold text-rose-500 border-rose-500/30"
                    >
                      Buat Karakter Baru dengan AI
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {characterLibrary.map((char) => {
                      const isSelected = selectedCharacterId === char.id;
                      return (
                        <div
                          key={char.id}
                          onClick={() => {
                            setSelectedCharacterId(char.id);
                            if (char.gender) setUgcGender?.(char.gender);
                            if (char.ageRange) setUgcAgeRange?.(char.ageRange);
                          }}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5",
                            isSelected
                              ? "bg-amber-500/15 border-amber-500 text-foreground ring-2 ring-amber-500/40 shadow-sm"
                              : "bg-background border-border/80 hover:bg-secondary/40 text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {char.avatarImageUrl ? (
                              <img src={char.avatarImageUrl} alt={char.name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-black uppercase text-foreground truncate">{char.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{char.gender === "male" ? "Laki-laki" : "Perempuan"} • {char.ageRange || "20-25"}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SELEKSI UPLOAD GAMBAR MODEL (JIKA SUMBER = UPLOAD) */}
            {(ugcCharacterSource === "upload" || selectedCharacterId === "upload") && (
              <div className="p-4 bg-secondary/20 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Unggah Foto Model Referensi
                  </span>
                  <span className="text-[10.5px] text-muted-foreground">Format JPG, PNG, WEBP (maks 5MB)</span>
                </div>

                {ugcModelImage ? (
                  <div className="flex items-center gap-4 p-3 bg-card border border-emerald-500/40 rounded-xl">
                    <img src={ugcModelImage} alt="Model Reference" className="w-14 h-14 rounded-xl object-cover border border-border shadow-sm" />
                    <div className="flex-1 space-y-0.5">
                      <span className="text-xs font-bold text-foreground block">Foto model referensi berhasil diunggah</span>
                      <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" /> Prompt video & image akan konsisten merujuk pada foto ini
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUgcModelImage?.("")}
                      className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border/80 hover:border-emerald-500/50 rounded-xl cursor-pointer bg-background/50 hover:bg-secondary/30 transition-all text-center group">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-emerald-500 mb-1.5 transition-colors" />
                    <span className="text-xs font-bold text-foreground">Klik atau seret foto model ke sini</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Model wajah akan dipertahankan 100% konsisten di seluruh 3 scene</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setUgcModelImage)} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* 2. GENDER & USIA KARAKTER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  2. Gender Karakter
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUgcGender?.("female")}
                    className={cn(
                      "h-11 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer",
                      ugcGender === "female"
                        ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-2 ring-rose-500/30"
                        : "bg-secondary/30 border-border/70 hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    <span>👩 Perempuan</span>
                    {ugcGender === "female" && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUgcGender?.("male")}
                    className={cn(
                      "h-11 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer",
                      ugcGender === "male"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 ring-2 ring-indigo-500/30"
                        : "bg-secondary/30 border-border/70 hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    <span>👨 Laki-laki</span>
                    {ugcGender === "male" && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Age Range Selection */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  3. Usia Karakter
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "20-25", label: "20–25 th" },
                    { value: "26-35", label: "26–35 th" },
                    { value: "36-45", label: "36–45 th" },
                    { value: "auto", label: "Sesuaikan Audiens" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUgcAgeRange?.(opt.value as any)}
                      className={cn(
                        "h-11 px-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center text-center cursor-pointer",
                        ugcAgeRange === opt.value
                          ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-2 ring-rose-500/30"
                          : "bg-secondary/30 border-border/70 hover:bg-secondary text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RINGKASAN KARAKTER TERPILIH (CHARACTER SUMMARY CARD) */}
            {(() => {
              const activeLibraryChar = characterLibrary.find((c) => c.id === selectedCharacterId);
              const isLibrary = ugcCharacterSource === "library" || Boolean(activeLibraryChar);
              const isUpload = ugcCharacterSource === "upload" || selectedCharacterId === "upload";

              const summaryName = isLibrary
                ? activeLibraryChar?.name || "Karakter Library"
                : isUpload
                ? ugcModelImage ? "Model Foto Referensi" : "Foto Model Unggahan"
                : ugcOutput?.characterProfile?.name || `Kreator AI (${ugcGender === "female" ? "Perempuan" : "Laki-laki"})`;

              const summaryGender = isLibrary && activeLibraryChar?.gender
                ? activeLibraryChar.gender === "male" ? "Laki-laki" : "Perempuan"
                : ugcGender === "male" ? "Laki-laki" : "Perempuan";

              const summaryAge = isLibrary && activeLibraryChar?.ageRange
                ? activeLibraryChar.ageRange
                : ugcAgeRange === "auto" ? "Sesuaikan target audiens" : `${ugcAgeRange} tahun`;

              const summaryLook = isLibrary && (activeLibraryChar?.faceAndAppearance || activeLibraryChar?.appearance)
                ? activeLibraryChar.faceAndAppearance || activeLibraryChar.appearance
                : isUpload
                ? "the creator from the reference image (identitas wajah & ekspresi persis foto model)"
                : ugcOutput?.characterProfile?.faceAndAppearance || (ugcGender === "male" ? "Pria Asia Tenggara berpenampilan ramah & profesional" : "Wanita Asia Tenggara berpenampilan ramah & ceria");

              const summaryClothing = isLibrary && activeLibraryChar?.clothing
                ? activeLibraryChar.clothing
                : isUpload
                ? "Kasual rapi sesuai foto referensi"
                : ugcOutput?.characterProfile?.clothing || "Smart casual outfit modern";

              const summarySpeaking = isLibrary && activeLibraryChar?.speakingStyle
                ? activeLibraryChar.speakingStyle
                : "Natural, energik, meyakinkan dengan intonasi santai berbicara ke kamera";

              return (
                <div className="p-4 md:p-5 bg-secondary/30 border-2 border-rose-500/25 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Ringkasan Karakter Terpilih
                    </span>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                      Konsisten di Seluruh Scene
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground block">Nama Karakter</span>
                      <span className="font-bold text-foreground block truncate">{summaryName}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground block">Gender & Usia</span>
                      <span className="font-bold text-foreground block">{summaryGender} • {summaryAge}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground block">Gaya Bicara</span>
                      <span className="font-medium text-foreground block line-clamp-1">{summarySpeaking}</span>
                    </div>

                    <div className="sm:col-span-2 md:col-span-3 space-y-1 pt-1 border-t border-border/40">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-[11px]">
                        <div className="flex-1">
                          <span className="font-bold text-muted-foreground">Tampilan Wajah: </span>
                          <span className="text-foreground">{summaryLook}</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-muted-foreground">Pakaian: </span>
                          <span className="text-foreground">{summaryClothing}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. Judul Ebook / Nama Produk Digital (Opsional) */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                4. Judul Ebook / Nama Produk Digital (Opsional)
              </label>
              <input
                type="text"
                value={ugcDigitalProductTitle}
                onChange={(e) => setUgcDigitalProductTitle?.(e.target.value)}
                placeholder="Contoh: Ebook 100 Strategi Organic TikTok Ads"
                className="w-full h-11 px-3.5 text-xs bg-background border border-border/80 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* TOGGLE SECTION ADVANCED / CATATAN */}
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvancedForm(!showAdvancedForm)}
                className="w-full py-3 px-4 rounded-2xl border-rose-500/30 text-foreground bg-rose-500/5 hover:bg-rose-500/10 font-black text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-rose-500" />
                  <span>⚙️ Pengaturan & Catatan Scene Lanjutan (Opsional)</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10.5px]">
                  <span>{showAdvancedForm ? "Sembunyikan Form Lanjutan" : "Buka Catatan Scene & Upload Gambar"}</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 text-rose-500", showAdvancedForm && "rotate-180")} />
                </div>
              </Button>
            </div>

            {/* COLLAPSIBLE SECTION FOR ADVANCED INPUTS */}
            {showAdvancedForm && (
              <div className="space-y-5 p-5 bg-secondary/15 border border-border/60 rounded-3xl animate-in fade-in duration-200">
                {/* Upload Gambar Model */}
                <div className="space-y-2.5">
                  <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-rose-500" />
                    Upload Gambar Model / Karakter Referensi (Opsional)
                  </label>

                  {ugcModelImage ? (
                    <div className="flex items-center gap-4 p-3 bg-card border border-rose-500/30 rounded-xl">
                      <img src={ugcModelImage} alt="Model Reference" className="w-14 h-14 rounded-xl object-cover border border-border shadow-sm" />
                      <div className="flex-1 space-y-0.5">
                        <span className="text-xs font-bold text-foreground block">Foto model referensi ter-upload</span>
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 block">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" /> Siap dipakai sebagai basis visual
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUgcModelImage?.("")}
                        className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/80 hover:border-rose-500/50 rounded-xl cursor-pointer bg-background/50 hover:bg-secondary/30 transition-all text-center group">
                      <Upload className="w-5 h-5 text-muted-foreground group-hover:text-rose-500 mb-1 transition-colors" />
                      <span className="text-xs font-bold text-foreground">Klik atau seret gambar model ke sini</span>
                      <span className="text-[10px] text-muted-foreground">Format JPG, PNG, WEBP (maks 5MB)</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setUgcModelImage)} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Upload Cover Produk */}
                <div className="space-y-2.5">
                  <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    Upload Cover Image Produk / Ebook (Opsional)
                  </label>

                  {ugcProductCoverImage ? (
                    <div className="flex items-center gap-4 p-3 bg-card border border-emerald-500/30 rounded-xl">
                      <img src={ugcProductCoverImage} alt="Product Cover" className="w-14 h-14 rounded-xl object-cover border border-border shadow-sm" />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-foreground block">Cover produk ter-upload</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUgcProductCoverImage?.("")}
                        className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/80 hover:border-emerald-500/50 rounded-xl cursor-pointer bg-background/50 hover:bg-secondary/30 transition-all text-center group">
                      <Upload className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 mb-1 transition-colors" />
                      <span className="text-xs font-bold text-foreground">Klik atau seret cover produk ke sini</span>
                      <span className="text-[10px] text-muted-foreground">Format JPG, PNG, WEBP (maks 5MB)</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setUgcProductCoverImage)} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Catatan Fokus Video Ads */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-black tracking-wider text-foreground block">
                    Catatan Fokus / Topik Khusus Video Ads (Opsional)
                  </label>
                  <textarea
                    value={ugcTopicFocus}
                    onChange={(e) => setUgcTopicFocus(e.target.value)}
                    placeholder="Contoh: Tekankan rasa terkejut dan cepat paham saat melihat hasil..."
                    className="w-full min-h-[75px] p-3 text-xs bg-background border border-border/70 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Catatan Per Scene (Hook, Solution, CTA) */}
                <div className="space-y-4 p-4 bg-background border border-border/60 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-xs uppercase font-black tracking-wider text-foreground flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-rose-500" />
                      Catatan Per Scene dengan Bantuan AI (Opsional)
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Usulan catatan otomatis diselaraskan dengan strategi Step 1–8.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* Scene 1 Note */}
                    <div className="p-3 bg-card border border-rose-500/30 rounded-2xl space-y-2 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Scene 1: Hook
                        </span>
                        {handleGetAISceneNoteSuggestion && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleGetAISceneNoteSuggestion("scene1")}
                            disabled={aiNoteLoading?.scene1}
                            className="h-6 px-2 text-[9px] font-black uppercase tracking-wider border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded flex items-center gap-1 cursor-pointer"
                          >
                            {aiNoteLoading?.scene1 ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-rose-500" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            )}
                            <span>Saran AI</span>
                          </Button>
                        )}
                      </div>
                      <textarea
                        value={scene1Note}
                        onChange={(e) => setScene1Note?.(e.target.value)}
                        placeholder="Contoh: Tekankan ekspresi frustrasi..."
                        className="w-full min-h-[70px] p-2 text-[11px] bg-secondary/30 border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground/40 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    {/* Scene 2 Note */}
                    <div className="p-3 bg-card border border-emerald-500/30 rounded-2xl space-y-2 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Scene 2: Solution
                        </span>
                        {handleGetAISceneNoteSuggestion && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleGetAISceneNoteSuggestion("scene2")}
                            disabled={aiNoteLoading?.scene2}
                            className="h-6 px-2 text-[9px] font-black uppercase tracking-wider border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded flex items-center gap-1 cursor-pointer"
                          >
                            {aiNoteLoading?.scene2 ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-500" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            )}
                            <span>Saran AI</span>
                          </Button>
                        )}
                      </div>
                      <textarea
                        value={scene2Note}
                        onChange={(e) => setScene2Note?.(e.target.value)}
                        placeholder="Contoh: Tunjukkan bukti layar aplikasi..."
                        className="w-full min-h-[70px] p-2 text-[11px] bg-secondary/30 border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground/40 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Scene 3 Note */}
                    <div className="p-3 bg-card border border-amber-500/30 rounded-2xl space-y-2 shadow-sm">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Scene 3: CTA
                        </span>
                        {handleGetAISceneNoteSuggestion && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleGetAISceneNoteSuggestion("scene3")}
                            disabled={aiNoteLoading?.scene3}
                            className="h-6 px-2 text-[9px] font-black uppercase tracking-wider border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded flex items-center gap-1 cursor-pointer"
                          >
                            {aiNoteLoading?.scene3 ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            )}
                            <span>Saran AI</span>
                          </Button>
                        )}
                      </div>
                      <textarea
                        value={scene3Note}
                        onChange={(e) => setScene3Note?.(e.target.value)}
                        placeholder="Contoh: Arahkan klik tombol bawah..."
                        className="w-full min-h-[70px] p-2 text-[11px] bg-secondary/30 border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground/40 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GENERATE BUTTON */}
            <div className="pt-2">
              <Button
                onClick={() => handleGenerateUGCCharacterFlow()}
                disabled={ugcLoading}
                className="w-full h-14 bg-gradient-to-r from-rose-600 via-indigo-600 to-rose-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl cursor-pointer"
              >
                {ugcLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white mr-1" />
                    MENYIAPKAN PAKET 3 SCENE...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    Generate Paket Produksi Video 3-Scene
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* OUTPUT TAB */}
      {(activeSubTab === "output" || ugcOutput) && (
        <div className="space-y-6">
          {ugcOutput ? (
            <div className="p-6 md:p-8 bg-card border border-rose-500/40 rounded-[2rem] shadow-2xl space-y-7 text-left">
              {/* TOP HEADER & QUICK ACTIONS */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" /> PAKET PRODUKSI VIDEO 3-SCENE
                  </div>
                  <h3 className="text-xl md:text-2xl font-heading font-black text-foreground uppercase tracking-tight line-clamp-2 break-words [overflow-wrap:anywhere] max-w-full">
                    {ugcOutput.characterProfile?.name || "Paket Produksi Video Ads"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paket Siap Pakai Google Flow (Hook 8s • Solution 8s • CTA 8s)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                  <Button
                    onClick={() => handleSaveCharacterToLibrary(ugcOutput.characterProfile)}
                    variant="outline"
                    size="sm"
                    className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold text-xs uppercase tracking-wider h-9 px-3 rounded-xl cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 mr-1" />
                    Simpan Karakter
                  </Button>
                  <Button
                    onClick={() => handleCopy(getFullScriptText(), "Seluruh paket produksi video disalin!")}
                    variant="secondary"
                    size="sm"
                    className="font-black text-xs uppercase tracking-wider h-9 px-3.5 rounded-xl cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Full Pack
                  </Button>
                </div>
              </div>

              {/* URUTAN KERJA UTAMA (LANGKAH 1 - 2 - 3 BANNER) */}
              <div className="p-4 md:p-5 bg-slate-950/90 border-2 border-rose-500/30 rounded-3xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Urutan Kerja Utama Produksi
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Ikuti 3 langkah kerja utama:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Langkah 1: Copy Prompt Image */}
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[9.5px] uppercase tracking-wider">Langkah 1</span>
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-xs font-bold text-foreground">1. Copy Prompt Image</h4>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Salin prompt foto karakter untuk Midjourney / Flux.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(getAllImagePromptsText(ugcOutput), "Seluruh Prompt Image disalin!")}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-wider h-8.5 rounded-xl cursor-pointer"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy All Image Prompts
                    </Button>
                  </div>

                  {/* Langkah 2: Copy Prompt Video */}
                  <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-2xl flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-black text-[9.5px] uppercase tracking-wider">Langkah 2</span>
                        <Video className="w-4 h-4 text-rose-400" />
                      </div>
                      <h4 className="text-xs font-bold text-foreground">2. Copy Prompt Video</h4>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Salin prompt video 8s 3-part formula Google Flow.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCopy(getAllVideoPromptsText(), "Seluruh Prompt Video Google Flow disalin!")}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] tracking-wider h-8.5 rounded-xl cursor-pointer"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy All Video Prompts
                    </Button>
                  </div>

                  {/* Langkah 3: Buka Google Flow */}
                  <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/40 rounded-2xl flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-black text-[9.5px] uppercase tracking-wider">Langkah 3</span>
                        <ExternalLink className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h4 className="text-xs font-bold text-foreground">3. Buka Google Flow</h4>
                      <p className="text-[10.5px] text-muted-foreground leading-normal">
                        Generate video 8s langsung di platform Google Flow.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.open("https://labs.google/fx/tools/flow", "_blank")}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-wider h-8.5 rounded-xl cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Buka Google Flow
                    </Button>
                  </div>
                </div>
              </div>

              {/* FOKUS UTAMA LAYAR: SCENE CARDS (SCENE 1, SCENE 2, SCENE 3) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="text-sm font-heading font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-rose-500" />
                    Naskah & Prompt Scene Utama ({sceneKeys.length} Scene)
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-medium">Fokus Produksi Video Ads</span>
                </div>

                <div className={cn("grid grid-cols-1 gap-6", isThreeScene ? "xl:grid-cols-3" : "xl:grid-cols-2")}>
                  {sceneKeys.map((sceneKey) => renderSceneScriptCard(sceneKey))}
                </div>
              </div>

              {/* DETAIL MASTER PROMPT IMAGE ASSETS (COLLAPSIBLE / DETAIL) */}
              <div className="p-4 md:p-5 bg-card border border-border/80 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowMasterImages(!showMasterImages)}
                    className="text-xs font-heading font-black uppercase tracking-tight text-foreground flex items-center gap-2 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Detail Master Prompt Image Karakter & Scene</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 text-muted-foreground", showMasterImages && "rotate-180")} />
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(getAllImagePromptsText(ugcOutput), "Seluruh Prompt Image disalin!")}
                    className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 font-bold text-[10px] uppercase tracking-wider h-7 px-2.5 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy All Images
                  </Button>
                </div>

                {showMasterImages && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
                    {/* Master Character Reference */}
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          📸 Character Reference Prompt
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(getCharacterImagePrompt(ugcOutput), "Prompt Character Reference disalin!")}
                          className="text-[9.5px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-emerald-100/90 leading-relaxed max-h-24 overflow-y-auto break-words bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        {getCharacterImagePrompt(ugcOutput)}
                      </p>
                    </div>

                    {/* Scene 1 Image Prompt */}
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-rose-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
                          🖼️ Scene 1 Image Prompt (Hook Photo)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(getSceneImagePrompt("scene1", ugcOutput), "Prompt Scene 1 Image disalin!")}
                          className="text-[9.5px] font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-rose-100/90 leading-relaxed max-h-24 overflow-y-auto break-words bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        {getSceneImagePrompt("scene1", ugcOutput)}
                      </p>
                    </div>

                    {/* Scene 2 Image Prompt */}
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          🖼️ Scene 2 Image Prompt (Solution Photo)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(getSceneImagePrompt("scene2", ugcOutput), "Prompt Scene 2 Image disalin!")}
                          className="text-[9.5px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-emerald-100/90 leading-relaxed max-h-24 overflow-y-auto break-words bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        {getSceneImagePrompt("scene2", ugcOutput)}
                      </p>
                    </div>

                    {/* Scene 3 Image Prompt */}
                    {isThreeScene && (
                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-amber-900/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                            🖼️ Scene 3 Image Prompt (CTA Photo)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(getSceneImagePrompt("scene3", ugcOutput), "Prompt Scene 3 Image disalin!")}
                            className="text-[9.5px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-[10px] font-mono text-amber-100/90 leading-relaxed max-h-24 overflow-y-auto break-words bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                          {getSceneImagePrompt("scene3", ugcOutput)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FULL PACK PREVIEW BLOCK (COLLAPSIBLE, DEFAULT TERTUTUP) */}
              <div className="p-4 md:p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowFullPackPreview(!showFullPackPreview)}
                    className="text-xs font-black uppercase tracking-wider text-indigo-400 font-sans flex items-center gap-2 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Full Package Script & Prompt Summary (Teks Lengkap)</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 text-indigo-400", showFullPackPreview && "rotate-180")} />
                  </button>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(getFullScriptText(), "Seluruh paket produksi video disalin!")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-wider h-7 px-3 rounded-xl cursor-pointer"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy All Text
                  </Button>
                </div>

                {showFullPackPreview && (
                  <pre className="text-[10.5px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-2 text-slate-300 font-mono bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 select-all animate-in fade-in duration-200">
                    {getFullScriptText()}
                  </pre>
                )}
              </div>

              {/* CHARACTER LIBRARY (SECTION SEKUNDER AT VERY BOTTOM - COLLAPSIBLE) */}
              {characterLibrary.length > 0 && (
                <div className="p-4 md:p-5 bg-card border border-border/80 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowCharacterLibrary(!showCharacterLibrary)}
                      className="text-xs font-black uppercase tracking-wider text-amber-500 font-sans flex items-center gap-2 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4 text-amber-500" />
                      <span>Character Library ({characterLibrary.length} Tersimpan)</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 text-amber-500", showCharacterLibrary && "rotate-180")} />
                    </button>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                      Kelola persona tersimpan
                    </span>
                  </div>

                  {showCharacterLibrary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/50 animate-in fade-in duration-200">
                      {characterLibrary.map((char) => (
                        <div key={char.id} className="p-3.5 border border-border/80 rounded-2xl bg-secondary/15 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {char.avatarImageUrl ? (
                              <img src={char.avatarImageUrl} alt={char.name} className="w-10 h-10 rounded-xl object-cover border border-border shrink-0 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-black uppercase tracking-tight text-foreground truncate">{char.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{char.faceAndAppearance || char.clothing}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCharacter(char.id)}
                            className="text-rose-500 hover:bg-rose-500/10 cursor-pointer h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-card border border-border/80 rounded-3xl text-center space-y-4">
              <p className="text-xs text-muted-foreground font-medium">
                Belum ada Paket Produksi Video yang dibuat.
              </p>
              <Button
                onClick={() => setActiveSubTab("form")}
                variant="outline"
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Buka Form Video Ads
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
