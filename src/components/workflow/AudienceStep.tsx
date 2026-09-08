import React from "react";
import { Users, Heart, Brain, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import StepAiDraftBar from "./StepAiDraftBar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeStr).filter(Boolean).join(", ");
  if (typeof val === "object") return Object.entries(val).map(([k, v]) => `${k}: ${safeStr(v)}`).join(" | ");
  return String(val);
};

export default function AudienceStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    topPain: "",
    audienceGoal: "",
    fears: "",
    desires: "",
    extraContext: ""
  });
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.audienceData?.input) {
      setFormData(project.audienceData.input);
    }
    if (project?.audienceData?.options) {
      setOptions(project.audienceData.options);
      setSelectedId(project.audienceData.selectedOption?.id || null);
    }
  }, [project]);

  const handlePercayakanPadaAI = async () => {
    setLoading(true);
    try {
      const activeInputs = {
        topPain: formData.topPain,
        audienceGoal: formData.audienceGoal,
        fears: formData.fears,
        desires: formData.desires,
        extraContext: formData.extraContext
      };

      const prompt = `
        Berdasarkan Niche pasar terpilih: ${JSON.stringify(project?.nicheData?.selectedOption || {})}, hasilkan data input form yang strategis dan berkonversi tinggi untuk memetakan Karakter Pelanggan (Audience Persona) PRODUK DIGITAL.

        PENTING: Pengguna telah mengisi sebagian atau seluruh nilai formulir saat ini sebagai berikut:
        ${JSON.stringify(activeInputs)}

        Silakan periksa nilai-nilai di atas. Jika ada nilai yang diisi (tidak kosong, atau berbeda dari default kosong), Anda HARUS memprioritaskan dan melestarikannya (keep atau sempurnakan dan jangan menghilangkannya). Lengkapi kolom yang kosong dengan rekomendasi cerdas yang sangat selaras, harmonis, dan mendukung isian pengguna yang sudah ada tersebut agar pemetaan audiens sukses.

        Format JSON respon harus persis seperti berikut:
        {
          "topPain": "[Keluhan terdalam audiens, gunakan/sempurnakan isian pengguna jika ada]",
          "audienceGoal": "[Goal terbesar yang ingin diraih, gunakan/sempurnakan isian pengguna jika ada]",
          "fears": "[Ketakutan terbesar, gunakan/sempurnakan isian pengguna jika ada]",
          "desires": "[Keinginan paling didambakan, gunakan/sempurnakan isian pengguna jika ada]",
          "extraContext": "[Konteks penjelas tambahan yang intuitif untuk mempermudah beriklan, gunakan/sempurnakan isian pengguna jika ada]"
        }
        Pastikan merespon HANYA dengan JSON valid, tanpa format pembuka/penutup markdown lain kecuali file JSON-nya sendiri.
      `;
      const response = await generateAIContent("", prompt);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setFormData(prev => ({
        topPain: data.topPain || prev.topPain || "",
        audienceGoal: data.audienceGoal || prev.audienceGoal || "",
        fears: data.fears || prev.fears || "",
        desires: data.desires || prev.desires || "",
        extraContext: data.extraContext || prev.extraContext || ""
      }));
      toast.success("Draf input langkah ini berhasil diisi dengan AI. Silakan periksa atau klik 'Buat Hasil Langkah Ini'.");
    } catch (err) {
      console.error(err);
      toast.error("Gagal melengkapi form secara otomatis. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const previousOutput = options.length > 0 ? options : project?.audienceData?.options;

      const context = buildRevisionPromptContext({
        revision,
        previousOutput,
        stepName: "Step 2: Target Audience Persona",
        defaultContext: `
          Niche Selection: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
          Audience Context: ${JSON.stringify(formData)}.
          PROJECT HISTORY: ${JSON.stringify(project)}
        `
      });

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_2_AUDIENCE + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: formData, options: data.options }, false);
      toast.success("Audience personas mapped!");
    } catch (error: any) {
      console.error(error);
      toast.error("Generation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Please select an audience persona first");
      return;
    }
    const selected = options.find(o => o.id === selectedId);
    onSave({ input: formData, options, selectedOption: selected }, true);
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleGenerate}
      onFixAndContinue={handleFixAndContinue}
      onSaveProject={onSaveProject}
      hasResult={options.length > 0}
      activeStep={2}
    >
      <div className="space-y-6">
        {/* Level 1: Step-Level AI Draft Fill with Preview & Confirmation */}
        <StepAiDraftBar
          stepNumber={2}
          stepName="Target Audiens & Persona"
          project={project}
          currentValues={formData}
          fieldLabels={{
            topPain: "Masalah Terbesar Audiens",
            audienceGoal: "Target / Impian Audiens",
            fears: "Kekhawatiran / Ketakutan Audiens",
            desires: "Keinginan Paling Didambakan",
            extraContext: "Konteks Tambahan Audiens"
          }}
          onApplyAll={(newVals) => setFormData(prev => ({ ...prev, ...newVals }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Niche Terpilih</Label>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                 <p className="text-xs font-bold text-primary uppercase">{project.nicheData?.selectedOption?.name || "Belum dipilih"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Masalah Utama Pembeli (Top Pain)</Label>
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">Wajib</span>
              </div>
              <Input 
                placeholder="Contoh: Takut ketinggalan tren, bingung mulai..."
                value={formData.topPain} 
                onChange={(e) => setFormData({...formData, topPain: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tujuan Utama Pembeli (Primary Goal)</Label>
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">Wajib</span>
              </div>
              <Input 
                placeholder="Contoh: Penghasilan tambahan dari rumah..."
                value={formData.audienceGoal} 
                onChange={(e) => setFormData({...formData, audienceGoal: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Ketakutan Terbesar (Deepest Fears)</Label>
                <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">Opsional</span>
              </div>
              <Textarea 
                placeholder="Apa yang membuat mereka khawatir atau ragu mengambil keputusan?"
                value={formData.fears} 
                onChange={(e) => setFormData({...formData, fears: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl min-h-[70px] text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Keinginan Utama (Core Desires)</Label>
                <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">Opsional</span>
              </div>
              <Textarea 
                placeholder="Apa impian yang paling mereka idamkan?"
                value={formData.desires} 
                onChange={(e) => setFormData({...formData, desires: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl min-h-[70px] text-xs"
              />
            </div>
          </div>
        </div>

        <SmartInput 
          label="Konteks Tambahan Audien"
          placeholder="Rincian profesi, rentang penghasilan, atau tempat nongkrong favorit audien..."
          value={formData.extraContext}
          onChange={(val) => setFormData({...formData, extraContext: val})}
          context={project}
          isRequired={false}
        />
      </div>

      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-purple-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Persona Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-purple-500 bg-purple-500/5 ring-4 ring-purple-500/10" : "border-border bg-card hover:border-purple-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                           <Users className="w-6 h-6 text-purple-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground">{safeStr(option.persona_name)}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-purple-500" />}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Emotional Triggers</Label>
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(option.emotional_triggers) ? option.emotional_triggers : [option.emotional_triggers]).filter(Boolean).map((t: any, i: number) => (
                              <span key={i} className="px-3 py-1 bg-purple-500/5 text-purple-600 rounded-lg text-[9px] font-bold border border-purple-500/10 uppercase tracking-wider">
                                {safeStr(t)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Buying Behavior</Label>
                           <p className="text-xs font-medium text-foreground opacity-80 leading-relaxed italic">
                             "{safeStr(option.buying_behavior)}"
                           </p>
                        </div>
                      </div>
                      <div className="p-6 bg-secondary/30 rounded-2xl border border-border">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">AI Analysis</p>
                         <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {safeStr(option.analysis)}
                         </p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </StepWrapper>
  );
}
