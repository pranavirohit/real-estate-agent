I'll search comprehensively through your past conversations to find all iterations of the Dokimos PRD and pull together the most complete version.

Let me also check the project files to see if there's a more recent version saved:

Now let me search for any additional iterations or updates:

Based on my comprehensive search through your past conversations and the project files, here's the most complete version of the Dokimos PRD I can assemble. This pulls from multiple iterations across several conversations:

---

# **Dokimos — Product Requirements Document**

## **Problem**

Proving who you are online is repetitive, slow, and requires blind trust in companies you've never audited.

Every time you open a bank account, sign up for a gig platform, get verified on a crypto exchange, or access an age-gated product, you upload the same documents again. Passport. Driver's license. The same information, a different company, a different upload flow, a different wait. And every single time, you're handing your most sensitive documents to a centralized service whose privacy policy is the only guarantee you get.

The friction is felt immediately: fishing for your ID, re-scanning a document, waiting days for manual review. The trust problem is felt later — or never, until something goes wrong.

## **Vision**

**"Verify once. Trusted everywhere."**

A personal identity verification vault where you upload your documents one time. They get processed inside a sealed hardware environment (Trusted Execution Environment). The result is a cryptographic attestation — a signed answer to a specific question about you — that you own and control. Any company or service that needs to verify something about you gets that attestation. They never see the underlying document. They don't have to trust your vault — they can verify the proof themselves.

Think of it like a FastPass. You do the line once. After that you show the wristband. Except the wristband is cryptographically signed and anyone can verify it without calling the issuer.

## **Product Name**

**Dokimos** (δόκιμος) — ancient Greek for "tested and proven," referring to the practice of testing coins with a touchstone to verify their authenticity.

## **Why This Is Different from Centralized Identity Services**

The obvious objection: this already exists. Stripe Identity, Jumio, Persona, Apple Wallet — they all store verified identity in some form. The difference is the trust model.

**With a centralized identity service**, relying parties are trusting the service's word. "Stripe verified this person" is only as good as Stripe's infrastructure, Stripe's incentives, and Stripe's continued existence. The relying party can't independently verify the claim — they just trust Stripe.

**With Dokimos**, the verification logic runs inside an Intel TDX TEE (Trusted Execution Environment) deployed via EigenCompute. The Docker image hash is recorded onchain. The attestation is signed by a wallet that only that specific, auditable code can access. A relying party who wants to verify deeply can look up the signer address on the EigenCloud Verifiability Dashboard, find the Docker image, read the source code, and confirm it does exactly what it claims. The trust is in hardware and code — both of which can be verified — not in a company's privacy policy.

This is the same shift EigenLayer makes in the broader staking ecosystem: replacing trust in an operator with cryptoeconomic guarantees. Here, it's applied to identity.

## **Core Users**

The product serves two sides:

**The vault holder** — an individual who wants to stop re-uploading their documents everywhere. They upload once, control what gets shared, and share attestation links instead of raw documents.

**The relying party** — a company or service that needs to verify something about a user. Today they use Stripe Identity, Jumio, or Persona. With Dokimos, they call an API endpoint and get back a signed attestation they can verify independently.

## **How EigenCompute Makes This Work**

The verification logic — the code that parses an ID photo and extracts attributes — runs inside an Intel TDX TEE deployed via EigenCompute. Three things follow from this:

**The document is never exposed.** Even the operator running the vault cannot see the ID image once it's inside the TEE. The image goes in, signed attributes come out, the raw image is discarded.

**The attestation is signed by a wallet only that code can access.** The EigenCompute KMS (Key Management Service) generates a deterministic mnemonic tied to the specific Docker image hash and app ID. The private key exists only inside the TEE. No one can use it outside that environment — not the operator, not Eigen Labs.

**The trust is auditable end-to-end.** The Docker image hash is recorded onchain at deployment. Any relying party can trace the signer address to a specific image, find that image's source code, and verify it does what it claims. The chain of trust is: signature → signer address → Verifiability Dashboard → Docker image hash → source code on GitHub.

**The full vision adds EigenVerify.** A fraudulent attestation — claiming someone is over 21 when they're not — should have an economic consequence, not just a technical one. EigenVerify adds a slashing condition: if a dispute is filed and the verification is re-executed deterministically with the same inputs and produces a different result, the operator's stake is slashed. This is the cryptoeconomic enforcement layer that makes the guarantee robust, not just technically sound. It's deferred for the sprint but the architecture points toward it.

## **Core User Flows**

### **Vault Setup (One Time)**

One. User goes to the Dokimos app and signs in (Google OAuth).

Two. User uploads a photo of their driver's license or passport.

Three. The image is sent to the EigenCompute container running in the TEE.

Four. The container parses the image using OCR, extracts attributes, checks document validity and expiry.

Five. The container signs an attestation object with its TEE wallet and returns it.

Six. The vault stores the attestation and displays the verified attributes to the user: name, age verification status, expiry, nationality.

Seven. The raw image is discarded — never stored anywhere.

### **Sharing an Attestation (Returning User)**

One. A relying party requests a specific verification — for example, "Is this user over 21?"

Two. The user receives a notification in their Dokimos app showing what the company is requesting.

Three. The user can see exactly what attributes are being requested (name, age over 21 status, etc.) and can approve or deny.

Four. If approved, the company's webhook receives the cryptographically signed attestation — they never see the raw document.

Five. The company can verify the attestation signature on Etherscan, trace the signer wallet to the EigenCloud Verifiability Dashboard, and confirm the exact code that ran.

## **Use Cases**

**Gig economy onboarding** — driver applications for Uber, Lyft, or DoorDash currently require uploading ID to a verification service and waiting. A pre-verified vault collapses this to a single approval tap.

**Financial account opening** — banks and fintech apps are legally required to verify identity under KYC/AML rules. Currently this means uploading an ID to a centralized service and waiting.

**Age-gated products** — alcohol delivery, cannabis, gambling, adult content. Currently handled by an honor-system birthdate entry or a centralized ID check. Neither is trustworthy. A signed attestation is.

In-person verification is explicitly out of scope. That already works. The problem is remote, online, at scale.

## **Why Companies Would Adopt This**

The pitch to a relying party:

"Instead of paying Persona $2-5 to verify every user, you call our API. If the user has already verified anywhere else on this network, it's instant and nearly free. If they haven't, we verify them once and they're in the network for every future check."

Concretely:

**Lower cost per verification** — especially for users who are already in the vault network.

**Higher conversion** — users who already have a vault don't have to re-upload anything. They just approve sharing. Frictionless.

**Same or better compliance standing** — the attestation is cryptographically signed and auditable. Arguably stronger than "Jumio said so."

**No document storage liability** — the company never receives the raw document. They get a signed yes/no. That reduces their data liability significantly.

**Companies building on EigenCloud are the natural first relying parties.** They're already integrated with the infrastructure, already care about verifiability, and their users are already crypto-adjacent. You're not asking them to adopt new infrastructure — you're giving them identity verification as a primitive that slots into what they're already building.

## **What Stakeholders Care About**

**For Gaj and Phil** — the demo should feel like a consumer product. A person uploads their ID once, gets a vault, shares attestation links. The user never thinks about cryptography. The value they feel is "I never have to fish for my ID again." That's the Uber Eats moment — you just order food, you don't think about the supply chain.

**For Soubhik** — the trust model needs to be sound. The consumer framing is the surface, but underneath it has to be cryptoeconomically rigorous. The attestation is signed by a TEE wallet tied to an auditable Docker image, and the roadmap adds EigenVerify slashing so fraudulent attestations have economic consequences. His whole research career is about making guarantees that are enforced, not just promised.

---

This is the most comprehensive version I could assemble from all your conversations. The PRD evolved significantly from the initial "identity aggregator" framing to the final "Dokimos" implementation with real EigenCompute deployment. Would you like me to add any specific sections or expand on particular areas?