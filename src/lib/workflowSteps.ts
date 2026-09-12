import { 
  Search, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Target, 
  Gift, 
  TrendingUp, 
  FileText, 
  Palette, 
  Zap,
  LucideIcon
} from "lucide-react";

export interface WorkflowStepDefinition {
  id: number;
  title: string;
  shortTitle: string;
  purpose: string;
  whyImportant: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  { 
    id: 1, 
    title: "1. Riset Niche & Produk", 
    shortTitle: "Riset Niche & Produk", 
    purpose: "Menentukan produk digital spesifik dan ceruk pasar sasaran berdaya beli tinggi.",
    whyImportant: "Memilih pasar potensial agar promosi tepat sasaran & berkonversi tinggi.",
    icon: Search, 
    color: "text-blue-500", 
    bg: "bg-blue-500/10" 
  },
  { 
    id: 2, 
    title: "2. Target Audiens & Persona", 
    shortTitle: "Target Audiens & Persona", 
    purpose: "Membedah profil, demografi, dan perilaku calon pembeli ideal.",
    whyImportant: "Memahami emosi calon pembeli agar pesan iklan terasa sangat personal.",
    icon: Users, 
    color: "text-purple-500", 
    bg: "bg-purple-500/10" 
  },
  { 
    id: 3, 
    title: "3. Masalah & Pain Point", 
    shortTitle: "Masalah & Pain Point", 
    purpose: "Memetakan masalah mendalam & pemicu emosional terkuat pembeli.",
    whyImportant: "Masalah mendalam adalah alasan utama orang membeli solusi Anda.",
    icon: AlertCircle, 
    color: "text-red-500", 
    bg: "bg-red-500/10" 
  },
  { 
    id: 4, 
    title: "4. Validasi Potensi Pasar", 
    shortTitle: "Validasi Potensi Pasar", 
    purpose: "Memvalidasi minat beli pasar sebelum mengeluarkan modal iklan.",
    whyImportant: "Memastikan calon pembeli siap bertransaksi sebelum promosi skala besar.",
    icon: CheckCircle2, 
    color: "text-emerald-500", 
    bg: "bg-emerald-500/10" 
  },
  { 
    id: 5, 
    title: "5. Positioning & Janji Utama", 
    shortTitle: "Positioning & Janji Utama", 
    purpose: "Merumuskan keunikan produk & janji nilai pembeda dari kompetitor.",
    whyImportant: "Tampil unik & menonjol dibanding produk lain di pasar.",
    icon: Target, 
    color: "text-amber-500", 
    bg: "bg-amber-500/10" 
  },
  { 
    id: 6, 
    title: "6. Paket Penawaran", 
    shortTitle: "Paket Penawaran", 
    purpose: "Menyusun promo penawaran & bonus bernilai tinggi yang menarik.",
    whyImportant: "Penawaran yang menggiurkan melipatgandakan tingkat konversi penjualan.",
    icon: Gift, 
    color: "text-pink-500", 
    bg: "bg-pink-500/10" 
  },
  { 
    id: 7, 
    title: "7. Sudut Pandang Iklan", 
    shortTitle: "Sudut Pandang Iklan", 
    purpose: "Merancang variasi pemicu psikologis daya pancing klik iklan Meta Ads.",
    whyImportant: "Angle iklan yang kuat menghemat budget & menaikkan rasio klik (CTR).",
    icon: TrendingUp, 
    color: "text-indigo-500", 
    bg: "bg-indigo-500/10" 
  },
  { 
    id: 8, 
    title: "8. Naskah Copywriting Ads", 
    shortTitle: "Naskah Copywriting Ads", 
    purpose: "Menghasilkan naskah iklan lengkap (Headline, Naskah Utama, dan Call to Action).",
    whyImportant: "Copywriting yang tepat mendorong pembeli untuk langsung bertindak.",
    icon: FileText, 
    color: "text-orange-500", 
    bg: "bg-orange-500/10" 
  },
  { 
    id: 9, 
    title: "9. Pondasi Brand & Visual", 
    shortTitle: "Pondasi Brand & Visual", 
    purpose: "Menetapkan identitas, tone suara, dan gaya komunikasi khas brand.",
    whyImportant: "Membangun kepercayaan dan kredibilitas jangka panjang bagi brand Anda.",
    icon: Palette, 
    color: "text-violet-500", 
    bg: "bg-violet-500/10" 
  },
  { 
    id: 10, 
    title: "10. Materi Iklan Meta Ads", 
    shortTitle: "Materi Iklan Meta Ads", 
    purpose: "Menghasilkan materi visual iklan, video ads dengan karakter, carousel, dan landing page.",
    whyImportant: "Seluruh materi promosi siap pakai untuk langsung dipasang di Meta Ads.",
    icon: Zap, 
    color: "text-cyan-500", 
    bg: "bg-cyan-500/10" 
  },
];

export type StepStatusType = "Selesai" | "Draf" | "Belum Diisi";

export interface StepStatus {
  label: StepStatusType;
  color: string;
}

export const getStepStatus = (stepId: number, proj: any): StepStatus => {
  if (!proj) return { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };

  switch (stepId) {
    case 1:
      return proj?.nicheData?.selectedOption 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.nicheData?.input?.interest 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 2:
      return (proj?.audienceData?.selectedPersona || proj?.audienceData?.selectedOption)
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
      return (proj?.validationData?.score !== undefined || proj?.validationData?.selectedOption)
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.validationData?.input?.price 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 5:
      return (proj?.positioningData?.selectedPromise || proj?.positioningData?.selectedOption)
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.positioningData?.input?.mainPromise 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 6:
      return (proj?.offerData?.selectedOffer || proj?.offerData?.selectedOption)
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.offerData?.input?.mainOffer 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 7:
      return (proj?.marketingAngles?.selectedAngles || proj?.marketingAngles?.selectedOption)
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.marketingAngles?.input?.primaryAngle 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 8:
      return (proj?.copyDirection?.selectedCopy || proj?.copyDirection?.selectedOption)
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : proj?.copyDirection?.input?.headline 
        ? { label: "Draf", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 9:
      return proj?.brandFoundationData 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    case 10:
      return (proj?.adsContentData || proj?.adsGeneratedAngles || proj?.adsRecommendationsState) 
        ? { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" }
        : { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
    default:
      return { label: "Belum Diisi", color: "bg-secondary text-muted-foreground border-border" };
  }
};
