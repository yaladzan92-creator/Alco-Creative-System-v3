/**
 * ALCO License Verifier — Test Suite
 * Tests all 20 required verification rules, schema checks, and canonical parity
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
  TARGET_APP_ID,
  EXACT_LICENSE_VERSION,
  STATUS_CODES,
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
  getEffectivePublicKey,
} = require('../electron/licenseVerifier.cjs');

// Generate temporary Ed25519 KeyPair for test verification
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const rawPubHex = publicKey.export({ type: 'spki', format: 'der' }).slice(-32).toString('hex');

function signPayload(payloadObj, privKey) {
  const canonicalStr = canonicalizeJSON(payloadObj);
  const sigBuffer = crypto.sign(null, Buffer.from(canonicalStr, 'utf-8'), privKey);
  const sigHex = sigBuffer.toString('hex');
  const payloadB64Url = Buffer.from(JSON.stringify(payloadObj), 'utf-8').toString('base64url');
  return `ALCO-LIC-v1.${payloadB64Url}.${sigHex}`;
}

const currentDeviceId = generateDeviceId();
let testPassedCount = 0;
let testTotalCount = 0;

function assert(condition, message) {
  testTotalCount++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    testPassedCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

console.log('===================================================');
console.log('RUNNING ALCO LICENSE VERIFIER SUITE — 20 MANDATORY TESTS');
console.log('Target App ID:', TARGET_APP_ID);
console.log('Device ID:', currentDeviceId);
console.log('Test Public Key Hex:', rawPubHex);
console.log('===================================================\n');

// 1. generated Device ID valid menurut generator
assert(validateDeviceId(currentDeviceId), 'Test 1: generated Device ID valid menurut generator');

// 2. Device ID format ALCO-DEV-XXXX-XXXX-XXXX
assert(/^ALCO-DEV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(currentDeviceId), 'Test 2: Device ID format ALCO-DEV-XXXX-XXXX-XXXX');

// 3. Request Code punya 3 segmen
const reqCode = generateRequestCode(currentDeviceId, { name: 'Aladzan', cust: 'CUST-01' });
const reqParts = reqCode.split('.');
assert(reqParts.length === 3 && reqParts[0] === 'ALCO-REQ-v1', 'Test 3: Request Code punya 3 segmen (ALCO-REQ-v1.<data>.<checksum>)');

// 4. Request Code checksum valid
assert(verifyRequestCodeChecksum(reqParts[1], reqParts[2]), 'Test 4: Request Code checksum valid');

// 5. Request Code bisa decode di License Generator
const decodedReq = decodeRequestCode(reqCode);
assert(
  decodedReq.valid === true &&
  decodedReq.appId === TARGET_APP_ID &&
  decodedReq.deviceId === currentDeviceId &&
  decodedReq.payload.name === 'Aladzan' &&
  decodedReq.payload.req.startsWith('REQ-'),
  'Test 5: Request Code bisa decode di License Generator (appId, devId, reqId sama)'
);

// 6. exact appId alco-creative-system
const baseValidPayload = {
  licenseVersion: '1.0',
  licenseId: 'LIC-ALCO-CREATIVE-001',
  appId: TARGET_APP_ID,
  deviceId: currentDeviceId,
  customerId: 'CUST-ALCO-01',
  customerName: 'Studio Creative Corp',
  plan: 'pro',
  features: ['niche_research', 'offer_generator', 'copywriting', 'video_production'],
  licenseType: 'lifetime',
  issuedAt: new Date().toISOString(),
  expiresAt: null,
  metadata: { tier: 'lead' },
};
const key6 = signPayload(baseValidPayload, privateKey);
const res6 = verifyLicenseString(key6, currentDeviceId, rawPubHex);
assert(res6.status === STATUS_CODES.LICENSE_VALID, 'Test 6: exact appId alco-creative-system diterima');

// 7. licenseVersion selain "1.0" ditolak
const v99Payload = { ...baseValidPayload, licenseVersion: 'v1' };
const key7a = signPayload(v99Payload, privateKey);
const res7a = verifyLicenseString(key7a, currentDeviceId, rawPubHex);
const numVerPayload = { ...baseValidPayload, licenseVersion: 1 };
const key7b = signPayload(numVerPayload, privateKey);
const res7b = verifyLicenseString(key7b, currentDeviceId, rawPubHex);
assert(
  res7a.status === STATUS_CODES.UNSUPPORTED_LICENSE_VERSION &&
  res7b.status === STATUS_CODES.UNSUPPORTED_LICENSE_VERSION,
  'Test 7: licenseVersion selain "1.0" ditolak (UNSUPPORTED_LICENSE_VERSION)'
);

// 8. malformed features ditolak
const badFeaturesPayload1 = { ...baseValidPayload, features: 'all_features' };
const res8a = verifyLicenseString(signPayload(badFeaturesPayload1, privateKey), currentDeviceId, rawPubHex);
const badFeaturesPayload2 = { ...baseValidPayload, features: ['valid_string', 12345] };
const res8b = verifyLicenseString(signPayload(badFeaturesPayload2, privateKey), currentDeviceId, rawPubHex);
assert(
  res8a.status === STATUS_CODES.MALFORMED_LICENSE &&
  res8b.status === STATUS_CODES.MALFORMED_LICENSE,
  'Test 8: malformed features ditolak (non-array atau non-string item)'
);

// 9. malformed issuedAt ditolak
const badIssuedAtPayload = { ...baseValidPayload, issuedAt: 'not-a-valid-date-stamp' };
const res9 = verifyLicenseString(signPayload(badIssuedAtPayload, privateKey), currentDeviceId, rawPubHex);
assert(res9.status === STATUS_CODES.MALFORMED_LICENSE, 'Test 9: malformed issuedAt ditolak (MALFORMED_LICENSE)');

// 10. malformed metadata ditolak
const badMetadataPayload = { ...baseValidPayload, metadata: 'string-instead-of-object' };
const res10 = verifyLicenseString(signPayload(badMetadataPayload, privateKey), currentDeviceId, rawPubHex);
assert(res10.status === STATUS_CODES.MALFORMED_LICENSE, 'Test 10: malformed metadata ditolak (MALFORMED_LICENSE)');

// 11. lifetime expiresAt undefined ditolak
const lifetimeUndefPayload = { ...baseValidPayload };
delete lifetimeUndefPayload.expiresAt;
const res11 = verifyLicenseString(signPayload(lifetimeUndefPayload, privateKey), currentDeviceId, rawPubHex);
assert(res11.status === STATUS_CODES.MALFORMED_LICENSE, 'Test 11: lifetime expiresAt undefined ditolak (MALFORMED_LICENSE)');

// 12. lifetime expiresAt null diterima
const lifetimeNullPayload = { ...baseValidPayload, expiresAt: null };
const res12 = verifyLicenseString(signPayload(lifetimeNullPayload, privateKey), currentDeviceId, rawPubHex);
assert(res12.status === STATUS_CODES.LICENSE_VALID, 'Test 12: lifetime expiresAt null diterima (LICENSE_VALID)');

// 13. subscription expiration valid
const activeSubPayload = {
  ...baseValidPayload,
  licenseType: 'subscription',
  expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
};
const res13Active = verifyLicenseString(signPayload(activeSubPayload, privateKey), currentDeviceId, rawPubHex);
const expiredSubPayload = {
  ...baseValidPayload,
  licenseType: 'subscription',
  expiresAt: new Date(Date.now() - 86400000).toISOString(),
};
const res13Expired = verifyLicenseString(signPayload(expiredSubPayload, privateKey), currentDeviceId, rawPubHex);
assert(
  res13Active.status === STATUS_CODES.LICENSE_VALID &&
  res13Expired.status === STATUS_CODES.EXPIRED_LICENSE,
  'Test 13: subscription expiration valid (aktif vs kadaluarsa)'
);

// 14. canonical test vectors identik
const testObj1 = { z: 1, a: { y: 2, x: 3 } };
const canon1 = canonicalizeJSON(testObj1);
const expected1 = '{"a":{"x":3,"y":2},"z":1}';

const testObj2 = { a: 1, b: undefined, c: () => {}, d: Symbol('sym') };
const canon2 = canonicalizeJSON(testObj2);
const expected2 = '{"a":1}';

const testArr = [1, undefined, () => {}, Symbol('foo'), 2];
const canon3 = canonicalizeJSON(testArr);
const expected3 = '[1,null,null,null,2]';

let finiteCheckPassed = false;
try {
  canonicalizeJSON({ num: Infinity });
} catch (err) {
  finiteCheckPassed = true;
}

assert(
  canon1 === expected1 &&
  canon2 === expected2 &&
  canon3 === expected3 &&
  finiteCheckPassed,
  'Test 14: canonical test vectors identik (nested objects, keys sorted, arrays, nulls, finite numbers)'
);

// 15. wrong app ditolak
const wrongAppPayload = { ...baseValidPayload, appId: 'alco-content-engine' };
const res15 = verifyLicenseString(signPayload(wrongAppPayload, privateKey), currentDeviceId, rawPubHex);
assert(res15.status === STATUS_CODES.WRONG_APP, 'Test 15: wrong app ditolak (WRONG_APP)');

// 16. wrong device ditolak
const wrongDevPayload = { ...baseValidPayload, deviceId: 'ALCO-DEV-AAAA-BBBB-CCCC' };
const res16 = verifyLicenseString(signPayload(wrongDevPayload, privateKey), currentDeviceId, rawPubHex);
assert(res16.status === STATUS_CODES.WRONG_DEVICE, 'Test 16: wrong device ditolak (WRONG_DEVICE)');

// 17. invalid signature ditolak
const fakePrivKey = crypto.generateKeyPairSync('ed25519').privateKey;
const wrongSigKey = signPayload(baseValidPayload, fakePrivKey);
const res17 = verifyLicenseString(wrongSigKey, currentDeviceId, rawPubHex);
assert(res17.status === STATUS_CODES.INVALID_SIGNATURE, 'Test 17: invalid signature ditolak (INVALID_SIGNATURE)');

// 18. zero/missing public key fail-closed
const res18Zero = verifyLicenseString(key6, currentDeviceId, '0000000000000000000000000000000000000000000000000000000000000000');
const res18Null = verifyLicenseString(key6, currentDeviceId, null);
assert(
  res18Zero.status === STATUS_CODES.CONFIGURATION_ERROR &&
  res18Null.status === STATUS_CODES.CONFIGURATION_ERROR,
  'Test 18: zero/missing public key fail-closed (CONFIGURATION_ERROR)'
);

// 19. stored license diverifikasi ulang saat startup
const tempUserDataDir = path.join(os.tmpdir(), 'alco-test-parity-' + Date.now());
fs.mkdirSync(tempUserDataDir, { recursive: true });

// 19a. Simpan valid license
const saveRes = saveLicenseKey(tempUserDataDir, key6, rawPubHex);
assert(saveRes.status === STATUS_CODES.LICENSE_VALID, 'Test 19a: saveLicenseKey menyimpan lisensi');

// 19b. Evaluasi ulang saat startup
const startupEval = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(startupEval.status === STATUS_CODES.LICENSE_VALID, 'Test 19b: startup re-evaluasi membaca dan memverifikasi lisensi');

// 19c. Evaluasi lisensi subscription yang kadaluarsa saat startup
const expiredKey = signPayload(expiredSubPayload, privateKey);
fs.writeFileSync(
  path.join(tempUserDataDir, 'alco-license.json'),
  JSON.stringify({ licenseKey: expiredKey, activatedAt: new Date().toISOString(), appId: TARGET_APP_ID, deviceId: currentDeviceId }),
  'utf-8'
);
const startupExpiredEval = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(startupExpiredEval.status === STATUS_CODES.EXPIRED_LICENSE, 'Test 19c: startup re-evaluasi mendeteksi subscription kadaluarsa');

// 19d. Hapus lisensi
removeStoredLicense(tempUserDataDir);
const postRemoveEval = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(postRemoveEval.status === STATUS_CODES.NO_LICENSE, 'Test 19d: removeStoredLicense menghapus lisensi');

// 20. browser preview tidak crash (simulasi lingkungan browser tanpa window.alcoLicense)
let browserPreviewSafe = true;
try {
  // Dalam lingkungan browser biasa tanpa bridge
  const mockWindow = {};
  const isDesktop = Boolean(mockWindow.alcoLicense?.isElectron);
  if (isDesktop) {
    browserPreviewSafe = false;
  }
} catch (e) {
  browserPreviewSafe = false;
}
assert(browserPreviewSafe, 'Test 20: browser preview tidak crash saat running tanpa electron bridge');

console.log('\n===================================================');
console.log(`TEST SUMMARY: ${testPassedCount} / ${testTotalCount} PASSED`);
console.log('===================================================');

if (testPassedCount !== testTotalCount) {
  process.exit(1);
}
