/**
 * ALCO Creative System — Official License Authority Configuration
 * Source of Truth: ALCO License Generator
 *
 * INSTRUKSI KONFIGURASI:
 * Masukkan Public Key resmi (Ed25519 32-byte raw public key dalam format 64 karakter hex)
 * yang diperoleh dari ALCO License Generator (Authority Public Key) ke dalam variabel di bawah ini.
 *
 * Contoh format valid:
 * const ALCO_LICENSE_PUBLIC_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
 *
 * KEAMANAN MUTLAK:
 * 1. HANYA PUBLIC KEY yang boleh ditaruh di sini.
 * 2. JANGAN PERNAH memasukkan Private Key ke file ini atau file manapun di client repository ini.
 * 3. Jika string kosong, zero key, atau format salah, sistem verifikasi lisensi akan fail-closed
 *    dengan status CONFIGURATION_ERROR.
 */

// Official ALCO License Generator Authority Public Key (Ed25519 32-byte raw hex):
const ALCO_LICENSE_PUBLIC_KEY = '7a8e99b9ba45bc9f8847bc9fc4952a87b7fa22a3b0c09a5b22ed939de0ed5162';

module.exports = {
  ALCO_LICENSE_PUBLIC_KEY,
};
