import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { auth, onAuthStateChanged, User } from "@/lib/firebase";
import Dashboard from "@/pages/Dashboard";
import NicheResearch from "@/pages/NicheResearch";
import ProductBuilder from "@/pages/ProductBuilder";
import OfferGenerator from "@/pages/OfferGenerator";
import AdAngleGenerator from "@/pages/AdAngleGenerator";
import CopywritingAI from "@/pages/CopywritingAI";
import Sidebar from "@/components/layout/Sidebar";
import DeveloperPanel from "@/pages/DeveloperPanel";
import RebrandingPanel from "@/pages/RebrandingPanel";
import { Toaster } from "@/components/ui/sonner";
import { BrandingProvider, useBranding } from "@/contexts/BrandingContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import WorkflowWizard from "@/pages/WorkflowWizard";
import ApiAccess from "@/pages/ApiAccess";
import { Zap, Menu, ShieldCheck, ShieldAlert, Monitor } from "lucide-react";
import { promptApiKey } from "@/services/aiService";
import ApiKeyModal from "@/components/common/ApiKeyModal";
import LicenseActivationScreen from "@/components/license/LicenseActivationScreen";
import LicenseInfoModal from "@/components/license/LicenseInfoModal";
import { LicenseEvaluationResult } from "@/types/license";

function MainAppLayout({
  sidebarOpen,
  setSidebarOpen,
  toggleSidebar,
  config,
  hasApiKey,
  licenseState,
  onRefreshLicense,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  config: any;
  hasApiKey: boolean;
  licenseState: LicenseEvaluationResult | null;
  onRefreshLicense: () => void;
}) {
  const location = useLocation();
  const isWorkflowRoute = location.pathname.startsWith("/wizard");
  const [showLicenseModal, setShowLicenseModal] = React.useState(false);

  // Auto-close sidebar on mobile/tablet when route changes
  React.useEffect(() => {
    const isMobileOrTablet = typeof window !== "undefined" && window.innerWidth < 1024;

    if (isMobileOrTablet) {
      setSidebarOpen(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("alco_sidebar_open", "false");
      }
    }
  }, [location.pathname, setSidebarOpen]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-500 relative">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Main Top Header Bar with Hamburger Menu Button */}
        <header className="h-12 border-b border-border/60 bg-card/40 backdrop-blur-md px-3 md:px-4 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSidebar}
              id="btn-toggle-sidebar"
              title={sidebarOpen ? "Tutup / Sembunyikan Sidebar" : "Buka / Perluas Sidebar"}
              aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground hover:text-primary border border-border/70 transition-all cursor-pointer flex items-center justify-center shrink-0 group shadow-sm active:scale-95"
            >
              <Menu className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            </button>

            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-heading font-black text-xs md:text-sm text-foreground tracking-tight truncate">
                {config.appName}
              </span>
              <span className="text-[10px] text-muted-foreground/70 font-medium hidden sm:inline-block border-l border-border/60 pl-2">
                {config.companyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ALCO License Status Badge */}
            {licenseState ? (
              licenseState.status === "LICENSE_VALID" ? (
                <button
                  onClick={() => setShowLicenseModal(true)}
                  title="Lisensi ALCO Terverifikasi Resmi (Klik untuk detail)"
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ALCO License: {licenseState.payload?.plan?.toUpperCase()}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLicenseModal(true)}
                  title="Lisensi Tidak Valid / Belum Teraktivasi"
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-xl border border-rose-500/20 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer animate-pulse"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lisensi: {licenseState.status}</span>
                </button>
              )
            ) : (
              <span
                title="Aplikasi berjalan dalam mode Web Browser Preview. Penegakan Lisensi berlaku di Electron Desktop Build."
                className="text-[10px] font-semibold text-slate-500 bg-slate-500/10 px-2.5 py-1 rounded-xl border border-slate-500/20 flex items-center gap-1.5"
              >
                <Monitor className="w-3 h-3" />
                <span className="hidden md:inline">Browser Preview Mode</span>
              </span>
            )}

            {/* Subtle contextual AI status indicator */}
            {hasApiKey ? (
              <button
                onClick={() => { void promptApiKey(false).catch(() => undefined); }}
                title="Gemini AI Aktif (Klik untuk ubah API Key)"
                aria-label="Gemini AI aktif. Klik untuk ubah API Key"
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">AI Aktif</span>
              </button>
            ) : (
              <button
                onClick={() => { void promptApiKey(false).catch(() => undefined); }}
                title="Klik untuk mengaktifkan Gemini AI"
                aria-label="Aktifkan Gemini AI"
                className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/20 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="hidden sm:inline">AI Belum Diaktifkan</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/api-access" element={<ApiAccess />} />
            <Route path="/wizard/:projectId" element={<WorkflowWizard />} />
            <Route path="/developer" element={<DeveloperPanel />} />
            <Route path="/rebrand" element={<RebrandingPanel />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {licenseState && (
        <LicenseInfoModal
          isOpen={showLicenseModal}
          onClose={() => setShowLicenseModal(false)}
          licenseState={licenseState}
          onRefresh={onRefreshLicense}
        />
      )}
    </div>
  );
}

function AppContent() {
  const [user, setUser] = React.useState<User | null>(() => auth.currentUser);
  const [authLoading, setAuthLoading] = React.useState(false);
  const { config, loading: brandingLoading } = useBranding();
  const [hasApiKey, setHasApiKey] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("alco_gemini_api_key");
      return !!cached && cached.trim().length > 0;
    }
    return false;
  });

  // License state management for Electron desktop
  const [licenseState, setLicenseState] = React.useState<LicenseEvaluationResult | null>(null);
  const [licenseLoading, setLicenseLoading] = React.useState<boolean>(() => {
    return typeof window !== "undefined" && !!window.alcoLicense;
  });

  const checkLicenseStatus = React.useCallback(async () => {
    if (typeof window !== "undefined" && window.alcoLicense) {
      setLicenseLoading(true);
      try {
        const res = await window.alcoLicense.getStatus();
        setLicenseState(res);
      } catch (err) {
        console.error("Failed to check license status:", err);
        setLicenseState({
          status: "MALFORMED_LICENSE",
          deviceId: "",
          requestCode: "",
          error: "Gagal memverifikasi status lisensi lokal.",
        });
      } finally {
        setLicenseLoading(false);
      }
    } else {
      setLicenseLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void checkLicenseStatus();
  }, [checkLicenseStatus]);

  React.useEffect(() => {
    const handleAuthChange = (u: User | null) => {
      setUser(u || auth.currentUser);
      setAuthLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);

    const handleGlobalAuthChange = () => {
      handleAuthChange(auth.currentUser);
    };

    window.addEventListener("alco_auth_state_changed", handleGlobalAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener("alco_auth_state_changed", handleGlobalAuthChange);
    };
  }, []);

  // Sync API key status state
  React.useEffect(() => {
    const syncApiKeyStatus = () => {
      const cachedKey = localStorage.getItem("alco_gemini_api_key");
      setHasApiKey(!!cachedKey && cachedKey.trim().length > 0);
    };

    syncApiKeyStatus();

    window.addEventListener("alco_api_key_changed", syncApiKeyStatus);
    window.addEventListener("alco_api_key_missing", syncApiKeyStatus);
    window.addEventListener("storage", syncApiKeyStatus);

    return () => {
      window.removeEventListener("alco_api_key_changed", syncApiKeyStatus);
      window.removeEventListener("alco_api_key_missing", syncApiKeyStatus);
      window.removeEventListener("storage", syncApiKeyStatus);
    };
  }, [user]);

  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alco_sidebar_open");
      if (saved !== null) return saved === "true";
      return false;
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("alco_sidebar_open", String(next));
      return next;
    });
  };

  if (authLoading || brandingLoading || licenseLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground font-heading" id="loading-spinner">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-pulse mb-4 overflow-hidden">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt={config.appName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-2xl">{config.appName.charAt(0)}</span>
          )}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] animate-pulse">{config.loadingText}</p>
      </div>
    );
  }

  // ELECTRON DESKTOP LICENSE GATE
  // If running in Electron and license status is NOT LICENSE_VALID, block the main app UI and render LicenseActivationScreen
  if (licenseState && licenseState.status !== "LICENSE_VALID") {
    return (
      <LicenseActivationScreen
        licenseState={licenseState}
        onRefresh={() => { void checkLicenseStatus(); }}
      />
    );
  }

  return (
    <BrowserRouter>
      <MainAppLayout
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toggleSidebar={toggleSidebar}
        config={config}
        hasApiKey={hasApiKey}
        licenseState={licenseState}
        onRefreshLicense={() => { void checkLicenseStatus(); }}
      />
      <ApiKeyModal />
      <Toaster theme="system" closeButton richColors />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <BrandingProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </BrandingProvider>
  );
}
