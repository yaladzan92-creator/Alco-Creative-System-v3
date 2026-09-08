import { mergeWorkflowResult } from "@/services/brandIntelligence";

export interface MetaAdsCampaignPack {
  // Legacy / Direct compatibility fields
  campaignName: string;
  objective: "OUTCOME_SALES" | "OUTCOME_LEADS" | "OUTCOME_ENGAGEMENT";
  dailyBudget: number;
  targeting: {
    country: string;
    ageMin: number;
    ageMax: number;
    interests: string[];
    behaviors?: string[];
    exclusions?: string[];
    age_range?: { min: number; max: number };
  };
  adVariants: Array<{
    hook: string;
    headline: string;
    primaryText: string;
    cta: string;
  }>;

  // Standard Ads-Manager-Ready fields
  campaign_name: string;
  campaign_objective: "OUTCOME_SALES" | "OUTCOME_LEADS" | "OUTCOME_ENGAGEMENT";
  adset_recommendation: {
    name: string;
    optimization_goal: string;
    conversion_event: string;
    bid_strategy: string;
  };
  placement_recommendation: {
    advantage_plus: boolean;
    recommended_placements: string[];
    notes: string;
  };
  budget_recommendation: {
    daily_budget_idr: number;
    budget_type: string;
    testing_duration_days: number;
    scaling_trigger: string;
  };
  schedule_recommendation: {
    start_time: string;
    dayparting_notes: string;
  };
  creative_strategy: {
    primary_angle: string;
    visual_hook: string;
    emotional_trigger: string;
    value_proposition: string;
  };
  copy_assets: {
    hooks: string[];
    headlines: string[];
    primary_texts: string[];
    ctas: string[];
  };
  image_ads: Array<{
    id: string;
    angle_name: string;
    aspect_ratio: string;
    visual_description: string;
    headline: string;
    primary_text: string;
    cta: string;
    final_prompt?: string;
  }>;
  carousel_ads: Array<{
    id: string;
    title: string;
    slides: Array<{
      slide_number: number;
      headline: string;
      visual_note: string;
      body?: string;
    }>;
  }>;
  video_ads: Array<{
    id: string;
    title: string;
    hook_script: string;
    visual_pacing: string;
    persona: string;
    full_script?: string;
  }>;
  tracking_checklist: string[];
  policy_flags: string[];
  assumptions: string[];
  implementation_checklist: string[];
}

export function buildMetaAdsCampaignPack(project: any): MetaAdsCampaignPack {
  const bi = mergeWorkflowResult(project || {});

  // 1. Target Location & Demographics (Grounded in project data)
  const country =
    project?.adsRecommendationsState?.targeting?.country ||
    project?.sharedBusinessContext?.targetCountry ||
    project?.nicheData?.output?.country ||
    project?.nicheData?.input?.country ||
    project?.audienceData?.input?.country ||
    "Indonesia";

  const ageMin =
    Number(project?.adsRecommendationsState?.targeting?.ageMin) ||
    Number(project?.nicheData?.input?.ageMin) ||
    Number(project?.audienceData?.input?.ageMin) ||
    21;

  const ageMax =
    Number(project?.adsRecommendationsState?.targeting?.ageMax) ||
    Number(project?.nicheData?.input?.ageMax) ||
    Number(project?.audienceData?.input?.ageMax) ||
    45;

  // 2. Targeting Interests, Behaviors, and Exclusions
  const projInterests = project?.adsRecommendationsState?.targeting?.interests || project?.audienceData?.output?.interests || project?.audienceData?.input?.interests;
  const rawInterests = [
    ...(Array.isArray(projInterests) ? projInterests : []),
    project?.sharedBusinessContext?.niche,
    project?.nicheData?.output?.niche,
    project?.nicheData?.input?.niche,
    bi.brandIdentity.niche,
    bi.brandIdentity.industry,
    ...(bi.audience?.desires || [])
  ].filter((item): item is string => Boolean(item && typeof item === "string" && item.trim().length > 0));

  const interestsList = Array.from(new Set(rawInterests));
  if (interestsList.length === 0) {
    interestsList.push("Digital Marketing", "Online Business", "E-learning");
  }

  const projBehaviors = project?.adsRecommendationsState?.targeting?.behaviors || project?.audienceData?.output?.behaviors || project?.audienceData?.input?.behaviors;
  const behaviors = Array.isArray(projBehaviors) && projBehaviors.length > 0
    ? projBehaviors
    : ["Engaged Shoppers", "Digital Device Users"];

  const projExclusions = project?.adsRecommendationsState?.targeting?.exclusions || project?.audienceData?.output?.exclusions || project?.audienceData?.input?.exclusions;
  const exclusions = Array.isArray(projExclusions) && projExclusions.length > 0
    ? projExclusions
    : ["Existing Customers"];

  // 3. Product & Brand Identity context
  const productName = project?.sharedBusinessContext?.brandName || project?.name || bi.brandIdentity.brandName || "Produk Digital";
  const campaignName = `Meta Ads - ${productName}`;
  const dailyBudget = Number(project?.adsInputState?.dailyBudget) || Number(project?.adsRecommendationsState?.budget?.daily_budget_idr) || 100000;
  const nicheName = project?.sharedBusinessContext?.niche || bi.brandIdentity.niche || "Digital Product";
  const targetAudience = project?.sharedBusinessContext?.targetAudience || bi.audience.primaryAudience || "Target Customer";
  const painPoint = project?.sharedBusinessContext?.primaryPainPoint || bi.audience.frustrations[0] || bi.audience.painPoints[0] || "kesulitan hasil stagnan";
  const usp = project?.sharedBusinessContext?.uniqueSellingProposition || bi.brandIdentity.usp || "Solusi praktis dan cepat";
  const priceOffer = project?.sharedBusinessContext?.pricingStrategy || project?.offerData?.output?.price || project?.offerData?.input?.price || "";

  // 4. Copy Assets & Hooks (prioritize workflow data)
  const projectHooks = project?.copyDirection?.output?.hooks || project?.marketingAngles?.output?.hooks || project?.adsInputState?.hooks;
  const hooks: string[] = Array.isArray(projectHooks) && projectHooks.length > 0
    ? projectHooks
    : bi.generatedAssets.hooks.length > 0
    ? bi.generatedAssets.hooks
    : [`Rahasia Sukses ${productName} Tercepat!`, `Solusi Praktis Mengatasi ${painPoint}.`, `Bebas Dari ${painPoint} Sekarang!`];

  const projectHeadlines = project?.copyDirection?.output?.headlines || project?.marketingAngles?.output?.headlines || project?.adsInputState?.headlines;
  const headlines: string[] = Array.isArray(projectHeadlines) && projectHeadlines.length > 0
    ? projectHeadlines
    : bi.generatedAssets.headlines.length > 0
    ? bi.generatedAssets.headlines
    : [`Akses Instan ${productName}`, `Solusi Praktis Siap Pakai`, `Hasil Maksimal Dalam Hitungan Hari`];

  const projectPrimaryTexts = project?.copyDirection?.output?.primaryTexts || project?.copyDirection?.output?.adCopies || project?.adsInputState?.primaryTexts;
  const primaryTexts: string[] = Array.isArray(projectPrimaryTexts) && projectPrimaryTexts.length > 0
    ? projectPrimaryTexts
    : bi.generatedAssets.adCopies.length > 0
    ? bi.generatedAssets.adCopies
    : [`Dapatkan panduan dan modul lengkap ${productName} untuk mengatasi ${painPoint} tanpa pusing riset manual.`];

  const projectCtas = project?.copyDirection?.output?.ctas || project?.adsInputState?.ctas;
  const ctas: string[] = Array.isArray(projectCtas) && projectCtas.length > 0
    ? projectCtas
    : ["Dapatkan Sekarang", "Beli Sekarang", "Akses Sekarang", "Pelajari Selengkapnya"];

  const adVariants = hooks.slice(0, 3).map((hook, idx) => ({
    hook,
    headline: headlines[idx] || `Solusi ${productName}`,
    primaryText: primaryTexts[idx] || `Dapatkan solusi ${productName} sekarang juga.`,
    cta: ctas[idx] || "Dapatkan Sekarang"
  }));

  // 5. Image Ads (grounded in project angles / creative assets)
  const rawAngles = project?.adsGeneratedAngles || project?.adsInputState?.adsGeneratedAngles || project?.marketingAngles?.output?.angles || project?.copyDirection?.output?.imageAds;
  const image_ads = Array.isArray(rawAngles) && rawAngles.length > 0
    ? rawAngles.map((angle: any, idx: number) => ({
        id: angle.id || `angle_${idx + 1}`,
        angle_name: angle.name || angle.angleName || `Angle ${idx + 1}: ${angle.title || 'Sudut Pandang Iklan'}`,
        aspect_ratio: project?.adsInputState?.imageFormat || angle.aspectRatio || "4:5",
        visual_description: angle.visualStrategy || angle.hookStrategy || angle.description || `Visual berkonversi tinggi untuk ${productName} yang relevan dengan ${targetAudience}.`,
        headline: angle.headline || headlines[idx] || `Akses ${productName} Sekarang`,
        primary_text: angle.primaryText || primaryTexts[idx] || `Solusi praktis ${productName} untuk hasil instan.`,
        cta: angle.ctaRecommendation || angle.cta || ctas[idx] || "Dapatkan Sekarang",
        final_prompt: angle.finalPrompt || angle.prompt || undefined
      }))
    : [
        {
          id: "A",
          angle_name: `Sudut Pandang Emosional (Pain to Relief: ${painPoint})`,
          aspect_ratio: project?.adsInputState?.imageFormat || "4:5",
          visual_description: `Visual ekspresi lega pembeli ${productName} yang berhasil mengatasi ${painPoint} dengan latar studio bersih.`,
          headline: headlines[0] || `Solusi Instan Bebas Dari ${painPoint}!`,
          primary_text: primaryTexts[0] || `Hentikan buang waktu dengan cara lama. Gunakan ${productName} sekarang.`,
          cta: ctas[0] || "Dapatkan Sekarang",
          final_prompt: `Fotografi komersial studio, ekspresi senyum lega pembeli di depan laptop cerah, menampilkan ${productName}, pencahayaan lembut, rasio 4:5.`
        },
        {
          id: "B",
          angle_name: `Sudut Pandang Solusi Masalah (${usp})`,
          aspect_ratio: project?.adsInputState?.imageFormat || "4:5",
          visual_description: `Tampilan mockup produk ${productName} beserta keunggulan utama (${usp}).`,
          headline: headlines[1] || `Cara Tercepat Hasil Maksimal Dengan ${productName}`,
          primary_text: primaryTexts[1] || `Dapatkan sistem siap pakai yang sudah teruji menghasilkan penjualan.`,
          cta: ctas[1] || "Beli Sekarang",
          final_prompt: `Mockup 3D ${productName} pada layar tablet & laptop elegan, latar belakang bokeh netral, rasio 4:5.`
        }
      ];

  // 6. Carousel Ads (grounded in project state)
  const rawCarousel = project?.adsInputState?.generatedCarousel || project?.generatedCarousel || project?.offerData?.output?.carousel || project?.marketingAngles?.output?.carousel || project?.copyDirection?.output?.carousel;
  const carousel_ads = Array.isArray(rawCarousel) && rawCarousel.length > 0
    ? rawCarousel.map((c: any, idx: number) => ({
        id: c.id || `carousel_${idx + 1}`,
        title: c.title || `Carousel Sequence ${idx + 1} - ${productName}`,
        slides: Array.isArray(c.slides) ? c.slides.map((s: any, sIdx: number) => ({
          slide_number: s.slideNumber || sIdx + 1,
          headline: s.headline || s.title || `Slide ${sIdx + 1}`,
          visual_note: s.visualNote || s.description || `Visual pembuktian nilai ${productName}.`,
          body: s.body || s.copy || undefined
        })) : []
      }))
    : [
        {
          id: "car_1",
          title: `Sequenced 5-Slide Conversion Carousel - ${productName}`,
          slides: [
            { slide_number: 1, headline: `Masih Mengalami ${painPoint}?`, visual_note: `Slide Hook: Ilustrasi keluhan utama ${targetAudience} terkait ${nicheName}.` },
            { slide_number: 2, headline: "Mengapa Cara Lama Sudah Tidak Efektif", visual_note: "Slide Agitasi: Penjelasan kesalahan umum yang sering terjadi." },
            { slide_number: 3, headline: `Solusi Praktis: ${productName}`, visual_note: `Slide Solusi: Tampilan paket utama ${productName} (${usp}).` },
            { slide_number: 4, headline: "Semua Fitur & Modul Siap Gunakan", visual_note: "Slide Offer: Visualisasi tumpukan modul dan bonus pendukung." },
            { slide_number: 5, headline: `Dapatkan Akses ${productName} Hari Ini!`, visual_note: `Slide CTA: Tombol pendaftaran dan penawaran spesial${priceOffer ? ' ' + priceOffer : ''}.` }
          ]
        }
      ];

  // 7. Video Ads (grounded in project scripts)
  const rawVideo = project?.adsInputState?.generatedVideoDirections || project?.generatedVideoDirections || project?.copyDirection?.output?.videoScripts || project?.marketingAngles?.output?.videoScripts;
  const video_ads = Array.isArray(rawVideo) && rawVideo.length > 0
    ? rawVideo.map((v: any, idx: number) => ({
        id: v.id || `video_${idx + 1}`,
        title: v.title || `Video Ad Script ${idx + 1} - ${productName}`,
        hook_script: v.hookScript || v.hook || hooks[idx] || "2 detik pertama yang menghentikan scroll jari audiens.",
        visual_pacing: v.pacing || v.visualPacing || "High energy 1.5s cuts dengan pop-up text overlays.",
        persona: v.persona || `Kreator UGC Relevan (${targetAudience})`,
        full_script: v.fullScript || v.script || undefined
      }))
    : [
        {
          id: "vid_1",
          title: `UGC Pattern Interrupt Video Script (9:16) - ${productName}`,
          hook_script: hooks[0] ? `"${hooks[0]}"` : `"Jujur ya, kalau kamu masih pusing menghadapi ${painPoint}, kamu wajib tonton video ini sampai habis..."`,
          visual_pacing: "Jump cuts tiap 1.5 detik dengan teks popup kontras & efek suara letupan (pop sound).",
          persona: `Kreator UGC santai & jujur mewakili profil ${targetAudience}.`,
          full_script: `0-3s: Hook kejutan ("${hooks[0] || 'Stop scroll!'}"). 3-10s: Tunjukkan masalah (${painPoint}). 10-20s: Demo solusi instan ${productName} (${usp}). 20-30s: Call to Action tegas (${ctas[0]}).`
        }
      ];

  // 8. Creative Strategy, Strategy Recommendations
  const primaryAngle = project?.marketingAngles?.output?.primaryAngle || project?.sharedBusinessContext?.primaryMarketingAngle || bi.brandIdentity.positioning || "Direct Response Solution Offer";
  const visualHook = project?.adsInputState?.visualHookFocus || project?.copyDirection?.output?.visualHook || "Transformation / Result Proof";
  const emotionalTrigger = project?.painPointData?.output?.primaryPainPoint || project?.sharedBusinessContext?.primaryPainPoint || bi.audience.frustrations[0] || "Frustrasi hasil stagnan";
  const valueProposition = project?.positioningData?.output?.usp || project?.sharedBusinessContext?.uniqueSellingProposition || bi.brandIdentity.usp || "Solusi praktis dan cepat";

  return {
    // Compatibility fields
    campaignName,
    objective: "OUTCOME_SALES",
    dailyBudget,
    targeting: {
      country,
      ageMin,
      ageMax,
      interests: interestsList,
      behaviors,
      exclusions,
      age_range: { min: ageMin, max: ageMax }
    },
    adVariants,

    // Enhanced Ads Manager-Ready structure
    campaign_name: campaignName,
    campaign_objective: "OUTCOME_SALES",
    adset_recommendation: {
      name: `[Sales] ${nicheName} - Advantage+ / Broad ${ageMin}-${ageMax}`,
      optimization_goal: "PURCHASE",
      conversion_event: "Purchase",
      bid_strategy: "Highest Volume (Lowest Cost)"
    },
    placement_recommendation: {
      advantage_plus: true,
      recommended_placements: [
        "Instagram Feed",
        "Instagram Stories & Reels",
        "Facebook Feed",
        "Facebook Stories & Reels"
      ],
      notes: "Gunakan Advantage+ Placements untuk alokasi CPM terhemat secara otomatis oleh algoritma Meta."
    },
    budget_recommendation: {
      daily_budget_idr: dailyBudget,
      budget_type: "CBO (Advantage Campaign Budget) / Daily Budget",
      testing_duration_days: 3,
      scaling_trigger: "Tingkatkan budget 20% setiap 48 jam jika ROAS > 2.5x atau CPA di bawah target."
    },
    schedule_recommendation: {
      start_time: "Mulai pukul 00:00 WIB agar algoritma membagi budget harian secara seimbang.",
      dayparting_notes: "Jalankan 24 jam nonstop selama minimal 3 hari pertama untuk pembelajaran pixel Meta."
    },
    creative_strategy: {
      primary_angle: primaryAngle,
      visual_hook: visualHook,
      emotional_trigger: emotionalTrigger,
      value_proposition: valueProposition
    },
    copy_assets: {
      hooks,
      headlines,
      primary_texts: primaryTexts,
      ctas
    },
    image_ads,
    carousel_ads,
    video_ads,
    tracking_checklist: [
      "Pasang Meta Pixel & Dataset pada Landing Page / Checkout Page",
      "Konfigurasi Conversions API (CAPI) untuk akurasi pelacakan data hingga 95%+",
      "Verifikasi Domain di Meta Business Manager",
      "Set up Event Aggregated Measurement (Purchase, InitiateCheckout, Lead)",
      "Uji coba kelancaran event Purchase menggunakan ekstensi Meta Pixel Helper"
    ],
    policy_flags: [
      "Hindari klaim garansi penghasilan fantastis berlebih (Earning Claims)",
      "Pastikan landing page mencantumkan Syarat & Ketentuan dan Kebijakan Privasi",
      "Gunakan aset gambar/video original tanpa hak cipta pihak ketiga",
      "Hindari kata-kata terlarang di headline Meta seperti 'Dijamin Kaya'"
    ],
    assumptions: [
      `Target audiens berlokasi di ${country} dengan rentang usia ${ageMin}-${ageMax} tahun`,
      `Target audiens utama berfokus pada segmen ${targetAudience} di bidang ${nicheName}`,
      `Produk '${productName}' dikirimkan secara otomatis secara digital setelah konfirmasi pembayaran`,
      "Target pasar menggunakan koneksi internet seluler yang stabil",
      "Landing page memiliki kecepatan muat di bawah 2.5 detik di ponsel pintar"
    ],
    implementation_checklist: [
      "1. Buka Meta Ads Manager dan buat Campaign baru dengan objective 'Sales'",
      `2. Atur Budget CBO Rp ${dailyBudget.toLocaleString("id-ID")} / hari dan jadwal mulai pukul 00:00`,
      `3. Masukkan Target Lokasi (${country}), Usia (${ageMin}-${ageMax}), dan Interest rekomendasi (${interestsList.slice(0, 3).join(", ")})`,
      "4. Masukkan Creative Ads (Gambar, Carousel, Video) dan tempel Copy Assets yang sudah disiapkan",
      "5. Pastikan Meta Pixel aktif pada level Ad & klik 'Publish' Campaign"
    ]
  };
}

export function downloadMetaAdsCampaignPack(project: any, fileName?: string): void {
  const pack = buildMetaAdsCampaignPack(project);
  const jsonStr = JSON.stringify(pack, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const name = (project?.name || "meta_ads_campaign_pack").toLowerCase().replace(/\s+/g, "_");
  a.download = fileName || `${name}_meta_ads_campaign_pack.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
