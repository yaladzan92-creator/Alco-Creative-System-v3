# 🚀 ALCO API - Panduan Deployment Google Cloud Run

Panduan ini mendokumentasikan langkah demi langkah untuk mendeploy backend server **ALCO** secara terpisah ke salah satu kontainer statistik publik (**Google Cloud Run**). Setelah dideploy, domain tersebut dapat diakses secara global oleh **App 2, App 3, dan App 4** bebas dari batasan otentikasi preview sandbox Google AI Studio.

---

## 🔍 Audit & Kelayakan Berkas Proyek

Proyek ini telah dikonfigurasi dengan struktur siap-pakai untuk produksi:
1. **Dockerfile**: Ada (Menggunakan Node.js, melakukan compile Vite/esbuild secara otomatis, dan menyajikan port `3000`/`process.env.PORT`).
2. **.dockerignore**: Ada (Mencegah pengunggahan berkas lokal `node_modules`, `dist`, dan rincian sensitif lainnya).
3. **package.json**: Memiliki skrip `"build"` dan `"start"` terintegrasi yang andal.
4. **server.ts**: Terpaut dinamis ke `process.env.PORT` dan siap membaca kredensial Firestore langsung dari environment variabel.

---

## 🛠️ Langkah-Langkah Deployment Mandiri ke Google Cloud Run

Gunakan perintah terminal berikut langsung dari komputer lokal Anda untuk meng-upload dan mendeploy layanan:

### Langkah 1: Autentikasi Google Cloud SDK
```bash
gcloud auth login
```

### Langkah 2: Mengatur Proyek Target GCP
Ganti `PROJECT_ID` dengan ID proyek Google Cloud aktif Anda:
```bash
gcloud config set project PROJECT_ID
```

### Langkah 3: Membuat Docker Image Menggunakan Cloud Build
Jalankan perintah ini di direktori root program untuk mengompilasi kontainer di server Google Cloud:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/alco-api
```

### Langkah 4: Deploy Image ke Cloud Run
Perintah berikut mendeploy kontainer Anda secara publik (`--allow-unauthenticated`) dan mengembalikan tautan domain HTTP eksternal Anda:
```bash
gcloud run deploy alco-api \
  --image gcr.io/PROJECT_ID/alco-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

---

## 🔑 Kebutuhan Environment Variables

Saat melakukan deployment di Cloud Run (melalui Konsol GCP -> Edit & Deploy New Revision, atau disuntikkan saat perintah deploy CLI), pastikan Anda mengatur variabel-variabel lingkungan berikut:

| Nama Variabel | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode server berjalan | `production` |
| `GEMINI_API_KEY` | Kunci API aslinya untuk generator salinan iklan | `AIzaSyB...` |
| `FIREBASE_PROJECT_ID` | Project ID tempat data Firestore disimpan | `id-proyek-firebase-anda` |
| `FIREBASE_CLIENT_EMAIL`| Email akun layanan untuk izin admin | `service@project.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Kunci Privat Akun Layanan Firebase (Menggunakan tanda kutip) | `"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\\n-----END PRIVATE KEY-----\n"` |
| `FIRESTORE_DATABASE_ID`| (Opsional) Nama custom database jika tidak memakai `default` | `database-name` |

---

## 📡 Daftar Endpoint Publik Terbuka

Setelah dideploy, endpoint-endpoint berikut siap melayani aplikasi eksternal (App 2, App 3, App 4) dengan menyertakan Header API (`x-api-key: your_api_key`):

*   **GET** `/api/bootstrap` – Menampilkan status platform & kamus rute integrasi (Akses Bebas)
*   **GET** `/api/health` – Mengetahui denyut jantung server alco (Butuh Kunci API)
*   **GET** `/api/brands` – Mengunduh skema branding yang terkonfigurasi (Butuh Kunci API)
*   **GET** `/api/projects` – Mengunduh daftar project campaign aktif (Butuh Kunci API)
*   **GET** `/api/context/content/:brandId` – Mengunduh segmentasi market & target (Butuh Kunci API)
*   **GET** `/api/context/ads/:brandId` – Mengunduh sudut pandang penawaran & varian ad copy (Butuh Kunci API)
*   **GET** `/api/context/product/:brandId` – Mengunduh taktik harga, penempatan produk, dll (Butuh Kunci API)
*   **GET** `/api/context/copy/:brandId` – Mengunduh salinan copywriting iklan siap tayang (Butuh Kunci API)

---

## ✅ Checklist Verifikasi Pasca-Deployment

Setelah command mendeploy berhasil memancarkan URL produksi baru Anda (misal: `https://alco-api-abc-uc.a.run.app`), lakukan tes koneksi mandiri berikut menggunakan cURL atau Postman:

1. **Uji Koneksi Publik `/api/bootstrap`**
   ```bash
   curl -i "https://<URL_CLOUD_RUN_ANDA>/api/bootstrap"
   ```
   *Ekspektasi*: Mengembalikan status `200 OK` dengan payload detail JSON berisi daftar rute.

2. **Uji Jantung API Terproteksi `/api/health`**
   ```bash
   curl -i "https://<URL_CLOUD_RUN_ANDA>/api/health" \
     -H "x-api-key: your_alco_api_key_suffix_here"
   ```
   *Ekspektasi*: `200 OK` dengan status "Sistem API Alco berjalan dengan baik."

3. **Uji Penolakan API Tanpa Kunci**
   ```bash
   curl -i "https://<URL_CLOUD_RUN_ANDA>/api/health"
   ```
   *Ekspektasi*: `401 Unauthorized` dengan pesan "API key diperlukan."
