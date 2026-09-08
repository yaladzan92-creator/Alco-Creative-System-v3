import { toast } from "sonner";
import { mergeWorkflowResult } from "@/services/brandIntelligence";
import { buildMetaAdsCampaignPack } from "./metaAdsCampaignPack";
import { buildContentEngineBlueprint } from "./contentEngineBlueprint";

function toText(value: any, fallback = ""): string {
  if (typeof value === "string") return cleanEncoding(value).trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function cleanEncoding(input: any): any {
  if (typeof input === "string") {
    return input
      .replace(/â€”|â€“|â€•|—|–|―/g, "-")
      .replace(/â€¢|•/g, "*")
      .replace(/â€™|Ã¢â‚¬â„¢|’|‘/g, "'")
      .replace(/Ã¢â‚¬Å“|Ã¢â‚¬ï¿½|â€|“|”/g, '"')
      .replace(/Ã|Â/g, "")
      .replace(/ðŸ[^\s\w]*/g, "");
  }
  if (Array.isArray(input)) {
    return input.map(cleanEncoding);
  }
  if (typeof input === "object" && input !== null) {
    const result: any = {};
    for (const key of Object.keys(input)) {
      result[key] = cleanEncoding(input[key]);
    }
    return result;
  }
  return input;
}

function toList(values: any, fallback: string[] = []): string[] {
  if (!values) return fallback;
  if (Array.isArray(values)) {
    const cleaned = values
      .map((item) => (typeof item === "string" ? item.trim() : typeof item === "object" && item !== null ? JSON.stringify(item) : String(item || "").trim()))
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : fallback;
  }
  if (typeof values === "string") {
    const trimmed = values.trim();
    if (!trimmed) return fallback;
    const items = trimmed
      .split(/\n|•|\*|,/)
      .map((s) => s.trim().replace(/^[-–—\d.)\s]+/, "").trim())
      .filter(Boolean);
    return items.length > 0 ? items : [trimmed];
  }
  return fallback;
}

function firstNonEmpty(...values: any[]): string {
  for (const value of values) {
    const text = toText(value, "");
    if (text) return text;
  }
  return "";
}

/**
 * Builds the comprehensive, official `alco_ecosystem_blueprint.json` schema
 * that powers both ALCO Content Engine and ALCO Product Forge, alongside
 * ALCO Creative System and Meta Ads.
 */
export function buildEcosystemBlueprint(project: any) {
  const bi = mergeWorkflowResult(project || {});
  const sbc = project?.sharedBusinessContext || {};
  const contentEngineBp = buildContentEngineBlueprint(project);
  const metaAdsPack = buildMetaAdsCampaignPack(project);

  // 1. BRAND IDENTITY
  const productName = firstNonEmpty(
    project?.offerData?.selectedOption?.product_name,
    project?.offerData?.input?.product_name,
    project?.initialProductData?.productName,
    sbc?.product?.projectName,
    project?.name,
    "Untitled Product"
  );

  const brandName = firstNonEmpty(
    sbc?.branding?.brandName,
    sbc?.product?.brandName,
    project?.brandFoundationData?.brandName,
    project?.brandFoundationData?.input?.brandName,
    project?.brandFoundationData?.selectedOption?.brand_name,
    bi?.brandIdentity?.brandName,
    project?.name,
    "Untitled Brand"
  );

  const category = firstNonEmpty(
    sbc?.product?.category,
    sbc?.product?.industry,
    project?.initialProductData?.productCategory,
    project?.nicheData?.selectedOption?.name,
    project?.nicheData?.output?.niche,
    bi?.brandIdentity?.niche,
    bi?.brandIdentity?.industry,
    "Digital Business"
  );

  const mission = firstNonEmpty(
    sbc?.branding?.mission,
    project?.brandFoundationData?.selectedOption?.mission,
    project?.brandFoundationData?.input?.mission,
    bi?.brandIdentity?.mission,
    `Membantu ${bi?.audience?.primaryAudience || "pelanggan"} mencapai hasil maksimal melalui solusi inovatif.`
  );

  const vision = firstNonEmpty(
    sbc?.branding?.vision,
    project?.brandFoundationData?.selectedOption?.vision,
    project?.brandFoundationData?.input?.vision,
    bi?.brandIdentity?.vision,
    `Menjadi brand terdepan dan terpercaya di industri ${category}.`
  );

  const tagline = firstNonEmpty(
    sbc?.branding?.tagline,
    project?.brandFoundationData?.selectedOption?.tagline,
    project?.brandFoundationData?.input?.tagline,
    project?.positioningData?.selectedOption?.USP,
    bi?.brandIdentity?.usp,
    "Solusi Praktis, Hasil Nyata"
  );

  const tone = firstNonEmpty(
    sbc?.branding?.tone,
    project?.brandFoundationData?.selectedOption?.tone,
    project?.copyDirection?.selectedOption?.tone,
    project?.copyDirection?.input?.tone,
    "Persuasif, Edukatif, Profesional, Empatis & Berorientasi Solusi"
  );

  // 2. BRAND VISUAL IDENTITY
  const visualStyle = firstNonEmpty(
    project?.brandFoundationData?.selectedOption?.visual_style,
    project?.brandFoundationData?.input?.visualStyle,
    "Modern, Clean, High-Contrast Digital Aesthetic"
  );

  const colorPalette = toList(
    project?.brandFoundationData?.selectedOption?.color_palette ||
      project?.brandFoundationData?.input?.colorPalette ||
      project?.landingPageData?.colorPalette,
    ["#0F172A (Deep Slate)", "#10B981 (Emerald Green)", "#F8FAFC (Clean White)", "#6366F1 (Indigo Accent)"]
  );

  const typographyStyle = firstNonEmpty(
    project?.brandFoundationData?.selectedOption?.typography_style,
    project?.brandFoundationData?.input?.typography,
    "Display Sans-Serif Bold untuk Headings, Refined Neutral Sans untuk Body"
  );

  const logoNotes = firstNonEmpty(
    project?.brandFoundationData?.selectedOption?.logo_notes,
    project?.brandFoundationData?.input?.logoNotes,
    "Clean vector geometry, versatile across dark & light backgrounds with high legibility icon mark"
  );

  const imageStyleRules = toList(
    project?.brandFoundationData?.selectedOption?.image_style_rules || [
      "Pencahayaan natural indoor/studio berkarakter autentik",
      "Karakter realistis bergaya UGC dengan ekspresi relatable",
      "Komposisi bersih tanpa clutter background",
      "Format 9:16 untuk vertikal video & 1:1 / 4:5 untuk feed imagery"
    ]
  );

  const designMood = firstNonEmpty(
    project?.brandFoundationData?.selectedOption?.design_mood,
    project?.brandFoundationData?.input?.designMood,
    "Trustworthy, Actionable, Premium yet Accessible"
  );

  // 3. TARGET AUDIENCE
  const primaryAudience = firstNonEmpty(
    sbc?.audience?.primary,
    project?.audienceData?.selectedOption?.persona_name,
    project?.audienceData?.selectedOption?.persona,
    project?.audienceData?.input?.audienceGoal,
    bi?.audience?.primaryAudience,
    "Target Audience"
  );

  const audienceProblems = toList(
    project?.painPointData?.selectedOption?.pain_points ||
      project?.painPointData?.input?.painPoints ||
      sbc?.problem?.painPoints ||
      bi?.audience?.painPoints,
    ["Kurang konsistensi dan sistem terarah", "Terlalu banyak teori tanpa implementasi praktis"]
  );

  const audienceDesires = toList(
    project?.audienceData?.selectedOption?.desires ||
      project?.audienceData?.input?.desires ||
      sbc?.audience?.desires ||
      bi?.audience?.desires,
    ["Meningkatkan efisiensi kerja dan profit", "Mempunyai sistem bisnis digital yang repeatable"]
  );

  const objections = toList(
    project?.audienceData?.selectedOption?.objections ||
      project?.audienceData?.input?.objections ||
      bi?.audience?.objections,
    ["Khawatir materi terlalu rumit", "Ragu apakah hasilnya bisa langsung diaplikasikan"]
  );

  const trustTriggers = toList(
    sbc?.audience?.trustTriggers ||
      project?.audienceData?.selectedOption?.trust_triggers ||
      project?.validationData?.selectedOption?.proof_points,
    ["Framework teruji di lapangan", "Studi kasus nyata", "Garansi kepuasan tanpa resiko"]
  );

  const emotionalTriggers = toList(
    sbc?.audience?.emotionalTriggers ||
      project?.audienceData?.selectedOption?.emotional_triggers ||
      project?.marketingAngles?.selectedOption?.emotional_hook,
    ["Keinginan untuk mandiri secara finansial", "Kelegaan saat beban kerja berkurang", "Kebanggaan memiliki brand profesional"]
  );

  // 4. POSITIONING
  const corePositioning = firstNonEmpty(
    sbc?.strategy?.positioning,
    project?.positioningData?.selectedOption?.positioning_statement,
    project?.positioningData?.input?.positioning_statement,
    bi?.brandIdentity?.positioning,
    `Sistem terlengkap untuk ${primaryAudience} yang ingin hasil nyata tanpa proses rumit.`
  );

  const rawUsp = project?.positioningData?.selectedOption?.USP ||
    project?.positioningData?.input?.USP ||
    sbc?.strategy?.usp ||
    bi?.brandIdentity?.usp;
  const uspArray = toList(rawUsp, [
    "Format implementasi plug-and-play siap pakai",
    "Framework berbasis data bukan sekedar teori",
    "Ekosistem terintegrasi dari strategi hingga konten kreatif"
  ]);

  const valueProposition = firstNonEmpty(
    sbc?.strategy?.valueProposition,
    project?.positioningData?.selectedOption?.value_proposition,
    project?.positioningData?.input?.value_proposition,
    bi?.brandIdentity?.positioning,
    `Memberikan percepatan hasil bagi ${primaryAudience} dengan metode yang sudah tervalidasi.`
  );

  const validationSummary = firstNonEmpty(
    sbc?.strategy?.validationSummary,
    project?.validationData?.selectedOption?.summary,
    project?.validationData?.input?.validationSummary,
    "Validasi pasar menunjukkan permintaan tinggi pada format praktis dan siap eksekusi langsung."
  );

  // 5. OFFER
  const mainOffer = firstNonEmpty(
    sbc?.strategy?.offer,
    project?.offerData?.selectedOption?.main_offer,
    project?.offerData?.input?.main_offer,
    project?.offerData?.selectedOption?.product_name,
    productName
  );

  const pricing = firstNonEmpty(
    sbc?.strategy?.pricing,
    project?.offerData?.selectedOption?.pricing_strategy,
    project?.offerData?.input?.pricing_strategy,
    project?.offerData?.selectedOption?.price,
    project?.offerData?.input?.price,
    "Rp 299.000 (Early Bird Access)"
  );

  const urgency = firstNonEmpty(
    sbc?.strategy?.urgency,
    project?.offerData?.selectedOption?.urgency,
    project?.offerData?.input?.urgency,
    "Penawaran harga spesial terbatas untuk batch peluncuran saat ini."
  );

  const offerBenefits = toList(
    project?.offerData?.selectedOption?.benefits ||
      project?.offerData?.selectedOption?.deliverables ||
      project?.offerData?.input?.benefits,
    [
      "Blueprint strategi lengkap siap pakai",
      "Akses materi dan template operasional seumur hidup",
      "Dukungan komunitas dan panduan eksekusi langkah-demi-langkah"
    ]
  );

  // 6. MESSAGING
  const coreMessage = firstNonEmpty(
    contentEngineBp?.messaging?.core_message,
    project?.copyDirection?.selectedOption?.core_message,
    project?.marketingAngles?.selectedOption?.angle,
    `Bangun dan skalakan ${brandName} dengan strategi konten dan produk yang terbukti mengonversi.`
  );

  const brandVoice = firstNonEmpty(
    project?.copyDirection?.selectedOption?.brand_voice,
    sbc?.branding?.brandVoice,
    "Otoritatif namun bersahabat, lugas, anti-basa-basi, dan memberdayakan pembaca."
  );

  const rawCopyDir = project?.copyDirection?.selectedOption?.direction ||
    project?.copyDirection?.input?.direction ||
    sbc?.campaign?.copyDirection ||
    "Fokus pada perbandingan Before-After, soroti efisiensi waktu, dan hadirkan Call-To-Action yang jelas tanpa paksaan berlebihan.";
  const copyDirectionArray = Array.isArray(rawCopyDir)
    ? toList(rawCopyDir)
    : [toText(rawCopyDir, "Fokus pada perbandingan Before-After, soroti efisiensi waktu, dan hadirkan Call-To-Action yang jelas.")].filter(Boolean);

  const wordsToUse = toList(
    project?.copyDirection?.selectedOption?.words_to_use,
    ["Terbukti", "Praktis", "Sistem", "Hasil Nyata", "Langkah Nyata", "Efisien", "Langsung Eksekusi"]
  );

  const wordsToAvoid = toList(
    project?.copyDirection?.selectedOption?.words_to_avoid,
    ["Cepat Kaya", "Tanpa Usaha", "Garansi 100% Kaya Mendadak", "Gimmick Murahan", "Pasti Berhasil Tanpa Kerja"]
  );

  // 7. CONTENT STRATEGY
  const contentPillars = toList(
    project?.marketingAngles?.selectedOption?.angles || [
      "Edukasi Fundamental & Kesalahan Fatal Pemula (Problem Awareness)",
      "Behind the Scenes, Breakdown Studi Kasus & Bukti Nyata (Solution Awareness)",
      "Tutorial Praktis, Template & Framework Siap Pakai (Product Awareness)",
      "Penawaran Eksklusif, Perbandingan Solusi & Social Proof (Conversion)"
    ]
  );

  const funnelRules = {
    tofu: toList(project?.contentStrategy?.tofu || [
      "Fokus pada identifikasi masalah utama dan mitos umum di industri",
      "Gunakan hook emosional atau data mengejutkan dalam 3 detik pertama",
      "Tujuan: Menarik perhatian, membangun awareness, dan mengumpulkan audiens luas"
    ]),
    mofu: toList(project?.contentStrategy?.mofu || [
      "Berikan demonstrasi solusi, framework, dan perbandingan cara lama vs cara baru",
      "Hadirkan studi kasus nyata dan breakdown langkah implementasi",
      "Tujuan: Membangun otoritas, rasa percaya, dan desire terhadap solusi"
    ]),
    bofu: toList(project?.contentStrategy?.bofu || [
      "Hadirkan penawaran spesifik, jaminan garansi, dan alasan urgensi",
      "Gunakan CTA langsung dengan instruksi yang sangat jelas",
      "Tujuan: Mengonversi audiens yang siap beli menjadi pembeli aktif"
    ])
  };

  const ctaRules = toList(project?.contentStrategy?.cta_rules || [
    "Gunakan kata kerja aktif spesifik (misal: 'Dapatkan Blueprint Sekarang', 'Pelajari Framework Lengkap')",
    "Batasi hanya satu CTA utama per konten agar audiens tidak bingung",
    "Sertakan benefit instan di dekat tombol CTA"
  ]);

  const contentFormatRules = toList(project?.contentStrategy?.format_rules || [
    "Vertikal Video 9:16 (Reels/TikTok/Shorts) dengan subtitle kontras tinggi",
    "Carousel Edukatif 1:1 atau 4:5 berisi 4-7 slide dengan visual diagram bersih",
    "Direct Single Image Ads dengan headline tebal dan penawaran jelas"
  ]);

  // 8. PRODUCT STRATEGY
  const productType = firstNonEmpty(
    project?.initialProductData?.productCategory === 'non_digital' ? 'Non-Digital / Physical / Service' : 'Digital Product / Workshop / SaaS',
    "Digital Blueprint & Workflow System"
  );

  const productPromise = firstNonEmpty(
    project?.offerData?.selectedOption?.promise,
    project?.positioningData?.selectedOption?.value_proposition,
    `Mentransformasi ${primaryAudience} dari kebingungan operasional menjadi memiliki sistem terstruktur dalam waktu singkat.`
  );

  const rawModules = project?.offerData?.selectedOption?.curriculum ||
    project?.offerData?.selectedOption?.modules ||
    project?.offerData?.selectedOption?.deliverables || [
      "Modul 1: Fondasi & Validasi Pasar Tepat Sasaran",
      "Modul 2: Pengembangan Penawaran Berdaya Tarik Tinggi",
      "Modul 3: Sistem Konten & Peluncuran Kampanye Iklan"
    ];
  const modulesOrFeatures = toList(rawModules);

  const transformation = firstNonEmpty(
    project?.offerData?.selectedOption?.transformation,
    primaryAudience ? `Dari ragu dan tidak memiliki arah jelas menjadi eksekutor percaya diri dengan sistem terukur untuk ${primaryAudience}.` : "Transformasi menyeluruh menuju efisiensi dan hasil nyata."
  );

  const deliveryNotes = toList(project?.productStrategy?.delivery_notes || [
    "Akses langsung via platform digital instan setelah pembayaran",
    "Template dan dokumen pendukung siap diunduh dalam format standar",
    "Pembaruan materi berkala sesuai perkembangan industri"
  ]);

  // UGC & Scene data if generated in Step 10
  const ugcOutput = project?.adsRecommendationsState?.ugcOutput || project?.adsOutputState?.ugcOutput || null;
  const ugcCharacterProfile = ugcOutput?.characterProfile || null;
  const ugcScenes = ugcOutput?.scenes || ugcOutput?.script || null;

  return cleanEncoding({
    blueprint_type: "alco_ecosystem_blueprint",
    blueprint_version: "1.0.0",
    source_app: "Alco Creative System",
    generated_at: new Date().toISOString(),
    source_project: {
      id: project?.id || null,
      name: project?.name || "Untitled Project",
      schema_version: project?.schemaVersion || "2.0.0",
      workflow_version: project?.workflowVersion || "1.0.0"
    },
    brand_identity: {
      brand_name: brandName,
      product_name: productName,
      category: category,
      mission: mission,
      vision: vision,
      tagline: tagline,
      tone: tone
    },
    brand_visual_identity: {
      visual_style: visualStyle,
      color_palette: colorPalette,
      typography_style: typographyStyle,
      logo_notes: logoNotes,
      image_style_rules: imageStyleRules,
      design_mood: designMood
    },
    target_audience: {
      primary_audience: primaryAudience,
      audience_problem: audienceProblems,
      audience_desire: audienceDesires,
      problems: audienceProblems, // alias
      desires: audienceDesires, // alias
      objections: objections,
      trust_triggers: trustTriggers,
      emotional_triggers: emotionalTriggers
    },
    positioning: {
      core_positioning: corePositioning,
      usp: uspArray,
      value_proposition: valueProposition,
      validation_summary: validationSummary
    },
    offer: {
      main_offer: mainOffer,
      pricing: pricing,
      urgency: urgency,
      offer_benefits: offerBenefits
    },
    messaging: {
      core_message: coreMessage,
      brand_voice: brandVoice,
      copy_direction: copyDirectionArray,
      words_to_use: wordsToUse,
      words_to_avoid: wordsToAvoid
    },
    content_strategy: {
      content_pillars: contentPillars,
      funnel_rules: funnelRules,
      cta_rules: ctaRules,
      content_format_rules: contentFormatRules
    },
    product_strategy: {
      product_type: productType,
      product_promise: productPromise,
      modules_or_features: modulesOrFeatures,
      transformation: transformation,
      delivery_notes: deliveryNotes
    },
    app_targets: {
      content_engine: {
        strategy_blueprint: buildContentEngineBlueprint(project),
        brand_name: brandName,
        tone: tone,
        primary_audience: primaryAudience,
        core_message: coreMessage,
        content_pillars: contentPillars,
        hooks: contentEngineBp?.messaging?.primary_hooks || [],
        ugc_character_profile: ugcCharacterProfile,
        ugc_3_scene_pack: ugcScenes,
        google_flow_prompts: ugcOutput?.googleFlowPrompts || null,
        funnel_rules: funnelRules,
        copy_guidelines: {
          brand_voice: brandVoice,
          words_to_use: wordsToUse,
          words_to_avoid: wordsToAvoid
        }
      },
      product_forge: {
        product_name: productName,
        product_type: productType,
        category: category,
        target_audience: primaryAudience,
        promise: productPromise,
        transformation: transformation,
        core_offer: mainOffer,
        pricing: pricing,
        benefits: offerBenefits,
        modules_or_features: modulesOrFeatures,
        delivery_notes: deliveryNotes,
        landing_page_blueprint: project?.landingPageData || null
      }
    }
  });
}

export interface BlueprintValidationResult {
  isValid: boolean;
  missingFields: string[];
  blueprint: any;
}

export function validateEcosystemBlueprint(project: any): BlueprintValidationResult {
  const blueprint = buildEcosystemBlueprint(project);
  const missingFields: string[] = [];

  const isNotEmptyStr = (val: any, disallowed: string[] = []) => {
    if (typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    return !disallowed.some((d) => d.toLowerCase() === trimmed.toLowerCase());
  };

  const isNotEmptyList = (val: any) => {
    if (Array.isArray(val)) {
      return val.some((item) => typeof item === "string" && item.trim().length > 0);
    }
    return isNotEmptyStr(val);
  };

  // 1. brand_identity.brand_name
  const brandName = blueprint?.brand_identity?.brand_name;
  if (!isNotEmptyStr(brandName, ["Untitled Brand", "Untitled Project"])) {
    missingFields.push("brand_identity.brand_name");
  }

  // 2. target_audience.primary_audience
  const primaryAudience = blueprint?.target_audience?.primary_audience;
  if (!isNotEmptyStr(primaryAudience, ["Target Audience"])) {
    missingFields.push("target_audience.primary_audience");
  }

  // 3. target_audience.audience_problem
  const audienceProblem = blueprint?.target_audience?.audience_problem;
  if (!isNotEmptyList(audienceProblem)) {
    missingFields.push("target_audience.audience_problem");
  }

  // 4. positioning.core_positioning atau positioning.usp
  const corePos = blueprint?.positioning?.core_positioning;
  const usp = blueprint?.positioning?.usp;
  const hasCorePos = isNotEmptyStr(corePos);
  const hasUsp = isNotEmptyList(usp);
  if (!hasCorePos && !hasUsp) {
    missingFields.push("positioning.core_positioning / positioning.usp");
  }

  // 5. offer.main_offer
  const mainOffer = blueprint?.offer?.main_offer;
  if (!isNotEmptyStr(mainOffer, ["Untitled Product"])) {
    missingFields.push("offer.main_offer");
  }

  // 6. messaging.core_message
  const coreMessage = blueprint?.messaging?.core_message;
  if (!isNotEmptyStr(coreMessage)) {
    missingFields.push("messaging.core_message");
  }

  // 7. brand_visual_identity.visual_style atau image_style_rules
  const visualStyle = blueprint?.brand_visual_identity?.visual_style;
  const imageStyleRules = blueprint?.brand_visual_identity?.image_style_rules;
  const hasVisualStyle = isNotEmptyStr(visualStyle);
  const hasImageStyle = isNotEmptyList(imageStyleRules);
  if (!hasVisualStyle && !hasImageStyle) {
    missingFields.push("brand_visual_identity.visual_style / image_style_rules");
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    blueprint
  };
}

/**
 * Downloads the official `alco_ecosystem_blueprint.json` file.
 * Performs validation before downloading unless bypassed.
 */
export function downloadEcosystemBlueprint(
  project: any,
  customFilename?: string,
  options?: { bypassValidation?: boolean }
): boolean {
  if (!options?.bypassValidation) {
    const { isValid, missingFields } = validateEcosystemBlueprint(project);
    if (!isValid) {
      toast.error("Gagal Download Blueprint ALCO: Field Belum Lengkap", {
        description: `Harap lengkapi field berikut terlebih dahulu:\n- ${missingFields.join("\n- ")}`,
        duration: 7000
      });
      return false;
    }
  }

  const blueprint = buildEcosystemBlueprint(project);
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(blueprint, null, 2)
  )}`;
  const fileName = customFilename || "alco_ecosystem_blueprint.json";
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  return true;
}
