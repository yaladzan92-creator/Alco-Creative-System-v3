import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Search, 
  ArrowUpRight, 
  Zap, 
  Plus, 
  ChevronRight, 
  Loader2, 
  FileDown, 
  FolderInput, 
  Trash2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Key,
  MoreHorizontal,
  Edit3,
  Copy,
  Sparkles,
  HelpCircle,
  FolderPlus,
  Layers,
  Archive,
  ArrowRight,
  Play
} from "lucide-react";
import { auth, db, collection, query, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useBranding } from "@/contexts/BrandingContext";
import { saveUserConfig, getUserConfig } from "../services/aiService";
import { normalizeProject } from "@/lib/projectSchema";
import { downloadEcosystemBlueprint } from "@/lib/ecosystemBlueprint";
import { downloadMetaAdsCampaignPack } from "@/lib/metaAdsCampaignPack";
import { downloadContentEngineBlueprint } from "@/lib/contentEngineBlueprint";

function getProjectProgressInfo(project: any) {
  const hasValue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number") return true; // 0 is valid
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") {
      return Object.keys(val).length > 0;
    }
    return !!val;
  };

  // Check completion per step
  const isStep1Done = hasValue(project?.nicheData?.selectedOption);
  
  const isStep2Done = hasValue(project?.audienceData?.selectedOption) || 
                      hasValue(project?.audienceData?.selectedPersona);
                      
  const isStep3Done = hasValue(project?.painPointData?.selectedOption);
  
  const isStep4Done = hasValue(project?.validationData?.selectedOption) || 
                      hasValue(project?.validationData?.score);
                      
  const isStep5Done = hasValue(project?.positioningData?.selectedOption) || 
                      hasValue(project?.positioningData?.selectedPromise);
                      
  const isStep6Done = hasValue(project?.offerData?.selectedOption) || 
                      hasValue(project?.offerData?.selectedOffer);
                      
  const isStep7Done = hasValue(project?.marketingAngles?.selectedOption) || 
                      hasValue(project?.marketingAngles?.selectedAngles);
                      
  const isStep8Done = hasValue(project?.copyDirection?.selectedOption) || 
                      hasValue(project?.copyDirection?.selectedCopy);
                      
  const isStep9Done = hasValue(project?.brandFoundationData);
  
  const isStep10Done = !!(
    project?.adsRecommendationsState || 
    project?.adsGeneratedAngles || 
    project?.adsContentData || 
    project?.adsInputState
  );

  const stratMilestones = [
    isStep1Done, isStep2Done, isStep3Done, isStep4Done,
    isStep5Done, isStep6Done, isStep7Done, isStep8Done
  ].filter(Boolean).length;

  const totalStepsCompleted = stratMilestones + (isStep9Done ? 1 : 0) + (isStep10Done ? 1 : 0);
  const completionPercentage = Math.min(100, Math.round((totalStepsCompleted / 10) * 100));

  const isStrategyDone = stratMilestones >= 8;
  const isBrandDone = isStep9Done;
  const isAdsReady = (isStrategyDone && isBrandDone) || (project?.currentStep || 1) >= 10;
  const hasAdsAssets = isStep10Done || (project?.currentStep || 1) >= 11;
  const isNew = totalStepsCompleted === 0 && (!project?.currentStep || project?.currentStep <= 1);

  let nextStepName = "Riset Niche";
  let nextStepRoute = `/wizard/${project.id}?step=1`;

  if (!isStep1Done) {
    nextStepName = "Riset Niche";
    nextStepRoute = `/wizard/${project.id}?step=1`;
  } else if (!isStep2Done) {
    nextStepName = "Target Audiens";
    nextStepRoute = `/wizard/${project.id}?step=2`;
  } else if (!isStep3Done) {
    nextStepName = "Masalah Audiens";
    nextStepRoute = `/wizard/${project.id}?step=3`;
  } else if (!isStep4Done) {
    nextStepName = "Validasi Ide";
    nextStepRoute = `/wizard/${project.id}?step=4`;
  } else if (!isStep5Done) {
    nextStepName = "Positioning Bisnis";
    nextStepRoute = `/wizard/${project.id}?step=5`;
  } else if (!isStep6Done) {
    nextStepName = "Paket Penawaran";
    nextStepRoute = `/wizard/${project.id}?step=6`;
  } else if (!isStep7Done) {
    nextStepName = "Sudut Iklan";
    nextStepRoute = `/wizard/${project.id}?step=7`;
  } else if (!isStep8Done) {
    nextStepName = "Copywriting";
    nextStepRoute = `/wizard/${project.id}?step=8`;
  } else if (!isStep9Done) {
    nextStepName = "Pondasi Brand";
    nextStepRoute = `/wizard/${project.id}?step=9`;
  } else {
    nextStepName = "Materi Iklan";
    nextStepRoute = `/wizard/${project.id}?mode=ads`;
  }

  let primaryButtonText = `Lanjutkan: ${nextStepName}`;
  let primaryButtonRoute = nextStepRoute;

  if (hasAdsAssets) {
    primaryButtonText = "Buka Hasil Iklan";
    primaryButtonRoute = `/wizard/${project.id}?mode=ads`;
  } else if (isNew) {
    primaryButtonText = "Mulai Menyusun Strategi";
    primaryButtonRoute = `/wizard/${project.id}`;
  }

  return {
    isNew,
    isStrategyDone,
    isBrandDone,
    isAdsReady,
    hasAdsAssets,
    stratMilestones,
    totalStepsCompleted,
    completionPercentage,
    nextStepName,
    primaryButtonText,
    primaryButtonRoute,
  };
}

export default function Dashboard() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { config } = useBranding();
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [isDevActive, setIsDevActive] = React.useState(localStorage.getItem("alco_developer_mode_active") === "true");
  
  // Collapsible beginner guide: collapsed by default
  const [isOnboardingCollapsed, setIsOnboardingCollapsed] = React.useState(() => {
    const saved = localStorage.getItem("isOnboardingCollapsed");
    return saved === null ? true : saved === "true";
  });
  
  const [localApiKey, setLocalApiKey] = React.useState<string>(() => localStorage.getItem("alco_gemini_api_key") || "");
  const [keyInput, setKeyInput] = React.useState("");
  const [showActivationPanel, setShowActivationPanel] = React.useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [bulkDeleteStep, setBulkDeleteStep] = React.useState<0 | 1 | 2>(0);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [contentWizardOpen, setContentWizardOpen] = React.useState(false);
  const [contentWizardProjectId, setContentWizardProjectId] = React.useState<string>("");

  // Context Menu State (3 Dots Menu)
  const [activeMenuProjectId, setActiveMenuProjectId] = React.useState<string | null>(null);

  // Close context menu on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".project-actions-menu")) {
        setActiveMenuProjectId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
    setBulkDeleteStep(0);
  };

  const handleImportProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (!jsonContent) {
          throw new Error("Format berkas kosong atau tidak valid.");
        }

        const projectsToImport = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
        if (projectsToImport.length === 0) {
          throw new Error("Tidak ada proyek yang ditemukan di berkas.");
        }

        let importCount = 0;
        for (const item of projectsToImport) {
          if (!item || typeof item !== "object") continue;

          const normalized = normalizeProject(item);
          const projectName = normalized.name || item.name || "Proyek Impor";
          const currentStep = normalized.currentStep || item.currentStep || 1;

          const newProject: any = {
             ...normalized,
             userId: user?.uid || "mock-userId",
             name: projectName,
             currentStep: currentStep,
             createdAt: serverTimestamp(),
             updatedAt: serverTimestamp(),
          };

          delete newProject.id;
          await addDoc(collection(db, "projects"), newProject);
          importCount++;
        }

        toast.success(`Berhasil mengimpor ${importCount} proyek!`);
        setSelectedProjectIds([]);
        fetchProjects();
      } catch (err: any) {
        toast.error("Format data file salah! Gagal mengimpor proyek.", {
          description: err.message || "Pastikan mengunggah file JSON progress yang valid."
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadBlueprint = (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuProjectId(null);
    try {
      const success = downloadEcosystemBlueprint(project);
      if (success) {
        toast.success(`Blueprint untuk "${project.name}" berhasil diunduh!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh Blueprint.");
    }
  };

  const handleDownloadContentEngineBlueprint = (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuProjectId(null);
    try {
      const success = downloadContentEngineBlueprint(project);
      if (success) {
        toast.success("Blueprint Content Engine berhasil diunduh. Upload file ini di ALCO Content Engine.");
      } else {
        toast.error("Gagal mengunduh Blueprint Content Engine.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh Blueprint Content Engine.");
    }
  };

  const handleExportProject = (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuProjectId(null);
    try {
      const exportData = { ...project };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, "_")}_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Backup proyek "${project.name}" berhasil diunduh!`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat backup proyek.");
    }
  };

  const buildContentEnginePayload = (project: any) => {
    const bi = project.brandIntelligence || {};
    const brandIdentity = bi.brandIdentity || {};
    const audience = bi.audience || {};
    const positioning = bi.positioning || {};
    const offers = Array.isArray(bi.offers) ? bi.offers : [];
    const messaging = bi.messaging || {};
    const contentStrategy = bi.contentStrategy || {};

    return {
      nicheData: {
        brandName: brandIdentity.brandName || project.brandFoundationData?.brandName || project.name || "Brand Baru",
        niche: brandIdentity.niche || project.nicheData?.selectedOption?.name || "Niche Bisnis",
        mission: brandIdentity.mission || positioning.corePromise || project.positioningData?.selectedPositioning?.statement || "Membantu audiens mendapatkan hasil terbaik.",
      },
      audienceData: {
        segments: [
          audience.primaryAudience,
          audience.secondaryAudience,
          project.audienceData?.selectedSegment?.name,
        ].filter(Boolean),
        painPoints: audience.painPoints || project.painPointData?.selectedPainPoints || [],
        desires: audience.desires || audience.emotionalTriggers || contentStrategy.contentAngles || [],
      },
      positioningData: {
        corePromise: positioning.corePromise || project.positioningData?.selectedPositioning?.statement || "Solusi yang jelas dan relevan untuk audiens.",
        tagline: positioning.tagline || brandIdentity.tagline || project.brandFoundationData?.tagline || "Solusi Praktis",
        differentiation: positioning.differentiation || brandIdentity.brandValues || [],
      },
      offerData: {
        name: offers[0]?.name || project.offerData?.selectedOffer?.name || "Penawaran Utama",
        benefits: offers[0]?.benefits || project.offerData?.selectedOffer?.benefits || [],
        price: offers[0]?.price || project.offerData?.selectedOffer?.price || "Hubungi Kami",
        ctaText: offers[0]?.ctaText || messaging.primaryCta || "Mulai Sekarang",
      },
      copyDirection: {
        voice: messaging.toneOfVoice?.style || project.copyDirection?.voice || "Edukasi bersahabat",
        tone: messaging.toneOfVoice?.tone || project.copyDirection?.tone || "Empatik dan jelas",
        doRules: messaging.copyGuidelines || project.copyDirection?.doRules || [],
        dontRules: messaging.avoidRules || project.copyDirection?.dontRules || [],
      },
    };
  };

  const encodeHandoffPayload = (payload: any) => {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const openContentEngine = (project: any) => {
    try {
      const payload = buildContentEnginePayload(project);
      const handoff = encodeHandoffPayload(payload);
      const metaObj: any = import.meta;
      const baseUrl =
        localStorage.getItem("alco_content_engine_url") ||
        metaObj.env?.VITE_ALCO_CONTENT_ENGINE_URL ||
        "https://ai.studio/apps/b61328f3-5e01-4ba3-bc60-9c93a9475ba4";

      const separator = baseUrl.includes("?") ? "&" : "?";
      window.open(`${baseUrl}${separator}handoff=${encodeURIComponent(handoff)}&source=creative-system`, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuka Content Engine untuk proyek ini.");
    }
  };

  const openContentEngineWizard = (project?: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveMenuProjectId(null);
    const firstReadyProject = projects.find((item) => !!item.brandFoundationData || item.currentStep >= 10);
    setContentWizardProjectId(project?.id || firstReadyProject?.id || projects[0]?.id || "");
    setContentWizardOpen(true);
  };

  const selectedContentWizardProject = projects.find((project) => project.id === contentWizardProjectId);

  const handleExportSelectedProjects = () => {
    if (selectedProjectIds.length === 0) {
      toast.error("Silakan pilih minimal satu proyek untuk diekspor.");
      return;
    }

    try {
      const selectedProjectsList = projects.filter(p => selectedProjectIds.includes(p.id));
      const exportData = selectedProjectsList.length === 1 ? selectedProjectsList[0] : selectedProjectsList;
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      
      const filename = selectedProjectsList.length === 1 
         ? `${selectedProjectsList[0].name.toLowerCase().replace(/\s+/g, "_")}_progress.json`
         : `export_${selectedProjectsList.length}_proyek.json`;
         
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Berhasil mengekspor ${selectedProjectsList.length} proyek terpilih!`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor proyek terpilih.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjectIds.length === 0) return;

    if (bulkDeleteStep === 0) {
      setBulkDeleteStep(1);
      toast.info("Konfirmasi Penghapusan", {
        description: `Apakah Anda yakin ingin menghapus ${selectedProjectIds.length} proyek terpilih? Klik sekali lagi untuk konfirmasi.`
      });
      return;
    }

    if (bulkDeleteStep === 1) {
      setBulkDeleteStep(2);
      toast.warning("Peringatan Penghapusan!", {
        description: `Seluruh (${selectedProjectIds.length}) proyek terpilih akan dihapus permanen!`
      });
      return;
    }

    setBulkDeleting(true);
    try {
      let deletedCount = 0;
      for (const id of selectedProjectIds) {
        await deleteDoc(doc(db, "projects", id));
        deletedCount++;
      }
      toast.success(`${deletedCount} proyek berhasil dihapus.`);
      setSelectedProjectIds([]);
      setBulkDeleteStep(0);
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus beberapa proyek terpilih.");
      setBulkDeleteStep(0);
    } finally {
      setBulkDeleting(false);
    }
  };

  const fetchProjects = React.useCallback(async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "projects"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    fetchProjects();

    const checkAuth = () => {
      setIsDevActive(localStorage.getItem("alco_developer_mode_active") === "true");
      fetchProjects();
    };

    window.addEventListener("alco_developer_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("alco_developer_auth_changed", checkAuth);
    };
  }, [fetchProjects]);

  const handleEditProjectName = async (projectId: string, currentName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuProjectId(null);
    const newName = prompt("Masukkan nama proyek baru:", currentName);
    if (!newName || newName.trim() === "") return;
    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, { name: newName.trim() });
      toast.success("Nama proyek berhasil diperbarui!");
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengganti nama proyek");
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuProjectId(null);
    if (!confirm(`Apakah Anda yakin ingin menghapus proyek "${projectName}"?`)) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      toast.success("Proyek berhasil dihapus.");
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus proyek");
    }
  };

  // Remix Wizard States
  const [remixingProject, setRemixingProject] = React.useState<any | null>(null);
  const [wizardStep, setWizardStep] = React.useState(1);
  const [wizardName, setWizardName] = React.useState("");
  const [wizardApiKey, setWizardApiKey] = React.useState("");
  const [hasExistingKey, setHasExistingKey] = React.useState(false);

  const openRemixWizard = async (project: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveMenuProjectId(null);
    setRemixingProject(project);
    setWizardStep(1);
    setWizardName(`${project.name} (Salinan)`);
    setWizardApiKey("");
    setHasExistingKey(false);

    try {
      const configRes = await getUserConfig();
      if (configRes && configRes.hasApiKey) {
        setHasExistingKey(true);
        setWizardApiKey("••••••••••••••••••••••••••••••••");
      }
    } catch (err) {
      console.warn("Gagal memeriksa konfigurasi:", err);
    }
  };

  const executeRemixWorkflow = async () => {
    if (!remixingProject || !user) return;
    setCreating(true);
    try {
      if (wizardApiKey && wizardApiKey !== "••••••••••••••••••••••••••••••••") {
        await saveUserConfig({ geminiApiKey: wizardApiKey, isDemoMode: false });
      }

      const cloned = JSON.parse(JSON.stringify(remixingProject));
      cloned.name = wizardName || `${remixingProject.name} (Salinan)`;
      cloned.userId = user.uid;
      cloned.createdAt = new Date().toISOString();
      cloned.updatedAt = new Date().toISOString();
      delete cloned.id;

      await addDoc(collection(db, "projects"), cloned);
      toast.success("Proyek berhasil diduplikasi!");
      setRemixingProject(null);
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menduplikat proyek");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const name = `Proyek ${projects.length + 1}`;
      const docRef = await addDoc(collection(db, "projects"), {
        userId: user.uid,
        name: name,
        currentStep: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Proyek Baru Berhasil Dibuat");
      navigate(`/wizard/${docRef.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat proyek baru");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hidden File Input for JSON Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleImportProjectFile} 
      />

      {/* Main Header with Primary CTA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-5">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Asisten Strategi & Iklan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground leading-tight">
            Dashboard Proyek
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Kelola strategi produk digital dan produksi iklan Meta Ads Anda dengan terstruktur.
          </p>
        </div>

        {/* Primary CTA + Secondary Import */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Impor proyek dari file backup .JSON"
            className="h-10 px-3.5 bg-card hover:bg-secondary border-border/80 text-foreground rounded-xl font-bold flex items-center gap-1.5 text-xs cursor-pointer transition-all"
          >
            <FolderInput className="w-4 h-4 text-muted-foreground" />
            <span className="hidden md:inline">Impor Proyek</span>
          </Button>

          <Button 
            disabled={creating}
            onClick={handleCreateProject}
            id="btn-create-new-project-main"
            className="h-10 px-5 bg-primary text-white hover:bg-primary/95 rounded-xl font-black shadow-md shadow-primary/25 flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition-all active:scale-98"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            <span>Buat Proyek Baru</span>
          </Button>
        </div>
      </header>

      {/* Collapsible Beginner Guide ("Butuh panduan?") */}
      <div className="bg-card/70 border border-border/80 rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-heading font-black text-foreground">
                Panduan Cepat Pemula
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Buka jika Anda belum yakin harus lanjut ke bagian mana.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextVal = !isOnboardingCollapsed;
              setIsOnboardingCollapsed(nextVal);
              localStorage.setItem("isOnboardingCollapsed", String(nextVal));
            }}
            className="h-8 px-3 rounded-xl border border-border/70 hover:bg-secondary text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isOnboardingCollapsed ? "Butuh panduan?" : "Tutup panduan"}</span>
            {isOnboardingCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-primary" />
            )}
          </Button>
        </div>

        {/* Expanded Guide Content */}
        <AnimatePresence>
          {!isOnboardingCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-border/50">
                {/* Step 1 */}
                <div className="p-3.5 bg-secondary/30 border border-border/60 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-600 font-black text-[11px] flex items-center justify-center border border-blue-500/20 shrink-0">
                      1
                    </span>
                    <h3 className="text-xs font-bold text-foreground">Riset & Validasi Pasar</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tentukan niche spesifik, bedah masalah calon pembeli, dan uji potensi pasar.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 bg-secondary/30 border border-border/60 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-pink-500/10 text-pink-600 font-black text-[11px] flex items-center justify-center border border-pink-500/20 shrink-0">
                      2
                    </span>
                    <h3 className="text-xs font-bold text-foreground">Pondasi Brand & Penawaran</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Susun positioning produk, paket penawaran (offers), serta brand voice yang meyakinkan.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 bg-secondary/30 border border-border/60 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-[11px] flex items-center justify-center border border-emerald-500/20 shrink-0">
                      3
                    </span>
                    <h3 className="text-xs font-bold text-foreground">Produksi Iklan Meta Ads</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Generate naskah copywriting, video ads dengan karakter, format carousel, dan materi visual iklan.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Catalog Title & Bulk Action Bar */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-left">
            <h2 className="text-lg font-heading font-black tracking-tight text-foreground">
              Daftar Proyek Anda
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Lanjutkan progres atau buka materi iklan proyek yang sudah selesai.
            </p>
          </div>

          {/* Bulk Action Bar (When items selected) */}
          <AnimatePresence>
            {selectedProjectIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-xl shadow-md shrink-0 w-full sm:w-auto justify-between sm:justify-start"
              >
                <div className="flex items-center gap-1.5 text-left">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                    {selectedProjectIds.length} Proyek Dipilih
                  </span>
                </div>

                <div className="h-4 w-px bg-primary/20 mx-1 hidden sm:block" />

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportSelectedProjects}
                    className="h-7 px-2.5 rounded-lg border-primary/30 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/15 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <FileDown className="w-3 h-3" />
                    Ekspor
                  </Button>

                  {/* Bulk Delete Confirm */}
                  {bulkDeleteStep === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDelete}
                      className="h-7 px-2.5 rounded-lg border-rose-500/25 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 px-1 py-0.5 rounded-lg">
                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className={cn(
                          "h-6 px-2 rounded text-[9px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm",
                          bulkDeleteStep === 1 ? "bg-amber-600 hover:bg-amber-500" : "bg-red-600 hover:bg-red-500 animate-pulse"
                        )}
                      >
                        {bulkDeleting ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : bulkDeleteStep === 1 ? (
                          <span>Yakin Hapus?</span>
                        ) : (
                          <span>Benar-benar Yakin?</span>
                        )}
                      </button>
                      <button
                        onClick={() => setBulkDeleteStep(0)}
                        className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedProjectIds([])}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-1.5 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-secondary/30 rounded-2xl animate-pulse border border-border/50" />
            ))
          ) : projects.length > 0 ? (
            projects.map((project, idx) => {
              const progressInfo = getProjectProgressInfo(project);
              const isMenuOpen = activeMenuProjectId === project.id;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="relative group"
                >
                  <Card className={cn(
                    "bg-card border-border/90 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-visible text-left flex flex-col justify-between h-full relative",
                    selectedProjectIds.includes(project.id) 
                      ? "ring-2 ring-primary/40 bg-primary/[0.02]" 
                      : "hover:border-primary/40"
                  )}>
                    {/* Card Header: Checkbox + Name + Menu ⋯ */}
                    <CardHeader className="p-5 pb-3 space-y-3">
                      <div className="flex items-start justify-between gap-3 w-full min-w-0">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0 overflow-hidden">
                          {/* Multi-select checkbox */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProjectSelection(project.id);
                            }}
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5",
                              selectedProjectIds.includes(project.id) 
                                ? "bg-primary border-primary text-white scale-105 shadow-sm" 
                                : "border-muted-foreground/40 hover:border-primary bg-background"
                            )}
                          >
                            {selectedProjectIds.includes(project.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                            <h3 
                              onClick={() => navigate(progressInfo.primaryButtonRoute)}
                              className="font-heading font-black text-base text-foreground cursor-pointer hover:text-primary transition-colors leading-snug"
                              title={project.name}
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                                maxWidth: "100%",
                              }}
                            >
                              {project.name}
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                              {project.nicheData?.selectedOption?.name || "Strategi Produk Digital"}
                            </p>
                          </div>
                        </div>

                        {/* Top Right: Progress badge & Menu ⋯ */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                            progressInfo.completionPercentage >= 100
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : progressInfo.completionPercentage > 0
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-secondary text-muted-foreground border-border"
                          )}>
                            {progressInfo.completionPercentage}%
                          </span>

                          {/* Action Menu (⋯) Dropdown Container */}
                          <div className="relative project-actions-menu">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuProjectId(isMenuOpen ? null : project.id);
                              }}
                              className="w-8 h-8 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                              title="Tindakan lainnya"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isMenuOpen && (
                              <div 
                                className="absolute right-0 top-9 z-50 w-56 bg-card border border-border rounded-2xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleDownloadBlueprint(project, e)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Unduh Blueprint Ekosistem (.JSON)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuProjectId(null);
                                    downloadMetaAdsCampaignPack(project);
                                    toast.success("Campaign Pack (.JSON) berhasil diunduh untuk Meta Ads!");
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Export Campaign Pack</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleExportProject(project, e)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Backup Proyek (.json)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => openContentEngineWizard(project, e)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-500" />
                                  <span>Buka di Content Engine</span>
                                </button>

                                <div className="h-px bg-border/60 my-1" />

                                <button
                                  type="button"
                                  onClick={(e) => handleEditProjectName(project.id, project.name, e)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>Ganti Nama Proyek</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => openRemixWizard(project, e)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Duplikasi (Remix)</span>
                                </button>

                                <div className="h-px bg-border/60 my-1" />

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                                  className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Hapus Proyek</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar Line */}
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300 rounded-full" 
                            style={{ width: `${progressInfo.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    {/* Card Content & Action Buttons */}
                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Step Indicator Badges (Strategy, Brand, Ads) */}
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-secondary/30 rounded-xl border border-border/50 text-[10px]">
                        <div className="space-y-0.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Riset</span>
                          <span className={cn("font-bold text-[10px]", progressInfo.stratMilestones >= 8 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                            {progressInfo.stratMilestones}/8 {progressInfo.stratMilestones >= 8 && "✓"}
                          </span>
                        </div>

                        <div className="space-y-0.5 text-center border-x border-border/50">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Brand</span>
                          <span className={cn("font-bold text-[10px]", progressInfo.isBrandDone ? "text-pink-600 dark:text-pink-400" : "text-muted-foreground")}>
                            {progressInfo.isBrandDone ? "Siap ✓" : "Draf"}
                          </span>
                        </div>

                        <div className="space-y-0.5 text-center">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Konten Iklan</span>
                          <span className={cn("font-bold text-[10px]", progressInfo.hasAdsAssets ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                            {progressInfo.hasAdsAssets ? "Siap" : "Belum"}
                          </span>
                        </div>
                      </div>

                      {/* Action Area: Single Progress Button + Dedicated Ads Shortcut */}
                      <div className="space-y-2 pt-1 border-t border-border/50">
                        {/* 1. Single Primary Action Button according to progress */}
                        <Button
                          onClick={() => navigate(progressInfo.primaryButtonRoute)}
                          className={cn(
                            "w-full h-10 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98",
                            progressInfo.hasAdsAssets
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                              : progressInfo.isNew
                              ? "bg-primary hover:bg-primary/95 text-white shadow-primary/20"
                              : "bg-primary hover:bg-primary/95 text-white shadow-primary/20"
                          )}
                        >
                          {progressInfo.hasAdsAssets ? (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{progressInfo.primaryButtonText}</span>
                            </>
                          ) : progressInfo.isNew ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>{progressInfo.primaryButtonText}</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-4 h-4" />
                              <span>{progressInfo.primaryButtonText}</span>
                            </>
                          )}
                        </Button>

                        {/* 2. Dedicated Shortcut "Ads" Button */}
                        <div className="flex items-center gap-1.5">
                          {progressInfo.isAdsReady ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/wizard/${project.id}?mode=ads`)}
                              className="w-full h-8 text-[11px] font-extrabold uppercase tracking-wider rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title={progressInfo.hasAdsAssets ? "Buka kembali & buat ulang aset iklan (Regenerate Ads)" : "Langsung buka Step 10 Generator Iklan Meta"}
                            >
                              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500/20 shrink-0" />
                              <span className="hidden md:inline">{progressInfo.hasAdsAssets ? "Generate Ulang Iklan" : "Buat Konten Iklan"}</span>
                              <span className="md:hidden">{progressInfo.hasAdsAssets ? "Buat Ulang Iklan" : "Buka Generator Iklan"}</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Selesaikan strategi dulu untuk membuka generator iklan"
                              className="w-full h-8 text-[11px] font-bold uppercase tracking-wider rounded-xl border-border/50 text-muted-foreground/60 bg-secondary/40 cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <Zap className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                              <span className="hidden md:inline">Selesaikan Strategi Dulu</span>
                              <span className="md:hidden">Strategi Belum Siap</span>
                            </Button>
                          )}
                        </div>

                        {/* 3. Panel Lanjutan Content Engine (Hanya jika Strategi & Brand Selesai) */}
                        {progressInfo.isStrategyDone && progressInfo.isBrandDone && (
                          <div className="bg-sky-500/10 border border-sky-500/25 dark:bg-sky-950/30 dark:border-sky-500/30 rounded-xl p-3 space-y-2 text-left mt-2.5">
                            <div>
                              <h4 className="text-xs font-heading font-black text-foreground break-words [overflow-wrap:anywhere]">
                                Lanjutkan ke Produksi Konten
                              </h4>
                              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 break-words [overflow-wrap:anywhere]">
                                Unduh file strategi ini untuk diunggah ke ALCO Content Engine.
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full pt-1">
                              <Button
                                size="sm"
                                onClick={(e) => handleDownloadContentEngineBlueprint(project, e)}
                                className="w-full h-9 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all text-center min-w-0 break-words"
                              >
                                <FileDown className="w-4 h-4 shrink-0" />
                                <span className="min-w-0 break-words [overflow-wrap:anywhere]">Unduh Blueprint untuk Content Engine (.JSON)</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => openContentEngineWizard(project, e)}
                                className="w-full h-8 bg-transparent hover:bg-sky-500/10 border border-sky-500/40 text-sky-700 dark:text-sky-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all text-center min-w-0 break-words"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                                <span className="min-w-0 break-words [overflow-wrap:anywhere]">Kirim Otomatis ke Content Engine</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            /* Clean Empty State */
            <div className="col-span-full py-16 px-4 text-center space-y-4 bg-card/50 border border-dashed border-border rounded-3xl">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2 border border-primary/20">
                <FolderPlus className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-heading font-black text-foreground">Belum Ada Proyek</h3>
                <p className="text-muted-foreground text-xs font-medium max-w-sm mx-auto">
                  Mulai buat strategi produk digital dan materi iklan Meta Ads pertama Anda sekarang.
                </p>
              </div>
              <Button 
                onClick={handleCreateProject} 
                className="h-10 px-6 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/25 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
                Buat Proyek Baru
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-border/40 text-center pb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{config.footerText}</p>
        <p className="text-[9px] text-muted-foreground/50 mt-0.5">{config.companyName} &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Content Engine Wizard Dialog */}
      {contentWizardOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  <Zap className="w-3.5 h-3.5" />
                  Kirim ke Content Engine
                </span>
                <h2 className="mt-2 text-xl font-heading font-black text-foreground">
                  Pilih proyek untuk dikirim ke Content Engine
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Data strategi proyek terpilih akan otomatis dikirim tanpa perlu upload JSON manual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContentWizardOpen(false)}
                className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {projects.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground text-xs">
                  Belum ada proyek yang tersedia.
                </div>
              ) : (
                projects.map((proj) => {
                  const selected = proj.id === contentWizardProjectId;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setContentWizardProjectId(proj.id)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        selected
                          ? "border-sky-500/50 bg-sky-500/10 shadow-sm"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h4 className="text-sm font-bold text-foreground w-full max-w-full line-clamp-2 break-words [overflow-wrap:anywhere] leading-snug">
                            {proj.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {proj.nicheData?.selectedOption?.name || "Strategi Produk"}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0",
                          proj.brandFoundationData || proj.currentStep >= 10
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        )}>
                          {proj.brandFoundationData || proj.currentStep >= 10 ? "Siap" : "Draf"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-5 bg-secondary/20 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setContentWizardOpen(false)}
                className="h-10 px-4 rounded-xl font-bold text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                disabled={!selectedContentWizardProject}
                onClick={() => {
                  if (selectedContentWizardProject) {
                    openContentEngine(selectedContentWizardProject);
                    setContentWizardOpen(false);
                  }
                }}
                className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Content Engine</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Duplicate / Remix Modal */}
      {remixingProject && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-left relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase text-primary tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  Duplikasi Proyek
                </span>
                <h3 className="text-lg font-heading font-black text-foreground mt-2">
                  Salin Data Proyek
                </h3>
              </div>
              <button 
                onClick={() => setRemixingProject(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-foreground">Nama Proyek Hasil Salinan</label>
              <input 
                type="text" 
                value={wizardName}
                onChange={(e) => setWizardName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                placeholder="Masukkan nama salinan proyek..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => setRemixingProject(null)}
                className="rounded-xl h-9 px-4 text-xs font-bold border-border cursor-pointer"
              >
                Batal
              </Button>
              <Button 
                onClick={executeRemixWorkflow}
                disabled={creating || !wizardName.trim()}
                className="rounded-xl h-9 px-5 bg-primary text-white hover:bg-primary/95 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Duplikat Sekarang</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
