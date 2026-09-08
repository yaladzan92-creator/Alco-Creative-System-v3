import React from "react";
import { Target, Star, Brain, CheckCircle2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateAIContent, AGENT_PROMPTS } from "@/services/aiService";
import { toast } from "sonner";
import { buildRevisionPromptContext } from "@/utils/revisionPromptHelper";
import StepWrapper from "./StepWrapper";
import SmartInput from "./SmartInput";
import StepAiDraftBar from "./StepAiDraftBar";
import { cn } from "@/lib/utils";

const safeStr = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeStr).filter(Boolean).join(", ");
  if (typeof val === "object") return Object.entries(val).map(([k, v]) => `${k}: ${safeStr(v)}`).join(" | ");
  return String(val);
};

export default function PositioningStep({ project, onSave, onSaveProject }: any) {
  const [loading, setLoading] = React.useState(false);
  const [extraContext, setExtraContext] = React.useState("");
  const [options, setOptions] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project?.positioningData?.input) {
      setExtraContext(project.positioningData.input.extraContext || "");
    }
    if (project?.positioningData?.options) {
      setOptions(project.positioningData.options);
      setSelectedId(project.positioningData.selectedOption?.id || null);
    }
  }, [project]);

  const handleGenerate = async (revision?: string) => {
    setLoading(true);
    try {
      const previousOutput = options.length > 0 ? options : project?.positioningData?.options;

      const context = buildRevisionPromptContext({
        revision,
        previousOutput,
        stepName: "Step 5: Product Positioning Strategy",
        defaultContext: `
          Niche: ${JSON.stringify(project.nicheData?.selectedOption || {})}.
          Audience: ${JSON.stringify(project.audienceData?.selectedOption || {})}.
          Problem: ${JSON.stringify(project.painPointData?.selectedOption || {})}.
          Validation: ${JSON.stringify(project.validationData?.selectedOption || {})}.
          Additional Context: ${extraContext}
          PROJECT HISTORY: ${JSON.stringify(project)}
        `
      });

      const response = await generateAIContent(
        context,
        AGENT_PROMPTS.STEP_5_POSITIONING + " Use Indonesian language for descriptions. Respond ONLY with the requested JSON format."
      );
      
      const cleanText = response.text.replace(/```json\n?|```/g, "").trim();
      const data = JSON.parse(cleanText);
      
      setOptions(data.options || []);
      if (data.options?.length > 0) {
        setSelectedId(data.options[0].id);
      }
      
      onSave({ input: { extraContext }, options: data.options }, false);
      toast.success("Positioning strategies generated!");
    } catch (error: any) {
      console.error(error);
      toast.error("Generation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAndContinue = () => {
    if (!selectedId) {
      toast.error("Please select a positioning strategy first");
      return;
    }
    const selected = options.find(o => o.id === selectedId);
    onSave({ input: { extraContext }, options, selectedOption: selected }, true);
  };

  return (
    <StepWrapper
      loading={loading}
      onGenerate={handleGenerate}
      onFixAndContinue={handleFixAndContinue}
      onSaveProject={onSaveProject}
      hasResult={options.length > 0}
      activeStep={5}
    >
      <div className="space-y-6">
        {/* Level 1: Step-Level AI Draft Fill with Preview & Confirmation */}
        <StepAiDraftBar
          stepNumber={5}
          stepName="Positioning & Janji Utama"
          project={project}
          currentValues={{ extraContext }}
          fieldLabels={{
            extraContext: "Detail Positioning Strategis & Keunikan Pembeda"
          }}
          onApplyAll={(newVals) => {
            if (newVals.extraContext !== undefined) setExtraContext(newVals.extraContext);
          }}
        />

        <SmartInput 
          label="Detail Positioning Strategis"
          placeholder="Bagaimana Anda ingin dikenal? Apa yang membuat produk Anda berbeda dari yang lain?"
          value={extraContext}
          onChange={setExtraContext}
          context={project}
        />
      </div>
      {options.length > 0 && (
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-3">
             <Brain className="w-5 h-5 text-amber-500" />
             <h3 className="text-xl font-heading font-black tracking-tight">Positioning Angle Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {options.map((option) => (
              <Card 
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  "cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 shadow-lg overflow-hidden",
                  selectedId === option.id ? "border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/10" : "border-border bg-card hover:border-amber-500/30"
                )}
              >
                <CardContent className="p-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                           <Star className="w-6 h-6 text-amber-500" />
                        </div>
                        <h4 className="text-2xl font-heading font-black tracking-tight text-foreground uppercase">{safeStr(option.title)}</h4>
                      </div>
                      {selectedId === option.id && <CheckCircle2 className="w-6 h-6 text-amber-500" />}
                   </div>

                   <div className="space-y-6">
                      <div className="p-6 bg-secondary/30 rounded-2xl border border-border">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Positioning Statement</p>
                         <p className="text-lg font-bold text-foreground leading-relaxed italic">"{safeStr(option.positioning_statement)}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">The USP</p>
                            <p className="text-sm font-bold text-foreground leading-relaxed">{safeStr(option.USP)}</p>
                         </div>
                         <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Unique Mechanism</p>
                            <p className="text-sm font-bold text-foreground leading-relaxed">{safeStr(option.unique_mechanism)}</p>
                         </div>
                      </div>

                      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/50">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Strategic Value Proposition</p>
                         <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">{safeStr(option.value_proposition)}</p>
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
