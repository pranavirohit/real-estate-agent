# Dokimos user journey diagrams

These diagrams synthesize the **consumer app**, **verifier/integration API**, and **Fastify TEE** behavior described in `demo-script-source-kit.md` and `demo-business-verifier-source-kit.md`.

Render with any Mermaid-compatible viewer (GitHub, VS Code Mermaid extension, [mermaid.live](https://mermaid.live)).

---

## 1. End-to-end journey (roles + major screens)

Shows how **Individual**, **Dokimos UI + Next BFF**, **TEE (Fastify)**, and **Business developer** interact. Solid lines = primary path; dashed = optional or demo-only UI.

```mermaid
flowchart TB
  subgraph marketing["Marketing"]
    L["/ — Landing\nThe last time you'll ever upload your ID"]
    L -->|For Individuals| OB["/onboarding"]
    L -->|For Businesses| BUS["/business\nVerifier Dashboard DEMO\n(offline data)"]
  end

  subgraph onboard["Onboarding — 3 steps"]
    OB --> S0["Step 0: Upload / capture govt ID\nlocalStorage: dokimos_stored_image"]
    S0 --> S1["Step 1: Liveness selfie\ndokimos_live_photo"]
    S1 --> S2["Step 2: Verifying in TEE…\nPOST /api/verify → Fastify POST /verify"]
    S2 --> VAULT["/app/vault\nYour vault · Identity verified"]
  end

  subgraph vault["Consumer app shell"]
    VAULT --> MOD1{{"Post: What just happened?"}}
    MOD1 --> MOD2{{"Explainer: How Dokimos protects"}}
    MOD2 --> REQ["Pending requests\nGET /api/requests/user/:email"]
    REQ -->|Review| REV["/app/requests/review\nApprove and Share / Deny"]
    REV -->|POST /api/approve-request| TEE2["Fastify: OCR + signed attestation"]
    REV --> REC["/app/requests/receipt\nVerified · Eigen badge"]
    REC --> VAULT
    VAULT --> ACT["/app/requests\nWhere you're verified"]
  end

  subgraph dev["Developer / verifier pipeline"]
    INT["/integration\nTest API Call"] -->|POST /api/request-verification| BFF["Next BFF"]
    API["Partner backend\n(curl / server)"] --> BFF
    BFF --> RV["Fastify POST /api/request-verification\nCreates pending request"]
    RV --> REQ
  end

  subgraph tee["Fastify TEE — repo root"]
    S2 -.-> OCR["OCR + face match + sign\nAttestation JSON"]
    TEE2 -.-> OCR
    OCR --> STORE["Optional: encrypt ID for userId\n→ re-verify later"]
  end

  BUS -.->|does not call API| X["Static BUSINESS_DEMO_REQUESTS"]
```

---

## 2. Consumer journey only (screens + decisions)

```mermaid
flowchart LR
  A["/"] --> B["/onboarding"]
  B --> C["ID upload valid?"]
  C -->|No| C
  C -->|Yes| D["Selfie / camera OK?"]
  D -->|Error| D
  D -->|Yes| E["POST /api/verify"]
  E -->|Fail| F["Error: retry / go back"]
  E -->|OK| G["/app/vault"]
  G --> H{{"First visit modals?"}}
  H --> I["Pending > 0?"]
  I -->|Yes| J["Review request"]
  I -->|No| K["Activity / settings"]
  J --> L["Approve + ID image"]
  L --> M["POST /api/approve-request"]
  M --> N["Receipt"]
  N --> G
```

---

## 3. Sequence: request → user approval → proof (technical)

```mermaid
sequenceDiagram
  participant Dev as Partner backend or /integration
  participant Next as Next.js BFF /api/*
  participant TEE as Fastify TEE
  participant User as Consumer browser

  Dev->>Next: POST /api/request-verification<br/>verifierId, userEmail, requestedAttributes, workflow
  Next->>TEE: POST /api/request-verification
  TEE-->>Dev: requestId, status pending

  Note over User,TEE: User must exist (e.g. janice.sample@example.com) and complete /verify path for attestations

  User->>Next: GET /api/requests/user/:email
  Next->>TEE: GET /api/requests/user/:email
  TEE-->>User: list including pending request

  User->>Next: POST /api/approve-request<br/>requestId, approved, imageBase64
  Next->>TEE: POST /api/approve-request
  TEE-->>User: request + attestation

  User->>Next: POST /api/re-verify (optional, signed in)
  Next->>TEE: POST /re-verify userId=email
  TEE-->>User: new attestation from stored ID
```

---

## 4. Legend

| Symbol / area | Meaning |
|---------------|---------|
| **Next BFF** | Same-origin `/api/*`; proxies to `TEE_ENDPOINT` (default `http://localhost:8080`). |
| **`/business`** | Visual verifier dashboard; uses **offline** `BUSINESS_DEMO_REQUESTS`, not live `GET /api/requests/verifier/...`. |
| **`/integration` Test API** | **Live** `POST /api/request-verification` against seeded `airbnb_prod` + `janice.sample@example.com`. |

---

## 5. Simplified swimlane (one diagram)

```mermaid
flowchart TB
  subgraph User["End user"]
    u1[Discover / Landing]
    u2[Upload ID + selfie]
    u3[Vault & pending requests]
    u4[Approve or deny share]
    u5[Receipt & history]
  end

  subgraph Partner["Business / developer"]
    p1[Integration or backend job]
    p2[POST request-verification]
  end

  subgraph Platform["Dokimos + TEE"]
    pl[Create pending request]
    pl2[Verify ID + sign]
    pl3[Approve path: OCR + attestation]
  end

  u1 --> u2 --> pl2
  p1 --> p2 --> pl
  pl --> u3
  u3 --> u4 --> pl3 --> u5
```
