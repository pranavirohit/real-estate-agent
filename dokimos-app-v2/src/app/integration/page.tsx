"use client";

import { useState } from "react";
import { Shield, Copy, Check, AlertTriangle, CheckCircle, Code, Smartphone, Lock, Play } from "lucide-react";
import axios from "axios";

export default function IntegrationPage() {
  const [activeTab, setActiveTab] = useState<"widget" | "api" | "trust">("widget");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-10 h-10 text-indigo-400" />
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>
              Dokimos
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Embed privacy-preserving identity verification in your application
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("widget")}
              className={`px-6 py-4 font-medium transition-colors relative ${
                activeTab === "widget"
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone size={18} />
                Embedded Widget
              </div>
              {activeTab === "widget" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`px-6 py-4 font-medium transition-colors relative ${
                activeTab === "api"
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Code size={18} />
                REST API
              </div>
              {activeTab === "api" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("trust")}
              className={`px-6 py-4 font-medium transition-colors relative ${
                activeTab === "trust"
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock size={18} />
                Why TEEs Matter
              </div>
              {activeTab === "trust" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === "widget" && <WidgetTab copyToClipboard={copyToClipboard} copiedCode={copiedCode} />}
        {activeTab === "api" && <APITab copyToClipboard={copyToClipboard} copiedCode={copiedCode} />}
        {activeTab === "trust" && <TrustTab />}
      </main>
    </div>
  );
}

function WidgetTab({ copyToClipboard, copiedCode }: { copyToClipboard: (code: string, id: string) => void; copiedCode: string | null }) {
  const widgetCode = `<!-- Add to your signup page -->
<script src="https://verify.dokimos.com/widget.js"></script>
<div id="dokimos-verify" 
     data-workflow="host_verification"
     data-api-key="your_api_key"
     data-callback="handleVerification">
</div>

<script>
  function handleVerification(result) {
    if (result.status === 'approved') {
      // User verified, proceed with onboarding
      activateAccount(result.userId, result.attestation);
    }
  }
</script>`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>
          Drop-in Widget Integration
        </h2>
        <p className="text-slate-300 text-lg">
          The fastest way to add identity verification to your app. Users never leave your site.
        </p>
      </div>

      {/* Code Block */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => copyToClipboard(widgetCode, "widget")}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            {copiedCode === "widget" ? (
              <>
                <Check size={16} className="text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="bg-slate-950 border border-slate-700 rounded-xl p-6 overflow-x-auto">
          <code className="text-sm text-slate-200 font-mono whitespace-pre">{widgetCode}</code>
        </pre>
      </div>

      {/* Visual Mockup */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">What users see</h3>
        <div className="bg-white rounded-xl border-4 border-slate-700 p-8 shadow-2xl">
          <div className="max-w-md mx-auto">
            <h4 className="text-2xl font-bold text-gray-900 mb-2">Become an Uber Driver</h4>
            <p className="text-gray-600 mb-6">Complete your profile to start earning</p>
            
            {/* Mock Dokimos Widget */}
            <div className="border-2 border-indigo-200 rounded-xl p-6 bg-indigo-50">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-indigo-600" />
                <div>
                  <h5 className="font-bold text-gray-900">Identity Verification</h5>
                  <p className="text-sm text-gray-600">Powered by Dokimos</p>
                </div>
              </div>
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Verify with Dokimos
              </button>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Your ID is processed in a secure enclave. Uber never sees your document.
              </p>
            </div>

            <button className="w-full mt-6 bg-gray-200 text-gray-400 py-3 rounded-lg font-medium cursor-not-allowed">
              Continue (Verify identity first)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function APITab({ copyToClipboard, copiedCode }: { copyToClipboard: (code: string, id: string) => void; copiedCode: string | null }) {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestAPICall = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate a workflow-based API call (as if Uber's backend called this)
      const response = await axios.post('/api/request-verification', {
        verifierId: 'airbnb_prod',
        userEmail: 'janice.sample@example.com',
        requestedAttributes: ['ageOver21', 'name', 'notExpired', 'documentType'],
        workflow: 'host_verification'
      });

      setTestResult(`✅ Workflow verification triggered!\n\nWorkflow: Host Verification\nRequest ID: ${response.data.requestId}\nUser: janice.sample@example.com\n\nThe user will see this request in their Dokimos app.\nCheck the Verifier Dashboard to monitor status.`);
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const requestCode = `// POST https://api.dokimos.com/verify
const response = await fetch('https://api.dokimos.com/verify', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.DOKIMOS_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'driver_12345',
    email: 'driver@example.com',
    workflow: 'host_verification',
    callbackUrl: 'https://yourapp.com/webhooks/dokimos'
  })
});

const verification = await response.json();
// Returns: { verificationId: "ver_abc123", status: "pending" }`;

  const responseCode = `{
  "attributes": {
    "ageOver21": true,
    "name": "John Doe",
    "documentType": "drivers_license",
    "notExpired": true
  },
  "attributesHash": "0x8f3b2c1a4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
  "timestamp": "2026-04-02T22:15:30.123Z",
  "message": "IdentityAttestation|0x8f3b2c1a4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2|2026-04-02T22:15:30.123Z",
  "messageHash": "0x8fb10cc1a5c3d8e2f9b4a7c6d5e8f1a2b3c4d5e6...",
  "signature": "0x429b783a4e41f0532fff356fb7a21a3fdac59726...",
  "signer": "0x2E5100a47aE27a71F389bce2588cB2473b94d2d9",
  "tee": {
    "platform": "Intel TDX",
    "quote": "AgMAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
    "mrenclave": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d...",
    "mrsigner": "0x8086000000000000000000000000000000...",
    "tcbStatus": "UpToDate",
    "reportData": "8fb10cc1a5c3d8e2f9b4a7c6d5e8f1a2b3c4d5e6..."
  },
  "eigen": {
    "verifier": "Eigen AVS",
    "appId": "0x00658e70d8880910277592b3b41f9dd3fe4ce5fd",
    "verificationUrl": "https://verify-sepolia.eigencloud.xyz/app/0x00658e70d8880910277592b3b41f9dd3fe4ce5fd",
    "verified": true,
    "verifiedAt": "2026-04-02T22:15:30.123Z"
  }
}`;

  const verifyCode = `// 1) EIP-191 signature (runs today — install: npm install viem)
// 2) Dokimos /verify-attestation — checks Eigen app id + metadata (demo quotes are mock)
// 3) Deploy / operate on EigenCompute: npm install @layr-labs/ecloud-sdk (see Eigen docs)
// 4) Full TDX + AVS checks: follow Eigen "Verify trust guarantees" for your environment
import { verifyMessage } from 'viem';

const DOKIMOS_VERIFY_URL = process.env.DOKIMOS_BASE_URL + '/api/verify-attestation';

app.post('/webhooks/dokimos', async (req, res) => {
  const attestation = req.body;

  const isValidSignature = await verifyMessage({
    address: attestation.signer,
    message: attestation.message,
    signature: attestation.signature,
  });

  const verifyRes = await fetch(DOKIMOS_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attestation),
  });
  const checks = await verifyRes.json();

  if (isValidSignature && checks.ok) {
    console.log('✅ Attestation signature and Eigen metadata OK');
    console.log('Attributes:', attestation.attributes);
    activateDriverAccount(attestation.attributes);
  } else {
    console.error('❌ Invalid attestation', { isValidSignature, checks });
  }

  res.json({ received: true });
});`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>
          Server-Side API Integration
        </h2>
        <p className="text-slate-300 text-lg">
          Trigger verifications from your backend and receive cryptographic attestations.
        </p>
      </div>

      {/* Test API Call Section */}
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Test API Integration</h3>
            <p className="text-sm text-slate-300">
              Simulate an API call to create a verification request for the demo user
            </p>
          </div>
          <button
            onClick={handleTestAPICall}
            disabled={testing}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Play size={16} />
            {testing ? "Testing..." : "Test API Call"}
          </button>
        </div>
        
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            testResult.startsWith('✅') 
              ? 'bg-green-900/30 border border-green-500/30' 
              : 'bg-red-900/30 border border-red-500/30'
          }`}>
            <pre className="text-sm text-white whitespace-pre-wrap font-mono">
              {testResult}
            </pre>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
          <p className="text-xs text-slate-300 mb-2">
            <strong className="text-slate-200">What this simulates:</strong>
          </p>
          <p className="text-xs text-slate-400">
            POST /api/request-verification with workflow "host_verification" for janice.sample@example.com (verifier airbnb_prod)
          </p>
          <p className="text-xs text-slate-400 mt-2">
            In production, this API call would be triggered automatically when a user signs up in your app (e.g., Uber driver signup flow).
          </p>
        </div>
      </div>

      {/* Step 1 */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-sm">1</span>
          Request Verification
        </h3>
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => copyToClipboard(requestCode, "request")}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              {copiedCode === "request" ? (
                <>
                  <Check size={16} className="text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-700 rounded-xl p-6 overflow-x-auto">
            <code className="text-sm text-slate-200 font-mono whitespace-pre">{requestCode}</code>
          </pre>
        </div>
      </div>

      {/* Step 2 */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-sm">2</span>
          Response Structure (with Eigen Attestation)
        </h3>
        
        {/* Callout */}
        <div className="bg-indigo-900/30 border border-indigo-700 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-indigo-200 text-sm">
              The <code className="bg-indigo-950/50 px-2 py-0.5 rounded font-mono">tee</code> and <code className="bg-indigo-950/50 px-2 py-0.5 rounded font-mono">eigen</code> objects prove this verification executed in an Intel TDX Trusted Execution Environment and was verified by Eigen AVS
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => copyToClipboard(responseCode, "response")}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              {copiedCode === "response" ? (
                <>
                  <Check size={16} className="text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-700 rounded-xl p-6 overflow-x-auto">
            <code className="text-sm text-slate-200 font-mono whitespace-pre">{responseCode}</code>
          </pre>
        </div>
      </div>

      {/* Step 3 */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-sm">3</span>
          Verify the Attestation
        </h3>
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => copyToClipboard(verifyCode, "verify")}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              {copiedCode === "verify" ? (
                <>
                  <Check size={16} className="text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="bg-slate-950 border border-slate-700 rounded-xl p-6 overflow-x-auto">
            <code className="text-sm text-slate-200 font-mono whitespace-pre">{verifyCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function TrustTab() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}>
          The Trust Model
        </h2>
        <p className="text-slate-300 text-lg">
          Why Trusted Execution Environments change everything for identity verification
        </p>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traditional */}
        <div className="bg-red-900/20 border-2 border-red-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h3 className="text-2xl font-bold text-white">Traditional Verification</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">Users upload sensitive documents to a third-party server</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">You must trust the service provider not to misuse data</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">No cryptographic proof the verification was done correctly</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">Vulnerable to insider threats and data breaches</p>
            </li>
          </ul>
        </div>

        {/* Dokimos + Eigen */}
        <div className="bg-green-900/20 border-2 border-green-700 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <h3 className="text-2xl font-bold text-white">Dokimos + EigenCompute</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">Documents processed in Intel TDX Trusted Execution Environment</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">Hardware-encrypted memory prevents access even by server operators</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">Cryptographic attestation proves the exact code that ran (MRENCLAVE)</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-200">Eigen AVS provides economic security via slashing</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Technical Diagram */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-white mb-6">How It Works</h3>
        <div className="flex flex-col items-center gap-6">
          {/* Step 1 */}
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">User uploads ID</h4>
                <p className="text-slate-400 text-sm">Document sent to Dokimos TEE</p>
              </div>
            </div>
          </div>

          <div className="text-slate-500 text-2xl">↓</div>

          {/* Step 2 */}
          <div className="w-full max-w-2xl bg-slate-900 border border-indigo-700 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">Processing in Intel TDX TEE</h4>
                <p className="text-slate-400 text-sm">OCR extraction + attribute verification in hardware-encrypted memory</p>
              </div>
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          <div className="text-slate-500 text-2xl">↓</div>

          {/* Step 3 */}
          <div className="w-full max-w-2xl bg-slate-900 border border-green-700 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-full text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">Eigen AVS Verification</h4>
                <p className="text-slate-400 text-sm">Remote attestation quote proves code integrity</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="text-slate-500 text-2xl">↓</div>

          {/* Step 4 */}
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full text-white font-bold">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">Your Application Receives Proof</h4>
                <p className="text-slate-400 text-sm">Cryptographically verifiable attestation with user attributes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insight */}
        <div className="mt-8 bg-indigo-900/30 border border-indigo-700 rounded-xl p-6">
          <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Key Insight
          </h4>
          <p className="text-slate-200">
            Without Eigen's TEE attestation infrastructure, there's no way to prove the verification actually happened in secure hardware. 
            The signature could come from any server. <span className="text-indigo-300 font-semibold">Eigen AVS is what makes the proof credible.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
