import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AttestationData {
  attributes: Record<string, string | boolean>;
  timestamp: string;
  message: string;
  messageHash: string;
  signature: string;
  signer: string;
}

export interface ShareableAttestation {
  attribute: string;
  value: string | boolean;
  timestamp: string;
  signature: string;
  signer: string;
  message: string;
  messageHash: string;
}

export function encodeAttestation(data: ShareableAttestation): string {
  const json = JSON.stringify(data);
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeAttestation(encoded: string): ShareableAttestation | null {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function truncateSignature(signature: string): string {
  if (!signature || signature.length < 20) return signature;
  return `${signature.slice(0, 10)}...${signature.slice(-8)}`;
}
