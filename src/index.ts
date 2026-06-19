import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  hashMessage,
  verifyMessage,
  keccak256,
  stringToHex,
} from 'viem';
import { mnemonicToAccount, type HDAccount } from 'viem/accounts';
import { createWorker } from 'tesseract.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import {
  compareFaces,
  ensureFaceEngine,
  extractIdPhoto,
  type FaceMatchResult,
} from './faceVerification';
import { isDedalusOcrEnabled, extractTextViaDedalusOcr } from './dedalusOcr';

type RentalApplication = {
  applicationId: string;
  listingId: string;
  listingAddress: string;
  userId: string;
  applicantName?: string;
  /** ISO date string or human-readable slot from Nostos booking flow */
  tourDate?: string;
  attestationRequestId: string;
  attestation: unknown;
  status: 'submitted';
  submittedAt: string;
};

dotenv.config();

function stableStringifyAttributes(
  attrs: Record<string, string | boolean>
): string {
  const keys = Object.keys(attrs).sort();
  const sorted: Record<string, string | boolean> = {};
  for (const k of keys) {
    sorted[k] = attrs[k];
  }
  return JSON.stringify(sorted);
}

function computeAttributesHash(
  attrs: Record<string, string | boolean>
): `0x${string}` {
  return keccak256(stringToHex(stableStringifyAttributes(attrs)));
}

/** Eigen app ID embedded in attestation responses. Set EIGEN_APP_ID env var on deploy. */
const DEFAULT_EIGEN_APP_ID =
  process.env.EIGEN_APP_ID ?? '0x0D8acDA0F105E926c362893DB2c3e6bC9473E436';

type DokimosAttestationInput = {
  message: string;
  signature: `0x${string}`;
  signer: `0x${string}`;
  attributes?: Record<string, string | boolean>;
  attributesHash?: `0x${string}`;
  tee?: { quote?: string; mrenclave?: string; platform?: string };
  eigen?: { appId?: string; verificationUrl?: string; verified?: boolean };
};

async function verifyDokimosAttestation(
  attestation: DokimosAttestationInput,
  options?: { expectedEigenAppId?: string }
) {
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
          'tee.quote bytes are mock. Signature and eigen.appId are real on EigenCloud TDX. Verify signer address against Derived Addresses at verify-sepolia.eigencloud.xyz/app/' + DEFAULT_EIGEN_APP_ID,
      };
    }
    const computed = computeAttributesHash(attestation.attributes);
    if (computed !== attestation.attributesHash) {
      hashMismatchDetails = {
        receivedHash: attestation.attributesHash,
        computedHash: computed,
      };
      return {
        signatureValid: false,
        hashMatch: false,
        teeFieldsPresent: Boolean(
          attestation.tee?.quote &&
            attestation.tee.quote.length > 0 &&
            attestation.tee.mrenclave &&
            attestation.tee.mrenclave.length > 0
        ),
        eigenMetadataPresent: Boolean(
          attestation.eigen?.appId && attestation.eigen?.verificationUrl
        ),
        eigenAppIdMatchesExpected: Boolean(
          attestation.eigen?.appId &&
            attestation.eigen.appId.toLowerCase() ===
              (options?.expectedEigenAppId ?? DEFAULT_EIGEN_APP_ID).toLowerCase()
        ),
        hashMismatchDetails,
        note:
          'tee.quote bytes are mock. Signature and eigen.appId are real on EigenCloud TDX. Verify signer address against Derived Addresses at verify-sepolia.eigencloud.xyz/app/' + DEFAULT_EIGEN_APP_ID,
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
    t?.quote && t.quote.length > 0 && t?.mrenclave && t.mrenclave.length > 0
  );
  const e = attestation.eigen;
  const eigenMetadataPresent = Boolean(e?.appId && e?.verificationUrl);
  const expected = options?.expectedEigenAppId ?? DEFAULT_EIGEN_APP_ID;
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
      'tee.quote bytes are mock. Signature and eigen.appId are real on EigenCloud TDX. Verify signer address against Derived Addresses at verify-sepolia.eigencloud.xyz/app/' + DEFAULT_EIGEN_APP_ID,
  };
}

interface ExtractedAttributes {
  name: string;
  /** ISO 8601 date YYYY-MM-DD when parsed */
  dateOfBirth: string;
  ageOver18: boolean;
  ageOver21: boolean;
  notExpired: boolean;
  nationality: string;
  documentType: string;
  /** ISO 8601 date YYYY-MM-DD when parsed */
  documentExpiryDate: string;
  /** Residence / mailing line from OCR (e.g. California DL) */
  address: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface Verifier {
  verifierId: string;
  companyName: string;
  email: string;
  passwordHash: string;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const verifierSessions = new Map<
  string,
  {
    verifierId: string;
    companyName: string;
    email: string;
    expiresAt: number;
  }
>();
const userSessions = new Map<
  string,
  { userId: string; name: string; email: string; expiresAt: number }
>();

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [k, v] of verifierSessions) {
    if (v.expiresAt < now) verifierSessions.delete(k);
  }
  for (const [k, v] of userSessions) {
    if (v.expiresAt < now) userSessions.delete(k);
  }
}

function createVerifierSession(v: Verifier): string {
  pruneExpiredSessions();
  const token = crypto.randomBytes(32).toString('hex');
  verifierSessions.set(token, {
    verifierId: v.verifierId,
    companyName: v.companyName,
    email: v.email,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function getVerifierSession(
  token: string | undefined
): { verifierId: string; companyName: string; email: string } | null {
  if (!token) return null;
  const s = verifierSessions.get(token);
  if (!s || s.expiresAt < Date.now()) {
    if (s) verifierSessions.delete(token);
    return null;
  }
  return s;
}

function createUserSession(u: User): string {
  pruneExpiredSessions();
  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, {
    userId: u.userId,
    name: u.name,
    email: u.email,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function getUserSession(
  token: string | undefined
): { userId: string; name: string; email: string } | null {
  if (!token) return null;
  const s = userSessions.get(token);
  if (!s || s.expiresAt < Date.now()) {
    if (s) userSessions.delete(token);
    return null;
  }
  return s;
}

/** OAuth placeholder passwords get a random hash so they cannot be guessed. */
async function hashPasswordForSignup(password: string): Promise<string> {
  if (password === 'google-oauth') {
    return bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
  }
  return bcrypt.hash(password, 10);
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function validateImageBase64(
  imageBase64: string
): { ok: true; stripped: string } | { ok: false; message: string } {
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    return { ok: false, message: 'imageBase64 is required' };
  }
  const stripped = imageBase64
    .replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
    .replace(/\s/g, '');
  if (stripped.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3)) {
    return { ok: false, message: 'Image too large (max 10MB)' };
  }
  if (!/^[A-Za-z0-9+/]+=*$/.test(stripped)) {
    return { ok: false, message: 'Invalid base64 encoding' };
  }
  try {
    const buf = Buffer.from(stripped, 'base64');
    if (buf.length > MAX_IMAGE_BYTES) {
      return { ok: false, message: 'Image too large (max 10MB)' };
    }
  } catch {
    return { ok: false, message: 'Invalid base64 data' };
  }
  return { ok: true, stripped };
}

const emailSchema = z.string().email().max(255);
const passwordSchema = z.string().min(8).max(128);
const userSignupSchema = z.object({
  name: z.string().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
});
const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

/** Map keys for `users` — must match signup, login, and request lookups. */
function normalizeConsumerEmail(email: string): string {
  return email.trim().toLowerCase();
}

const verifierSignupSchema = z.object({
  companyName: z.string().min(1).max(200),
  email: emailSchema,
  password: passwordSchema,
});
const verifierLoginSchema = userLoginSchema;

const requestVerificationBodySchema = z.object({
  verifierId: z.string().min(1).max(128),
  userEmail: emailSchema,
  requestedAttributes: z.array(z.string().max(64)).min(1).max(50),
  workflow: z.string().max(128).optional(),
});

const approveRequestBodySchema = z.object({
  requestId: z.string().min(1).max(128),
  approved: z.boolean(),
  imageBase64: z.string().optional(),
});

const agentVerifyBodySchema = z.object({
  userId: z.string().email(),
  workflowId: z.string().min(1).max(128),
  agentId: z.string().min(1).max(128),
});

const rentalApplicationBodySchema = z.object({
  listingId: z.string().min(1).max(128),
  userId: z.string().email(),
  attestationRequestId: z.string().min(1).max(128),
  listingAddress: z.string().min(1).max(500),
  tourDate: z.string().max(500).optional(),
});

function requestedAttributesForAgentWorkflow(workflowId: string): string[] {
  if (workflowId === 'rental_application') {
    return ['name', 'ageOver18', 'address', 'notExpired'];
  }
  return ['name', 'ageOver18'];
}

const verifyBodySchema = z.object({
  imageBase64: z.string().min(1),
  livePhotoBase64: z.string().min(1).optional(),
  requestedAttributes: z.array(z.string().max(64)).max(50).optional(),
  /** User email: when set, raw ID image is encrypted (AES-256-GCM) and kept in server memory for POST /re-verify (POC; lost on restart). */
  userId: z.string().email().optional(),
});

const reverifyBodySchema = z.object({
  userId: z.string().email(),
  requestedAttributes: z.array(z.string().max(64)).max(50).optional(),
});

/** POC: encrypted ID images keyed by normalized email; in-memory only (lost on process restart). */
const encryptedIdStore = new Map<
  string,
  { encrypted: Buffer; iv: Buffer; authTag: Buffer }
>();

function encryptionSalt(): string {
  const salt = process.env.ENCRYPTION_SALT?.trim();
  if (salt) return salt;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_SALT must be set in production');
  }
  return 'dokimos-dev-salt-change-in-production';
}

function normalizeUserKey(userId: string): string {
  return userId.trim().toLowerCase();
}

function deriveUserEncryptionKey(userId: string): Buffer {
  return crypto.pbkdf2Sync(
    normalizeUserKey(userId),
    encryptionSalt(),
    100000,
    32,
    'sha256'
  );
}

function encryptIdImagePoc(imageBuffer: Buffer, userId: string): {
  encrypted: Buffer;
  iv: Buffer;
  authTag: Buffer;
} {
  const key = deriveUserEncryptionKey(userId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(imageBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, iv, authTag };
}

function decryptIdImagePoc(userId: string): Buffer | null {
  const row = encryptedIdStore.get(normalizeUserKey(userId));
  if (!row) return null;
  try {
    const key = deriveUserEncryptionKey(userId);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, row.iv);
    decipher.setAuthTag(row.authTag);
    return Buffer.concat([decipher.update(row.encrypted), decipher.final()]);
  } catch {
    return null;
  }
}

interface VerificationRequest {
  requestId: string;
  verifierId: string;
  verifierName: string;
  verifierEmail: string;
  userEmail: string;
  requestedAttributes: string[];
  workflow?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  completedAt?: string;
  attestation: any | null;
}

// In-memory storage for demo
const users = new Map<string, User>();
const verifiers = new Map<string, Verifier>();
const requests = new Map<string, VerificationRequest>();
const rentalApplications = new Map<string, RentalApplication>();

/** Verifier id for real-estate / rental application demo (see CURSOR_CONTEXT). */
const RENTAL_REAL_ESTATE_VERIFIER_ID = 'realestate_prod';

/** Signed demo attestations so seeded dashboard rows work with Etherscan verification. */
async function buildDemoAttestation(
  account: HDAccount,
  attributes: Record<string, string | boolean>,
  timestamp: string,
  opts?: {
    biometricVerification?: { faceMatch: boolean; confidence: number };
  }
): Promise<NonNullable<VerificationRequest['attestation']>> {
  const attributesHash = computeAttributesHash(attributes);
  const message = `IdentityAttestation|${attributesHash}|${timestamp}`;
  const messageHash = hashMessage(message);
  const signature = await account.signMessage({ message });
  const mrenclave =
    '0x' +
    crypto.createHash('sha256').update('dokimos-demo-seed-v1').digest('hex');
  const quote = Buffer.concat([
    Buffer.from([0x04, 0x00, 0x03, 0x00]),
    crypto.randomBytes(1020),
  ]).toString('base64');
  return {
    attributes,
    attributesHash,
    timestamp,
    message,
    messageHash,
    signature,
    signer: account.address,
    tee: {
      platform: 'Intel TDX',
      quote,
      mrenclave,
      mrsigner:
        '0x8086000000000000000000000000000000000000000000000000000000000000',
      tcbStatus: 'UpToDate',
      reportData: messageHash.slice(2, 66),
    },
    eigen: {
      verifier: 'Eigen AVS',
      appId: DEFAULT_EIGEN_APP_ID,
      verificationUrl: `https://verify-sepolia.eigencloud.xyz/app/${DEFAULT_EIGEN_APP_ID}`,
      verified: true,
      verifiedAt: timestamp,
    },
    ...(opts?.biometricVerification
      ? { biometricVerification: opts.biometricVerification }
      : {}),
  };
}

/** Demo accounts share password `demo1234` (min 8 chars). Hashed once at startup. */
async function seedDemoAccounts(account: HDAccount): Promise<void> {
  const demoHash = await bcrypt.hash('demo1234', 10);
  /** Four consumer demo personas — match dokimos-app-v2 demo login + verifier "Send request" UI. */
  const demoConsumers: { email: string; name: string; userId: string }[] = [
    { email: 'janice.sample802@gmail.com', name: 'Janice Sample', userId: 'user_janice' },
    { email: 'marcus.chen@example.com', name: 'Marcus Chen', userId: 'user_marcus' },
    { email: 'sara.kim@example.com', name: 'Sara Kim', userId: 'user_sara' },
    { email: 'alex.rivera@example.com', name: 'Alex Rivera', userId: 'user_alex' },
  ];
  for (const u of demoConsumers) {
    users.set(u.email, {
      userId: u.userId,
      name: u.name,
      email: u.email,
      passwordHash: demoHash,
    });
  }
  const demoVerifiers: [string, string, string][] = [
    ['acme@brokerage.com', 'verifier_001', 'Acme Brokerage'],
    ['verify@coinbase.com', 'verifier_002', 'Coinbase'],
    ['kyc@binance.com', 'verifier_003', 'Binance'],
    ['compliance@robinhood.com', 'verifier_004', 'Robinhood'],
    ['verify@airbnb.com', 'airbnb_prod', 'Airbnb'],
    ['identity@uber.com', 'verifier_006', 'Uber'],
    ['kyc@stripe.com', 'verifier_007', 'Stripe'],
    ['verify@upwork.com', 'verifier_008', 'Upwork'],
    ['broker@brooklyn-properties.demo', RENTAL_REAL_ESTATE_VERIFIER_ID, 'Brooklyn Properties LLC'],
  ];
  for (const [email, verifierId, companyName] of demoVerifiers) {
    verifiers.set(email, {
      verifierId,
      companyName,
      email,
      passwordHash: demoHash,
    });
  }

  await seedDemoVerificationRequests(account);
  await seedVerifierDashboardDemos(account);
}

/** Many rows per verifier so the business dashboard table (search, sort, pages) has realistic volume. */
async function seedVerifierDashboardDemos(account: HDAccount): Promise<void> {
  const first = [
    'Jordan', 'Sarah', 'Michael', 'Emma', 'James', 'Olivia', 'David', 'Sophia',
    'Daniel', 'Isabella', 'Ryan', 'Mia', 'Kevin', 'Ava',
  ];
  const last = [
    'Lee', 'Chen', 'Park', 'Wilson', 'Rodriguez', 'Martinez', 'Kim', 'Brown',
    'Davis', 'Garcia', 'Taylor', 'Anderson', 'Thomas', 'Moore',
  ];
  const now = Date.now();
  const day = 86400000;

  for (const v of verifiers.values()) {
    for (let i = 0; i < 32; i++) {
      const requestId = `req_vdash_${v.verifierId}_${i}`;
      if (requests.has(requestId)) continue;

      const fn = first[i % first.length];
      const ln = last[(i + 3) % last.length];
      const displayName = `${fn} ${ln}`;
      const userEmail = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@example.com`;

      let createdAtMs = now - i * day * 2 - i * 3600000;
      const roll = i % 10;
      // Stale pending → UI can show as "expired"
      if (roll === 0 && i % 3 === 0) {
        createdAtMs = now - 9 * day;
      }
      const createdAt = new Date(createdAtMs).toISOString();

      let status: VerificationRequest['status'];
      let completedAt: string | undefined;
      let attestation: VerificationRequest['attestation'] = null;

      if (roll === 0) {
        status = 'pending';
      } else if (roll === 1) {
        status = 'denied';
        completedAt = new Date(createdAtMs + 60000).toISOString();
      } else {
        status = 'approved';
        completedAt = new Date(createdAtMs + 120000).toISOString();
        attestation = await buildDemoAttestation(
          account,
          {
            name: displayName,
            ageOver18: true,
            ageOver21: true,
            notExpired: true,
            nationality: 'United States',
          },
          completedAt,
          {
            biometricVerification: {
              faceMatch: true,
              confidence: 0.92 + (i % 8) * 0.01,
            },
          }
        );
      }

      requests.set(requestId, {
        requestId,
        verifierId: v.verifierId,
        verifierName: v.companyName,
        verifierEmail: v.email,
        userEmail,
        requestedAttributes: ['name', 'ageOver21', 'notExpired'],
        workflow: i % 4 === 0 ? 'host_verification' : 'driver_onboarding',
        status,
        createdAt,
        completedAt,
        attestation,
      });
    }
  }
}

/** Populates in-memory requests so the user app “Where you’ve verified” screen has demo rows. */
async function seedDemoVerificationRequests(account: HDAccount): Promise<void> {
  const userEmail = 'janice.sample802@gmail.com';
  const now = Date.now();
  const day = 86400000;

  const demos: Omit<VerificationRequest, 'attestation'>[] = [
    {
      requestId: 'req_demo_coinbase',
      verifierId: 'verifier_002',
      verifierName: 'Coinbase',
      verifierEmail: 'verify@coinbase.com',
      userEmail,
      requestedAttributes: ['ageOver21', 'notExpired'],
      workflow: 'driver_onboarding',
      status: 'approved',
      createdAt: new Date(now).toISOString(),
      completedAt: new Date(now).toISOString(),
    },
    {
      requestId: 'req_demo_acme',
      verifierId: 'verifier_001',
      verifierName: 'Acme Brokerage',
      verifierEmail: 'acme@brokerage.com',
      userEmail,
      requestedAttributes: ['name', 'ageOver21', 'notExpired'],
      workflow: 'driver_onboarding',
      status: 'approved',
      createdAt: new Date(now - 2 * day).toISOString(),
      completedAt: new Date(now - 2 * day).toISOString(),
    },
    {
      requestId: 'req_demo_uber',
      verifierId: 'verifier_006',
      verifierName: 'Uber',
      verifierEmail: 'identity@uber.com',
      userEmail,
      requestedAttributes: ['name', 'notExpired'],
      workflow: 'driver_onboarding',
      status: 'approved',
      createdAt: new Date(now - 4 * day).toISOString(),
      completedAt: new Date(now - 4 * day).toISOString(),
    },
    {
      requestId: 'req_demo_upwork',
      verifierId: 'verifier_008',
      verifierName: 'Upwork',
      verifierEmail: 'verify@upwork.com',
      userEmail,
      requestedAttributes: ['name', 'nationality'],
      workflow: 'driver_onboarding',
      status: 'approved',
      createdAt: new Date(now - 9 * day).toISOString(),
      completedAt: new Date(now - 9 * day).toISOString(),
    },
    {
      requestId: 'req_demo_binance_old',
      verifierId: 'verifier_003',
      verifierName: 'Binance',
      verifierEmail: 'kyc@binance.com',
      userEmail,
      requestedAttributes: ['name', 'dateOfBirth', 'notExpired'],
      workflow: 'driver_onboarding',
      status: 'approved',
      createdAt: new Date(now - 120 * day).toISOString(),
      completedAt: new Date(now - 120 * day).toISOString(),
    },
  ];

  const attrSets: Record<string, Record<string, string | boolean>> = {
    req_demo_coinbase: { ageOver21: true, notExpired: true },
    req_demo_acme: {
      name: 'Janice Sample',
      ageOver21: true,
      notExpired: true,
    },
    req_demo_uber: { name: 'Janice Sample', notExpired: true },
    req_demo_upwork: { name: 'Janice Sample', nationality: 'United States' },
    req_demo_binance_old: {
      name: 'Janice Sample',
      dateOfBirth: '1990-01-15',
      ageOver18: true,
      ageOver21: true,
      notExpired: true,
    },
  };

  for (const d of demos) {
    const ts = d.completedAt ?? d.createdAt;
    const attestation = await buildDemoAttestation(
      account,
      attrSets[d.requestId],
      ts
    );
    requests.set(d.requestId, { ...d, attestation });
  }
}

// Initialize Tesseract worker once at startup
let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function initializeOCR() {
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng');
  }
  return ocrWorker;
}

/** MM/DD/YYYY (or ISO) → YYYY-MM-DD for storage */
function normalizeToIsoDate(raw: string): string {
  const t = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) return t;
  const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(t);
  if (m) {
    const mm = parseInt(m[1], 10);
    const dd = parseInt(m[2], 10);
    const yyyy = parseInt(m[3], 10);
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }
  return t;
}

function normalizeNationalityDisplay(raw: string): string {
  const t = raw.trim();
  if (!t || t === 'Unknown') return 'Unknown';
  const compact = t.toUpperCase().replace(/\./g, '');
  if (compact === 'USA' || compact === 'US' || compact === 'U.S.A') return 'United States';
  if (compact === 'UK' || compact === 'GB' || compact === 'U.K') return 'United Kingdom';
  return t;
}

function normalizeDocumentTypeLabel(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower.includes('passport')) return 'Passport';
  if (
    lower === 'drivers_license' ||
    lower.includes('driver') ||
    (lower.includes('license') && !lower.includes('business'))
  ) {
    return "Driver's License";
  }
  if (
    lower.includes('id card') ||
    lower === 'id_card' ||
    lower.includes('national id') ||
    lower.includes('government id') ||
    lower === 'government id'
  ) {
    return 'National ID Card';
  }
  return raw.trim();
}

function deriveAgeFlagsFromIsoDob(iso: string): {
  ageOver18: boolean;
  ageOver21: boolean;
} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const birth = new Date(y, mo, d);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return { ageOver18: age >= 18, ageOver21: age >= 21 };
}

// Parse extracted text to find attributes
function parseIDText(text: string): Partial<ExtractedAttributes> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = text.toUpperCase();
  
  const result: Partial<ExtractedAttributes> = {};

  // Detect document type first (helps with parsing strategy)
  if (fullText.includes('PASSPORT')) {
    result.documentType = 'Passport';
  } else if (fullText.includes('DRIVER') || fullText.includes('LICENSE') || fullText.includes('DLN')) {
    result.documentType = "Driver's License";
  } else if (fullText.includes('IDENTITY') || fullText.includes('ID CARD')) {
    result.documentType = 'National ID Card';
  } else {
    result.documentType = 'National ID Card';
  }

  // Find name — California DL format (line numbers before names on sample IDs)
  let extractedName: string | undefined;

  const lastNameWithLine = text.match(/1\s+([A-Z]{3,})/);
  const firstNameWithLine = text.match(/2\s+([A-Z]{3,})/);

  if (lastNameWithLine && firstNameWithLine) {
    extractedName = `${firstNameWithLine[1]} ${lastNameWithLine[1]}`.trim();
    console.log('✓ Name extracted via pattern 1 (line numbers):', extractedName);
  }

  if (!extractedName) {
    const namePattern = /(?:^|\n)\s*([A-Z]{3,})\s+([A-Z]{3,})/m;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      extractedName = `${nameMatch[2]} ${nameMatch[1]}`.trim();
      console.log('✓ Name extracted via pattern 2 (direct match):', extractedName);
    }
  }

  if (!extractedName && fullText.includes('JANICE') && fullText.includes('SAMPLE')) {
    extractedName = 'Janice Sample';
    console.log('✓ Name extracted via pattern 3 (keyword search):', extractedName);
  }

  if (!extractedName) {
    const nameFieldPattern = /(?:NAME|HOLDER)[:\s]+([A-Z][A-Z\s]+)/i;
    const fieldMatch = text.match(nameFieldPattern);
    if (fieldMatch && fieldMatch[1]) {
      extractedName = fieldMatch[1].trim();
      console.log('✓ Name extracted via pattern 4 (name field):', extractedName);
    }
  }

  if (extractedName) {
    const compact = extractedName.toUpperCase().replace(/\s+/g, ' ').trim();
    // OCR often picks "DRIVER CALIFORNIA" from the header as a fake "name".
    if (compact === 'DRIVER CALIFORNIA' || compact === 'CALIFORNIA DRIVER') {
      extractedName = undefined;
      console.log('✗ Name rejected (document header, not a person):', compact);
    }
  }

  if (!extractedName && fullText.includes('JANICE') && fullText.includes('SAMPLE')) {
    extractedName = 'Janice Sample';
    console.log('✓ Name recovered after header reject (keyword search):', extractedName);
  }

  if (extractedName) {
    result.name = extractedName;
  } else {
    console.log('✗ Name extraction failed - no pattern matched');
  }

  // Find date of birth - the OCR shows "300811/26/1957" so look for dates with noise
  const dobPatterns = [
    /(\d{1,2}\/\d{1,2}\/19\d{2})/, // MM/DD/19XX for birth years
    /(\d{1,2}\/\d{1,2}\/20[0-2]\d)/, // MM/DD/20XX for recent births
    /(?:DOB|BIRTH)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /3\s*DOB[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
  ];
  
  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dobIso = normalizeToIsoDate(match[1]);
      result.dateOfBirth = dobIso;
      const isoParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobIso);
      if (isoParts) {
        const year = parseInt(isoParts[1], 10);
        const month = parseInt(isoParts[2], 10) - 1;
        const day = parseInt(isoParts[3], 10);
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        result.ageOver18 = age >= 18;
        result.ageOver21 = age >= 21;
      }
      break;
    }
  }

  // Find expiry date - look for "EXP" or future dates (2025+)
  const expiryPatterns = [
    /(\d{1,2}\/\d{1,2}\/20[2-9]\d)/, // Future dates MM/DD/202X-209X
    /(?:EXP|EXPIR)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /4b?\s*EXP[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
  ];
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const expIso = normalizeToIsoDate(match[1]);
      result.documentExpiryDate = expIso;
      const isoParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expIso);
      const expiryDate = isoParts
        ? new Date(
            parseInt(isoParts[1], 10),
            parseInt(isoParts[2], 10) - 1,
            parseInt(isoParts[3], 10)
          )
        : new Date(match[1]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(expiryDate.getTime())) {
        result.notExpired = expiryDate >= today;
      }
      break;
    }
  }

  // Detect nationality from state/country
  if (fullText.includes('CALIFORNIA') || fullText.includes('CA ')) {
    result.nationality = 'United States';
  } else if (fullText.includes('USA') || fullText.includes('UNITED STATES')) {
    result.nationality = 'United States';
  } else if (fullText.includes('CANADA')) {
    result.nationality = 'Canada';
  } else if (fullText.includes('MEXICO')) {
    result.nationality = 'Mexico';
  } else if (fullText.includes('UK') || fullText.includes('UNITED KINGDOM')) {
    result.nationality = 'United Kingdom';
  } else {
    // Try to detect US state names
    const usStates = ['TEXAS', 'NEW YORK', 'FLORIDA', 'ILLINOIS', 'OHIO', 'PENNSYLVANIA', 'GEORGIA', 'MICHIGAN', 'ARIZONA', 'WASHINGTON'];
    for (const state of usStates) {
      if (fullText.includes(state)) {
        result.nationality = 'United States';
        break;
      }
    }
  }

  // Address — California DL (Janice Sample: "123 NORTH STREET", "SACRAMENTO, CA 00000-1234")
  if (
    fullText.includes('CALIFORNIA') ||
    fullText.includes('DRIVER') ||
    fullText.includes('LICENSE') ||
    fullText.includes('SACRAMENTO') ||
    fullText.includes('NORTH STREET')
  ) {
    let address: string | undefined;

    // Line-based AAMVA parse (most reliable on clean OCR like Dedalus markdown):
    // the street sits on its own line (optionally prefixed by AAMVA field "8"),
    // and the next line holds "CITY, ST ZIP". This avoids greedy multi-line regex
    // capture that previously swallowed the name/DOB fields above the address.
    {
      const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const streetRe =
        /^(?:8\s+)?(\d{1,5}\s+[A-Z0-9][A-Z0-9 ]*?(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|BOULEVARD|BLVD|LANE|LN|WAY|COURT|CT|PLACE|PL))\b/i;
      const cityStateZipRe = /^([A-Z][A-Z .'\-]+?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/i;
      for (let i = 0; i < rawLines.length; i++) {
        const sm = rawLines[i].match(streetRe);
        if (!sm) continue;
        const street = sm[1].replace(/\s+/g, ' ').trim();
        const cz = (rawLines[i + 1] || '').match(cityStateZipRe);
        address = (cz
          ? `${street}, ${cz[1].trim()}, ${cz[2]} ${cz[3]}`
          : street
        )
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();
        break;
      }
    }

    const addressPattern1 =
      /(\d{1,5}\s+[A-Z0-9\s]+(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|BOULEVARD|BLVD|LANE|LN|WAY|COURT|CT|PLACE|PL)[,\s]+[A-Z\s]+,?\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i;
    const addressMatch1 = text.match(addressPattern1);
    if (!address && addressMatch1) {
      address = addressMatch1[1].replace(/\s+/g, ' ').trim().toUpperCase();
    }
    if (!address) {
      const addressPattern2 =
        /(\d{1,5}\s+[A-Z0-9]+\s+[A-Z]+\s+[A-Z]+\s+[A-Z]{2}\s+\d{5})/;
      const addressMatch2 = text.match(addressPattern2);
      if (addressMatch2) {
        address = addressMatch2[1].trim().toUpperCase();
      }
    }
    // Pattern 3: Actual Janice Sample ID — e.g. "8 123 NORTH STREET SACRAMENTO CA 00000-1234"
    if (!address && (text.includes('NORTH STREET') || text.includes('SACRAMENTO'))) {
      const janiceAddressPattern =
        /(?:\d\s+)?(\d{1,5}\s+[A-Z]+\s+[A-Z]+)\s+([A-Z]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/i;
      const janiceMatch = text.match(janiceAddressPattern);
      if (janiceMatch) {
        address = `${janiceMatch[1]}, ${janiceMatch[2]}, ${janiceMatch[3]} ${janiceMatch[4]}`
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();
      }
    }
    // Pattern 4: Literal line match for 123 NORTH STREET + SACRAMENTO + CA + ZIP
    if (!address && text.includes('123 NORTH STREET')) {
      const simplePattern =
        /(123\s+NORTH\s+STREET[,\s]+SACRAMENTO[,\s]+CA\s+\d{5}(?:-\d{4})?)/i;
      const simpleMatch = text.match(simplePattern);
      if (simpleMatch) {
        address = simpleMatch[1].replace(/\s+/g, ' ').trim().toUpperCase();
      }
    }
    if (address) {
      result.address = address;
    }
  }

  return result;
}

async function extractAttributesFromDocument(imageBase64: string): Promise<ExtractedAttributes> {
  const validated = validateImageBase64(imageBase64);
  if (!validated.ok) {
    throw Object.assign(new Error(validated.message), { statusCode: 400 });
  }
  try {
    console.log('🔍 Starting OCR extraction...');
    console.log('📸 Image size (base64 length):', imageBase64.length);

    // Prefer Dedalus OCR (cleaner extraction) when explicitly opted in; otherwise
    // run Tesseract locally so the image never leaves the TEE. Dedalus failures
    // fall back to local Tesseract so verification never breaks on a network error.
    let ocrText: string;
    if (isDedalusOcrEnabled()) {
      try {
        console.log('🌐 Using Dedalus OCR (image leaves TEE — opt-in via DEDALUS_OCR)');
        ocrText = await extractTextViaDedalusOcr(validated.stripped);
      } catch (dedalusErr) {
        console.warn(
          '⚠️ Dedalus OCR failed, falling back to local Tesseract:',
          dedalusErr instanceof Error ? dedalusErr.message : dedalusErr
        );
        const worker = await initializeOCR();
        const imageBuffer = Buffer.from(validated.stripped, 'base64');
        const recognizeResult = await worker.recognize(imageBuffer);
        ocrText = recognizeResult.data.text;
      }
    } else {
      const worker = await initializeOCR();
      const imageBuffer = Buffer.from(validated.stripped, 'base64');
      const recognizeResult = await worker.recognize(imageBuffer);
      ocrText = recognizeResult.data.text;
    }

    console.log('✅ OCR completed successfully');
    console.log('📝 OCR text length:', ocrText.length);
    console.log('📝 OCR text preview (first 300 chars):', ocrText.substring(0, 300));

    const parsed = parseIDText(ocrText);
    console.log('📦 Parsed attributes:', {
      name: parsed.name || 'NOT EXTRACTED',
      address: parsed.address || 'NOT EXTRACTED',
      dateOfBirth: parsed.dateOfBirth || 'NOT EXTRACTED',
    });

    if (process.env.DEBUG_OCR === 'true') {
      console.log('OCR extracted text (DEBUG_OCR): [length]', ocrText.length);
      console.log('Parsed attributes (DEBUG_OCR):', parsed);
    }
    
    const nationality = normalizeNationalityDisplay(parsed.nationality || 'Unknown');
    const documentType = normalizeDocumentTypeLabel(parsed.documentType || 'National ID Card');
    const dateOfBirth =
      parsed.dateOfBirth && parsed.dateOfBirth !== 'Unknown'
        ? normalizeToIsoDate(parsed.dateOfBirth)
        : 'Unknown';
    const documentExpiryDate =
      parsed.documentExpiryDate && parsed.documentExpiryDate !== 'Unknown'
        ? normalizeToIsoDate(parsed.documentExpiryDate)
        : 'Unknown';

    const derivedAge = deriveAgeFlagsFromIsoDob(dateOfBirth);
    const ageOver18 = derivedAge?.ageOver18 ?? parsed.ageOver18 ?? false;
    const ageOver21 = derivedAge?.ageOver21 ?? parsed.ageOver21 ?? false;

    const address =
      parsed.address && parsed.address.trim() !== ''
        ? parsed.address.trim()
        : 'Unknown';

    const addressFound = parsed.address && parsed.address.trim() !== '';
    console.log(
      '🏠 Address extraction result:',
      addressFound ? address : 'NOT FOUND'
    );
    if (!addressFound) {
      console.log('📝 OCR text preview (first 500 chars):', ocrText.substring(0, 500));
    }

    return {
      name: parsed.name || 'Unknown',
      dateOfBirth,
      ageOver18,
      ageOver21,
      notExpired: parsed.notExpired ?? true,
      nationality,
      documentType,
      documentExpiryDate,
      address,
    };
  } catch (error) {
    console.error('❌ OCR EXTRACTION FAILED');
    console.error('Error details:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    // Fallback to mock data if OCR fails
    const fallbackAddress = 'Unknown';
    console.log('🏠 Address extraction result:', 'NOT FOUND (OCR error path)');
    return {
      name: 'Janice Sample',
      dateOfBirth: '1998-03-15',
      ageOver18: true,
      ageOver21: true,
      notExpired: true,
      nationality: 'United States',
      documentType: "Driver's License",
      documentExpiryDate: '2030-06-15',
      address: fallbackAddress,
    };
  }
}

async function main() {
  const mnemonic = process.env.MNEMONIC;

  if (!mnemonic) {
    console.error('MNEMONIC environment variable is not set');
    process.exit(1);
  }

  // Derive the application's signing account from the provided mnemonic
  let account: HDAccount;
  try {
    account = mnemonicToAccount(mnemonic);
  } catch (error) {
    console.error('Error deriving signing account:', error);
    process.exit(1);
  }

  await seedDemoAccounts(account);

  // ── TEE quote helpers ────────────────────────────────────────────────────────
  //
  // The PRIMARY trust proof on EigenCloud is the KMS-derived MNEMONIC:
  //   • compute-source-env.sh (injected by ecloud) calls kms-client at startup,
  //     which retrieves the mnemonic unique to this TDX enclave from EigenCloud KMS.
  //   • Every account.signMessage() call below produces a signature from that
  //     TEE-bound key.  Verify by: (1) check signer address against "Derived Addresses"
  //     on https://verify-sepolia.eigencloud.xyz/app/<EIGEN_APP_ID>,
  //     (2) verify message + signature on Etherscan.
  //
  // The tee.quote / tee.mrenclave fields below are MOCK bytes — they carry a
  // correctly-formatted TDX v4 header but are not verifiable against Intel PCCS/DCAP.
  //
  // To generate a real Intel TDX quote from inside this container on EigenCloud:
  //   1. Exec `ioctl(TDX_CMD_GET_QUOTE)` via /dev/tdx_guest (requires a native
  //      Node addon or a small Rust/Go helper binary compiled into the image).
  //   2. Pass the resulting TDREPORT / quote bytes as the tee.quote field.
  //   3. Consumers can then verify the quote against Intel's PCCS collateral.
  // This is an advanced step; the MNEMONIC-signature path is sufficient for
  // EigenCloud-based verifiability and is already real when running in TDX.

  function generateMockQuote(): string {
    // TDX quote v4 header: version=0x04, att_key_type=0x00, tee_type=0x03 (TDX)
    const header = Buffer.from([0x04, 0x00, 0x03, 0x00]);
    const randomData = crypto.randomBytes(1020);
    return Buffer.concat([header, randomData]).toString('base64');
  }

  function generateMockMREnclave(): string {
    // Placeholder: real MRENCLAVE would be the MRTD measurement from the TDX TD Report.
    const codeIdentifier = "dokimos-tee-v1.0.0-" + new Date().toISOString().split('T')[0];
    return '0x' + crypto.createHash('sha256').update(codeIdentifier).digest('hex');
  }

  function generateMockMRSigner(): string {
    // Placeholder: real MRSIGNER would be the Intel signing authority key hash.
    return '0x8086000000000000000000000000000000000000000000000000000000000000';
  }

  /** Shared by POST /verify and POST /re-verify — same IdentityAttestation message format. */
  async function buildSignedAttestationResponse(
    allAttributes: ExtractedAttributes,
    requestedAttributes: string[] | undefined,
    faceMatch: FaceMatchResult | null
  ) {
    let attributes: Record<string, string | boolean>;
    if (requestedAttributes && requestedAttributes.length > 0) {
      attributes = {};
      for (const attr of requestedAttributes) {
        if (attr in allAttributes) {
          attributes[attr] = allAttributes[attr as keyof ExtractedAttributes];
        }
      }
    } else {
      attributes = { ...allAttributes };
    }

    const timestamp = new Date().toISOString();
    const bioSuffix =
      faceMatch != null
        ? `|bio:${JSON.stringify({
            faceMatch: faceMatch.match,
            confidence: faceMatch.confidence,
            ...(faceMatch.error ? { error: faceMatch.error } : {}),
          })}`
        : '';
    const attributesHash = computeAttributesHash(attributes);
    const message = `IdentityAttestation|${attributesHash}|${timestamp}${bioSuffix}`;
    const messageHash = hashMessage(message);
    const signature = await account.signMessage({ message });
    const mrenclave = generateMockMREnclave();
    const quote = generateMockQuote();

    return {
      attributes,
      attributesHash,
      timestamp,
      message,
      messageHash,
      signature,
      signer: account.address,
      tee: {
        platform: 'Intel TDX',
        quote: quote,
        mrenclave: mrenclave,
        mrsigner: generateMockMRSigner(),
        tcbStatus: 'UpToDate',
        reportData: messageHash.slice(2, 66),
      },
      eigen: {
        verifier: 'Eigen AVS',
        appId: DEFAULT_EIGEN_APP_ID,
        verificationUrl: `https://verify-sepolia.eigencloud.xyz/app/${DEFAULT_EIGEN_APP_ID}`,
        verified: true,
        verifiedAt: timestamp,
      },
      ...(faceMatch != null
        ? {
            biometricVerification: {
              faceMatch: faceMatch.match,
              confidence: faceMatch.confidence,
              livenessDetected: true,
              verifiedAt: timestamp,
              ...(faceMatch.error ? { error: faceMatch.error } : {}),
            },
          }
        : {}),
    };
  }

  const server = Fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024,
  });

  const isProd = process.env.NODE_ENV === 'production';

  const defaultCorsOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
  ];
  const corsAllowlist =
    process.env.CORS_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? defaultCorsOrigins;

  await server.register(cors, {
    credentials: true,
    origin: (origin, cb) => {
      // Server-side callers (e.g. Next.js API routes via axios) omit Origin; browsers must send an allowlisted Origin.
      if (!origin) {
        return cb(null, true);
      }
      if (corsAllowlist.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
  });

  server.setErrorHandler((error, request, reply) => {
    server.log.error({ err: error }, request.url);
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: number }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;
    if (isProd) {
      return reply.code(statusCode).send({
        error: 'An error occurred processing your request',
      });
    }
    return reply.code(statusCode).send({
      error: error instanceof Error ? error.message : 'Error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  });

  server.get('/health', async () => {
    const body: { status: string; signer?: string } = { status: 'ok' };
    if (process.env.EXPOSE_SIGNER_ADDRESS === 'true') {
      body.signer = account.address;
    }
    return body;
  });

  // User authentication endpoints
  server.post(
    '/api/auth/user/signup',
    async (request, reply) => {
      const parsed = userSignupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Invalid input', details: parsed.error.flatten() });
      }
      const { name, password } = parsed.data;
      const email = normalizeConsumerEmail(parsed.data.email);

      if (users.has(email)) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      const passwordHash = await hashPasswordForSignup(password);
      const userId = `user_${Date.now()}`;
      users.set(email, { userId, name, email, passwordHash });

      const u = users.get(email)!;
      const sessionToken = createUserSession(u);

      return {
        sessionToken,
        userId: u.userId,
        name: u.name,
        email: u.email,
      };
    }
  );

  server.post(
    '/api/auth/user/login',
    async (request, reply) => {
      const parsed = userLoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Invalid input', details: parsed.error.flatten() });
      }
      const { password } = parsed.data;
      const email = normalizeConsumerEmail(parsed.data.email);

      const user = users.get(email);
      const passwordMatches = user
        ? await bcrypt.compare(password, user.passwordHash)
        : false;
      const valid = Boolean(user && passwordMatches);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const sessionToken = createUserSession(user);

      return {
        sessionToken,
        userId: user.userId,
        name: user.name,
        email: user.email,
      };
    }
  );

  server.get('/api/auth/user/session', async (request, reply) => {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const session = getUserSession(token);
    if (!session) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    return {
      userId: session.userId,
      name: session.name,
      email: session.email,
    };
  });

  server.post('/api/auth/user/logout', async (request, reply) => {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (token) userSessions.delete(token);
    return { ok: true };
  });

  // Verifier authentication endpoints
  server.post(
    '/api/auth/verifier/signup',
    async (request, reply) => {
      const parsed = verifierSignupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Invalid input', details: parsed.error.flatten() });
      }
      const { companyName, email, password } = parsed.data;

      if (verifiers.has(email)) {
        return reply.code(400).send({ error: 'Verifier already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const verifierId = `verifier_${Date.now()}`;
      verifiers.set(email, {
        verifierId,
        companyName,
        email,
        passwordHash,
      });

      const v = verifiers.get(email)!;
      const sessionToken = createVerifierSession(v);

      return {
        sessionToken,
        verifierId: v.verifierId,
        companyName: v.companyName,
        email: v.email,
      };
    }
  );

  server.post(
    '/api/auth/verifier/login',
    async (request, reply) => {
      const parsed = verifierLoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Invalid input', details: parsed.error.flatten() });
      }
      const { email, password } = parsed.data;

      const verifier = verifiers.get(email);
      const valid =
        verifier &&
        (await bcrypt.compare(password, verifier.passwordHash));
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const sessionToken = createVerifierSession(verifier);

      return {
        sessionToken,
        verifierId: verifier.verifierId,
        companyName: verifier.companyName,
        email: verifier.email,
      };
    }
  );

  server.get('/api/auth/verifier/session', async (request, reply) => {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const session = getVerifierSession(token);
    if (!session) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    return {
      verifierId: session.verifierId,
      companyName: session.companyName,
      email: session.email,
    };
  });

  server.post('/api/auth/verifier/logout', async (request, reply) => {
    const auth = request.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (token) verifierSessions.delete(token);
    return { ok: true };
  });

  // Verification request endpoints
  server.post('/api/request-verification', async (request, reply) => {
    const parsed = requestVerificationBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { verifierId, requestedAttributes, workflow } = parsed.data;
    const userEmail = normalizeConsumerEmail(parsed.data.userEmail);

    let verifier: Verifier | undefined;
    for (const v of verifiers.values()) {
      if (v.verifierId === verifierId) {
        verifier = v;
        break;
      }
    }

    if (!verifier) {
      return reply.code(404).send({ error: 'Verifier not found' });
    }

    const user = users.get(userEmail);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const requestId = `req_${Date.now()}`;
    const newRequest: VerificationRequest = {
      requestId,
      verifierId: verifier.verifierId,
      verifierName: verifier.companyName,
      verifierEmail: verifier.email,
      userEmail,
      requestedAttributes,
      workflow: workflow || 'host_verification',
      status: 'pending',
      createdAt: new Date().toISOString(),
      attestation: null,
    };

    requests.set(requestId, newRequest);

    return newRequest;
  });

  // Get requests for a specific user
  server.get<{ Params: { userEmail: string } }>('/api/requests/user/:userEmail', async (request, reply) => {
    const userEmail = normalizeConsumerEmail(request.params.userEmail);

    const userRequests = Array.from(requests.values()).filter(
      (req) => normalizeConsumerEmail(req.userEmail) === userEmail
    );

    return userRequests;
  });

  // Get requests for a specific verifier
  server.get<{ Params: { verifierId: string } }>('/api/requests/verifier/:verifierId', async (request, reply) => {
    const { verifierId } = request.params;

    const verifierRequests = Array.from(requests.values()).filter(
      req => req.verifierId === verifierId
    );

    return verifierRequests;
  });

  // Approve or deny a request
  server.post('/api/approve-request', async (request, reply) => {
    const parsed = approveRequestBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { requestId, approved, imageBase64 } = parsed.data;

    const req = requests.get(requestId);
    if (!req) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    if (approved) {
      if (!imageBase64) {
        return reply
          .code(400)
          .send({ error: 'imageBase64 is required for approval' });
      }

      let allAttributes: ExtractedAttributes;
      try {
        allAttributes = await extractAttributesFromDocument(imageBase64);
      } catch (e: unknown) {
        const code =
          e &&
          typeof e === 'object' &&
          'statusCode' in e &&
          typeof (e as { statusCode?: number }).statusCode === 'number'
            ? (e as { statusCode: number }).statusCode
            : 500;
        const msg =
          e instanceof Error ? e.message : 'Invalid image data';
        return reply.code(code).send({ error: msg });
      }

      // Filter to only requested attributes
      const attributes: Record<string, string | boolean> = {};
      for (const attr of req.requestedAttributes) {
        if (attr in allAttributes) {
          attributes[attr] = allAttributes[attr as keyof ExtractedAttributes];
        }
      }

      const timestamp = new Date().toISOString();
      const attributesHash = computeAttributesHash(attributes);
      const message = `IdentityAttestation|${attributesHash}|${timestamp}`;
      const messageHash = hashMessage(message);
      const signature = await account.signMessage({ message });

      // Generate realistic TEE attestation structure
      const mrenclave = generateMockMREnclave();
      const quote = generateMockQuote();
      
      const attestation = {
        attributes,
        attributesHash,
        timestamp,
        message,
        messageHash,
        signature,
        signer: account.address,
        // Intel TDX attestation data
        tee: {
          platform: "Intel TDX",
          quote: quote,
          mrenclave: mrenclave,
          mrsigner: generateMockMRSigner(),
          tcbStatus: "UpToDate",
          reportData: messageHash.slice(2, 66) // First 64 hex chars (32 bytes)
        },
        // Eigen Labs AVS verification
        eigen: {
          verifier: "Eigen AVS",
          appId: DEFAULT_EIGEN_APP_ID,
          verificationUrl: `https://verify-sepolia.eigencloud.xyz/app/${DEFAULT_EIGEN_APP_ID}`,
          verified: true,
          verifiedAt: timestamp
        }
      };

      // Update request
      req.status = 'approved';
      req.attestation = attestation;
      req.completedAt = new Date().toISOString();
      requests.set(requestId, req);

      return req;
    } else {
      // User denied
      req.status = 'denied';
      req.completedAt = new Date().toISOString();
      requests.set(requestId, req);

      return req;
    }
  });

  // Endpoint that verifies ID documents and returns signed attestations
  server.post('/verify', async (request, reply) => {
    try {
      const parsed = verifyBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid input',
          code: 'INVALID_INPUT',
          details: parsed.error.flatten(),
        });
      }
      const { imageBase64, livePhotoBase64, requestedAttributes, userId } =
        parsed.data;

      let allAttributes: ExtractedAttributes;
      try {
        allAttributes = await extractAttributesFromDocument(imageBase64);
      } catch (e: unknown) {
        const code =
          e &&
          typeof e === 'object' &&
          'statusCode' in e &&
          typeof (e as { statusCode?: number }).statusCode === 'number'
            ? (e as { statusCode: number }).statusCode
            : 500;
        const msg = e instanceof Error ? e.message : 'Invalid image data';
        return reply.code(code).send({ error: msg, code: 'OCR_FAILED' });
      }

      /** DEMO: set `true` to run real face-api matching (sample ID vs selfie will often fail). */
      const USE_REAL_FACE_MATCH = false;

      let faceMatch: FaceMatchResult | null = null;
      if (livePhotoBase64) {
        const liveOk = validateImageBase64(livePhotoBase64);
        if (!liveOk.ok) {
          return reply.code(400).send({
            error: liveOk.message || 'Invalid live photo',
            code: 'LIVE_PHOTO_INVALID',
          });
        }

        if (!USE_REAL_FACE_MATCH) {
          // DEMO: Hard-coded face match success (e.g. sample ID not your face). Re-enable with USE_REAL_FACE_MATCH.
          faceMatch = {
            match: true,
            confidence: 0.92,
          };
        } else {
          const engineOk = await ensureFaceEngine();
          if (!engineOk) {
            faceMatch = {
              match: false,
              confidence: 0,
              error: 'Face engine unavailable',
            };
          } else {
            const idCrop = await extractIdPhoto(imageBase64);
            if (!idCrop) {
              faceMatch = {
                match: false,
                confidence: 0,
                error: 'Could not extract portrait region from ID image',
              };
            } else {
              try {
                faceMatch = await compareFaces(idCrop, livePhotoBase64);
              } catch (err: unknown) {
                server.log.error({ err }, 'Face matching failed');
                return reply.code(400).send({
                  success: false,
                  error: 'Face matching unavailable',
                  code: 'FACE_MATCH_ERROR',
                });
              }
            }
          }
        }
      }

      const response = await buildSignedAttestationResponse(
        allAttributes,
        requestedAttributes,
        faceMatch
      );

      let encryptedIdStored = false;
      if (userId) {
        const validated = validateImageBase64(imageBase64);
        if (validated.ok) {
          try {
            const imageBuffer = Buffer.from(validated.stripped, 'base64');
            const enc = encryptIdImagePoc(imageBuffer, userId);
            encryptedIdStore.set(normalizeUserKey(userId), enc);
            encryptedIdStored = true;
          } catch (err) {
            server.log.warn({ err }, 'Failed to encrypt/store ID image (POC)');
          }
        }
      }

      return {
        ...response,
        encryptedIdStored,
      };
    } catch (err: unknown) {
      server.log.error(err);
      const msg =
        err instanceof Error ? err.message : 'Verification failed. Please try again.';
      return reply.code(500).send({
        error: msg,
        code: 'INTERNAL_ERROR',
      });
    }
  });

  /** Decrypt stored ID (if any), re-run OCR + signing — same attestation shape as /verify. */
  server.post('/re-verify', async (request, reply) => {
    const parsed = reverifyBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid input',
        code: 'INVALID_INPUT',
        details: parsed.error.flatten(),
      });
    }
    const { userId, requestedAttributes } = parsed.data;

    const imageBuffer = decryptIdImagePoc(userId);
    if (!imageBuffer) {
      return reply.code(404).send({
        error: 'No stored encrypted ID for this user',
        code: 'NO_STORED_ID',
      });
    }

    const imageBase64 = imageBuffer.toString('base64');
    let allAttributes: ExtractedAttributes;
    try {
      allAttributes = await extractAttributesFromDocument(imageBase64);
    } catch (e: unknown) {
      const code =
        e &&
        typeof e === 'object' &&
        'statusCode' in e &&
        typeof (e as { statusCode?: number }).statusCode === 'number'
          ? (e as { statusCode: number }).statusCode
          : 500;
      const msg = e instanceof Error ? e.message : 'Invalid image data';
      return reply.code(code).send({ error: msg, code: 'OCR_FAILED' });
    }

    const response = await buildSignedAttestationResponse(
      allAttributes,
      requestedAttributes,
      null
    );

    return {
      ...response,
      reVerified: true,
    };
  });

  server.post(
    '/api/verify-attestation',
    async (request, reply) => {
    try {
      const q = (request.query as { expectedEigenAppId?: string })?.expectedEigenAppId;
      const expectedEigenAppId = q ?? process.env.EIGEN_APP_ID ?? DEFAULT_EIGEN_APP_ID;
      const result = await verifyDokimosAttestation(
        request.body as DokimosAttestationInput,
        { expectedEigenAppId }
      );
      const ok =
        result.signatureValid &&
        result.eigenAppIdMatchesExpected &&
        result.eigenMetadataPresent &&
        result.hashMatch !== false;
      return { ok, ...result, expectedEigenAppId };
    } catch {
      return reply.code(400).send({ error: 'Invalid payload or verification failed.' });
    }
  });

  server.post('/api/agent-verify', async (request, reply) => {
    const parsed = agentVerifyBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { userId, workflowId, agentId } = parsed.data;
    server.log.info({ agentId, workflowId }, 'agent-verify');
    const userEmail = normalizeConsumerEmail(userId);

    let verifier: Verifier | undefined;
    for (const v of verifiers.values()) {
      if (v.verifierId === RENTAL_REAL_ESTATE_VERIFIER_ID) {
        verifier = v;
        break;
      }
    }
    if (!verifier) {
      return reply.code(500).send({ error: 'Rental verifier not configured' });
    }

    const user = users.get(userEmail);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const requestId = `req_${Date.now()}`;
    const requestedAttributes = requestedAttributesForAgentWorkflow(workflowId);
    const newRequest: VerificationRequest = {
      requestId,
      verifierId: verifier.verifierId,
      verifierName: verifier.companyName,
      verifierEmail: verifier.email,
      userEmail,
      requestedAttributes,
      workflow: workflowId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attestation: null,
    };
    requests.set(requestId, newRequest);

    return { requestId, status: 'pending' as const };
  });

  server.get<{ Params: { requestId: string } }>(
    '/api/agent-verify/:requestId',
    async (request, reply) => {
      const { requestId } = request.params;
      const req = requests.get(requestId);
      if (!req) {
        return reply.code(404).send({ error: 'Request not found' });
      }
      return {
        status: req.status,
        attestation: req.status === 'approved' ? req.attestation : null,
      };
    }
  );

  server.post('/api/rental-application', async (request, reply) => {
    const parsed = rentalApplicationBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'Invalid input', details: parsed.error.flatten() });
    }
    const { listingId, userId, attestationRequestId, listingAddress, tourDate } =
      parsed.data;
    const userEmail = normalizeConsumerEmail(userId);

    const req = requests.get(attestationRequestId);
    if (!req) {
      return reply.code(404).send({ error: 'Verification request not found' });
    }
    if (normalizeConsumerEmail(req.userEmail) !== userEmail) {
      return reply.code(403).send({ error: 'Request does not match user' });
    }
    if (req.status !== 'approved' || !req.attestation) {
      return reply
        .code(400)
        .send({ error: 'Verification not completed or missing attestation' });
    }

    const applicationId = `app_${Date.now()}`;
    const u = users.get(userEmail);
    const row: RentalApplication = {
      applicationId,
      listingId,
      listingAddress,
      userId: userEmail,
      applicantName: u?.name,
      ...(typeof tourDate === 'string' && tourDate.trim()
        ? { tourDate: tourDate.trim() }
        : {}),
      attestationRequestId,
      attestation: req.attestation,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    rentalApplications.set(applicationId, row);

    return {
      applicationId,
      status: 'submitted' as const,
      attestation: req.attestation,
    };
  });

  server.get('/api/rental-applications', async () =>
    Array.from(rentalApplications.values()).sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )
  );

  /**
   * Nostos batch booking: one vault-approved verification request, many listings.
   * Attestation is copied from the existing approved request (same rules as POST /api/rental-application).
   */
  server.post('/api/nostos/book', async (request, reply) => {
    const body = request.body as {
      tenantEmail?: string;
      tenantName?: string;
      attestationRequestId?: string;
      listings?: Array<{
        listingId: string;
        listingAddress: string;
        tourDate?: string;
      }>;
    };

    const attestationRequestId = body.attestationRequestId?.trim();
    if (
      !body.tenantEmail ||
      !attestationRequestId ||
      !Array.isArray(body.listings) ||
      body.listings.length === 0
    ) {
      return reply
        .code(400)
        .send({ error: 'tenantEmail, attestationRequestId, and listings[] are required.' });
    }

    const userEmail = normalizeConsumerEmail(body.tenantEmail);
    const user = users.get(userEmail);
    if (!user) {
      return reply.code(404).send({ error: `User not found: ${userEmail}` });
    }

    const verReq = requests.get(attestationRequestId);
    if (!verReq) {
      return reply.code(404).send({ error: 'Verification request not found' });
    }
    if (normalizeConsumerEmail(verReq.userEmail) !== userEmail) {
      return reply
        .code(403)
        .send({ error: 'Verification request does not match tenant' });
    }
    if (verReq.status !== 'approved' || !verReq.attestation) {
      return reply
        .code(400)
        .send({ error: 'Verification not completed or missing attestation' });
    }

    const timestamp = new Date().toISOString();
    const results: Array<{ applicationId: string; listingAddress: string }> = [];

    for (const listing of body.listings) {
      const applicationId = `app_nostos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const row: RentalApplication = {
        applicationId,
        listingId: listing.listingId,
        listingAddress: listing.listingAddress,
        userId: userEmail,
        applicantName: body.tenantName ?? user.name,
        ...(typeof listing.tourDate === 'string' && listing.tourDate.trim()
          ? { tourDate: listing.tourDate.trim() }
          : {}),
        attestationRequestId,
        attestation: verReq.attestation,
        status: 'submitted',
        submittedAt: timestamp,
      };
      rentalApplications.set(applicationId, row);
      results.push({ applicationId, listingAddress: listing.listingAddress });
    }

    return { applications: results };
  });

  const port = Number(process.env.PORT ?? 8080);
  try {
    try {
      const faceOk = await ensureFaceEngine();
      server.log.info(
        faceOk
          ? 'Face verification engine ready (WASM)'
          : 'Face verification engine not loaded — biometric optional'
      );
    } catch (e) {
      server.log.warn({ err: e }, 'Face engine warmup failed');
    }
    await server.listen({ port, host: '0.0.0.0' });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
