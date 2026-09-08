import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, CheckCircle2, MessageSquare, RotateCcw, ArrowRight } from "lucide-react";

interface StepWrapperProps {
  children: React.ReactNode;
  loading: boolean;
  onGenerate: (revision?: string) => void;
  onFixAndContinue: () => void;
  onSaveProject?: () => void;
  hasResult: boolean;
  activeStep: number;
  isFinal?: boolean;
}

export default function StepWrapper({ 
  children, 
  loading, 
  onGenerate, 
  onFixAndContinue,
  onSaveProject,
  hasResult,
  activeStep,
  isFinal
}: StepWrapperProps) {
  const [revision, setRevision] = React.useState("");

  return (
    <div className="space-y-8">
      {/* Input Area (Fields & Form Controls) */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Action Area: Level 3 AI Generation */}
      <div className="flex flex-col gap-4 pt-6 border-t border-border">
        {/* Clear 2-Step Flow Guidance Banner */}
        <div className="p-3 bg-secondary/40 border border-border/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">1</span>
            <span className="text-muted-foreground font-medium text-[11px]">Isi input form (secara manual, atau klik tombol <strong>"Isi langkah ini dengan AI"</strong> di atas)</span>
          </div>
          <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground/40 shrink-0" />
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-black text-primary">2</span>
            <span className="text-muted-foreground font-medium text-[11px]">Klik <strong>"Buat Hasil Langkah Ini"</strong> di bawah untuk memproses output final</span>
          </div>
        </div>

        <div className="flex items-center justify-between my-1">
           <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Pemrosesan Output Final Langkah {activeStep}</span>
           </div>
           {onSaveProject && (
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSaveProject}
                className="h-8 text-[9px] font-black uppercase tracking-widest border border-border rounded-lg cursor-pointer"
             >
                Simpan Proyek
             </Button>
           )}
        </div>

        {/* Level 3 Main CTA Button */}
        {!hasResult ? (
          <Button 
            disabled={loading} 
            onClick={() => onGenerate()}
            className="w-full h-14 md:h-16 bg-primary text-white font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-primary/20 group text-sm cursor-pointer transition-all hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>AI Sedang Menganalisis & Menyusun Output...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2 text-white animate-pulse" />
                <span>Buat Hasil Langkah Ini (Step {activeStep})</span>
              </>
            )}
          </Button>
        ) : (
          <div className="p-5 bg-secondary/30 rounded-2xl border border-border space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catatan Revisi Output AI (Opsional)</label>
              <Textarea 
                placeholder="Ingin penyesuaian output AI? Ketik di sini... (contoh: 'Buat nada bicaranya lebih santai', 'Tekankan keunggulan bebas biaya ongkir')"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                className="bg-background border-border rounded-xl min-h-[70px] text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                disabled={loading} 
                variant="outline"
                onClick={() => onGenerate(revision)}
                className="flex-1 min-w-[140px] h-11 rounded-xl font-bold uppercase tracking-wider text-[10px] gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Hasilkan Ulang / Revisi
              </Button>
              <Button 
                disabled={loading} 
                onClick={onFixAndContinue}
                className="flex-1 min-w-[140px] h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isFinal ? "Selesai & Simpan Project" : "Setujui & Lanjut Step Berikutnya"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

