/**
 * One-time provisioning for the browser agent's Dedalus Machine.
 *
 *   DEDALUS_API_KEY=... npm run provision
 *
 * Creates a machine, installs Node + Playwright + Chromium into /root/agent (so the
 * scraper's `import "playwright"` resolves), prints the machine id, and puts it to
 * sleep. Put the printed id in DEDALUS_MACHINE_ID and the agent will wake/use/sleep
 * it on demand. Re-running creates a NEW machine; you only need to do this once.
 */

import "dotenv/config";
import {
  createMachine,
  runAndWait,
  sleepMachine,
  waitForRunning,
} from "./dedalusMachine.js";

const AGENT_DIR = "/root/agent";

async function step(machineId: string, label: string, script: string, timeoutMs: number) {
  process.stdout.write(`\n▶ ${label}...\n`);
  const res = await runAndWait(machineId, ["/bin/bash", "-c", script], { timeoutMs });
  if (res.stdout.trim()) console.log(res.stdout.trim().slice(-1500));
  if (res.status !== "succeeded") {
    console.error(res.stderr.trim().slice(-2000));
    throw new Error(`Step "${label}" ${res.status} (exit ${res.exitCode ?? "?"})`);
  }
}

async function main() {
  if (!process.env.DEDALUS_API_KEY?.trim()) {
    console.error("DEDALUS_API_KEY is required.");
    process.exit(1);
  }

  // Sized to fit basic plan limits (storage cap 10 GiB). Override via env if your
  // plan allows more: MACHINE_VCPU / MACHINE_MEMORY_MIB / MACHINE_STORAGE_GIB.
  const vcpu = Number(process.env.MACHINE_VCPU) || 1;
  const memoryMib = Number(process.env.MACHINE_MEMORY_MIB) || 2048;
  const storageGib = Number(process.env.MACHINE_STORAGE_GIB) || 10;
  console.log(
    `Creating Dedalus Machine (${vcpu} vCPU / ${memoryMib}MiB / ${storageGib}GiB, autosleep 5m)...`
  );
  const machine = await createMachine({ vcpu, memoryMib, storageGib, autosleep: "5m" });
  const machineId = machine.machine_id;
  console.log(`Created ${machineId}. Waiting for it to run...`);
  await waitForRunning(machineId, 180_000);

  // Ensure a recent Node (NodeSource 20) — base image Node may be old or absent.
  await step(
    machineId,
    "Install Node.js 20",
    "set -e; if ! command -v node >/dev/null 2>&1 || [ \"$(node -p 'process.versions.node.split(\".\")[0]')\" -lt 18 ]; then " +
      "apt-get update && apt-get install -y curl ca-certificates && " +
      "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs; fi; node -v && npm -v",
    600_000
  );

  await step(
    machineId,
    "Init agent project + install Playwright",
    `set -e; mkdir -p ${AGENT_DIR} && cd ${AGENT_DIR} && ` +
      `[ -f package.json ] || npm init -y >/dev/null 2>&1; ` +
      `npm pkg set type=module >/dev/null 2>&1; ` +
      `npm install playwright@latest`,
    600_000
  );

  await step(
    machineId,
    "Install Chromium + system deps",
    `cd ${AGENT_DIR} && npx playwright install --with-deps chromium`,
    900_000
  );

  await step(
    machineId,
    "Smoke test Chromium",
    `cd ${AGENT_DIR} && node -e "import('playwright').then(async({chromium})=>{const b=await chromium.launch({headless:true,args:['--no-sandbox']});const p=await b.newPage();await p.goto('https://example.com');console.log('TITLE:',await p.title());await b.close();}).catch(e=>{console.error(e);process.exit(1);})"`,
    120_000
  );

  await sleepMachine(machineId).catch(() => {});

  console.log("\n=========================================================");
  console.log("Provisioning complete. Add this to your environment:\n");
  console.log(`  DEDALUS_MACHINE_ID=${machineId}`);
  console.log("  RENTALS_BROWSER_AGENT=1");
  console.log("\nThe machine is now asleep (idle cost ~0). The agent will wake it on demand.");
  console.log("=========================================================");
}

main().catch((e) => {
  console.error("\nProvisioning failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
