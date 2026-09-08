export type LicenseStatusCode =
  | 'LICENSE_VALID'
  | 'NO_LICENSE'
  | 'INVALID_SIGNATURE'
  | 'WRONG_DEVICE'
  | 'WRONG_APP'
  | 'EXPIRED_LICENSE'
  | 'MALFORMED_LICENSE'
  | 'UNSUPPORTED_LICENSE_VERSION'
  | 'CONFIGURATION_ERROR';

export interface RequestCodePayload {
  v: string;
  app: string;
  dev: string;
  cust?: string;
  email?: string;
  name: string;
  req: string;
  ts: string;
  notes?: string;
}

export interface LicensePayload {
  licenseVersion: '1.0' | string;
  licenseId: string;
  appId: string;
  deviceId: string;
  customerId: string;
  customerName?: string;
  plan: 'starter' | 'pro' | 'enterprise' | 'custom';
  features: string[];
  licenseType: 'lifetime' | 'subscription';
  issuedAt: string;
  expiresAt: string | null;
  metadata?: Record<string, any>;
}

export interface LicenseEvaluationResult {
  status: LicenseStatusCode;
  payload?: LicensePayload;
  deviceId: string;
  requestCode: string;
  rawLicenseKey?: string;
  error?: string;
  checkedAt?: string;
}

export interface AlcoLicenseAPI {
  getStatus: () => Promise<LicenseEvaluationResult>;
  getDeviceId: () => Promise<string>;
  getRequestCode: (options: { name: string; email: string; req?: string; ts?: string; notes?: string }) => Promise<string>;
  activate: (licenseKey: string) => Promise<LicenseEvaluationResult>;
  removeLicense: () => Promise<LicenseEvaluationResult>;
  isElectron: boolean;
}

declare global {
  interface Window {
    alcoLicense?: AlcoLicenseAPI;
  }
}
