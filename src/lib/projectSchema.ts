export type OutputStatus = "empty" | "ai_generated" | "manual_edited" | "outdated";

export interface OutputItem {
  id?: string;
  key?: string;
  label: string;
  stepKey?: string;
  status: OutputStatus;
  value?: any;
  dependencies?: string[];
  sourceDependencies: string[];
  lastGeneratedAt?: string;
  lastEditedAt?: string;
  lastUpdated?: string;
  metadata?: Record<string, any>;
}

export type OutputRegistry = Record<string, OutputItem>;

export interface SharedBusinessContext {
  brandName?: string;
  niche?: string;
  targetAudience?: string;
  primaryPainPoint?: string;
  uniqueSellingProposition?: string;
  coreOffer?: string;
  pricingStrategy?: string;
  primaryMarketingAngle?: string;
  brandTone?: string;
  metaAdsObjective?: string;
  targetCountry?: string;
  updatedAt?: string;
  extraContext?: Record<string, any>;
}

export interface ProjectSchema {
  id: string;
  name: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  currentStep?: number;
  nicheData?: any;
  audienceData?: any;
  painPointData?: any;
  validationData?: any;
  positioningData?: any;
  offerData?: any;
  marketingAngles?: any;
  copyDirection?: any;
  brandFoundationData?: any;
  landingPageData?: any;
  summaryData?: any;
  brandIntelligence?: any;
  adsInputState?: any;
  adsRecommendationsState?: any;
  adsGeneratedAngles?: any;
  metaAdsCampaignPack?: any;
  outputRegistry?: OutputRegistry;
  sharedBusinessContext?: SharedBusinessContext;
}

export const DEFAULT_DEPENDENCY_MAP: Record<string, string[]> = {
  nicheData: [],
  audienceData: ["nicheData"],
  painPointData: ["audienceData", "nicheData"],
  validationData: ["painPointData", "nicheData"],
  positioningData: ["validationData", "nicheData"],
  offerData: ["positioningData", "painPointData"],
  marketingAngles: ["offerData", "positioningData"],
  copyDirection: ["marketingAngles", "positioningData"],
  brandFoundationData: ["positioningData", "offerData"],
  landingPageData: ["offerData", "copyDirection", "positioningData"],
  adsInputState: ["marketingAngles", "copyDirection", "offerData"],
  adsGeneratedAngles: ["marketingAngles", "copyDirection"],
  adsRecommendationsState: ["adsInputState", "marketingAngles"],
  metaAdsCampaignPack: ["adsInputState", "adsGeneratedAngles", "adsRecommendationsState", "copyDirection"]
};

export function getSharedBusinessContext(project: any): SharedBusinessContext {
  if (!project) return {};

  const existing = project.sharedBusinessContext || {};

  const nicheInput = project.nicheData?.input || {};
  const audienceInput = project.audienceData?.input || {};
  const painInput = project.painPointData?.input || {};
  const posInput = project.positioningData?.input || {};
  const offerInput = project.offerData?.input || {};
  const angleInput = project.marketingAngles?.input || {};
  const brandInput = project.brandFoundationData?.input || {};

  return {
    brandName: existing.brandName || brandInput.brandName || project.name || "Proyek Digital",
    niche: existing.niche || nicheInput.niche || "Digital Marketing",
    targetAudience: existing.targetAudience || audienceInput.targetAudience || "Digital Marketer Pemula",
    primaryPainPoint: existing.primaryPainPoint || painInput.painPoint || "Kesulitan membuat campaign iklan berkonversi",
    uniqueSellingProposition: existing.uniqueSellingProposition || posInput.usp || "Panduan & Aset Iklan Siap Pakai",
    coreOffer: existing.coreOffer || offerInput.offerName || "Meta Ads Campaign Pack",
    pricingStrategy: existing.pricingStrategy || offerInput.price || "Rp 100.000",
    primaryMarketingAngle: existing.primaryMarketingAngle || angleInput.primaryAngle || "Sudut Pandang Solusi Instan",
    brandTone: existing.brandTone || brandInput.tone || "Profesional, Empatis & Tepat Sasaran",
    metaAdsObjective: existing.metaAdsObjective || "OUTCOME_SALES",
    targetCountry: existing.targetCountry || nicheInput.country || "Indonesia",
    updatedAt: new Date().toISOString(),
    ...existing
  };
}

export function buildDefaultOutputRegistry(project: any = {}): OutputRegistry {
  const outputs: OutputRegistry = {};

  const keys = [
    { key: "nicheData", label: "Niche & Target Market", stepKey: "niche" },
    { key: "audienceData", label: "Audience Avatar & Desires", stepKey: "audience" },
    { key: "painPointData", label: "Pain Points & Frustrations", stepKey: "pain_point" },
    { key: "validationData", label: "Market Validation & Proof", stepKey: "validation" },
    { key: "positioningData", label: "Brand Positioning & USP", stepKey: "positioning" },
    { key: "offerData", label: "Core Offer & Pricing", stepKey: "offer" },
    { key: "marketingAngles", label: "Marketing Angles & Hooks", stepKey: "angles" },
    { key: "copyDirection", label: "Ad Copy & Script Direction", stepKey: "copy" },
    { key: "brandFoundationData", label: "Brand Identity & Guidelines", stepKey: "brand_foundation" },
    { key: "landingPageData", label: "Landing Page Content & Copy", stepKey: "landing_page" },
    { key: "adsInputState", label: "Meta Ads Campaign Pack Assets", stepKey: "ads_content" },
    { key: "adsGeneratedAngles", label: "Generated Ad Visual Angles", stepKey: "ads_angles" },
    { key: "adsRecommendationsState", label: "Ads Strategy & Targeting Recommendations", stepKey: "ads_recommendations" },
    { key: "metaAdsCampaignPack", label: "Meta Ads Campaign Pack Export", stepKey: "meta_ads_pack" }
  ];

  for (const item of keys) {
    const val = project[item.key];
    const hasVal = Boolean(val && (Object.keys(val).length > 0 || (Array.isArray(val) && val.length > 0)));
    const deps = DEFAULT_DEPENDENCY_MAP[item.key] || [];
    
    outputs[item.key] = {
      id: `out_${item.key}`,
      key: item.key,
      label: item.label,
      stepKey: item.stepKey,
      status: hasVal ? "ai_generated" : "empty",
      value: val || null,
      dependencies: deps,
      sourceDependencies: deps,
      lastGeneratedAt: hasVal ? project.updatedAt || new Date().toISOString() : undefined,
      lastUpdated: hasVal ? project.updatedAt || new Date().toISOString() : undefined
    };
  }

  return outputs;
}

export function validateProjectSchema(project: any): boolean {
  return Boolean(project && typeof project === "object" && (project.id || project.name));
}

export function normalizeProject(project: any): any {
  if (!project || typeof project !== "object") return {};
  
  const baseNormalized = {
    ...project,
    id: project.id || `proj_${Date.now()}`,
    name: project.name || "Proyek Digital",
    currentStep: typeof project.currentStep === "number" ? project.currentStep : 1,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString()
  };

  const sharedBusinessContext = getSharedBusinessContext(baseNormalized);

  let outputRegistry: OutputRegistry;
  if (baseNormalized.outputRegistry && typeof baseNormalized.outputRegistry === "object") {
    if (baseNormalized.outputRegistry.outputs && typeof baseNormalized.outputRegistry.outputs === "object") {
      outputRegistry = baseNormalized.outputRegistry.outputs;
    } else {
      outputRegistry = baseNormalized.outputRegistry;
    }
  } else {
    outputRegistry = buildDefaultOutputRegistry(baseNormalized);
  }

  return {
    ...baseNormalized,
    sharedBusinessContext,
    outputRegistry
  };
}

export function buildProjectUpdatePayload(
  project: any,
  extraUpdates: any = {},
  mode: "auto" | "manual" = "auto"
): any {
  const normalized = normalizeProject(project);
  const now = new Date().toISOString();
  let updatedRegistry: OutputRegistry = { ...(normalized.outputRegistry || {}) };

  const knownOutputKeys = Object.keys(DEFAULT_DEPENDENCY_MAP);
  const updatedKeysInPayload = Object.keys(extraUpdates).filter((k) => knownOutputKeys.includes(k));

  // 1. Apply updates for updated keys and trigger cascading invalidations for downstream dependencies
  for (const key of updatedKeysInPayload) {
    const status: OutputStatus = mode === "manual" ? "manual_edited" : "ai_generated";
    const existingItem: Partial<OutputItem> = updatedRegistry[key] || {
      label: key,
      sourceDependencies: DEFAULT_DEPENDENCY_MAP[key] || []
    };

    const sourceDependencies = existingItem.sourceDependencies || existingItem.dependencies || DEFAULT_DEPENDENCY_MAP[key] || [];

    updatedRegistry[key] = {
      ...existingItem,
      key,
      label: existingItem.label || key,
      status,
      value: extraUpdates[key],
      dependencies: sourceDependencies,
      sourceDependencies,
      lastGeneratedAt: mode === "manual" ? existingItem.lastGeneratedAt : now,
      lastEditedAt: mode === "manual" ? now : existingItem.lastEditedAt,
      lastUpdated: now
    };

    updatedRegistry = invalidateDependentOutputs(updatedRegistry, key);
  }

  // 2. Re-assert status for all keys explicitly present in extraUpdates so they stay marked correctly
  for (const key of updatedKeysInPayload) {
    const status: OutputStatus = mode === "manual" ? "manual_edited" : "ai_generated";
    if (updatedRegistry[key]) {
      updatedRegistry[key].status = status;
    }
  }

  const mergedProjectState = {
    ...normalized,
    ...extraUpdates,
    outputRegistry: updatedRegistry
  };

  const updatedSharedContext = getSharedBusinessContext(mergedProjectState);

  return {
    ...mergedProjectState,
    sharedBusinessContext: updatedSharedContext,
    updatedAt: now
  };
}

export function markOutputStatus(
  registry: OutputRegistry,
  outputKey: string,
  status: OutputStatus,
  value?: any,
  _mode: "auto" | "manual" = "auto"
): OutputRegistry {
  const current = registry[outputKey];
  const now = new Date().toISOString();
  if (!current) return registry;

  const updatedItem: OutputItem = {
    ...current,
    status,
    value: value !== undefined ? value : current.value,
    lastGeneratedAt: status === "ai_generated" ? now : current.lastGeneratedAt,
    lastEditedAt: status === "manual_edited" ? now : current.lastEditedAt,
    lastUpdated: now
  };

  let nextRegistry: OutputRegistry = {
    ...registry,
    [outputKey]: updatedItem
  };

  if (status === "ai_generated" || status === "manual_edited") {
    nextRegistry = invalidateDependentOutputs(nextRegistry, outputKey);
  }

  return nextRegistry;
}

export function getDependentOutputs(outputKey: string, registry?: OutputRegistry): string[] {
  const map = DEFAULT_DEPENDENCY_MAP;
  const dependents: string[] = [];

  if (registry) {
    for (const [key, item] of Object.entries(registry)) {
      const deps = item.sourceDependencies || item.dependencies || map[key] || [];
      if (deps.includes(outputKey)) {
        dependents.push(key);
      }
    }
  } else {
    for (const [key, deps] of Object.entries(map)) {
      if (deps.includes(outputKey)) {
        dependents.push(key);
      }
    }
  }

  return dependents;
}

export function invalidateDependentOutputs(registry: OutputRegistry, changedKey: string): OutputRegistry {
  const updatedRegistry = { ...registry };
  const now = new Date().toISOString();

  const queue: string[] = [changedKey];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    const directDependents = getDependentOutputs(currentKey, updatedRegistry);
    for (const depKey of directDependents) {
      if (updatedRegistry[depKey] && updatedRegistry[depKey].status !== "empty") {
        updatedRegistry[depKey] = {
          ...updatedRegistry[depKey],
          status: "outdated",
          lastUpdated: now
        };
      }
      if (!visited.has(depKey)) {
        queue.push(depKey);
      }
    }
  }

  return updatedRegistry;
}
