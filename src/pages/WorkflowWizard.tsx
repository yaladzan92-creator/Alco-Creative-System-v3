import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Target, 
  Gift, 
  TrendingUp, 
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Zap,
  Palette,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, auth, onAuthStateChanged, doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from "@/lib/firebase";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useBranding } from "@/contexts/BrandingContext";
import { cn } from "@/lib/utils";
import { saveUserConfig } from "../services/aiService";
import { mergeWorkflowResult } from "../services/brandIntelligence";
import { normalizeProject } from "@/lib/projectSchema";

// Step Components
import NicheStep from "@/components/workflow/NicheStep";
import AudienceStep from "@/components/workflow/AudienceStep";
import PainPointStep from "@/components/workflow/PainPointStep";
import ValidationStep from "@/components/workflow/ValidationStep";
import PositioningStep from "@/components/workflow/PositioningStep";
import OfferStep from "@/components/workflow/OfferStep";
import AngleStep from "@/components/workflow/AngleStep";
import CopyStep from "@/components/workflow/CopyStep";
import BrandFoundationStep from "@/components/workflow/BrandFoundationStep";
import AdsContentStep from "@/components/workflow/AdsContentStep";
import ProductEntryGateway from "@/components/workflow/ProductEntryGateway";
import CampaignSummaryPanel from "@/components/workflow/CampaignSummaryPanel";

const STEPS = [
  { 
    id: 1, 
    title: "1. Riset Niche & Produk", 
    shortTitle: "Riset Niche", 
    purpose: "Menentukan produk digital spesifik dan ceruk pasar sasaran berdaya beli tinggi.",
    whyImportant: "Memilih pasar potensial agar promosi tepat sasaran & berkonversi tinggi.",
    icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" 
  },
  { 
    id: 2, 
    title: "2. Target Audiens & Persona", 
    shortTitle: "Target Audiens", 
    purpose: "Membedah profil, demografi, dan perilaku calon pembeli ideal.",
    whyImportant: "Memahami emosi calon pembeli agar pesan iklan terasa sangat personal.",
    icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" 
  },
  { 
    id: 3, 
    title: "3. Masalah & Pain Point", 
    shortTitle: "Masalah Audiens", 
    purpose: "Memetakan masalah mendalam & pemicu emosional terkuat pembeli.",
    whyImportant: "Masalah mendalam adalah alasan utama orang membeli solusi Anda.",
    icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" 
  },
  { 
    id: 4, 
    title: "4. Validasi Potensi Pasar", 
    shortTitle: "Validasi Pasar", 
    purpose: "Memvalidasi minat beli pasar sebelum mengeluarkan modal iklan.",
    whyImportant: "Memastikan calon pembeli siap bertransaksi sebelum promosi skala besar.",
    icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" 
  },
  { 
    id: 5, 
    title: "5. Positioning & Janji Utama", 
    shortTitle: "Positioning", 
    purpose: "Merumuskan keunikan produk & janji nilai pembeda dari kompetitor.",
    whyImportant: "Tampil unik & menonjol dibanding produk lain di pasar.",
    icon: Target, color: "text-amber-500", bg: "bg-amber-500/10" 
  },
  { 
    id: 6, 
    title: "6. Paket Penawaran (Offer)", 
    shortTitle: "Paket Penawaran", 
    purpose: "Menyusun promo penawaran & bonus bernilai tinggi yang menarik.",
    whyImportant: "Penawaran yang menggiurkan melipatgandakan tingkat konversi penjualan.",
    icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10" 
  },
  { 
    id: 7, 
    title: "7. Sudut Pandang (Angle) Iklan", 
    shortTitle: "Sudut Iklan", 
    purpose: "Merancang variasi pemicu psikologis daya pancing klik iklan Meta Ads.",
    whyImportant: "Angle iklan yang kuat menghemat budget & menaikkan rasio klik (CTR).",
    icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" 
  },
  { 
    id: 8, 
    title: "8. Naskah Copywriting Ads", 
    shortTitle: "Copywriting", 
    purpose: "Menghasilkan naskah iklan lengkap (Headline, Naskah Utama, dan Call to Action).",
    whyImportant: "Copywriting yang tepat mendorong pembeli untuk langsung bertindak.",
    icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" 
  },
  { 
    id: 9, 
    title: "9. Pondasi Brand & Visual", 
    shortTitle: "Pondasi Brand", 
    purpose: "Menetapkan identitas, tone suara, dan gaya komunikasi khas brand.",
    whyImportant: "Membangun kepercayaan dan kredibilitas jangka panjang bagi brand Anda.",
    icon: Palette, color: "text-violet-500", bg: "bg-violet-500/10" 
  },
  { 
    id: 10, 
    title: "10. Materi Iklan Meta Ads", 
    shortTitle: "Materi Iklan", 
    purpose: "Menghasilkan materi visual iklan, video ads dengan karakter, carousel, dan landing page.",
    whyImportant: "Seluruh materi promosi siap pakai untuk langsung dipasang di Meta Ads.",
    icon: Zap, color: "text-cyan-500", bg: "bg-cyan-500/10" 
  },
];

const getStepStatus = (stepId: number, proj: any) => {
  if (!proj) return { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };

  switch (stepId) {
    case 1:
      return proj?.nicheData?.selectedOption 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.nicheData?.input?.interest 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 2:
      return proj?.audienceData?.selectedPersona 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.audienceData?.input?.topPain 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 3:
      return proj?.painPointData?.selectedOption 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.painPointData?.input?.extraContext 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 4:
      return proj?.validationData?.score 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.validationData?.input?.price 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 5:
      return proj?.positioningData?.selectedPromise 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.positioningData?.input?.mainPromise 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 6:
      return proj?.offerData?.selectedOffer 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.offerData?.input?.mainOffer 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 7:
      return proj?.marketingAngles?.selectedAngles 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.marketingAngles?.input?.primaryAngle 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 8:
      return proj?.copyDirection?.selectedCopy 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.copyDirection?.input?.headline 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 9:
      return proj?.brandFoundationData 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 10:
      return (proj?.adsContentData || proj?.adsGeneratedAngles) 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    default:
      return { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
  }
};

export default function WorkflowWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeStep, setActiveStep] = React.useState(1);

  const [showEntryGateway, setShowEntryGateway] = React.useState(false);
  const [showSummaryDrawer, setShowSummaryDrawer] = React.useState(false);
  const { config } = useBranding();

  // Ref for mobile step selector buttons to auto-scroll active step into view
  const stepButtonsRef = React.useRef<{ [key: number]: HTMLButtonElement | null }>({});

  React.useEffect(() => {
    const activeBtn = stepButtonsRef.current[activeStep];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeStep]);

  // Sync active step when search parameters change
  React.useEffect(() => {
    const stepParam = searchParams.get("step");
    const modeParam = searchParams.get("mode");
    if (stepParam) {
      const parsedStep = parseInt(stepParam, 10);
      if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 10) {
        setActiveStep(parsedStep);
        return;
      }
    }
    if (modeParam === "ads") {
      setActiveStep(10);
    } else if (modeParam === "brand") {
      setActiveStep(9);
    }
  }, [searchParams]);

  // Collapsible sidebar state (Desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem("alco_wizard_sidebar_collapsed");
    return saved === "true";
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const nextVal = !prev;
      localStorage.setItem("alco_wizard_sidebar_collapsed", String(nextVal));
      return nextVal;
    });
  };

  React.useEffect(() => {
    const fetchProjectAndCheckOwnership = async (currentUser: any) => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const modeParam = params.get("mode");
        const stepParam = params.get("step");

        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalized = normalizeProject({ ...data, id: projectId });
          setProject(normalized);

          if (!normalized.initialSetupCompleted || !normalized.productStatus) {
            setShowEntryGateway(true);
          }

          const currentProgress = data.currentStep || 1;
          
          if (stepParam) {
            const parsedStep = parseInt(stepParam, 10);
            if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 10) {
              setActiveStep(parsedStep);
            } else if (modeParam === "ads") {
              setActiveStep(10);
            } else if (modeParam === "brand") {
              setActiveStep(9);
            } else {
              setActiveStep(Math.min(currentProgress, 10));
            }
          } else if (modeParam === "ads") {
            setActiveStep(10);
          } else if (modeParam === "brand") {
            setActiveStep(9);
          } else {
            setActiveStep(Math.min(currentProgress, 10));
          }
        } else {
          toast.error("Proyek tidak ditemukan");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat proyek");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        fetchProjectAndCheckOwnership(currentUser);
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [projectId, navigate]);

  const updateProjectData = async (stepKey: string, data: any, nextStep?: boolean) => {
    if (!projectId) return;
    try {
      const docRef = doc(db, "projects", projectId);
      const updates: any = {
        [stepKey]: data,
        updatedAt: serverTimestamp(),
      };
      
      const prevStep = project?.currentStep || 1;

      if (nextStep) {
        if (activeStep < 10) {
          const nextVal = activeStep + 1;
          updates.currentStep = Math.max(prevStep, nextVal);
          setActiveStep(nextVal);
        }
      }

      // Automatically compile and attach Brand Intelligence schema to updates payload
      const simulatedProject = { ...project, ...updates, id: projectId };
      const biUpdate = mergeWorkflowResult(simulatedProject);
      updates.brandIntelligence = biUpdate;
      
      await updateDoc(docRef, updates);
      setProject((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan progres");
    }
  };

  const handleManualSave = async (data: any) => {
    if (!projectId) return;
    try {
      const docRef = doc(db, "projects", projectId);
      const updates = { ...data, updatedAt: serverTimestamp() };

      const simulatedProject = { ...project, ...updates, id: projectId };
      const biUpdate = mergeWorkflowResult(simulatedProject);
      updates.brandIntelligence = biUpdate;

      await updateDoc(docRef, updates);
      setProject((prev: any) => ({ ...prev, ...updates }));
    } catch (error) {
       console.error(error);
    }
  };

  const handleEntryGatewayComplete = async (payload: any) => {
    if (!projectId) return;
    try {
      const docRef = doc(db, "projects", projectId);
      const updates: any = {
        ...payload,
        initialSetupCompleted: true,
        updatedAt: serverTimestamp(),
      };

      if (payload.initialProductData?.productName) {
        updates.name = payload.initialProductData.productName;
      }

      const simulatedProject = { ...project, ...updates, id: projectId };
      const biUpdate = mergeWorkflowResult(simulatedProject);
      updates.brandIntelligence = biUpdate;

      await updateDoc(docRef, updates);
      setProject((prev: any) => ({ ...prev, ...updates }));
      setShowEntryGateway(false);
      const destStep = payload.targetStep ? Math.min(Math.max(payload.targetStep, 1), 10) : 1;
      setActiveStep(destStep);
      toast.success(destStep === 10 ? "Campaign Pack Siap!" : "Data Produk Disimpan!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan data produk.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-3 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Memuat Data Proyek...</p>
      </div>
    );
  }

  if (showEntryGateway) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-6">
        <div className="bg-card border-b border-border p-4 px-4 md:px-8 flex items-center justify-between gap-3 mb-4 min-w-0">
          <h1 
            className="text-base sm:text-lg md:text-xl font-heading font-black tracking-tight text-foreground cursor-pointer flex-1 min-w-0 overflow-hidden truncate" 
            onClick={() => navigate('/dashboard')}
            title={`${config.brandName.toUpperCase()} ${config.toolName.toUpperCase()}`}
          >
            <span className="truncate inline-block max-w-full">
              {config.brandName.toUpperCase()} <span className="text-primary">{config.toolName.toUpperCase()}</span>
            </span>
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-xs font-bold hover:bg-secondary cursor-pointer shrink-0"
          >
            &larr; Kembali ke Dashboard
          </Button>
        </div>
        <ProductEntryGateway
          project={project}
          onComplete={handleEntryGatewayComplete}
          onSkip={() => setShowEntryGateway(false)}
        />
      </div>
    );
  }

  const renderContent = () => {
    const commonProps = {
      project,
      onSaveProject: handleManualSave,
      onSave: (data: any, next?: boolean) => {
        const stepKeys: Record<number, string> = {
          1: "nicheData",
          2: "audienceData",
          3: "painPointData",
          4: "validationData",
          5: "positioningData",
          6: "offerData",
          7: "marketingAngles",
          8: "copyDirection",
          9: "brandFoundationData",
          10: "adsContentData"
        };
        const key = stepKeys[activeStep] || "nicheData";
        updateProjectData(key, data, next);
      }
    };

    switch (activeStep) {
      case 1: return <NicheStep {...commonProps} />;
      case 2: return <AudienceStep {...commonProps} />;
      case 3: return <PainPointStep {...commonProps} />;
      case 4: return <ValidationStep {...commonProps} />;
      case 5: return <PositioningStep {...commonProps} />;
      case 6: return <OfferStep {...commonProps} />;
      case 7: return <AngleStep {...commonProps} />;
      case 8: return <CopyStep {...commonProps} />;
      case 9: return <BrandFoundationStep {...commonProps} />;
      case 10: return <AdsContentStep {...commonProps} />;
      default: return <NicheStep {...commonProps} />;
    }
  };

  const currentStepInfo = STEPS[activeStep - 1] || STEPS[0];
  const CurrentIcon = currentStepInfo.icon;
  const currentStepStatus = getStepStatus(activeStep, project);
  const progressPercent = Math.round((activeStep / 10) * 100);

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* 1. Slim Consolidated Top Header */}
      <header className="bg-card border-b border-border/80 px-3 md:px-6 py-2 md:py-2.5 flex items-center justify-between gap-2 md:gap-3 shrink-0">
        {/* Mobile Header Layout (< 768px): Single Row Compact */}
        <div className="flex md:hidden items-center justify-between gap-2 w-full min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <span 
            className="font-heading font-black text-xs text-foreground truncate text-center flex-1 min-w-0 px-1" 
            title={project?.name}
          >
            {project?.name || "Proyek Tanpa Judul"}
          </span>

          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
            {activeStep}/10
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSummaryDrawer(true)}
            className="h-8 w-8 p-0 rounded-xl text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 shrink-0 cursor-pointer"
            title="Ringkasan Campaign"
            aria-label="Ringkasan Campaign"
          >
            <ShieldCheck className="w-4 h-4" />
          </Button>
        </div>

        {/* Desktop Header Layout (>= 768px) */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            {/* Sidebar Toggle Button (Desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Buka Sidebar Langkah (Area Luas)" : "Tutup Sidebar Langkah"}
              className="h-8 px-2.5 rounded-xl border border-border/70 hover:bg-secondary text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-primary" />
                  <span className="text-[11px]">Buka Langkah</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[11px]">Tutup Langkah</span>
                </>
              )}
            </Button>

            {/* Brand / Project Name Link to Dashboard */}
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="h-8 px-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer shrink-0"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Button>
              <div className="h-3.5 w-px bg-border/80" />
              <span className="font-heading font-black text-xs sm:text-sm text-foreground truncate max-w-[140px] sm:max-w-xs" title={project?.name}>
                {project?.name || "Proyek Tanpa Judul"}
              </span>
            </div>
          </div>

          {/* Center: Global Progress */}
          <div className="flex items-center gap-2.5 bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/60 text-xs shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              Langkah {activeStep} / 10
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-secondary rounded-full overflow-hidden border border-border/50 hidden sm:block">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">
              {progressPercent}%
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Product Setup Trigger */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEntryGateway(true)}
              title="Ubah info produk dasar atau ganti mode"
              className="h-8 px-2.5 rounded-xl text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3 h-3 text-primary" />
              <span>Info Produk</span>
            </Button>

            {/* Open Campaign Summary Drawer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummaryDrawer(true)}
              className="h-8 px-3 rounded-xl text-xs font-bold border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ringkasan Campaign</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Slim Progress Track (Desktop Only) */}
      <div className="hidden md:flex h-1 w-full bg-secondary/60 overflow-hidden">
        {STEPS.map((step) => (
          <div 
            key={step.id} 
            className={`h-full flex-1 transition-all duration-300 ${step.id <= activeStep ? "bg-primary" : "bg-transparent opacity-20"}`}
          />
        ))}
      </div>

      {/* Mobile Horizontal Step Selector (Scrollable) */}
      <div className="md:hidden flex overflow-x-auto gap-1.5 p-2 bg-card/70 border-b border-border text-xs scrollbar-none">
        {STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;
          const isAccessible = step.id <= (project?.currentStep || 1);
          return (
            <button
              key={step.id}
              ref={(el) => { stepButtonsRef.current[step.id] = el; }}
              disabled={!isAccessible}
              onClick={() => isAccessible && setActiveStep(step.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[10px] flex items-center gap-1 transition-all shrink-0 cursor-pointer",
                isActive 
                  ? "bg-primary text-white shadow-sm font-black" 
                  : isCompleted 
                  ? "bg-secondary text-foreground hover:bg-secondary/80" 
                  : "bg-secondary/30 text-muted-foreground/50 opacity-50"
              )}
            >
              <span>{step.id}. {step.shortTitle}</span>
              {isCompleted && !isActive && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
            </button>
          );
        })}
      </div>

      {/* Main Body: Collapsible Sidebar + Expansive Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar: Unified 10-Step Journey (Desktop) */}
        {!isSidebarCollapsed && (
          <aside className="hidden md:flex w-72 lg:w-80 border-r border-border/80 bg-card/60 flex-col overflow-y-auto shrink-0 transition-all duration-200">
            <div className="p-4 flex-1 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Alur 10 Langkah</span>
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                  Step {activeStep}/10
                </span>
              </div>
              
              <div className="space-y-1.5">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = activeStep === step.id;
                  const isCompleted = activeStep > step.id;
                  const isAccessible = step.id <= (project?.currentStep || 1);
                  
                  return (
                    <div 
                      key={step.id}
                      onClick={() => isAccessible && setActiveStep(step.id)}
                      className={cn(
                        "flex flex-col gap-0.5 p-2.5 rounded-xl cursor-pointer transition-all border text-left",
                        isActive 
                          ? "bg-primary text-white border-primary shadow-sm" 
                          : isCompleted 
                          ? "bg-secondary/40 text-foreground border-border hover:border-primary/30" 
                          : isAccessible 
                          ? "bg-card text-foreground border-border/60 hover:border-primary/20" 
                          : "opacity-40 grayscale border-transparent pointer-events-none"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px]",
                          isActive ? "bg-white/20 text-white" : `${step.bg} ${step.color}`
                        )}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-[11px] font-bold truncate", isActive ? "text-white" : "text-foreground")}>
                            {step.title}
                          </p>
                        </div>
                        {isCompleted && !isActive && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                      </div>
                      <p className={cn("text-[9px] leading-tight pl-7 line-clamp-1", isActive ? "text-white/80" : "text-muted-foreground")}>
                        {step.whyImportant}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Auto-Sync Footnote in Sidebar */}
            <div className="p-3.5 bg-secondary/30 border-t border-border mt-auto">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-foreground">Sinkron Otomatis</span>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                Setiap hasil langkah yang disetujui otomatis menjadi acuan untuk langkah berikutnya.
              </p>
            </div>
          </aside>
        )}

        {/* Workspace Main Area - Expands when sidebar is collapsed */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className={cn("mx-auto space-y-6 transition-all duration-200", isSidebarCollapsed ? "max-w-6xl" : "max-w-4xl")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 2. Compact Step Header: Step Number, Title, One-Sentence Goal, Status, and Campaign Summary Button */}
                <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40", currentStepInfo.bg)}>
                        <CurrentIcon className={cn("w-5 h-5", currentStepInfo.color)} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            Langkah {activeStep} dari 10
                          </span>
                          <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider", currentStepStatus.color)}>
                            {currentStepStatus.label}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-heading font-black tracking-tight text-foreground truncate">
                          {currentStepInfo.title}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSummaryDrawer(true)}
                        className="h-8 text-xs font-bold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Ringkasan Campaign</span>
                      </Button>
                    </div>
                  </div>

                  {/* One-Sentence Clear Purpose */}
                  <div className="pt-2.5 border-t border-border/60 text-xs">
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      <strong className="text-foreground font-bold">Tujuan:</strong> {currentStepInfo.purpose}
                    </p>
                  </div>
                </div>

                {/* 3. Render Actual Step Component */}
                <div className="bg-background rounded-2xl">
                  {renderContent()}
                </div>

                {/* 4. Unified Bottom Navigation (Kembali & Lanjut) - Sticky on Mobile */}
                <div className="sticky bottom-0 z-20 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t border-border/80 shadow-lg md:relative md:z-auto md:mx-0 md:mb-0 md:p-0 md:bg-transparent md:backdrop-blur-none md:border-t md:border-border/70 md:shadow-none md:pt-6">
                  <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
                    <Button 
                      variant="outline" 
                      disabled={activeStep === 1}
                      onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                      className="rounded-xl font-bold gap-1.5 text-xs h-9 cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </Button>
                    
                    {activeStep < (project?.currentStep || 1) && activeStep < 10 ? (
                      <Button 
                        onClick={() => setActiveStep(prev => Math.min(10, prev + 1))}
                        className="rounded-xl bg-primary text-white hover:bg-primary/95 font-bold gap-1.5 px-4 sm:px-5 text-xs h-9 shadow-sm cursor-pointer truncate"
                      >
                        <span>Lanjut ke Step {activeStep + 1}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium text-right truncate">
                        {activeStep === 10 ? "Langkah Terakhir" : "Simpan / Setujui data di atas untuk lanjut"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* 5. Campaign Summary Slide-Over Drawer */}
      {showSummaryDrawer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm h-full bg-card shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <CampaignSummaryPanel
              project={project}
              activeStep={activeStep}
              onNavigateStep={(s) => {
                setActiveStep(s);
                setShowSummaryDrawer(false);
              }}
              onCloseMobile={() => setShowSummaryDrawer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
