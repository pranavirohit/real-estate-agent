import { keccak256, stringToHex } from "viem";

/**
 * Deterministic JSON for attribute objects so the same logical attributes always hash identically.
 */
export function stableStringifyAttributes(
  attrs: Record<string, string | boolean>
): string {
  const keys = Object.keys(attrs).sort();
  const sorted: Record<string, string | boolean> = {};
  for (const k of keys) {
    sorted[k] = attrs[k];
  }
  return JSON.stringify(sorted);
}

/**
 * keccak256 hash of UTF-8 bytes of `stableStringifyAttributes(attrs)`.
 * Must match the backend (`src/index.ts`) implementation exactly.
 */
export function computeAttributesHash(
  attrs: Record<string, string | boolean>
): `0x${string}` {
  return keccak256(stringToHex(stableStringifyAttributes(attrs)));
}
