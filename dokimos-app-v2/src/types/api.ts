/** POST /api/verify body — mirrors TEE POST /verify (subset enforced by BFF). */
export interface VerifyRequest {
  imageBase64: string;
  livePhotoBase64?: string;
  requestedAttributes?: string[];
}

/** Successful response is the attestation payload (see `AttestationData` in dokimos types). */
export interface VerifyErrorBody {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}
