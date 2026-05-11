Skip to main content
EigenLayer Logo
EigenCloud
AgentKit
EigenCompute
EigenLayer
EigenDA

Search
ctrl
K
Get Started
EigenCompute Overview
Quickstart
Deploy Your Agent
Billing
Sample Apps
How To
Set up
Migrate to ecloud CLI
Create and use authentication keys
Build
Use app wallet
Use ecloud SDK
Use existing image
Attested API example
Persistent storage
Verifiable Builds
Build from verifiable source
Deploy
Configure TLS
Expose ports
Troubleshoot deployment
Operate
Operate application
Verify trust guarantees
Concepts
EigenCompute KMS
Use Cases
Trust Guarantees
Architecture
Keys
Security and Trust Model
Security Best Practices
Verifiable Builds
Privacy
Technical Comparison
Processes
Reference

Copy for LLM
How ToBuildUse ecloud SDK
Use ecloud SDK
Use the ecloud SDK to:

Deploy containerized applications to ecloud TEE
Manage application lifecycle (start, stop, terminate)
Build and push Docker images with encryption
Monitor application status and logs
Getting Started
Install ecloud SDK:
npm install @layr-labs/ecloud-sdk

Create a TypeScript file (for example, subscribe.ts) that initializes the SDK client and subscribes to EigenCompute:
import { createECloudClient } from '@layr-labs/ecloud-sdk';

async function main() {
  const client = createECloudClient({
    privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    environment: 'sepolia',
    verbose: true,
  });
  
  console.log('✓ Client created!');
  console.log('Your address:', client.billing.address);
  
  // Subscribe
  const result = await client.billing.subscribe({
    productId: 'compute',
    successUrl: 'https://example.com/success',  // Where to redirect after payment
    cancelUrl: 'https://example.com/cancel',    // Where to redirect if cancelled
  });
  
  if (result.type === 'checkout_created') {
    console.log('\n🔗 Complete your subscription here:');
    console.log(result.checkoutUrl);
    console.log('\nOpen this URL in your browser to add payment details.');
  } else if (result.type === 'already_active') {
    console.log('✓ Already subscribed! Status:', result.status);
  } else if (result.type === 'payment_issue') {
    console.log('⚠️  Payment issue. Visit:', result.portalUrl);
  }
}

main().catch(console.error);

Run the script with your private key to generate a checkout URL:
PRIVATE_KEY=0x... npx tsx subscribe.ts 

Previous
Use app wallet
Next
Use existing image
Getting Started
EigenCloud
About
Privacy Policy
Terms of Service
Disclaimers
Acceptable Use Policy
Community
Support
Forum
Telegram
X
More
GitHub
Youtube
Copyright © 2026 Eigen Labs, Inc.