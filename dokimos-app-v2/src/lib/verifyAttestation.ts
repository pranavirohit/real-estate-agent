import { verifyMessage } from "viem";
import { DEFAULT_EIGEN_APP_ID } from "./eigenConstants";
import { computeAttributesHash } from "./attestationAttributesHash";

export { DEFAULT_EIGEN_APP_ID };

export type DokimosAttestationInput = {
  message: string;
  signature: `0x${string}`;
  signer: `0x${string}`;
  attributes?: Record<string, string | boolean>;
  attributesHash?: `0x${string}`;
  tee?: {
    quote?: string;
    mrenclave?: string;
    platform?: string;
  };
  eigen?: {
    appId?: string;
    verificationUrl?: string;
    verified?: boolean;
  };
};

export type VerifyAttestationResult = {
  signatureValid: boolean;
  /** `true` if attributes matched `attributesHash`; `null` if no hash on payload (legacy). */
  hashMatch: boolean | null;
  teeFieldsPresent: boolean;
  eigenMetadataPresent: boolean;
  eigenAppIdMatchesExpected: boolean;
  hashMismatchDetails?: {
    receivedHash: string;
    computedHash: string;
  };
  /**
   * Mock/demo quotes in this repo are not real TDX quotes registered with Eigen AVS.
   * When you run on real EigenCompute hardware, integrate Eigen’s trust / verification docs.
   */
  note: string;
};

/**
 * Verifies: attributes ↔ attributesHash (when present), then EIP-191 signature + Eigen metadata.
 * Full TDX quote verification against Intel + Eigen AVS is out of scope for this helper.
 */
export async function verifyDokimosAttestation(
  attestation: DokimosAttestationInput,
  options?: { expectedEigenAppId?: string }
): Promise<VerifyAttestationResult> {
  const expected =
    options?.expectedEigenAppId ?? DEFAULT_EIGEN_APP_ID;

  let hashMatch: boolean | null = null;
  let hashMismatchDetails:
    | { receivedHash: string; computedHash: string }
    | undefined;

  if (attestation.attributesHash) {
    if (!attestation.attributes) {
      return {
        signatureValid: false,
        hashMatch: false,
        teeFieldsPresent: false,
        eigenMetadataPresent: false,
        eigenAppIdMatchesExpected: false,
        hashMismatchDetails,
        note:
          "Mock TEE quotes in the demo are not verifiable on Eigen AVS. For production, run verification on EigenCompute and follow Eigen docs (Verify trust guarantees).",
      };
    }
    const computed = computeAttributesHash(attestation.attributes);
    if (computed !== attestation.attributesHash) {
      hashMismatchDetails = {
        receivedHash: attestation.attributesHash,
        computedHash: computed,
      };
      const t = attestation.tee;
      const e = attestation.eigen;
      return {
        signatureValid: false,
        hashMatch: false,
        teeFieldsPresent: Boolean(
          t?.quote &&
            t.quote.length > 0 &&
            t?.mrenclave &&
            t.mrenclave.length > 0
        ),
        eigenMetadataPresent: Boolean(e?.appId && e?.verificationUrl),
        eigenAppIdMatchesExpected: Boolean(
          e?.appId && e.appId.toLowerCase() === expected.toLowerCase()
        ),
        hashMismatchDetails,
        note:
          "Mock TEE quotes in the demo are not verifiable on Eigen AVS. For production, run verification on EigenCompute and follow Eigen docs (Verify trust guarantees).",
      };
    }
    hashMatch = true;
  }

  const signatureValid = await verifyMessage({
    address: attestation.signer,
    message: attestation.message,
    signature: attestation.signature,
  });

  const t = attestation.tee;
  const teeFieldsPresent = Boolean(
    t?.quote &&
      t.quote.length > 0 &&
      t?.mrenclave &&
      t.mrenclave.length > 0
  );

  const e = attestation.eigen;
  const eigenMetadataPresent = Boolean(e?.appId && e?.verificationUrl);

  const eigenAppIdMatchesExpected = Boolean(
    e?.appId && e.appId.toLowerCase() === expected.toLowerCase()
  );

  return {
    signatureValid,
    hashMatch,
    teeFieldsPresent,
    eigenMetadataPresent,
    eigenAppIdMatchesExpected,
    hashMismatchDetails,
    note:
      "Mock TEE quotes in the demo are not verifiable on Eigen AVS. For production, run verification on EigenCompute and follow Eigen docs (Verify trust guarantees).",
  };
}
