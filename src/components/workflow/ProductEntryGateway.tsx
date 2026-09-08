import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PackageCheck, 
  Lightbulb, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Target, 
  DollarSign, 
  Tag, 
  ChevronLeft,
  Zap,
  HelpCircle,
  FileText,
  Video,
  LayoutTemplate,
  Users,
  User,
  Building,
  Award,
  RefreshCcw,
  Edit3,
  Layers,
  ShieldCheck,
  Eye,
  Flame,
  Gift
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateAIContent, safeParseJSON } from "@/services/aiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface InitialProductData {
  productStatus: "has_product" | "no_product";
  productName: string;
  productFormat: string;
  price: string;
  mainBenefit: string;
  targetMarket: string;
  productCategory?: "digital" | "non_digital";
  productTopic?: string;
  productIdeaReasoning?: string;
}

const DIGITAL_FORMAT_PRESETS = [
  "Ebook / Panduan PDF",
  "Kursus Online / Video Guide",
  "Template / Asset Pack (Canva/Notion/Design)",
  "Membership / Akses Komunitas",
  "Software / Mini Web Tool",
];

const NON_DIGITAL_FORMAT_PRESETS = [
  "Produk Fisik / Barang Retail",
  "Fashion & Aksesoris",
  "Skincare & Kosmetik",
  "Kuliner / Food & Beverage",
  "Jasa / Konsultasi / Agency Services",
  "Event / Workshop / Seminar On-site",
];

interface ProductEntryGatewayProps {
  project: any;
  onComplete: (data: {
    initialSetupCompleted: boolean;
    productStatus: "has_product" | "no_product";
    targetStep?: number;
    initialProductData: InitialProductData;
    sharedBusinessContext: any;
    nicheData?: any;
    audienceData?: any;
    painPointData?: any;
    validationData?: any;
    positioningData?: any;
    offerData?: any;
    marketingAngles?: any;
    copyDirection?: any;
    brandFoundationData?: any;
    adsInputState?: any;
    adsRecommendationsState?: any;
    adsGeneratedAngles?: any;
  }) => void;
  onSkip?: () => void;
}

const EBOOK_NICHE_PRESETS = [
  { label: "Bisnis & Marketing", query: "Cara Jualan Online & Marketing untuk Pemula" },
  { label: "Keuangan & Produktivitas", query: "Panduan Manajemen Keuangan Pribadi & Bebas Utang" },
  { label: "Kuliner & Resep Usaha", query: "Panduan Resep & Bisnis Kuliner Rumahan" },
  { label: "Kreatif & Desain Canva", query: "Panduan Desain Landing Page & Konten Canva" },
  { label: "Kesehatan & Diet", query: "Panduan Diet Sehat & Pola Hidup Bugar" },
  { label: "Karir & Freelance", query: "Panduan Dapat Klien Pertama dari Rumah" },
];

export default function ProductEntryGateway({ project, onComplete, onSkip }: ProductEntryGatewayProps) {
  // User profile state for onboarding on first project creation
  const [userProfile, setUserProfile] = React.useState<{ name: string; brandName: string } | null>(() => {
    const profileStr = localStorage.getItem("alco_user_profile");
    if (profileStr) {
      try {
        const parsed = JSON.parse(profileStr);
        if (parsed.name && parsed.brandName) {
          return parsed;
        }
      } catch (_) {}
    }
    return null;
  });

  const [gatewayUserName, setGatewayUserName] = React.useState(userProfile?.name || "");
  const [gatewayBrandName, setGatewayBrandName] = React.useState(userProfile?.brandName || "");

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayUserName.trim()) {
      toast.error("Silakan isi nama Anda.");
      return;
    }
    if (!gatewayBrandName.trim()) {
      toast.error("Silakan isi nama brand/bisnis Anda.");
      return;
    }

    const newProfile = {
      name: gatewayUserName.trim(),
      brandName: gatewayBrandName.trim()
    };

    localStorage.setItem("alco_user_profile", JSON.stringify(newProfile));
    setUserProfile(newProfile);
    if (!hasProductName) {
      setHasProductName(newProfile.brandName);
    }
    window.dispatchEvent(new Event("alco_auth_state_changed"));
    toast.success("Profil Pengguna & Brand berhasil disimpan!");
  };

  // Stage 0: Choice ("has_product" | "no_product" | null)
  const [productStatus, setProductStatus] = React.useState<"has_product" | "no_product" | null>(
    project?.productStatus || null
  );

  // --- SUB-FLOW HAS PRODUCT STATES ---
  const [productCategory, setProductCategory] = React.useState<"digital" | "non_digital">(
    (project?.initialProductData?.productCategory as "digital" | "non_digital") || "digital"
  );
  const [hasProductName, setHasProductName] = React.useState(
    project?.initialProductData?.productName || project?.name || ""
  );
  const [hasProductFormat, setHasProductFormat] = React.useState(
    project?.initialProductData?.productFormat || "Ebook / Panduan PDF"
  );
  const [customHasProductFormat, setCustomHasProductFormat] = React.useState("");
  const [hasProductPrice, setHasProductPrice] = React.useState(
    project?.initialProductData?.price || "Rp 99.000"
  );
  const [hasProductBenefit, setHasProductBenefit] = React.useState(
    project?.initialProductData?.mainBenefit || ""
  );
  const [hasProductAudience, setHasProductAudience] = React.useState(
    project?.initialProductData?.targetMarket || ""
  );
  const [isPolishingHasProduct, setIsPolishingHasProduct] = React.useState(false);

  const handleCategoryChange = (category: "digital" | "non_digital") => {
    setProductCategory(category);
    if (category === "digital") {
      setHasProductFormat("Ebook / Panduan PDF");
    } else {
      setHasProductFormat("Produk Fisik / Barang Retail");
    }
    setCustomHasProductFormat("");
  };

  // --- SUB-FLOW NO PRODUCT STATES (Express Ideation & Auto-Draft Flow) ---
  const [noProductNicheQuery, setNoProductNicheQuery] = React.useState("");
  const [preferredFormat, setPreferredFormat] = React.useState("Ebook PDF Guide (Prioritas Utama)");
  const [preferredPrice, setPreferredPrice] = React.useState("Rp 99.000");
  
  const [isGeneratingIdeas, setIsGeneratingIdeas] = React.useState(false);
  const [generatedIdeas, setGeneratedIdeas] = React.useState<Array<{
    title: string;
    topic: string;
    targetMarket: string;
    mainPromise: string;
    format: string;
    priceRange: string;
    reasoning: string;
  }>>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = React.useState<number | null>(null);

  // Customization mode for selected idea
  const [isEditingSelectedIdea, setIsEditingSelectedIdea] = React.useState(false);
  const [customTitle, setCustomTitle] = React.useState("");
  const [customTopic, setCustomTopic] = React.useState("");
  const [customTargetMarket, setCustomTargetMarket] = React.useState("");
  const [customMainPromise, setCustomMainPromise] = React.useState("");
  const [customPrice, setCustomPrice] = React.useState("");

  // Express Auto-Draft Pipeline States
  const [isGeneratingExpressDraft, setIsGeneratingExpressDraft] = React.useState(false);
  const [expressProgressText, setExpressProgressText] = React.useState("");
  const [expressDraftResult, setExpressDraftResult] = React.useState<any | null>(null);

  // Sync state if project already has data
  React.useEffect(() => {
    if (project?.initialProductData) {
      const data = project.initialProductData;
      if (data.productStatus) setProductStatus(data.productStatus);
      if (data.productName) setHasProductName(data.productName);
      if (data.productCategory) {
        setProductCategory(data.productCategory as "digital" | "non_digital");
      }
      if (data.productFormat) {
        const isKnownDigital = DIGITAL_FORMAT_PRESETS.includes(data.productFormat);
        const isKnownNonDigital = NON_DIGITAL_FORMAT_PRESETS.includes(data.productFormat);
        if (isKnownDigital) {
          setProductCategory("digital");
          setHasProductFormat(data.productFormat);
        } else if (isKnownNonDigital) {
          setProductCategory("non_digital");
          setHasProductFormat(data.productFormat);
        } else {
          setHasProductFormat("Lainnya");
          setCustomHasProductFormat(data.productFormat);
        }
      }
      if (data.price) setHasProductPrice(data.price);
      if (data.mainBenefit) setHasProductBenefit(data.mainBenefit);
      if (data.targetMarket) setHasProductAudience(data.targetMarket);
    }
  }, [project]);

  // Sync custom edit fields when selected idea changes
  React.useEffect(() => {
    if (selectedIdeaIndex !== null && generatedIdeas[selectedIdeaIndex]) {
      const idea = generatedIdeas[selectedIdeaIndex];
      setCustomTitle(idea.title);
      setCustomTopic(idea.topic);
      setCustomTargetMarket(idea.targetMarket);
      setCustomMainPromise(idea.mainPromise);
      setCustomPrice(idea.priceRange || preferredPrice);
    }
  }, [selectedIdeaIndex, generatedIdeas, preferredPrice]);

  // AI Generator for 3 Ebook Ideas (NO PRODUCT flow)
  const handleGenerateEbookIdeas = async (queryText?: string) => {
    const topic = queryText || noProductNicheQuery || "Bisnis Online & Marketing Pemula";
    setIsGeneratingIdeas(true);
    setGeneratedIdeas([]);
    setSelectedIdeaIndex(null);
    setExpressDraftResult(null);

    const systemPrompt = `Anda adalah konsultan bisnis produk digital & pakar penerbitan e-book terkemuka.
Tugas Anda adalah menghasilkan 3 ide produk digital yang SANGAT MUDAH & CEPAT DIBUAT oleh pemula digital marketer.
PRIORITAS UTAMA: FORMAT EBOOK / PDF GUIDE (atau mini template/cheat sheet).

Return JSON array of 3 objects strictly adhering to schema:
[
  {
    "title": "Nama/Judul Ebook Menarik & Berkonversi (Contoh: Ebook Panduan Kit 30 Hari Jualan Online)",
    "topic": "Topik Spesifik",
    "targetMarket": "Target Calon Pembeli Spesifik (Contoh: Ibu Rumah Tangga & Reseller Pemula)",
    "mainPromise": "Janji Hasil Utama / Transformasi Pembaca (Contoh: Mendapatkan 100 orderan pertama tanpa modal iklan besar)",
    "format": "Ebook PDF + Checksheet Bonus",
    "priceRange": "${preferredPrice}",
    "reasoning": "Mengapa ide ebook ini sangat cepat dibuat dan potensial diiklan Meta Ads"
  }
]`;

    const userPrompt = `Riset ide produk digital (fokus Ebook) untuk topik/bidang: "${topic}". Format yang disukai: "${preferredFormat}". Harga acuan: "${preferredPrice}".
Pastikan ide realistis, memecahkan masalah mendesak (pain point), dan mudah dibuat oleh pemula dalam 3-7 hari. Return ONLY JSON array.`;

    try {
      const rawRes = await generateAIContent(userPrompt, systemPrompt);
      const parsed = safeParseJSON(rawRes.text || rawRes, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedIdeas(parsed);
        setSelectedIdeaIndex(0); // Auto-select first idea
        toast.success("3 Ide Ebook Digital Berhasil Dibuat AI!");
      } else {
        toast.error("Format AI tidak sesuai, silakan coba lagi.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal menghasilkan ide produk AI.");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Polish HAS PRODUCT form with AI
  const handlePolishProductWithAI = async () => {
    if (!hasProductName) {
      toast.error("Isi Nama Produk terlebih dahulu untuk dirapikan AI.");
      return;
    }
    setIsPolishingHasProduct(true);
    const finalFormat = hasProductFormat === "Lainnya" ? (customHasProductFormat.trim() || "Produk Custom") : hasProductFormat;
    const systemPrompt = `Anda adalah copywriter & marketer produk senior (Digital & Non-Digital/Fisik/Jasa).
Rapikan dan optimalkan deskripsi produk berikut agar siap digunakan dalam campaign Meta Ads.
Respon HANYA JSON:
{
  "mainBenefit": "Deskripsi manfaat & transformasi utama yang jauh lebih jelas dan menggugah emosi",
  "targetMarket": "Target audiens/pembeli yang lebih terdefinisi dengan jelas",
  "recommendedPrice": "Rekomendasi harga yang paling pas"
}`;

    const userPrompt = `Nama Produk: ${hasProductName}
Kategori Tipe Produk: ${productCategory === 'digital' ? 'Produk Digital' : 'Produk Non-Digital (Fisik / Jasa)'}
Format / Jenis Produk: ${finalFormat}
Harga Saat Ini: ${hasProductPrice}
Manfaat Input User: ${hasProductBenefit || "Belum diisi"}
Target Market Input User: ${hasProductAudience || "Belum diisi"}`;

    try {
      const rawRes = await generateAIContent(userPrompt, systemPrompt);
      const parsed = safeParseJSON(rawRes.text || rawRes, {});
      if (parsed.mainBenefit) setHasProductBenefit(parsed.mainBenefit);
      if (parsed.targetMarket) setHasProductAudience(parsed.targetMarket);
      if (parsed.recommendedPrice && !hasProductPrice) setHasProductPrice(parsed.recommendedPrice);
      toast.success("Informasi produk berhasil dirapikan dengan AI!");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal merapikan dengan AI.");
    } finally {
      setIsPolishingHasProduct(false);
    }
  };

  // --- EXPRESS AUTO-DRAFT GENERATOR (Fast-Track for No-Product Flow) ---
  const handleBuildExpressCampaignDraft = async (overrideIdea?: any) => {
    let idea = overrideIdea;
    if (!idea) {
      if (selectedIdeaIndex === null || !generatedIdeas[selectedIdeaIndex]) {
        toast.error("Silakan pilih salah satu ide ebook terlebih dahulu.");
        return;
      }
      const rawIdea = generatedIdeas[selectedIdeaIndex];
      idea = {
        title: isEditingSelectedIdea ? customTitle : rawIdea.title,
        topic: isEditingSelectedIdea ? customTopic : rawIdea.topic,
        targetMarket: isEditingSelectedIdea ? customTargetMarket : rawIdea.targetMarket,
        mainPromise: isEditingSelectedIdea ? customMainPromise : rawIdea.mainPromise,
        format: rawIdea.format || "Ebook PDF Guide",
        priceRange: isEditingSelectedIdea ? customPrice : (rawIdea.priceRange || preferredPrice),
        reasoning: rawIdea.reasoning
      };
    }

    setIsGeneratingExpressDraft(true);
    setExpressProgressText("Langkah 1/3: Menyusun Niche, Target Market & Offer Stack...");

    try {
      const prompt = `Anda adalah pakar strategi Meta Ads & pembuat campaign produk digital instant.
Buat draf campaign Meta Ads lengkap untuk produk digital berikut dalam Bahasa Indonesia.

Detail Produk:
- Nama Produk/Ebook: "${idea.title}"
- Topik: "${idea.topic}"
- Format: "${idea.format}"
- Harga: "${idea.priceRange}"
- Target Market: "${idea.targetMarket}"
- Janji Utama / Transformasi: "${idea.mainPromise}"

Return ONLY JSON adhering to this structure:
{
  "usp": "Janji unik pembeda utama dari pesaing",
  "bonuses": ["Bonus #1: ...", "Bonus #2: ...", "Bonus #3: ..."],
  "guarantee": "Garansi kepuasan atau garansi akses produk instan",
  "angles": [
    {
      "id": "A",
      "name": "Sudut Pandang Emosional (Pain to Relief)",
      "targetEmotion": "Frustrasi beralih ke rasa lega",
      "visualStrategy": "Visual studio fotorealistis menunjukkan pembaca yang lega dan sukses",
      "hookStrategy": "Pola kalimat penghenti scroll langsung menembak pain point",
      "finalPrompt": "Template Prompt Meta Ads Fotorealistis dalam Bahasa Indonesia..."
    },
    {
      "id": "B",
      "name": "Sudut Pandang Solusi Masalah Praktis",
      "targetEmotion": "Kepercayaan diri menyelesaikan masalah",
      "visualStrategy": "Mockup 3D Ebook & tablet di meja kerja modern",
      "hookStrategy": "Tunjukkan hasil nyata sebelum dan sesudah membaca ebook",
      "finalPrompt": "Template Prompt Meta Ads Fotorealistis 3D Mockup Ebook..."
    },
    {
      "id": "C",
      "name": "Sudut Pandang Lifestyle & Impian",
      "targetEmotion": "Upgrade status dan impian hidup lebih baik",
      "visualStrategy": "Gaya hidup santai bekerja dari mana saja",
      "hookStrategy": "Pertanyakan cara lama yang membuang waktu",
      "finalPrompt": "Template Prompt Meta Ads Fotorealistis Lifestyle..."
    }
  ],
  "copywriting": {
    "hooks": [
      "Capek nyoba berbagai cara tapi hasil tetap nihil? Baca ini sebentar...",
      "Rahasia pemula bisa hasilkan orderan pertama dalam 7 hari tanpa pusing",
      "Stop buang waktu! Ini panduan praktis yang wajib dimiliki pemula"
    ],
    "headlines": [
      "Ebook Kit Praktis: Solusi Lengkap Pemula 2026",
      "Dapatkan Orderan Pertama Dari Rumah Tanpa Modal Besar",
      "Panduan Step-by-Step Siap Pakai - Diskon Waktu Terbatas"
    ],
    "primaryTexts": [
      "Jujur saja, berapa banyak waktu yang sudah Anda buang untuk mencoba-coba sendiri tanpa hasil yang jelas?\\n\\nDengan ${idea.title}, Anda mendapatkan panduan praktis yang dirancang khusus untuk membantu ${idea.targetMarket} mencapai ${idea.mainPromise}.\\n\\nAmbil penawaran hemat ini sekarang sebelum promo berakhir!",
      "Ingin menguasai ${idea.topic} tanpa harus pusing belajar teori berbelit?\\n\\n${idea.title} hadir sebagai jawaban praktis. Dilengkapi dengan bonus checklist dan template siap pakai.\\n\\nKlik tombol di bawah dan dapatkan akses instan sekarang juga!"
    ],
    "ctas": ["Beli Sekarang", "Dapatkan Akses Instan", "Pesan Ebook Sekarang"]
  }
}`;

      const sysPrompt = "Return ONLY valid JSON matching the exact schema requested.";
      const rawRes = await generateAIContent(prompt, sysPrompt);
      const parsed = safeParseJSON(rawRes.text || rawRes, null);

      const usp = parsed?.usp || idea.mainPromise;
      const bonuses = parsed?.bonuses || [
        `Bonus #1: Checklist & Action Plan ${idea.topic}`,
        `Bonus #2: Template Siap Pakai 2026`,
        `Bonus #3: Panduan Eksekusi Cepat 24 Jam`
      ];
      const guarantee = parsed?.guarantee || "100% Garansi Akses Produk Digital Instan & Kepuasan Pembeli";
      const angles = parsed?.angles || [
        {
          id: "A",
          name: "Sudut Pandang Emosional (Pain to Relief)",
          visualStrategy: `Visual studio fotorealistis pembaca ${idea.targetMarket} yang puas membaca Ebook`,
          finalPrompt: `Template Prompt Meta Ads: High quality commercial photography of ${idea.title}...`
        },
        {
          id: "B",
          name: "Sudut Pandang Solusi Masalah Praktis",
          visualStrategy: `Mockup 3D Ebook ${idea.title} di layar iPad dan laptop`,
          finalPrompt: `Template Prompt Meta Ads: 3D High quality digital product mockup of ${idea.title}...`
        }
      ];

      const hooks = parsed?.copywriting?.hooks || [
        `Ingin hasil nyata tanpa teori pusing? Baca ini...`,
        `Solusi praktis ${idea.topic} untuk ${idea.targetMarket}`
      ];
      const headlines = parsed?.copywriting?.headlines || [
        `${idea.title} - Kit Praktis 2026`,
        `Dapatkan ${idea.mainPromise} Sekarang`
      ];
      const primaryTexts = parsed?.copywriting?.primaryTexts || [
        `Dapatkan ${idea.title} sekarang dan wujudkan ${idea.mainPromise}. Cocok untuk ${idea.targetMarket}. Klik untuk pesan!`
      ];
      const ctas = parsed?.copywriting?.ctas || ["Beli Sekarang", "Dapatkan Akses Instan"];

      // Construct Full Initial Campaign Payload
      const fullPayload = {
        initialSetupCompleted: true,
        productStatus: "no_product" as const,
        initialProductData: {
          productStatus: "no_product" as const,
          productName: idea.title,
          productFormat: idea.format || "Ebook PDF Guide",
          price: idea.priceRange || preferredPrice,
          mainBenefit: idea.mainPromise,
          targetMarket: idea.targetMarket,
          productTopic: idea.topic,
          productIdeaReasoning: idea.reasoning
        },
        sharedBusinessContext: {
          brandName: idea.title,
          coreOffer: idea.title,
          pricingStrategy: idea.priceRange || preferredPrice,
          targetAudience: idea.targetMarket,
          primaryPainPoint: `Kesulitan dalam ${idea.topic}`,
          uniqueSellingProposition: usp,
          niche: idea.topic,
          brandTone: "Edukatif, Empatis & Solutif"
        },
        nicheData: {
          input: { niche: idea.topic, country: "Indonesia" },
          output: {
            niche: idea.topic,
            summary: idea.mainPromise,
            selectedOption: {
              title: idea.title,
              marketDemand: "Sangat Tinggi",
              monetizationPotential: "Rp 10jt - 50jt/bln",
              competitionLevel: "Sedang",
              recommendedAngle: "Ebook Panduan Praktis Siap Pakai"
            }
          }
        },
        audienceData: {
          input: { targetAudience: idea.targetMarket },
          output: {
            avatarName: idea.targetMarket,
            demographics: {
              age: "24-45 Tahun",
              gender: "Pria & Wanita",
              location: "Indonesia"
            },
            interests: [idea.topic, "Pengembangan Diri", "Bisnis Online"],
            selectedPersona: {
              name: `Calon Pembeli ${idea.topic}`,
              role: "Pemula Marketer / Pembeli Digital",
              frustrations: `Belum menemukan panduan langkah-demi-langkah tentang ${idea.topic}`
            }
          }
        },
        painPointData: {
          input: { extraContext: idea.topic },
          output: {
            selectedOption: {
              painPoint: `Frustrasi cara menguasai ${idea.topic} tanpa buang waktu dan modal`,
              emotionalTrigger: "Keinginan mendapatkan hasil cepat dan terstruktur",
              urgencyLevel: "Tinggi (Urgent Needs)"
            }
          }
        },
        validationData: {
          input: { marketName: idea.topic },
          output: {
            selectedOption: {
              validationScore: 92,
              demandVolume: "High Search Interest",
              willingnessToPay: "Tinggi untuk Ebook & Kit Praktis",
              competitorGap: "Minim panduan praktis siap pakai"
            }
          }
        },
        positioningData: {
          input: { usp: usp },
          output: {
            selectedOption: {
              usp: usp,
              positioningStatement: `Satu-satunya panduan ${idea.format} yang memberikan langkah praktis ${idea.topic}.`,
              categoryLeadership: "Kit Praktis 2026"
            }
          }
        },
        offerData: {
          input: { offerName: idea.title, price: idea.priceRange || preferredPrice },
          output: {
            offerName: idea.title,
            price: idea.priceRange || preferredPrice,
            selectedOption: {
              title: `Paket Hemat ${idea.title}`,
              price: idea.priceRange || preferredPrice,
              bonuses: bonuses,
              guarantee: guarantee
            }
          }
        },
        marketingAngles: { output: { angles: angles } },
        adsGeneratedAngles: angles,
        copyDirection: {
          output: {
            hooks: hooks,
            headlines: headlines,
            adCopies: primaryTexts,
            ctas: ctas
          }
        },
        adsInputState: {
          headlines: headlines,
          adCopies: primaryTexts,
          ctas: ctas,
          generatedVideoDirections: [
            {
              id: "v1",
              title: `UGC Review ${idea.title}`,
              persona: "Kreator Pemula Jujur",
              hookScript: hooks[0] || `Akhirnya nemu ebook ${idea.topic} yang paling praktis!`,
              visualPacing: "Fast jump cuts 1.5s",
              fullScript: `0-3s: Hook (${hooks[0]})... 3-10s: Tunjukkan masalah... 10-20s: Buka ebook di iPad... 20-30s: Tunjukkan bonus & panggil aksi!`
            }
          ],
          generatedCarousel: [
            {
              id: "car_1",
              title: "5 Slide Conversion Deck",
              slides: [
                { slideNumber: 1, title: headlines[0] || idea.title, visualNote: "Slide Hook Utama" },
                { slideNumber: 2, title: "Alasan Cara Lama Gagal", visualNote: "Visual masalah pembeli" },
                { slideNumber: 3, title: idea.mainPromise, visualNote: "Visual isi produk Ebook" },
                { slideNumber: 4, title: "Tumpukan Bonus Exclusif", visualNote: bonuses.join(", ") },
                { slideNumber: 5, title: "Pesan Sekarang - Diskon 50%", visualNote: "Tombol CTA Instan" }
              ]
            }
          ]
        },
        adsRecommendationsState: {
          tracking: ["Meta Pixel Verified", "Conversions API (CAPI)", "Custom Conversion Event"],
          policy: ["Bebas Klaim Berlebihan", "Cantumkan Link Syarat & Ketentuan", "Gunakan Tampilan Produk Asli"]
        }
      };

      setExpressDraftResult({
        idea,
        payload: fullPayload,
        preview: {
          usp,
          bonuses,
          guarantee,
          headline: headlines[0],
          primaryText: primaryTexts[0]
        }
      });

      toast.success("🔥 Draf Campaign Meta Ads Lengkap Berhasil Dibuat AI!");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal membuat draf campaign otomatis. Mencoba fallback...");
    } finally {
      setIsGeneratingExpressDraft(false);
      setExpressProgressText("");
    }
  };

  // Submit Gateway HAS PRODUCT
  const handleSubmitHasProduct = () => {
    if (!hasProductName.trim()) {
      toast.error("Mohon isi nama produk Anda.");
      return;
    }

    const finalFormat = hasProductFormat === "Lainnya" ? (customHasProductFormat.trim() || "Produk Custom") : hasProductFormat;
    const productNameTrimmed = hasProductName.trim();

    const initialProductData: InitialProductData = {
      productStatus: "has_product",
      productName: productNameTrimmed,
      productFormat: finalFormat,
      productCategory: productCategory,
      price: hasProductPrice.trim() || "Rp 99.000",
      mainBenefit: hasProductBenefit.trim() || "Membantu calon pembeli mendapatkan hasil maksimal secara praktis.",
      targetMarket: hasProductAudience.trim() || "Calon Pembeli Ideal",
      productTopic: productNameTrimmed
    };

    const sharedBusinessContext = {
      brandName: initialProductData.productName,
      coreOffer: initialProductData.productName,
      pricingStrategy: initialProductData.price,
      targetAudience: initialProductData.targetMarket,
      primaryPainPoint: `Kesulitan mencapai hasil tanpa ${initialProductData.productName}`,
      uniqueSellingProposition: initialProductData.mainBenefit,
      niche: initialProductData.productName,
      productFormat: finalFormat,
      productCategory: productCategory,
      brandTone: "Profesional, Empatis & Solutif"
    };

    const initialNicheOption = {
      id: "user_product_niche",
      name: initialProductData.productName,
      summary: `[Produk User - ${productCategory === "non_digital" ? "Non-Digital/Fisik/Jasa" : "Digital"}] ${finalFormat}: ${initialProductData.mainBenefit}`,
      demand_score: 95,
      competition_score: 45,
      viral_potential: 88,
      productFormat: finalFormat,
      productCategory: productCategory,
      targetMarket: initialProductData.targetMarket
    };

    onComplete({
      initialSetupCompleted: true,
      productStatus: "has_product",
      targetStep: 1,
      initialProductData,
      sharedBusinessContext,
      nicheData: {
        input: {
          interest: initialProductData.productName,
          niche: initialProductData.productName,
          country: "Indonesia",
          age: "18-45",
          skill: finalFormat,
          extraContext: `Produk: ${initialProductData.productName} (${finalFormat}). Manfaat: ${initialProductData.mainBenefit}. Target Market: ${initialProductData.targetMarket}`
        },
        options: [initialNicheOption],
        selectedOption: initialNicheOption,
        output: { niche: initialProductData.productName, summary: initialProductData.mainBenefit }
      },
      audienceData: {
        input: {
          targetAudience: initialProductData.targetMarket,
          audienceGoal: initialProductData.targetMarket,
          demographicsGoal: "18-45 tahun"
        },
        output: { avatarName: initialProductData.targetMarket },
        selectedPersona: {
          persona_name: initialProductData.targetMarket,
          buying_behavior: "Mencari solusi terbukti & praktis yang langsung mengatasi masalah mereka",
          emotional_triggers: ["Ingin kemudahan", "Takut salah pilih", "Ingin hasil cepat"]
        }
      },
      offerData: {
        input: {
          offerName: initialProductData.productName,
          price: initialProductData.price,
          mainOffer: initialProductData.productName
        },
        output: { offerName: initialProductData.productName, price: initialProductData.price }
      },
      brandFoundationData: {
        input: { brandName: initialProductData.productName }
      }
    });

    toast.success("Produk berhasil didaftarkan! Melanjutkan ke Workflow Campaign Meta Ads...");
  };

  // Submit Gateway NO PRODUCT with explicit Target Step choice
  const handleFinalizeNoProductSelection = (targetStep: number) => {
    if (!expressDraftResult?.payload) {
      toast.error("Silakan generate draf campaign terlebih dahulu.");
      return;
    }

    const finalPayload = {
      ...expressDraftResult.payload,
      targetStep: targetStep
    };

    onComplete(finalPayload);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 text-left">
      {/* Header & Orientation */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-black text-primary uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>Panduan Awal Penjual Produk Digital</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-foreground">
          Langkah 1: Tentukan Status Produk Digital Anda
        </h2>
        <p className="text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto leading-relaxed font-sans">
          Apakah Anda sudah memiliki produk sendiri, atau ingin AI membantu membuatkan ide e-book & draf iklan siap pakai secara instan?
        </p>
      </div>

      {!userProfile ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 bg-card border-2 border-primary/30 rounded-3xl shadow-xl space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-black text-foreground uppercase tracking-tight">
                Langkah Awal: Profil Pengguna & Brand
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Masukkan nama Anda dan nama brand/bisnis secara ringkas untuk mempersonalisasi strategi & naskah iklan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveUserProfile} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-foreground tracking-wider block">
                  Nama Anda <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={gatewayUserName}
                    onChange={(e) => setGatewayUserName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="h-11 pl-10 bg-background"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-foreground tracking-wider block">
                  Nama Brand / Bisnis <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={gatewayBrandName}
                    onChange={(e) => setGatewayBrandName(e.target.value)}
                    placeholder="Contoh: Alco Digital / Store Saya"
                    className="h-11 pl-10 bg-background"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto h-11 px-6 bg-primary hover:bg-primary/95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Simpan Profil & Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ================= STAGE 0: DECISION CARDS ================= */}
        {productStatus === null && (
          <motion.div 
            key="decision-cards"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2"
          >
            {/* CHOICE 1: SAYA SUDAH PUNYA PRODUK */}
            <Card 
              onClick={() => setProductStatus("has_product")}
              className="group cursor-pointer hover:border-emerald-500/80 transition-all border-2 border-border bg-card hover:bg-emerald-500/5 hover:shadow-xl rounded-3xl overflow-hidden relative"
            >
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <PackageCheck className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Siap Iklan 🚀
                  </span>
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-lg font-heading font-black text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>Saya Sudah Punya Produk</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Saya sudah memiliki e-book, kursus online, template, atau lisensi produk digital yang siap saya iklankan.
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 text-[11px] space-y-1.5 text-muted-foreground text-left font-sans">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Isi nama, harga & manfaat produk Anda</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>AI otomatis ramu naskah & angle iklan</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CHOICE 2: SAYA BELUM PUNYA PRODUK (FAST-TRACK EXPRESS) */}
            <Card 
              onClick={() => {
                setProductStatus("no_product");
                if (generatedIdeas.length === 0) {
                  handleGenerateEbookIdeas("Bisnis Online & Marketing Pemula");
                }
              }}
              className="group cursor-pointer hover:border-indigo-500 transition-all border-2 border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 hover:shadow-2xl rounded-3xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
                Rekomendasi Pemula ✨ (Express Auto-Draft)
              </div>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30">
                    Fast-Track Ebook ⚡
                  </span>
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="text-lg font-heading font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                    <span>Saya Belum Punya Produk</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Bantu saya buatkan ide Ebook / Produk Digital termudah + langsung rakit draf campaign Meta Ads secara otomatis!
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 text-[11px] space-y-1.5 text-muted-foreground text-left font-sans">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>AI buatkan 3 ide Ebook berdaya jual tinggi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Otomatis rakit draf audiens, offer & naskah iklan</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ================= STAGE 1A: SAYA SUDAH PUNYA PRODUK FORM ================= */}
        {productStatus === "has_product" && (
          <motion.div
            key="has-product-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between bg-card p-3 px-4 rounded-2xl border border-border">
              <button 
                onClick={() => setProductStatus(null)} 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Ganti Status Produk</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <PackageCheck className="w-4 h-4" />
                <span>Mode: Produk Sudah Ada</span>
              </div>
            </div>

            <Card className="border-border bg-card rounded-3xl shadow-sm">
              <CardContent className="p-6 space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-base uppercase text-foreground">Informasi Dasar Produk Anda</h3>
                    <p className="text-xs text-muted-foreground font-sans">Isi detail produk yang sudah Anda persiapkan (Digital, Fisik, Jasa, dll)</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPolishingHasProduct}
                    onClick={handlePolishProductWithAI}
                    className="h-8 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20 text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
                  >
                    {isPolishingHasProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                    <span>Rapikan dengan AI</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                  {/* Kategori Utama Produk (Digital vs Non-Digital) */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Kategori Tipe Produk</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Pilih jenis produk Anda</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleCategoryChange("digital")}
                        className={cn(
                          "p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer",
                          productCategory === "digital" 
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary/40 font-medium"
                        )}
                      >
                        <Zap className="w-4 h-4 shrink-0 text-indigo-500" />
                        <div>
                          <div className="text-xs font-bold">⚡ Produk Digital</div>
                          <div className="text-[10px] text-muted-foreground">Ebook, Kursus, Template, App</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCategoryChange("non_digital")}
                        className={cn(
                          "p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer",
                          productCategory === "non_digital" 
                            ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:bg-secondary/40 font-medium"
                        )}
                      >
                        <PackageCheck className="w-4 h-4 shrink-0 text-purple-500" />
                        <div>
                          <div className="text-xs font-bold">📦 Non-Digital (Fisik / Jasa)</div>
                          <div className="text-[10px] text-muted-foreground">Barang Fisik, Jasa, Kuliner, Event</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Nama Produk */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <span>Nama / Judul Produk Anda</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      value={hasProductName ?? ""}
                      onChange={(e) => setHasProductName(e.target.value)}
                      placeholder={productCategory === "digital" ? "Contoh: Ebook Kit 30 Hari Jualan Online dari Rumah" : "Contoh: Sepatu Sneakers Canvas / Jasa Desain Interior"}
                      className="bg-background rounded-xl h-11 text-sm"
                    />
                  </div>

                  {/* Jenis / Format Produk */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Format / Jenis Produk</label>
                    <select
                      value={hasProductFormat ?? "Ebook / Panduan PDF"}
                      onChange={(e) => {
                        setHasProductFormat(e.target.value);
                        if (e.target.value !== "Lainnya") {
                          setCustomHasProductFormat("");
                        }
                      }}
                      className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
                    >
                      {productCategory === "digital" ? (
                        <>
                          <option value="Ebook / Panduan PDF">Ebook / Panduan PDF</option>
                          <option value="Kursus Online / Video Guide">Kursus Online / Video Guide</option>
                          <option value="Template / Asset Pack (Canva/Notion/Design)">Template / Asset Pack (Canva/Notion)</option>
                          <option value="Membership / Akses Komunitas">Membership / Akses Komunitas</option>
                          <option value="Software / Mini Web Tool">Software / Mini Web Tool</option>
                          <option value="Lainnya">Lainnya (Ketik Manual...)</option>
                        </>
                      ) : (
                        <>
                          <option value="Produk Fisik / Barang Retail">Produk Fisik / Barang Retail</option>
                          <option value="Fashion & Aksesoris">Fashion & Aksesoris</option>
                          <option value="Skincare & Kosmetik">Skincare & Kosmetik</option>
                          <option value="Kuliner / Food & Beverage">Kuliner / Food & Beverage</option>
                          <option value="Jasa / Konsultasi / Agency Services">Jasa / Konsultasi / Agency Services</option>
                          <option value="Event / Workshop / Seminar On-site">Event / Workshop / Seminar On-site</option>
                          <option value="Lainnya">Lainnya (Ketik Manual...)</option>
                        </>
                      )}
                    </select>

                    {/* Input manual jika user memilih "Lainnya" */}
                    {hasProductFormat === "Lainnya" && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1 pt-1"
                      >
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          Ketik Format / Jenis Produk Spesifik Anda:
                        </label>
                        <Input
                          value={customHasProductFormat}
                          onChange={(e) => setCustomHasProductFormat(e.target.value)}
                          placeholder="Contoh: Voucher Diskon Fisik, Jasa Fotografi, Tiket Konser..."
                          className="bg-background rounded-xl h-10 text-xs border-indigo-500/40 focus:border-indigo-500"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Harga */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Harga Jualan (Rp)</label>
                    <Input 
                      value={hasProductPrice ?? ""}
                      onChange={(e) => setHasProductPrice(e.target.value)}
                      placeholder="Contoh: Rp 99.000"
                      className="bg-background rounded-xl h-11 text-sm"
                    />
                  </div>

                  {/* Manfaat / Janji Utama */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-foreground">Manfaat Utama / Hasil Yang Dijanjikan Ke Pembeli</label>
                    <Textarea 
                      value={hasProductBenefit ?? ""}
                      onChange={(e) => setHasProductBenefit(e.target.value)}
                      placeholder="Contoh: Membantu pebisnis pemula mendapatkan 100 orderan pertama tanpa modal besar."
                      className="bg-background rounded-xl min-h-[70px] text-sm"
                    />
                  </div>

                  {/* Target Market */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-foreground">Target Market / Calon Pembeli Utama</label>
                    <Input 
                      value={hasProductAudience ?? ""}
                      onChange={(e) => setHasProductAudience(e.target.value)}
                      placeholder="Contoh: Ibu rumah tangga, ibu menyusui, reseller olshop pemula"
                      className="bg-background rounded-xl h-11 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <Button 
                    type="button"
                    onClick={handleSubmitHasProduct}
                    className="w-full md:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg gap-2 cursor-pointer"
                  >
                    <span>Simpan & Lanjut Ke Workflow Meta Ads</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ================= STAGE 1B: SAYA BELUM PUNYA PRODUK (FAST-TRACK AUTO-DRAFT MINI-FLOW) ================= */}
        {productStatus === "no_product" && (
          <motion.div
            key="no-product-flow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-card p-3 px-4 rounded-2xl border border-border">
              <button 
                onClick={() => setProductStatus(null)} 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Ganti Pilihan Status Produk</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                <BookOpen className="w-4 h-4" />
                <span>Mode Pemula: Fast-Track Generator Ebook AI</span>
              </div>
            </div>

            {/* Step 1: Niche & Ebook Topic Selector Box */}
            <Card className="border-indigo-500/30 bg-indigo-500/5 rounded-3xl shadow-sm">
              <CardContent className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <h3 className="font-heading font-black text-base uppercase text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Pilih Topik Ebook Termudah</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                    Pilih salah satu kategori favorit atau ketik topik sendiri. AI akan meriset 3 ide e-book paling potensial diiklan Meta Ads.
                  </p>
                </div>

                {/* Niche Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1 font-sans">
                  {EBOOK_NICHE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setNoProductNicheQuery(preset.query);
                        handleGenerateEbookIdeas(preset.query);
                      }}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-background/90 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-sm"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Search Query & Format Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 font-sans">
                  <div className="md:col-span-2">
                    <Input 
                      value={noProductNicheQuery}
                      onChange={(e) => setNoProductNicheQuery(e.target.value)}
                      placeholder="Atau ketik topik sendiri (contoh: 'Resep Makanan Sehat Bayi')"
                      className="bg-background rounded-xl h-11 text-sm"
                    />
                  </div>
                  <Button
                    onClick={() => handleGenerateEbookIdeas()}
                    disabled={isGeneratingIdeas}
                    className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md gap-2 cursor-pointer"
                  >
                    {isGeneratingIdeas ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Riset Ide Ebook AI</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading Indicator */}
            {isGeneratingIdeas && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-card rounded-3xl border border-border shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Menganalisis Pasar Ebook & Target Market Berdaya Beli...
                </p>
              </div>
            )}

            {/* Generated 3 Ebook Cards Result */}
            {!isGeneratingIdeas && generatedIdeas.length > 0 && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-foreground font-mono">
                    PILIH SALAH SATU IDE EBOOK HASIL AI ({generatedIdeas.length} OPSI):
                  </h4>
                  <Button
                    onClick={() => handleGenerateEbookIdeas()}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <RefreshCcw className="w-3 h-3 mr-1" /> Cari Ide Lain
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {generatedIdeas.map((idea, idx) => {
                    const isSelected = selectedIdeaIndex === idx;
                    return (
                      <Card
                        key={idx}
                        onClick={() => setSelectedIdeaIndex(idx)}
                        className={cn(
                          "cursor-pointer transition-all rounded-3xl border-2 p-5 text-left relative overflow-hidden",
                          isSelected
                            ? "border-indigo-600 bg-indigo-500/10 shadow-lg"
                            : "border-border bg-card hover:border-indigo-500/50"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Pilihan Utama</span>
                          </div>
                        )}

                        <div className="space-y-3 font-sans">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider rounded-md">
                              {idea.format || "Ebook PDF Guide"}
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-md">
                              Harga: {idea.priceRange || preferredPrice}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-foreground leading-snug">
                            {idea.title}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground bg-background/60 p-3 rounded-2xl border border-border/50">
                            <div>
                              <strong className="text-foreground">Target Market:</strong> {idea.targetMarket}
                            </div>
                            <div>
                              <strong className="text-foreground">Janji Hasil Utama:</strong> {idea.mainPromise}
                            </div>
                          </div>

                          <p className="text-[11px] text-muted-foreground italic bg-secondary/30 p-2.5 rounded-xl border border-border/30">
                            💡 <strong>Alasan Potensial Meta Ads:</strong> {idea.reasoning}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Customization Toggle for Selected Idea */}
                {selectedIdeaIndex !== null && (
                  <Card className="border border-border bg-card/60 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Kustomisasi Parameter Ide Ini (Opsional)</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingSelectedIdea(!isEditingSelectedIdea)}
                        className="h-7 text-[10px] font-bold text-indigo-600 dark:text-indigo-400"
                      >
                        {isEditingSelectedIdea ? "Sembunyikan Form" : "Ubah Detail / Judul"}
                      </Button>
                    </div>

                    {isEditingSelectedIdea && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-sans">
                        <div className="md:col-span-2 space-y-1">
                          <label className="font-bold text-foreground">Judul Ebook</label>
                          <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="h-9 bg-background" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-foreground">Topik</label>
                          <Input value={customTopic} onChange={e => setCustomTopic(e.target.value)} className="h-9 bg-background" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-foreground">Harga Jualan</label>
                          <Input value={customPrice} onChange={e => setCustomPrice(e.target.value)} className="h-9 bg-background" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-bold text-foreground">Target Market</label>
                          <Input value={customTargetMarket} onChange={e => setCustomTargetMarket(e.target.value)} className="h-9 bg-background" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-bold text-foreground">Janji Hasil Utama</label>
                          <Input value={customMainPromise} onChange={e => setCustomMainPromise(e.target.value)} className="h-9 bg-background" />
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* FAST-TRACK TRIGGER BUTTON */}
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => handleBuildExpressCampaignDraft()}
                    disabled={selectedIdeaIndex === null || isGeneratingExpressDraft}
                    className="w-full md:w-auto h-13 px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    {isGeneratingExpressDraft ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Merakit Draf Campaign...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                        <span>⚡ Rakit Draf Campaign Meta Ads Otomatis (Full AI)</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Loading Banner During Full AI Express Draft Generation */}
            {isGeneratingExpressDraft && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4 text-center shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-bounce">
                  <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-heading font-black uppercase tracking-tight text-white">
                    MEMBUAT DRAF CAMPAIGN KAMPANYE EBOOK PERTAMA Anda...
                  </h3>
                  <p className="text-xs text-slate-300 font-sans">
                    {expressProgressText || "Merender positioning, target audiens, paket offer & naskah iklan..."}
                  </p>
                </div>
                <div className="w-full max-w-md mx-auto h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 animate-pulse" style={{ width: "85%" }} />
                </div>
              </motion.div>
            )}

            {/* ================= EXPRESS DRAFT READY MODAL & PREVIEW HUB ================= */}
            {expressDraftResult && !isGeneratingExpressDraft && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 p-6 rounded-3xl bg-card border-2 border-emerald-500/40 shadow-xl"
              >
                {/* Success Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-heading font-black uppercase text-foreground">
                        🎉 DRAF CAMPAIGN AWAL BERHASIL DIRAKIT!
                      </h3>
                      <p className="text-xs text-muted-foreground font-sans">
                        AI telah menyiapkan draf awal untuk Produk, Audiens, Offer, dan Ads Copy Anda.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                    Siap Ditinjau 🚀
                  </span>
                </div>

                {/* Draft Summary Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-sans">
                  {/* Card 1: Ebook & Price */}
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/40 space-y-1.5">
                    <span className="text-[9.5px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block font-mono">
                      📖 PRODUK & HARGA
                    </span>
                    <h4 className="text-sm font-bold text-foreground">{expressDraftResult.idea.title}</h4>
                    <p className="text-xs text-muted-foreground">Harga: <strong className="text-emerald-600 dark:text-emerald-400">{expressDraftResult.idea.priceRange}</strong> ({expressDraftResult.idea.format})</p>
                  </div>

                  {/* Card 2: Target Market */}
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/40 space-y-1.5">
                    <span className="text-[9.5px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider block font-mono">
                      🎯 TARGET AUDIENS
                    </span>
                    <h4 className="text-xs font-bold text-foreground">{expressDraftResult.idea.targetMarket}</h4>
                    <p className="text-xs text-muted-foreground truncate">{expressDraftResult.idea.mainPromise}</p>
                  </div>

                  {/* Card 3: Offer & Bonuses */}
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/40 space-y-1.5 md:col-span-2">
                    <span className="text-[9.5px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block font-mono">
                      🎁 OFFER STACK & BONUSES
                    </span>
                    <ul className="text-xs text-foreground space-y-1 list-disc list-inside font-medium">
                      {expressDraftResult.preview.bonuses.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 4: Copywriting Preview */}
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/40 space-y-1.5 md:col-span-2">
                    <span className="text-[9.5px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider block font-mono">
                      ✍️ CONTOH HEADLINE & COPY IKLAN
                    </span>
                    <p className="text-xs font-bold text-foreground">"{expressDraftResult.preview.headline}"</p>
                    <p className="text-xs text-muted-foreground italic line-clamp-2">"{expressDraftResult.preview.primaryText}"</p>
                  </div>
                </div>

                {/* REGENERATE CONTROLS BAR */}
                <div className="p-4 bg-secondary/20 rounded-2xl border border-border/60 space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block font-mono">
                    🔄 REGENERATE DRAF (OPSI PEMBARUAN):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleGenerateEbookIdeas()}
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                    >
                      <RefreshCcw className="w-3 h-3 mr-1" /> Regen Ide Produk
                    </Button>
                    <Button
                      onClick={() => handleBuildExpressCampaignDraft(expressDraftResult.idea)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-amber-500/30"
                    >
                      <RefreshCcw className="w-3 h-3 mr-1" /> Regen Offer & Bonus
                    </Button>
                    <Button
                      onClick={() => handleBuildExpressCampaignDraft(expressDraftResult.idea)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-rose-500/30"
                    >
                      <RefreshCcw className="w-3 h-3 mr-1" /> Regen Copy & Ads
                    </Button>
                    <Button
                      onClick={() => handleGenerateEbookIdeas()}
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-slate-700"
                    >
                      <RefreshCcw className="w-3 h-3 mr-1" /> Reset Semua Draf
                    </Button>
                  </div>
                </div>

                {/* TWO CLEAR DESTINATION CHOICES (REQUIREMENT 4) */}
                <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
                  <Button
                    onClick={() => handleFinalizeNoProductSelection(1)}
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-6 border-slate-700 text-slate-200 hover:bg-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    <span>🔍 Lanjut Review Per-Langkah (Step 1-10)</span>
                  </Button>

                  <Button
                    onClick={() => handleFinalizeNoProductSelection(10)}
                    className="w-full sm:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Target className="w-4 h-4" />
                    <span>🚀 Langsung Lihat Campaign Pack Final (Siap Iklan)</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </div>
  );
}
