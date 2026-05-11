Let me re-read the Demo Day guidance and your existing build before writing this out.Here is the full demo sequence, beat by beat. This is written assuming the real estate agent extension is built, but I'll flag which parts already exist vs. what's new.

---

## The Full Demo Sequence

### Setup (before you start talking)
Two browser windows open side by side, or ready to switch between:
- **Left/Tab 1:** The real estate agent chat interface — logged in as "Pranavi"
- **Right/Tab 2:** The landlord/broker verification dashboard — logged in as "Brooklyn Properties LLC"
- **Tab 3:** EigenCloud dashboard — already loaded at verify-sepolia.eigencloud.xyz
- **Tab 4:** Etherscan — ready to paste a signature

Use a second browser tab or your phone’s **browser** with the same Dokimos site open and logged in as the same user. There is no separate native app; pending requests appear after a short **poll** (about 10 seconds) or when you open the vault.

---

### Scene 1 — The Problem (30 seconds, no demo yet)

You speak directly to the audience, nothing on screen yet or just the landing page:

"Every time you apply for an apartment in New York, you send your passport, your bank statements, your tax returns — physical copies — to a broker you've never met. They store it somewhere. You have no idea where. And you do this every single time you apply somewhere new.

The same problem exists for any agent acting on your behalf. If an AI agent is going to apply for apartments for you, book doctors appointments, buy things that are age-gated — it needs to prove who you are. Right now there's no trustless way to do that. You just have to hope the service handles your data responsibly.

That's what I built Dokimos to solve."

---

### Scene 2 — User Onboarding (45 seconds, existing)

Switch to the Dokimos user app. You've already completed onboarding — don't redo it live, it's slow. Instead show the vault screen that already exists:

"I've already verified my identity once. My ID was processed inside Intel TDX hardware — it never left the secure enclave in its raw form. What came out was a cryptographic attestation of specific attributes: my name, that I'm over 18, that my document is valid."

Point to the vault:
- Full Name ✓
- Age Over 18 ✓
- Document Valid ✓
- Face Matched ✓

"This is my vault. I own these proofs. I control who sees them."

---

### Scene 3 — The Agent (60 seconds, new)

Switch to the real estate agent chat interface:

"Now I want to find an apartment. Instead of going to StreetEasy and filling out applications manually, I just tell my agent what I'm looking for."

Type into the chat: *"Find me a 2 bedroom in Brooklyn, under $3,000, pet friendly"*

Agent responds with 3 listings. Click on one — say 142 Wythe Ave, $2,800/mo.

"I like this one. Let me apply."

Type: *"Apply to 142 Wythe Ave"*

Agent responds: *"I need to verify your identity before submitting. Requesting credentials from Dokimos now..."*

A beat. Then: *"Verification request sent. Waiting for your approval."*

"The agent just called Dokimos directly. Not me — the agent. It requested a proof that I'm over 18, my full name, and my address. Let me approve that now."

---

### Scene 4 — The Approval (30 seconds, existing + new)

On your phone or second tab, open Dokimos and go to **Vault** or wait for the in-app request prompt (the product polls the server; there is no OS-level push notification in this demo).

You should see something like: **Brooklyn Properties LLC** is requesting: Full Name, Age Over 18, Address (wording may vary slightly).

Show the "what they won't see" section — they can't see your ID photo or other personal details.

Tap Approve.

Back to the agent chat — it updates: *"Identity verified. Application submitted to 142 Wythe Ave. Attestation receipt attached."*

"My documents never went to the landlord. What went to the landlord is a cryptographic proof, signed inside hardware that nobody — not me, not Dokimos, not EigenCloud — can tamper with."

---

### Scene 5 — The Landlord Side (45 seconds, existing + new)

Switch to the broker dashboard — Brooklyn Properties LLC:

"Here's what the landlord sees."

Show the verifications table — Pranavi Rohit, status: Verified, timestamp.

Click into the record. Show the attestation details: attributes, signature, TEE wallet address.

"The landlord received this attestation. But here's what makes this different from every other identity service — they don't have to trust Dokimos to check it. They can verify it themselves."

On **`/business`**, click **Verify** on the row (or click the row), which opens the five-step verification wizard. On **`/landlord`**, open an application, then click **Verify independently** to launch the same wizard.

---

### Scene 6 — The Trust Proof (60 seconds, existing — this is your money shot)

The 5-step verification flow opens. Walk through each step:

**Step 1 — Signature on Etherscan:**
"The attestation is signed. I paste the message and signature into Etherscan. It confirms the signature is valid — the data hasn't been tampered with."
Show the green checkmark.

**Step 2 — Intel TDX hardware:**
"This wallet didn't sign from a laptop or a server. It came from Intel TDX hardware running on EigenCloud."
Pull up the EigenCloud dashboard — show platform: Intel TDX.

**Step 3 — Wallet belongs to the TEE:**
"The wallet is mathematically derived from this specific deployment — it can't just be claimed by anyone."
Show the derived addresses section on the dashboard, wallet matches.

**Step 4 — Public source code:**
"Anyone can read the code running inside the TEE. They can see exactly how attributes are hashed before signing — personal data never touches the blockchain."
Show the GitHub link.

**Step 5 — Reproducible build:**
"Anyone can clone the repo, build the Docker container, and verify the hash matches what's deployed."
Show the container hash on the dashboard.

"Five independent checks. No phone call to Dokimos. No trusting a privacy policy. Just math."

---

### Close (20 seconds)

Back to the agent chat, attestation receipt visible:

"Janice's personal data never appeared on any public blockchain. The hash is public. Her data stays private. And the landlord verified everything independently.

That's what trustless identity for agents looks like. Verify once. Trusted everywhere."

---

## Total Runtime

| Scene | Time |
|-------|------|
| Problem setup | 0:30 |
| Vault | 0:45 |
| Agent + request | 1:00 |
| Approval on phone | 0:30 |
| Landlord view | 0:45 |
| 5-step verification | 1:00 |
| Close | 0:20 |
| **Total** | **~5:00** |

Fits comfortably in the 10-minute slot with 5 minutes for Q&A.

---

## What Still Needs to Be Built

The parts that don't exist yet:
- The agent chat interface (Scene 3)
- The `POST /api/agent-verify` endpoint (the agent calling Dokimos)
- The attestation receipt in the agent chat (Scene 4 callback)
- The landlord view showing the submitted application with attestation (Scene 5 entry point)

Everything from Scene 5 onward — the 5-step verification flow, the EigenCloud dashboard, Etherscan — already exists and works.

Want to start building Scene 3 now?