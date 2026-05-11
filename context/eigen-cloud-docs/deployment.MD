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
How ToDeployTroubleshoot deployment
Troubleshoot deployment
Dockerfile requirements
# Must target linux/amd64
FROM --platform=linux/amd64 node:18

# Must run as root (TEE requirement)
USER root

# Application code
WORKDIR /app
COPY . .
RUN npm install

CMD ["npm", "start"]

Build fails: platform mismatch
Ensure your Dockerfile specifies the platform:

FROM --platform=linux/amd64 node:18

Push fails: authentication required
Login to Docker registry:

docker login

Transaction fails: insufficient funds
Get Sepolia ETH (for sepolia environment) or Mainnet ETH (for mainnet-alpha environment):

ecloud auth whoami  # Get your address
# Visit faucet and request funds

App fails to start
Check logs:

ecloud compute app logs <app-id>

Common issues:

Missing environment variables
Port binding issues
Application crashes
Incorrect entrypoint/command
Previous
Expose ports
Next
Operate application
Dockerfile requirements
Build fails: platform mismatch
Push fails: authentication required
Transaction fails: insufficient funds
App fails to start
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