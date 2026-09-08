import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Key, ExternalLink, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { saveUserConfig, setApiKeyModalResolver } from "@/services/aiService";

export default function ApiKeyModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isInvalidState, setIsInvalidState] = React.useState(false);

  // Store promise handlers for the pending AI action
  const resolverRef = React.useRef<{
    resolve: (key: string) => void;
    reject: (err: any) => void;
  } | null>(null);

  React.useEffect(() => {
    // Register resolver with aiService
    const unregister = setApiKeyModalResolver({
      open: (resolve, reject, isInvalid) => {
        resolverRef.current = { resolve, reject };
        setIsInvalidState(!!isInvalid);
        setKeyInput("");
        setShowKey(false);
        setIsOpen(true);
      },
      close: () => {
        setIsOpen(false);
      }
    });

    // Also listen to custom event as backup
    const handleCustomEvent = (e: any) => {
      const { resolve, reject, isInvalid } = e.detail || {};
      resolverRef.current = { resolve, reject };
      setIsInvalidState(!!isInvalid);
      setKeyInput("");
      setShowKey(false);
      setIsOpen(true);
    };

    window.addEventListener("alco_open_api_key_modal", handleCustomEvent);

    return () => {
      unregister();
      window.removeEventListener("alco_open_api_key_modal", handleCustomEvent);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current.reject(new Error("API_ACTIVATION_CANCELLED"));
      resolverRef.current = null;
    }
  };

  const handleSaveAndExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      toast.error("Kolom API Key tidak boleh kosong!");
      return;
    }

    setIsVerifying(true);
    try {
      // Test key connectivity via backend AI proxy
      const testRes = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-API-Key": trimmed,
          "Authorization": "Bearer local-mock-token",
        },
        body: JSON.stringify({
          prompt: "Verify key connectivity. Respond with JSON: {\"status\": \"ok\"}",
          systemInstruction: "Respond with valid JSON.",
        }),
      });

      if (!testRes.ok) {
        const errBody = await testRes.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || "Kunci API tidak valid atau kuota habis.");
      }

      // 1. Save to localStorage
      localStorage.setItem("alco_gemini_api_key", trimmed);

      // 2. Persist to user settings
      await saveUserConfig({ geminiApiKey: trimmed, isDemoMode: false });

      // 3. Dispatch change event for UI sync
      window.dispatchEvent(new Event("alco_api_key_changed"));

      toast.success("API Key Berhasil Diaktifkan!", {
        description: "Melanjutkan otomatis aksi AI yang Anda pilih...",
      });

      setIsOpen(false);

      // Resolve pending AI action so it seamlessly continues!
      if (resolverRef.current) {
        resolverRef.current.resolve(trimmed);
        resolverRef.current = null;
      }
    } catch (err: any) {
      console.error("[ApiKeyModal] Verification error:", err);
      toast.error("Verifikasi API Key Gagal", {
        description: err.message || "Pastikan Gemini API Key aktif dan memiliki kuota yang cukup.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6 sm:p-7 rounded-3xl text-left">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-heading font-black text-lg tracking-tight text-foreground">
                Aktivasi Gemini AI
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Fitur AI membutuhkan Gemini API Key Anda untuk memproses permintaan ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isInvalidState && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-2xl flex items-start gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Kunci API sebelumnya tidak valid atau kuota habis. Silakan masukkan kunci API aktif yang baru.</span>
          </div>
        )}

        <div className="space-y-4 pt-1">
          {/* 3 Step Tutorial */}
          <div className="bg-secondary/40 border border-border/80 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-[10px] uppercase tracking-wider text-primary">
                Cara Mendapatkan API Key Gratis
              </span>
              <button
                type="button"
                onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank", "noopener,noreferrer")}
                className="text-primary hover:underline text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Buka Google AI Studio, klik <strong>"Create API key"</strong>, lalu salin kodenya ke kolom di bawah.
            </p>
          </div>

          <form onSubmit={handleSaveAndExecute} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground block">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Tempelkan API Key Anda di sini..."
                  autoFocus
                  className="w-full bg-secondary/60 hover:bg-secondary/80 border border-border rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground tracking-wider placeholder:tracking-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isVerifying}
                className="h-10 px-4 text-xs font-bold rounded-xl border-border hover:bg-secondary cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isVerifying || !keyInput.trim()}
                className="h-10 px-5 text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/95 text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    Hubungkan & Lanjutkan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
