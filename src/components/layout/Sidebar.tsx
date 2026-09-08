import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import React from "react";
import { 
  LayoutDashboard, 
  Zap,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { toast } from "sonner";

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ className, isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { config } = useBranding();
  const [isDevActive, setIsDevActive] = React.useState(localStorage.getItem("alco_developer_mode_active") === "true");

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

  const menuItems = [
    { icon: LayoutDashboard, label: "Pusat Dasbor", path: "/dashboard" },
  ];

  const handleExitDevMode = () => {
    localStorage.removeItem("alco_developer_mode_active");
    setIsDevActive(false);
    window.dispatchEvent(new Event("alco_developer_auth_changed"));
    toast.success("Mode Lanjutan Dinonaktifkan");
    window.location.href = "/dashboard";
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
            : "-translate-x-full md:translate-x-0 md:w-16 md:p-3 overflow-hidden",
          className
        )}
      >
        {/* Header & Toggle */}
        <div className={cn(
          "flex items-center gap-2 mb-8 overflow-hidden",
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
                  <span className="font-heading font-bold tracking-tight text-sm leading-none truncate">{config.appName}</span>
                  {isDevActive && (
                    <span className="bg-emerald-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 shrink-0">DEV</span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.18em] truncate">{config.companyName}</span>
              </div>
            )}
          </div>

          {/* Toggle Button inside Sidebar Header */}
          <button
            onClick={onToggle}
            id="btn-sidebar-header-toggle"
            title={isOpen ? "Menciutkan Sidebar" : "Memperluas Sidebar"}
            className="p-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/50 shrink-0 flex items-center justify-center"
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4 text-primary" /> : <PanelLeftOpen className="w-4 h-4 text-primary" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 space-y-1">
          {isOpen && (
            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
              Ekosistem
            </p>
          )}

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024 && isOpen) {
                    onToggle();
                  }
                }}
                id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  !isOpen && "justify-center px-0",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground/70 group-hover:text-primary"
                )} />
                {isOpen && (
                  <span className="text-xs font-bold tracking-tight truncate">{item.label}</span>
                )}
              </Link>
            );
          })}

          {/* External Content Engine Link */}
          {isOpen && (
            <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-5 mb-2.5">
              Mesin Konten
            </p>
          )}

          <button
            onClick={() => window.open("https://ai.studio/apps/b61328f3-5e01-4ba3-bc60-9c93a9475ba4", "_blank", "noopener,noreferrer")}
            title={!isOpen ? "ALCO Content Engine" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-200 group cursor-pointer shadow-sm w-full text-left",
              !isOpen && "justify-center px-0 mt-3"
            )}
          >
            <Zap className="w-4 h-4 text-primary fill-primary/15 shrink-0 group-hover:scale-110 transition-transform" />
            {isOpen && (
              <>
                <span className="text-xs font-extrabold font-heading flex-1 truncate">Content Engine</span>
                <Sparkles className="w-3.5 h-3.5 text-primary/80 shrink-0 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Footer Area */}
        <div className="pt-3 border-t border-sidebar-border/50 space-y-2 mt-auto">
          {isDevActive && (
            isOpen ? (
              <div className="flex flex-col gap-1.5 px-2 text-[10px] font-bold text-muted-foreground pt-2 border-t border-sidebar-border/30">
                <Link to="/rebrand" className="hover:text-primary transition-colors py-1 uppercase tracking-wider">
                  Pengaturan Aplikasi
                </Link>
                <Link to="/developer" className="hover:text-primary transition-colors py-1 uppercase tracking-wider">
                  Alat Lanjutan
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <Link to="/rebrand" title="Pengaturan Aplikasi" className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-xs">
                  🎨
                </Link>
                <Link to="/developer" title="Alat Lanjutan" className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-xs">
                  ⚙️
                </Link>
              </div>
            )
          )}
        </div>
      </aside>
    </>
  );
}
