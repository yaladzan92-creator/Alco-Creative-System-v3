import React from "react";
import { Search, Brain, Loader2, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { cn, handleAIError } from "@/lib/utils";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import StepAiDraftBar from "./StepAiDraftBar";
import { Button } from "@/components/ui/button";

export default function NicheStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    country: "Indonesia",
    age: "18-45",
    interest: "",
    skill: "",
    goal: "",
    budget: "Low",
    traffic: "Organic",
    extraContext: ""
  });
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initProd = project?.initialProductData;
    const nicheInput = project?.nicheData?.input;

    const interestValue = 
      nicheInput?.interest || 
      nicheInput?.niche || 
      initProd?.productName || 
      project?.name || 
      "";

    const skillValue = 
      nicheInput?.skill || 
      initProd?.productFormat || 
      "";

    const extraContextValue = 
      nicheInput?.extraContext || 
      (initProd?.mainBenefit ? `Manfaat Produk: ${initProd.mainBenefit} | Format: ${initProd.productFormat} | Target: ${initProd.targetMarket}` : "");

    setFormData(prev => ({
      country: nicheInput?.country || prev.country || "Indonesia",
      age: nicheInput?.age || prev.age || "18-45",
      interest: interestValue,
      skill: skillValue,
      goal: nicheInput?.goal || prev.goal || "",
      budget: nicheInput?.budget || prev.budget || "Low",
      traffic: nicheInput?.traffic || prev.traffic || "Organic",
      extraContext: extraContextValue
    }));

    if (project?.nicheData?.options && project.nicheData.options.length > 0) {
      setOptions(project.nicheData.options);
      setSelectedId(project.nicheData.selectedOption?.id || project.nicheData.options[0]?.id || null);
    } else if (initProd?.productName) {
      const defaultOpt = {
        id: "user_product_niche",
        name: initProd.productName,
        summary: `[Produk User - ${initProd.productCategory === "non_digital" ? "Non-Digital/Fisik/Jasa" : "Digital"}] ${initProd.productFormat || "Produk"}: ${initProd.mainBenefit || "Siap dipasarkan di Meta Ads."}`,
        demand_score: 95,
        competition_score: 45,
        viral_potential: 88,
        productFormat: initProd.productFormat,
        productCategory: initProd.productCategory,
        targetMarket: initProd.targetMarket
      };
      setOptions([defaultOpt]);
      setSelectedId("user_product_niche");
    }
  }, [project]);

  const handlePercayakanPadaAI = async () => {
    setLoading(true);
    try {
      const initProd = project?.initialProductData;
      const isHasProduct = initProd?.productStatus === "has_product" || !!initProd?.productName;

      const activeInputs = {
        country: formData.country,
        age: formData.age,
        interest: formData.interest || initProd?.productName || "",
        skill: formData.skill || initProd?.productFormat || "",
        goal: formData.goal,
        budget: formData.budget,
        traffic: formData.traffic,
        extraContext: formData.extraContext
      };

      const productGuardPrompt = isHasProduct ? `
        SANGAT PENTING: Pengguna SUDAH MEMILIKI produk spesifik:
        - Nama Produk: "${initProd?.productName || formData.interest}"
        - Kategori Tipe Produk: "${initProd?.productCategory === 'non_digital' ? 'Non-Digital (Fisik / Jasa / Event / Kuliner)' : 'Digital'}"
        - Format/Jenis Produk: "${initProd?.productFormat || formData.skill}"
        - Manfaat Utama: "${initProd?.mainBenefit || ''}"
        - Target Market: "${initProd?.targetMarket || ''}"

        DILARANG KERAS mengganti atau mengubah produk/niche pengguna ini menjadi produk lain!
        Tugas Anda HANYA melengkapi & memperjelas kolom-kolom formulir ini agar mendukung suksesnya promosi produk yang SUDAH ADA tersebut.
        Field "interest" HARUS TETAP memuat nama/topik produk pengguna: "${initProd?.productName || formData.interest}".
      ` : "";

      const prompt = `
        ${productGuardPrompt}
        Berdasarkan nama produk/proyek kami: "${initProd?.productName || project?.name || 'Bisnis Baru'}", hasilkan data input form yang ideal dan realistis untuk riset ceruk pasar (Niche) produk ber-margin tinggi.

        Nilai formulir saat ini:
        ${JSON.stringify(activeInputs)}

        PENTING: Pertahankan nilai yang sudah terisi di atas. Lengkapi kolom yang masih kosong dengan rekomendasi cerdas yang sangat selaras dengan produk pengguna.

        Kembalikan data dalam format JSON persis seperti berikut:
        {
          "country": "[Negara target]",
          "age": "[Target umur]",
          "interest": "[Nama/Topik produk pengguna, JANGAN DIUBAH MENJADI PRODUK LAIN]",
          "skill": "[Keahlian/Format penunjang produk]",
          "goal": "[Goal penghasilan]",
          "budget": "[Pilihan budget: 'Low', 'Medium', atau 'High']",
          "traffic": "[Pilihan trafik, misal: 'Organic', 'Ads', 'Hybrid']",
          "extraContext": "[Konteks penjelas tambahan tentang produk]"
        }
        Pastikan merespon HANYA dengan JSON valid.
      `;
      const response = await generateAIContent("", prompt);
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setFormData(prev => ({
        country: data.country || prev.country || "Indonesia",
        age: data.age || prev.age || "18-45",
        interest: isHasProduct ? (initProd?.productName || prev.interest || data.interest) : (data.interest || prev.interest || ""),
        skill: data.skill || prev.skill || "",
        goal: data.goal || prev.goal || "",
        budget: data.budget || prev.budget || "Low",
        traffic: data.traffic || prev.traffic || "Organic",
        extraContext: data.extraContext || prev.extraContext || ""
      }));
      toast.success("Draf input langkah ini berhasil diselaraskan dengan AI.");
    } catch (err) {
      console.error(err);
      toast.error("Gagal melengkapi form secara otomatis. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (revision?: string) => {
    if (!formData.interest) {
      toast.error("Silakan isi topik / nama niche produk Anda");
      return;
    }
    setLoading(true);
    try {
      const initProd = project?.initialProductData;
      const isHasProduct = initProd?.productStatus === "has_product" || !!initProd?.productName;

      const previousOutput = options.length > 0 ? options : project?.nicheData?.options;

      const context = buildRevisionPromptContext({
        revision,
        previousOutput,
        stepName: "Step 1: Riset Niche Produk",
        defaultContext: `
          User Inputs: ${JSON.stringify(formData)}.
          ${project ? `FULL PROJECT MEMORY: ${JSON.stringify(project)}` : ""}
        `
      });

      let promptInstruction = AGENT_PROMPTS.STEP_1_NICHE;

      if (isHasProduct) {
        promptInstruction += `
PENTING & SINKRONISASI MUTLAK:
Pengguna SUDAH MEMILIKI produk spesifik:
- Nama Produk: "${initProd?.productName || formData.interest}"
- Kategori Tipe Produk: "${initProd?.productCategory === 'non_digital' ? 'Non-Digital (Fisik/Jasa/Event/F&B)' : 'Digital'}"
- Format/Jenis Produk: "${initProd?.productFormat || formData.skill}"
- Manfaat Utama: "${initProd?.mainBenefit || ''}"
- Target Market: "${initProd?.targetMarket || ''}"

DILARANG KERAS mengganti produk ini dengan produk lain atau mengubah topik niche utama!
Rekomendasi 'options' yang Anda hasilkan HARUS berfokus pada analisis ceruk pasar, validasi sudut posisi, dan variasi positioning pasar untuk PRODUK YANG SUDAH ADA TERSEBUT.
Opsi pertama (index 0) HARUS merepresentasikan produk utama pengguna: "${initProd?.productName || formData.interest}" dengan ringkasan potensi pasar produk tersebut.
Opsi berikutnya (opsi 2 & 3) boleh berupa tajuk sudut pandang / positioning pasar dari produk yang sama.
Use Indonesian language for descriptions. Respond ONLY with the requested JSON format.`;
      } else {
        promptInstruction += " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format.";
      }

      const response = await generateAIContent(context, promptInstruction);
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);

      let finalOptions = data.options || [];
      if (isHasProduct && finalOptions.length > 0) {
        if (!finalOptions[0].name.toLowerCase().includes((initProd?.productName || "").toLowerCase().slice(0, 10))) {
          finalOptions[0].name = `${initProd?.productName || formData.interest}`;
        }
      }
      
      setOptions(finalOptions);
      if (finalOptions.length > 0) {
        setSelectedId(finalOptions[0].id);
      }
      
      onSave({ input: formData, options: finalOptions }, false);
      toast.success("Analisis & validasi niche produk berhasil diperbarui!");
    } catch (error: any) {
      handleAIError(error, "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Please select a niche option first");
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
      hasResult={options.length > 0}
      activeStep={1}
    >
      <div className="space-y-6">
        {/* Level 1: Step-Level AI Draft Fill with Preview & Confirmation */}
        <StepAiDraftBar
          stepNumber={1}
          stepName="Riset Niche & Produk"
          project={project}
          currentValues={formData}
          fieldLabels={{
            country: "Negara Target Iklan",
            age: "Rentang Usia Target",
            interest: "Topik Ceruk (Minat / Produk)",
            skill: "Keahlian / Kelebihan Produk",
            goal: "Target Pendapatan per Bulan",
            traffic: "Strategi Trafik",
            extraContext: "Konteks Tambahan Niche"
          }}
          onApplyAll={(newVals) => setFormData(prev => ({ ...prev, ...newVals }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Negara Target Iklan</Label>
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">Wajib</span>
              </div>
              <Input 
                placeholder="Contoh: Indonesia, Malaysia..."
                value={formData.country} 
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Rentang Usia Target</Label>
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">Wajib</span>
              </div>
              <Input 
                placeholder="Contoh: 18 - 45 tahun..."
                value={formData.age} 
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Keahlian / Kelebihan Produk</Label>
                <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">Opsional</span>
              </div>
              <Input 
                placeholder="Contoh: Desain Grafis, Resep Masakan, Konsultasi Bisnis..."
                value={formData.skill} 
                onChange={(e) => setFormData({...formData, skill: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Topik Ceruk (Minat / Hobi)</Label>
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">Wajib</span>
              </div>
              <Input 
                placeholder="Contoh: Pola Hidup Sehat, Parenting, Investasi Saham..."
                value={formData.interest} 
                onChange={(e) => setFormData({...formData, interest: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Target Pendapatan per Bulan</Label>
                <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">Opsional</span>
              </div>
              <Input 
                placeholder="Contoh: Rp 10 Juta atau Rp 20 Juta..."
                value={formData.goal} 
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
                className="bg-secondary/50 border-border rounded-xl h-12 text-xs"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Strategi Mendapatkan Pembeli (Traffic)</Label>
                <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">Opsional</span>
              </div>
              <select 
                value={formData.traffic}
                onChange={(e) => setFormData({...formData, traffic: e.target.value})}
                className="w-full h-12 px-3 bg-secondary/50 border border-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Organic">Gratis / Organik (Kreator Konten)</option>
                <option value="Ads">Iklan Berbayar (Meta Ads, Google Ads)</option>
                <option value="Hybrid">Gabungan (Organik + Iklan Berbayar)</option>
              </select>
            </div>
          </div>
        </div>

        <SmartInput 
            label="Konteks Tambahan Niche"
            placeholder="Ada spesialisasi khusus? Atau preferensi model bisnis tertentu (SaaS, Agency, E-commerce)?"
            value={formData.extraContext}
            onChange={(val) => setFormData({...formData, extraContext: val})}
            context={project}
            isRequired={false}
        />
      </div>

      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-primary" />
             <h3 className="text-xl font-heading font-black tracking-tight">AI Generated Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2rem] border-2 shadow-lg overflow-hidden group",
                  selectedId === option.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border bg-card hover:border-primary/30"
                )}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{option.name}</h4>
                            <div className="h-1 w-12 bg-primary/20 rounded-full" />
                         </div>
                         {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                      </div>
                      <p className="text-muted-foreground font-medium italic leading-relaxed">
                        "{option.summary}"
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap md:flex-col gap-3 min-w-[140px] justify-center">
                      {[
                        { label: "Demand", val: option.demand_score },
                        { label: "Competition", val: option.competition_score },
                        { label: "Potential", val: option.viral_potential },
                      ].map(stat => (
                        <div key={stat.label} className="bg-secondary/50 px-4 py-2 rounded-xl border border-border flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{stat.label}</span>
                          <span className="text-lg font-heading font-black text-foreground">{stat.val}%</span>
                        </div>
                      ))}
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
