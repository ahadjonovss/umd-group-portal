export type ServiceType =
  | "play-market"
  | "app-store"
  | "google-transfer"
  | "apple-transfer";

export interface PlayMarketFormData {
  // Step 1
  fullName: string;
  phone: string;
  email: string;
  // Step 2
  appName: string;
  shortDescription: string;
  fullDescription: string;
  privacyPolicyUrl: string;
  // Step 3
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
  // Step 4 (files handled separately)
  // Step 5
  testLogin?: string;
  testPassword?: string;
  note?: string;
}

export interface AppStoreFormData {
  // Step 1
  fullName: string;
  phone: string;
  email: string;
  // Step 2
  appName: string;
  subtitle: string;
  fullDescription: string;
  privacyPolicyUrl: string;
  // Step 3
  githubRepoUrl: string;
  githubUsername: string;
  certificatePassword: string;
  bundleId: string;
  // Step 5
  testLogin?: string;
  testPassword?: string;
  note?: string;
}

export interface GoogleTransferFormData {
  fullName: string;
  phone: string;
  email: string;
  developerAccountId: string;
  googlePaymentsProfileId: string;
}

export interface AppleTransferFormData {
  fullName: string;
  phone: string;
  email: string;
  appStoreConnectTeamId: string;
  appleDevAccountEmail: string;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  actualWidth?: number;
  actualHeight?: number;
}
