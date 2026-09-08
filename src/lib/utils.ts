import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("navigator.clipboard failed, trying fallback:", err);
  }

  // Fallback using textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
}

export function handleAIError(error: any, fallbackMessage: string = "Generation failed") {
  console.error("AI Error:", error);
  const message = error.message || "";
  
  if (message.includes("QUOTA_EXCEEDED")) {
    toast.error("AI Quota Limit Reached", {
      description: "Gagal: Kuota harian Gemini API gratis telah habis (20 request/hari). Silakan tunggu beberapa jam atau coba lagi besok.",
      duration: 10000,
      id: "quota-error" // Prevent duplicate toasts
    });
    return;
  }
  
  if (message.includes("503") || message.includes("Overloaded") || message.includes("high demand")) {
    toast.error("AI Server Busy", {
      description: "Server Google sedang mengalami beban tinggi. Mencoba lagi secara otomatis di latar belakang mungkin diperlukan.",
    });
    return;
  }

  toast.error(fallbackMessage, {
    description: message.replace("QUOTA_EXCEEDED: ", ""),
    duration: 5000
  });
}
