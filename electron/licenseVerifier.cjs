/**
 * ALCO Creative System — Official License Verifier & Storage Client
 * Source of Truth: ALCO License Generator
 * 
 * Standards:
 * - App ID: alco-creative-system
 * - License Format: ALCO-LIC-v1.<Base64UrlPayload>.<SignatureHex>
 * - Payload licenseVersion: EXACT "1.0"
 * - Device ID Format: ALCO-DEV-XXXX-XXXX-XXXX
 * - Request Code Format: ALCO-REQ-v1.<Base64UrlData>.<Checksum>
 * - Public Key: Ed25519 32-byte raw public key (64 hex characters)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const TARGET_APP_ID = 'alco-creative-system';
const EXACT_LICENSE_VERSION = '1.0';

const STATUS_CODES = {
  LICENSE_VALID: 'LICENSE_VALID',
  NO_LICENSE: 'NO_LICENSE',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  WRONG_DEVICE: 'WRONG_DEVICE',
  WRONG_APP: 'WRONG_APP',
  EXPIRED_LICENSE: 'EXPIRED_LICENSE',
  MALFORMED_LICENSE: 'MALFORMED_LICENSE',
  UNSUPPORTED_LICENSE_VERSION: 'UNSUPPORTED_LICENSE_VERSION',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
};

const ALLOWED_PLANS = ['starter', 'pro', 'enterprise', 'custom'];

/**
 * Validates whether a public key string is configured and valid (non-zero 64 hex chars)
 */
function getEffectivePublicKey(overrideKey) {
  const key = overrideKey !== undefined ? overrideKey : process.env.ALCO_LICENSE_PUBLIC_KEY;
  if (!key || typeof key !== 'string') {
    return null;
  }
  const trimmed = key.trim();
  // Must be exactly 64 hex characters (32 bytes raw Ed25519 public key)
  if (trimmed.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return null;
  }
  // Zero key (all zeros) is strictly disallowed
  if (/^0{64}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Validates Device ID against official ALCO standard: ALCO-DEV-XXXX-XXXX-XXXX
 */
function validateDeviceId(deviceId) {
  if (!deviceId || typeof deviceId !== 'string') return false;
  return /^ALCO-DEV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(deviceId.trim());
}

/**
 * Reads machine ID if available in OS
 */
function getOsMachineId() {
  try {
    if (process.platform === 'win32') {
      const output = execFileSync('REG', [
        'QUERY',
        'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography',
        '/v',
        'MachineGuid'
      ], { windowsHide: true, timeout: 2000 }).toString();
      const match = output.match(/MachineGuid\s+REG_SZ\s+(.+)/i);
      const id = match ? match[1].trim() : '';
      if (id) return id;
    }
    if (process.platform === 'linux') {
      if (fs.existsSync('/etc/machine-id')) {
        const id = fs.readFileSync('/etc/machine-id', 'utf8').trim();
        if (id) return id;
      }
      if (fs.existsSync('/var/lib/dbus/machine-id')) {
        const id = fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
        if (id) return id;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Retrieves the primary physical network MAC address
 */
function getPrimaryMac() {
  try {
    const nets = os.networkInterfaces();
    const candidateMacs = [];
    for (const name of Object.keys(nets).sort()) {
      for (const net of nets[name] || []) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          candidateMacs.push(net.mac.toLowerCase());
        }
      }
    }
    if (candidateMacs.length > 0) {
      candidateMacs.sort();
      return candidateMacs[0];
    }
  } catch (_) {}
  return '00:00:00:00:00:00';
}

/**
 * Generates official Device ID: ALCO-DEV-XXXX-XXXX-XXXX
 * Stable across app restarts and updates.
 * Excludes fragile components (hostname, homedir, RAM, full volatile CPU model).
 */
function generateDeviceId() {
  const machineId = getOsMachineId();
  let hardwareId = machineId;
  if (!hardwareId) {
    hardwareId = `${getPrimaryMac()}-${os.arch()}-${os.cpus()[0]?.model || 'cpu'}`;
  }

  const hashHex = crypto.createHash('sha256').update(`ALCO-HW:${hardwareId}:${os.arch()}`).digest('hex').toUpperCase();
  const p1 = hashHex.substring(0, 4);
  const p2 = hashHex.substring(4, 8);
  const p3 = hashHex.substring(8, 12);
  return `ALCO-DEV-${p1}-${p2}-${p3}`;
}

/**
 * Canonical JSON Serializer (RFC 8785 Compliant)
 * Matches src/modules/canonical.ts of ALCO License Generator
 */
function canonicalizeJSON(val, seen = new WeakSet()) {
  if (val === null) {
    return 'null';
  }

  const t = typeof val;

  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }

  if (t === 'number') {
    if (!Number.isFinite(val)) {
      throw new TypeError('Canonical JSON: Cannot serialize non-finite numbers (NaN or Infinity)');
    }
    return JSON.stringify(val);
  }

  if (t === 'string') {
    return JSON.stringify(val);
  }

  if (Array.isArray(val)) {
    if (seen.has(val)) {
      throw new TypeError('Canonical JSON: Circular reference detected');
    }
    seen.add(val);
    const items = val.map(item => {
      if (item === undefined || typeof item === 'symbol' || typeof item === 'function') {
        return 'null';
      }
      return canonicalizeJSON(item, seen);
    });
    seen.delete(val);
    return '[' + items.join(',') + ']';
  }

  if (t === 'object') {
    const target = typeof val.toJSON === 'function'
      ? val.toJSON()
      : val;

    if (target === null) {
      return 'null';
    }

    if (typeof target !== 'object' || Array.isArray(target)) {
      return canonicalizeJSON(target, seen);
    }

    if (seen.has(val)) {
      throw new TypeError('Canonical JSON: Circular reference detected');
    }
    seen.add(target);

    const sortedKeys = Object.keys(target).sort();
    const entries = [];

    for (const key of sortedKeys) {
      const propVal = target[key];
      if (propVal === undefined || typeof propVal === 'function' || typeof propVal === 'symbol') {
        continue;
      }
      entries.push(JSON.stringify(key) + ':' + canonicalizeJSON(propVal, seen));
    }

    seen.delete(target);
    return '{' + entries.join(',') + '}';
  }

  throw new TypeError(`Canonical JSON: Unsupported type ${t}`);
}

/**
 * Computes official checksum for Request Code data
 */
function computeRequestCodeChecksum(base64UrlData) {
  let crc = 0xFFFF;
  for (let i = 0; i < base64UrlData.length; i++) {
    crc ^= base64UrlData.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc = crc >> 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Verifies checksum of Request Code
 */
function verifyRequestCodeChecksum(base64UrlData, checksum) {
  if (!checksum || typeof checksum !== 'string') return false;
  return checksum.trim().toUpperCase() === computeRequestCodeChecksum(base64UrlData);
}

/**
 * Generates official Request Code format: ALCO-REQ-v1.<Base64UrlData>.<Checksum>
 * Payload fields: v, app, dev, cust, name, req, ts, notes
 */
function generateRequestCode(deviceId, options = {}) {
  const targetDevId = deviceId || generateDeviceId();
  const customerId = typeof options.cust === 'string' ? options.cust.trim() : '';
  if (!customerId) {
    throw new Error('customerId/cust wajib diisi sebelum Request Code dibuat.');
  }
  if (!validateDeviceId(targetDevId)) {
    throw new Error(`Cannot encode Request Code: invalid hardware device ID format "${targetDevId}"`);
  }
  const payload = {
    v: EXACT_LICENSE_VERSION,
    app: TARGET_APP_ID,
    dev: targetDevId.trim(),
    cust: customerId,
    name: typeof options.name === 'string' ? options.name.trim() : '',
    req: typeof options.req === 'string' ? options.req.trim() : ('REQ-' + crypto.randomBytes(6).toString('hex').toUpperCase()),
    ts: typeof options.ts === 'string' ? options.ts.trim() : new Date().toISOString(),
    notes: typeof options.notes === 'string' ? options.notes.trim() : '',
  };

  const jsonStr = JSON.stringify(payload);
  const base64UrlData = Buffer.from(jsonStr, 'utf-8').toString('base64url');
  const checksum = computeRequestCodeChecksum(base64UrlData);
  return `ALCO-REQ-v1.${base64UrlData}.${checksum}`;
}

/**
 * Decodes and verifies official Request Code string
 */
function decodeRequestCode(requestCode) {
  if (!requestCode || typeof requestCode !== 'string') {
    return { valid: false, error: 'Request code kosong atau tidak valid.' };
  }
  const parts = requestCode.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Request code harus memiliki 3 segmen (ALCO-REQ-v1.<Base64UrlData>.<Checksum>).' };
  }

  const [prefix, base64UrlData, checksum] = parts;
  if (prefix !== 'ALCO-REQ-v1') {
    return { valid: false, error: 'Prefix Request Code tidak dikenali.' };
  }

  if (!verifyRequestCodeChecksum(base64UrlData, checksum)) {
    return { valid: false, error: 'Checksum Request Code tidak valid.' };
  }

  try {
    const jsonStr = Buffer.from(base64UrlData, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { valid: false, error: 'Payload Request Code tidak valid.' };
    }

    const appId = payload.app || payload.appId;
    const devId = payload.dev || payload.deviceId;
    const reqId = payload.req || payload.requestId;

    return {
      valid: true,
      appId,
      deviceId: devId,
      requestId: reqId,
      payload: {
        v: payload.v || '1.0',
        app: appId,
        dev: devId,
        cust: payload.cust || '',
        name: payload.name || '',
        req: reqId,
        ts: payload.ts || '',
        notes: payload.notes || '',
      },
      checksum,
    };
  } catch (err) {
    return { valid: false, error: 'Gagal membaca payload Request Code.' };
  }
}

/**
 * Strict License Payload Schema Validation
 * Identical behavior to validateLicensePayloadSchema() of ALCO License Generator
 */
function validateLicensePayloadSchema(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'Payload lisensi harus berupa objek JSON valid.' };
  }

  const {
    licenseVersion,
    licenseId,
    appId,
    deviceId,
    customerId,
    customerName,
    plan,
    features,
    licenseType,
    issuedAt,
    expiresAt,
    metadata,
  } = payload;

  // 1. licenseVersion must be EXACT "1.0"
  if (licenseVersion !== EXACT_LICENSE_VERSION) {
    return { valid: false, code: STATUS_CODES.UNSUPPORTED_LICENSE_VERSION, error: `Versi lisensi tidak didukung (harus "${EXACT_LICENSE_VERSION}").` };
  }

  // 2. licenseId: non-empty string
  if (typeof licenseId !== 'string' || licenseId.trim().length === 0 || licenseId.length > 100) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'licenseId tidak valid.' };
  }

  // 3. appId: non-empty string
  if (typeof appId !== 'string' || appId.trim().length === 0 || appId.length > 100) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'appId tidak valid.' };
  }

  // 4. Target appId check
  if (appId !== TARGET_APP_ID) {
    return { valid: false, code: STATUS_CODES.WRONG_APP, error: `Lisensi ini untuk '${appId}', bukan '${TARGET_APP_ID}'.` };
  }

  // 5. deviceId: official format ALCO-DEV-XXXX-XXXX-XXXX
  if (typeof deviceId !== 'string' || !validateDeviceId(deviceId)) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'deviceId lisensi tidak sesuai format resmi ALCO-DEV-XXXX-XXXX-XXXX.' };
  }

  // 6. customerId: non-empty string
  if (typeof customerId !== 'string' || customerId.trim().length === 0 || customerId.length > 100) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'customerId tidak valid.' };
  }

  // 7. customerName: string if provided
  if (customerName !== undefined && typeof customerName !== 'string') {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'customerName harus berupa string.' };
  }

  // 8. plan: starter | pro | enterprise | custom
  if (typeof plan !== 'string' || !ALLOWED_PLANS.includes(plan.toLowerCase())) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'plan lisensi tidak valid.' };
  }

  // 9. features: Array<string> and EVERY item must be string
  if (!Array.isArray(features) || !features.every(f => typeof f === 'string')) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'features harus berupa Array<string>.' };
  }

  // 10. licenseType: lifetime | subscription
  if (licenseType !== 'lifetime' && licenseType !== 'subscription') {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'licenseType harus "lifetime" atau "subscription".' };
  }

  // 11. issuedAt: valid ISO date string
  if (typeof issuedAt !== 'string' || isNaN(new Date(issuedAt).getTime())) {
    return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'issuedAt harus berupa tanggal ISO valid.' };
  }

  // 12. expiresAt rules:
  // - lifetime: licenseType === "lifetime" AND expiresAt === null (undefined strictly rejected)
  if (licenseType === 'lifetime') {
    if (expiresAt !== null) {
      return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'Lisensi lifetime wajib memiliki expiresAt === null.' };
    }
  } else if (licenseType === 'subscription') {
    // - subscription: expiresAt must be valid date string and not expired
    if (typeof expiresAt !== 'string' || isNaN(new Date(expiresAt).getTime())) {
      return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'Lisensi subscription wajib memiliki tanggal expiresAt yang valid.' };
    }
    if (new Date(expiresAt).getTime() <= Date.now()) {
      return { valid: false, code: STATUS_CODES.EXPIRED_LICENSE, error: 'Masa berlaku lisensi subscription telah berakhir.' };
    }
  }

  // 13. metadata: must be a plain object if provided
  if (metadata !== undefined) {
    if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'metadata harus berupa object valid.' };
    }
    for (const key of Object.keys(metadata)) {
      if (!['issuedBy', 'appName', 'notes'].includes(key)) {
        return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'metadata hanya boleh berisi issuedBy, appName, dan notes.' };
      }
      if (metadata[key] !== undefined && typeof metadata[key] !== 'string') {
        return { valid: false, code: STATUS_CODES.MALFORMED_LICENSE, error: 'metadata issuedBy, appName, dan notes harus berupa string jika diisi.' };
      }
    }
  }

  return { valid: true };
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
function verifyLicenseString(rawLicenseKey, currentDeviceId, publicKeyHex) {
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
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Format lisensi tidak valid (harus 3 bagian: ALCO-LIC-v1.<payload>.<sig>).' };
  }

  const [headerPrefix, payloadB64Url, signatureHex] = parts;

  if (headerPrefix !== 'ALCO-LIC-v1') {
    return { status: STATUS_CODES.UNSUPPORTED_LICENSE_VERSION, error: 'Prefix lisensi tidak dikenali.' };
  }

  if (!signatureHex || signatureHex.length !== 128 || !/^[0-9a-fA-F]{128}$/.test(signatureHex)) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Signature lisensi tidak valid (harus 128 karakter hex).' };
  }

  let payloadObj = null;
  try {
    const jsonStr = Buffer.from(payloadB64Url, 'base64url').toString('utf-8');
    payloadObj = JSON.parse(jsonStr);
  } catch (err) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Gagal membaca payload lisensi.' };
  }

  // Validate payload against official schema
  const schemaValidation = validateLicensePayloadSchema(payloadObj);
  if (!schemaValidation.valid) {
    return { status: schemaValidation.code, error: schemaValidation.error };
  }

  // Verify device binding
  if (payloadObj.deviceId !== currentDeviceId) {
    return { status: STATUS_CODES.WRONG_DEVICE, error: 'Lisensi ini terikat untuk perangkat lain.' };
  }

  // Public key verification - fail closed if unconfigured or zero key
  const effectivePublicKey = getEffectivePublicKey(publicKeyHex);
  if (!effectivePublicKey) {
    return {
      status: STATUS_CODES.CONFIGURATION_ERROR,
      error: 'Public key verifikasi lisensi belum dikonfigurasi (ALCO_LICENSE_PUBLIC_KEY tidak ditemukan atau masih default zero key). Hubungi Aladzan Corpora.',
    };
  }

  // Signature verification using canonical payload bytes
  let canonicalStr;
  try {
    canonicalStr = canonicalizeJSON(payloadObj);
  } catch (err) {
    return { status: STATUS_CODES.MALFORMED_LICENSE, error: 'Gagal melakukan kanonikalisasi payload lisensi.' };
  }

  const isSigValid = verifyEd25519Signature(canonicalStr, signatureHex, effectivePublicKey);
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
 * Storage Path for persistent license
 */
function getStoragePath(userDataDir) {
  return path.join(userDataDir, 'alco-license.json');
}

/**
 * Read and re-evaluate stored license key on startup
 */
function evaluateStoredLicense(userDataDir, publicKeyHex) {
  const deviceId = generateDeviceId();
  const requestCode = '';
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
 * Save and verify new license key
 */
function saveLicenseKey(userDataDir, rawLicenseKey, publicKeyHex) {
  const deviceId = generateDeviceId();
  const requestCode = '';
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
  const requestCode = '';
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
  EXACT_LICENSE_VERSION,
  STATUS_CODES,
  ALLOWED_PLANS,
  getEffectivePublicKey,
  validateDeviceId,
  generateDeviceId,
  canonicalizeJSON,
  computeRequestCodeChecksum,
  verifyRequestCodeChecksum,
  generateRequestCode,
  decodeRequestCode,
  validateLicensePayloadSchema,
  verifyEd25519Signature,
  verifyLicenseString,
  evaluateStoredLicense,
  saveLicenseKey,
  removeStoredLicense,
};
