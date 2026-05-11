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
How ToBuildUse existing image
Use existing image
If you have a containerized application, you don't need to start from a template when creating an EigenCompute application:

cd my-existing-project

# Deploy directly - the CLI will prompt for Dockerfile and .env paths
ecloud compute app deploy

Requirements for existing projects:

Dockerfile - Must target linux/amd64 and run as root user
.env file - Optional but recommended for environment variables
The CLI will automatically prompt for file paths if they're not in default locations.

Manual Image Building
If you prefer to build and push images yourself:

# Build and push manually
docker build --platform linux/amd64 -t myregistry/myapp:v1.0 .
docker push myregistry/myapp:v1.0

# Deploy using the image reference
ecloud compute app deploy myregistry/myapp:v1.0

Previous
Use ecloud SDK
Next
Attested API example
Manual Image Building
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