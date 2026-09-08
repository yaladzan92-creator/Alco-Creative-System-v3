/**
 * ALCO Creative System — Client License Verifier & Storage
 * Format: ALCO-LIC-v1.<payload-base64url>.<signature-hex>
 * Target App ID: alco-creative-system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const TARGET_APP_ID = 'alco-creative-system';
const SUPPORTED_LICENSE_VERSIONS = ['1', '1.0', 'v1', 'ALCO-LIC-v1'];

// Public key configuration (64 hex characters = 32 bytes raw Ed25519 public key)
// In production, populate process.env.ALCO_LICENSE_PUBLIC_KEY or place in license-config.json
const DEFAULT_PUBLIC_KEY = process.env.ALCO_LICENSE_PUBLIC_KEY || '0000000000000000000000000000000000000000000000000000000000000000';

const STATUS_CODES = {
  LICENSE_VALID: 'LICENSE_VALID',
  NO_LICENSE: 'NO_LICENSE',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  WRONG_DEVICE: 'WRONG_DEVICE',
  WRONG_APP: 'WRONG_APP',
  EXPIRED_LICENSE: 'EXPIRED_LICENSE',
  MALFORMED_LICENSE: 'MALFORMED_LICENSE',
  UNSUPPORTED_LICENSE_VERSION: 'UNSUPPORTED_LICENSE_VERSION',
};

/**
 * Generate privacy-conscious, hardware-bound Device ID from stable system traits
 */
function generateDeviceId() {
  const traits = [
    process.platform,
    process.arch,
    os.hostname(),
    os.homedir(),
    os.cpus()?.[0]?.model || '',
    os.totalmem(),
  ];

  try {
    const nets = os.networkInterfaces();
    const macs = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          macs.push(net.mac);
        }
      }
    }
    macs.sort();
    if (macs.length > 0) traits.push(macs.join(','));
  } catch (err) {
    // Ignore network interface access errors
  }

  const rawString = traits.join('|');
  const hashHex = crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 32).toUpperCase();
  return `ALCO-DEV-${hashHex}`;
}

/**
 * Generate official Request Code format for ALCO License Generator
 */
function generateRequestCode(deviceId) {
  const payload = {
    appId: TARGET_APP_ID,
    deviceId: deviceId || generateDeviceId(),
    requestId: 'REQ-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
    version: 'v1',
    requestedAt: new Date().toISOString(),
  };

  const jsonStr = JSON.stringify(payload);
  const base64Url = Buffer.from(jsonStr, 'utf-8').toString('base64url');
  return `ALCO-REQ-v1.${base64Url}`;
}

/**
 * Deterministic Canonical JSON Serializer
 * Ensures exact key ordering and canonical byte representations for Ed25519 verification
 */
function canonicalizeJSON(val) {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(item => canonicalizeJSON(item)).join(',') + ']';
  }
  const keys = Object.keys(val)
    .filter(k => val[k] !== undefined && typeof val[k] !== 'function' && typeof val[k] !== 'symbol')
    .sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalizeJSON(val[k]));
  return '{' + pairs.join(',') + '}';
}

/**
 * Verify Ed25519 signature natively using Node crypto module
 */
function verifyEd25519Signature(canonicalDataStr, signatureHex, publicKeyHex) {
  try {
    if (!signatureHex || typeof signatureHex !== 'string' || signatureHex.length !== 128) {
      return false;
    }
    if (!publicKeyHex || typeof publicKeyHex !== 'string' || publicKeyHex.length !== 64) {
      return false;
    }

    const signatureBuffer = Buffer.from(signatureHex, 'hex');
    const rawPublicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

    // SPKI DER prefix for 32-byte Ed25519 public key
    const spkiDerPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const spkiDer = Buffer.concat([spkiDerPrefix, rawPublicKeyBuffer]);

    const publicKeyObj = crypto.createPublicKey({
      key: spkiDer,
      format: 'der',
      type: 'spki',
    });

    const dataBuffer = Buffer.from(canonicalDataStr, 'utf-8');
    return crypto.verify(null, dataBuffer, publicKeyObj, signatureBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Full Strict License Verification
 */
function verifyLicenseString(rawLicenseKey, currentDeviceId, publicKeyHex = DEFAULT_PUBLIC_KEY) {
  if (!rawLicenseKey || typeof rawLicenseKey !== 'string') {
    return { status: STATUS_CODES.NO_LICENSE, error: 'Lisensi belum dimasukkan.' };
  }

  const trimmed = rawLicenseKey.trim();
  if (trimmed.length === 0) {
    return { status: STATUS_CODES.NO_LICENSE, error: 'Lisensi belum dimasukkan.' };
  }

  if (trimmed.length > 10000) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Ukuran lisensi melebihi batas.' };
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Format lisensi tidak valid (harus 3 bagian).' };
  }

  const [headerPrefix, payloadB64Url, signatureHex] = parts;

  if (headerPrefix !== 'ALCO-LIC-v1') {
    return { status: STATUS_CODES.UNSUPPORTED_LICENSE_VERSION, error: 'Prefix lisensi tidak dikenali.' };
  }

  if (!signatureHex || signatureHex.length !== 128 || !/^[0-9a-fA-F]{128}$/.test(signatureHex)) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Signature lisensi tidak valid.' };
  }

  let payloadObj = null;
  try {
    const jsonStr = Buffer.from(payloadB64Url, 'base64url').toString('utf-8');
    payloadObj = JSON.parse(jsonStr);
  } catch (err) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Gagal membaca payload lisensi.' };
  }

  if (!payloadObj || typeof payloadObj !== 'object') {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Payload lisensi tidak valid.' };
  }

  // Schema Validation
  const {
    licenseVersion,
    licenseId,
    appId,
    deviceId,
    customerId,
    plan,
    features,
    licenseType,
    expiresAt,
  } = payloadObj;

  if (!licenseVersion || !SUPPORTED_LICENSE_VERSIONS.includes(String(licenseVersion))) {
    return { status: STATUS_CODES.UNSUPPORTED_LICENSE_VERSION, error: 'Versi lisensi tidak didukung.' };
  }

  if (!licenseId || typeof licenseId !== 'string') {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'License ID tidak valid.' };
  }

  if (!appId || typeof appId !== 'string') {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'App ID tidak ditemukan.' };
  }

  if (appId !== TARGET_APP_ID) {
    return { status: STATUS_CODES.WRONG_APP, error: `Lisensi ini diperuntukkan untuk aplikasi '${appId}', bukan '${TARGET_APP_ID}'.` };
  }

  if (!deviceId || typeof deviceId !== 'string') {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Device ID tidak ditemukan dalam lisensi.' };
  }

  if (deviceId !== currentDeviceId) {
    return { status: STATUS_CODES.WRONG_DEVICE, error: 'Lisensi ini terikat untuk perangkat lain.' };
  }

  if (!plan || !['starter', 'pro', 'enterprise', 'custom'].includes(String(plan).toLowerCase())) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Paket lisensi (plan) tidak valid.' };
  }

  if (!Array.isArray(features)) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Daftar fitur (features) tidak valid.' };
  }

  if (!licenseType || !['lifetime', 'subscription'].includes(String(licenseType).toLowerCase())) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Tipe lisensi tidak valid.' };
  }

  // Expiration Rules
  if (licenseType === 'lifetime') {
    if (expiresAt !== null && expiresAt !== undefined) {
      return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Lisensi lifetime tidak boleh memiliki tanggal kadaluarsa.' };
    }
  } else if (licenseType === 'subscription') {
    if (!expiresAt) {
      return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Lisensi berlangganan harus memiliki tanggal kadaluarsa.' };
    }
    const expTime = new Date(expiresAt).getTime();
    if (isNaN(expTime)) {
      return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Format tanggal kadaluarsa tidak valid.' };
    }
    if (expTime <= Date.now()) {
      return { status: STATUS_CODES.EXPIRED_LICENSE, error: 'Masa berlaku lisensi berlangganan telah berakhir.' };
    }
  }

  // Signature verification using canonical payload bytes
  const canonicalStr = canonicalizeJSON(payloadObj);
  const isSigValid = verifyEd25519Signature(canonicalStr, signatureHex, publicKeyHex);

  if (!isSigValid) {
    return { status: STATUS_CODES.INVALID_SIGNATURE, error: 'Tanda tangan digital (signature) lisensi tidak valid atau telah dimodifikasi.' };
  }

  return {
    status: STATUS_CODES.LICENSE_VALID,
    payload: payloadObj,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * License Storage Path
 */
function getStoragePath(userDataDir) {
  return path.join(userDataDir, 'alco-license.json');
}

/**
 * Read and verify stored license key
 */
function evaluateStoredLicense(userDataDir, publicKeyHex = DEFAULT_PUBLIC_KEY) {
  const deviceId = generateDeviceId();
  const requestCode = generateRequestCode(deviceId);
  const storagePath = getStoragePath(userDataDir);

  if (!fs.existsSync(storagePath)) {
    return {
      status: STATUS_CODES.NO_LICENSE,
      deviceId,
      requestCode,
      error: 'Lisensi belum diaktifkan.',
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const fileData = fs.readFileSync(storagePath, 'utf-8');
    const parsed = JSON.parse(fileData);
    const rawLicenseKey = parsed.licenseKey || parsed.rawKey || '';

    const res = verifyLicenseString(rawLicenseKey, deviceId, publicKeyHex);

    return {
      ...res,
      deviceId,
      requestCode,
      rawLicenseKey,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: STATUS_CODES.MALFORMED_LICENSE,
      deviceId,
      requestCode,
      error: 'File lisensi tersimpan rusak atau tidak terbaca.',
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Save new license key to storage
 */
function saveLicenseKey(userDataDir, rawLicenseKey, publicKeyHex = DEFAULT_PUBLIC_KEY) {
  const deviceId = generateDeviceId();
  const requestCode = generateRequestCode(deviceId);
  const storagePath = getStoragePath(userDataDir);

  const verification = verifyLicenseString(rawLicenseKey, deviceId, publicKeyHex);

  if (verification.status === STATUS_CODES.LICENSE_VALID) {
    const record = {
      licenseKey: rawLicenseKey.trim(),
      activatedAt: new Date().toISOString(),
      appId: TARGET_APP_ID,
      deviceId: deviceId,
    };
    fs.writeFileSync(storagePath, JSON.stringify(record, null, 2), 'utf-8');
  }

  return {
    ...verification,
    deviceId,
    requestCode,
    rawLicenseKey: rawLicenseKey.trim(),
  };
}

/**
 * Remove stored license key
 */
function removeStoredLicense(userDataDir) {
  const storagePath = getStoragePath(userDataDir);
  if (fs.existsSync(storagePath)) {
    try {
      fs.unlinkSync(storagePath);
    } catch (err) {
      // Ignore
    }
  }
  const deviceId = generateDeviceId();
  const requestCode = generateRequestCode(deviceId);
  return {
    status: STATUS_CODES.NO_LICENSE,
    deviceId,
    requestCode,
    error: 'Lisensi telah dihapus.',
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  TARGET_APP_ID,
  STATUS_CODES,
  generateDeviceId,
  generateRequestCode,
  canonicalizeJSON,
  verifyEd25519Signature,
  verifyLicenseString,
  evaluateStoredLicense,
  saveLicenseKey,
  removeStoredLicense,
};
