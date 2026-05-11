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
How ToOperateVerify trust guarantees
Verify trust guarantees
Use the Verifiability Dashboards for mainnet and Sepolia testnet to verify trust guarantees enabled by EigenCompute.

View Verifiability Data in Dashboard
To view verifiability data for an application using the dashboard:

Go to the Verifiability Dashboard for mainnet or Sepolia testnet.
In the Deployed Applications field, search for the application by name or application ID.
The verifiability data for the application is displayed. The data includes:
Application ID and Creator address.
Release history with Docker Image Digests.
TEE attestations for releases. There is a TEE attestation displayed for each release.
Logs for running application (if configured as publicly visible).
Wallet addresses for the application.
note
Whether logs are visible publicly is configured by the application developer using the --log-visibility option on the ecloud compute app deploy and ecloud compute app upgrade commands.

View Verifiability Data Onchain
The dashboard provides a convenient way to view releases and application status. The release history and application status can also be verified onchain.

To monitor application releases onchain, monitor AppUpgraded events on the AppController contract. The AppUpgraded events include the application ID and the associated release data (imageDigest, registryURL, upgrade time, public and encrypted environment variables).

To monitor application status onchain, monitor the AppCreated, AppStarted, AppStopped, AppTerminated, and AppTerminatedByAdmin events on the AppController contract.

AppController contract deployment addresses are published in the eigenx-contracts repository for Mainnet and Sepolia testnet.

Previous
Operate application
Next
EigenCompute KMS
View Verifiability Data in Dashboard
View Verifiability Data Onchain
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