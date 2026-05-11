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
How ToOperateOperate application
Operate application
Use the list, info, and logs commands to monitor and manage EigenCompute applications.

Use the start, stop, and terminate commands to change application state.

When starting a previously stopped application
Wallet persists - Same MNEMONIC is available
IP persists - Usually keeps the same instance IP
State reset - In-memory state is lost (use external storage for persistence)
Logs preserved - Previous logs may still be available
When stopping
No requests - App doesn't accept requests while stopped
Logs preserved - Can still view logs
Costs reduced - Lower costs while stopped (but not zero)
Before terminating
Irreversible Action
Termination is permanent and irreversible. The TEE wallet mnemonic becomes inaccessible. Any funds in the wallet will be lost forever.

 Critical: Withdraw all funds from TEE wallet
 Backup logs: ecloud compute app logs my-app > backup.log
 Document configuration
 Verify app is no longer needed
 Check for any dependent services
What gets deleted when terminating
When you terminate an app:

TEE instance
Docker container
Environment variables
App configuration
TEE wallet access (LOST FOREVER)
App name (can be reused)
Irreversible Action
Termination is permanent and irreversible. The TEE wallet mnemonic becomes inaccessible. Any funds in the wallet will be lost forever.

Behavior
Immediate - Takes effect after transaction confirmation
Permanent - Cannot be undone
Name available - App name can be reused for new deployments
ID retired - App ID is never reused
Safe Termination Workflow
# 1. Stop the app first
ecloud compute app stop my-app

# 2. Get wallet address
ecloud compute app info my-app
# Note the TEE Wallet address

# 3. Check for funds
# Use a blockchain explorer or Etherscan

# 4. Withdraw funds (from within your app code)
# Transfer to a safe address

# 5. Terminate
ecloud compute app terminate my-app

Previous
Troubleshoot deployment
Next
Verify trust guarantees
When starting a previously stopped application
When stopping
Before terminating
What gets deleted when terminating
Behavior
Safe Termination Workflow
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