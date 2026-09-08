import React from "react";
import { FileText, Brain, CheckCircle2, Type, Layout, Sparkles, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import StepAiDraftBar from "./StepAiDraftBar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const renderSafeString = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(renderSafeString).filter(Boolean).join(", ");
  if (typeof val === "object") {
    if (val.pembuka || val.penjelasan || val.ajakan_beli) {
      const parts = [];
      if (val.pembuka) parts.push(`Pembuka: ${renderSafeString(val.pembuka)}`);
      if (val.penjelasan) parts.push(`Penjelasan: ${renderSafeString(val.penjelasan)}`);
      if (val.ajakan_beli) parts.push(`Ajakan Beli: ${renderSafeString(val.ajakan_beli)}`);
      return parts.join(" • ");
    }
    if (val.hook || val.benefit || val.cta) {
      const parts = [];
      if (val.hook) parts.push(`Hook: ${renderSafeString(val.hook)}`);
      if (val.benefit) parts.push(`Benefit: ${renderSafeString(val.benefit)}`);
      if (val.cta) parts.push(`CTA: ${renderSafeString(val.cta)}`);
      return parts.join(" • ");
    }
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${renderSafeString(v)}`)
      .join(" | ");
  }
  return String(val);
};

const renderStructuredAnalysis = (val: any) => {
  if (!val) return <span className="text-muted-foreground italic text-xs">Belum ditentukan</span>;
  if (typeof val === "string") {
    return <p className="text-sm font-bold text-foreground leading-relaxed">{val}</p>;
  }
  if (typeof val === "object") {
    const hasStructureKeys = val.pembuka || val.penjelasan || val.ajakan_beli || val.hook || val.benefit || val.cta;
    if (hasStructureKeys) {
      return (
        <div className="space-y-2 pt-1 text-left">
          {(val.pembuka || val.hook) && (
            <div className="p-2.5 bg-background/60 rounded-xl border border-border/60">
              <span className="text-[9px] font-black uppercase tracking-wider text-orange-500 block mb-0.5">
                1. Pembuka (Hook):
              </span>
              <p className="text-xs font-bold text-foreground leading-relaxed">
                {renderSafeString(val.pembuka || val.hook)}
              </p>
            </div>
          )}
          {(val.penjelasan || val.benefit) && (
            <div className="p-2.5 bg-background/60 rounded-xl border border-border/60">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 block mb-0.5">
                2. Penjelasan (Benefit):
              </span>
              <p className="text-xs font-bold text-foreground leading-relaxed">
                {renderSafeString(val.penjelasan || val.benefit)}
              </p>
            </div>
          )}
          {(val.ajakan_beli || val.cta) && (
            <div className="p-2.5 bg-background/60 rounded-xl border border-border/60">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 block mb-0.5">
                3. Ajakan Beli (CTA):
              </span>
              <p className="text-xs font-bold text-foreground leading-relaxed">
                {renderSafeString(val.ajakan_beli || val.cta)}
              </p>
            </div>
          )}
        </div>
      );
    }
    return (
      <p className="text-xs font-bold text-foreground leading-relaxed">
        {renderSafeString(val)}
      </p>
    );
  }
  return <p className="text-sm font-bold text-foreground">{String(val)}</p>;
};

export default function CopyStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.copyDirection?.input) {
      setExtraContext(project.copyDirection.input.extraContext || "");
    }
    if (project?.copyDirection?.options) {
      setOptions(project.copyDirection.options);
      setSelectedId(project.copyDirection.selectedOption?.id || null);
    }
  }, [project]);

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const previousOutput = options.length > 0 ? options : project?.copyDirection?.options;

      const context = buildRevisionPromptContext({
        revision,
        previousOutput,
        stepName: "Step 8: Copywriting Protocols & Directions",
        defaultContext: `
          Niche: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
          Audience: ${JSON.stringify(project.audienceData?.selectedOption || {})}.
          Problem: ${JSON.stringify(project.painPointData?.selectedOption || {})}.
          Positioning: ${JSON.stringify(project.positioningData?.selectedOption || {})}.
          Offer: ${JSON.stringify(project.offerData?.selectedOption || {})}.
          Angles: ${JSON.stringify(project.marketingAngles?.selectedOption || {})}.
          Additional Context: ${extraContext}
          PROJECT HISTORY: ${JSON.stringify(project)}
        `
      });

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_8_COPY + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Copywriting protocols generated!");
    } catch (error: any) {
      console.error(error);
      toast.error("Generation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Please select a copy direction first");
      return;
    }
    const selected = options.find(o => o.id === selectedId);
    onSave({ input: { extraContext }, options, selectedOption: selected }, true);
    toast.success("Project Strategy Finalized!");
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleGenerate}
      onFixAndContinue={handleFixAndContinue}
      onSaveProject={onSaveProject}
      hasResult={options.length > 0}
      activeStep={8}
      isFinal={true}
    >
      <div className="space-y-6">
        {/* Level 1: Step-Level AI Draft Fill with Preview & Confirmation */}
        <StepAiDraftBar
          stepNumber={8}
          stepName="Arah Copywriting"
          project={project}
          currentValues={{ extraContext }}
          fieldLabels={{
            extraContext: "Detail Arahan Copywriting, Tone of Voice & Gaya Bahasa"
          }}
          onApplyAll={(newVals) => {
            if (newVals.extraContext !== undefined) setExtraContext(newVals.extraContext);
          }}
        />

        <SmartInput 
          label="Detail Arahan Copywriting"
          placeholder="Jelaskan tone of voice, gaya penulisan, atau contoh copy yang Anda sukai..."
          value={extraContext}
          onChange={setExtraContext}
          context={project}
        />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-orange-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Messaging Framework Options</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10" : "border-border bg-card hover:border-orange-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                           <Palette className="w-6 h-6 text-orange-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{renderSafeString(option.name) || "The Voice of Authority"}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-orange-500" />}
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <div className="p-6 bg-secondary/50 rounded-2xl border border-border">
                            <Type className="w-5 h-5 text-orange-500 mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Tone of Voice</p>
                            <p className="text-base font-bold text-foreground">{renderSafeString(option.tone)}</p>
                         </div>
                         <div className="p-6 bg-secondary/50 rounded-2xl border border-border">
                            <Layout className="w-5 h-5 text-orange-500 mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Copy Structure Strategy</p>
                            {renderStructuredAnalysis(option.structure_analysis)}
                         </div>
                      </div>

                      <div className="bg-orange-500/5 p-8 rounded-[2.5rem] border border-orange-500/20 flex flex-col justify-center text-center space-y-4">
                         <Sparkles className="w-8 h-8 text-orange-500 mx-auto" />
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-3">Copy Core Summary</p>
                            {typeof option.summary === "object" && option.summary !== null ? (
                              <div className="p-3 bg-background/50 rounded-xl border border-border/50 text-left">
                                {renderStructuredAnalysis(option.summary)}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-foreground italic leading-relaxed">"{renderSafeString(option.summary)}"</p>
                            )}
                         </div>
                         <div className="pt-4 border-t border-orange-500/10">
                            <p className="text-xs font-black text-foreground uppercase tracking-wider">Style Guideline: {renderSafeString(option.style)}</p>
                         </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedId && (
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
               <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-4" />
               <h4 className="text-xl font-heading font-black tracking-tight text-foreground mb-2">Full Strategy ecosystem Finalized</h4>
               <p className="text-sm text-muted-foreground font-medium max-w-lg mx-auto">
                 All data vectors have been synchronized. Your project is now ready for full-scale execution. You can now download the summary or move to the next build feature.
               </p>
            </div>
          )}
        </div>
      )}
    </StepWrapper>
  );
}
