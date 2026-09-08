import React from "react";
import { Sparkles, Loader2, Check, Edit2, X, Eye, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { generateAIContent } from "@/services/aiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface FieldPreviewItem {
  key: string;
  label: string;
  currentValue: string;
  suggestedValue: string;
}

interface StepAiDraftBarProps {
  stepNumber: number;
  stepName: string;
  project: any;
  currentValues: Record<string, any>;
  fieldLabels: Record<string, string>;
  onApplyAll: (newValues: Record<string, any>) => void;
  customPromptBuilder?: (project: any, currentValues: Record<string, any>) => string;
}

export default function StepAiDraftBar({
  stepNumber,
  stepName,
  project,
  currentValues,
  fieldLabels,
  onApplyAll,
  customPromptBuilder
}: StepAiDraftBarProps) {
  const [loading, setLoading] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [editableSuggestions, setEditableSuggestions] = React.useState<Record<string, string>>({});
  const [originalSuggestions, setOriginalSuggestions] = React.useState<Record<string, string>>({});

  const handleFetchDraft = async () => {
    setLoading(true);
    try {
      // 1. Gather confirmed context from prior steps & project using correct approved state fields
      const initProd = project?.initialProductData || {};
      const niche = project?.nicheData?.selectedOption || project?.nicheData?.input || {};
      const audience = project?.audienceData?.selectedPersona || project?.audienceData?.selectedOption || project?.audienceData?.input || {};
      const problem = project?.painPointData?.selectedOption || project?.painPointData?.input || {};
      const validation = project?.validationData?.selectedOption || project?.validationData?.input || {};
      const positioning = project?.positioningData?.selectedPromise || project?.positioningData?.selectedOption || project?.positioningData?.input || {};
      const offer = project?.offerData?.selectedOffer || project?.offerData?.input || {};
      const angles = project?.marketingAngles?.selectedAngles || project?.marketingAngles?.selectedOption || project?.marketingAngles?.input || {};
      const copy = project?.copyDirection?.selectedCopy || project?.copyDirection?.selectedOption || project?.copyDirection?.input || {};
      const brand = project?.brandFoundationData || {};
      const brandIntelligence = project?.brandIntelligence || {};

      const promptContext = `
        Konteks Strategi Proyek Yang Telah Disetujui Pengguna dari Langkah Sebelumnya:
        - Info Produk Dasar: ${JSON.stringify(initProd)}
        - Langkah 1 (Niche Pasar & Produk): ${JSON.stringify(niche)}
        - Langkah 2 (Target Audiens Persona - selectedPersona): ${JSON.stringify(audience)}
        - Langkah 3 (Problem & Pain Point Utama): ${JSON.stringify(problem)}
        - Langkah 4 (Validasi Ide & Minat Pasar): ${JSON.stringify(validation)}
        - Langkah 5 (Positioning & Janji Utama - selectedPromise): ${JSON.stringify(positioning)}
        - Langkah 6 (Paket Penawaran / Offer - selectedOffer): ${JSON.stringify(offer)}
        - Langkah 7 (Sudut Pandang Iklan - selectedAngles): ${JSON.stringify(angles)}
        - Langkah 8 (Naskah Copywriting - selectedCopy): ${JSON.stringify(copy)}
        - Langkah 9 (Pondasi Brand & Identitas): ${JSON.stringify(brand)}
        - Rangkuman Intelijen Brand: ${JSON.stringify(brandIntelligence)}
        
        Isian formulir pengguna saat ini pada Langkah ${stepNumber} (${stepName}):
        ${JSON.stringify(currentValues)}
      `;

      let prompt = "";
      if (customPromptBuilder) {
        prompt = customPromptBuilder(project, currentValues);
      } else {
        const fieldKeys = Object.keys(fieldLabels);
        prompt = `
          Anda adalah asisten perumus strategi pemasaran digital dan iklan Meta Ads.
          Tugas Anda: Mengisi draf isian form untuk Langkah ${stepNumber}: "${stepName}".
          
          ATURAN KETAT:
          1. Gunakan data yang sudah disetujui dari langkah sebelumnya (Niche, Audiens, Masalah, Janji Nilai, Offer, atau Brand).
          2. DILARANG KERAS mengganti produk, niche pasar, persona sasaran, positioning, penawaran, atau nama brand yang sudah ada.
          3. Jika pengguna sudah mengetik isian pada field tertentu, prioritaskan & sempurnakan isian pengguna tersebut tanpa mengubah arah strategi mereka.
          4. Untuk field yang masih kosong, isi dengan draf ide rekomendasi terbaik yang langsung aplikatif, persuasif, dan selaras dengan produk pengguna.
          5. Gunakan Bahasa Indonesia yang lugas, jelas, dan mudah dimengerti.

          Daftar Kolom yang Harus Diisi:
          ${fieldKeys.map(k => `- "${k}": untuk kolom "${fieldLabels[k]}"`).join("\n")}

          KEMBALIKAN HANYA DALAM FORMAT JSON VALID persis berupa key-value object:
          {
            ${fieldKeys.map(k => `"${k}": "[Teks draf rekomendasi untuk ${fieldLabels[k]}]"`).join(",\n")}
          }
        `;
      }

      const response = await generateAIContent(promptContext, prompt);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const parsedData = JSON.parse(cleanText);

      // Filter only matching fields and ensure strings
      const suggestionsMap: Record<string, string> = {};
      Object.keys(fieldLabels).forEach(key => {
        const val = parsedData[key];
        if (val !== undefined && val !== null) {
          suggestionsMap[key] = typeof val === "object" ? JSON.stringify(val) : String(val);
        } else {
          suggestionsMap[key] = currentValues[key] || "";
        }
      });

      setOriginalSuggestions(suggestionsMap);
      setEditableSuggestions(suggestionsMap);
      setPreviewOpen(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal menyusun draf AI. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = () => {
    onApplyAll(editableSuggestions);
    setPreviewOpen(false);
    toast.success("Seluruh isian langkah berhasil diterapkan!");
  };

  const handleCancel = () => {
    setPreviewOpen(false);
    setEditableSuggestions(originalSuggestions);
  };

  return (
    <>
      {/* Step Level AI Draft Bar */}
      <div className="p-3.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
              <span>Bantuan AI Langkah Ini</span>
              <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-md">
                Otomatis Selaras
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              AI mengisi formulir langkah ini memakai data yang sudah Anda setujui sebelumnya.
            </p>
          </div>
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={handleFetchDraft}
          className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-black uppercase tracking-wider text-[10px] rounded-xl h-8 px-4 gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Menyusun Isian...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Isi langkah ini dengan AI</span>
            </>
          )}
        </Button>
      </div>

      {/* Preview & Confirmation Modal before Applying */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-card/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-heading font-black tracking-tight text-foreground">
                  Pratinjau Isian AI — Langkah {stepNumber}: {stepName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Periksa rekomendasi AI di bawah. Anda dapat mengedit teks sebelum menerapkannya atau membatalkan tanpa mengubah isian lama.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body: List of Fields with before & after / editable */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="p-3 bg-secondary/40 rounded-xl border border-border/70 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AI menjaga kesinambungan data produk, persona audiens, dan positioning yang telah Anda setujui sebelumnya.</span>
            </div>

            <div className="space-y-4">
              {Object.keys(fieldLabels).map(key => {
                const label = fieldLabels[key];
                const currentVal = currentValues[key] || "";
                const suggestedVal = editableSuggestions[key] || "";

                return (
                  <div key={key} className="bg-card border border-border rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-foreground">
                        {label}
                      </label>
                      {currentVal && (
                        <span className="text-[9.5px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                          Sebelumnya ada isian
                        </span>
                      )}
                    </div>

                    {/* Editable Textarea for User */}
                    <textarea
                      value={suggestedVal}
                      onChange={(e) => setEditableSuggestions(prev => ({ ...prev, [key]: e.target.value }))}
                      rows={Math.max(2, Math.min(5, Math.ceil((suggestedVal.length || 1) / 60)))}
                      className="w-full bg-secondary/30 border border-border rounded-lg p-2.5 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={`Rekomendasi untuk ${label}...`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions: Gunakan semua, Edit dulu / Simpan, Batal */}
          <DialogFooter className="p-4 border-t border-border/80 bg-card/60 flex-col sm:flex-row items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleApplyAll}
              className="w-full sm:w-auto h-9 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Gunakan Semua Isian Ini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
