import React from "react";
import { useBranding } from "@/contexts/BrandingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Monitor, 
  Save,
  Loader2,
  ArrowRight,
  Eye,
  SmilePlus,
  ArrowLeft,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function RebrandingPanel() {
  const { config, updateConfig } = useBranding();
  const [password, setPassword] = React.useState("");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  React.useEffect(() => {
    if (localStorage.getItem("alco_developer_mode_active") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.rebrandingPassword || password === config.developerPassword) {
      setIsAuthenticated(true);
      toast.success("Akses Pengaturan Berhasil Diberikan");
    } else {
      toast.error("Kata sandi pengaturan tidak tepat");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateConfig(localConfig);
      toast.success("Pengaturan aplikasi berhasil disimpan!");
    } catch (e) {
      toast.error("Gagal menyimpan perubahan pengaturan");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-white shadow-xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Palette className="w-10 h-10 text-primary" />
             </div>
             <h2 className="text-2xl font-heading font-black tracking-tight uppercase">Pengaturan Aplikasi</h2>
             <p className="text-muted-foreground text-xs font-medium mt-2">Masukkan kata sandi untuk mengubah tampilan & brand</p>
          </div>

          <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
             <CardContent className="p-8">
                <form onSubmit={handleAuth} className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kata Sandi Pengaturan</Label>
                      <Input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 bg-slate-50 border-border rounded-2xl text-center text-lg font-bold tracking-widest"
                        placeholder="••••"
                      />
                   </div>
                   <Button type="submit" className="w-full h-14 bg-primary text-white font-bold uppercase tracking-wider rounded-2xl gap-2">
                      Buka Pengaturan <ArrowRight className="w-4 h-4" />
                   </Button>
                </form>
             </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Pengaturan Aplikasi */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border p-6 px-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
               <Palette className="w-6 h-6 text-primary" />
            </div>
            <div>
               <h1 className="text-2xl font-heading font-black tracking-tight uppercase leading-none">Pengaturan Aplikasi</h1>
               <p className="text-xs font-bold text-primary mt-1">Pusat Kelola Identitas Brand & Tampilan Visual</p>
            </div>
         </div>

         <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="h-12 px-6 rounded-2xl border-border font-bold uppercase tracking-wider text-xs gap-2"
            >
               <ArrowLeft className="w-4 h-4" /> Ke Dashboard
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="h-12 px-8 rounded-2xl bg-primary text-white font-bold uppercase tracking-wider text-xs gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
            </Button>
         </div>
      </header>

      <div className="p-6 md:p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Form Pengaturan */}
         <div className="space-y-8 pb-20">
            {/* 1. Nama Aplikasi & Brand */}
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
               <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <Monitor className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">1. Nama Aplikasi & Brand</h3>
               </div>
               <div className="grid grid-cols-1 gap-4 pt-1">
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Aplikasi Sistem (Title)</Label>
                     <Input 
                        value={localConfig.appName}
                        onChange={(e) => setLocalConfig({...localConfig, appName: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-bold"
                        placeholder="Contoh: Alco Creative"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Tool Utama</Label>
                     <Input 
                        value={localConfig.toolName}
                        onChange={(e) => setLocalConfig({...localConfig, toolName: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-bold"
                        placeholder="Contoh: Ads AI Builder"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Brand Utama</Label>
                     <Input 
                        value={localConfig.brandName}
                        onChange={(e) => setLocalConfig({...localConfig, brandName: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-bold"
                        placeholder="Contoh: Alco"
                     />
                  </div>
               </div>
            </section>

            {/* 2. Logo & Favicon */}
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
               <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">2. Logo & Favicon</h3>
               </div>
               <div className="grid grid-cols-1 gap-4 pt-1">
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL Logo Utama (PNG / SVG)</Label>
                     <Input 
                        value={localConfig.logoUrl}
                        onChange={(e) => setLocalConfig({...localConfig, logoUrl: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-mono text-xs"
                        placeholder="https://domain-anda.com/logo.png"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL Favicon (.ico / PNG)</Label>
                     <Input 
                        value={localConfig.faviconUrl}
                        onChange={(e) => setLocalConfig({...localConfig, faviconUrl: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-mono text-xs"
                        placeholder="https://domain-anda.com/favicon.ico"
                     />
                  </div>
               </div>
            </section>

            {/* 3. Warna Aplikasi */}
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
               <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">3. Warna Aplikasi</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {[
                    { id: "primaryColor", label: "Warna Utama", defaultHex: "#000000" },
                    { id: "secondaryColor", label: "Warna Sekunder", defaultHex: "#ffffff" },
                    { id: "accentColor", label: "Warna Aksen", defaultHex: "#3b82f6" },
                    { id: "backgroundColor", label: "Warna Latar Belakang", defaultHex: "#f8fafc" },
                    { id: "foregroundColor", label: "Warna Teks Utama", defaultHex: "#0f172a" },
                  ].map((item) => (
                    <div key={item.id} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-border">
                       <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{item.label}</Label>
                       <div className="flex gap-3 items-center">
                          <input 
                             type="color"
                             value={(localConfig[item.id as keyof typeof localConfig] as string) || item.defaultHex}
                             onChange={(e) => setLocalConfig({...localConfig, [item.id]: e.target.value})}
                             className="w-12 h-12 p-1 bg-white border border-border rounded-xl cursor-pointer shrink-0"
                          />
                          <Input 
                             value={(localConfig[item.id as keyof typeof localConfig] as string) || ""}
                             onChange={(e) => setLocalConfig({...localConfig, [item.id]: e.target.value})}
                             className="h-12 bg-white border-border font-mono text-sm uppercase font-bold"
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* 4. Font & Tipografi */}
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
               <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">4. Font & Tipografi</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2 text-center p-5 bg-slate-50 rounded-2xl border border-border">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Font Judul (Headings)</Label>
                     <Input 
                        value={localConfig.primaryFont}
                        onChange={(e) => setLocalConfig({...localConfig, primaryFont: e.target.value})}
                        className="h-11 bg-white border-border text-center font-bold"
                        placeholder="Contoh: Montserrat"
                     />
                     <p className="text-3xl mt-3 font-black tracking-tighter" style={{ fontFamily: localConfig.primaryFont }}>Aa Bb Cc</p>
                  </div>
                  <div className="space-y-2 text-center p-5 bg-slate-50 rounded-2xl border border-border">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Font Isi (Body/Sans)</Label>
                     <Input 
                        value={localConfig.supportingFont}
                        onChange={(e) => setLocalConfig({...localConfig, supportingFont: e.target.value})}
                        className="h-11 bg-white border-border text-center font-bold"
                        placeholder="Contoh: Inter"
                     />
                     <p className="text-3xl mt-3 font-black tracking-tighter" style={{ fontFamily: localConfig.supportingFont }}>Aa Bb Cc</p>
                  </div>
               </div>
            </section>

            {/* 5. Tagline & Footer */}
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
               <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <SmilePlus className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">5. Tagline & Footer</h3>
               </div>
               <div className="grid grid-cols-1 gap-4 pt-1">
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tagline / Slogan</Label>
                     <Input 
                        value={localConfig.tagline}
                        onChange={(e) => setLocalConfig({...localConfig, tagline: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-medium"
                        placeholder="Contoh: Build Faster. Scale Smarter."
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teks Footer / Copyright</Label>
                     <Input 
                        value={localConfig.footerText}
                        onChange={(e) => setLocalConfig({...localConfig, footerText: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-medium"
                        placeholder="Contoh: Powered by Alco Systems"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Perusahaan / PT</Label>
                     <Input 
                        value={localConfig.companyName}
                        onChange={(e) => setLocalConfig({...localConfig, companyName: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-medium"
                        placeholder="Contoh: Alco Systems"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teks Subtitle Dashboard</Label>
                     <Input 
                        value={localConfig.dashboardText}
                        onChange={(e) => setLocalConfig({...localConfig, dashboardText: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-medium"
                        placeholder="Contoh: Create High-Converting Ads with AI"
                     />
                  </div>
               </div>
            </section>

            {/* 6. Kontak Bantuan */}
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-border shadow-sm">
               <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">6. Kontak Bantuan & Karakter Brand</h3>
               </div>
               <div className="grid grid-cols-1 gap-4 pt-1">
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kontak / Email Dukungan</Label>
                     <Input 
                        value={localConfig.supportContact}
                        onChange={(e) => setLocalConfig({...localConfig, supportContact: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-medium"
                        placeholder="support@alco.com"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gaya Karakter Brand (Brand Voice)</Label>
                     <Input 
                        value={localConfig.brandVoice}
                        onChange={(e) => setLocalConfig({...localConfig, brandVoice: e.target.value})}
                        className="h-12 bg-slate-50 rounded-xl border-border font-bold"
                        placeholder="Contoh: Professional, Bold, and Innovative"
                     />
                  </div>
               </div>
            </section>

            <div className="pt-2">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-wider text-sm gap-3 shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
              </Button>
            </div>
         </div>

         {/* Live Preview Column */}
         <div className="hidden lg:block relative font-sans">
            <div className="sticky top-28 space-y-4">
               <div className="flex items-center justify-between">
                 <p className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Preview Tampilan Aplikasi Real-Time
                 </p>
                 <span className="text-[10px] bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">Prinjau Langsung</span>
               </div>
               
               <Card className="w-full aspect-[4/3] bg-white rounded-[2.5rem] shadow-2xl border border-border overflow-hidden flex flex-col origin-top shadow-primary/5 transition-all duration-300" style={{ fontFamily: localConfig.supportingFont }}>
                  <header className="h-16 border-b border-border bg-white px-6 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden shadow-md shadow-primary/20" style={{ backgroundColor: localConfig.primaryColor }}>
                           {localConfig.logoUrl ? (
                             <img src={localConfig.logoUrl} className="w-full h-full object-cover text-[0px]" alt="" />
                           ) : (
                             <span className="text-white font-black text-xs">{(localConfig.brandName || "A").charAt(0)}</span>
                           )}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-black uppercase tracking-tight leading-none" style={{ color: localConfig.primaryColor }}>{localConfig.toolName || localConfig.appName}</span>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{localConfig.brandName}</p>
                        </div>
                     </div>
                     <div className="flex gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-200" />
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-200" />
                     </div>
                  </header>
                  <main className="flex-1 p-6 bg-slate-50/50 flex flex-col justify-center text-center">
                     <div className="max-w-md mx-auto space-y-5">
                        <div className="space-y-2">
                           <h4 className="text-2xl font-heading font-black tracking-tight leading-tight" style={{ color: localConfig.primaryColor, fontFamily: localConfig.primaryFont }}>
                              {localConfig.toolName || localConfig.appName}
                           </h4>
                           <p className="text-xs font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                              {localConfig.tagline || localConfig.dashboardText}
                           </p>
                        </div>
                        <div className="w-full h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20" style={{ backgroundColor: localConfig.primaryColor }}>
                           <span className="text-white text-xs font-bold uppercase tracking-wider">Mulai Proyek Iklan</span>
                        </div>
                     </div>
                  </main>
                  <footer className="p-4 border-t border-border bg-white text-center">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{localConfig.footerText}</p>
                     <p className="text-[8px] font-medium text-slate-300 uppercase tracking-widest mt-0.5">{localConfig.companyName}</p>
                  </footer>
               </Card>
            </div>
         </div>
      </div>
    </div>
  );
}
