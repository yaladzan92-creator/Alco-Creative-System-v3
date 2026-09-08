import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, Lightbulb, Wand2, BookOpen, ChevronDown, Check } from "lucide-react";
import { generateAIContent } from "@/services/aiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SmartInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  context?: any;
  placeholder?: string;
  exampleText?: string;
  isRequired?: boolean;
}

export default function SmartInput({
  label,
  value,
  onChange,
  context,
  placeholder,
  exampleText,
  isRequired = false
}: SmartInputProps) {
  const [loadingMode, setLoadingMode] = React.useState<"draft" | "refine" | null>(null);
  const [optimized, setOptimized] = React.useState<{ text: string; suggestions?: string[] } | null>(null);
  const [showExample, setShowExample] = React.useState(false);

  // Default fallback examples if not explicitly provided
  const fallbackExample = exampleText || `Contoh: "Panduan praktis berupa e-book & template siap pakai untuk membantu pemula menghasilkan omset pertama dari jualan produk digital dalam 30 hari tanpa harus keluar modal iklan besar."`;

  // Level 2 Action: "Bantu isi" (Primary column helper)
  const handleDraftFill = async () => {
    setLoadingMode("draft");
    try {
      const initProd = context?.initialProductData || {};
      const niche = context?.nicheData?.selectedOption || context?.nicheData?.input || {};
      const audience = context?.audienceData?.selectedOption || context?.audienceData?.input || {};
      const problem = context?.painPointData?.selectedOption || context?.painPointData?.input || {};
      const positioning = context?.positioningData?.selectedOption || context?.positioningData?.input || {};

      const inputContext = `
        Konteks Proyek Terverifikasi:
        - Produk: ${JSON.stringify(initProd)}
        - Niche Terpilih: ${JSON.stringify(niche)}
        - Audiens Terpilih: ${JSON.stringify(audience)}
        - Masalah Terpilih: ${JSON.stringify(problem)}
        - Positioning Terpilih: ${JSON.stringify(positioning)}

        Kolom Target: "${label}"
        Isian Saat Ini: "${value || ""}"
      `;

      const promptText = `
        Tulis satu draf jawaban yang spesifik, bernilai tinggi, dan langsung aplikatif untuk kolom "${label}".
        Gunakan acuan produk & strategi yang sudah disetujui pengguna di atas.
        Jangan mengubah topik/produk pengguna.
        Tulis langsung dalam Bahasa Indonesia yang persuasif dan mudah dipahami.
        Kembalikan HANYA dalam format JSON valid:
        { "optimized_text": "[Isi draf rekomendasi ringkas & tajam di sini]" }
      `;

      const response = await generateAIContent(inputContext, promptText);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      const resText = data.optimized_text || data.text || "";
      setOptimized({ text: resText, suggestions: data.suggestions || [] });
      toast.success(`Draf untuk "${label}" siap ditinjau!`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat draf dengan AI");
    } finally {
      setLoadingMode(null);
    }
  };

  // Level 3 Action: "Sempurnakan jawaban saya" (Polishing user's typed input)
  const handleRefineText = async () => {
    if (!value || value.trim() === "") return;
    setLoadingMode("refine");
    try {
      const inputContext = `
        Konteks Proyek: ${JSON.stringify(context || {})}.
        Kolom Target: "${label}"
        Teks Pengguna Saat Ini: "${value}"
      `;

      const promptText = `
        Perjelas, rapikan, dan pertajam tata bahasa dari tulisan pengguna berikut untuk kolom "${label}":
        "${value}"
        
        ATURAN PENTING:
        - Jangan mengubah maksud inti, ide dasar, atau arah strategi yang sudah ditulis pengguna.
        - Perjelas diksi dan buat kalimatnya lebih rapi, persuasif, dan komunikatif dalam Bahasa Indonesia.
        
        Kembalikan HANYA format JSON valid:
        { "optimized_text": "[Teks hasil penyempurnaan di sini]" }
      `;

      const response = await generateAIContent(inputContext, promptText);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      const resText = data.optimized_text || data.text || "";
      setOptimized({ text: resText, suggestions: data.suggestions || [] });
      toast.success("Jawaban Anda berhasil disempurnakan!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyempurnakan jawaban");
    } finally {
      setLoadingMode(null);
    }
  };

  const applyOptimization = () => {
    if (optimized) {
      onChange(optimized.text);
      setOptimized(null);
    }
  };

  const hasUserTyped = Boolean(value && value.trim().length > 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{label}</label>
          {isRequired ? (
            <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">Wajib</span>
          ) : (
            <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">Opsional</span>
          )}
        </div>

        {/* Clean, Non-Intrusive Helper Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Primary Action: Bantu Isi */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loadingMode !== null}
            onClick={handleDraftFill}
            className="h-6 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 rounded-md border border-primary/25 gap-1 cursor-pointer transition-all shadow-xs"
            title="Minta AI mengisi draf rekomendasi untuk kolom ini"
          >
            {loadingMode === "draft" ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : (
              <Sparkles className="w-3 h-3 text-primary" />
            )}
            <span>Bantu isi</span>
          </Button>

          {/* Conditional Action: Sempurnakan jawaban saya (Only if user has typed) */}
          {hasUserTyped && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loadingMode !== null}
              onClick={handleRefineText}
              className="h-6 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 px-2 rounded-md border border-violet-500/20 gap-1 cursor-pointer transition-all"
              title="Perjelas dan rapikan tulisan tanpa mengubah maksud strategi Anda"
            >
              {loadingMode === "refine" ? (
                <Loader2 className="w-3 h-3 animate-spin text-violet-500" />
              ) : (
                <Wand2 className="w-3 h-3 text-violet-500" />
              )}
              <span className="hidden sm:inline">Sempurnakan jawaban saya</span>
              <span className="sm:hidden">Sempurnakan</span>
            </Button>
          )}

          {/* Secondary Action: Contoh */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowExample(!showExample)}
            className="h-6 text-[9.5px] font-semibold text-muted-foreground hover:text-foreground bg-secondary/70 hover:bg-secondary px-2 rounded-md border border-border/80 gap-1 cursor-pointer transition-all"
            title="Lihat contoh isian ideal"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Contoh</span>
          </Button>
        </div>
      </div>

      {/* Example Box Toggle */}
      {showExample && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Contoh Isian Ideal
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(fallbackExample.replace(/^Contoh:\s*"/, "").replace(/"$/, ""));
                setShowExample(false);
              }}
              className="text-primary underline hover:text-primary/80 font-bold cursor-pointer text-[10px]"
            >
              Gunakan contoh ini
            </button>
          </div>
          <p className="text-muted-foreground font-medium italic leading-relaxed text-[11px]">
            {fallbackExample}
          </p>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative group">
        <Textarea
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-secondary/30 border-border rounded-xl min-h-[105px] focus:ring-primary focus:border-primary transition-all pr-10 text-xs leading-relaxed"
        />
        {value && loadingMode === null && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3.5 h-3.5 text-primary/40 animate-pulse" />
          </div>
        )}
      </div>

      {/* AI Preview Box with User Control: Gunakan, Batal */}
      {optimized && (
        <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/25 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Saran Jawaban AI
            </p>
            <span className="text-[9px] text-muted-foreground">Tinjau sebelum diterapkan</span>
          </div>

          <div className="bg-card p-3 rounded-xl border border-border text-xs font-medium text-foreground leading-relaxed">
            {optimized.text}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOptimized(null)}
              className="h-7 px-3 rounded-lg text-xs font-bold text-muted-foreground cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={applyOptimization}
              className="h-7 px-3 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold gap-1 cursor-pointer shadow-xs"
            >
              <Check className="w-3 h-3" />
              Terapkan Jawaban Ini
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
