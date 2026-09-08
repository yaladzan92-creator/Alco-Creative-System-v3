# FUNCTIONAL_REQUIREMENTS.md

# Tujuan
Dokumen ini mendefinisikan kebutuhan fungsional Alco Creative System berdasarkan AI Workflow.

## Modul 1 - Authentication
### Fitur
- Login
- Logout
- Manajemen Gemini API Key

### Acceptance Criteria
- Pengguna dapat login.
- API Key wajib tersedia sebelum menggunakan AI.
- API Key dapat diperbarui dan dihapus.

---

## Modul 2 - Project

### Fitur
- Membuat Project
- Membuka Project
- Menyimpan Progress
- Export Project

### Acceptance Criteria
- Progress workflow tersimpan.
- Shared Business Context ikut tersimpan.
- Project dapat dilanjutkan kapan saja.

---

## Modul 3 - Workflow

Tahapan:
1. Discovery
2. Strategy
3. Branding
4. Campaign

### Business Rules
- Pengguna dapat melanjutkan workflow.
- Generator menggunakan Shared Business Context.
- Perubahan Product, Audience, Positioning, atau Offer memberi status OUTDATED pada output terkait.

---

## Modul 4 - AI Generator

Generator:
- Product Analysis
- Audience
- Pain Point
- Market Assessment
- Positioning
- Offer
- Marketing Angle
- Brand Foundation
- Copy Ads
- Image Prompt
- Carousel Prompt
- Video Prompt
- Landing Page

### Acceptance Criteria
- Semua output dapat diedit.
- Regenerate hanya dilakukan atas permintaan pengguna.

---

## Modul 5 - Export

Output:
- Strategy
- Branding
- Campaign
- Landing Page
- Assets
- Project Data

Acceptance Criteria:
- Export menghasilkan satu file ZIP.

---

# MVP
- Login
- API Key
- Workflow
- AI Generator
- Shared Business Context
- Export

# Future
- White Label
- Team Collaboration
- Analytics
- API Marketplace
- Multi Workspace
