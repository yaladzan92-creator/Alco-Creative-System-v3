import React from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Target, 
  Users, 
  Gift, 
  TrendingUp, 
  FileText, 
  Palette, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CampaignSummaryPanelProps {
  project: any;
  activeStep: number;
  onNavigateStep: (step: number) => void;
  onCloseMobile?: () => void;
}

export default function CampaignSummaryPanel({
  project,
  activeStep,
  onNavigateStep,
  onCloseMobile
}: CampaignSummaryPanelProps) {
  // Calculate completion items
  const safeStr = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (val.pembuka || val.penjelasan || val.ajakan_beli) {
        return [val.pembuka, val.penjelasan, val.ajakan_beli].filter(Boolean).join(" • ");
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  const productName = safeStr(project?.initialProductData?.productName || project?.nicheData?.selectedOption?.name || project?.name);
  const isProductSet = !!productName;

  const audienceTarget = safeStr(project?.audienceData?.selectedPersona?.name || project?.audienceData?.selectedOption?.persona_name || project?.audienceData?.input?.targetDemographics);
  const isAudienceSet = !!audienceTarget;

  const painPoint = safeStr(project?.painPointData?.selectedProblems?.[0]?.problem || project?.painPointData?.selectedOption?.profitable_problem || project?.painPointData?.input?.primaryPain);
  const isPainPointSet = !!painPoint;

  const offerTitle = safeStr(project?.offerData?.selectedOffer?.title || project?.offerData?.selectedOption?.type || project?.offerData?.input?.mainOffer);
  const isOfferSet = !!offerTitle;

  const mainAngle = safeStr(project?.marketingAngles?.selectedAngles?.[0]?.angle_title || project?.marketingAngles?.selectedOption?.angle_set_title || project?.marketingAngles?.input?.primaryAngle);
  const isAngleSet = !!mainAngle;

  const copyHeadline = safeStr(project?.copyDirection?.selectedCopy?.headline || project?.copyDirection?.selectedOption?.name || project?.copyDirection?.selectedCopy?.name || project?.copyDirection?.input?.headline);
  const isCopySet = !!copyHeadline;

  const brandIdentity = safeStr(project?.brandFoundationData?.brandTone || project?.brandFoundationData?.brandName || project?.brandFoundationData?.primaryColor);
  const isBrandSet = !!brandIdentity;

  const campaignPack = project?.adsContentData || project?.adsGeneratedAngles;
  const isCampaignPackSet = !!campaignPack;

  // Total readiness calculation
  const totalItems = 8;
  const completedItems = [
    isProductSet,
    isAudienceSet,
    isPainPointSet,
    isOfferSet,
    isAngleSet,
    isCopySet,
    isBrandSet,
    isCampaignPackSet
  ].filter(Boolean).length;

  const readinessPercent = Math.round((completedItems / totalItems) * 100);

  const campaignSummaryList = [
    {
      id: 1,
      title: "1. Produk Digital",
      icon: Target,
      value: productName || "Belum ditentukan",
      isReady: isProductSet,
      stepNum: 1
    },
    {
      id: 2,
      title: "2. Target Audience",
      icon: Users,
      value: audienceTarget || "Belum ditentukan",
      isReady: isAudienceSet,
      stepNum: 2
    },
    {
      id: 3,
      title: "3. Pain Point Utama",
      icon: AlertCircle,
      value: painPoint || "Belum dipetakan",
      isReady: isPainPointSet,
      stepNum: 3
    },
    {
      id: 4,
      title: "4. Paket Offer",
      icon: Gift,
      value: offerTitle || "Belum dirancang",
      isReady: isOfferSet,
      stepNum: 6
    },
    {
      id: 5,
      title: "5. Angle Utama",
      icon: TrendingUp,
      value: mainAngle || "Belum dipilih",
      isReady: isAngleSet,
      stepNum: 7
    },
    {
      id: 6,
      title: "6. Ads Copywriting",
      icon: FileText,
      value: copyHeadline ? `"${copyHeadline}"` : "Belum digenerasi",
      isReady: isCopySet,
      stepNum: 8
    },
    {
      id: 7,
      title: "7. Identitas Brand",
      icon: Palette,
      value: brandIdentity ? `Tone: ${brandIdentity}` : "Belum diatur",
      isReady: isBrandSet,
      stepNum: 9
    },
    {
      id: 8,
      title: "8. Campaign Pack & LP",
      icon: Zap,
      value: isCampaignPackSet ? "Siap Rilis & Export" : "Dalam Proses",
      isReady: isCampaignPackSet,
      stepNum: 10
    }
  ];

  return (
    <div className="flex flex-col h-full bg-card/60 border-l border-border p-4 lg:p-5 overflow-y-auto space-y-5">
      {/* Drawer Header with Close Button */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Ringkasan Campaign</span>
        </div>
        {onCloseMobile && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCloseMobile} 
            className="h-8 w-8 p-0 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            title="Tutup Ringkasan"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Header & Readiness Gauge */}
      <div className="space-y-3 bg-secondary/30 p-4 rounded-2xl border border-border/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Kesiapan Campaign</span>
          </div>
          <span className={cn(
            "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
            readinessPercent >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}>
            {readinessPercent}% Siap
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border/60">
            <div 
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          <p className="text-[9.5px] text-muted-foreground font-medium text-right">
            {completedItems} dari {totalItems} komponen terisi
          </p>
        </div>
      </div>

      {/* Campaign Assets List */}
      <div className="space-y-2.5 flex-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-muted-foreground">Komponen Campaign</span>
          <span className="text-[9px] font-semibold text-primary">Live Context</span>
        </div>

        <div className="space-y-2">
          {campaignSummaryList.map((item) => {
            const Icon = item.icon;
            const isCurrentStep = activeStep === item.stepNum;

            return (
              <div 
                key={item.id}
                onClick={() => onNavigateStep(item.stepNum)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer group flex items-start gap-2.5",
                  isCurrentStep 
                    ? "bg-primary/10 border-primary shadow-sm" 
                    : item.isReady 
                    ? "bg-card border-border/80 hover:border-primary/40" 
                    : "bg-secondary/20 border-border/40 opacity-70 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  item.isReady ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-secondary text-muted-foreground"
                )}>
                  {item.isReady ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-[10px] font-bold truncate",
                      isCurrentStep ? "text-primary font-black" : "text-foreground"
                    )}>
                      {item.title}
                    </p>
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                  <p className="text-[10.5px] text-muted-foreground font-medium truncate leading-tight">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Tip Card */}
      <div className="p-3 bg-card border border-border rounded-xl space-y-1">
        <div className="flex items-center gap-1.5 text-primary text-[9.5px] font-black uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>Sistem Memori Aktif</span>
        </div>
        <p className="text-[9.5px] text-muted-foreground font-medium leading-relaxed">
          Seluruh data di ringkasan ini otomatis tersambung menjadi materi iklan & copy di langkah akhir.
        </p>
      </div>
    </div>
  );
}
