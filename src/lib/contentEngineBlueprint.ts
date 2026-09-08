function toText(value: any, fallback = ""): string {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
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

function firstNonEmpty(...values: any[]) {
  for (const value of values) {
    const text = toText(value, "");
    if (text) return text;
  }
  return "";
}

function collectHooks(project: any) {
  const hooksFromAngles = Array.isArray(project?.adsGeneratedAngles)
    ? project.adsGeneratedAngles.map((item: any) => item?.hook).filter(Boolean)
    : [];

  const hookFromCopy = [
    project?.copyDirection?.selectedOption?.headline,
    project?.copyDirection?.input?.headline,
    project?.copyDirection?.selectedCopy?.headline
  ]
    .map((item: any) => toText(item, ""))
    .filter(Boolean);

  return Array.from(new Set([...hooksFromAngles, ...hookFromCopy]));
}

function collectAudienceProblems(project: any) {
  const sbc = project?.sharedBusinessContext || {};
  const painPoints = toList(sbc?.problem?.painPoints || project?.painPointData?.selectedOption?.pain_points, []);
  const mainPain = toText(sbc?.problem?.mainPain, "");
  const hooks = collectHooks(project);
  const problems = [mainPain, ...painPoints, ...hooks].filter(Boolean);
  return Array.from(new Set(problems.length > 0 ? problems : ["Kurang konsistensi dan sistem terarah"]));
}

export function buildContentEngineBlueprint(project: any) {
  const sbc = project?.sharedBusinessContext || {};
  const productName = firstNonEmpty(
    project?.offerData?.selectedOption?.product_name,
    project?.offerData?.input?.product_name,
    sbc?.product?.projectName,
    project?.name,
    "Untitled Project"
  );

  const brandName = firstNonEmpty(
    sbc?.branding?.brandName,
    sbc?.product?.brandName,
    project?.brandFoundationData?.brandName,
    project?.name,
    "Untitled Brand"
  );

  const primaryAudience = firstNonEmpty(
    sbc?.audience?.primary,
    project?.audienceData?.selectedOption?.persona_name,
    project?.audienceData?.selectedOption?.persona,
    project?.audienceData?.input?.audienceGoal,
    "Target Audience"
  );

  const corePositioning = firstNonEmpty(
    sbc?.strategy?.positioning,
    project?.positioningData?.selectedOption?.positioning_statement,
    project?.positioningData?.input?.positioning_statement
  );

  const rawUsp = project?.positioningData?.selectedOption?.USP ||
    project?.positioningData?.input?.USP ||
    sbc?.strategy?.usp;
  const uspArray = toList(rawUsp, [
    "Format implementasi plug-and-play siap pakai",
    "Framework berbasis data bukan sekedar teori"
  ]);

  const valueProposition = firstNonEmpty(
    sbc?.strategy?.valueProposition,
    project?.positioningData?.selectedOption?.value_proposition,
    project?.positioningData?.input?.value_proposition
  );

  const mainOffer = firstNonEmpty(
    sbc?.strategy?.offer,
    project?.offerData?.selectedOption?.main_offer,
    project?.offerData?.input?.main_offer,
    productName
  );

  const pricing = firstNonEmpty(
    sbc?.strategy?.pricing,
    project?.offerData?.selectedOption?.pricing_strategy,
    project?.offerData?.input?.pricing_strategy,
    project?.offerData?.selectedOption?.price,
    project?.offerData?.input?.price,
    "Rp 299.000"
  );

  const coreMessage = firstNonEmpty(
    project?.copyDirection?.selectedOption?.headline,
    project?.copyDirection?.input?.headline,
    valueProposition,
    mainOffer
  );

  const rawCopyDir = project?.copyDirection?.selectedOption?.direction ||
    project?.copyDirection?.input?.direction ||
    sbc?.campaign?.copyDirection ||
    "Fokus pada perbandingan Before-After dan efisiensi waktu.";
  const copyDirectionArray = Array.isArray(rawCopyDir)
    ? toList(rawCopyDir)
    : [toText(rawCopyDir, "Fokus pada perbandingan Before-After")].filter(Boolean);

  const audienceDesires = toList(
    project?.audienceData?.selectedOption?.desires ||
      project?.audienceData?.input?.desires ||
      sbc?.audience?.desires,
    ["Meningkatkan efisiensi kerja dan profit", "Mempunyai sistem bisnis digital yang repeatable"]
  );

  const offerBenefits = toList(
    project?.offerData?.selectedOption?.benefits ||
      project?.offerData?.selectedOption?.deliverables ||
      project?.offerData?.input?.benefits,
    ["Blueprint strategi lengkap siap pakai", "Akses materi dan template operasional"]
  );

  const brandVoice = firstNonEmpty(
    project?.copyDirection?.selectedOption?.brand_voice,
    sbc?.branding?.brandVoice,
    "Otoritatif namun bersahabat, lugas, dan berorientasi solusi."
  );

  const contentPillars = toList(
    project?.marketingAngles?.selectedOption?.angles || [
      "Edukasi Fundamental & Kesalahan Fatal",
      "Behind the Scenes & Studi Kasus",
      "Tutorial Praktis & Framework",
      "Penawaran Eksklusif & Social Proof"
    ]
  );

  return {
    blueprint_version: "1.0.0",
    blueprint_type: "content_engine_blueprint",
    generated_at: new Date().toISOString(),
    source_app: "Alco Creative System",
    source_project: {
      id: project?.id || null,
      name: project?.name || "Untitled Project",
      schema_version: project?.schemaVersion || "unknown",
      workflow_version: project?.workflowVersion || "unknown"
    },
    brand_identity: {
      brand_name: brandName,
      category: firstNonEmpty(sbc?.product?.industry, sbc?.product?.niche, "Digital Business"),
      product_name: productName,
      mission: toText(sbc?.branding?.mission, ""),
      vision: toText(sbc?.branding?.vision, ""),
      tagline: toText(sbc?.branding?.tagline, ""),
      tone: firstNonEmpty(sbc?.branding?.tone, project?.copyDirection?.selectedOption?.tone, "Persuasif & Profesional")
    },
    target_audience: {
      primary_audience: primaryAudience,
      demographics: toText(sbc?.audience?.demographics, ""),
      buying_behavior: toText(sbc?.audience?.buyingBehavior, ""),
      trust_triggers: toList(sbc?.audience?.trustTriggers, []),
      emotional_triggers: toList(sbc?.audience?.emotionalTriggers, []),
      audience_problem: collectAudienceProblems(project),
      audience_desire: audienceDesires
    },
    positioning: {
      core_positioning: corePositioning,
      usp: uspArray,
      value_proposition: valueProposition,
      validation_summary: toText(sbc?.strategy?.validationSummary, "")
    },
    offer: {
      main_offer: mainOffer,
      pricing,
      urgency: toText(sbc?.strategy?.urgency, ""),
      offer_benefits: offerBenefits
    },
    messaging: {
      core_message: coreMessage,
      brand_voice: brandVoice,
      copy_direction: copyDirectionArray,
      marketing_angle: toText(sbc?.strategy?.marketingAngle, ""),
      primary_hooks: collectHooks(project)
    },
    content_strategy: {
      content_pillars: contentPillars
    }
  };
}

export function downloadContentEngineBlueprint(project: any, customFilename?: string): boolean {
  try {
    const blueprint = buildContentEngineBlueprint(project);
    const jsonString = JSON.stringify(blueprint, null, 2);

    const rawName = project?.name || "project";
    const sanitizedSlug = rawName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const filename = customFilename || `${sanitizedSlug || "project"}-content-engine-blueprint.json`;

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Gagal mengunduh Content Engine Blueprint:", err);
    return false;
  }
}

