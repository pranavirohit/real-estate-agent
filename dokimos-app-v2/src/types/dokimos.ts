/** Bottom nav: Vault (home), Activity (requests/history), Settings — matches design (SEQ 06). */
export type DokimosAppTab = "vault" | "activity" | "settings";

export interface AttestationData {
  attributes: Record<string, string | boolean>;
  /** keccak256 (hex) of stable JSON over `attributes` — matches what is signed in `message`. Omitted on legacy stored attestations. */
  attributesHash?: `0x${string}`;
  timestamp: string;
  message: string;
  messageHash: string;
  signature: string;
  signer: string;
  /** Face match vs live selfie when POST /verify included livePhotoBase64. */
  biometricVerification?: {
    faceMatch: boolean;
    confidence: number;
    livenessDetected?: boolean;
    verifiedAt?: string;
    error?: string;
  };
  /** Eigen AVS verification dashboard (when returned by TEE). */
  eigen?: {
    appId?: string;
    verificationUrl?: string;
  };
  /** Set when this attestation was produced by POST /re-verify (stored ID, no new selfie). */
  reVerified?: boolean;
}

export interface VerificationRequest {
  requestId: string;
  verifierId: string;
  verifierName: string;
  verifierEmail: string;
  userEmail: string;
  requestedAttributes: string[];
  workflow?: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
  completedAt?: string;
  attestation: unknown | null;
}

export const STORAGE_ONBOARDING_COMPLETE = "dokimos_onboarding_complete";

/** Set when TEE encrypted+stored the ID image for POST /re-verify (POC). */
export const STORAGE_HAS_ENCRYPTED_ID = "dokimos_has_encrypted_id";

/** Post-verification explainer modal (“How Dokimos protects your identity”); show once per browser profile. */
export const STORAGE_EXPLAINER_SEEN = "dokimos_explainer_seen";

/** First vault visit after onboarding — “What just happened?” modal; show once per browser profile. */
export const STORAGE_POST_VERIFICATION_EXPLAINER_SEEN = "dokimos_post_verification_explainer_seen";

/** Raw ID image base64 from onboarding — used for approve-request and should hydrate app context on load. */
export const STORAGE_ID_IMAGE = "dokimos_stored_image";

/** Live selfie JPEG (data URL) for POST /verify face match — cleared after success. */
export const STORAGE_LIVE_PHOTO = "dokimos_live_photo";

/** Last successful attestation payload (survives refresh). */
export const STORAGE_ATTESTATION = "dokimos_attestation";
