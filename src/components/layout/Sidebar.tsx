import React from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Zap, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { useProject } from "@/contexts/ProjectContext";
import { WORKFLOW_STEPS, getStepStatus } from "@/lib/workflowSteps";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { config } = useBranding();
  const { activeProjectId, activeProject } = useProject();

  const [isDevActive, setIsDevActive] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("alco_developer_mode_active") === "true";
    }
    return false;
  });

  const [showContentEngineModal, setShowContentEngineModal] = React.useState(false);

  React.useEffect(() => {
    const updateStates = () => {
      setIsDevActive(localStorage.getItem("alco_developer_mode_active") === "true");
    };
    
    window.addEventListener("alco_developer_auth_changed", updateStates);
    window.addEventListener("storage", updateStates);

    return () => {
      window.removeEventListener("alco_developer_auth_changed", updateStates);
      window.removeEventListener("storage", updateStates);
    };
  }, []);

  // Determine active step from route
  const isWorkflowRoute = location.pathname.startsWith("/wizard");
  let activeStepNumber = 0;
  if (isWorkflowRoute) {
    const stepParam = searchParams.get("step");
    const modeParam = searchParams.get("mode");
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        activeStepNumber = parsed;
      }
    } else if (modeParam === "ads") {
      activeStepNumber = 10;
    } else if (modeParam === "brand") {
      activeStepNumber = 9;
    } else {
      activeStepNumber = 1;
    }
  }

  const handleStepClick = (stepId: number) => {
    if (activeProjectId && activeProjectId !== "undefined" && activeProjectId !== "null") {
      navigate(`/wizard/${activeProjectId}?step=${stepId}`);
      if (typeof window !== "undefined" && window.innerWidth < 1024 && isOpen) {
        onToggle();
      }
    } else {
      toast.info("Silakan pilih atau buat proyek terlebih dahulu untuk memulai workflow.", {
        description: "Buka salah satu proyek di Dashboard atau buat proyek baru."
      });
      if (location.pathname !== "/dashboard") {
        navigate("/dashboard");
      }
      if (typeof window !== "undefined" && window.innerWidth < 1024 && isOpen) {
        onToggle();
      }
    }
  };

  const handleContentEngineClick = () => {
    setShowContentEngineModal(true);
    if (typeof window !== "undefined" && window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay when Drawer is Open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer / Container */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-full shrink-0 z-50",
          "fixed inset-y-0 left-0 md:static",
          isOpen 
            ? "translate-x-0 w-64 p-4 shadow-2xl md:shadow-none" 
            : "-translate-x-full md:translate-x-0 md:w-16 md:p-2 overflow-hidden",
          className
        )}
      >
        {/* Header & Toggle */}
        <div className={cn(
          "flex items-center gap-2 mb-4 overflow-hidden shrink-0",
          isOpen ? "justify-between px-1" : "justify-center"
        )}>
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-xl shadow-md shadow-primary/20 shrink-0 overflow-hidden">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-[Montserrat] font-black text-lg leading-none">{config.appName.charAt(0)}</span>
              )}
            </div>
            
            {isOpen && (
              <div className="flex flex-col overflow-hidden min-w-0">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="font-heading font-black tracking-tight text-xs text-foreground leading-none truncate">
                    {config.appName}
                  </span>
                  {isDevActive && (
                    <span className="bg-emerald-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 shrink-0">DEV</span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.16em] truncate mt-0.5">
                  {config.companyName}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Button inside Sidebar Header */}
          <button
            onClick={onToggle}
            id="btn-sidebar-header-toggle"
            title={isOpen ? "Menciutkan Sidebar" : "Memperluas Sidebar"}
            aria-label={isOpen ? "Menciutkan sidebar" : "Memperluas sidebar"}
            className="p-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/50 shrink-0 flex items-center justify-center"
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4 text-primary" /> : <PanelLeftOpen className="w-4 h-4 text-primary" />}
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 scrollbar-thin">
          {/* Main Dashboard Navigation */}
          <div>
            <Link
              to="/dashboard"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024 && isOpen) {
                  onToggle();
                }
              }}
              id="sidebar-link-dashboard"
              title={!isOpen ? "Dashboard Utama" : undefined}
              aria-label="Dashboard Utama"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative",
                !isOpen && "justify-center px-0",
                location.pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <LayoutDashboard className={cn(
                "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                location.pathname === "/dashboard" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
              )} />
              {isOpen && (
                <span className="text-xs font-bold tracking-tight truncate">Dashboard Utama</span>
              )}
            </Link>
          </div>

          {/* WORKFLOW SECTION: Step 1 to 10 */}
          <div className="space-y-1">
            {isOpen ? (
              <div className="px-2 pt-1 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                  WORKFLOW
                </span>
                {activeProject?.name && (
                  <span className="text-[9px] font-medium text-primary/80 truncate max-w-[110px]" title={activeProject.name}>
                    {activeProject.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="h-px bg-border/60 my-2 mx-1" />
            )}

            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = isWorkflowRoute && activeStepNumber === step.id;
              const status = getStepStatus(step.id, activeProject);
              const isCompleted = status.label === "Selesai";
              const isDraft = status.label === "Draf";

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  id={`sidebar-step-${step.id}`}
                  title={!isOpen ? `${step.title} (${status.label})` : undefined}
                  aria-label={`${step.title} - ${status.label}`}
                  className={cn(
                    "w-full flex items-center transition-all duration-150 rounded-xl cursor-pointer text-left group relative",
                    isOpen ? "gap-2.5 px-2.5 py-1.5" : "justify-center p-2 my-0.5",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {/* Step Icon / Number Indicator */}
                  <div className={cn(
                    "w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 relative transition-transform group-hover:scale-105",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-secondary text-muted-foreground group-hover:text-foreground"
                  )}>
                    {isOpen ? (
                      <span>{step.id}</span>
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}

                    {/* Mini indicator dot in collapsed mode */}
                    {!isOpen && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-sidebar",
                        isCompleted
                          ? "bg-emerald-500"
                          : isDraft
                          ? "bg-amber-500"
                          : "bg-transparent"
                      )} />
                    )}
                  </div>

                  {/* Expanded Step Title and Status */}
                  {isOpen && (
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                      <span className={cn(
                        "text-xs truncate tracking-tight",
                        isActive ? "text-white font-bold" : "text-foreground/90 font-medium group-hover:text-foreground"
                      )}>
                        {step.shortTitle}
                      </span>

                      {/* Lightweight status indicator */}
                      {isActive ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 bg-white/20 text-white">
                          {status.label}
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Selesai</span>
                        </span>
                      ) : isDraft ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Draf</span>
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 text-muted-foreground/70 bg-secondary/80 border border-border/40">
                          Belum Diisi
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ALCO ECOSYSTEM SECTION */}
          <div className="space-y-1 pt-1">
            {isOpen ? (
              <div className="px-2 pt-1 pb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                  ALCO ECOSYSTEM
                </span>
              </div>
            ) : (
              <div className="h-px bg-border/60 my-2 mx-1" />
            )}

            <button
              onClick={handleContentEngineClick}
              id="sidebar-content-engine"
              title={!isOpen ? "Content Engine (Aplikasi Desktop)" : undefined}
              aria-label="Content Engine"
              className={cn(
                "w-full flex items-center transition-all duration-150 rounded-xl cursor-pointer text-left group relative",
                isOpen 
                  ? "gap-2.5 px-2.5 py-2 bg-secondary/60 hover:bg-secondary text-foreground border border-border/60" 
                  : "justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Zap className="w-4 h-4 text-primary fill-primary/15 shrink-0 group-hover:scale-110 transition-transform" />
              
              {isOpen && (
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                  <span className="text-xs font-bold tracking-tight text-foreground truncate">
                    Content Engine
                  </span>
                  <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-wider shrink-0">
                    Desktop App
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Footer Area: Dev Tools / App Settings */}
        <div className="pt-2 border-t border-sidebar-border/50 shrink-0 mt-auto">
          {isDevActive && (
            isOpen ? (
              <div className="flex flex-col gap-1 px-1 text-[10px] font-bold text-muted-foreground">
                <Link to="/rebrand" className="hover:text-primary transition-colors py-1 uppercase tracking-wider truncate">
                  Pengaturan Aplikasi
                </Link>
                <Link to="/developer" className="hover:text-primary transition-colors py-1 uppercase tracking-wider truncate">
                  Alat Lanjutan
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <Link to="/rebrand" title="Pengaturan Aplikasi" aria-label="Pengaturan Aplikasi" className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-xs">
                  🎨
                </Link>
                <Link to="/developer" title="Alat Lanjutan" aria-label="Alat Lanjutan" className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-xs">
                  ⚙️
                </Link>
              </div>
            )
          )}
        </div>
      </aside>

      {/* Content Engine Informational Modal */}
      {showContentEngineModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-5 h-5 fill-primary/15" />
              </div>
              <div>
                <h3 className="text-base font-heading font-black text-foreground">
                  ALCO Content Engine
                </h3>
                <p className="text-xs text-muted-foreground">
                  Aplikasi Desktop Terpisah (ALCO Ecosystem)
                </p>
              </div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 text-xs space-y-2 text-muted-foreground leading-relaxed">
              <p>
                <strong>ALCO Content Engine</strong> beroperasi sebagai aplikasi desktop terpisah di dalam ekosistem ALCO.
              </p>
              <p>
                Untuk mentransfer strategi dan konten dari ALCO Creative System, silakan unduh <strong>Blueprint Content Engine</strong> melalui Dashboard Proyek, lalu buka dan impor file tersebut di aplikasi Content Engine Anda.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-primary font-bold">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Kelola dan jalankan melalui ALCO Hub</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContentEngineModal(false)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowContentEngineModal(false);
                  navigate("/dashboard");
                }}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Buka Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
