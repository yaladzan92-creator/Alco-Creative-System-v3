# 🚀 ALCO Backend Deployment Checklist (Google Cloud Run Production)

Gunakan panduan ini untuk memisahkan backend API dari lingkungan Google AI Studio Preview. Setelah dideploy menggunakan instruksi ini, API akan bersifat publik secara global untuk dikonsumsi dengan aman oleh **App 2, App 3, dan App 4** menggunakan otentikasi kunci akses (`x-api-key`).

---

## 📋 Audit Validasi API (Q&A)

Berikut jawaban tegas terhadap integrasi domain preview Anda saat ini:

### 1. Apakah endpoint `/api/health` berjalan pada domain preview AI Studio?
> **YA.** Kode backend mendefinisikan rute tersebut, dan berjalan di port `3000` di dalam containernya.

### 2. Apakah endpoint `/api/health` dapat diakses tanpa login Google AI Studio?
> **TIDAK.** Domain Sandbox Google AI Studio Preview dilindungi oleh firewall otentikasi internal tingkat platform. Pemanggilan HTTP di luar browser yang tidak memiliki cookie sesi developer AI Studio yang valid akan diblokir.

### 3. Apakah request OPTIONS ke `/api/health` mengembalikan 200/204 atau 302 redirect ke `{__cookie_check.html}`?
> **302 Redirect ke `__cookie_check.html`.** Karena dipaksa melewati middleware proxy pengaman AI Studio untuk memastikan bahwa hanya pengguna pemilik sesi yang bisa mengakses preview.

### 4. Apakah saat ini API benar-benar publik untuk konsumsi aplikasi eksternal?
> **TIDAK.** Proteksi proxy cookie domain preview mencegah akses API dari script backend server-to-server lainnya (seperti cURL, Postman, Zapier, Make.com, atau App 2/3/4 yang dideploy di luar).

### 5. Rekomendasi Solusi:
> Dideploy secara terpisah sebagai layanan **Google Cloud Run** mandiri (Public Stateless Compute). Gunakan URL hasil deploy Cloud Run Anda untuk aplikasi luar.

---

## 🛠️ Langkah-Langkah Deployment Mandiri ke Google Cloud Run

### Langkah 1: Persiapan Akun & SDK Google Cloud
1. Pastikan Anda telah menginstal [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) pada komputer lokal Anda.
2. Login ke akun Google Cloud Anda:
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```
3. Set project tujuan Anda di CLI (ganti `YOUR_PROJECT_ID` dengan ID proyek Google Cloud Anda):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

### Langkah 2: Konfigurasi Akses Firebase & Kunci API
Layanan Cloud Run Anda membutuhkan akses ke Firebase Firestore dari Project ID yang sama.
1. Pastikan **Firestore Database** telah diaktifkan di Console Firebase Anda.
2. Server backend didesain untuk otomatis menggunakan **Application Default Credentials (ADC)** saat dideploy di dalam Google Cloud (sehingga Anda tidak perlu melampirkan berkas kunci JSON Service Account yang berisiko tinggi).
3. Pastikan Service Account Default bawaan Cloud Run memiliki role **Cloud Datastore User** atau **Owner** pada IAM Console GCP Anda untuk kelancaran membaca data Firestore.

### Langkah 3: Konfigurasi Environment Variables (`.env` & Cloud Run)
Siapkan variabel lingkungan berikut untuk diinjeksikan saat deployment:
- `GEMINI_API_KEY`: Kunci API Google Gemini Anda (Server-Side Secret).
- `FIREBASE_PROJECT_ID` (opsional): Gunakan jika ID project Firebase berbeda dengan Project GCP Anda.

### Langkah 4: Bangun & Deploy ke Cloud Run
Jalankan satu perintah berikut di direktori root aplikasi untuk mengompilasi proyek secara otomatis menggunakan Dockerfile tepercaya yang telah kami siapkan, mengunggah ke Google Artifact Registry, dan mendeploynya ke Cloud Run secara publik:

```bash
gcloud run deploy alco-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --env-vars="NODE_ENV=production"
```

> **Catatan Port:** Cloud Run akan merutekan lalu lintas HTTPS luar secara otomatis ke port internal `3000` wadah aplikasi Anda.

---

## 🔒 Skema Integrasi Pihak Ketiga (App 2, App 3, App 4)

Setelah proses deploy berhasil, gcloud CLI akan memancarkan **URL endpoint publik baru** Anda (misalnya: `https://alco-api-xyz-uc.a.run.app`).

### Header Otentikasi Wajib:
Semua permintaan dari App 2, 3, dan 4 ke endpoint di bawah ini wajib melampirkan header berikut:
```http
x-api-key: <KUNCI_API_ALCO_ANDA>
```
Atau:
```http
Authorization: Bearer <KUNCI_API_ALCO_ANDA>
```

### URL Target Integrasi:
Berikut adalah visualisasi rute integrasi yang telah disepakati untuk siap dipanggil:

| Metode | Endpoint | Kegunaan | Autentikasi |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/bootstrap` | Daftar semua rute pendukung & Status platform | Bebas |
| **GET** | `/api/health` | Verifikasi kekuatan kunci akses API | Kunci API |
| **GET** | `/api/brands` | Ambil daftar id brand & visual styling workspace | Kunci API |
| **GET** | `/api/projects` | Ambil nama & progres pengerjaan project campaign | Kunci API |
| **GET** | `/api/context/content/:brandId` | Unduh profil analisis Ceruk & Persona target audiens | Kunci API |
| **GET** | `/api/context/ads/:brandId` | Unduh variasi copy visual, CTA, & Hook iklan | Kunci API |
| **GET** | `/api/context/product/:brandId` | Unduh formula pricing, positioning, & bonus penawaran | Kunci API |
| **GET** | `/api/context/copy/:brandId` | Unduh naskah final copywriting iklan siap tayang | Kunci API |

---

### Contoh Uji Panggilan Terdeploy (cURL):
```bash
# Tes Konektivitas & Versi API (Umum)
curl -X GET "https://<URL_CLOUD_RUN_ANDA>/api/bootstrap"

# Ambil Seluruh Data Kerja Campaign Brand (Tertutup)
curl -X GET "https://<URL_CLOUD_RUN_ANDA>/api/context/content/PROJ_ID_DISINI" \
  -H "x-api-key: your_alco_api_key_suffix_here"
```
