import { mergeWorkflowResult, exportBrandIntelligence } from "@/services/brandIntelligence";
import { buildContentEngineBlueprint } from "./contentEngineBlueprint";
import { buildEcosystemBlueprint, cleanEncoding } from "./ecosystemBlueprint";

function encoder() {
  return new TextEncoder();
}

function u16(value: number) {
  const out = new Uint8Array(2);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  return out;
}

function u32(value: number) {
  const out = new Uint8Array(4);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  out[2] = (value >>> 16) & 0xff;
  out[3] = (value >>> 24) & 0xff;
  return out;
}

function join(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function crc32(bytes: Uint8Array) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ -1) >>> 0;
}

export function buildZip(entriesInput: Array<{ name: string; content: string }>) {
  const text = encoder();
  const entries = entriesInput.map((entry) => {
    const data = text.encode(entry.content);
    return {
      name: entry.name.replace(/\\/g, "/"),
      nameBytes: text.encode(entry.name.replace(/\\/g, "/")),
      data,
      crc: crc32(data),
      offset: 0
    };
  });

  const fileParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    entry.offset = offset;

    const local = join([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(entry.crc),
      u32(entry.data.length),
      u32(entry.data.length),
      u16(entry.nameBytes.length),
      u16(0),
      entry.nameBytes,
      entry.data
    ]);

    fileParts.push(local);
    offset += local.length;

    const central = join([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(entry.crc),
      u32(entry.data.length),
      u32(entry.data.length),
      u16(entry.nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(entry.offset),
      entry.nameBytes
    ]);

    centralParts.push(central);
  }

  const centralDirectory = join(centralParts);
  const centralOffset = offset;
  const end = join([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(centralOffset),
    u16(0)
  ]);

  return new Blob([...fileParts, centralDirectory, end], { type: "application/zip" });
}

function strategyMarkdown(project: any) {
  const sbc = project?.sharedBusinessContext || {};
  return [
    `# Strategy Pack — ${project?.name || "Untitled Project"}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Discovery",
    `- Niche: ${sbc?.product?.niche || "-"}`,
    `- Audience: ${sbc?.audience?.primary || "-"}`,
    `- Main Pain: ${sbc?.problem?.mainPain || "-"}`,
    "",
    "## Strategy",
    `- Positioning: ${sbc?.strategy?.positioning || "-"}`,
    `- USP: ${sbc?.strategy?.usp || "-"}`,
    `- Offer: ${sbc?.strategy?.offer || "-"}`,
    `- Pricing: ${sbc?.strategy?.pricing || "-"}`,
    `- Marketing Angle: ${sbc?.strategy?.marketingAngle || "-"}`,
    "",
    "## Summary",
    "```json",
    JSON.stringify(project?.summaryData || {}, null, 2),
    "```"
  ].join("\n");
}

function brandingMarkdown(project: any) {
  const sbc = project?.sharedBusinessContext || {};
  return [
    `# Branding Pack — ${project?.name || "Untitled Project"}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `- Brand Name: ${sbc?.branding?.brandName || "-"}`,
    `- Mission: ${sbc?.branding?.mission || "-"}`,
    `- Vision: ${sbc?.branding?.vision || "-"}`,
    `- Tagline: ${sbc?.branding?.tagline || "-"}`,
    `- Tone: ${sbc?.branding?.tone || "-"}`,
    "",
    "## Brand Foundation",
    "```json",
    JSON.stringify(project?.brandFoundationData || {}, null, 2),
    "```"
  ].join("\n");
}

function campaignMarkdown(project: any) {
  return [
    `# Campaign Pack — ${project?.name || "Untitled Project"}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Marketing Angles",
    "```json",
    JSON.stringify(project?.marketingAngles || {}, null, 2),
    "```",
    "",
    "## Copy Direction",
    "```json",
    JSON.stringify(project?.copyDirection || {}, null, 2),
    "```",
    "",
    "## Ads Output",
    "```json",
    JSON.stringify(
      {
        adsGeneratedAngles: project?.adsGeneratedAngles || [],
        adsRecommendationsState: project?.adsRecommendationsState || null
      },
      null,
      2
    ),
    "```"
  ].join("\n");
}

function manifest(project: any) {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      projectName: project?.name || "Untitled Project",
      schemaVersion: project?.schemaVersion || "unknown",
      workflowVersion: project?.workflowVersion || "unknown",
      includedArtifacts: [
        "blueprint/alco_ecosystem_blueprint.json",
        "strategy/strategy.md",
        "branding/branding.md",
        "campaign/campaign.md",
        "content-engine/content_engine_blueprint.json",
        "landing/landing-state.json",
        "assets/brand-intelligence.json",
        "project/project-data.json",
        "manifest.json"
      ]
    },
    null,
    2
  );
}

export function buildReleasePack(project: any) {
  const safeName = (project?.name || "alco-project").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const rawBrandIntelligence = exportBrandIntelligence(mergeWorkflowResult(project));
  const brandIntelligence = typeof rawBrandIntelligence === "string" ? cleanEncoding(rawBrandIntelligence) : rawBrandIntelligence;
  const contentEngineBlueprint = cleanEncoding(buildContentEngineBlueprint(project));
  const ecosystemBlueprint = buildEcosystemBlueprint(project);
  const cleanProject = cleanEncoding(project);

  const landingState = cleanEncoding({
    landingPageData: project?.landingPageData || null,
    localBlueprintKeys: {
      sales: `landing_blueprint_sales_obj_${project?.id || ""}`,
      checkout: `landing_blueprint_checkout_obj_${project?.id || ""}`,
      form: `landing_form_${project?.id || ""}`
    }
  });

  const blob = buildZip([
    { name: "blueprint/alco_ecosystem_blueprint.json", content: JSON.stringify(ecosystemBlueprint, null, 2) },
    { name: "strategy/strategy.md", content: cleanEncoding(strategyMarkdown(project)) },
    { name: "branding/branding.md", content: cleanEncoding(brandingMarkdown(project)) },
    { name: "campaign/campaign.md", content: cleanEncoding(campaignMarkdown(project)) },
    { name: "content-engine/content_engine_blueprint.json", content: typeof contentEngineBlueprint === "string" ? contentEngineBlueprint : JSON.stringify(contentEngineBlueprint, null, 2) },
    { name: "landing/landing-state.json", content: JSON.stringify(landingState, null, 2) },
    { name: "assets/brand-intelligence.json", content: typeof brandIntelligence === "string" ? brandIntelligence : JSON.stringify(brandIntelligence, null, 2) },
    { name: "project/project-data.json", content: JSON.stringify(cleanProject, null, 2) },
    { name: "manifest.json", content: cleanEncoding(manifest(project)) }
  ]);

  const fileName = `${safeName}-release-pack.zip`;

  return {
    fileName,
    blob
  };
}

export function downloadReleasePack(project: any): void {
  const { fileName, blob } = buildReleasePack(project);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
