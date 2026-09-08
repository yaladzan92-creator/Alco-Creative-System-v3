import { mergeWorkflowResult, BrandIntelligence } from "./brandIntelligence";

export interface KnowledgeBaseEntry {
  category: string;
  key: string;
  label: string;
  value: any;
  sourceStep: string;
  confidence: "high" | "medium" | "low";
}

export interface RelationshipNode {
  id: string;
  label: string;
  step: string;
  type: "input" | "insight" | "strategy" | "asset";
  connectedTo: string[];
  summary: string;
}

export interface ValidationRuleResult {
  ruleId: string;
  title: string;
  category: "meta_policy" | "offer_viability" | "audience_match" | "copy_compliance" | "data_completeness";
  status: "pass" | "warning" | "fail";
  message: string;
  recommendation: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: "meta_ads_launch_kit" | "landing_page_outline" | "email_sequence" | "content_calendar_30d" | "creative_brief";
  description: string;
  variablesRequired: string[];
}

export interface GeneratedDocument {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  content: string;
  format: "markdown" | "json" | "html";
}

export interface AuditReport {
  overallScore: number; // 0 - 100
  readinessLevel: "Siap Launch 🚀" | "Perlu Penyesuaian ⚠️" | "Belum Lengkap ❌";
  summary: string;
  passedCount: number;
  warningCount: number;
  failCount: number;
  rules: ValidationRuleResult[];
  improvementSteps: string[];
}

export interface VersionedDocPack {
  packVersion: string; // e.g. "v1.0.0"
  snapshotId: string;
  createdAt: string;
  projectName: string;
  brandIntelligence: BrandIntelligence;
  knowledgeBase: KnowledgeBaseEntry[];
  relationshipMap: RelationshipNode[];
  auditReport: AuditReport;
  generatedDocuments: GeneratedDocument[];
}

/**
 * 1. KNOWLEDGE BASE GENERATOR
 * Aggregates all project inputs and AI outputs into a structured knowledge base.
 */
export function buildKnowledgeBase(project: any): KnowledgeBaseEntry[] {
  const kb: KnowledgeBaseEntry[] = [];
  const bi = mergeWorkflowResult(project);

  // Niche & Target Market
  if (project?.nicheData?.input) {
    const input = project.nicheData.input;
    if (input.interest) kb.push({ category: "Ceruk Pasar", key: "interest", label: "Minat / Hobi", value: input.interest, sourceStep: "Riset Niche", confidence: "high" });
    if (input.skill) kb.push({ category: "Ceruk Pasar", key: "skill", label: "Keahlian Utama", value: input.skill, sourceStep: "Riset Niche", confidence: "high" });
    if (input.goal) kb.push({ category: "Ceruk Pasar", key: "goal", label: "Target Pendapatan", value: input.goal, sourceStep: "Riset Niche", confidence: "high" });
    if (input.country) kb.push({ category: "Ceruk Pasar", key: "country", label: "Negara Target", value: input.country, sourceStep: "Riset Niche", confidence: "high" });
    if (input.age) kb.push({ category: "Ceruk Pasar", key: "age", label: "Demografi Usia", value: input.age, sourceStep: "Riset Niche", confidence: "high" });
  }

  // Audience Persona
  if (project?.audienceData) {
    const sel = project.audienceData.selectedOption;
    if (sel?.persona_name || project.audienceData.input?.audienceGoal) {
      kb.push({ category: "Audiens Meta Ads", key: "persona", label: "Profil Persona", value: sel?.persona_name || project.audienceData.input?.audienceGoal, sourceStep: "Karakter Pelanggan", confidence: "high" });
    }
    if (sel?.desires || project.audienceData.input?.desires) {
      kb.push({ category: "Audiens Meta Ads", key: "desires", label: "Hasrat Utama", value: sel?.desires || project.audienceData.input?.desires, sourceStep: "Karakter Pelanggan", confidence: "high" });
    }
    if (sel?.fears || project.audienceData.input?.fears) {
      kb.push({ category: "Audiens Meta Ads", key: "fears", label: "Ketakutan Terdalam", value: sel?.fears || project.audienceData.input?.fears, sourceStep: "Karakter Pelanggan", confidence: "high" });
    }
  }

  // Pain Points
  if (project?.painPointData?.selectedOption) {
    const p = project.painPointData.selectedOption;
    if (p.title) kb.push({ category: "Analisis Masalah", key: "pain_title", label: "Masalah Profitable", value: p.title, sourceStep: "Keluhan & Masalah", confidence: "high" });
    if (p.cost_of_inaction) kb.push({ category: "Analisis Masalah", key: "cost_of_inaction", label: "Kerugian Jika Dibiarkan", value: p.cost_of_inaction, sourceStep: "Keluhan & Masalah", confidence: "medium" });
  }

  // Positioning & USP
  if (bi.brandIdentity.positioning) {
    kb.push({ category: "Positioning", key: "positioning", label: "Pernyataan Positioning", value: bi.brandIdentity.positioning, sourceStep: "Positioning Premium", confidence: "high" });
  }
  if (bi.brandIdentity.usp) {
    kb.push({ category: "Positioning", key: "usp", label: "Unique Selling Proposition", value: bi.brandIdentity.usp, sourceStep: "Positioning Premium", confidence: "high" });
  }

  // Offer Architecture
  if (project?.offerData?.selectedOption) {
    const offer = project.offerData.selectedOption;
    if (offer.main_offer) kb.push({ category: "Paket Penawaran", key: "main_offer", label: "Produk Digital Utama", value: offer.main_offer, sourceStep: "Paket Penawaran", confidence: "high" });
    if (offer.price_point) kb.push({ category: "Paket Penawaran", key: "price_point", label: "Skema Harga Meta Ads", value: offer.price_point, sourceStep: "Paket Penawaran", confidence: "high" });
    if (offer.bonuses) kb.push({ category: "Paket Penawaran", key: "bonuses", label: "Bonus Pembuka Konversi", value: offer.bonuses, sourceStep: "Paket Penawaran", confidence: "high" });
    if (offer.guarantee) kb.push({ category: "Paket Penawaran", key: "guarantee", label: "Garansi Pembelian", value: offer.guarantee, sourceStep: "Paket Penawaran", confidence: "medium" });
  }

  // Copywriting & Meta Ads
  if (project?.copyDirection?.selectedOption) {
    const copy = project.copyDirection.selectedOption;
    if (copy.hook) kb.push({ category: "Copywriting", key: "hook", label: "Main Scroll Stopper Hook", value: copy.hook, sourceStep: "Naskah Copywriting", confidence: "high" });
    if (copy.framework) kb.push({ category: "Copywriting", key: "framework", label: "Kerangka Copywriting", value: copy.framework, sourceStep: "Naskah Copywriting", confidence: "high" });
  }

  // Brand Foundation
  if (bi.brandIdentity.brandName) {
    kb.push({ category: "Identitas Brand", key: "brandName", label: "Nama Brand Digital", value: bi.brandIdentity.brandName, sourceStep: "Pondasi Brand", confidence: "high" });
  }

  return kb;
}

/**
 * 2. RELATIONSHIP MAP GENERATOR
 * Maps how inputs in earlier steps feed into strategic outputs in later steps.
 */
export function buildRelationshipMap(project: any): RelationshipNode[] {
  const nodes: RelationshipNode[] = [];
  const bi = mergeWorkflowResult(project);

  nodes.push({
    id: "niche",
    label: bi.brandIdentity.niche || "Niche Pasar",
    step: "Step 1: Riset Niche",
    type: "input",
    connectedTo: ["audience", "positioning"],
    summary: `Menentukan cakupan pasar target digital marketer.`
  });

  nodes.push({
    id: "audience",
    label: bi.audience.primaryAudience || "Target Persona",
    step: "Step 2: Karakter Pelanggan",
    type: "insight",
    connectedTo: ["pain_point", "offer"],
    summary: `Mendefinisikan demografi dan motivasi emosional calon pembeli Meta Ads.`
  });

  nodes.push({
    id: "pain_point",
    label: project?.painPointData?.selectedOption?.title || "Materi Masalah Utama",
    step: "Step 3: Keluhan & Masalah",
    type: "insight",
    connectedTo: ["positioning", "copywriting"],
    summary: `Latar belakang masalah mendalam yang akan diselesaikan oleh produk.`
  });

  nodes.push({
    id: "positioning",
    label: bi.brandIdentity.usp || "USP & Market Hook",
    step: "Step 5: Positioning Premium",
    type: "strategy",
    connectedTo: ["offer", "ad_angle"],
    summary: `Pembeda utama yang membedakan produk dari pesaing di Meta Ads.`
  });

  nodes.push({
    id: "offer",
    label: bi.offers[0]?.main_offer || "Paket Penawaran Digital",
    step: "Step 6: Penawaran (Offer)",
    type: "strategy",
    connectedTo: ["copywriting", "ads_launch"],
    summary: `Kombinasi produk utama, bonus, dan harga irresistible.`
  });

  nodes.push({
    id: "ad_angle",
    label: bi.contentStrategy.contentAngles[0] || "Sudut Pandang Iklan Meta",
    step: "Step 7: Angle Iklan",
    type: "asset",
    connectedTo: ["copywriting", "ads_launch"],
    summary: `Sudut pandang kreatif visual dan narasi pengait perhatian.`
  });

  nodes.push({
    id: "copywriting",
    label: bi.generatedAssets.hooks[0] || "Naskah Direct Response",
    step: "Step 8: Copywriting",
    type: "asset",
    connectedTo: ["ads_launch"],
    summary: `Naskah hook, isi, dan CTA penentu konversi iklan.`
  });

  nodes.push({
    id: "ads_launch",
    label: "Meta Ads Launch Readiness",
    step: "Final: Kesiapan Iklan",
    type: "strategy",
    connectedTo: [],
    summary: `Muara dari seluruh data riset yang siap dimasukkan ke Meta Ads Manager.`
  });

  return nodes;
}

/**
 * 3. VALIDATION RULES & COMPLIANCE ENGINE
 * Verifies consistency and checks for Meta Ads Advertising Policy compliance.
 */
export function evaluateValidationRules(project: any): ValidationRuleResult[] {
  const rules: ValidationRuleResult[] = [];
  const bi = mergeWorkflowResult(project);

  // 1. Data Completeness Rule
  const hasNiche = Boolean(project?.nicheData);
  const hasAudience = Boolean(project?.audienceData);
  const hasPain = Boolean(project?.painPointData);
  const hasOffer = Boolean(project?.offerData);
  const hasCopy = Boolean(project?.copyDirection || project?.adsGeneratedAngles);

  const missingSteps = [];
  if (!hasNiche) missingSteps.push("Riset Niche");
  if (!hasAudience) missingSteps.push("Audience Persona");
  if (!hasPain) missingSteps.push("Pain Points");
  if (!hasOffer) missingSteps.push("Offer");
  if (!hasCopy) missingSteps.push("Copywriting");

  rules.push({
    ruleId: "VAL_COMPLETENESS",
    title: "Kelengkapan Data Strategi Workflow",
    category: "data_completeness",
    status: missingSteps.length === 0 ? "pass" : missingSteps.length <= 2 ? "warning" : "fail",
    message: missingSteps.length === 0 
      ? "Seluruh 8 langkah riset inti telah diisi lengkap!" 
      : `Langkah belum diisi: ${missingSteps.join(", ")}.`,
    recommendation: missingSteps.length > 0 ? "Lengkapi langkah yang masih kosong untuk hasil Meta Ads yang lebih optimal." : "Semua langkah lengkap."
  });

  // 2. Meta Ads Policy Compliance Check (Banned phrases for digital product ads)
  const allText = JSON.stringify(project).toLowerCase();
  const prohibitedMetaTerms = ["pasti kaya", "cepat kaya", "garansi 100% uang kembali tanpa syarat", "bebas hutang seketika", "obat ajaib", "hasil instant dalam 1 jam"];
  const foundTerms = prohibitedMetaTerms.filter(term => allText.includes(term));

  rules.push({
    ruleId: "VAL_META_POLICY",
    title: "Kepatuhan Kebijakan Meta Ads (Prohibited Claims)",
    category: "meta_policy",
    status: foundTerms.length === 0 ? "pass" : "warning",
    message: foundTerms.length === 0 
      ? "Aman dari klaim berlebihan yang berisiko memicu akun iklan di-restrict / Banned oleh Meta." 
      : `Ditemukan kata berisiko Meta Policy: ${foundTerms.join(", ")}.`,
    recommendation: foundTerms.length > 0 
      ? "Ganti kata-kata klaim berlebihan dengan hasil logis berdasarkan proses dan edukasi." 
      : "Pertahankan narasi edukatif yang mematuhi aturan Meta Ads."
  });

  // 3. Offer Viability Check for Beginners
  const selectedOffer = project?.offerData?.selectedOption || {};
  const priceStr = String(selectedOffer.price_point || "");
  const hasBonus = Boolean(selectedOffer.bonuses && selectedOffer.bonuses.length > 0);

  rules.push({
    ruleId: "VAL_OFFER_VIABILITY",
    title: "Daya Tarik Penawaran Produk Digital (Offer Viability)",
    category: "offer_viability",
    status: selectedOffer.main_offer && hasBonus ? "pass" : selectedOffer.main_offer ? "warning" : "fail",
    message: selectedOffer.main_offer 
      ? (hasBonus ? "Penawaran utama dilengkapi paket bonus yang mempertinggi nilai persepsi (Perceived Value)." : "Penawaran belum memiliki paket bonus pembuka konversi.")
      : "Belum mendefinisikan produk digital utama.",
    recommendation: !hasBonus 
      ? "Tambahkan 1-3 bonus berupa checklist, template, atau e-book pendek untuk mendongkrak tingkat konversi Meta Ads." 
      : "Penawaran sudah sangat berpotensi terkonversi tinggi."
  });

  // 4. Audience Match Rule
  const audienceDesires = bi.audience.desires;
  const painPoints = bi.audience.painPoints;

  rules.push({
    ruleId: "VAL_AUDIENCE_MATCH",
    title: "Kesesuaian Masalah vs Solusi Iklan",
    category: "audience_match",
    status: painPoints.length > 0 || audienceDesires.length > 0 ? "pass" : "warning",
    message: painPoints.length > 0 
      ? "Pesan iklan terhubung langsung dengan keluhan terdalam calon konsumen." 
      : "Belum ada pemetaan keluhan emosional yang spesifik.",
    recommendation: "Gunakan kalimat pembuka (Scroll Stopper Hook) yang menyentuh masalah utama audiens di 3 detik pertama."
  });

  return rules;
}

/**
 * 4. DOCUMENT TEMPLATES REPOSITORY
 */
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl_meta_launch",
    name: "Meta Ads Launch Kit (Digital Marketer)",
    type: "meta_ads_launch_kit",
    description: "Struktur kampanye Meta Ads lengkap: Audience Targeting, Placement, Budgeting, Hook, & Copywriting.",
    variablesRequired: ["niche", "audience", "offer", "copy"]
  },
  {
    id: "tpl_landing_page",
    name: "Outlines Landing Page Penjualan High-Conversion",
    type: "landing_page_outline",
    description: "Struktur section landing page produk digital dari Hero Banner hingga FAQ & CTA.",
    variablesRequired: ["positioning", "offer", "pain_points"]
  },
  {
    id: "tpl_email_sequence",
    name: "Email Follow-up & Funnel Sequence (5 Hari)",
    type: "email_sequence",
    description: "Urutan email otomatis untuk mengubah leads / calon pembeli dari Meta Ads menjadi buyer.",
    variablesRequired: ["offer", "pain_points", "brandName"]
  },
  {
    id: "tpl_content_30d",
    name: "Rencana Jadwal Konten Meta/IG 30 Hari",
    type: "content_calendar_30d",
    description: "Kalender ide konten harian untuk membangun kepercayaan sebelum menjalankan Meta Ads retargeting.",
    variablesRequired: ["niche", "audience", "brandName"]
  }
];

/**
 * 5. GENERATED DOCUMENTS PRODUCER
 * Creates full end-to-end document outputs in Markdown format.
 */
export function buildGeneratedDocuments(project: any): GeneratedDocument[] {
  const docs: GeneratedDocument[] = [];
  const bi = mergeWorkflowResult(project);
  const now = new Date().toISOString();

  // Doc 1: Blueprint Strategi Utama (Markdown)
  let blueprintMd = `# 🚀 BLUEPRINT STRATEGI META ADS & PRODUK DIGITAL: ${project?.name || "PROYEK BARU"}\n\n`;
  blueprintMd += `> **Status**: Ready for Implementation | **Tanggal**: ${now.split("T")[0]}\n\n`;
  blueprintMd += `--- \n\n`;

  blueprintMd += `## 1. TARGET CERUK PASAR (NICHE)\n`;
  blueprintMd += `- **Niche Utama**: ${bi.brandIdentity.niche || "-"}\n`;
  blueprintMd += `- **Sub-Niche**: ${bi.brandIdentity.subNiche || "-"}\n`;
  blueprintMd += `- **Demografi Target**: ${bi.brandIdentity.industry || "Indonesia (18-45 tahun)"}\n\n`;

  blueprintMd += `## 2. PERSONA PELANGGAN & MASALAH\n`;
  blueprintMd += `- **Profil Persona**: ${bi.audience.primaryAudience || "-"}\n`;
  blueprintMd += `- **Keluhan Utama**: ${bi.audience.painPoints.join(", ") || "-"}\n`;
  blueprintMd += `- **Hasrat Terbesar**: ${bi.audience.desires.join(", ") || "-"}\n\n`;

  blueprintMd += `## 3. POSITIONING & FORMULASI OFFER\n`;
  blueprintMd += `- **Unique Selling Proposition (USP)**: ${bi.brandIdentity.usp || "-"}\n`;
  blueprintMd += `- **Produk Digital Utama**: ${bi.offers[0]?.main_offer || "-"}\n`;
  blueprintMd += `- **Skema Harga**: ${bi.offers[0]?.price_point || "-"}\n`;
  blueprintMd += `- **Bonus Spesial**: ${Array.isArray(bi.offers[0]?.bonuses) ? bi.offers[0].bonuses.join(", ") : (bi.offers[0]?.bonuses || "-")}\n\n`;

  blueprintMd += `## 4. MATERI NASKAH & HOOK META ADS\n`;
  blueprintMd += `### Scroll Stopper Hooks:\n`;
  bi.generatedAssets.hooks.slice(0, 5).forEach((h, idx) => {
    blueprintMd += `${idx + 1}. "${h}"\n`;
  });
  blueprintMd += `\n### Primary Copywriting Text:\n`;
  blueprintMd += `${bi.generatedAssets.adCopies[0] || bi.messaging.copyGuidelines[0] || "Gunakan naskah persuasif berorientasi manfaat nyata produk."}\n\n`;

  blueprintMd += `## 5. PONDASI BRAND IDENTITAS\n`;
  blueprintMd += `- **Nama Brand**: ${bi.brandIdentity.brandName || "-"}\n`;
  blueprintMd += `- **Gaya Visual & Personality**: ${bi.brandIdentity.brandPersonality.join(", ") || "Professional & Approachable"}\n\n`;

  docs.push({
    id: "doc_blueprint_md",
    title: "Blueprint Strategi Utama (Markdown)",
    type: "blueprint_strategy",
    createdAt: now,
    content: blueprintMd,
    format: "markdown"
  });

  // Doc 2: Meta Ads Execution Brief
  let adsBrief = `# 🎯 META ADS EXECUTION BRIEF & CAMPAIGN SETUP\n\n`;
  adsBrief += `### Kampanye Meta Ads Setup:\n`;
  adsBrief += `- **Objective**: Sales / Conversion (Digital Product)\n`;
  adsBrief += `- **Targeting Interest**: ${bi.brandIdentity.niche || "Bisnis Online & Marketing"}\n`;
  adsBrief += `- **Umur**: 21 - 45 Tahun | **Wilayah**: Indonesia\n`;
  adsBrief += `- **Placement**: Meta Advantage+ Placements (Feed, Reels, Stories)\n\n`;
  adsBrief += `### Variasi Angle Kreatif Iklan:\n`;
  bi.contentStrategy.contentAngles.slice(0, 3).forEach((angle, idx) => {
    adsBrief += `#### Angle #${idx + 1}: ${angle}\n`;
    adsBrief += `- **Hook Visual**: Tampilkan hasil/studi kasus nyata atau kutipan masalah mendesak.\n`;
    adsBrief += `- **Headline**: ${bi.generatedAssets.headlines[idx] || "Solusi Praktis Produk Digital"}\n`;
    adsBrief += `- **CTA Button**: Learn More / Shop Now\n\n`;
  });

  docs.push({
    id: "doc_ads_brief",
    title: "Meta Ads Launch & Campaign Setup Brief",
    type: "meta_ads_launch_kit",
    createdAt: now,
    content: adsBrief,
    format: "markdown"
  });

  return docs;
}

/**
 * 6. AUDIT ENGINE
 * Evaluates full project readiness score and issues actionable advice.
 */
export function runAuditEngine(project: any): AuditReport {
  const rules = evaluateValidationRules(project);
  const passed = rules.filter(r => r.status === "pass").length;
  const warnings = rules.filter(r => r.status === "warning").length;
  const fails = rules.filter(r => r.status === "fail").length;

  const total = rules.length;
  const score = Math.round(((passed * 100) + (warnings * 50)) / total);

  let readinessLevel: "Siap Launch 🚀" | "Perlu Penyesuaian ⚠️" | "Belum Lengkap ❌" = "Siap Launch 🚀";
  if (score < 50 || fails > 0) {
    readinessLevel = "Belum Lengkap ❌";
  } else if (score < 85 || warnings > 0) {
    readinessLevel = "Perlu Penyesuaian ⚠️";
  }

  const improvementSteps: string[] = [];
  rules.forEach(r => {
    if (r.status !== "pass") {
      improvementSteps.push(`${r.title}: ${r.recommendation}`);
    }
  });

  if (improvementSteps.length === 0) {
    improvementSteps.push("Semua parameter validasi terpenuhi! Siap dipasang langsung ke Meta Ads Manager.");
  }

  return {
    overallScore: score,
    readinessLevel,
    summary: `Proyek '${project?.name || "Strategi Meta Ads"}' memiliki skor kesiapan ${score}% dengan tingkat status '${readinessLevel}'.`,
    passedCount: passed,
    warningCount: warnings,
    failCount: fails,
    rules,
    improvementSteps
  };
}

/**
 * 7. VERSIONED DOCUMENTATION PACK BUNDLER
 * Encapsulates all 6 components into a version-controlled documentation snapshot.
 */
export function createVersionedDocumentationPack(project: any, version: string = "v1.0.0"): VersionedDocPack {
  const bi = mergeWorkflowResult(project);
  const kb = buildKnowledgeBase(project);
  const relMap = buildRelationshipMap(project);
  const audit = runAuditEngine(project);
  const docs = buildGeneratedDocuments(project);

  const timestamp = new Date().toISOString();
  const snapshotId = `pack_${project?.id || "proj"}_${Date.now()}`;

  return {
    packVersion: version,
    snapshotId,
    createdAt: timestamp,
    projectName: project?.name || "Proyek Meta Ads Digital",
    brandIntelligence: bi,
    knowledgeBase: kb,
    relationshipMap: relMap,
    auditReport: audit,
    generatedDocuments: docs
  };
}
