import React from "react";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  Download, 
  Copy, 
  Database, 
  GitMerge, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Check,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  createVersionedDocumentationPack, 
  VersionedDocPack,
  DOCUMENT_TEMPLATES
} from "@/services/documentationEngine";
import { downloadMetaAdsCampaignPack } from "@/lib/metaAdsCampaignPack";
import { downloadEcosystemBlueprint } from "@/lib/ecosystemBlueprint";

interface DocumentationEngineViewProps {
  project: any;
}

export default function DocumentationEngineView({ project }: DocumentationEngineViewProps) {
  const [pack, setPack] = React.useState<VersionedDocPack>(() => 
    createVersionedDocumentationPack(project, "v1.0.0")
  );
  const [activeTab, setActiveTab] = React.useState<"audit" | "knowledge" | "map" | "rules" | "docs" | "templates" | "pack">("audit");
  const [copiedDocId, setCopiedDocId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPack(createVersionedDocumentationPack(project, "v1.0.0"));
  }, [project]);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  const handleCopyText = (text: string, docId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocId(docId);
    toast.success("Konten berhasil disalin ke clipboard!");
    setTimeout(() => setCopiedDocId(null), 3000);
  };

  const handleExportPack = () => {
    const packJson = JSON.stringify(pack, null, 2);
    downloadFile(packJson, `${project?.name || "meta_ads"}_documentation_pack_${pack.packVersion}.json`, "application/json");
    toast.success("Versioned Documentation Pack (.JSON) berhasil di-download!");
  };

  const audit = pack.auditReport;

  return (
    <div className="space-y-8 text-left">
      {/* Top Banner: Audit Engine Score & Readiness */}
      <Card className="rounded-[2.5rem] border-border bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-cyan-400" />
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                DOCUMENTATION ENGINE AUDIT
              </span>
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-slate-300">
                Pack Version: {pack.packVersion}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-white uppercase italic">
              Status Kesiapan Meta Ads: <span className={audit.overallScore >= 85 ? "text-emerald-400" : audit.overallScore >= 50 ? "text-amber-400" : "text-rose-400"}>{audit.readinessLevel}</span>
            </h3>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {audit.summary} Seluruh data riset, aturan kepatuhan Meta Policy, serta templat naskah telah disinkronkan ke dalam sistem Dokumentasi Terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur">
            <div className="text-center">
              <div className="text-4xl font-black text-cyan-400 font-mono tracking-tight">{audit.overallScore}%</div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Audit Score</p>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {audit.passedCount} Valid Lolos
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> {audit.warningCount} Catatan
              </div>
              {audit.failCount > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <XCircle className="w-3.5 h-3.5" /> {audit.failCount} Perlu Perbaikan
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Engine Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <Button
          variant={activeTab === "audit" ? "default" : "outline"}
          onClick={() => setActiveTab("audit")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-cyan-500" /> Audit Engine
        </Button>
        <Button
          variant={activeTab === "knowledge" ? "default" : "outline"}
          onClick={() => setActiveTab("knowledge")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2"
        >
          <Database className="w-4 h-4 text-blue-500" /> Knowledge Base ({pack.knowledgeBase.length})
        </Button>
        <Button
          variant={activeTab === "map" ? "default" : "outline"}
          onClick={() => setActiveTab("map")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2"
        >
          <GitMerge className="w-4 h-4 text-purple-500" /> Relationship Map
        </Button>
        <Button
          variant={activeTab === "rules" ? "default" : "outline"}
          onClick={() => setActiveTab("rules")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Validation Rules ({audit.rules.length})
        </Button>
        <Button
          variant={activeTab === "docs" ? "default" : "outline"}
          onClick={() => setActiveTab("docs")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2"
        >
          <FileText className="w-4 h-4 text-amber-500" /> Generated Documents ({pack.generatedDocuments.length})
        </Button>
        <Button
          variant={activeTab === "templates" ? "default" : "outline"}
          onClick={() => setActiveTab("templates")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2"
        >
          <Layers className="w-4 h-4 text-pink-500" /> Document Templates
        </Button>
        <Button
          variant={activeTab === "pack" ? "default" : "outline"}
          onClick={() => setActiveTab("pack")}
          className="rounded-xl h-10 text-[10px] uppercase font-black tracking-wider gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow"
        >
          <Clock className="w-4 h-4 text-amber-300" /> Versioned Pack
        </Button>
      </div>

      {/* TAB 1: AUDIT ENGINE */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2rem] border-border p-6 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hasil Evaluasi Aturan Validasi
              </h4>
              <div className="space-y-3">
                {audit.rules.map((rule) => (
                  <div key={rule.ruleId} className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{rule.title}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        rule.status === "pass" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                        rule.status === "warning" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      }`}>
                        {rule.status === "pass" ? "Lolos Pass" : rule.status === "warning" ? "Warning" : "Perlu Perbaikan"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rule.message}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[2rem] border-border p-6 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Checklist Langkah Penyempurnaan Iklan
              </h4>
              <div className="space-y-3">
                {audit.improvementSteps.map((step, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-xs font-medium text-foreground leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE */}
      {activeTab === "knowledge" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
              Centralized Knowledge Base ({pack.knowledgeBase.length} Entri Terintegrasi)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pack.knowledgeBase.map((item, idx) => (
              <Card key={idx} className="rounded-2xl border-border p-4 space-y-2 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <span className="px-2 py-0.5 bg-secondary rounded-lg">{item.category}</span>
                  <span className="text-cyan-500 font-mono">{item.sourceStep}</span>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 bg-secondary/20 p-2.5 rounded-xl border border-border/50">
                    {typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RELATIONSHIP MAP */}
      {activeTab === "map" && (
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
            Alur Keterkaitan Strategi (Relationship Map Workflow)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pack.relationshipMap.map((node, idx) => (
              <Card key={node.id} className="rounded-2xl border-border p-5 space-y-3 relative overflow-hidden bg-card hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-purple-500/10 text-purple-600 rounded-lg">
                    {node.step}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{node.type}</span>
                </div>

                <div className="space-y-1">
                  <h5 className="text-sm font-black text-foreground">{node.label}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{node.summary}</p>
                </div>

                {idx < pack.relationshipMap.length - 1 && (
                  <div className="pt-2 flex items-center gap-1 text-[10px] font-black text-purple-500 uppercase tracking-widest">
                    <span>Terhubung ke Langkah Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VALIDATION RULES */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
            Aturan Validasi & Kepatuhan Kebijakan Iklan (Meta Policy & Viability)
          </h4>

          <div className="space-y-4">
            {pack.auditReport.rules.map((rule) => (
              <Card key={rule.ruleId} className="rounded-2xl border-border p-6 space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      rule.status === "pass" ? "bg-emerald-500/10 text-emerald-500" :
                      rule.status === "warning" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                    }`}>
                      {rule.status === "pass" ? <CheckCircle2 className="w-5 h-5" /> :
                       rule.status === "warning" ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{rule.title}</h5>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{rule.category}</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    rule.status === "pass" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                    rule.status === "warning" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  }`}>
                    {rule.status === "pass" ? "Valid PASS" : rule.status === "warning" ? "Perlu Diperhatikan" : "Fail Perbaikan"}
                  </span>
                </div>

                <p className="text-xs text-foreground bg-secondary/30 p-3 rounded-xl border border-border leading-relaxed">
                  {rule.message}
                </p>

                <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1 font-medium">
                  <strong className="text-foreground">Saran:</strong> {rule.recommendation}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GENERATED DOCUMENTS */}
      {activeTab === "docs" && (
        <div className="space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
            Dokumen Siap Pakai (Generated Strategy Documents)
          </h4>

          <div className="space-y-6">
            {pack.generatedDocuments.map((doc) => (
              <Card key={doc.id} className="rounded-[2rem] border-border p-6 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h5 className="text-base font-black text-foreground">{doc.title}</h5>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Format: {doc.format} | Created: {doc.createdAt.split("T")[0]}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCopyText(doc.content, doc.id)}
                      className="rounded-xl h-9 text-[10px] uppercase font-black tracking-wider gap-1.5"
                    >
                      {copiedDocId === doc.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedDocId === doc.id ? "Tersalin!" : "Salin Naskah"}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => downloadFile(doc.content, `${doc.id}.md`, "text/markdown")}
                      className="rounded-xl h-9 text-[10px] uppercase font-black tracking-wider gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Download className="w-3.5 h-3.5" /> Download (.MD)
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl font-mono text-xs overflow-x-auto max-h-96 leading-relaxed whitespace-pre-wrap border border-slate-800">
                  {doc.content}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DOCUMENT TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
            Katalog Templat Dokumen Pemasaran Digital
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_TEMPLATES.map((tpl) => (
              <Card key={tpl.id} className="rounded-2xl border-border p-6 space-y-3 hover:border-pink-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-pink-500/10 text-pink-600 rounded-lg">
                    {tpl.type}
                  </span>
                </div>

                <h5 className="text-sm font-black text-foreground">{tpl.name}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Variabel Dibutuhkan: {tpl.variablesRequired.join(", ")}</span>
                  <span className="text-pink-500 font-black">Ready</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: VERSIONED PACK EXPORT */}
      {activeTab === "pack" && (
        <Card className="rounded-[2.5rem] border-border p-8 space-y-6 text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border pb-6">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                VERSIONED BLUEPRINT & DOCUMENTATION
              </span>
              <h4 className="text-xl font-black text-foreground">
                Blueprint Ekosistem & Documentation Pack ({pack.packVersion})
              </h4>
              <p className="text-xs text-emerald-500 font-bold">
                Gunakan file ini untuk Content Engine dan Product Forge.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  const success = downloadEcosystemBlueprint(project);
                  if (success) {
                    toast.success("Blueprint ALCO (alco_ecosystem_blueprint.json) berhasil diunduh!");
                  }
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl h-12 px-6 gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Blueprint ALCO
              </Button>

              <Button
                onClick={() => {
                  downloadMetaAdsCampaignPack(project);
                  toast.success("Export Khusus Meta Ads (.JSON) berhasil diunduh!");
                }}
                variant="outline"
                className="rounded-2xl h-12 px-4 text-xs font-bold text-muted-foreground hover:text-foreground border-border cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export Khusus Meta Ads
              </Button>

              <Button
                onClick={handleExportPack}
                variant="outline"
                className="rounded-2xl h-12 px-4 text-xs font-bold text-muted-foreground hover:text-foreground border-border cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Backup Project (.JSON)
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              File Documentation Pack ini merangkum 7 lapisan Dokumentasi Engine secara lengkap: Knowledge Base, Relationship Map, Validation Rules, Document Templates, Generated Strategy Documents, Audit Engine Score, serta metadata versi untuk keamanan & kemudahan sinkronisasi ulang.
            </p>

            <div className="p-4 bg-secondary/30 rounded-2xl border border-border font-mono text-xs text-foreground overflow-x-auto max-h-64">
              <pre>{JSON.stringify({
                packVersion: pack.packVersion,
                snapshotId: pack.snapshotId,
                createdAt: pack.createdAt,
                projectName: pack.projectName,
                overallAuditScore: pack.auditReport.overallScore,
                knowledgeBaseEntries: pack.knowledgeBase.length,
                generatedDocuments: pack.generatedDocuments.map(d => d.title)
              }, null, 2)}</pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
