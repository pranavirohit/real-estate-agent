/**
 * Minimal client for the Dedalus Cloud Services (DCS) Machines API.
 *
 * Raw HTTP (no SDK dependency) against https://dcs.dedaluslabs.ai so the types are
 * explicit and the package stays light. Covers the lifecycle we need for the
 * browser agent: create, get, wake, sleep, run an execution, and read its output.
 *
 * Auth: DEDALUS_API_KEY as a Bearer token. Mutating calls require an Idempotency-Key.
 */

import { randomUUID } from "node:crypto";

const DCS_BASE = (process.env.DEDALUS_DCS_BASE_URL?.trim() || "https://dcs.dedaluslabs.ai").replace(
  /\/+$/,
  ""
);

export type ExecutionStatus =
  | "wake_in_progress"
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

const TERMINAL_STATUSES: ReadonlySet<ExecutionStatus> = new Set([
  "succeeded",
  "failed",
  "cancelled",
  "expired",
]);

export interface LifecycleResponse {
  machine_id: string;
  vcpu: number;
  memory_mib: number;
  storage_gib: number;
  autosleep_seconds: number;
  desired_state: "running" | "sleeping" | "destroyed";
  status: { phase: string; reason?: string; last_error?: string };
}

export interface ExecutionResponse {
  execution_id: string;
  machine_id: string;
  status: ExecutionStatus;
  exit_code?: number;
  error_code?: string;
  error_message?: string;
}

export interface ExecutionOutputResponse {
  execution_id: string;
  stdout?: string;
  stderr?: string;
  stdout_truncated?: boolean;
  stderr_truncated?: boolean;
}

function apiKey(): string {
  const key = process.env.DEDALUS_API_KEY?.trim();
  if (!key) throw new Error("DEDALUS_API_KEY is not set");
  return key;
}

async function dcsFetch<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; mutating?: boolean; timeoutMs?: number }
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey()}`,
    Accept: "application/json",
  };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  // Every mutating route (create/wake/sleep/execution) requires an Idempotency-Key.
  if (init.mutating) headers["Idempotency-Key"] = randomUUID();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 30_000);
  try {
    const res = await fetch(`${DCS_BASE}${path}`, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`DCS ${init.method} ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  } finally {
    clearTimeout(timeout);
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface CreateMachineOptions {
  vcpu?: number;
  memoryMib?: number;
  storageGib?: number;
  /** e.g. "5m", "1h", "never". */
  autosleep?: string;
}

export async function createMachine(opts: CreateMachineOptions = {}): Promise<LifecycleResponse> {
  return dcsFetch<LifecycleResponse>("/v1/machines", {
    method: "POST",
    mutating: true,
    body: {
      vcpu: opts.vcpu ?? 2,
      memory_mib: opts.memoryMib ?? 4096,
      storage_gib: opts.storageGib ?? 20,
      autosleep: opts.autosleep ?? "5m",
    },
  });
}

export async function getMachine(machineId: string): Promise<LifecycleResponse> {
  return dcsFetch<LifecycleResponse>(`/v1/machines/${machineId}`, { method: "GET" });
}

export async function wakeMachine(machineId: string): Promise<LifecycleResponse> {
  return dcsFetch<LifecycleResponse>(`/v1/machines/${machineId}/wake`, {
    method: "POST",
    mutating: true,
  });
}

export async function sleepMachine(machineId: string): Promise<LifecycleResponse> {
  return dcsFetch<LifecycleResponse>(`/v1/machines/${machineId}/sleep`, {
    method: "POST",
    mutating: true,
  });
}

/** Poll the machine until its lifecycle phase is "running" (or time out). */
export async function waitForRunning(machineId: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const m = await getMachine(machineId);
    const phase = m.status.phase;
    if (phase === "running") return;
    if (phase === "failed" || phase === "destroyed") {
      throw new Error(`Machine ${machineId} entered phase "${phase}": ${m.status.last_error ?? ""}`);
    }
    await sleep(2_000);
  }
  throw new Error(`Timed out waiting for machine ${machineId} to reach "running"`);
}

export interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
  stdin?: string;
  timeoutMs?: number;
}

async function createExecution(
  machineId: string,
  command: string[],
  opts: RunOptions
): Promise<ExecutionResponse> {
  return dcsFetch<ExecutionResponse>(`/v1/machines/${machineId}/executions`, {
    method: "POST",
    mutating: true,
    timeoutMs: 30_000,
    body: {
      command,
      cwd: opts.cwd,
      env: opts.env,
      stdin: opts.stdin,
      timeout_ms: opts.timeoutMs,
    },
  });
}

async function getExecution(machineId: string, executionId: string): Promise<ExecutionResponse> {
  return dcsFetch<ExecutionResponse>(`/v1/machines/${machineId}/executions/${executionId}`, {
    method: "GET",
  });
}

async function getExecutionOutput(
  machineId: string,
  executionId: string
): Promise<ExecutionOutputResponse> {
  return dcsFetch<ExecutionOutputResponse>(
    `/v1/machines/${machineId}/executions/${executionId}/output`,
    { method: "GET" }
  );
}

export interface RunResult {
  status: ExecutionStatus;
  exitCode?: number;
  stdout: string;
  stderr: string;
}

/**
 * Run a command on the machine and wait for it to finish, returning stdout/stderr.
 * `timeoutMs` bounds the command itself; we poll a little longer for the result.
 */
export async function runAndWait(
  machineId: string,
  command: string[],
  opts: RunOptions = {}
): Promise<RunResult> {
  const cmdTimeout = opts.timeoutMs ?? 300_000;
  const exec = await createExecution(machineId, command, { ...opts, timeoutMs: cmdTimeout });

  const deadline = Date.now() + cmdTimeout + 30_000;
  let current = exec;
  while (!TERMINAL_STATUSES.has(current.status)) {
    if (Date.now() > deadline) {
      throw new Error(`Execution ${exec.execution_id} did not finish before timeout`);
    }
    await sleep(1_500);
    current = await getExecution(machineId, exec.execution_id);
  }

  const out = await getExecutionOutput(machineId, exec.execution_id);
  return {
    status: current.status,
    exitCode: current.exit_code,
    stdout: out.stdout ?? "",
    stderr: out.stderr ?? "",
  };
}
