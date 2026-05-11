import type { AttestationData } from "@/types/dokimos";

/** API attestation may include `tee` (not on `AttestationData` interface). */
export type WizardAttestation = AttestationData & {
  tee?: {
    platform?: string;
    quote?: string;
    mrenclave?: string;
    mrsigner?: string;
    tcbStatus?: string;
    reportData?: string;
  };
  eigen?: AttestationData["eigen"] & {
    verifier?: string;
    verified?: boolean;
    verifiedAt?: string;
  };
};
