# PRODUCT_RULEBOOK.md

# Product Rulebook
Status: Draft
Purpose: Menjadi aturan utama (constitution) pengembangan Alco Creative System.

---

# 1. Workflow Rules
- Workflow adalah pusat pengalaman pengguna.
- Semua fitur baru harus terintegrasi ke workflow resmi.
- Workflow tidak boleh bercabang tanpa persetujuan desain.

# 2. Shared Business Context Rules
- Semua AI Generator wajib membaca Shared Business Context.
- Generator tidak boleh meminta ulang data yang sudah tersedia.
- Shared Business Context menjadi sumber data utama seluruh output.

# 3. AI Rules
- AI bertindak sebagai asisten, bukan pengambil keputusan.
- Semua output AI dapat diedit pengguna.
- AI tidak menimpa hasil edit manual.

# 4. Regeneration Rules
- Regenerate hanya dilakukan atas tindakan pengguna.
- Regenerate memperbarui output yang dipilih, bukan seluruh project.

# 5. Dependency Rules
- Perubahan Product, Audience, Positioning, Offer, atau Marketing Angle
  menandai output turunannya sebagai OUTDATED.
- Output tidak dihapus otomatis.

# 6. Editing Rules
- Pengguna dapat mengedit semua artefak.
- Sistem menyimpan status:
  - AI Generated
  - Manual Edited
  - Outdated

# 7. Project Rules
- Project dapat disimpan dan dilanjutkan.
- Progress workflow harus dipertahankan.

# 8. Ownership Rules
- Setiap project memiliki pemilik.
- Hanya pemilik yang dapat mengubah project kecuali ada fitur kolaborasi resmi.

# 9. Security Rules
- Production tidak boleh menggunakan mock authentication.
- Setiap akses data harus melalui validasi ownership.

# 10. Export Rules
- Export menghasilkan satu paket ZIP.
- Struktur minimal:
  01 Strategy
  02 Branding
  03 Campaign
  04 Landing Page
  05 Assets
  06 Project Data

# 11. Validation Rules
- Output AI harus tervalidasi sebelum disimpan.
- Error AI tidak boleh merusak project.

# 12. Versioning Rules
- Keputusan Final dicatat pada Decision Log.
- Perubahan aturan harus melalui analisis, rekomendasi, dan persetujuan.

# 13. MVP Rules
Fokus MVP:
- Cepat dipelajari
- Cepat menghasilkan campaign
- Stabil
- Aman
- Mudah dipelihara

# 14. Future Rules
- White-label
- Multi-workspace
- Team Collaboration
- Marketplace
- Analytics
- API Ecosystem
