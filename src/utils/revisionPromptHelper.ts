export interface RevisionContextOptions {
  revision?: string;
  previousOutput?: any;
  stepName?: string;
  defaultContext?: string;
}

/**
 * Helper to construct high-priority AI prompts for initial generation vs user revision mode.
 * When revision notes are provided by the user, this forces Gemini to enter a strict REVISION MODE,
 * treating user evaluation notes as the highest priority directive (#1 Override) and explicitly
 * feeding the previous output to be modified.
 */
export function buildRevisionPromptContext({
  revision,
  previousOutput,
  stepName,
  defaultContext = ""
}: RevisionContextOptions): string {
  let cleanRevision = "";
  if (typeof revision === "string") {
    cleanRevision = revision.trim();
  } else if (revision && typeof revision === "object") {
    if ("revision" in revision && typeof (revision as any).revision === "string") {
      cleanRevision = (revision as any).revision.trim();
    }
  } else if (revision && typeof revision !== "function") {
    cleanRevision = String(revision).trim();
  }

  const isRevisionMode = Boolean(cleanRevision.length > 0);

  if (!isRevisionMode) {
    return `
=== MODE GENERASI AWAL (INITIAL GENERATION MODE) ===
DOKUMEN KONTEKS & MEMORI PROYEK:
${defaultContext}

Gunakan data masukan dan konteks proyek di atas untuk menghasilkan rekomendasi / output terbaik secara komprehensif.
`.trim();
  }

  const formattedPrevious = previousOutput
    ? typeof previousOutput === "string"
      ? previousOutput
      : JSON.stringify(previousOutput, null, 2)
    : "(Belum ada output spesifik)";

  return `
🚨 PERINTAH MODUS REVISI & EVALUASI PENGGUNA (SANGAT KRUSIAL - PRIORITAS UTAMA NO. 1) 🚨

LANGKAH WORKFLOW: ${stepName || "Workflow Step"}
MODE AKTIF: MODUS REVISI & PENYESUAIAN BERDASARKAN EVALUASI PENGGUNA

==================================================
CATATAN EVALUASI & INSTRUKSI REVISI DARI PENGGUNA (MANDATORI / PRIORITAS TERTINGGI):
"${cleanRevision}"
==================================================

OUTPUT SEBELUMNYA YANG WAJIB DIPERBAIKI (PREVIOUS OUTPUT TO REVISE):
${formattedPrevious}

DOKUMEN KONTEKS & MEMORI PROYEK TAMBAHAN:
${defaultContext}

==================================================
PETUNJUK KETAT UNTUK AI DALAM MODE REVISI (REVISION MODE DIRECTIVES):
1. INSTRUKSI REVISI PENGGUNA DI ATAS ADALAH PERINTAH KUNCI DENGAN PRIORITAS TERTINGGI (SUPREME PRIORITY OVERRIDE).
2. TUGAS UTAMA ANDA ADALAH MEMPERBAIKI, MENGUBAH, ATAU MENYESUAIKAN OUTPUT SEBELUMNYA AGAR SEPENUHNYA MEMENUHI CATATAN EVALUASI PENGGUNA.
3. JIKA TERJADI KONFLIK ANTARA OUTPUT LAMA ATAU KONTEKS PROYEK LAIN DENGAN INSTRUKSI REVISI PENGGUNA, ANDA WAJIB 100% MEMPRIORITASKAN DAN MENGIKUTI INSTRUKSI REVISI PENGGUNA.
4. JANGAN MEMBUAT TOPIK ATAU PRODUK BARU YANG TIDAK RELEVAN DAN JANGAN MENGABAIKAN CATATAN REVISI PENGGUNA. PERBAIKI DAN PERTAJAM ELEMEN YANG DIMINTA PENGGUNA.
5. PASTIKAN SELURUH HASIL AKHIR REVISI TETAP DALAM FORMAT JSON BERSIH DENGAN SKEMA/STRUKTUR LENGKAP YANG DIMINTA.
==================================================
`.trim();
}
