/**
 * ALCO License Verifier — Test Suite
 * Tests all 16 required verification rules and edge cases
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const {
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
console.log('RUNNING ALCO LICENSE VERIFIER SUITE');
console.log('App ID:', TARGET_APP_ID);
console.log('Device ID:', currentDeviceId);
console.log('Public Key Hex:', rawPubHex);
console.log('===================================================\n');

// 1. Fresh Install / No License
const tempUserDataDir = path.join(os.tmpdir(), 'alco-test-userdata-' + Date.now());
fs.mkdirSync(tempUserDataDir, { recursive: true });

const res1 = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(res1.status === STATUS_CODES.NO_LICENSE, 'Test 1: Fresh install returns NO_LICENSE');

// 2. Valid Lifetime License
const validLifetimePayload = {
  licenseVersion: 'v1',
  licenseId: 'LIC-TEST-LIFETIME-001',
  appId: TARGET_APP_ID,
  deviceId: currentDeviceId,
  customerId: 'CUST-001',
  customerName: 'Test Customer Lifetime',
  plan: 'pro',
  features: ['niche_research', 'offer_generator', 'copywriting'],
  licenseType: 'lifetime',
  issuedAt: new Date().toISOString(),
  expiresAt: null,
};
const validLifetimeKey = signPayload(validLifetimePayload, privateKey);
const res2 = verifyLicenseString(validLifetimeKey, currentDeviceId, rawPubHex);
assert(res2.status === STATUS_CODES.LICENSE_VALID, 'Test 2: Valid Lifetime license accepted');

// 3. Valid Subscription License
const validSubPayload = {
  ...validLifetimePayload,
  licenseId: 'LIC-TEST-SUB-002',
  licenseType: 'subscription',
  expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days in future
};
const validSubKey = signPayload(validSubPayload, privateKey);
const res3 = verifyLicenseString(validSubKey, currentDeviceId, rawPubHex);
assert(res3.status === STATUS_CODES.LICENSE_VALID, 'Test 3: Valid Subscription license accepted');

// 4. Expired Subscription
const expiredSubPayload = {
  ...validSubPayload,
  licenseId: 'LIC-TEST-SUB-EXPIRED',
  expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
};
const expiredSubKey = signPayload(expiredSubPayload, privateKey);
const res4 = verifyLicenseString(expiredSubKey, currentDeviceId, rawPubHex);
assert(res4.status === STATUS_CODES.EXPIRED_LICENSE, 'Test 4: Expired Subscription license rejected with EXPIRED_LICENSE');

// 5. Wrong Device ID
const wrongDevicePayload = {
  ...validLifetimePayload,
  licenseId: 'LIC-TEST-WRONG-DEV',
  deviceId: 'ALCO-DEV-WRONGDEVICE1234567890ABCDEF',
};
const wrongDeviceKey = signPayload(wrongDevicePayload, privateKey);
const res5 = verifyLicenseString(wrongDeviceKey, currentDeviceId, rawPubHex);
assert(res5.status === STATUS_CODES.WRONG_DEVICE, 'Test 5: License for wrong device rejected with WRONG_DEVICE');

// 6. Wrong App ID
const wrongAppPayload = {
  ...validLifetimePayload,
  licenseId: 'LIC-TEST-WRONG-APP',
  appId: 'alco-content-engine', // different app
};
const wrongAppKey = signPayload(wrongAppPayload, privateKey);
const res6 = verifyLicenseString(wrongAppKey, currentDeviceId, rawPubHex);
assert(res6.status === STATUS_CODES.WRONG_APP, 'Test 6: License for wrong appId (alco-content-engine) rejected with WRONG_APP');

// 7. Invalid Signature (Signed with different private key)
const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('ed25519');
const invalidSigKey = signPayload(validLifetimePayload, otherPrivateKey);
const res7 = verifyLicenseString(invalidSigKey, currentDeviceId, rawPubHex);
assert(res7.status === STATUS_CODES.INVALID_SIGNATURE, 'Test 7: Signature signed by wrong key rejected with INVALID_SIGNATURE');

// 8. Modified Payload (Tampered JSON base64 string after signing)
const tamperedPayload = { ...validLifetimePayload, plan: 'enterprise' };
const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64url');
const originalParts = validLifetimeKey.split('.');
const tamperedKey = `ALCO-LIC-v1.${tamperedB64}.${originalParts[2]}`;
const res8 = verifyLicenseString(tamperedKey, currentDeviceId, rawPubHex);
assert(res8.status === STATUS_CODES.INVALID_SIGNATURE, 'Test 8: Tampered payload rejected with INVALID_SIGNATURE');

// 9. Malformed Base64URL
const malformedB64Key = `ALCO-LIC-v1.%%%NOT_VALID_BASE64%%%.${originalParts[2]}`;
const res9 = verifyLicenseString(malformedB64Key, currentDeviceId, rawPubHex);
assert(res9.status === STATUS_CODES.MALFORMED_LICENSE, 'Test 9: Malformed base64 payload rejected with MALFORMED_LICENSE');

// 10. Malformed Schema (Missing required field licenseId)
const badSchemaPayload = { ...validLifetimePayload };
delete badSchemaPayload.licenseId;
const badSchemaKey = signPayload(badSchemaPayload, privateKey);
const res10 = verifyLicenseString(badSchemaKey, currentDeviceId, rawPubHex);
assert(res10.status === STATUS_CODES.MALFORMED_LICENSE, 'Test 10: Missing required schema property rejected with MALFORMED_LICENSE');

// 11. Unsupported License Version
const badVersionPayload = { ...validLifetimePayload, licenseVersion: 'v99' };
const badVersionKey = signPayload(badVersionPayload, privateKey);
const res11 = verifyLicenseString(badVersionKey, currentDeviceId, rawPubHex);
assert(res11.status === STATUS_CODES.UNSUPPORTED_LICENSE_VERSION, 'Test 11: Unsupported licenseVersion rejected with UNSUPPORTED_LICENSE_VERSION');

// 12. Save & Restart with Valid License
const saveRes = saveLicenseKey(tempUserDataDir, validLifetimeKey, rawPubHex);
assert(saveRes.status === STATUS_CODES.LICENSE_VALID, 'Test 12a: Successfully saved valid license key');

const evalRes12 = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(evalRes12.status === STATUS_CODES.LICENSE_VALID, 'Test 12b: Re-evaluating stored license on restart returns LICENSE_VALID');

// 13. Restart with Expired License (e.g. active subscription stored previously that became expired over time)
fs.writeFileSync(
  path.join(tempUserDataDir, 'alco-license.json'),
  JSON.stringify({ licenseKey: expiredSubKey, activatedAt: new Date().toISOString(), appId: TARGET_APP_ID, deviceId: currentDeviceId }),
  'utf-8'
);
const evalRes13 = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(evalRes13.status === STATUS_CODES.EXPIRED_LICENSE, 'Test 13: Re-evaluating stored expired license on restart returns EXPIRED_LICENSE');

// 14. Delete Local License
removeStoredLicense(tempUserDataDir);
const evalRes14 = evaluateStoredLicense(tempUserDataDir, rawPubHex);
assert(evalRes14.status === STATUS_CODES.NO_LICENSE, 'Test 14: Removing stored license resets status to NO_LICENSE');

// Clean up temp dir
try {
  fs.rmSync(tempUserDataDir, { recursive: true, force: true });
} catch (e) {}

console.log('\n===================================================');
console.log(`TEST SUMMARY: ${testPassedCount} / ${testTotalCount} PASSED`);
console.log('===================================================');

if (testPassedCount !== testTotalCount) {
  process.exit(1);
}
